# LiftBasket — self-hosted edition 1.2.0

A complete Next.js / React app with SQLite persistence. It runs independently of ChatGPT Sites and Cloudflare. Includes the food library, grocery comparison/basket, amino-acid and label-entered collagen tracking, private calorie/weight diaries, account login, signup/feedback forms, and a private creator dashboard with its own sign-in.

The CA$3/month subscription is a planned offer only. Subscription and checkout pages are unavailable. The beta tools remain usable, with the feature overview and launch-interest form on the homepage. Payment collection and entitlement enforcement are not connected.

## Start on Windows, macOS or Linux

Use **Node.js 24.13+ (24.x)** and pnpm 11.25.0. Extract this ZIP first; run commands inside its `LiftBasket` directory.

```sh
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm run setup
pnpm build
pnpm start
```

`pnpm run setup` asks for the site origin and administrator email. It generates a strong administrator password, prints it once, writes `.env.local` and creates the administrator account. Save the password in a password manager. It never includes a preselected or shared default password. Local origin: `http://localhost:3000` (no trailing slash). Open that URL, then **My tracker → Sign in**. Account management and sign-out for the personal tracker are at `/account`. To open your creator dashboard, follow the setup below.

During development you can use `pnpm dev`. Data is saved in `data/liftbasket.sqlite`; it survives app restarts. Do not delete the `data` directory when upgrading.

## Set up your creator dashboard

1. Open `/creator` and choose **Set up creator access**.
2. Select **Verify with your administrator account**, then sign in using the administrator account created by `pnpm run setup`. If you are signed into a different local account, use **Switch account** first.
3. Choose your own creator email and a unique password of 15–128 characters. This can differ from your administrator account. Save the details in a password manager.
4. Open `/creator/login` for subsequent creator sign-ins. The dashboard includes Overview, Feedback, Signups and Traffic, searchable lists and private CSV downloads. **Sign-in settings** lets you change the creator email or password using the current password.

No creator password is supplied in the ZIP. The original verified administrator is the only account allowed to create or recover creator access. Creator passwords use scrypt hashes; 12-hour sessions use HttpOnly cookies and store only a hash of the session token. On an HTTPS site the cookie is Secure. Sign-out revokes the session; changing or recovering credentials revokes earlier creator sessions. The dashboard requires a creator session even if you are signed into the ordinary administrator/tracker account.

Forgot your creator password? Choose **Recover creator access** on `/creator/login`, verify with the original administrator account, then choose new creator credentials. If you have also lost the administrator password, run `pnpm account:reset` on the server to reset that local account first. Recovery does not send email. Keep access to the original administrator account: recovery is bound to its stable account ID after initial setup.

## Feedback portal and this update

Open `/feedback` to leave a 1–5 usefulness rating, an optional comment and an optional reply email. Responses are private; the creator can review them in `/creator#feedback` and export a feedback CSV. Public feedback does not require a local account. Signed-in creator and administrator test submissions are excluded from traction results.

Version 1.2.0 adds the creator dashboard, your chosen sign-in credentials, account recovery and sign-in settings. The old `/insights` link redirects to `/creator`. Subscription and checkout routes remain unavailable. The existing feedback portal preserves unchanged retry IDs to prevent duplicate responses; edited responses receive a new ID.

### Updating an existing installation

1. Stop your running app and back up `.env.local` and the entire `data` directory.
2. Replace the application files with this release. Preserve your existing `.env.local` and `data`; the ZIP includes neither. Keep `DATABASE_PATH` pointing to the intended database.
3. Run `pnpm install --frozen-lockfile`, then `pnpm build` and `pnpm start`. Do not rerun setup for an existing installation.
4. Check your saved diary, then open `/creator` and follow first-time creator setup if upgrading from an earlier release. Existing diary and feedback records are preserved; database migrations are applied automatically when the database opens.

## Run on another server

Use a Node-capable VPS/container host with a **persistent local disk**. A static-file-only host cannot run login, diary storage or forms.

1. Upload the extracted project (never a personal `.env.local` or real database to a public repository).
2. Install dependencies, run setup on that server, and set `SITE_ORIGIN` to your exact `https://` origin. Build and start the app using the commands above.
3. Put an HTTPS reverse proxy in front of port 3000. Block direct external access to the backend port. Example nginx location:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Configure your domain and TLS certificate in your hosting control panel. Set `TRUST_PROXY=1` only if that proxy overwrites `X-Real-IP` and clients cannot reach the Node port directly. Otherwise leave it at 0; anonymous submission limits are shared by the server. Run the app under your host’s service manager so it restarts after reboot. Use one app instance with this SQLite file; a multi-instance deployment needs a shared database adapter.

### Docker option

Create `.env.local` and the initial account with `pnpm run setup` first. Use a Linux server and give container UID 1000 write access to `data`:

```sh
sudo chown -R 1000:1000 data
docker compose up --build -d
```

The image runs as the unprivileged `node` user and mounts `./data` for persistence. The supplied port mapping is loopback-only; use your HTTPS proxy. Docker was provided as a deployment option; see VALIDATION.md for what was actually exercised in this export.

## Accounts, privacy and recovery

This edition uses local email/password accounts, scrypt password hashes and opaque server-side sessions with HttpOnly cookies. It never trusts `oai-authenticated-*` headers. Accounts on your original ChatGPT-hosted site are separate. New registrations can be disabled with `ALLOW_REGISTRATION=0`. The configured administrator email is reserved, so visitors cannot claim it through registration.

There is no email verification, outbound email or automatic password-reset service. The operator can run `pnpm account:reset` to replace a password and revoke the account’s sessions. Do not claim an email address is verified. Keep the server and dependencies updated before using it commercially.

The ZIP contains **no user records, subscriber emails, production credentials, sessions or payment details**. It starts with an empty diary. The built-in CSV export lets you download diary history from an existing account; automatic migration of old ChatGPT account identities is not included.

To back up, stop the app and copy the **whole `data` directory plus `.env.local`** to protected storage. Restore them together. Interest-list/feedback/usage records are removed after 90 days on the next submission; diary data remains until removed. Account and database administration remain the operator’s responsibility.

## Food data and adding more

Food facts are versioned in `lib/food-data.ts`, per 100 g edible food in the stated preparation. Each entry has its FitAudit source URL and check date. The app is usable without contacting FitAudit. No documented official FitAudit API was found; a direct server request returned HTTP 403 during preparation, so this is **not a live FitAudit connection**.

To add a verified record, copy an entry, give it a unique ID/profileId, add source-backed calories/macros and amino amounts, and retain its source URL and checked date. Use `null` for missing amino values, never invented zero. Preserve existing IDs so saved entries/basket files remain compatible. Run `pnpm test:nutrition`, `pnpm build`, and restart. Existing diary entries keep their original nutrient snapshot.

Amounts are generic estimates, not manufacturer assays or predicted hormone/strength gains. Collagen is label-entered, not inferred from amino-acid precursors. The research page contains study results and limitations. Source material remains attributed; no FitAudit affiliation or API agreement is claimed.

## Assignment and testing

The grocery calculator is usable without an account. Personal diaries require a local login. The app is rendered directly inside this website; it is not pasted into Wix. If you embed it elsewhere, configure the destination platform and test both desktop and phone behavior. Use a reachable URL for the grader; the original ChatGPT Site was owner-private.

Use real outreach, signups and feedback for your report. Do not count test accounts or test submissions as traction. Review `VALIDATION.md` for verified checks and remaining limitations.
