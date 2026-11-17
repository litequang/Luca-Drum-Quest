import type { FastifyInstance } from "fastify";
import { readFile } from "node:fs/promises";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { pool } from "./db.js";
import { config } from "./config.js";
import { fail } from "./auth.js";
import { migrate, seed, initAdmin } from "./cli.js";
function missingTable(error: unknown): boolean {
  return (error as { code?: string }).code === "ER_NO_SUCH_TABLE";
}
export async function setupAvailable(): Promise<boolean> {
  if (!config.SETUP_TOKEN) return false;
  try {
    const state = (
      await pool.query(
        "SELECT initialized_at FROM installation_state WHERE id=1",
      )
    )[0];
    if (state?.initialized_at != null) return false;
  } catch (e) {
    if (!missingTable(e)) throw e;
  }
  // Also protects installations created with the older CLI, before migration 003.
  try {
    if (
      (
        await pool.query(
          "SELECT id FROM users WHERE role='PARENT_ADMIN' LIMIT 1",
        )
      ).length
    )
      return false;
  } catch (e) {
    if (!missingTable(e)) throw e;
  }
  return true;
}
export async function setupRoutes(app: FastifyInstance) {
  app.get("/setup", async (_req, reply) => {
    reply.header("Cache-Control", "no-store");
    if (!(await setupAvailable())) return reply.redirect("/admin/login");
    return reply.type("text/html").send(await readFile("admin/setup.html"));
  });
  app.post(
    "/api/v1/setup",
    {
      bodyLimit: 2048,
      config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
    },
    async (req) => {
      if (!(await setupAvailable())) fail(404, "Setup unavailable");
      const token = req.headers["x-setup-token"];
      if (
        typeof token !== "string" ||
        !/^[a-f0-9]{64}$/.test(token) ||
        !timingSafeEqual(Buffer.from(token), Buffer.from(config.SETUP_TOKEN))
      )
        fail(403, "Invalid setup key");
      const credentials = z
        .object({
          email: z.email().max(254),
          password: z.string().min(14).max(128),
          confirmPassword: z.string().max(128),
        })
        .strict()
        .refine((v) => v.password === v.confirmPassword, "Passwords must match")
        .parse(req.body);
      const connection = await pool.getConnection();
      const lockName =
        "luca-setup-" +
        createHash("sha256").update(config.DB_NAME).digest("hex").slice(0, 40);
      let locked = false;
      try {
        locked =
          Number(
            (
              await connection.query("SELECT GET_LOCK(?,0) acquired", [
                lockName,
              ])
            )[0].acquired,
          ) === 1;
        if (!locked) fail(409, "Setup in progress; retry after it completes");
        if (!(await setupAvailable())) fail(409, "Admin already initialized");
        // A key holder can prepare only this configured database. Never creates a database/user or drops tables.
        await migrate();
        await seed();
        await initAdmin(credentials.email, credentials.password);
        return { ok: true, loginUrl: "/admin/login" };
      } finally {
        try {
          if (locked)
            await connection.query("SELECT RELEASE_LOCK(?)", [lockName]);
        } finally {
          connection.release();
        }
      }
    },
  );
}
