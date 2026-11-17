import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import argon2 from "argon2";
import { z } from "zod";
import { pool, transaction, audit } from "./db.js";
import { config } from "./config.js";
export const digest = (v: string) =>
  createHash("sha256").update(v).digest("hex");
export const secret = () => randomBytes(32).toString("hex");
export const cookieName = config.secure
  ? "__Host-luca_session"
  : "luca_session";
declare module "fastify" {
  interface FastifyRequest {
    user: { id: string; role: string; csrf: string } | null;
  }
}
export function fail(status: number, message: string): never {
  throw Object.assign(new Error(message), { statusCode: status });
}
export async function parent(req: FastifyRequest) {
  if (!req.user) fail(401, "Sign in required");
  if (req.user.role !== "PARENT_ADMIN")
    fail(403, "Parent administrator required");
}
export const cookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: config.secure,
  path: "/",
};
export async function session(reply: FastifyReply, id: string) {
  const token = secret(),
    csrf = secret();
  await pool.query("DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP()");
  await pool.query(
    "INSERT INTO sessions VALUES (?,?,?,DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND))",
    [digest(token), id, csrf, Math.floor(config.SESSION_HOURS * 3600)],
  );
  reply.setCookie(cookieName, token, {
    ...cookieOptions,
    maxAge: config.SESSION_HOURS * 3600,
  });
  return csrf;
}
export async function auth(app: FastifyInstance) {
  app.decorateRequest("user", null);
  app.addHook("onRequest", async (req, reply) => {
    if (
      req.url.startsWith("/api/") ||
      req.url.startsWith("/admin") ||
      req.url.startsWith("/family") ||
      req.url.startsWith("/teacher") ||
      req.url.startsWith("/setup")
    )
      reply.header("Cache-Control", "no-store");
    const token = req.cookies[cookieName];
    const setupRoute = ["/setup", "/api/v1/setup"].includes(
      req.routeOptions.url ?? "",
    );
    // Bootstrap has its own out-of-band key; an empty database has no session table yet.
    if (!setupRoute && token && /^[a-f0-9]{64}$/.test(token)) {
      const rows = await pool.query(
        "SELECT u.id,u.role,s.csrf FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP() AND u.active=TRUE",
        [digest(token)],
      );
      if (rows.length) req.user = rows[0];
    }
    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
      req.url.startsWith("/api/")
    ) {
      if (req.headers.origin !== config.APP_ORIGIN)
        fail(403, "Invalid request origin");
      if (req.user) {
        const supplied = req.headers["x-csrf-token"];
        if (
          typeof supplied !== "string" ||
          !/^[a-f0-9]{64}$/.test(supplied) ||
          !timingSafeEqual(Buffer.from(supplied), Buffer.from(req.user.csrf))
        )
          fail(403, "Invalid CSRF token");
      }
    }
  });
  const dummy = await argon2.hash(secret());
  app.post(
    "/api/v1/auth/login",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const body = z
        .object({
          email: z.email().max(254),
          password: z.string().min(1).max(128),
        })
        .strict()
        .parse(req.body);
      const rows = await pool.query("SELECT * FROM users WHERE email=?", [
        body.email.toLowerCase(),
      ]);
      const user = rows[0];
      const valid = await argon2.verify(
        user?.password_hash ?? dummy,
        body.password,
      );
      if (!user || !valid || !user.active) fail(401, "Invalid credentials");
      if (req.cookies[cookieName])
        await pool.query("DELETE FROM sessions WHERE token_hash=?", [
          digest(req.cookies[cookieName] ?? ""),
        ]);
      const csrf = await session(reply, user.id);
      await transaction((c) =>
        audit(c, user.id, "auth.login", user.id, null, null),
      );
      return { role: user.role, csrf };
    },
  );
  app.get("/api/v1/me", async (req) => {
    if (!req.user) fail(401, "Sign in required");
    return req.user;
  });
  app.post("/api/v1/auth/logout", async (req, reply) => {
    if (!req.user) fail(401, "Sign in required");
    await pool.query("DELETE FROM sessions WHERE token_hash=?", [
      digest(req.cookies[cookieName] ?? ""),
    ]);
    reply.clearCookie(cookieName, cookieOptions);
    return { ok: true };
  });
}
