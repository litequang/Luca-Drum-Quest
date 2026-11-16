import Fastify from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import helmet from "@fastify/helmet";
import { readFile, mkdir, writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import argon2 from "argon2";
import { z } from "zod";
import { pool, transaction, audit, decode } from "./db.js";
import { config } from "./config.js";
import { auth, parent, fail, secret, digest, session } from "./auth.js";
import {
  schemas,
  seasonSchema,
  projectSchema,
  totals,
  type Kind,
} from "./model.js";
const uuid = z.uuid();
const canView = (user: any, post: any) =>
  user?.role === "PARENT_ADMIN" ||
  (post.published &&
    (post.visibility === "PUBLIC" ||
      (user?.role === "FAMILY_VIEWER" && post.visibility === "FAMILY")));
export async function buildApp() {
  const app = Fastify({ logger: false, bodyLimit: 200_000, trustProxy: false });
  await app.register(cookie);
  await app.register(rateLimit, { max: 200, timeWindow: "1 minute" });
  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
  });
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        upgradeInsecureRequests: config.secure ? [] : null,
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    strictTransportSecurity: config.secure ? undefined : false,
  });
  await auth(app);
  app.setErrorHandler((e: any, _req, reply) => {
    const validation = e instanceof z.ZodError;
    const status = validation
      ? 400
      : e.statusCode >= 400 && e.statusCode < 500
        ? e.statusCode
        : 500;
    reply.status(status).send({
      error:
        status === 500
          ? "Internal server error"
          : validation
            ? "Invalid request data"
            : e.message,
    });
  });
  // No root static mount: source, environment, DB backups, and media directories cannot be downloaded.
  const assets: Record<string, [string, string]> = {
    "/": ["index.html", "text/html"],
    "/index.html": ["index.html", "text/html"],
    "/styles.css": ["styles.css", "text/css"],
    "/app.js": ["app.js", "text/javascript"],
    "/apiClient.js": ["apiClient.js", "text/javascript"],
    "/data.js": ["data.js", "text/javascript"],
    "/admin/login": ["admin/login.html", "text/html"],
    "/admin/admin.css": ["admin/admin.css", "text/css"],
    "/admin/login.js": ["admin/login.js", "text/javascript"],
    "/admin/admin.js": ["admin/admin.js", "text/javascript"],
  };
  for (const [url, [file, type]] of Object.entries(assets))
    app.get(url, async (_req, reply) =>
      reply.type(type).send(await readFile(resolve(file))),
    );
  app.get("/admin", async (req, reply) => {
    if (!req.user) return reply.redirect("/admin/login");
    await parent(req);
    return reply.type("text/html").send(await readFile("admin/index.html"));
  });
  app.get("/family", async (req, reply) => {
    if (!req.user) return reply.redirect("/admin/login");
    return reply.type("text/html").send(await readFile("admin/family.html"));
  });
  app.get("/api/v1/public/project", async () => {
    const p = (await pool.query("SELECT * FROM project WHERE id=1"))[0];
    if (!p) fail(503, "Run database seed first");
    const s = (
      await pool.query("SELECT * FROM seasons WHERE id=?", [
        p.current_season_id,
      ])
    )[0];
    const data = s ? JSON.parse(s.data) : null;
    return {
      description: p.description,
      intro: p.intro,
      // Explicit allowlist: the current learning stage and sharing controls stay private.
      season: s
        ? {
            id: s.id,
            ordinal: s.ordinal,
            title: data.title,
            durationMonths: data.durationMonths,
            objective: data.objective,
            status: data.status,
            fundingGoal: data.fundingGoal,
            plannedLessons: data.plannedLessons,
            lessonLow: data.lessonLow,
            lessonHigh: data.lessonHigh,
            equipmentBudget: data.equipmentBudget,
            contingency: data.contingency,
          }
        : null,
    };
  });
  app.get("/api/v1/public/catalogue", async () => {
    const rows = await pool.query(
      "SELECT r.* FROM records r JOIN project p ON p.current_season_id=r.season_id WHERE r.kind IN ('stages','skills')",
    );
    return {
      stages: rows
        .filter((r: any) => r.kind === "stages")
        .map(decode)
        .sort((a: any, b: any) => a.order - b.order),
      skills: rows
        .filter((r: any) => r.kind === "skills")
        .map(decode)
        .map(({ status, teacherFeedback, teacherApproved, ...s }: any) => s),
    };
  });
  app.get("/api/v1/public/budget", async () => {
    const s = (
      await pool.query(
        "SELECT s.* FROM seasons s JOIN project p ON p.current_season_id=s.id",
      )
    )[0];
    if (!s) return null;
    const season = { id: s.id, ordinal: s.ordinal, ...JSON.parse(s.data) };
    if (!season.shareFinance) return { available: false };
    const rows = (
      await pool.query(
        "SELECT * FROM records WHERE season_id=? AND kind IN ('contributions','expenses')",
        [s.id],
      )
    ).map((r: any) => ({ entity: r.kind, ...decode(r) }));
    return {
      available: true,
      ...totals(
        season,
        rows.filter((r: any) => r.kind === "gift" || r.kind === "in_kind"),
        rows.filter((r: any) => r.entity === "expenses"),
      ),
    };
  });
  const journal = async (user: any) =>
    (await pool.query("SELECT * FROM records WHERE kind='journal'"))
      .map(decode)
      .filter((p: any) => canView(user, p))
      .sort((a: any, b: any) => b.date.localeCompare(a.date));
  app.get("/api/v1/public/journal", () => journal(null));
  app.get("/api/v1/family/journal", async (req) => {
    if (!req.user) fail(401, "Sign in required");
    return journal(req.user);
  });
  app.get("/api/v1/admin/audit/:id", { preHandler: parent }, async (req) => {
    const id = z.coerce
      .number()
      .int()
      .positive()
      .parse((req.params as any).id);
    const row = (
      await pool.query("SELECT * FROM audit_log WHERE id=?", [id])
    )[0];
    if (!row) fail(404, "Audit entry not found");
    return row;
  });
  app.get("/api/v1/admin/state", { preHandler: parent }, async () => {
    const p = (await pool.query("SELECT * FROM project WHERE id=1"))[0];
    const seasons = (
      await pool.query("SELECT * FROM seasons ORDER BY ordinal")
    ).map((r: any) => ({
      id: r.id,
      ordinal: r.ordinal,
      ...JSON.parse(r.data),
    }));
    const records = (await pool.query("SELECT * FROM records")).map(
      (r: any) => ({ entity: r.kind, ...decode(r) }),
    );
    return {
      project: {
        description: p.description,
        intro: p.intro,
        currentSeasonId: p.current_season_id,
      },
      seasons,
      records,
      totals: seasons.map((s: any) => ({
        seasonId: s.id,
        ...totals(
          s,
          records.filter(
            (r: any) =>
              r.seasonId === s.id && ["gift", "in_kind"].includes(r.kind),
          ),
          records.filter(
            (r: any) => r.seasonId === s.id && r.entity === "expenses",
          ),
        ),
      })),
      media: await pool.query("SELECT id,journal_id,mime,size FROM media"),
      users: await pool.query("SELECT id,email,role,active FROM users"),
      invitations: await pool.query(
        "SELECT id,label,expires_at,revoked,used_by FROM invitations",
      ),
      audit: await pool.query(
        "SELECT id,actor_id,action,target_id,created_at FROM audit_log ORDER BY id DESC LIMIT 100",
      ),
      skillHistory: await pool.query(
        "SELECT * FROM skill_history ORDER BY id DESC LIMIT 100",
      ),
    };
  });
  app.put("/api/v1/admin/project", { preHandler: parent }, async (req) => {
    const data = projectSchema.parse(req.body);
    await transaction(async (c) => {
      const before = (
        await c.query("SELECT * FROM project WHERE id=1 FOR UPDATE")
      )[0];
      if (
        data.currentSeasonId &&
        !(
          await c.query("SELECT id FROM seasons WHERE id=?", [
            data.currentSeasonId,
          ])
        ).length
      )
        fail(400, "Unknown season");
      await c.query(
        "UPDATE project SET description=?,intro=?,current_season_id=? WHERE id=1",
        [data.description, data.intro, data.currentSeasonId],
      );
      await audit(c, req.user!.id, "project.update", "1", before, data);
    });
    return { ok: true };
  });
  for (const method of ["POST", "PUT"] as const)
    app.route({
      method,
      url:
        method === "POST"
          ? "/api/v1/admin/seasons"
          : "/api/v1/admin/seasons/:id",
      preHandler: parent,
      handler: async (req) => {
        const data = seasonSchema.parse(req.body),
          id =
            method === "POST"
              ? randomUUID()
              : uuid.parse((req.params as any).id);
        await transaction(async (c) => {
          const before = (
            await c.query("SELECT * FROM seasons WHERE id=? FOR UPDATE", [id])
          )[0];
          if (method === "PUT" && !before) fail(404, "Season not found");
          if (before && before.ordinal !== data.ordinal)
            fail(400, "Season ordinal cannot change");
          if (
            data.currentStageId &&
            !(
              await c.query(
                "SELECT id FROM records WHERE id=? AND kind='stages' AND season_id=?",
                [data.currentStageId, id],
              )
            ).length
          )
            fail(400, "Current stage must belong to this season");
          const { ordinal, ...rest } = data;
          await c.query(
            method === "POST"
              ? "INSERT INTO seasons (ordinal,data,id) VALUES (?,?,?)"
              : "UPDATE seasons SET ordinal=?,data=? WHERE id=?",
            [ordinal, JSON.stringify(rest), id],
          );
          await audit(
            c,
            req.user!.id,
            "season.save",
            id,
            before ? decode(before) : null,
            data,
          );
        });
        return { id };
      },
    });
  async function references(c: any, kind: Kind, data: any, id: string) {
    if (
      !(await c.query("SELECT id FROM seasons WHERE id=?", [data.seasonId]))
        .length
    )
      fail(400, "Unknown season");
    const refs: [string, string][] = [];
    for (const value of data.prerequisites ?? []) refs.push([value, "skills"]);
    for (const value of [
      ...(data.skillsTaught ?? []),
      ...(data.skillsCorrect ?? []),
      ...(data.skillIds ?? []),
    ])
      refs.push([value, "skills"]);
    if (data.stageId) refs.push([data.stageId, "stages"]);
    if (data.lessonId) refs.push([data.lessonId, "lessons"]);
    for (const [ref, type] of refs)
      if (
        ref === id ||
        !(
          await c.query(
            "SELECT id FROM records WHERE id=? AND kind=? AND season_id=?",
            [ref, type, data.seasonId],
          )
        ).length
      )
        fail(400, "Invalid reference or cross-season reference");
    if (kind === "stages") {
      const stages = (
        await c.query(
          "SELECT * FROM records WHERE kind='stages' AND season_id=?",
          [data.seasonId],
        )
      ).map(decode);
      if (stages.some((r: any) => r.id !== id && r.order === data.order))
        fail(400, "Stage order already exists");
      const before = stages.find((r: any) => r.id === id);
      if (before && before.order !== data.order) {
        const linked = (
          await c.query(
            "SELECT * FROM records WHERE kind='skills' AND season_id=?",
            [data.seasonId],
          )
        ).map(decode);
        if (linked.some((r: any) => r.stage === before.order))
          fail(400, "Update linked skills before changing stage order");
      }
    }
    if (kind === "skills") {
      const stages = (
        await c.query(
          "SELECT * FROM records WHERE kind='stages' AND season_id=?",
          [data.seasonId],
        )
      ).map(decode);
      if (!stages.some((s: any) => s.order === data.stage))
        fail(400, "Choose a stage that exists in this season");
      const all = (
        await c.query(
          "SELECT * FROM records WHERE kind='skills' AND season_id=?",
          [data.seasonId],
        )
      ).map(decode);
      if (all.some((r: any) => r.id !== id && r.code === data.code))
        fail(400, "Skill code already exists");
      const graph = new Map<string, string[]>(
        all.map((r: any) => [r.id, r.prerequisites]),
      );
      graph.set(id, data.prerequisites);
      const visit = (key: string, seen: Set<string>): boolean =>
        key === id ||
        (!seen.has(key) &&
          (seen.add(key), (graph.get(key) ?? []).some((v) => visit(v, seen))));
      if (data.prerequisites.some((v: string) => visit(v, new Set())))
        fail(400, "Circular prerequisite");
    }
  }
  app.route({
    method: ["POST", "PUT"],
    url: "/api/v1/admin/records/:kind/:id?",
    preHandler: parent,
    handler: async (req) => {
      const params = req.params as any,
        kind = z
          .enum(Object.keys(schemas) as [Kind, ...Kind[]])
          .parse(params.kind),
        data = schemas[kind].parse(req.body);
      const id = req.method === "POST" ? randomUUID() : uuid.parse(params.id);
      await transaction(async (c) => {
        // Serialize content changes with media changes and reference checks.
        await c.query("SELECT id FROM project WHERE id=1 FOR UPDATE");
        const row = (
          await c.query(
            "SELECT * FROM records WHERE id=? AND kind=? FOR UPDATE",
            [id, kind],
          )
        )[0];
        if (req.method === "PUT" && !row) fail(404, "Record not found");
        if (row && row.season_id !== data.seasonId)
          fail(400, "Move between seasons is not allowed");
        await references(c, kind, data, id);
        const { seasonId, ...rest } = data;
        const before = row ? decode(row) : null;
        if (req.method === "POST")
          await c.query("INSERT INTO records VALUES (?,?,?,?)", [
            id,
            kind,
            seasonId,
            JSON.stringify(rest),
          ]);
        else
          await c.query("UPDATE records SET data=? WHERE id=?", [
            JSON.stringify(rest),
            id,
          ]);
        if (
          kind === "skills" &&
          (before?.status !== (data as any).status ||
            before?.teacherFeedback !== (data as any).teacherFeedback)
        )
          await c.query(
            "INSERT INTO skill_history (skill_id,actor_id,old_status,new_status,feedback) VALUES (?,?,?,?,?)",
            [
              id,
              req.user!.id,
              before?.status ?? null,
              (data as any).status,
              (data as any).teacherFeedback,
            ],
          );
        await audit(c, req.user!.id, kind + ".save", id, before, data);
      });
      return { id };
    },
  });
  app.delete(
    "/api/v1/admin/journal/:id",
    {
      preHandler: parent,
      config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    },
    async (req) => {
      const id = uuid.parse((req.params as any).id);
      let files: any[] = [];
      await transaction(async (c) => {
        await c.query("SELECT id FROM project WHERE id=1 FOR UPDATE");
        const row = (
          await c.query(
            "SELECT * FROM records WHERE id=? AND kind='journal' FOR UPDATE",
            [id],
          )
        )[0];
        if (!row) fail(404, "Post not found");
        files = await c.query(
          "SELECT storage_key FROM media WHERE journal_id=?",
          [id],
        );
        await c.query("DELETE FROM records WHERE id=?", [id]);
        await audit(c, req.user!.id, "journal.delete", id, decode(row), null);
      });
      for (const f of files)
        await unlink(resolve(config.mediaDir, f.storage_key)).catch(() => {});
      return { ok: true };
    },
  );
  app.post("/api/v1/admin/invitations", { preHandler: parent }, async (req) => {
    const { label } = z
        .object({ label: z.string().min(1).max(100) })
        .strict()
        .parse(req.body),
      token = secret(),
      id = randomUUID();
    await transaction(async (c) => {
      await c.query(
        "INSERT INTO invitations (id,token_hash,label,expires_at) VALUES (?,?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 7 DAY))",
        [id, digest(token), label],
      );
      await audit(c, req.user!.id, "invitation.create", id, null, { label });
    });
    return { id, token };
  });
  app.post(
    "/api/v1/auth/accept-invitation",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const data = z
        .object({
          token: z.string().regex(/^[a-f0-9]{64}$/),
          email: z.email().max(254),
          password: z.string().min(14).max(128),
        })
        .strict()
        .parse(req.body);
      const hash = await argon2.hash(data.password, {
          type: argon2.argon2id,
          memoryCost: 65536,
          timeCost: 3,
        }),
        id = randomUUID();
      await transaction(async (c) => {
        const invite = (
          await c.query(
            "SELECT * FROM invitations WHERE token_hash=? AND revoked=FALSE AND used_by IS NULL AND expires_at>UTC_TIMESTAMP() FOR UPDATE",
            [digest(data.token)],
          )
        )[0];
        if (!invite) fail(400, "Invitation unavailable");
        if (
          (
            await c.query("SELECT id FROM users WHERE email=?", [
              data.email.toLowerCase(),
            ])
          ).length
        )
          fail(400, "Invitation unavailable or account already exists");
        await c.query(
          "INSERT INTO users (id,email,password_hash,role) VALUES (?,?,?,?)",
          [id, data.email.toLowerCase(), hash, "FAMILY_VIEWER"],
        );
        await c.query("UPDATE invitations SET used_by=? WHERE id=?", [
          id,
          invite.id,
        ]);
        await audit(c, id, "invitation.accept", invite.id, null, {
          role: "FAMILY_VIEWER",
        });
      });
      return { csrf: await session(reply, id), role: "FAMILY_VIEWER" };
    },
  );
  app.delete(
    "/api/v1/admin/invitations/:id",
    { preHandler: parent },
    async (req) => {
      const id = uuid.parse((req.params as any).id);
      await transaction(async (c) => {
        const r = (
          await c.query("SELECT * FROM invitations WHERE id=? FOR UPDATE", [id])
        )[0];
        if (!r) fail(404, "Invitation not found");
        await c.query("UPDATE invitations SET revoked=TRUE WHERE id=?", [id]);
        if (r.used_by) {
          await c.query("UPDATE users SET active=FALSE WHERE id=?", [
            r.used_by,
          ]);
          await c.query("DELETE FROM sessions WHERE user_id=?", [r.used_by]);
        }
        await audit(c, req.user!.id, "invitation.revoke", id, null, null);
      });
      return { ok: true };
    },
  );
  app.put(
    "/api/v1/admin/users/:id/access",
    { preHandler: parent },
    async (req) => {
      const id = uuid.parse((req.params as any).id);
      await transaction(async (c) => {
        const row = (
          await c.query("SELECT * FROM users WHERE id=? FOR UPDATE", [id])
        )[0];
        if (!row || row.role !== "FAMILY_VIEWER")
          fail(400, "Only family access can be granted");
        await c.query("UPDATE users SET active=TRUE WHERE id=?", [id]);
        await c.query("DELETE FROM sessions WHERE user_id=?", [id]);
        await audit(
          c,
          req.user!.id,
          "family.grant",
          id,
          { active: !!row.active },
          { active: true },
        );
      });
      return { ok: true };
    },
  );
  app.delete("/api/v1/admin/users/:id", { preHandler: parent }, async (req) => {
    const id = uuid.parse((req.params as any).id);
    await transaction(async (c) => {
      const r = (
        await c.query("SELECT * FROM users WHERE id=? FOR UPDATE", [id])
      )[0];
      if (!r || r.role !== "FAMILY_VIEWER")
        fail(400, "Only family access can be revoked");
      await c.query("UPDATE users SET active=FALSE WHERE id=?", [id]);
      await c.query("DELETE FROM sessions WHERE user_id=?", [id]);
      await audit(c, req.user!.id, "family.revoke", id, null, null);
    });
    return { ok: true };
  });
  app.get("/api/v1/journal/:id/media", async (req) => {
    const id = uuid.parse((req.params as any).id),
      r = (
        await pool.query(
          "SELECT * FROM records WHERE id=? AND kind='journal'",
          [id],
        )
      )[0];
    if (!r || !canView(req.user, decode(r))) fail(404, "Post not found");
    return pool.query("SELECT id,mime,size FROM media WHERE journal_id=?", [
      id,
    ]);
  });
  app.post(
    "/api/v1/admin/journal/:id/media",
    {
      preHandler: parent,
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    },
    async (req) => {
      const journalId = uuid.parse((req.params as any).id);
      const file = await req.file();
      if (!file) fail(400, "One image required");
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
        fail(
          415,
          "Local pilot accepts JPEG, PNG and WebP images only; video processing is pending",
        );
      const buffer = await file.toBuffer();
      let output: Buffer;
      try {
        const input = sharp(buffer, {
          limitInputPixels: 20_000_000,
          animated: false,
        });
        const metadata = await input.metadata();
        if (!["jpeg", "png", "webp"].includes(metadata.format ?? ""))
          fail(415, "Unsupported image");
        output = await input
          .rotate()
          .resize({
            width: 2400,
            height: 2400,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp()
          .toBuffer();
      } catch {
        fail(415, "Invalid image");
      }
      const id = randomUUID(),
        key = secret().slice(0, 40);
      await mkdir(config.mediaDir, { recursive: true, mode: 0o700 });
      try {
        await transaction(async (c) => {
          await c.query("SELECT id FROM project WHERE id=1 FOR UPDATE");
          if (
            !(
              await c.query(
                "SELECT id FROM records WHERE id=? AND kind='journal'",
                [journalId],
              )
            ).length
          )
            fail(404, "Post not found");
          const quota = (
            await c.query(
              "SELECT COALESCE(SUM(size),0) total,COUNT(*) count FROM media",
            )
          )[0];
          const count = (
            await c.query("SELECT COUNT(*) n FROM media WHERE journal_id=?", [
              journalId,
            ])
          )[0].n;
          if (
            quota.total + output.length > 200 * 1024 * 1024 ||
            quota.count >= 200 ||
            count >= 10
          )
            fail(413, "Local storage quota reached");
          await writeFile(resolve(config.mediaDir, key), output, {
            flag: "wx",
            mode: 0o600,
          });
          await c.query("INSERT INTO media VALUES (?,?,?,?,?)", [
            id,
            journalId,
            key,
            "image/webp",
            output.length,
          ]);
          await audit(c, req.user!.id, "media.upload", id, null, {
            journalId,
            size: output.length,
          });
        });
      } catch (e) {
        await unlink(resolve(config.mediaDir, key)).catch(() => {});
        throw e;
      }
      return { id };
    },
  );
  app.get("/api/v1/media/:id", async (req, reply) => {
    const id = uuid.parse((req.params as any).id),
      r = (
        await pool.query(
          "SELECT m.*,r.data FROM media m JOIN records r ON r.id=m.journal_id WHERE m.id=?",
          [id],
        )
      )[0];
    if (!r || !canView(req.user, JSON.parse(r.data)))
      fail(404, "Media not found");
    reply
      .header("Cache-Control", "no-store")
      .header("Content-Disposition", "inline")
      .type(r.mime);
    return reply.send(await readFile(resolve(config.mediaDir, r.storage_key)));
  });
  app.delete(
    "/api/v1/admin/media/:id",
    {
      preHandler: parent,
      config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    },
    async (req) => {
      const id = uuid.parse((req.params as any).id);
      let key = "";
      await transaction(async (c) => {
        await c.query("SELECT id FROM project WHERE id=1 FOR UPDATE");
        const r = (await c.query("SELECT * FROM media WHERE id=?", [id]))[0];
        if (!r) fail(404, "Media not found");
        key = r.storage_key;
        await c.query("DELETE FROM media WHERE id=?", [id]);
        await audit(
          c,
          req.user!.id,
          "media.delete",
          id,
          { journalId: r.journal_id },
          null,
        );
      });
      await unlink(resolve(config.mediaDir, key)).catch(() => {});
      return { ok: true };
    },
  );
  return app;
}
