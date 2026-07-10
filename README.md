# Imarticus E-Convocation Platform

A multi-batch, interactive e-convocation ceremony tool. A mentor/admin creates
a convocation per batch (KPMG FAP, KPMG PM, AIPM, ...), uploads the learner
roster and photos, and authors quiz/poll questions, special certificates, and
peer-voted awards. Learners join via one shared link per batch, watch the
ceremony in sync with the mentor's screen, and answer quiz/poll questions
live from their own device. Background music plays throughout.

Static frontend (plain HTML/CSS/JS, no build step) on Netlify, backed by
Netlify Functions that talk to a Google Apps Script Web App bound to your
spreadsheet — the Apps Script does the actual Sheets/Drive reads and writes.

Live sync (current slide, quiz phase, cert/award cycle, shared music
start-time) is the one piece that needs to be fast, so it bypasses Sheets/Apps
Script entirely and goes through Firebase Realtime Database instead: the
mentor's clicks still go through an authenticated Netlify function, which
writes to Firebase with the Admin SDK; every learner's browser holds a live
listener on that same node, so slide changes land in well under a second
instead of waiting on Apps Script's multi-second round trip. Everything else
(roster, questions, responses, batches, photos) still lives in Sheets/Drive.

## Architecture

```
Browser (public/, static)
  /admin/login.html, /admin/dashboard.html, /admin/batch-editor.html   (mentor)
  /join.html   → served at /join/:slug                                 (learner)
  /live.html   → served at /live/:slug   (?mode=mentor for the host view)
        │                                        │
        │ fetch("/api/...")                      │ live listener (Firebase client SDK, read-only)
        ▼                                         ▼
Netlify Functions (netlify/functions/*.js)   Firebase Realtime Database (liveState/{batchId})
        │ HTTPS POST + shared secret               ▲
        ▼                                          │ Admin SDK write (mentor-only, via requireMentor())
Google Apps Script Web App (apps-script/Code.gs) ──┘
        │
        ▼
Google Sheets (database)   +   Google Drive (photos)
```

## One-time setup (you must do this yourself)

1. **Spreadsheet**: create a new Google Sheet with the 7 tabs and header
   rows below (row 1 = headers, exact names matter).
2. **Apps Script**: open the spreadsheet → Extensions → Apps Script, delete
   the default code, and paste in the contents of `apps-script/Code.gs`
   from this repo.
3. **Script properties**: in the Apps Script editor, Project Settings (gear
   icon) → Script Properties → add:
   - `API_SECRET` — any long random string you make up (this is the shared
     secret Netlify Functions send to prove the request is legitimate)
   - `DRIVE_FOLDER_ID` *(optional)* — a Drive folder ID to keep learner
     photos organized; if omitted, photos are created in Drive's root
4. **Deploy the Web App**: Deploy → New deployment → type "Web app" →
   Execute as **Me** → Who has access **Anyone** → Deploy → authorize the
   permissions it asks for → copy the Web app URL (ends in `/exec`).
