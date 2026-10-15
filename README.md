# Asr-ı Saadet Portalı

Islamic history archive (Sahabe biographies, events timeline, genealogy, articles) with a Firebase-backed admin panel.

**Stack:** Astro (static pages) · vanilla JS app (`public/script.js`) · Firebase Auth + Firestore + App Check · Vercel hosting.

---

## 1. URGENT — rotate the leaked credentials

The public GitHub repo contained `şifreler.txt` (reCAPTCHA **secret** key + site key) and `şifre hosting.txt` (a password). They are removed from the code, but **they are still readable in the Git history**, so:

1. **Change the hosting/account password** that was in `şifre hosting.txt`. If it was reused anywhere else (email, Vercel, GitHub, Firebase), change it there too and turn on 2-factor authentication.
2. **Create a new reCAPTCHA Enterprise key** (Google Cloud Console → Security → reCAPTCHA → *Create key*, type *Website*), add all site domains (see §6), then:
   - Firebase Console → App Check → Apps → web app → switch the provider to the **new** site key.
   - Put the new site key into `APPCHECK_SITE_KEY` at the top of `public/script.js`.
   - Delete the old key in Google Cloud.
3. **Make the GitHub repo private** (Settings → General → Danger zone → Change visibility), or rewrite history with `git filter-repo`. Private is the quick fix.

Never commit passwords or keys again. `.gitignore` now blocks `şifre*`, `.env*`, service-account JSON files, etc. Secrets belong in **Vercel → Settings → Environment Variables**.

---

## 2. What was fixed

| Problem | Fix |
|---|---|
| Last commit (“s”) deleted `src/` and `public/` (pages, data, logo, icons) and rolled `script.js`/`style.css`/`build.js` back to an older copy → **build crashed** (`Cannot find module './src/data/articles.json'`). | Restored the full project from the last complete commit (`9692dd1`) and removed the duplicate root copies of every file. |
| **Whole page froze** on every page load: `metin-duzelt.js` re-assigned `document.title` inside its own MutationObserver → endless loop. (Probably why the site was rolled back.) | Only assigns when the text actually changes + drops self-caused mutations. Verified in a headless browser. |
| Admin panel trusted any account whose email was in the list — even an **unverified** email/password sign-up, so if an admin address had no Firebase account yet, anyone could register it with a password and get admin rights. | Admin now requires a **verified** email (client + Firestore rules). Admins who signed up with email/password get a “send verification email” screen; Google sign-in is verified automatically. |
| `firestore.rules` was deleted from the repo. | Restored and tightened (`firestore.rules`, `firebase.json`, `.firebaserc`). |
| Site address hard-coded in ~30 places. | One setting: `site.config.json` (or `SITE_URL` env var in Vercel). Canonicals, sitemap, robots.txt and JSON-LD all follow it. |
| Misc. | Basic security headers in `vercel.json`; home page article links no longer go through a redirect; build output (`public/sahabe/`, `site-data.json`) is git-ignored; duplicate image folders and junk files (`aa`, `download`, …) removed. |

---

### Round 2 (client feedback)

