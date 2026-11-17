import { randomBytes, timingSafeEqual } from "node:crypto";
import { Worker } from "node:worker_threads";

// Exactly the policy emitted by the original native argon2 dependency.
const prefix = "$argon2id$v=19$m=65536,t=3,p=4";
const supported = /^\$argon2id\$v=19\$m=65536,t=3,p=4\$([A-Za-z0-9+/]{22})\$([A-Za-z0-9+/]{43})$/;
const base64 = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64").replace(/=+$/, "");
type Job = {
  password: string;
  salt: Buffer;
  resolve: (value: Buffer) => void;
  reject: (error: Error) => void;
};
const queue: Job[] = [];
let active = false;

function drain() {
  if (active) return;
  const job = queue.shift();
  if (!job) return;
  active = true;
  let worker: Worker;
  try {
    // A worker keeps expensive WASM computation off the HTTP event loop. One
    // active derivation bounds Argon2 memory to 64 MiB; the waiting queue is bounded.
    const extension = import.meta.url.endsWith(".ts") ? "ts" : "js";
    worker = new Worker(new URL(`./password-worker.${extension}`, import.meta.url), {
      workerData: { password: job.password, salt: job.salt },
      // Never re-run Passenger's loader or inherit eval-only Node flags in a worker.
      execArgv: extension === "ts" ? ["--import", "tsx"] : [],
      env: { ...process.env, NODE_OPTIONS: "" },
    });
  } catch {
    active = false;
    job.reject(new Error("Password hashing unavailable"));
    queueMicrotask(drain);
    return;
  }
  let output: Buffer | undefined;
  let failed = false;
  worker.once("message", (value: unknown) => {
    if (value instanceof Uint8Array && value.byteLength === 32) output = Buffer.from(value);
    else failed = true;
  });
  worker.once("error", () => { failed = true; });
  worker.once("exit", (code) => {
    active = false;
    if (!failed && code === 0 && output) job.resolve(output);
    else job.reject(new Error("Password hashing failed"));
    drain();
  });
}

function derive(password: string, salt: Buffer): Promise<Buffer> {
  if (typeof password !== "string" || Buffer.byteLength(password, "utf8") > 512)
    return Promise.reject(new Error("Invalid password length"));
  if (queue.length >= 8)
    return Promise.reject(Object.assign(new Error("Password service busy"), { statusCode: 503 }));
  return new Promise((resolve, reject) => {
    queue.push({ password, salt, resolve, reject });
    drain();
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await derive(password, salt);
  return `${prefix}$${base64(salt)}$${base64(hash)}`;
}

export async function verifyPassword(encoded: string, password: string): Promise<boolean> {
  // Validate the app's existing PHC policy before allocating memory. Stored,
  // malformed or unexpectedly expensive parameters never reach the WASM engine.
  if (typeof encoded !== "string") return false;
  const match = supported.exec(encoded);
  if (!match) return false;
  const salt = Buffer.from(match[1], "base64"), expected = Buffer.from(match[2], "base64");
  if (salt.length !== 16 || expected.length !== 32 || base64(salt) !== match[1] || base64(expected) !== match[2])
    return false;
  return timingSafeEqual(await derive(password, salt), expected);
}
