import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, mkdir, writeFile, copyFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { randomBytes } from "node:crypto";
// Exercises local key generation without DB credentials or a checked-in/default secret.
test("setup:key generates a private high-entropy key and preserves existing configuration/key", async () => {
  await mkdir(resolve("work"), { recursive: true });
  const directory = await mkdtemp(resolve("work/setup-key-"));
  try {
    const command = resolve("scripts/setup-key.mjs");
    const first = spawnSync(process.execPath, [command], {
      cwd: directory,
      encoding: "utf8",
    });
    assert.equal(first.status, 0, first.stderr);
    const contents = await readFile(resolve(directory, ".env"), "utf8"),
      key = /^SETUP_TOKEN=([a-f0-9]{64})$/m.exec(contents)?.[1];
    assert.ok(key);
    assert.equal(first.stdout.includes(key), false);
    const second = spawnSync(process.execPath, [command], {
      cwd: directory,
      encoding: "utf8",
    });
    assert.equal(second.status, 0, second.stderr);
    assert.equal(await readFile(resolve(directory, ".env"), "utf8"), contents);
    assert.match(second.stdout, /unchanged/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("host packaging refuses to overwrite an installed release's private environment", async () => {
  await mkdir(resolve("work"), { recursive: true });
  const directory = await mkdtemp(resolve("work/package-guard-"));
  try {
    await mkdir(resolve(directory, "release"));
    const file = resolve(directory, "release/.env");
    await writeFile(file, "PRIVATE_FIXTURE=preserve-me\n");
    const result = spawnSync(
      process.execPath,
      [resolve("scripts/package-host.mjs")],
      { cwd: directory, encoding: "utf8" },
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /contains .env/);
    assert.equal(await readFile(file, "utf8"), "PRIVATE_FIXTURE=preserve-me\n");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("host startup reports actionable error codes without private messages, stacks or values", async () => {
  const work = resolve("work");
  await mkdir(work, { recursive: true });
  const directory = await mkdtemp(resolve(work, "startup-diagnostics-"));
  const privateValue = randomBytes(32).toString("hex");
  try {
    await copyFile(resolve("hosting/app.cjs"), resolve(directory, "app.cjs"));
    await mkdir(resolve(directory, "dist/server"), { recursive: true });
    await writeFile(resolve(directory, "package.json"), '{"type":"module"}');
    const fixtures = [
      {
        source: `throw Object.assign(new Error(${JSON.stringify(privateValue)}), {code:'ER_GET_CONNECTION_TIMEOUT', cause:{code:'ER_ACCESS_DENIED_ERROR', message:${JSON.stringify(privateValue)}}});`,
        codes: ["ER_GET_CONNECTION_TIMEOUT", "ER_ACCESS_DENIED_ERROR"],
      },
      {
        source: `throw Object.assign(new Error(${JSON.stringify(privateValue)}), {issues:[{path:['DB_PASSWORD'],input:${JSON.stringify(privateValue)}},{path:[${JSON.stringify(privateValue)}]}]});`,
        codes: ["INVALID_ENVIRONMENT"], fields: ["DB_PASSWORD"],
      },
      {
        source: "throw new Error('APP_ORIGIN must be an origin without a path or trailing slash');",
        codes: ["INVALID_APP_ORIGIN"],
      },
      {
        source: `throw new Error(${JSON.stringify(privateValue)});`,
        codes: ["STARTUP_FAILED"],
      },
    ];
    for (const fixture of fixtures) {
      await writeFile(resolve(directory, "dist/server/index.js"), fixture.source);
      const result = spawnSync(process.execPath, [resolve(directory, "app.cjs")], {
        cwd: directory, encoding: "utf8", timeout: 5000,
      });
      assert.equal(result.status, 1, result.stderr);
      assert.equal(result.stdout, "");
      assert.equal(result.stderr.includes(privateValue), false);
      assert.equal(result.stderr.includes("Error:"), false);
      const diagnostic = JSON.parse(result.stderr.trim().replace(/^\[luca-startup\] /, ""));
      assert.equal(diagnostic.phase, "server");
      assert.deepEqual(diagnostic.codes, fixture.codes);
      if (fixture.fields) assert.deepEqual(diagnostic.invalidFields, fixture.fields);
    }
  } finally {
    if (!directory.startsWith(work + sep)) throw new Error("Unexpected test cleanup path");
    await rm(directory, { recursive: true, force: true });
  }
});
