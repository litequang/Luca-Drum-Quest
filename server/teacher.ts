import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { pool, transaction, audit, decode } from "./db.js";
import { parent, fail } from "./auth.js";
import { schemas } from "./model.js";
export async function teacher(req: FastifyRequest) {
  if (!req.user) fail(401, "Sign in required");
  if (req.user.role !== "TEACHER") fail(403, "Teacher access required");
}
export async function teacherRoutes(app: FastifyInstance) {
  app.put(
    "/api/v1/admin/users/:id/grants",
    { preHandler: parent },
    async (req) => {
      const id = z.uuid().parse((req.params as any).id);
      const recordIds = [
        ...new Set(
          z
            .object({ recordIds: z.array(z.uuid()).max(200) })
            .strict()
            .parse(req.body).recordIds,
        ),
      ];
      await transaction(async (c) => {
        await c.query("SELECT id FROM project WHERE id=1 FOR UPDATE");
        const user = (
          await c.query(
            "SELECT id FROM users WHERE id=? AND role='TEACHER' AND active=TRUE FOR UPDATE",
            [id],
          )
        )[0];
        if (!user) fail(400, "Choose an active teacher");
        for (const ref of recordIds)
          if (
            !(
              await c.query(
                "SELECT id FROM records WHERE id=? AND kind IN ('skills','practices')",
                [ref],
              )
            ).length
          )
            fail(400, "Only skills and practices can be shared with a teacher");
        const before = (
          await c.query(
            "SELECT record_id FROM teacher_grants WHERE user_id=?",
            [id],
          )
        ).map((r: any) => r.record_id);
        await c.query("DELETE FROM teacher_grants WHERE user_id=?", [id]);
        for (const ref of recordIds)
          await c.query("INSERT INTO teacher_grants VALUES (?,?)", [id, ref]);
        await audit(
          c,
          req.user!.id,
          "teacher.scope",
          id,
          { recordIds: before },
          { recordIds },
        );
      });
      return { ok: true };
    },
  );
  app.get("/api/v1/teacher/state", { preHandler: teacher }, async (req) => {
    const rows = await pool.query(
      "SELECT r.* FROM records r JOIN teacher_grants g ON g.record_id=r.id WHERE g.user_id=? ORDER BY r.kind,r.id",
      [req.user!.id],
    );
    return {
      records: rows.map((r: any) => ({ entity: r.kind, ...decode(r) })),
    };
  });
  app.patch(
    "/api/v1/teacher/skills/:id",
    { preHandler: teacher },
    async (req) => {
      const id = z.uuid().parse((req.params as any).id);
      const feedback = schemas.skills
        .pick({ status: true, teacherFeedback: true, teacherApproved: true })
        .strict()
        .parse(req.body);
      await transaction(async (c) => {
        await c.query("SELECT id FROM project WHERE id=1 FOR UPDATE");
        const user = (
          await c.query(
            "SELECT id FROM users WHERE id=? AND role='TEACHER' AND active=TRUE FOR UPDATE",
            [req.user!.id],
          )
        )[0];
        const row = (
          await c.query(
            "SELECT r.* FROM records r JOIN teacher_grants g ON g.record_id=r.id WHERE r.id=? AND r.kind='skills' AND g.user_id=? FOR UPDATE",
            [id, req.user!.id],
          )
        )[0];
        if (!user || !row) fail(404, "Assigned skill not found");
        const before = decode(row),
          data = { ...JSON.parse(row.data), ...feedback };
        await c.query("UPDATE records SET data=? WHERE id=?", [
          JSON.stringify(data),
          id,
        ]);
        if (
          before.status !== feedback.status ||
          before.teacherFeedback !== feedback.teacherFeedback
        )
          await c.query(
            "INSERT INTO skill_history (skill_id,actor_id,old_status,new_status,feedback) VALUES (?,?,?,?,?)",
            [
              id,
              req.user!.id,
              before.status,
              feedback.status,
              feedback.teacherFeedback,
            ],
          );
        await audit(c, req.user!.id, "teacher.feedback", id, before, {
          ...before,
          ...feedback,
        });
      });
      return { ok: true };
    },
  );
}
