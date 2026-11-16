# Launch the local pilot on Windows

Use PowerShell from the repository root. Install Git, **Node 24 LTS** and either MariaDB 10.11+/11.4 locally or Docker Desktop with Linux containers. Native Argon2/sharp packages need a supported Windows x64/ARM64 Node installation; unsupported hosts may need their normal native build toolchain. Windows commands below are a handoff and have not been executed on a Windows machine in this Cloud task.

## 1. Checkout and environment

```powershell
git clone https://github.com/litequang/Luca-Drum-Quest.git
cd Luca-Drum-Quest
git switch codex/local-backend-admin-pilot
npm ci
Copy-Item .env.example .env
notepad .env
```

Set DB_PASSWORD to a new local-only password (not a production credential). Keep HOST=127.0.0.1, APP_ORIGIN=http://localhost:3000, COOKIE_SECURE=false for loopback development. Use that exact browser origin, including `localhost` rather than `127.0.0.1`, because CSRF origin checks are exact. Keep `.env` private and ignored by Git. Do not set ADMIN_EMAIL/ADMIN_PASSWORD permanently in `.env`.

## 2. Create the database

Easiest optional route with Docker Desktop:

```powershell
docker compose up -d db
docker compose ps
```

Wait for the database to be healthy. The local DB port binds only 127.0.0.1. Docker's named volume keeps data across restarts. Changing the password in `.env` does not change a database already initialized in that volume; use MariaDB administration to rotate it. Never run `docker compose down -v` against data you need.

Alternatively, install MariaDB on Windows, open the MariaDB client as a database administrator, and create an empty UTF-8 database and a dedicated application user. Replace the password placeholder privately:

```sql
CREATE DATABASE luca_pilot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'luca'@'127.0.0.1' IDENTIFIED BY '<choose-a-local-password>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON luca_pilot.* TO 'luca'@'127.0.0.1';
```

Set DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME accordingly. Do not use the DB root account in the web application. For production, separate migration credentials from runtime DML permissions.

## 3. Migrate, seed and initialize one admin

```powershell
npm run db:migrate
npm run db:seed
$credential = Get-Credential -Message 'Local parent admin: email and a unique password of at least 14 characters'
$env:ADMIN_EMAIL = $credential.UserName
$env:ADMIN_PASSWORD = $credential.GetNetworkCredential().Password
try { npm run admin:init } finally {
  Remove-Item Env:ADMIN_EMAIL -ErrorAction SilentlyContinue
  Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
  Remove-Variable credential -ErrorAction SilentlyContinue
}
npm run dev
```

Use a unique local test email/password; no password is provided or seeded. Initialization refuses to replace an existing parent. Seed is idempotent and creates only Season 1, draft curriculum and empty history/finance. It does not reset existing work. Start in the repository root so migrations and public assets resolve correctly.

Open `http://localhost:3000`, and `http://localhost:3000/admin`. Sign in with the account you initialized. Project → edit → save, then reload the public website to see persisted text. Use only generated images/fictional entries in this pilot. Parent → Family → create a one-time code; share it privately, and let the family tester accept it at `/admin/login`. Family content is at `/family`.

For a compiled server:

```powershell
npm run typecheck
npm run build
npm start
```

Run either dev or start, not both on the same port. `npm start` still uses the repository's public assets; keep those alongside `dist/`. Node LTS and MariaDB remain required. Stop with Ctrl+C. Restarting the process or database does not erase saved edits.

## 4. Automated tests (separate disposable database)

**Tests erase application rows in TEST_DB_NAME, which must end `_test`. Never point it at real/pilot data.** The Docker test service uses an ephemeral database on port 3307:

```powershell
docker compose --profile test up -d test-db
docker compose ps
$previousDbPort = $env:DB_PORT
$env:DB_PORT = '3307'
$env:TEST_DB_NAME = 'luca_pilot_test'
try { npm test } finally {
  if ($null -eq $previousDbPort) { Remove-Item Env:DB_PORT -ErrorAction SilentlyContinue }
  else { $env:DB_PORT = $previousDbPort }
  Remove-Item Env:TEST_DB_NAME -ErrorAction SilentlyContinue
}
```

Wait for test-db to be healthy before running. Tests use DB_USER/DB_PASSWORD from `.env` and override DB_NAME with TEST_DB_NAME. For native MariaDB, create a distinct `_test` database and grant the test account the corresponding permissions; use its port. The test suite checks APIs against actual MariaDB and UI interactions in JSDOM. It does not render browsers or emulate actual iPad/mobile layout.

## 5. Local physical-device testing

`localhost` on an iPad refers to the iPad, not the PC. Keep the Node server loopback-only and use a **local HTTPS reverse proxy** on the PC with a certificate trusted by the test devices. Set APP_ORIGIN to that exact HTTPS LAN origin and COOKIE_SECURE=true; retain HOST=127.0.0.1. For example, a locally installed Caddy can reverse-proxy `https://<PC_LAN_IP>` to `127.0.0.1:3000` with its internal CA, after that CA is deliberately trusted on the test devices. Configure Windows firewall only for the private test network, keep DB/media directories unexposed, and do not open the service to the Internet. This proxy/certificate setup is not bundled or verified here.

Then execute the checklist in [LOCAL_PILOT_REPORT.md](LOCAL_PILOT_REPORT.md). Do not weaken cookie/origin settings to bypass an HTTPS or certificate failure. Remove test trust/firewall changes when finished.

## 6. Storage and cleanup

MEDIA_DIR defaults to ignored `private-media/`, served only through the authorized API. Do not host the repository with `python -m http.server`: that would bypass authentication and could serve sensitive local files. Run Fastify for the live pilot. Back up the database and media together to a separate encrypted destination. See [LOCAL_PILOT_ARCHITECTURE.md](LOCAL_PILOT_ARCHITECTURE.md) for quota, metadata removal, backup and production blockers.

```powershell
npm run media:cleanup
# After stopping the application and checking the dry-run result:
npm run media:cleanup -- --prune
```

Cleanup removes only orphan generated files older than 24h, not attached media. Deleting posts/attachments in Admin revokes API access immediately. Audit snapshots and backups require their own retention policy.
