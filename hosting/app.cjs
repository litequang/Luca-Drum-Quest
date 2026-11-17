// CommonJS startup bridge for cPanel/Passenger. The application itself remains ESM.
const { existsSync } = require("node:fs");
const { join } = require("node:path");
process.chdir(__dirname);
try {
  if (existsSync(join(__dirname, ".env")))
    process.loadEnvFile(join(__dirname, ".env"));
  import("./dist/server/index.js").catch(() => {
    console.error(
      "Unable to start Luca Drum Quest. Check the Node runtime and private database/environment configuration.",
    );
    process.exit(1);
  });
} catch {
  console.error("Unable to load the private application environment.");
  process.exit(1);
}
