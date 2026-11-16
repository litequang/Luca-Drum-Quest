# Luca Drum Quest — local pilot handoff

Date: 2026-11-16. Branch: `codex/local-backend-admin-pilot`, based on main `36156a64c55effb67ee8cfd8c82cf0b1f3a426a5`. The final commit SHA and PR URL accompany this report in the delivery message; `git rev-parse HEAD` identifies the checked-out version. No production deployment or merge is part of this work.

## Implemented

- Node 24 LTS + TypeScript + Fastify REST API, MariaDB migrations, idempotent draft-only curriculum seed and secret-free environment template. Optional local Docker database setup; no frontend framework migration.
- Secure one-time parent initialization, Argon2id passwords, server-side hashed sessions, login/logout, absolute expiry, CSRF/origin protection, login throttling and server role checks. No default credentials or public registration.
- Responsive vanilla-JS `/admin`: project/public introduction, explicit seasons and archival status, complete Season 1 target configuration, low/high lesson estimates, equipment and optional contingency; manual gifts/in-kind/pending/confirmed/void status; expenses and corrections with audit snapshots; season-separated cash and funding calculations.
- Curriculum stages, skill catalogue/prerequisites/home instructions, explicit status changes and teacher feedback recorded by the parent, status history, current learning stage, lesson attendance/cost/homework/teacher notes/next date and private practice logs. No automatically passed skills or invented events.
- Journal create/edit/preview/publish/unpublish/delete, dates/tags/stages and PARENT/FAMILY/PUBLIC visibility. Protected sanitized image attachments with file/type/pixel/quota limits, metadata removal and deletion; orphan cleanup command.
- Single-use seven-day family invitations, acceptance, authenticated read-only `/family`, revocation and explicit regrant requiring fresh login. Invitations are manually shared; this task sent no messages or emails.
- Public project/catalogue/approved budget summaries and published public journal API adapter. Unknowns show pending/unavailable, with no demo fallback. A saved campaign target stays independent of the visitor's trial calculator. `index.html`, `styles.css`, `data.js` are unchanged.
- Architecture/API/access matrix, threat model, Windows commands, backup/cleanup requirements and production gates documented. AGENTS, PROJECT_MAP, backend handoff and roadmap updated with the actual local authorization/status.

## Incomplete and limitations

- **Video upload/transcoding/playback is blocked**, not production-ready. Only generated JPEG/PNG/WebP images are accepted for pilot testing; no real child media was uploaded.
- Independent TEACHER accounts, per-teacher resource scopes, per-member family sharing and practice-media evidence links are deferred. Parent-entered teacher feedback is not a teacher-authenticated signature. Media permissions inherit the post rather than individual attachment ACLs.
- Password reset/change, recovery, MFA, automated email delivery, full session-management UI, multi-editor conflict detection and large-data pagination are not implemented. Rate limiting is single-process; review shared limiting/trusted proxies before a clustered deployment.
- Browser visual rendering, Windows/native runtime validation, physical PC/iPad/phone tests, a backup/restore drill and a production private-media/permissions review were **not performed**. The Cloud environment advertises a desktop but did not expose a callable desktop/browser control tool. JSDOM is not a real browser/device.
- Audit snapshots retain prior private text and supporter details after corrections/post deletion. Establish restricted audit retention/redaction and backup-deletion policies before using real data. A filesystem deletion failure can leave an inaccessible orphan until cleanup. Access revocation cannot erase previously downloaded copies.
- cPanel/CloudLinux support is unverified. Node 24, native dependencies, MariaDB access, long-running process support, private disk, sufficient memory, HTTPS and protected backups must be confirmed. A supervised Node service on a Linux VM/container host is the portable alternative.
- No payment gateway, banking integration, real donor records, live progress claims, automatic future season generation, merge or production deployment.

## Environment and migration

