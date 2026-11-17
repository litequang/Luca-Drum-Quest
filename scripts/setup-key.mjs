import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const destination = resolve(".env");
let contents;
try {
  contents = await readFile(destination, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  contents = await readFile(
    new URL("../.env.example", import.meta.url),
    "utf8",
  );
}
const existing = /^SETUP_TOKEN=(.*)$/m.exec(contents);
if (existing && existing[1].trim())
  console.log("SETUP_TOKEN already exists; leaving .env unchanged.");
else {
  const line = "SETUP_TOKEN=" + randomBytes(32).toString("hex");
  contents = existing
    ? contents.replace(/^SETUP_TOKEN=.*$/m, line)
    : contents.replace(/\s*$/, "\n") + line + "\n";
  await writeFile(destination, contents, { mode: 0o600 });
  console.log(
    "Generated SETUP_TOKEN in private .env. Copy it privately to the host; it is never included in the release package.",
  );
}
