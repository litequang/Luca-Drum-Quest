import Fastify from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import helmet from "@fastify/helmet";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { pool, transaction, audit, decode } from "./db.js";
import { config } from "./config.js";
import { auth, parent, fail } from "./auth.js";
import { canViewJournal } from "./permissions.js";
import { accessRoutes } from "./access.js";
import { mediaRoutes } from "./media.js";
import { teacherRoutes, teacher } from "./teacher.js";
import {
  schemas,
  seasonSchema,
  projectSchema,
  totals,
  type Kind,
} from "./model.js";
const uuid = z.uuid();
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
        frameSrc: ["https://www.youtube-nocookie.com"],
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
    "/youtube.js": ["youtube.js", "text/javascript"],
    "/data.js": ["data.js", "text/javascript"],
    "/admin/login": ["admin/login.html", "text/html"],
    "/admin/admin.css": ["admin/admin.css", "text/css"],
    "/admin/login.js": ["admin/login.js", "text/javascript"],
    "/admin/admin.js": ["admin/admin.js", "text/javascript"],
    "/admin/teacher.js": ["admin/teacher.js", "text/javascript"],
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
  app.get("/teacher", async (req, reply) => {
    if (!req.user) return reply.redirect("/admin/login");
    await teacher(req);
    return reply.type("text/html").send(await readFile("admin/teacher.html"));
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
      .filter((p: any) => canViewJournal(user, p))
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
      media: await pool.query("SELECT id,record_id,mime,size FROM media"),
      teacherGrants: await pool.query(
        "SELECT user_id,record_id FROM teacher_grants",
      ),
      users: await pool.query("SELECT id,email,role,active FROM users"),
      invitations: await pool.query(
        "SELECT id,label,role,expires_at,revoked,used_by FROM invitations",
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
  await accessRoutes(app);
  await teacherRoutes(app);
  await mediaRoutes(app);
  return app;
}