Validated here on Node **24.22.1**, npm **11.9.0** and MariaDB **11.4.13** (local Docker). Preferred runtime is Node 24 LTS. `migrations/001_initial.sql` plus migrations tracking create the schema; JSON records are validated and linked inside transactions. Run migrations once at a time. `.env.example` lists DB connection, exact APP_ORIGIN, loopback HOST/PORT, MEDIA_DIR, secure-cookie setting and session duration. Database and media are durable local resources and must be backed up together.

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
| `DB_PASSWORD=<local-test-value> DB_PORT=3307 TEST_DB_NAME=luca_pilot_test npm test` | 12 passed, 0 failed: 8 integration subtests, integration parent test and 3 DOM interaction tests | 0 |
| `npm ci` | Clean lockfile installation succeeded (122 packages) | 0 |
| `npm run typecheck` | TypeScript passed | 0 |
| `npm run build` | Compiled server passed | 0 |
| `npm run db:migrate` against local pilot DB | Initial schema applied | 0 |
| `npm run db:seed` twice | Completed both; no duplicate future seasons or fake events | 0 each |
| `npm run admin:init` with randomly generated environment-only password | One-time initialization completed; repeated initialization rejection also tested | 0 |
| Compiled `dist/server/index.js` HTTP smoke | Public page/assets and API 200, protected pages redirect, source/secrets 404, private-stage field excluded, graceful server shutdown 0 | 0 |
| `npm run media:cleanup` / `npm run media:cleanup -- --prune` | Empty local store: zero eligible orphans found/removed; not a backup/restore test | 0 each |
| `docker compose --env-file .env.example config --quiet` with explicit local DB_PASSWORD | Compose syntax validated; does not claim Windows/Docker Desktop execution | 0 |
| Same Compose command without a password | Refused missing DB_PASSWORD as intended | 1 (expected) |
| `npm audit --omit=dev --audit-level=high` | Zero reported production dependency vulnerabilities at check time | 0 |
| `git diff --check` | No whitespace errors | 0 |
| `git diff --exit-code -- index.html styles.css data.js` | Original public HTML, CSS and demo reference file unchanged | 0 |

Initial test runs caught the MariaDB connector's automatic JSON conversion and a secure-cookie test subprocess that did not close its DB pool. Both were corrected; the passing results above refer to the corrected implementation. Dependency audit does not establish production readiness.

Acceptance coverage: 1–12 and 14 have automated API/DB coverage (project editing also has a DOM form test). Criterion 13 has DOM navigation/filter/dialog coverage and preserved HTML/CSS; actual desktop/tablet/mobile visual and touch behavior remains unverified. Secure-cookie configuration is exercised separately; an end-to-end HTTPS browser check remains on the device checklist.

## Exact real-device checklist for Codex PC

Use a fresh local database, **fictional records/generated images only**, and record browser/OS/device/date plus pass/fail notes. Keep these checks unmarked until performed.

1. On Windows, record `node --version` and MariaDB version. Run the guide's migrate/seed/init sequence, typecheck/build/test. Confirm a second initialization refuses to overwrite the parent. Restart the DB and app; original project data remains.
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
12. Upload a generated JPEG/PNG/WebP (≤5MB) to a private test post. View as parent and permitted family; copied URL in incognito must fail. Change the post to PARENT and refresh from family; access must fail. Invalid content, video and >5MB files must be rejected. Cancel a delete confirmation, then confirm deletion; the media endpoint must return 404 and no public folder URL may work.
13. Edit home practice/prerequisites, explicitly record a fictional HOME_READY status and teacher comment, save and refresh; inspect status history. Record a fictional teacher assessment explicitly if testing TEACHER_PASS. Confirm no status auto-passes when saving a lesson/practice. Choose current stage; it appears in Admin and is absent from public project JSON. Log lesson attendance, actual cost, taught/correction skills, homework and next date; add a separate expense only when representing an actual test payment.
14. Generate an invitation, accept once in a separate browser/device, and verify repeat use fails. Family must not access or mutate admin/finance/feedback endpoints. Revoke the invitation/account while family is logged in and refresh: shared feed/API/media must stop working. Regrant access and confirm the old session still fails until a fresh login.
15. Logout and revisit protected endpoints. In an isolated test configuration set SESSION_HOURS=0.01, restart and sign in; after 36+ seconds, refresh to confirm expiry. Restore normal configuration. Check missing-CSRF mutations return 403. Stop/restart once more and confirm saved content persists. Separately plan and execute an encrypted backup/restore drill into an isolated instance before any production approval.

## Owner decisions before production

Confirm the full 24-month Season 1 budget (equipment, fees, actual scheduling and contingency), curriculum and teacher assessment rules; choose the approved public text and consent for each child-media item; choose hosting/HTTPS origin, safe video processing/storage and expected storage/egress budget; define family/teacher scope, password recovery/MFA policy, audit/media retention and deletion-from-backups policy; complete an independent security/permissions review, restore drill and physical-device checks. Production remains **NO-GO** until those decisions and verification are complete.
