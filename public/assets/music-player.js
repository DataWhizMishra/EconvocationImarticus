/* Persistent background-music singleton used by join.html and live.html.
   Browsers block audio.play() with sound unless it happens in/near a user
   gesture, so init() always tries an immediate autoplay first (works right
   after a gesture on a prior page in most browsers) and only falls back to
   showing the page's #gate overlay if that's rejected. */
(function () {
  let audioEl = null;
  let currentSrc = null;
  let muted = false;
  try {
    muted = localStorage.getItem('econvo_muted') === '1';
  } catch (e) {
    /* ignore */
  }

  const DEFAULT_TRACK = '/assets/music/default-loop.mp3';

  function ensureAudio() {
    if (!audioEl) {
      audioEl = document.createElement('audio');
      audioEl.loop = true;
      audioEl.volume = 0.55;
      audioEl.muted = muted;
      // `display:none` is known to silently break <audio> playback in some
      // WebKit/Safari versions (the element never actually starts, with no
      // error) - keep it in the layout but visually/interactively invisible
      // instead.
      audioEl.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
      audioEl.addEventListener('error', () => {
        const err = audioEl.error;
        console.error('MusicPlayer: <audio> failed to load/play', {
          code: err && err.code,
          message: err && err.message,
          src: audioEl.currentSrc,
        });
      });
      document.body.appendChild(audioEl);
    }
    return audioEl;
  }

  function showGate() {
    const gate = document.getElementById('gate');
    if (gate) gate.classList.remove('hidden');
  }
  function hideGate() {
    const gate = document.getElementById('gate');
    if (gate) gate.classList.add('hidden');
  }

  function play(src) {
    const el = ensureAudio();
    const target = src || DEFAULT_TRACK;
    if (currentSrc !== target) {
      el.src = target;
      currentSrc = target;
    }
    el.muted = muted;
    return el.play();
  }

  // Seeks the currently loaded track to where it "should" be right now given
  // a shared start reference (epoch ms), so every client - mentor and every
  // learner, whenever their own audio element actually starts - lands on
  // (near enough) the same position instead of each one starting the loop
  // from 0 whenever their own gate happens to get tapped. Safe to call often
  // (e.g. every poll tick): it only seeks when drift exceeds DRIFT_TOLERANCE.
  const DRIFT_TOLERANCE_SEC = 1.5;
  function resyncTo(startedAtMs) {
    if (!startedAtMs || !audioEl) return;
    const seek = () => {
      const dur = audioEl.duration;
      if (!dur || !isFinite(dur) || dur <= 0) return;
      const elapsed = (Date.now() - Number(startedAtMs)) / 1000;
      const target = ((elapsed % dur) + dur) % dur;
      if (Math.abs(audioEl.currentTime - target) > DRIFT_TOLERANCE_SEC) {
        audioEl.currentTime = target;
      }
    };
    if (audioEl.readyState >= 1) seek();
    else audioEl.addEventListener('loadedmetadata', seek, { once: true });
  }

  // Resolves once music is either playing (autoplay allowed) or the user has
  // tapped #gate to start it. If the page has no #gate element and autoplay
  // is blocked, resolves anyway so the caller isn't stuck waiting forever.
  function init(src, startedAtMs) {
    return new Promise((resolve) => {
      play(src)
        .then(() => {
          hideGate();
          if (startedAtMs) resyncTo(startedAtMs);
          resolve('autoplay');
        })
        .catch(() => {
          showGate();
          const gate = document.getElementById('gate');
          if (!gate) {
            resolve('no-gate');
            return;
          }
          const onTap = () => {
            play(src)
              .then(() => {
                if (startedAtMs) resyncTo(startedAtMs);
              })
              .catch((err) => {
                // Tapping counts as a user gesture even if this first attempt
                // lost a race with something else (e.g. the element wasn't
                // fully attached yet) - one quick retry recovers most of
                // those without leaving the user stuck on a black screen.
                console.warn('MusicPlayer: playback failed after tap, retrying once', err);
                setTimeout(() => {
                  play(src)
                    .then(() => {
                      if (startedAtMs) resyncTo(startedAtMs);
                    })
                    .catch((err2) => console.error('MusicPlayer: retry also failed', err2));
                }, 300);
              });
            hideGate();
            resolve('gesture');
          };
          gate.addEventListener('click', onTap, { once: true });
        });
    });
  }

  function crossfadeTo(src) {
    if (!src || src === currentSrc) return;
    const el = ensureAudio();
    const targetVolume = 0.55;
    const fadeOut = setInterval(() => {
      const v = Math.max(0, el.volume - 0.05);
      el.volume = v;
      if (v <= 0) {
        clearInterval(fadeOut);
        el.src = src;
        currentSrc = src;
        el.volume = 0;
        el.play().catch(() => {});
        const fadeIn = setInterval(() => {
          const v2 = Math.min(targetVolume, el.volume + 0.05);
          el.volume = v2;
          if (v2 >= targetVolume) clearInterval(fadeIn);
        }, 40);
      }
    }, 40);
  }

  function toggleMute() {
    muted = !muted;
    if (audioEl) audioEl.muted = muted;
    try {
      localStorage.setItem('econvo_muted', muted ? '1' : '0');
    } catch (e) {
      /* ignore */
    }
    return muted;
  }
  function isMuted() {
    return muted;
  }

  window.MusicPlayer = { init, crossfadeTo, toggleMute, isMuted, resyncTo, DEFAULT_TRACK };
})();
