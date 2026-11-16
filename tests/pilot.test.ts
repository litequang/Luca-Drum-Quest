import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import sharp from "sharp";
// Never mutate a regular pilot DB. This suite requires a dedicated disposable DB.
if (!process.env.TEST_DB_NAME?.endsWith("_test"))
  throw new Error("TEST_DB_NAME must name a disposable database ending _test");
process.env.DB_NAME = process.env.TEST_DB_NAME;
process.env.MEDIA_DIR = resolve("work/test-media");
const { pool } = await import("../server/db.js");
const { migrate, seed, initAdmin } = await import("../server/cli.js");
const { buildApp } = await import("../server/app.js");
const { config } = await import("../server/config.js");
const { cookieName, digest } = await import("../server/auth.js");
const password = randomBytes(24).toString("hex");
const email = "parent@example.invalid";
let app: Awaited<ReturnType<typeof buildApp>>;
let cookie = "",
  csrf = "";
async function request(
  method: string,
  url: string,
  payload?: any,
  auth = true,
  headers: any = {},
) {
  return app.inject({
    method: method as any,
    url: "/api/v1" + url,
    payload,
    headers: {
      origin: config.APP_ORIGIN,
      ...(auth ? { cookie, "x-csrf-token": csrf } : {}),
      ...headers,
    },
  });
}
async function json(method: string, url: string, payload?: any) {
  const r = await request(method, url, payload);
  assert.equal(r.statusCode, 200, r.body);
  return r.json();
}
async function create(kind: string, data: any) {
  return (await json("POST", "/admin/records/" + kind, data)).id;
}
async function login() {
  const r = await request("POST", "/auth/login", { email, password }, false);
  assert.equal(r.statusCode, 200, r.body);
  cookie = String(r.headers["set-cookie"]).split(";")[0];
  csrf = r.json().csrf;
  return r;
}
await test("MariaDB local pilot acceptance and security", async (t) => {
  try {
    await migrate();
    // Ordered deletes only within explicitly named test DB; preserve migration tracking.
    for (const table of [
      "media",
      "invitations",
      "sessions",
      "skill_history",
      "audit_log",
      "records",
      "users",
      "project",
      "seasons",
    ])
      await pool.query("DELETE FROM " + table);
    await seed();
    await seed();
    app = await buildApp();
    await t.test(
      "secure one-time initialization, invalid login, protected routes and cookie flags",
      async () => {
        await initAdmin(email, password);
        await assert.rejects(initAdmin(email, password), /already initialized/);
        assert.equal(
          (
            await request(
              "POST",
              "/auth/login",
              { email, password: "incorrect" },
              false,
            )
          ).statusCode,
          401,
        );
        assert.equal(
          (await request("GET", "/admin/state", undefined, false)).statusCode,
          401,
        );
        assert.equal((await app.inject("/admin")).statusCode, 302);
        assert.equal(
          (
            await request("POST", "/auth/login", { email, password }, false, {
              origin: "https://evil.invalid",
            })
          ).statusCode,
          403,
        );
        const r = await login();
        assert.match(String(r.headers["set-cookie"]), /HttpOnly/);
        assert.doesNotMatch(
          String((await app.inject("/")).headers["content-security-policy"]),
          /upgrade-insecure-requests/,
        );
        const secureProfile = spawnSync(
          process.execPath,
          [
            "--import",
            "tsx",
            "--input-type=module",
            "-e",
            "import {cookieName,cookieOptions} from './server/auth.ts'; import {pool} from './server/db.ts'; console.log(JSON.stringify({cookieName,cookieOptions})); await pool.end();",
          ],
          {
            env: {
              ...process.env,
              APP_ORIGIN: "https://local.example.invalid",
              COOKIE_SECURE: "true",
            },
            encoding: "utf8",
            timeout: 10000,
          },
        );
        assert.equal(secureProfile.status, 0, secureProfile.stderr);
        const secure = JSON.parse(secureProfile.stdout);
        assert.equal(secure.cookieOptions.secure, true);
        assert.equal(secure.cookieName, "__Host-luca_session");

        assert.match(String(r.headers["set-cookie"]), /SameSite=Strict/i);
        assert.equal(
          (
            await request(
              "POST",
              "/admin/invitations",
              { label: "test" },
              true,
              { "x-csrf-token": "0".repeat(64) },
            )
          ).statusCode,
          403,
        );
        assert.equal(
          (
            await request(
              "POST",
              "/admin/invitations",
              { label: "test" },
              true,
              { "x-csrf-token": "é".repeat(64) },
            )
          ).statusCode,
          403,
        );
      },
    );
    let state = await json("GET", "/admin/state");
    const seasonId = state.seasons[0].id;
    let season = { ...state.seasons[0] };
    delete season.id;
    assert.equal(state.seasons.length, 1);
    assert.equal(
      "currentStageId" in (await json("GET", "/public/project")).season,
      false,
    );

    assert.equal(
      state.records.filter(
        (r: any) =>
          r.entity === "journal" ||
          r.entity === "lessons" ||
          r.entity === "contributions",
      ).length,
      0,
    );
    await t.test(
      "project text persists across app restart and public refresh; XSS stored as text",
      async () => {
        await json("PUT", "/admin/project", {
          ...state.project,
          description: "Fictional pilot update <script>alert(1)</script>",
          intro: "Fictional intro",
        });
        await app.close();
        app = await buildApp();
        assert.equal(
          (await json("GET", "/public/project")).description,
          "Fictional pilot update <script>alert(1)</script>",
        );
        assert.equal(
          (await json("GET", "/admin/state")).project.intro,
          "Fictional intro",
        );
        assert.equal(
          (
            await request("PUT", "/admin/project", {
              description: "x",
              intro: "x",
              currentSeasonId: randomBytes(8).toString("hex"),
            })
          ).statusCode,
          400,
        );
        assert.equal((await app.inject("/.env")).statusCode, 404);
        assert.equal((await app.inject("/server/app.ts")).statusCode, 404);
      },
    );
    await t.test(
      "manual finance corrections, per-season totals, pending/in-kind exclusion and independent spending",
      async () => {
        season = { ...season, fundingGoal: 1000, shareFinance: true };
        await json("PUT", "/admin/seasons/" + seasonId, season);
        const unconfigured = await json("POST", "/admin/seasons", {
          ...season,
          ordinal: 3,
          title: "Explicit unconfigured test draft",
          durationMonths: null,
          fundingGoal: null,
          plannedLessons: null,
          lessonLow: null,
          lessonHigh: null,
          equipmentBudget: null,
          currentStageId: null,
        });
        const draftTotals = (await json("GET", "/admin/state")).totals.find(
          (s: any) => s.seasonId === unconfigured.id,
        );
        assert.equal(draftTotals.lessonEstimateLow, null);
        assert.equal(draftTotals.unfunded, null);

        assert.equal(
          (
            await request("PUT", "/admin/seasons/" + seasonId, {
              ...season,
              durationMonths: 12,
            })
          ).statusCode,
          400,
        );
        const second = await json("POST", "/admin/seasons", {
          ...season,
          ordinal: 2,
          title: "Explicit fictional test season",
          durationMonths: 12,
          fundingGoal: 2000,
        });
        const gift = {
          seasonId,
          date: "2026-11-16",
          kind: "gift",
          amount: 1200,
          description: "Fictional test only",
          supporterPrivate: "Fictional supporter",
          status: "confirmed",
          publicAcknowledgement: false,
        };
        const id = await create("contributions", gift);
        await create("contributions", {
          ...gift,
          status: "pending",
          amount: 9000,
        });
        await create("contributions", {
          ...gift,
          kind: "in_kind",
          amount: null,
        });
        await create("contributions", {
          ...gift,
          seasonId: second.id,
          amount: 200,
        });
        await create("expenses", {
          seasonId,
          date: "2026-11-16",
          amount: 400,
          category: "lesson",
          description: "Fictional",
          status: "recorded",
          lessonId: null,
        });
        let s = await json("GET", "/admin/state"),
          a = s.totals.find((x: any) => x.seasonId === seasonId),
          b = s.totals.find((x: any) => x.seasonId === second.id);
        assert.deepEqual(
          [a.received, a.spent, a.balance, a.unfunded, a.targetReached],
          [1200, 400, 800, 0, true],
        );
        assert.deepEqual([b.received, b.spent, b.unfunded], [200, 0, 1800]);
        const publicTotals = await json("GET", "/public/budget");
        assert.equal(publicTotals.received, 1200);
        assert.equal(
          JSON.stringify(publicTotals).includes("Fictional supporter"),
          false,
        );
        await json("PUT", "/admin/records/contributions/" + id, {
          ...gift,
          amount: 1100,
        });
        const log = await pool.query(
          "SELECT before_data,after_data FROM audit_log WHERE target_id=? ORDER BY id DESC",
          [id],
        );
        assert.equal(JSON.parse(log[0].before_data).amount, 1200);
        assert.equal(JSON.parse(log[0].after_data).amount, 1100);
        await json("PUT", "/admin/records/contributions/" + id, {
          ...gift,
          status: "void",
        });
        assert.equal((await json("GET", "/public/budget")).received, 0);
        await json("PUT", "/admin/seasons/" + seasonId, {
          ...season,
          shareFinance: false,
        });
        assert.deepEqual(await json("GET", "/public/budget"), {
          available: false,
        });
      },
    );
    let publicPost = "",
      familyPost = "",
      parentPost = "",
      imageId = "";
    await t.test(
      "journal publish/unpublish and public visibility boundary",
      async () => {
        const post = {
          seasonId,
          title: "Fictional diary",
          description: "Only placeholder text",
          stageId: null,
          date: "2026-11-16",
          tags: ["test"],
          kind: "Bài học",
          visibility: "PUBLIC",
          published: false,
        };
        publicPost = await create("journal", post);
        familyPost = await create("journal", {
          ...post,
          visibility: "FAMILY",
          published: true,
        });
        parentPost = await create("journal", {
          ...post,
          visibility: "PARENT",
          published: true,
        });
        assert.equal((await json("GET", "/public/journal")).length, 0);
        await json("PUT", "/admin/records/journal/" + publicPost, {
          ...post,
          published: true,
        });
        assert.deepEqual(
          (await json("GET", "/public/journal")).map((p: any) => p.id),
          [publicPost],
        );
        await json("PUT", "/admin/records/journal/" + publicPost, post);
        assert.equal((await json("GET", "/public/journal")).length, 0);
      },
    );
    await t.test(
      "skills, lesson and practice records persist; history and reference validation",
      async () => {
        const skill = state.records.find((r: any) => r.entity === "skills"),
          { id, entity, ...data } = skill;
        await json("PUT", "/admin/records/skills/" + id, {
          ...data,
          status: "HOME_READY",
          teacherFeedback: "Fictional teacher feedback",
        });
        let current = await json("GET", "/admin/state");
        assert.equal(
          current.records.find((r: any) => r.id === id).status,
          "HOME_READY",
        );
        assert.ok(current.skillHistory.some((r: any) => r.skill_id === id));
        await json("PUT", "/admin/records/skills/" + id, {
          ...data,
          status: "TEACHER_PASS",
          teacherFeedback: "Fictional explicit assessment",
        });
        assert.equal(
          (
            await request("PUT", "/admin/records/skills/" + id, {
              ...data,
              prerequisites: [id],
            })
          ).statusCode,
          400,
        );
        const cat = await json("GET", "/public/catalogue");
        assert.equal("teacherFeedback" in cat.skills[0], false);
        assert.equal("status" in cat.skills[0], false);
        await create("lessons", {
          seasonId,
          date: "2026-11-16",
          attendance: "attended",
          cost: 500000,
          skillsTaught: [id],
          skillsCorrect: [],
          homework: "Fictional",
          teacherComments: "Fictional",
          nextLesson: null,
        });
        await create("practices", {
          seasonId,
          date: "2026-11-16",
          skillIds: [id],
          minutes: 5,
          notes: "Fictional",
        });
        current = await json("GET", "/admin/state");
        assert.equal(
          current.records.filter((r: any) => r.entity === "lessons").length,
          1,
        );
      },
    );
    function multipartBody(bytes: Buffer, type = "image/jpeg") {
      return Buffer.concat([
        Buffer.from(
          '--luca-boundary\r\nContent-Disposition: form-data; name="file"; filename="../../unsafe.jpg"\r\nContent-Type: ' +
            type +
            "\r\n\r\n",
        ),
        bytes,
        Buffer.from("\r\n--luca-boundary--\r\n"),
      ]);
    }
    const upload = async (post: string, bytes: Buffer, type?: string) =>
      request(
        "POST",
        "/admin/journal/" + post + "/media",
        multipartBody(bytes, type),
        true,
        { "content-type": "multipart/form-data; boundary=luca-boundary" },
      );
    await t.test(
      "private image sanitization, authorization, invalid file and upload limits",
      async () => {
        const image = await sharp({
          create: { width: 4, height: 4, channels: 3, background: "#f9aa77" },
        })
          .jpeg()
          .withMetadata()
          .toBuffer();
        const r = await upload(familyPost, image);
        assert.equal(r.statusCode, 200, r.body);
        imageId = r.json().id;
        assert.equal(
          (await request("GET", "/media/" + imageId, undefined, false))
            .statusCode,
          404,
        );
        const own = await request("GET", "/media/" + imageId);
        assert.equal(own.statusCode, 200);
        assert.match(String(own.headers["cache-control"]), /no-store/);
        const meta = await sharp(own.rawPayload).metadata();
        assert.equal(meta.format, "webp");
        assert.equal(meta.exif, undefined);
        await pool.query("UPDATE media SET size=? WHERE id=?", [
          200 * 1024 * 1024,
          imageId,
        ]);
        assert.equal((await upload(parentPost, image)).statusCode, 413);
        await pool.query("UPDATE media SET size=? WHERE id=?", [
          own.rawPayload.length,
          imageId,
        ]);

        assert.equal(
          (await upload(parentPost, Buffer.from("<script>x</script>")))
            .statusCode,
          415,
        );
        assert.equal(
          (await upload(parentPost, Buffer.from("mock-video"), "video/mp4"))
            .statusCode,
          415,
        );
        assert.equal(
          (await upload(parentPost, Buffer.alloc(6 * 1024 * 1024))).statusCode,
          413,
        );
        assert.equal(
          (await app.inject("/private-media/" + imageId)).statusCode,
          404,
        );
        assert.equal(
          (await request("GET", "/media/..%2f..%2f.env")).statusCode,
          400,
        );
      },
    );
    await t.test(
      "one-use invitations, family read-only scope, media permission and immediate revocation",
      async () => {
        const inv = await json("POST", "/admin/invitations", {
          label: "Fictional family",
        });
        const r = await request(
          "POST",
          "/auth/accept-invitation",
          { token: inv.token, email: "family@example.invalid", password },
          false,
        );
        assert.equal(r.statusCode, 200, r.body);
        const familyCookie = String(r.headers["set-cookie"]).split(";")[0],
          familyCsrf = r.json().csrf;
        const headers = { cookie: familyCookie, "x-csrf-token": familyCsrf };
        const posts = await request(
          "GET",
          "/family/journal",
          undefined,
          false,
          headers,
        );
        assert.deepEqual(
          posts.json().map((p: any) => p.id),
          [familyPost],
        );
        assert.equal(
          (await request("GET", "/admin/state", undefined, false, headers))
            .statusCode,
          403,
        );
        assert.equal(
          (
            await request(
              "PUT",
              "/admin/project",
              state.project,
              false,
              headers,
            )
          ).statusCode,
          403,
        );
        assert.equal(
          (await request("GET", "/media/" + imageId, undefined, false, headers))
            .statusCode,
          200,
        );
        assert.equal(
          (
            await request(
              "GET",
              "/journal/" + parentPost + "/media",
              undefined,
              false,
              headers,
            )
          ).statusCode,
          404,
        );
        assert.equal(
          (
            await request(
              "POST",
              "/auth/accept-invitation",
              { token: inv.token, email: "again@example.invalid", password },
              false,
            )
          ).statusCode,
          400,
        );
        await json("DELETE", "/admin/invitations/" + inv.id);
        assert.equal(
          (await request("GET", "/family/journal", undefined, false, headers))
            .statusCode,
          401,
        );
        assert.equal(
          (await request("GET", "/media/" + imageId, undefined, false, headers))
            .statusCode,
          404,
        );

        const account = (
          await pool.query("SELECT id FROM users WHERE email=?", [
            "family@example.invalid",
          ])
        )[0];
        await json("PUT", "/admin/users/" + account.id + "/access");
        assert.equal(
          (await request("GET", "/family/journal", undefined, false, headers))
            .statusCode,
          401,
        );
        const renewed = await request(
          "POST",
          "/auth/login",
          { email: "family@example.invalid", password },
          false,
        );
        assert.equal(renewed.statusCode, 200, renewed.body);
        const renewedHeaders = {
          cookie: String(renewed.headers["set-cookie"]).split(";")[0],
          "x-csrf-token": renewed.json().csrf,
        };
        assert.equal(
          (
            await request(
              "GET",
              "/family/journal",
              undefined,
              false,
              renewedHeaders,
            )
          ).statusCode,
          200,
        );
        await json("DELETE", "/admin/users/" + account.id);
        assert.equal(
          (
            await request(
              "GET",
              "/family/journal",
              undefined,
              false,
              renewedHeaders,
            )
          ).statusCode,
          401,
        );
        const expired = await json("POST", "/admin/invitations", {
          label: "Expired fixture",
        });
        await pool.query(
          "UPDATE invitations SET expires_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 DAY) WHERE id=?",
          [expired.id],
        );
        assert.equal(
          (
            await request(
              "POST",
              "/auth/accept-invitation",
              {
                token: expired.token,
                email: "expired@example.invalid",
                password,
              },
              false,
            )
          ).statusCode,
          400,
        );
      },
    );
    await t.test(
      "media deletion, logout invalidation, expiration and login throttling",
      async () => {
        await json("DELETE", "/admin/media/" + imageId);
        assert.equal(
          (await request("GET", "/media/" + imageId)).statusCode,
          404,
        );
        await json("DELETE", "/admin/journal/" + parentPost);
        const old = cookie;
        await json("POST", "/auth/logout");
        assert.equal(
          (await request("GET", "/me", undefined, false, { cookie: old }))
            .statusCode,
          401,
        );
        await login();
        await pool.query(
          "UPDATE sessions SET expires_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 SECOND) WHERE token_hash=?",
          [digest(cookie.split("=")[1])],
        );
        assert.equal((await request("GET", "/me")).statusCode, 401);
        const codes = [];
        for (let i = 0; i < 7; i++)
          codes.push(
            (
              await request(
                "POST",
                "/auth/login",
                { email, password: "bad" },
                false,
              )
            ).statusCode,
          );
        assert.ok(codes.includes(429));
      },
    );
  } finally {
    if (app!) await app.close();
    await pool.end();
    await rm(process.env.MEDIA_DIR!, { recursive: true, force: true });
  }
});
