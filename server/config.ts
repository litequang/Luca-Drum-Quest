import { resolve } from "node:path";
import { z } from "zod";
const env = z
  .object({
    SETUP_TOKEN: z
      .union([z.literal(""), z.string().regex(/^[a-f0-9]{64}$/)])
      .default(""),
    HOST: z.string().default("127.0.0.1"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    APP_ORIGIN: z.url().default("http://localhost:3000"),
    DB_HOST: z.string().default("127.0.0.1"),
    DB_PORT: z.coerce.number().int().default(3306),
    DB_USER: z.string().default("luca"),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z
      .string()
      .regex(/^[a-zA-Z0-9_]+$/)
      .default("luca_pilot"),
    MEDIA_DIR: z.string().default("./private-media"),
    SESSION_HOURS: z.coerce.number().min(0.01).max(24).default(8),
    COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
  })
  .parse(process.env);
const origin = new URL(env.APP_ORIGIN);
if (origin.origin !== env.APP_ORIGIN)
  throw new Error(
    "APP_ORIGIN must be an origin without a path or trailing slash",
  );
if (env.COOKIE_SECURE === "true" && origin.protocol !== "https:")
  throw new Error("Secure cookies require HTTPS");
if (
  env.COOKIE_SECURE !== "true" &&
  !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)
)
  throw new Error("HTTP cookies are allowed only on loopback");
export const config = {
  ...env,
  secure: env.COOKIE_SECURE === "true",
  mediaDir: resolve(env.MEDIA_DIR),
};

if (!config.secure && !["127.0.0.1", "::1", "localhost"].includes(config.HOST))
  throw new Error(
    "Local HTTP must bind a loopback address; use HTTPS for LAN access",
  );