| Client report | Cause | Fix |
|---|---|---|
| Vercel build fails: `Firestore okunamadı (403) PERMISSION_DENIED` | App Check is **enforced** on Firestore, so the build server's anonymous REST read is refused. | `build.js` now tries: service account → REST → the live site's own `/site-data.json` → and if all fail it **still finishes** (people pages skipped, the site reads Firestore in the browser). Add `FIREBASE_SERVICE_ACCOUNT` (§4) for the permanent fix. |
| Clicking an **event** opens the wrong place / no info | Event links went to the archive, which rendered all ~330 records and tried to scroll to one; the scroll landed somewhere else. | Events (and people without a biography page) now open a **dedicated record page**: `/archive#olay-<id>`. |
| **Search** results don't open correctly | Article results pointed at `#articles/1` and FAQ results at `#faq/3` on pages that are now static, so nothing opened. | Results link to the real targets: record page, `/makaleler/<slug>`, `/faq#sss-<n>` (the question opens automatically). Links are real URLs (open in new tab works). |
| Article list overlaps a line, links look wrong; FAQ broken | Static Astro pages used classes that had no CSS for links (`a.record`) and no page padding. | New **article card grid** and a **redesigned FAQ** (numbered accordion + contact box), shared styles in `public/extra.css`, dark mode included. |
| Slow load / slow refresh | Every page loaded Firebase + reCAPTCHA (~0.5 MB, 1–3 s for the App Check token) and **every visit downloaded every record from Firestore** (≈330 reads per page view; the free plan's 50,000 reads/day ≈ 150 page views). | Pages render instantly from `/site-data.json` (CDN). Visitors only fetch records **changed since the last deploy** (+ deletions via `silinenler`), admins get full live data. FAQ/Privacy/Sources/Contribute/Changelog don't load Firebase at all. Firestore uses a persistent IndexedDB cache; SDK modules load in parallel. |
| Admin shows 62 connections, home shows 55 | Two different formulas (one counted spouses, one didn't). | One shared, cached function for “Bağlantılı şahsiyet” used everywhere. |
| Family tree: parents → siblings; father's sibling → uncle/aunt | Relatives were only computed on the genealogy page; explicit “(Kardeş)” entries were ignored; gender was unknown for most records (“Kadın” wasn't even recognised). | Siblings, amca/hala, dayı/teyze, dede/nine, kuzen are shown on every record page, on the static biography pages, and **live in the admin form before saving**. “İsim (Kardeş)” now counts (and the sibling inherits the known parents). Gender is inferred from “anne/baba” roles, spouses and names (Binti/Bin, common names). Contradictions are listed under **Veri uyarıları** in the admin panel instead of producing wrong uncles. |
| Article input area: text, sources, images | Articles were hard-coded. | Admin panel → **Makaleler** tab: rich-text editor, category, summary, sources (one per line), cover image upload (resized in the browser to ≤1400 px JPEG), draft/published. Stored in Firestore `makaleler`; visible immediately; static SEO page `/makaleler/<slug>` is generated on the next deploy. Built-in articles can be edited too. |
| Google sign-in broken | App Check is enforced on **Authentication** as well; the Google popup was opened before the App Check token (1–3 s via reCAPTCHA) was ready, so browsers blocked the popup or the handler rejected the request. | The Google button waits (“Google hazırlanıyor…”) until App Check is ready, falls back to redirect if the popup is blocked, and shows specific error messages. See §5 if it still fails. |

## 3. Project structure

```
src/pages/            Astro pages (one per URL) — mostly shells that public/script.js fills in
src/pages/makaleler/  Article pages (built-in articles.json + published Firestore articles)
src/layouts/          Shared <head>, navigation, footer
src/data/             articles.json, faq.json, makaleler.mjs (merges Firestore articles at build)
public/script.js      The app: archive, record pages, timeline, genealogy, search, login,
                      account, ADMIN PANEL (people, events, articles, data warnings)
public/extra.css      Styles for articles, FAQ, record pages, kinship lists, article editor
public/*.css          Base styles
build.js              Runs before Astro: reads Firestore (or fallback) → writes public/sahabe/*.html,
                      public/site-data.json, src/data/articles.generated.json, sitemap.xml, robots.txt
firestore.rules       Database security rules (must be published to Firebase — see §5)
site.config.json      The public site address
```

---

## 4. Deploy on Vercel

1. Push this project to the GitHub repo (replace the current contents).
2. Vercel → the project → **Settings → General**: Framework *Astro*, Build command `npm run build`, Output `dist`, Node.js **22.x**.
3. **Settings → Environment Variables** (Production + Preview):
   - `FIREBASE_SERVICE_ACCOUNT` — Firebase Console → Project settings → Service accounts → *Generate new private key*; paste the whole JSON on one line. (Optional but recommended; without it `build.js` reads the public collections over REST.)
   - `SITE_URL` — only when the custom domain is live (see §6).
4. Deploy. Check the **Preview** URL first, then promote to Production.

If Firestore cannot be read during the build (App Check enforced and no service account), `build.js` uses the live site's `/site-data.json` instead and prints a warning; if that is also unavailable it builds without the biography pages. The build no longer fails because of data.

---

## 5. Admin panel & Firebase

**Publish the security rules** (the site's protection depends on them):

- Firebase Console → Firestore Database → **Rules** → paste `firestore.rules` → **Publish**
  (or `npx firebase-tools deploy --only firestore:rules`).

What the rules do: everyone can read `zatlar` (people) and `olaylar` (events); only admins can create/edit/delete them. Everyone can read **published** `makaleler`; admins read drafts and write. `silinenler` holds deletion markers (so visitors' cached data drops deleted records). Each user can only see and edit their own `favoriler` and `notlar`. Everything else is closed. **The Makaleler tab cannot save until these rules are published.**

**Admins** = an email in **both** lists below **with a verified email address**:

- `ADMIN_EMAILS` at the top of `public/script.js` (controls what the UI shows)
- the list inside `isAdmin()` in `firestore.rules` (controls what the database allows)

Alternative without code changes: create a document `admins/<user UID>` with field `active: true` in the Firestore console.

**Firebase Authentication → Settings → Authorized domains** must contain every domain the site runs on (vercel.app + custom domain), otherwise login fails.

**App Check:** if Firestore shows “Missing or insufficient permissions” for everyone, the App Check key/domains are wrong. Check §1 step 2 and §6.

**Google sign-in still failing?** Ask for the exact message under the button (it now names the cause). Then, in order:
1. Firebase → Authentication → Sign-in method → Google must be *Enabled* (it was, when checked).
2. Firebase → App Check → APIs → **Authentication**: if enforcement is on and users see an App Check error, switch Authentication to *Unenforced* (keep Firestore enforced). Email/password and Google both keep working; Firestore stays protected.
3. Authorized domains must include the site's domain (vercel.app is already there; add the custom domain later).

---

## 5b. How data reaches the browser (performance)

| Who | First paint | Live updates | Firestore reads |
|---|---|---|---|
| Visitor | `/site-data.json` (built at deploy, served by Vercel's CDN) or the browser cache | Only records with `guncellemeTarihi` newer than the build, plus `silinenler` | Usually 0–5 per page |
| Logged-in member | same as visitor | same + own favourites/notes | small |
| Admin | same | **all** records, live | full collections (cached on disk after the first load) |

Static pages (FAQ, privacy, sources, contribute, changelog) don't load Firebase or reCAPTCHA at all.
Every admin save sets `guncellemeTarihi`, so visitors see changes within seconds without a redeploy. Redeploying (or the next push) refreshes `/site-data.json` and the SEO pages.

---

## 6. Connect a custom domain

1. Buy the domain (any registrar).
2. Vercel → project → **Settings → Domains** → add `example.com` and `www.example.com`.
3. At the registrar's DNS settings, create **exactly the records Vercel shows** on that page (usually an `A` record for the root domain and a `CNAME` for `www`). Wait until Vercel shows *Valid Configuration*; HTTPS is issued automatically.
4. Set the site address: either change `site.config.json` → `"siteUrl": "https://example.com"` and push, **or** set `SITE_URL=https://example.com` in Vercel env vars. Redeploy.
5. Add the new domain to:
   - Firebase → Authentication → Settings → **Authorized domains**
   - Google Cloud → reCAPTCHA → the site key → **Domains**
6. Google Search Console: add the new domain as a property and submit `https://example.com/sitemap.xml`. Keep the old `vercel.app` address working (Vercel can redirect it to the new domain in Settings → Domains).

---

## 7. Local development

Requires Node.js 22.12+.

```bash
npm install
npm run dev        # http://localhost:4321 — uses live Firestore data from the browser
npm run build      # full production build (needs Firestore access)
npm run preview
```

On `localhost`, App Check uses a debug token; register it in Firebase Console → App Check → *Manage debug tokens* if Firestore refuses requests.
