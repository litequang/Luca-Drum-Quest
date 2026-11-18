# Luca Drum Quest — local pilot handoff

**Current continuation (2026-11-17):** See [AI_HANDOFF_VI.md](AI_HANDOFF_VI.md) for the latest source/commands, 30 passing tests, utf8mb4 migration 004, private SQL recovery and remaining host checks. A supplied host dump used MyISAM and lacked the expected FK constraints; the private repair patch converts engines but does not add missing FKs. Final host integrity/import remains open. Historical 24/29-test and Cloud-only statements below are superseded by WINDOWS_BUILD_REPORT.md.

**Current host-compatibility patch (2026-11-17):** Runtime passwords use hash-wasm Argon2id in an isolated worker with the original PHC parameters; native argon2 is development-only for bidirectional compatibility tests. Pool and content-column migration 004 enforce utf8mb4. Typecheck/build, all 30 tests, clean production-only runtime setup/login/persistence/restart/Unicode checks and production audit passed on Windows. This removes the native Argon2 compiler requirement and prevents charset loss in future writes; it does not prove target-host recovery or restore characters already lost. Native Argon2/toolchain statements in historical results below describe the earlier package.

Updated: 2026-11-17. Branch: `codex/local-backend-admin-pilot`, based on main `36156a64c55effb67ee8cfd8c82cf0b1f3a426a5`. The final commit SHA and PR URL accompany this report in the delivery message; `git rev-parse HEAD` identifies the checked-out version. No production deployment or merge is part of this work.

**Windows follow-up, 2026-11-17:** The owner requested complete PC preparation and a hosting-only handoff. Windows Node 24/MariaDB installation, native dependencies, typecheck/build, 24 automated tests and isolated packaged-runtime HTTP/restart checks now pass. This supersedes the Windows-unverified statements in the historical Cloud report below. Browser rendering/playback and target-host checks remain unverified. See [WINDOWS_BUILD_REPORT.md](WINDOWS_BUILD_REPORT.md) and [HOSTING_BAN_GIAO_VI.md](HOSTING_BAN_GIAO_VI.md).

