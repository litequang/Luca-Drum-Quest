import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import native from "argon2";
import { hashPassword, verifyPassword } from "../server/password.js";

test("WASM Argon2id verifies existing native hashes and native verifies new hashes without policy changes", async () => {
  for (const password of [randomBytes(24).toString("hex"), "Mật khẩu 🥁 e\u0301\0 thử nghiệm"]) {
    const old = await native.hash(password, { type: native.argon2id, memoryCost: 65536, timeCost: 3 });
    assert.equal(await verifyPassword(old, password), true);
    assert.equal(await verifyPassword(old, password + "wrong"), false);
    const encoded = await hashPassword(password);
    assert.match(encoded, /^\$argon2id\$v=19\$m=65536,t=3,p=4\$/);
    assert.equal(await native.verify(encoded, password), true);
    assert.equal(await native.verify(encoded, password + "wrong"), false);
    assert.equal(await verifyPassword(encoded, password), true);
  }
});

test("password hashing uses independent random salts and leaves the event loop responsive", async () => {
  const password = randomBytes(24).toString("hex");
  let completed = false;
  const first = hashPassword(password).then(value => { completed = true; return value; });
  await new Promise(resolve => setTimeout(resolve, 1));
  assert.equal(completed, false);
  const [a, b] = await Promise.all([first, hashPassword(password)]);
  assert.notEqual(a, b);
  assert.equal(await verifyPassword(a, password), true);
  assert.equal(await verifyPassword(b, password), true);
});

test("malformed, changed-algorithm and excessive-cost PHC hashes fail closed before hashing", async () => {
  const valid = await hashPassword("test-only-password");
  for (const bad of ["", "not-a-hash", valid.replace("argon2id", "argon2i"), valid.replace("v=19", "v=16"), valid.replace("m=65536", "m=2147483647"), valid.replace("t=3", "t=999999"), valid.replace("p=4", "p=999999"), valid + "="]) {
    assert.equal(await verifyPassword(bad, "test-only-password"), false);
  }
});

test("password derivation concurrency has a bounded queue", async () => {
  const jobs = Array.from({length: 11}, (_, i) => hashPassword("queued-test-password-" + i));
  const results = await Promise.allSettled(jobs);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 9);
  assert.equal(results.filter(r => r.status === "rejected" && r.reason.statusCode === 503).length, 2);
});
