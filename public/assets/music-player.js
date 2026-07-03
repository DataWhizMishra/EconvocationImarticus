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
      audioEl.style.display = 'none';
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

  // Resolves once music is either playing (autoplay allowed) or the user has
  // tapped #gate to start it. If the page has no #gate element and autoplay
  // is blocked, resolves anyway so the caller isn't stuck waiting forever.
  function init(src) {
    return new Promise((resolve) => {
      play(src)
        .then(() => {
          hideGate();
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
            play(src).catch(() => {});
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

  window.MusicPlayer = { init, crossfadeTo, toggleMute, isMuted, DEFAULT_TRACK };
})();
