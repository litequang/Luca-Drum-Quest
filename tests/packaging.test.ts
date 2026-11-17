import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
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
