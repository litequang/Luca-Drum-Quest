# Build on PC, configure database/environment on the host

Status: a portable upload package and first-admin browser installer are implemented and tested locally. The actual HawkHost plan, Node selector, Passenger behavior and hosting security remain unverified. This is not authorization to deploy this repository, and no hosting changes were made by this task.

## What runs where

| Location | Work |
|---|---|
| PC / VS Code | Update source, install development tools, typecheck, build and prepare `release/` |
| HawkHost / cPanel | Create database/user, configure the Node application, HTTPS, private environment and storage; install Linux runtime dependencies |
| Browser | Open `/setup` once using the private setup key and create the website's first Admin; later log in at `/admin/login` |

DB_USER/DB_PASSWORD are the server's database credentials. They are unrelated to the email/password a person uses to log in to the project. Website passwords are Argon2id hashes in the users table; no shared/default Admin password is shipped. FAMILY_VIEWER and TEACHER users join only through parent-issued invitations.

## Hosting requirements to confirm first

- The selected HawkHost plan must actually offer a Node application manager/Passenger and Node 24 LTS. A static/PHP upload alone cannot run this API. Installing an app in cPanel is a managed Node process, not installing Node on visitors' PCs.
- MariaDB 10.11+ or a version confirmed compatible by a dedicated test; full cPanel-prefixed database/user names and access from the application. Initial setup needs CREATE/ALTER/INDEX/REFERENCES plus normal DML permissions in this chosen database.
- Linux native runtime installation of argon2 and sharp; writable private storage, sufficient memory, HTTPS proxy/routing and protected backups. Never upload Windows node_modules to Linux.
- An application root and MEDIA_DIR outside public_html/document roots, and a way to run application scripts for later migrations/maintenance. Initial browser setup can migrate/seed a fresh database without a shell, but future upgrades/maintenance still need a supported script runner or Terminal/SSH.

If these are absent, stop at the package and use a suitable Node host/VM after an owner decision. No actual compatibility claim is made for an unspecified HawkHost package.

## 1. Prepare on the PC

In the repository root, using PowerShell:

```powershell
git fetch origin
git switch codex/local-backend-admin-pilot
git pull --ff-only
npm ci
npm run typecheck
npm run package:host
npm run setup:key
```

`release/` contains the compiled server, public assets, migrations, app.cjs, dependency manifests and a secret-free host environment example. It excludes source tests, Windows node_modules, real .env files, private images and backups. `setup:key` generates a 256-bit key into your private PC `.env` without printing it; it preserves any existing nonempty key. Open that private file to copy only SETUP_TOKEN to the host. Building does not require access to the hosting database.

Upload the **contents** of release/ to a private application directory such as `/home/<cpanel-account>/luca-app`. Keep that directory outside public_html. Do not upload the whole source checkout, private PC `.env`, node_modules or media backups. If using a ZIP/File Manager, preserve the packaged `.npmrc` and `.env.example` files.

## 2. Database and Node application on the host

Create a database and a dedicated database user in cPanel; assign the user the required privileges **on this database only**. Copy the complete prefixed names, e.g. `<account>_luca` and `<account>_lucauser`, into private host configuration. The application does not create a database/user or request database root credentials.

In the plan's Node application manager, choose Node 24 and production mode, a private application root, the actual HTTPS application domain, and startup file `app.cjs`. This CommonJS bridge loads the private `.env` and imports the compiled ESM server. The hosting platform must route requests to the Node listener; routing/Passenger integration must be tested on the actual plan. The pilot currently expects the app at the domain root, not an untested URL subpath.

Install dependencies **on Linux** using the panel's production NPM installer or:

```sh
npm ci --omit=dev
```

The packaged .npmrc omits dev tools for panel installations too. There is no TypeScript compilation or tsx requirement on the host. Restart/start the application through the panel after private environment configuration. If the plan cannot provide the required runtime, native modules or listener routing, the package needs host-specific adaptation before use.

## 3. Private host .env

Create .env beside app.cjs from the packaged host .env.example. Use HTTPS and the exact origin without a trailing slash or path. Example **placeholders only**:

```dotenv
HOST=127.0.0.1
PORT=3000
APP_ORIGIN=https://your-domain.example
COOKIE_SECURE=true
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_cpanel_prefixed_user
DB_PASSWORD=your_private_database_password
DB_NAME=your_cpanel_prefixed_database
MEDIA_DIR=/home/your_account/luca-private-media
SESSION_HOURS=8
SETUP_TOKEN=your_generated_64_lowercase_hex_key
```

Use a port supplied by the Node application manager if it provides one. Existing process environment values should take precedence over .env. Keep configuration out of public_html, restrict file permissions (0600 where supported), and never commit it or paste real keys/passwords into chat. .env is read at runtime, not embedded into the PC build. Changing it requires a process restart.

## 4. Create the first Admin in the browser

1. Open `https://<your-domain>/setup` after the Node app starts successfully.
2. Enter SETUP_TOKEN from your private host environment, your chosen Admin email, a unique password of 14–128 characters and its confirmation.
3. Submit once. After validating the setup key and request origin, the server applies pending migrations, seeds only the draft curriculum and creates the single PARENT_ADMIN in the configured database. It never drops existing tables, seeds fake events or creates future seasons.
4. Follow the sign-in link and log in at `/admin/login`; `/admin` is the parent dashboard. The setup request does not silently log you in.
5. Remove SETUP_TOKEN from the host environment and restart. The database's initialized marker already blocks further setup even if the key was left configured or the original Admin row were later removed. Visiting /setup on an initialized/disabled installation leads to login; the setup API refuses creation.

The key is sent in a request header, never in a URL. Requests require an exact Origin, are size/rate limited, and setup uses a database advisory lock plus a transactional initialized marker to prevent parallel requests from creating multiple parents. The key/password are not stored in audit logs. A blank key disables browser installation. Existing installations created through the CLI are recognized and cannot be claimed through /setup. The CLI admin:init command remains an alternative after migrations and seed.

If setup reports a database/migration error, do not delete existing tables or retry with root credentials. Inspect the private host logs, database permissions and partially applied migration state first. MariaDB DDL implicitly commits; the installer does not promise rollback of a failed schema migration. Password recovery is separate from first-time setup and is not implemented by reopening this page.

## 5. Updates and verification

For an existing deployment, back up database and private images first. Upload updated application files without overwriting host .env, MEDIA_DIR or installed runtime data. Run the supported compiled `npm run db:migrate` script through the host's Terminal/script runner, install runtime dependencies when manifests change, then restart. Do not create another Admin or rerun first-time setup on updates.

Verify HTTPS cookies, public/private pages and images, YouTube playback, invited family/teacher scope, a real backup/restore and Windows/iPad/phone flows on the actual environment. Confirm .env, source and MEDIA_DIR cannot be reached through Apache or any separate static mount. Keep production rollout pending the owner-approved hosting/security and data-consent checks in LOCAL_PILOT_REPORT.md.
