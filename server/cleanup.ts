import { readdir, stat, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pool } from "./db.js";
import { config } from "./config.js";
// Report by default. --prune removes only unreferenced generated keys older than 24h.
try {
  const rows = await pool.query("SELECT storage_key FROM media"),
    known = new Set(rows.map((r: any) => r.storage_key));
  const files = await readdir(config.mediaDir).catch(
    (e: NodeJS.ErrnoException) => {
      if (e.code === "ENOENT") return [];
      throw e;
    },
  );
  let count = 0;
  for (const key of files) {
    if (!/^[a-f0-9]{40}$/.test(key) || known.has(key)) continue;
    const path = resolve(config.mediaDir, key),
      info = await stat(path);
    if (!info.isFile() || Date.now() - info.mtimeMs < 86400000) continue;
    count++;
    if (process.argv.includes("--prune")) await unlink(path);
  }
  console.log(
    `${count} old orphan files ${process.argv.includes("--prune") ? "removed" : "found (dry run)"}`,
  );
} finally {
  await pool.end();
}
