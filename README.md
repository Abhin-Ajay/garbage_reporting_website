# Garbage Collector Bot (NITC)

Next.js app: Google login restricted to `@nitc.ac.in`, bin selection, submission
with confirmation, per-user status tracking, and an admin panel to edit remarks,
add bins, and mark bins as collected.

## What you need to do (about 10-15 minutes)

### 1. Create a Google OAuth Client
1. Go to https://console.cloud.google.com/apis/credentials
2. Create a project (any name).
3. Click **Create Credentials → OAuth client ID**.
   - Application type: **Web application**
   - Authorized redirect URIs: add both
     - `http://localhost:3000/api/auth/callback/google` (for local testing)
     - `https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/callback/google` (add this after step 3 once you know your domain; you can edit it later)
4. Copy the **Client ID** and **Client Secret**.
5. On the OAuth consent screen, you don't need to restrict to nitc.ac.in there —
   the app itself checks the email domain in code (`lib/auth.js`), so any Google
   account can attempt login but only `@nitc.ac.in` addresses get in.

### 2. Push this code to GitHub
```bash
git init
git add .
git commit -m "garbage_reporting_website"
git branch -M main
git remote add origin https://github.com/Abhin-Ajay/garbage_reporting_website.git
git push -u origin main
```

### 3. Deploy on Vercel
1. Go to https://vercel.com and sign in (GitHub login is easiest).
2. Click **Add New → Project**, import the GitHub repo you just pushed.
3. Before clicking Deploy, open **Environment Variables** and add:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET` — generate one locally with `openssl rand -base64 32`
   - `ADMIN_EMAILS` — e.g. `yourid@nitc.ac.in` (comma-separate for multiple admins)
4. Click **Deploy**. You'll get a URL like `garbage-collector-bot.vercel.app`.

### 4. Add a database (Vercel Postgres / Neon)
1. In your Vercel project, go to the **Storage** tab.
2. Click **Create Database → Postgres** (Vercel now provisions this via Neon —
   same thing, just click through the free-tier flow).
3. Connect it to your project. Vercel automatically injects `POSTGRES_URL` and
   related env vars — you don't need to copy anything manually.
4. Redeploy the project (Vercel → Deployments → ⋯ → Redeploy) so the new env
   vars take effect.

### 5. Finish the Google OAuth redirect URI
Now that you have your real `https://your-project.vercel.app` domain, go back
to the Google Cloud Console credential from step 1 and make sure this exact
redirect URI is listed:
```
https://your-project.vercel.app/api/auth/callback/google
```

### 6. Test it
- Visit your `.vercel.app` URL.
- Log in with an `@nitc.ac.in` account → you should land on the bin selection page.
- Log in with a non-nitc account → you should see "Access denied."
- Select a bin, submit, confirm the popup → it should appear in "Your submissions" as Pending.
- Visit `/admin` while logged in as an email listed in `ADMIN_EMAILS` → you can
  edit remarks, add new bins (bin11, bin12...), and mark submissions as Collected.

## How the logic works (so you can tweak it later)

- **Login restriction**: `lib/auth.js` → `signIn` callback checks
  `email.endsWith('@nitc.ac.in')`.
- **Bins & remarks**: stored in the `bins` table, seeded with `bin1`...`bin10`
  and the placeholder remark `"this is the first basket"`. Edit per-bin remarks
  or add new bins from `/admin`.
- **Submission flow**: selecting a bin shows its remark; clicking Submit shows
  a confirm popup; on OK, `/api/submit` inserts a row per bin with
  status `pending`.
- **Duplicate prevention**: before inserting, the API checks if that bin
  already has a `pending` row (by anyone). If so, it's skipped and the message
  "this is already given for collection" is shown instead of storing it again.
- **Hiding selected bins**: `/api/status` returns all bin names that currently
  have a pending submission; the frontend filters those out of the selectable
  list automatically (across sessions/users, since it's read from the DB).
- **Status persistence**: `/api/status` returns the logged-in user's full
  submission history, so it reappears every time they log back in.
- **Admin actions**: `/admin` page (protected by `ADMIN_EMAILS`) can edit
  remarks (`POST /api/admin/remarks`), add bins (`POST /api/admin/bins`), and
  flip a submission from Pending → Collected (`PATCH /api/admin/submissions`).

## Local development
```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```
Open http://localhost:3000
