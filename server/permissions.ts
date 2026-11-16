import { pool } from "./db.js";
export type Viewer = { id: string; role: string } | null;
export function canViewJournal(user: Viewer, post: any): boolean {
  return (
    user?.role === "PARENT_ADMIN" ||
    (post.published &&
      (post.visibility === "PUBLIC" ||
        (user?.role === "FAMILY_VIEWER" && post.visibility === "FAMILY")))
  );
}
export async function canViewRecord(user: Viewer, row: any): Promise<boolean> {
  if (user?.role === "PARENT_ADMIN") return true;
  if (row.kind === "journal") return canViewJournal(user, JSON.parse(row.data));
  if (row.kind !== "practices" || user?.role !== "TEACHER") return false;
  const grants = await pool.query(
    "SELECT g.record_id FROM teacher_grants g JOIN users u ON u.id=g.user_id WHERE g.record_id=? AND g.user_id=? AND u.role='TEACHER' AND u.active=TRUE",
    [row.id, user.id],
  );
  return grants.length > 0;
}
