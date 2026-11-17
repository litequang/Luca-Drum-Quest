// CommonJS startup bridge for cPanel/Passenger. The application itself remains ESM.
const { existsSync } = require("node:fs");
const { join } = require("node:path");
process.chdir(__dirname);
// Report only diagnostic codes/field names. Database errors can contain credentials,
// so never print the original error, message, stack, environment or SQL here.
function startupFailure(error, phase) {
  const fields = new Set([
    "SETUP_TOKEN", "HOST", "PORT", "APP_ORIGIN", "DB_HOST", "DB_PORT",
    "DB_USER", "DB_PASSWORD", "DB_NAME", "MEDIA_DIR", "SESSION_HOURS", "COOKIE_SECURE",
  ]);
  const codes = [];
  const invalidFields = new Set();
  let current = error;
  for (let depth = 0; current && depth < 4; depth++, current = current.cause) {
    if (typeof current.code === "string" && /^[A-Z][A-Z0-9_]{1,79}$/.test(current.code))
      codes.push(current.code);
    if (Array.isArray(current.issues))
      for (const issue of current.issues)
        if (fields.has(issue.path?.[0])) invalidFields.add(issue.path[0]);
  }
  const knownMessages = new Map([
    ["APP_ORIGIN must be an origin without a path or trailing slash", "INVALID_APP_ORIGIN"],
    ["Secure cookies require HTTPS", "HTTPS_REQUIRED"],
    ["HTTP cookies are allowed only on loopback", "SECURE_COOKIE_REQUIRED"],
    ["Local HTTP must bind a loopback address; use HTTPS for LAN access", "LOOPBACK_REQUIRED"],
  ]);
  const message = typeof error?.message === "string" ? error.message : "";
  if (knownMessages.has(message)) codes.push(knownMessages.get(message));
  if (invalidFields.size) codes.push("INVALID_ENVIRONMENT");
  if (/sharp.*module|module.*sharp|No native build was found/i.test(message))
    codes.push("NATIVE_DEPENDENCY_LOAD_FAILED");
  console.error("[luca-startup] " + JSON.stringify({
    phase, node: process.version,
    codes: [...new Set(codes.length ? codes : ["STARTUP_FAILED"])],
    ...(invalidFields.size ? { invalidFields: [...invalidFields].sort() } : {}),
  }));
  process.exit(1);
}
if (Number(process.versions.node.split(".")[0]) !== 24)
  startupFailure({ code: "UNSUPPORTED_NODE_VERSION" }, "runtime");
try {
  if (existsSync(join(__dirname, ".env")))
    process.loadEnvFile(join(__dirname, ".env"));
  import("./dist/server/index.js").catch((error) => startupFailure(error, "server"));
} catch (error) {
  startupFailure(error, "environment");
}
