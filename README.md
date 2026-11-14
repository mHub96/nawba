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

All 186 clips are MP3 files in `public/audio/`. Phones download every clip with the app, so narration works offline. After a deploy, the "Check for updates" button fetches any changed clips.

Regenerate the clips after editing any text in `content/` (only lines whose text changed are regenerated):

```bash
pip install edge-tts
npm run audio                                   # free: Microsoft Iraqi voice (Rana; --voice ar-IQ-BasselNeural for male)
python tools/gen_audio.py --engine openai       # most natural: OpenAI gpt-4o-mini-tts, instructed to speak Baghdadi Iraqi Arabic
python tools/gen_audio.py --engine openai --only c_calm c_side item_R_long   # try a few clips first
```

The OpenAI engine needs an API key. Set it in the environment variable `OPENAI_API_KEY`, or put it in a one-line `.openai-key` file in the project root. That file is git-ignored, so it is never uploaded.

## Step photos and animations

Every step of the crisis walkthrough shows a real photo. The recovery-position steps also have animations. The files are in `public/img/steps/`. For each step the app shows an animation (animated WebP) first, then a still photo, then the pictogram. People who turn on "reduce motion" on their phone see the still photo instead of the animation. The map from steps to files is `MEDIA` in `public/app/app.js`. Every file is also listed in `STEP_MEDIA` in `public/app/sw.js` so it works offline.

- `rec1.jpg`, `rec2.jpg`, `rec3.jpg`, `rec2.webp`, `rec3.webp`: cropped and animated from the "Восстановительная поза, шаг 1–3" photos by Anastasiya Lvova on Wikimedia Commons ([CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)). These edited versions are under the same licence. The patient ends up on his **left** side. The "stay with him" step reuses `rec3.jpg`.
- The other photos all come from Wikimedia Commons. Each one was cropped to 8:5. The spoon and the glass of water have a red "no" sign added, and the stairs have a warning sign.
  - `c_calm.jpg`: "Analog Stop Watch" by Jeremyida002 (CC BY-SA 4.0)
  - `c_space.jpg`: "Pillow Flax Image 2" by Orgel Hrubek (CC BY-SA 4.0)
  - `c_clothes.jpg`: "Close-up of a businesswoman taking off her glasses" by Shixart1985 (CC BY 2.0)
  - `c_donts.jpg`: "Spoon (454673126)" by bongo vongo (CC BY-SA 2.0)
  - `c_watch.jpg`: U.S. Air Force photo by Tech. Sgt. Justin Norton (public domain)
  - `n_calm.jpg`: Bill Strode, U.S. National Archives (NARA 543906) (public domain)
  - `n_guide.jpg`: "Up the stairs into the great hall of Central railway station in Helsinki" by Henry Söderlund (CC BY 2.0)
  - `n_talk.jpg`: "Disabledandhere-028-handholdingdate" by Chona Kasinger for Disabled And Here (CC BY 4.0)
  - `rec4.jpg`: U.S. Navy photo by MC1 Chris Fahey (public domain)
  - `breathe.jpg`: U.S. Air Force photo by Senior Airman Brenden Beezley (public domain)
  - `no_food.jpg`: "Glass-of-water" by Derek Jensen (Tysto) (public domain)

To add a photo or animation for another step, put the file in `public/img/steps/`, add it to `MEDIA` and `STEP_MEDIA`, and keep it under about 250 KB. Use only photos the centre took itself, with the consent of everyone shown, or files under a free licence. Give credit where the licence requires it.

## Appearance

There are five modes: Automatic, Day, Midday, Evening and Night. Automatic follows the clock: Day from 05:30, Midday from 11:00, Evening from 16:00 and Night from 19:30. Families choose a mode under **مظهر التطبيق** on the home screen. Staff use the ◐ button or **My account**.
