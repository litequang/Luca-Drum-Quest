import { buildApp } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";
await pool.query("SELECT 1");
const app = await buildApp();
await app.listen({ host: config.HOST, port: config.PORT });
console.log(`Luca Drum Quest local pilot: ${config.APP_ORIGIN}`);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    await app.close();
    await pool.end();
    process.exit(0);
  });