5. **Firebase Realtime Database**: create a project at
   [console.firebase.google.com](https://console.firebase.google.com) and add
   a Realtime Database to it (any region).
   - **Client config**: Project Settings → General → Your apps → add a Web
     app → copy the config object into `public/assets/firebase-client.js`.
     This apiKey is not a secret; Firebase web configs are meant to be public
     — access is enforced by the database rules below, not by hiding this.
   - **Service account** (for the Netlify functions' Admin SDK, which is the
     only thing allowed to write): Project Settings → Service Accounts →
     Generate new private key → downloads a JSON file. From it, set as
     Netlify env vars: `FIREBASE_PROJECT_ID` (`project_id`),
     `FIREBASE_CLIENT_EMAIL` (`client_email`), `FIREBASE_PRIVATE_KEY`
     (`private_key`, keep the `\n` sequences as-is), plus
     `FIREBASE_DATABASE_URL` (the `https://<project>-default-rtdb...`
     URL shown on the Realtime Database page). Never commit that JSON file.
   - **Security rules** (Realtime Database → Rules tab): deny all client
     writes, since only the Admin SDK (server-side, gated by
     `requireMentor()`) should ever write:
     ```json
     { "rules": { "liveState": { ".read": true, ".write": false } } }
     ```
6. **Netlify env vars** (Site settings → Environment variables):
   - `APPS_SCRIPT_URL` — the `/exec` URL from step 4
   - `APPS_SCRIPT_SECRET` — the same value as `API_SECRET` from step 3
   - `MENTOR_PASSWORD` — the one shared password mentors log in with
   - `SESSION_SECRET` — any long random string, used to sign session tokens
   - `DEFAULT_MUSIC_URL` *(optional)* — fallback track if a batch has none set
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`,
     `FIREBASE_DATABASE_URL` — from step 5
7. **Deploy the site**: connect this repo to Netlify (publish directory
   `public`, functions directory `netlify/functions`), or deploy with the
   Netlify CLI (`netlify deploy --prod`).
8. **Music**: this repo does not ship an audio file. Either set a "Default
   Music URL" per batch in the admin Settings tab, or add your own licensed
   loop at `public/assets/music/default-loop.mp3` (see the README in that
   folder — do not use commercial songs). The mentor's and every learner's
   audio position resyncs against a shared `musicStartedAt` timestamp in
   Firebase (stamped the moment the mentor opens the live page), pushed live
   instead of polled, so playback stays aligned across everyone watching.
   Each page is still a separate browser tab/document, so browser autoplay
   rules mean a learner may need to tap "Tap to Enter" once on `/join/...`
   and again on `/live/...` — that second tap is a browser security
   requirement (loudest on iOS Safari), not something JS can bypass.

Redeploying the Apps Script after edits: use **Deploy → Manage deployments
→ edit (pencil) → New version → Deploy** so the `/exec` URL stays the same;
"New deployment" instead would generate a different URL you'd have to update
in Netlify.

## Google Sheets schema

Row 1 of every tab = header row, exact column names below (order doesn't
matter, the code keys off header name).

**Batches**
`id, name, programName, cohortLabel, joinSlug, status, eventDateISO, eventDateLabel, musicDefaultUrl, createdAt, updatedAt, settingsJson`

**Roster**
`batchId, learnerId, name, colorHex, photoUrl, photoDriveFileId, dreamJobTitle, dreamJobEmoji, sortOrder, joined, joinedAt`

**Messages**
`batchId, learnerId, learnerName, messageText, sortOrder`

**SpecialCerts**
`batchId, certId, type, icon, label, awardTitle, winnerLearnerIds, winnerNames, description, sortOrder`

**Awards**
`batchId, awardId, category, winnerLearnerId, winnerName, winnerRole, sortOrder`

**Questions**
`batchId, questionId, kind, sortOrder, text, optionA, optionB, optionC, optionD, correctIndex, explanation, timerSeconds`

**Responses**
`batchId, questionId, learnerId, learnerName, selectedOption, isCorrect, submittedAt`

Just create these 7 tabs with those header rows — every row after that is
managed entirely by the app. (There is no `LiveState` tab anymore — that data
now lives in Firebase Realtime Database, see the setup steps above.)

## Using it

**Mentor**: go to `/admin`, log in with `MENTOR_PASSWORD`, create a batch,
open its editor to bulk-import the roster, upload photos, write personal
messages, add special certificates and peer-voted awards, and build the
quiz/poll question list. Flip the batch to **Live**, copy its join link
(`/join/<slug>`) and share it with learners. Click **Present** to open the
live ceremony view (`/live/<slug>?mode=mentor`) — Next/Prev/Reveal drive the
ceremony for everyone.

**Learner**: opens the join link, picks their name (or types it if not
listed), taps to enter (starts the music), and follows the ceremony live.
During the quiz/poll slide they tap an answer on their own phone and see
results the moment the mentor reveals them.

## Local development

```
cd netlify/functions && npm install
netlify dev   # requires the Netlify CLI + the env vars above in a .env file
```

## Known v1 limitations

- Questions/certs/awards support add + delete from the admin UI, not
  in-place editing (delete and re-add to change one).
- Per-slide music crossfade is supported in the music player but there's no
  admin UI to configure it yet — only a single default track per batch.
- Roster bulk import writes rows sequentially (fine for cohorts of dozens;
  would need batching for hundreds).
- The Apps Script Web App is a single shared endpoint with no built-in rate
  limiting beyond Google's own quotas — comfortably handles a cohort of
  dozens polling every few seconds during a live ceremony, but wasn't built
  for hundreds of concurrent learners.
