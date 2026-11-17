import { parentPort, workerData } from "node:worker_threads";
import { argon2id } from "hash-wasm";

try {
  const hash = await argon2id({
    password: workerData.password,
    salt: workerData.salt,
    memorySize: 65536,
    iterations: 3,
    parallelism: 4,
    hashLength: 32,
    outputType: "binary",
  });
  parentPort?.postMessage(hash);
} catch {
  // Do not forward errors carrying password/input data or log credentials.
  parentPort?.postMessage(null);
}
