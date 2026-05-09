# Training Dashboard

Personal training dashboard for iPhone. Static webpage hosted on GitHub Pages, Google Sheet as the database via an Apps Script web app, iOS Shortcut to push Apple Health stats, optional Google Calendar integration.

---

## What's in this repo

| File | What it is |
|---|---|
| `index.html` | The webpage. Edit the three CONFIG values at the top of the `<script>` tag. |
| `Code.gs` | Paste this into Google Apps Script, attached to your Sheet. |
| `manifest.webmanifest` + icons | Lets you "Add to Home Screen" on iPhone and have it look like an app. |

---

## Setup (~20 minutes)

### 1. Google Sheet + Apps Script

1. Create a new Google Sheet. Copy the ID from the URL: `docs.google.com/spreadsheets/d/THIS_PART/edit`.
2. In the sheet: **Extensions → Apps Script**. Delete the default code, paste in everything from `Code.gs`.
3. At the top of `Code.gs`, replace:
   - `SHEET_ID` with the ID you copied
   - `SHARED_SECRET` with any random string you make up (write it down — you'll need it twice more)
4. Save. Run the `setup` function once (top toolbar → select `setup` → Run). Approve the permissions prompt. This creates the `runs`, `calories`, and `health` tabs with headers.
5. **Deploy → New deployment**. Pick type **Web app**.
   - Description: anything
   - Execute as: **Me**
   - Who has access: **Anyone**  ← required so the iPhone Shortcut and the webpage can hit it without a Google login
6. Copy the **Web app URL**. Looks like `https://script.google.com/macros/s/AKfy.../exec`. This is your secret URL — don't paste it publicly.

### 2. The webpage

1. In `index.html`, find the CONFIG block near the bottom and fill in:
   ```js
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/.../exec';
   const SHARED_SECRET   = 'whatever-you-chose';   // must match Code.gs
   const GOOGLE_CLIENT_ID = '';                    // leave blank to skip calendar
   ```
2. Push the repo to GitHub. Settings → Pages → Source: `main` branch, root. Wait a minute, get the URL.
3. On your iPhone, open the URL in Safari. Tap the Share button → **Add to Home Screen**. You now have a "Training" icon that opens fullscreen with no Safari chrome.

### 3. iOS Shortcut to push Health data

This is what gets steps / active calories / etc. into your sheet. Run it once a day (manually or on a schedule via Automation).

Open the **Shortcuts** app → New Shortcut. Add these actions in order:

1. **Find Health Samples** — Type: Steps, Sort: Latest, Limit: 1, Date: Today. → name the variable `Steps`.
2. **Find Health Samples** — Type: Active Energy, Date: Today, Limit: All. (You'll sum it next.)
3. **Calculate Statistics** — Sum, on the previous result. → `ActiveKcal`.
4. **Find Health Samples** — Type: Walking + Running Distance, Date: Today, Limit: All.
5. **Calculate Statistics** — Sum. → `DistanceKm`. (If yours is in metres, divide by 1000 with a Calculate action.)
6. **Find Health Samples** — Type: Resting Energy, Date: Today, Limit: All. → Sum → `RestingKcal`.
7. **Find Health Samples** — Type: Exercise Time, Date: Today, Limit: All. → Sum → `ExerciseMin`.
8. **Format Date** — current date, ISO 8601, date only → `Today`.
9. **Dictionary** — build:
   ```
   secret       → your SHARED_SECRET
   type         → health
   date         → Today
   steps        → Steps (the quantity, use Get Numbers from… if needed)
   active_kcal  → ActiveKcal
   distance_km  → DistanceKm
   resting_kcal → RestingKcal
   exercise_min → ExerciseMin
   source       → shortcut
   ```
10. **Get Contents of URL**:
    - URL: your Apps Script Web app URL
    - Method: **POST**
    - Request Body: **JSON**, value = the Dictionary above
    - Headers: leave default (Content-Type will be set to application/json — that's fine for Shortcuts; Apps Script accepts it)
11. (Optional) **Show Notification** — "Health pushed".

To run on a schedule: Shortcuts → **Automation** tab → New → **Time of Day** (e.g. 22:00) → Run Shortcut → pick this one. Toggle "Run Immediately" off if you want a tap-to-confirm; on if you want fully automated.

> **Tip:** if a Health type returns nothing on a given day (e.g. you wore no watch), that field will write 0 — fine. The script upserts by date, so re-running the Shortcut just overwrites that day's row with fresher numbers.

### 4. (Optional) Google Calendar

Skip this if you don't care — the rest of the app works without it.

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create a project.
2. **APIs & Services → Library** → enable **Google Calendar API**.
3. **OAuth consent screen** → External → fill in basics → add your own email as a test user.
4. **Credentials → Create credentials → OAuth client ID** → type **Web application**.
   - Authorised JavaScript origins: your GitHub Pages origin, e.g. `https://yourname.github.io`
5. Copy the client ID, paste into `GOOGLE_CLIENT_ID` in `index.html`, push.
6. On the page, tap **Connect**, sign in, approve. Token is kept in `sessionStorage` for the session.

---

## How it works

- **Writes** (page forms, Shortcut): POST JSON to the Apps Script URL. The script checks `secret` matches, then appends to the right tab. Health POSTs upsert by date so you only get one row per day.
- **Reads** (page load): GET `?action=week`, returns the last 7 days bucketed by date for runs / calories / health. The bar chart renders in inline SVG — no chart library, fast on mobile.
- **Calendar**: read-only token via Google Identity Services, fetches today's events from the primary calendar. Token is per-session.

## Troubleshooting

- **Page loads but stats are dashes** — APPS_SCRIPT_URL not set, or the deployment isn't "Anyone" access. Test the URL in a browser: `YOUR_URL?action=week` should return JSON.
- **POSTs fail with "unauthorized"** — `SHARED_SECRET` doesn't match between `Code.gs`, `index.html`, and the Shortcut's dictionary.
- **Shortcut errors on a Find Health Samples** — that data type is empty for today. Add a default with an If action, or just live with the 0.
- **Calendar shows "Reconnect needed"** — the token expired (~1 hour). Tap Connect again. Could be made persistent with refresh tokens, but that needs a backend.

## Extending later

- Add a route map: in the Shortcut, grab the latest workout's GPS route (`Find Workouts → Get Route`) and POST as a polyline string. Render with Leaflet on the page.
- Streaks, weekly mileage targets, hydration log — all just new tabs in the sheet + new sections in the page.
