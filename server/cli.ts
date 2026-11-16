import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import { z } from "zod";
import { pool, transaction, audit } from "./db.js";
export async function migrate() {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS migrations (name VARCHAR(200) PRIMARY KEY, applied_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
  );
  for (const file of (await readdir("migrations"))
    .filter((x) => x.endsWith(".sql"))
    .sort()) {
    if (
      (await pool.query("SELECT name FROM migrations WHERE name=?", [file]))
        .length
    )
      continue;
    // MariaDB DDL implicitly commits: stop on error; never silently mark a partial migration complete.
    for (const sql of (await readFile("migrations/" + file, "utf8"))
      .split(";")
      .filter((x) => x.trim()))
      await pool.query(sql);
    await pool.query("INSERT INTO migrations (name) VALUES (?)", [file]);
  }
}
export async function seed() {
  // Existing frontend contains curriculum proposals, not observations about the child.
  const { stages, skills } = await import("../data.js" as string);
  await transaction(async (c) => {
    if ((await c.query("SELECT id FROM project WHERE id=1 FOR UPDATE")).length)
      return;
    const season = randomUUID();
    await c.query("INSERT INTO seasons VALUES (?,?,?)", [
      season,
      1,
      JSON.stringify({
        title: "Season 1",
        durationMonths: 24,
        objective: "Học trống bài bản để chơi nhạc thờ phượng Chúa",
        status: "draft",
        fundingGoal: null,
        plannedLessons: 104,
        lessonLow: 500000,
        lessonHigh: 700000,
        equipmentBudget: null,
        contingency: 0,
        shareFinance: false,
        currentStageId: null,
      }),
    ]);
    await c.query("INSERT INTO project VALUES (1,?,?,?)", [
      "Hành trình học trống bài bản để chơi nhạc thờ phượng Chúa.",
      "Vòng 1: 24 tháng học tập; quà tặng tự nguyện, không phải đầu tư hoặc hoàn vốn.",
      season,
    ]);
    for (const s of stages) {
      const { id, ...rest } = s;
      await c.query("INSERT INTO records VALUES (?,?,?,?)", [
        randomUUID(),
        "stages",
        season,
        JSON.stringify({ ...rest, order: id }),
      ]);
    }
    const ids = new Map<string, string>(
      skills.map((s: any) => [s.id, randomUUID()]),
    );
    for (const s of skills) {
      const { id, prerequisites, ...rest } = s;
      await c.query("INSERT INTO records VALUES (?,?,?,?)", [
        ids.get(id),
        "skills",
        season,
        JSON.stringify({
          ...rest,
          code: id,
          prerequisites:
            prerequisites === "Không" ? [] : [ids.get(prerequisites)],
          status: null,
          teacherFeedback: "",
          teacherApproved: false,
        }),
      ]);
    }
    await audit(c, null, "seed.curriculum", season, null, {
      note: "Draft catalogue only; no lessons, progress, journal or finance records",
    });
  });
}
export async function initAdmin(email: string, password: string) {
  email = z.email().max(254).parse(email).toLowerCase();
  z.string().min(14).max(128).parse(password);
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
  });
  await transaction(async (c) => {
    if (!(await c.query("SELECT id FROM project WHERE id=1 FOR UPDATE")).length)
      throw new Error("Run migrations and seed before initializing admin");
    if (
      (await c.query("SELECT id FROM users WHERE role='PARENT_ADMIN'")).length
    )
      throw new Error(
        "Admin already initialized; refusing to replace credentials",
      );
    const id = randomUUID();
    await c.query(
      "INSERT INTO users (id,email,password_hash,role) VALUES (?,?,?,?)",
      [id, email, hash, "PARENT_ADMIN"],
    );
    await audit(c, id, "admin.initialize", id, null, { role: "PARENT_ADMIN" });
  });
}
if (process.argv[1]?.match(/cli\.(ts|js)$/)) {
  try {
    switch (process.argv[2]) {
      case "migrate":
        await migrate();
        break;
      case "seed":
        await seed();
        break;
      case "init-admin":
        await initAdmin(
          process.env.ADMIN_EMAIL ?? "",
          process.env.ADMIN_PASSWORD ?? "",
        );
        break;
      default:
        throw new Error("Use migrate, seed, or init-admin");
    }
    console.log("Completed");
  } catch (e) {
    console.error(
      e instanceof z.ZodError
        ? "Invalid configuration or credentials (email, password >=14 characters required)"
        : (e as Error).message,
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
