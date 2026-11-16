import mariadb, { type PoolConnection } from "mariadb";
import { config } from "./config.js";
export const pool = mariadb.createPool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  connectionLimit: 5,
  autoJsonMap: false,
  timezone: "+00:00",
  bigIntAsNumber: true,
  insertIdAsNumber: true,
});
export async function transaction<T>(fn: (c: PoolConnection) => Promise<T>) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const result = await fn(c);
    await c.commit();
    return result;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
export async function audit(
  c: PoolConnection,
  actor: string | null,
  action: string,
  id: string,
  before: unknown,
  after: unknown,
) {
  await c.query(
    "INSERT INTO audit_log (actor_id,action,target_id,before_data,after_data) VALUES (?,?,?,?,?)",
    [
      actor,
      action,
      id,
      before == null ? null : JSON.stringify(before),
      after == null ? null : JSON.stringify(after),
    ],
  );
}
export function decode(row: any) {
  const data = JSON.parse(row.data);
  // Older records predate optional YouTube links; normalize them for the editor.
  if (["journal", "practices"].includes(row.kind)) data.youtubeUrl ??= null;
  return { id: row.id, seasonId: row.season_id, ...data };
}
