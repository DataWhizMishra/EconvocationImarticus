# Background music

`music-player.js` falls back to `/assets/music/default-loop.mp3` when a batch
has no `musicDefaultUrl` set in its admin Settings tab. That file is **not**
included in this repo — you need to add your own properly licensed /
royalty-free looping track here (e.g. from the YouTube Audio Library, Pixabay
Music, or Free Music Archive CC0 tracks), named `default-loop.mp3`.

Do not use the commercial song names that appeared as host cue-bar text in
the original single-batch file (Avicii, Two Steps From Hell, Daft Punk,
Queen, etc.) as actual playable audio here — those were only ever meant as
a note telling a human host what to play over Zoom screenshare, not audio
this app streams itself.

Per-batch override: set "Default Music URL" in a batch's admin Settings tab
to point at any hosted mp3 URL instead of using this bundled fallback.
