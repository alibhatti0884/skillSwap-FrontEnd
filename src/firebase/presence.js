/**
 * Lightweight online/offline presence, backed by Firestore.
 *
 * Firestore layout:
 *   presence/{userId}  ->  { online: boolean, lastSeen: Timestamp }
 *
 * Honesty note on the approach: this is a heartbeat + best-effort
 * beforeunload/visibilitychange model, not Firebase Realtime Database's
 * onDisconnect (which is the more bulletproof way to do presence — it fires
 * server-side even if the tab crashes or loses network suddenly, since RTDB
 * itself notices the dropped connection). Using RTDB here would mean setting
 * up a second Firebase product alongside Firestore for one feature, which is
 * more setup complexity than this prototype needs. The heartbeat + staleness
 * check below (see listenToPresence) covers the common cases — closing the
 * tab, navigating away, switching apps — reasonably well for a local demo.
 */
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

const HEARTBEAT_MS = 25000;
const STALE_AFTER_MS = 60000; // if no heartbeat in this long, treat as offline regardless of the stored flag

export function goOnline(userId) {
  if (!userId) return () => {};
  const ref = doc(db, 'presence', userId);

  const markOnline = () => setDoc(ref, { online: true, lastSeen: serverTimestamp() }, { merge: true }).catch(() => {});
  const markOffline = () => setDoc(ref, { online: false, lastSeen: serverTimestamp() }, { merge: true }).catch(() => {});

  markOnline();
  const heartbeat = setInterval(markOnline, HEARTBEAT_MS);

  const handleVisibility = () => {
    if (document.visibilityState === 'hidden') markOffline();
    else markOnline();
  };
  window.addEventListener('beforeunload', markOffline);
  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    clearInterval(heartbeat);
    window.removeEventListener('beforeunload', markOffline);
    document.removeEventListener('visibilitychange', handleVisibility);
    markOffline();
  };
}

export function listenToPresence(userId, callback) {
  if (!userId) return () => {};
  const ref = doc(db, 'presence', userId);
  return onSnapshot(ref, (snap) => {
    const data = snap.data();
    if (!data) {
      callback({ online: false, lastSeen: null });
      return;
    }
    const lastSeenMs = data.lastSeen?.toMillis ? data.lastSeen.toMillis() : 0;
    const isStale = Date.now() - lastSeenMs > STALE_AFTER_MS;
    callback({ online: !!data.online && !isStale, lastSeen: data.lastSeen });
  });
}
