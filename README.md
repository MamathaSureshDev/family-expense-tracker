# Family Expense Tracker (GitHub Pages + Supabase)

This is a browser-based family expense tracker for Manjula, Mamatha, and Mahesh. Currency is INR. It uses Supabase as the online database and GitHub Pages to host the website.

## Before you start
- You need a GitHub account.
- Create a Supabase project at https://supabase.com/.
- **No-login warning:** this version is deliberately open to anyone who has the website link. Anyone who gets the link can view, add, edit, or delete records. Do not store bank details, addresses, or other sensitive information. For stronger privacy, use sign-in or a server-side shared-password setup.

## Part 1 — Create the online database
1. Open https://supabase.com/ and create a project.
2. In your Supabase project, open **SQL Editor** and choose **New query**.
3. Open `supabase/setup.sql` from this folder, copy all its contents, paste into SQL Editor, and click **Run**.
4. In Supabase, open **Project Settings → API Keys** (or the project’s **Connect** dialog).
5. Copy the **Project URL** and the **publishable key** (usually starts with `sb_publishable_`). The older `anon` key is also a public browser key if that is what the dashboard shows. **Never use a secret/service-role key in this website.**

## Part 2 — Put the website on GitHub
1. On GitHub, create a new repository named `family-expense-tracker`.
2. Upload the contents of this ZIP into the repository (upload the files and folders inside this ZIP, not the ZIP file itself). Keep the folder structure.
3. Open `src/lib/supabase.ts`. Replace `PASTE_YOUR_SUPABASE_URL_HERE` and `PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE` with the values from Supabase.
   - These are public browser settings; the SQL policies intentionally allow public access. Do not paste any secret/service-role key.
4. Commit the changes to the `main` branch.
5. In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
6. Open the **Actions** tab. The `Deploy to GitHub Pages` workflow should run automatically. If asked, enable GitHub Actions.
7. When the workflow finishes with a green check, open **Settings → Pages** to find your website URL.

## Part 3 — Use it
- Open the published URL on your phone and laptop.
- Share the same URL with Manjula and Mahesh.
- All devices use the same Supabase database.
- Use **Export CSV** periodically to keep a local copy of your records.

## Important
- GitHub Pages only hosts the website. Supabase stores the data online.
- This starter is configured for no-login access, which means public read/write/delete access. Anyone with the URL can change data. This is the trade-off for having no login in this simple setup.
- Test with a small sample expense first, then delete it.
- This is a starter app; check it carefully before using it for important financial records.