Owner follow-up: continue local implementation; **video is YouTube embedding only**. PR remains [#2](https://github.com/litequang/Luca-Drum-Quest/pull/2), without merge/deployment. The current head SHA is in the delivery message/PR. No actual child video was uploaded to any service.

Owner follow-up on 2026-11-17 requested first-admin browser setup and PC-build/host-runtime packaging. The upload package and private-key installer are implemented and tested locally; actual HawkHost/Passenger compatibility remains unverified. The step-by-step guide is [HAWKHOST_SETUP.md](HAWKHOST_SETUP.md).

## Implemented

- Node 24 LTS + TypeScript + Fastify REST API, MariaDB migrations, idempotent draft-only curriculum seed and secret-free environment template. Optional local Docker database setup; no frontend framework migration.
- Browser-based `/setup` protected by a private generated SETUP_TOKEN, Origin/body/rate checks, database advisory lock and permanent installation marker. A valid key can migrate/seed a fresh configured DB and create one Admin; concurrent requests, restart, old CLI accounts and removed Admin rows cannot bypass the initialized guard. No default password or public registration.
- `npm run package:host` produces compiled runtime files, matching dependency manifests, a secret-free host template and app.cjs bridge. Windows modules, real .env, private media, tests and backups are excluded. Production-only Linux dependencies and compiled CLI commands were tested outside the source checkout.
- Secure one-time parent initialization, Argon2id passwords, server-side hashed sessions, login/logout, absolute expiry, CSRF/origin protection, login throttling and server role checks. No default credentials or public registration.
- Responsive vanilla-JS `/admin`: project/public introduction, explicit seasons and archival status, complete Season 1 target configuration, low/high lesson estimates, equipment and optional contingency; manual gifts/in-kind/pending/confirmed/void status; expenses and corrections with audit snapshots; season-separated cash and funding calculations.
- Curriculum stages, skill catalogue/prerequisites/home instructions, explicit status changes and teacher feedback recorded by the parent, status history, current learning stage, lesson attendance/cost/homework/teacher notes/next date and private practice logs. No automatically passed skills or invented events.
- Journal create/edit/preview/publish/unpublish/delete, dates/tags/stages and PARENT/FAMILY/PUBLIC visibility. Protected sanitized image attachments for journal and practice, with file/type/pixel/quota limits, metadata removal, deletion and orphan cleanup.
- Optional YouTube video links in journal/practice: direct HTTPS link validation/canonicalization, permission-controlled disclosure, click-to-load fixed-origin youtube-nocookie iframe, no remote thumbnails/autoplay/video uploads. Parent preview, family/public journal and teacher practice evidence support the player.
- Invited TEACHER accounts at `/teacher`, explicitly assigned individual skills/practices; restricted feedback/status updates with actor history, private practice evidence and immediate scope/account revocation. Regrant starts without previous scopes. No teacher access to finance/supporters/lesson costs or unshared records.
- Single-use seven-day family invitations, acceptance, authenticated read-only `/family`, revocation and explicit regrant requiring fresh login. Invitations are manually shared; this task sent no messages or emails.
- Public project/catalogue/approved budget summaries and published public journal API adapter. Unknowns show pending/unavailable, with no demo fallback. A saved campaign target stays independent of the visitor's trial calculator. `index.html`, `styles.css`, `data.js` are unchanged.
- Architecture/API/access matrix, threat model, Windows commands, backup/cleanup requirements and production gates documented. AGENTS, PROJECT_MAP, backend handoff and roadmap updated with the actual local authorization/status.

## Incomplete and limitations

- Video files are excluded by the owner's YouTube-only decision. Actual YouTube playback on a real browser/device remains unverified; URL validation, markup, click-to-load and permissions were tested. YouTube determines the video's privacy; copied unlisted links bypass website sessions, and private videos may require an authorized YouTube account.
- Per-family-member sharing, teacher lesson-feedback scopes and individual image ACLs remain deferred. Teacher access is limited to specifically assigned skills/practices. Images inherit the owning journal/practice permission; parent-entered feedback and authenticated teacher changes have distinct actor IDs.
- Password reset/change, recovery, MFA, automated email delivery, full session-management UI, multi-editor conflict detection and large-data pagination are not implemented. Rate limiting is single-process; review shared limiting/trusted proxies before a clustered deployment.
- Browser visual rendering, Windows/native runtime validation, physical PC/iPad/phone tests, target-host backup verification and a production private-media/permissions review were **not performed**. The Cloud environment advertises a desktop but did not expose a callable desktop/browser control tool. JSDOM is not a real browser/device.
- Audit snapshots retain prior private text and supporter details after corrections/post deletion. Establish restricted audit retention/redaction and backup-deletion policies before using real data. A filesystem deletion failure can leave an inaccessible orphan until cleanup. Access revocation cannot erase previously downloaded copies.
- cPanel/CloudLinux support is unverified. Node 24, native dependencies, MariaDB access, long-running process support, private disk, sufficient memory, HTTPS and protected backups must be confirmed. A supervised Node service on a Linux VM/container host is the portable alternative.
- No payment gateway, banking integration, real donor records, live progress claims, automatic future season generation, merge or production deployment.

## Environment and migration

Validated here on Node **24.22.1**, npm **11.9.0** and MariaDB **11.4.13** (local Docker). Preferred runtime is Node 24 LTS. `migrations/001_initial.sql` plus migrations tracking create the initial schema; `002_teacher_and_practice_media.sql` adds teacher roles/grants and preserves image associations while generalizing ownership to journal/practice records; `003_installation_state.sql` persists first-init completion and protects old CLI-created admins; JSON records are validated and linked inside transactions. Run migrations once at a time. `.env.example` lists DB connection, exact APP_ORIGIN, loopback HOST/PORT, MEDIA_DIR, secure-cookie setting and session duration. Database and media are durable local resources and must be backed up together.

Full Windows instructions: [LOCAL_PILOT_WINDOWS.md](LOCAL_PILOT_WINDOWS.md). Essential sequence from PowerShell after cloning/switching this branch:

```powershell
npm ci
Copy-Item .env.example .env
notepad .env # Choose a private local DB password; retain loopback settings.
docker compose up -d db # Optional; or use a separately installed MariaDB.
# Wait for healthy DB.
npm run db:migrate
npm run db:seed
$credential = Get-Credential -Message 'Local admin email and password (14+ characters)'
$env:ADMIN_EMAIL = $credential.UserName
$env:ADMIN_PASSWORD = $credential.GetNetworkCredential().Password
try { npm run admin:init } finally {
  Remove-Item Env:ADMIN_EMAIL -ErrorAction SilentlyContinue
  Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
  Remove-Variable credential -ErrorAction SilentlyContinue
}
npm run dev
```

Open `http://localhost:3000/admin`; edit Project, save and refresh `http://localhost:3000`. Compiled operation: `npm run typecheck`, `npm run build`, `npm start`. Use the full guide for the separate disposable test database and device HTTPS setup. Never serve the checkout with a generic static server.

## Actual validation results

Final functional checks were run against real MariaDB, not an in-memory replacement. Test credentials and fictional records existed only in ignored/disposable local runtime state.

| Check | Result | Actual exit code |
| --- | --- | --- |
| `DB_PASSWORD=<local-test-value> DB_PORT=3307 TEST_DB_NAME=luca_pilot_test npm test` | 24 passed, 0 failed: 14 integration subtests, integration parent test, 5 DOM interaction tests, 2 private-key/package-guard tests and 2 YouTube parser/player tests | 0 |
| `npm ci` | Clean lockfile installation succeeded (122 packages) | 0 |
| `npm run typecheck` | TypeScript passed | 0 |
| `npm run build` | Runtime-only compiled server passed, with tests excluded by tsconfig.build.json | 0 |
| `npm run db:migrate` against local pilot DB | Initial schema plus upgrades 002/003 applied; existing curriculum/admin preserved and init marker backfilled | 0 |
| `npm run db:seed` twice | Completed both; no duplicate future seasons or fake events | 0 each |
| `npm run admin:init` with randomly generated environment-only password | One-time initialization completed; repeated initialization rejection also tested | 0 |
| Compiled `dist/server/index.js` HTTP smoke | Public page/assets and API 200, protected pages redirect, source/secrets 404, private-stage field excluded, graceful server shutdown 0 | 0 |
| `npm run media:cleanup` / `npm run media:cleanup -- --prune` | Empty local store: zero eligible orphans found/removed; not a backup/restore test | 0 each |
| `docker compose --env-file .env.example config --quiet` with explicit local DB_PASSWORD | Compose syntax validated; does not claim Windows/Docker Desktop execution | 0 |
| Same Compose command without a password | Refused missing DB_PASSWORD as intended | 1 (expected) |
| `npm audit --omit=dev --audit-level=high` | Zero reported production dependency vulnerabilities at check time | 0 |
| `npm run package:host` | Secret-free release directory generated; existing private runtime folders refused | 0 |
| Packaged Linux runtime (`npm ci --omit=dev`, 88 packages) and app.cjs, tested outside source checkout | Empty-DB browser install, login, project edit, compiled migration/seed, restart persistence, permanent setup lock and private-file denial passed; tsx/TypeScript absent | 0 |
| Synthetic encrypted local backup/restore drill | Matching DB counts/private image hash; denied public media; inactive user preserved; sessions/invitations purged; deletion verified in isolated restore instance | 0 |
| `git diff --check` | No whitespace errors | 0 |
| `git diff --exit-code -- index.html styles.css data.js` | Original public HTML, CSS and demo reference file unchanged | 0 |

Initial test runs caught the MariaDB connector's automatic JSON conversion and a secure-cookie test subprocess that did not close its DB pool. These and follow-up checks caught a reserved YouTube playlist placeholder accepted as a video ID and a MariaDB DECIMAL string quota-addition issue. All were corrected; the passing results above refer to the corrected implementation. A JSDOM cross-realm object comparison, CSS serialization assertion and TypeScript narrowing in a test were also corrected. The first-run installer tests recreate only the explicitly disposable `_test` schema, never the local pilot/host database. Dependency audit does not establish production readiness.

Acceptance coverage: 1–12 and 14 have automated API/DB coverage (project editing also has a DOM form test). Criterion 13 has DOM navigation/filter/dialog coverage and preserved HTML/CSS; actual desktop/tablet/mobile visual and touch behavior remains unverified. Secure-cookie configuration is exercised separately; an end-to-end HTTPS browser check remains on the device checklist.

For the host workflow, `/setup` needs the private generated key and is an alternative to the CLI initialization sequence above; do not try to initialize a second parent. Linux runtime packaging was verified locally, not on HawkHost or Windows. No hosting account or production database was accessed.

## Exact real-device checklist for Codex PC

Use a fresh local database, **fictional records/generated images only**, and record browser/OS/device/date plus pass/fail notes. Keep these checks unmarked until performed.

1. On a fresh disposable install, generate SETUP_TOKEN privately, open `/setup`, create an Admin and verify normal login. A blank/wrong key must not create data. Retry/refresh after success and restart: setup must remain closed. For an existing CLI-created Admin, migration 003 must preserve credentials and close setup. Then on Windows, record `node --version` and MariaDB version. Run the guide's migrate/seed/init sequence, typecheck/build/test. Confirm a second initialization refuses to overwrite the parent. Restart the DB and app; original project data remains.
2. Desktop Chrome/Edge at 1440×900 and 1280×800: open each of Hành trình/Giáo trình/Nhật ký/Quỹ Luca via desktop navigation and hash links; reload each. Confirm the active route, readable layout and no horizontal overflow. Test Tab/Enter/Space, visible focus, dialog Escape/backdrop/close and focus return.
3. iPad Safari portrait and landscape (e.g. 768×1024, 1024×768): verify the bottom dock replaces desktop navigation at the existing breakpoint, all four routes work, stage rail preserves its horizontal position, dialogs stay scrollable and safe-area spacing keeps content reachable.
4. iPhone Safari around 390×844 and Android Chrome around 360×800; also small 375px width and landscape below 520px high: test dock taps, stage rail swipes, filters, skill dialogs, journal cards, form keyboard opening, zoom and reduced-motion setting. Check there is no clipped/covered save button or sideways page scroll. Compare the preserved public design with main.
5. For physical LAN devices, first configure a trusted local HTTPS proxy as described in the Windows guide. Set exact HTTPS APP_ORIGIN and COOKIE_SECURE=true, with Node still bound to loopback. In browser cookie tools confirm Secure, HttpOnly, SameSite=Strict and `__Host-luca_session`; no credentials in localStorage. A certificate/origin failure must be fixed, not bypassed by weakening cookies.
6. In a signed-out/private window, open `/admin`, `/family`, `/api/v1/admin/state`, a copied private media URL, `/.env` and `/private-media/...`. Expect login redirect or 401/403/404, with no private record content. Invalid login must fail; repeated attempts must eventually return 429, then recover after the rate window.
7. Sign in as parent. In Project, change description/intro to unique **fictional test** text. Save, refresh the public page, stop/restart Node and refresh again. Confirm the persisted text appears and an HTML-like input is rendered as text.
8. Set a fictional Season 1 target of 1,000,000 VND. Record a confirmed gift 600,000, pending gift 900,000, in-kind item with no cash amount and recorded expense 200,000. Expect received 600,000; spent 200,000; balance 400,000; unfunded 400,000. Confirm audit history identifies corrections and previous values.
9. Add confirmed gift 400,000. Expect received 1,000,000; spent 200,000; balance 800,000; unfunded 0. Change/void an entry and check recalculation/history. Toggle public finance off/on; only approved aggregates appear, never the fictional supporter name or individual contribution detail.
10. Explicitly create a **fictional test future season** with unknown duration/goal/estimates left blank; expect pending values, not an inherited budget. Then explicitly configure a fictional target and gift; confirm both seasons' totals stay separate. Archive it and verify history remains. Season 1 must refuse a duration other than 24 months. Do not treat this test future season as a real campaign.
11. Create a draft journal post with date, tags and stage; preview it. Publish as FAMILY, then view in signed-out and invited-family sessions: absent publicly, visible to family. Publish a separate PUBLIC test post and refresh public Journal; unpublish it and confirm it disappears. PARENT and unpublished entries must never appear to family/visitor sessions.
12. Upload a generated JPEG/PNG/WebP (≤5MB) to a private test post. View as parent and permitted family; copied URL in incognito must fail. Change the post to PARENT and refresh from family; access must fail. Invalid content, video file uploads and >5MB files must be rejected. Enter an approved test YouTube link, verify no frame loads before clicking, then test playback/fullscreen on each target browser; invalid/playlist/non-YouTube links must be rejected. Verify FAMILY/PARENT URLs are absent from public API responses. For private YouTube content, verify its Google-account permissions separately. Cancel a delete confirmation, then confirm deletion; the media endpoint must return 404 and no public folder URL may work.
13. Edit home practice/prerequisites, explicitly record a fictional HOME_READY status and teacher comment, save and refresh; inspect status history. Record a fictional teacher assessment explicitly if testing TEACHER_PASS. Confirm no status auto-passes when saving a lesson/practice. Choose current stage; it appears in Admin and is absent from public project JSON. Log lesson attendance, actual cost, taught/correction skills, homework and next date; add a separate expense only when representing an actual test payment.
14. Generate an invitation, accept once in a separate browser/device, and verify repeat use fails. Family must not access or mutate admin/finance/feedback endpoints. Revoke the invitation/account while family is logged in and refresh: shared feed/API/media must stop working. Regrant access and confirm the old session still fails until a fresh login.
15. Invite a TEACHER, accept in a separate profile, and confirm `/teacher` initially has no assigned records. Explicitly assign one skill/practice; verify only those appear, its image/link is accessible, and guessed/unassigned evidence, family journal and admin/finance endpoints remain denied. Save explicit feedback/status and inspect the recorded teacher actor. Remove a grant while logged in and refresh: access must fail. Revoke/regrant the account; prior sessions/scopes must not revive.
16. Logout and revisit protected endpoints. In an isolated test configuration set SESSION_HOURS=0.01, restart and sign in; after 36+ seconds, refresh to confirm expiry. Restore normal configuration. Check missing-CSRF mutations return 403. Stop/restart once more and confirm saved content persists. A synthetic local encrypted restore drill passed in Cloud; repeat backup/restore with the actual chosen host, consistent media snapshot, protected key management, retention/deletion and token purge before any production approval.

## Owner decisions before production

Confirm the full 24-month Season 1 budget (equipment, fees, actual scheduling and contingency), curriculum and teacher assessment rules; choose the approved public text and consent for each child-media item; choose hosting/HTTPS origin, YouTube rights/consent/privacy settings and image/backup storage budget; define family/teacher scope, password recovery/MFA policy, audit/media retention and deletion-from-backups policy; complete an independent security/permissions review, target-host restore drill and physical-device/YouTube playback checks. Production remains **NO-GO** until those decisions and verification are complete.
