/**
 * One-shot notification chime (client/public/sounds/notification.mp3,
 * provided by the project owner). Played from NotificationsContext whenever
 * a genuinely new item arrives (never on the initial historical load — see
 * the firstLoad guard in NotificationsContext.jsx).
 */
export function playNotificationSound() {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.6;
    audio.play().catch((err) => {
      console.warn('[notificationSound] Autoplay was blocked until user interaction:', err.message);
    });
  } catch (err) {
    console.warn('[notificationSound] Could not play sound:', err.message);
  }
}
