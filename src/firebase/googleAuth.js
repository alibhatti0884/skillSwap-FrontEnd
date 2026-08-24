/**
 * "Continue with Google" — signs in via Firebase, grabs the resulting ID
 * token, and hands it to our own backend (POST /api/auth/google) so we get
 * back a normal SkillSwap JWT + user record. From that point on, the
 * Google-authenticated user works exactly like a locally-registered one.
 *
 * Uses signInWithRedirect (not a popup) on small/touch screens — mobile
 * browsers are inconsistent about popup windows (some block them outright,
 * others open them in a way that loses the window.opener link back to the
 * page that started it), while a full-page redirect works everywhere.
 * Desktop keeps the popup flow since it's the smoother UX there and doesn't
 * navigate away from the page.
 *
 * IMPORTANT — a platform limitation, not something fixable in this code:
 * Firebase Auth only allows sign-in from domains listed in Firebase Console
 * -> Authentication -> Settings -> Authorized domains, and it does not accept
 * bare IP addresses (like the 192.168.x.x address `--host 0.0.0.0` gives you
 * for testing on a phone) as an entry there. So Google sign-in specifically
 * will not work when you open the app via a LAN IP on your phone, no matter
 * which flow is used — only email/password login will work in that case.
 * To test Google sign-in from a phone, tunnel your dev server through
 * something like ngrok (`ngrok http 5173`), which gives you a real HTTPS
 * domain you can add to Firebase's authorized domains list.
 */
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from './config';

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

export async function signInWithGoogle() {
  if (isMobile()) {
    // Navigates away from the page; the result is picked up by
    // completeGoogleRedirect() on the next page load instead of returning here.
    await signInWithRedirect(auth, googleProvider);
    return null;
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user.getIdToken();
}

// Call once on mount (Login/Register) to catch the result of a redirect-based
// sign-in that completed on page reload. Resolves to null if there was no
// pending redirect (the normal case for a plain page load).
export async function completeGoogleRedirect() {
  const result = await getRedirectResult(auth);
  if (!result) return null;
  return result.user.getIdToken();
}
