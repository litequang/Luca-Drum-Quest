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
process.env.SETUP_TOKEN = randomBytes(32).toString("hex");
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
    // Recreate only the explicitly configured disposable _test schema to exercise a truly empty install.
    for (const table of [
      "media",
      "teacher_grants",
      "invitations",
      "sessions",
      "skill_history",
      "audit_log",
      "records",
      "users",
      "project",
      "seasons",
      "installation_state",
      "migrations",
    ])
      await pool.query("DROP TABLE IF EXISTS " + table);
    app = await buildApp();
    await t.test(
      "browser setup stays disabled without a key and throttles invalid keys without creating tables",
      async () => {
        const key = config.SETUP_TOKEN;
        config.SETUP_TOKEN = "";
        assert.equal((await app.inject("/setup")).statusCode, 302);
        assert.equal(
          (
            await request(
              "POST",
              "/setup",
              { email, password, confirmPassword: password },
              false,
            )
          ).statusCode,
          404,
        );
        config.SETUP_TOKEN = key;
        await app.close();
        app = await buildApp();
        assert.equal(
          (
            await app.inject({
              url: "/setup",
              headers: {
                cookie: cookieName + "=" + randomBytes(32).toString("hex"),
              },
            })
          ).statusCode,
          200,
        );
        for (let i = 0; i < 6; i++)
          assert.equal(
            (
              await request(
                "POST",
                "/setup",
                { email, password, confirmPassword: password },
                false,
                { "x-setup-token": "0".repeat(64) },
              )
            ).statusCode,
            i < 5 ? 403 : 429,
          );
        const tables = await pool.query(
          "SELECT COUNT(*) n FROM information_schema.tables WHERE table_schema=?",
          [config.DB_NAME],
        );
        assert.equal(tables[0].n, 0);
        await app.close();
        app = await buildApp();
      },
    );
    await t.test(
      "first browser setup validates origin/confirmation, migrates/seeds and creates exactly one admin under concurrency",
      async () => {
        const headers = { "x-setup-token": config.SETUP_TOKEN };
        assert.equal(
          (
            await request(
              "POST",
              "/setup",
              { email, password, confirmPassword: password },
              false,
              { ...headers, origin: "https://evil.invalid" },
            )
          ).statusCode,
          403,
        );
        assert.equal(
          (
            await request(
              "POST",
              "/setup",
              { email, password, confirmPassword: "different" },
              false,
              headers,
            )
          ).statusCode,
          400,
        );
        const responses = await Promise.all([
          request(
            "POST",
            "/setup",
            { email, password, confirmPassword: password },
            false,
            headers,
          ),
          request(
            "POST",
            "/setup",
            { email, password, confirmPassword: password },
            false,
            headers,
          ),
        ]);
        assert.equal(
          responses.filter((r) => r.statusCode === 200).length,
          1,
          JSON.stringify(
            responses.map((r) => ({ status: r.statusCode, body: r.body })),
          ),
        );
        assert.equal(
          responses.filter((r) => [404, 409].includes(r.statusCode)).length,
          1,
        );
        assert.equal(
          (
            await pool.query(
              "SELECT COUNT(*) n FROM users WHERE role='PARENT_ADMIN'",
            )
          )[0].n,
          1,
        );
        assert.equal(
          (await pool.query("SELECT COUNT(*) n FROM seasons"))[0].n,
          1,
        );
        assert.equal(
          (await pool.query("SELECT COUNT(*) n FROM sessions"))[0].n,
          0,
        );
        const marker = (
          await pool.query(
            "SELECT initialized_at FROM installation_state WHERE id=1",
          )
        )[0];
        assert.ok(marker.initialized_at);
        assert.equal(
          (await pool.query("SELECT COUNT(*) n FROM migrations"))[0].n,
          3,
        );
        const audits = JSON.stringify(
          await pool.query("SELECT before_data,after_data FROM audit_log"),
        );
        assert.equal(audits.includes(config.SETUP_TOKEN), false);
        assert.equal(audits.includes(password), false);
      },
    );
    await t.test(
      "setup remains closed after restart and after removal of the original admin row",
      async () => {
        await app.close();
        app = await buildApp();
        assert.equal((await app.inject("/setup")).statusCode, 302);
        const user = (
          await pool.query("SELECT * FROM users WHERE role='PARENT_ADMIN'")
        )[0];
        await pool.query("DELETE FROM users WHERE id=?", [user.id]);
        assert.equal(
          (
            await request(
              "POST",
              "/setup",
              { email, password, confirmPassword: password },
              false,
              { "x-setup-token": config.SETUP_TOKEN },
            )
          ).statusCode,
          404,
        );
        await assert.rejects(initAdmin(email, password), /already initialized/);
        // Start an independent CLI initialization fixture; never do this reset outside a disposable test DB.
        await pool.query(
          "UPDATE installation_state SET initialized_at=NULL WHERE id=1",
        );
      },
    );
    await seed();
    await seed();
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
        // MariaDB SUM() is a DECIMAL string: adding output bytes must be numeric.
        await pool.query("UPDATE media SET size=? WHERE id=?", [
          10000000,
          imageId,
        ]);
        assert.equal((await upload(parentPost, image)).statusCode, 200);
        await pool.query("UPDATE media SET size=? WHERE id=?", [
          own.rawPayload.length,
          imageId,
        ]);

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
      "YouTube links normalize safely and respect journal publication/visibility",
      async () => {
        const data = {
          seasonId,
          title: "Fictional YouTube entry",
          description: "Placeholder only",
          stageId: null,
          date: "2026-11-16",
          tags: [],
          kind: "Video luyện tập",
          visibility: "FAMILY",
          published: true,
          youtubeUrl: "https://youtu.be/AbC_123-xYz?t=10",
        };
        const id = await create("journal", data);
        let current = await json("GET", "/admin/state");
        assert.equal(
          current.records.find((r: any) => r.id === id).youtubeUrl,
          "https://www.youtube.com/watch?v=AbC_123-xYz",
        );
        assert.equal(
          JSON.stringify(await json("GET", "/public/journal")).includes(
            "AbC_123-xYz",
          ),
          false,
        );
        await json("PUT", "/admin/records/journal/" + id, {
          ...data,
          visibility: "PUBLIC",
        });
        assert.equal(
          (await json("GET", "/public/journal")).find((r: any) => r.id === id)
            .youtubeUrl,
          "https://www.youtube.com/watch?v=AbC_123-xYz",
        );
        await json("PUT", "/admin/records/journal/" + id, {
          ...data,
          visibility: "PUBLIC",
          published: false,
        });
        assert.equal(
          JSON.stringify(await json("GET", "/public/journal")).includes(
            "AbC_123-xYz",
          ),
          false,
        );
        for (const url of [
          "javascript:alert(1)",
          "http://youtu.be/AbC_123-xYz",
          "https://youtube.com.evil.invalid/watch?v=AbC_123-xYz",
          "https://www.youtube.com/playlist?list=anything",
          "https://user@youtube.com/watch?v=AbC_123-xYz",
        ])
          assert.equal(
            (
              await request("POST", "/admin/records/journal", {
                ...data,
                youtubeUrl: url,
              })
            ).statusCode,
            400,
          );
        const headers = (await app.inject("/")).headers;
        assert.match(
          String(headers["content-security-policy"]),
          /frame-src https:\/\/www\.youtube-nocookie\.com/,
        );
        await json("DELETE", "/admin/journal/" + id);
      },
    );
    await t.test(
      "teacher invitations, per-record assignments, feedback, private practice evidence and revocation",
      async () => {
        assert.equal((await app.inject("/teacher")).statusCode, 302);
        assert.equal(
          (await request("GET", "/teacher/state", undefined, false)).statusCode,
          401,
        );
        assert.equal((await request("GET", "/teacher/state")).statusCode, 403);
        assert.equal(
          (
            await request("POST", "/admin/invitations", {
              label: "Invalid elevation",
              role: "PARENT_ADMIN",
            })
          ).statusCode,
          400,
        );
        const invite = await json("POST", "/admin/invitations", {
          label: "Fictional teacher",
          role: "TEACHER",
        });
        const invite2 = await json("POST", "/admin/invitations", {
          label: "Second fictional teacher",
          role: "TEACHER",
        });
        async function accept(token: string, email: string) {
          const r = await request(
            "POST",
            "/auth/accept-invitation",
            { token, email, password },
            false,
          );
          assert.equal(r.statusCode, 200, r.body);
          assert.equal(r.json().role, "TEACHER");
          return {
            cookie: String(r.headers["set-cookie"]).split(";")[0],
            "x-csrf-token": r.json().csrf,
          };
        }
        const th = await accept(invite.token, "teacher@example.invalid"),
          other = await accept(invite2.token, "other-teacher@example.invalid");
        const user = (
          await pool.query("SELECT id FROM users WHERE email=?", [
            "teacher@example.invalid",
          ])
        )[0];
        const current = await json("GET", "/admin/state"),
          skill = current.records.find((r: any) => r.entity === "skills");
        const practice = await create("practices", {
          seasonId,
          date: "2026-11-16",
          skillIds: [skill.id],
          minutes: 5,
          notes: "Fictional assigned evidence",
          youtubeUrl: "https://www.youtube.com/watch?v=ZyX-987_CbA",
        });
        const hidden = await create("practices", {
          seasonId,
          date: "2026-11-16",
          skillIds: [],
          minutes: null,
          notes: "Unshared parent-only evidence",
        });
        const image = await sharp({
          create: { width: 4, height: 4, channels: 3, background: "#78aabb" },
        })
          .png()
          .toBuffer();
        const uploadPractice = async (id: string) => {
          const r = await request(
            "POST",
            "/admin/practices/" + id + "/media",
            multipartBody(image, "image/png"),
            true,
            { "content-type": "multipart/form-data; boundary=luca-boundary" },
          );
          assert.equal(r.statusCode, 200, r.body);
          return r.json().id;
        };
        const evidence = await uploadPractice(practice),
          hiddenEvidence = await uploadPractice(hidden);
        assert.deepEqual(
          (await request("GET", "/teacher/state", undefined, false, th)).json(),
          { records: [] },
        );
        await json("PUT", "/admin/users/" + user.id + "/grants", {
          recordIds: [skill.id, practice],
        });
        const records = (
          await request("GET", "/teacher/state", undefined, false, th)
        ).json().records;
        assert.equal(records.length, 2);
        assert.ok(
          records.some(
            (r: any) =>
              r.id === practice &&
              r.youtubeUrl === "https://www.youtube.com/watch?v=ZyX-987_CbA",
          ),
        );
        assert.equal(
          JSON.stringify(records).includes("supporterPrivate"),
          false,
        );
        assert.equal(
          (
            await request(
              "GET",
              "/practices/" + practice + "/media",
              undefined,
              false,
              th,
            )
          ).statusCode,
          200,
        );
        assert.equal(
          (await request("GET", "/media/" + evidence, undefined, false, th))
            .statusCode,
          200,
        );
        for (const hdr of [other, {}])
          assert.equal(
            (await request("GET", "/media/" + evidence, undefined, false, hdr))
              .statusCode,
            404,
          );
        assert.equal(
          (
            await request(
              "GET",
              "/media/" + hiddenEvidence,
              undefined,
              false,
              th,
            )
          ).statusCode,
          404,
        );
        assert.equal(
          (
            await request(
              "GET",
              "/practices/" + hidden + "/media",
              undefined,
              false,
              th,
            )
          ).statusCode,
          404,
        );
        assert.equal(
          (await request("GET", "/journal/" + practice + "/media")).statusCode,
          404,
        );
        assert.equal(
          (await request("GET", "/admin/state", undefined, false, th))
            .statusCode,
          403,
        );
        const feedback = {
          status: "TEACHER_PASS",
          teacherFeedback: "Fictional explicit teacher assessment",
          teacherApproved: true,
        };
        assert.equal(
          (
            await request(
              "PATCH",
              "/teacher/skills/" + skill.id,
              feedback,
              false,
              other,
            )
          ).statusCode,
          404,
        );
        assert.equal(
          (
            await request(
              "PATCH",
              "/teacher/skills/" + skill.id,
              { ...feedback, title: "Cannot change catalogue" },
              false,
              th,
            )
          ).statusCode,
          400,
        );
        const saved = await request(
          "PATCH",
          "/teacher/skills/" + skill.id,
          feedback,
          false,
          th,
        );
        assert.equal(saved.statusCode, 200, saved.body);
        const history = (await json("GET", "/admin/state")).skillHistory.find(
          (r: any) => r.skill_id === skill.id && r.actor_id === user.id,
        );
        assert.equal(history.feedback, feedback.teacherFeedback);
        assert.equal(
          (
            await request(
              "PUT",
              "/admin/users/" + user.id + "/grants",
              { recordIds: [] },
              false,
              th,
            )
          ).statusCode,
          403,
        );
        const finance = current.records.find(
          (r: any) => r.entity === "contributions",
        );
        assert.equal(
          (
            await request("PUT", "/admin/users/" + user.id + "/grants", {
              recordIds: [finance.id],
            })
          ).statusCode,
          400,
        );
        assert.equal(
          (await request("GET", "/teacher/state", undefined, false, th)).json()
            .records.length,
          2,
        );
        await json("PUT", "/admin/users/" + user.id + "/grants", {
          recordIds: [skill.id],
        });
        assert.equal(
          (await request("GET", "/media/" + evidence, undefined, false, th))
            .statusCode,
          404,
        );
        await json("PUT", "/admin/users/" + user.id + "/grants", {
          recordIds: [skill.id, practice],
        });
        await json("DELETE", "/admin/invitations/" + invite.id);
        assert.equal(
          (await request("GET", "/teacher/state", undefined, false, th))
            .statusCode,
          401,
        );
        assert.equal(
          (await request("GET", "/media/" + evidence, undefined, false, th))
            .statusCode,
          404,
        );
        await json("PUT", "/admin/users/" + user.id + "/access");
        assert.equal(
          (await request("GET", "/teacher/state", undefined, false, th))
            .statusCode,
          401,
        );
        assert.equal(
          (
            await pool.query("SELECT * FROM teacher_grants WHERE user_id=?", [
              user.id,
            ])
          ).length,
          0,
        );
        await json("DELETE", "/admin/practices/" + practice);
        await json("DELETE", "/admin/practices/" + hidden);
        assert.equal(
          (await request("GET", "/media/" + evidence)).statusCode,
          404,
        );
      },
    );
    await t.test(
      "legacy admin installs refuse web setup before migration 003 and backfill the initialized marker",
      async () => {
        await pool.query("DROP TABLE installation_state");
        await pool.query(
          "DELETE FROM migrations WHERE name='003_installation_state.sql'",
        );
        assert.equal((await app.inject("/setup")).statusCode, 302);
        assert.equal(
          (
            await request(
              "POST",
              "/setup",
              { email, password, confirmPassword: password },
              false,
              { "x-setup-token": config.SETUP_TOKEN },
            )
          ).statusCode,
          404,
        );
        await migrate();
        assert.ok(
          (
            await pool.query(
              "SELECT initialized_at FROM installation_state WHERE id=1",
            )
          )[0].initialized_at,
        );
        await assert.rejects(initAdmin(email, password), /already initialized/);
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
