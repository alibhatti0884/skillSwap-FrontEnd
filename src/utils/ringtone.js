/**
 * Call ringtone playback (client/public/sounds/call-ringtone.mp3, provided
 * by the project owner). Used both for the callee's incoming-call banner
 * and the caller's "ringing, waiting for answer" state — see ChatWindow.jsx
 * and VideoCallModal.jsx.
 *
 * Note: browsers block audio autoplay until the user has interacted with
 * the page at least once (a click, tap, etc). In practice this is a non-issue
 * here since starting or accepting a call is itself a click — but the first
 * page load's very first sound may need a prior interaction to unlock audio.
 */
let audioEl = null;

export function startRingtone() {
  stopRingtone(); // guard against double-start
  try {
    audioEl = new Audio('/sounds/call-ringtone.mp3');
    audioEl.loop = true;
    audioEl.volume = 0.65;
    audioEl.play().catch((err) => {
      console.warn('[ringtone] Autoplay was blocked until user interaction:', err.message);
    });
  } catch (err) {
    console.warn('[ringtone] Could not play ringtone:', err.message);
  }
}

export function stopRingtone() {
  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
    audioEl = null;
  }
}
