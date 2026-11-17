import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { hashPassword } from "./password.js";
import { z } from "zod";
import { pool, transaction, audit } from "./db.js";
import { parent, fail, secret, digest, session } from "./auth.js";
const uuid = z.uuid();
export async function accessRoutes(app: FastifyInstance) {
  app.post("/api/v1/admin/invitations", { preHandler: parent }, async (req) => {
    const { label, role } = z
      .object({
        label: z.string().min(1).max(100),
        role: z.enum(["FAMILY_VIEWER", "TEACHER"]).default("FAMILY_VIEWER"),
      })
      .strict()
      .parse(req.body);
    const token = secret(),
      id = randomUUID();
    await transaction(async (c) => {
      await c.query(
        "INSERT INTO invitations (id,token_hash,label,expires_at,role) VALUES (?,?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 7 DAY),?)",
        [id, digest(token), label, role],
      );
      await audit(c, req.user!.id, "invitation.create", id, null, {
        label,
        role,
      });
    });
    return { id, token, role };
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
      const hash = await hashPassword(data.password),
        id = randomUUID();
      const role = await transaction(async (c) => {
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
          [id, data.email.toLowerCase(), hash, invite.role],
        );
        await c.query("UPDATE invitations SET used_by=? WHERE id=?", [
          id,
          invite.id,
        ]);
        await audit(c, id, "invitation.accept", invite.id, null, {
          role: invite.role,
        });
        return invite.role;
      });
      return { csrf: await session(reply, id), role };
    },
  );
  async function revoke(c: any, actor: string, id: string) {
    const user = (
      await c.query("SELECT id,role,active FROM users WHERE id=? FOR UPDATE", [
        id,
      ])
    )[0];
    if (!user || !["FAMILY_VIEWER", "TEACHER"].includes(user.role))
      fail(400, "Only invited access can be revoked");
    const grants = await c.query(
      "SELECT record_id FROM teacher_grants WHERE user_id=?",
      [id],
    );
    await c.query("UPDATE users SET active=FALSE WHERE id=?", [id]);
    await c.query("DELETE FROM sessions WHERE user_id=?", [id]);
    await c.query("DELETE FROM teacher_grants WHERE user_id=?", [id]);
    await audit(
      c,
      actor,
      user.role === "TEACHER" ? "teacher.revoke" : "family.revoke",
      id,
      { active: !!user.active, recordIds: grants.map((g: any) => g.record_id) },
      { active: false, recordIds: [] },
    );
  }
  app.delete(
    "/api/v1/admin/invitations/:id",
    { preHandler: parent },
    async (req) => {
      const id = uuid.parse((req.params as any).id);
      await transaction(async (c) => {
        const invite = (
          await c.query("SELECT * FROM invitations WHERE id=? FOR UPDATE", [id])
        )[0];
        if (!invite) fail(404, "Invitation not found");
        await c.query("UPDATE invitations SET revoked=TRUE WHERE id=?", [id]);
        if (invite.used_by) await revoke(c, req.user!.id, invite.used_by);
        await audit(c, req.user!.id, "invitation.revoke", id, null, null);
      });
      return { ok: true };
    },
  );
  app.delete("/api/v1/admin/users/:id", { preHandler: parent }, async (req) => {
    const id = uuid.parse((req.params as any).id);
    await transaction((c) => revoke(c, req.user!.id, id));
    return { ok: true };
  });
  app.put(
    "/api/v1/admin/users/:id/access",
    { preHandler: parent },
    async (req) => {
      const id = uuid.parse((req.params as any).id);
      await transaction(async (c) => {
        const row = (
          await c.query(
            "SELECT id,role,active FROM users WHERE id=? FOR UPDATE",
            [id],
          )
        )[0];
        if (!row || !["FAMILY_VIEWER", "TEACHER"].includes(row.role))
          fail(400, "Only invited access can be granted");
        await c.query("UPDATE users SET active=TRUE WHERE id=?", [id]);
        await c.query("DELETE FROM sessions WHERE user_id=?", [id]);
        await audit(
          c,
          req.user!.id,
          row.role === "TEACHER" ? "teacher.grant" : "family.grant",
          id,
          { active: !!row.active },
          { active: true },
        );
      });
      return { ok: true };
    },
  );
}
