import { cp, mkdir, readFile, writeFile, access, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
const destination = resolve("release");
// Never overwrite an installed/tested release's private configuration or runtime data.
for (const name of [".env", "node_modules", "private-media"]) {
  try {
    await access(join(destination, name));
    throw new Error(
      "release/ contains " +
        name +
        ". Move installed/private data out of the generated package directory before packaging again.",
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
await mkdir(destination, { recursive: true });
await rm(join(destination, "dist"), { recursive: true, force: true });
await cp("dist/server", join(destination, "dist/server"), { recursive: true });
await cp("dist/youtube.js", join(destination, "dist/youtube.js"));
for (const file of [
  "index.html",
  "styles.css",
  "app.js",
  "apiClient.js",
  "data.js",
  "youtube.js",
  "package-lock.json",
])
  await cp(file, join(destination, file));
for (const directory of ["admin", "migrations"])
  await cp(directory, join(destination, directory), { recursive: true });
await cp("hosting/app.cjs", join(destination, "app.cjs"));
await cp("hosting/.env.example", join(destination, ".env.example"));
const manifest = JSON.parse(await readFile("package.json", "utf8"));
manifest.scripts = {
  start: "node app.cjs",
  "db:migrate": "node --env-file-if-exists=.env dist/server/cli.js migrate",
  "db:seed": "node --env-file-if-exists=.env dist/server/cli.js seed",
  "admin:init": "node --env-file-if-exists=.env dist/server/cli.js init-admin",
  "media:cleanup": "node --env-file-if-exists=.env dist/server/cleanup.js",
};
await writeFile(
  join(destination, "package.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
// The unchanged lockfile remains reproducible. Runtime installs omit declared dev tools.
await writeFile(join(destination, ".npmrc"), "omit=dev\n");
await cp("docs/HAWKHOST_SETUP.md", join(destination, "HOST_SETUP.md"));
await cp("docs/HOSTING_BAN_GIAO_VI.md", join(destination, "HOST_SETUP_VI.md"));
await cp("docs/WINDOWS_BUILD_REPORT.md", join(destination, "WINDOWS_BUILD_REPORT.md"));
console.log(
  "release/ prepared: compiled server, public assets and migrations. Install Linux runtime dependencies on the host with npm ci --omit=dev.",
);
