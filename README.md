# نوبة (Nawba)

An offline-first progressive web app that walks families through an epileptic seizure, in Iraqi Arabic with voice narration. It comes with a bilingual (Arabic/English) staff console.

- **Family app:** `/app/`. Families sign in by scanning their QR code, or with their patient ID and password.
- **Staff console:** `/admin/`. On the first visit you create the **Owner** account.

## Where things live

| Part | Hosted on | Folder |
|---|---|---|
| Family app `/app/` and staff panel `/admin/` (static files) | **GitHub Pages**: https://mhub96.github.io/nawba/ | `public/` |
| API | **Cloudflare Workers** (`nawba-api`) | `worker/` |
| Database | **Cloudflare D1** (`nawba`) | `worker/migrations/` |
| Seizure videos (optional, off) | **Cloudflare R2** (`nawba-videos`) | see `worker/wrangler.toml` |

Every push to `main` deploys both the API and the site through `.github/workflows/deploy.yml`. Deployment needs two repository secrets, `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## Free-plan limits and the Usage page

The Cloudflare Workers Free plan allows, per day (reset 00:00 UTC):
- 100,000 API requests;
- 5 million database rows read;
- 100,000 rows written.

It also allows 5 GB of database storage and 10 ms of CPU per request. Since Sept 2026, D1 refuses queries for the rest of the day once a daily limit is reached.

How the API keeps usage low:
- It caches settings, sign-in sessions and dashboard statistics in memory for 60 seconds.
- It uses indexed, aggregated queries.
- Patient search runs in the browser.

Admins and the Owner see live usage under **Usage** in the staff panel: % used and % remaining for each limit, CPU time, and the last 7 days. To connect it, create a **read-only** Cloudflare API token with *Account Analytics: Read* and *D1: Read*, then add it as the repository secret CF_ANALYTICS_TOKEN. The next deploy installs it on the Worker.

## Run locally (optional)

```bash
npm install
npm start              # http://localhost:8080
```

- Needs Node ≥ 22.13. It uses Node's built-in SQLite, so there is no database server to install.
- Data is stored in `./data/` (database plus any uploaded videos). Set `DATA_DIR` to store it elsewhere and `PORT` to change the port.
- **HTTPS is required in production.** Phones only install PWAs and allow the screen wake-lock and camera over HTTPS. Put the app behind a reverse proxy such as nginx or Caddy with a certificate.
- Under **App settings**, the Owner sets the public address that QR codes point to.

## Roles

| Role | Can do |
|---|---|
| Owner | Everything, including creating admins and setting the QR public address |
| Admin | Manages doctors and nurses; centre-wide visibility of questions and education; feature switches; deactivates patients; views the activity log |
| Doctor | Creates patients; edits the full dossier; sets per-family visibility; replaces QR codes; deletes diary entries |
| Nurse | Views patients; shows and prints QR codes; resets family passwords; records seizures; edits contact details |

## Clinical content (in `content/`)

- `catalog.json` holds:
  - the ILAE 2025 seizure types: Beniczky et al., *Epilepsia* 2025;66(6):1804–1823, doi:10.1111/epi.18338;
  - the semiology descriptors from Table 2 of that paper (aura, ictal, postictal);
  - triggers and red flags.
  - Each item has: an English name, a clinical Arabic name, a plain Iraqi-dialect wording for families, a default visibility, and a level (basic or advanced).
- `education.json` holds the counselling modules.
- `narration.json` holds the spoken crisis-flow steps.
- The long-seizure alert defaults to 5 minutes. This is the ILAE t1 time point for tonic–clonic status epilepticus (Trinka et al., 2015). A patient's own rescue-plan time takes priority.

**Every clinical sentence must be reviewed by the treating team before families use the app.**

## Voice narration

All 186 clips are pre-generated MP3s in `public/audio/`, and the app caches them for offline use. After you edit any text in `content/`, regenerate the audio:

```bash
pip install edge-tts
npm run audio          # only the changed lines are regenerated
```

- The default voice is Microsoft's neural Iraqi voice `ar-IQ-RanaNeural` (female). For the male voice, use `--voice ar-IQ-BasselNeural`.
- `edge-tts` uses Microsoft Edge's read-aloud service. For a licensed production setup, the same voices are available through Azure AI Speech.
