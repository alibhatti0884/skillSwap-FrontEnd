import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { listenToNotifications } from '../firebase/notifications';
import { playNotificationSound } from '../utils/notificationSound';

/**
 * Why this exists: every page previously rendered its own <Navbar/>, which
 * meant navigating between pages unmounted and remounted the Firestore
 * notification listener each time — causing the bell/messages badge to
 * flash empty for a second or two before the fresh snapshot arrived.
 *
 * Fixing it properly means the listener has to live somewhere that doesn't
 * unmount on route changes — a context provider wrapping <App/> (see
 * main.jsx) is exactly that: it mounts once per login session and stays
 * alive across every page navigation, so Navbar just reads already-live
 * data instead of re-subscribing from scratch each time.
 *
 * It also owns the notification chime: it diffs each new snapshot against
 * the previous one to detect genuinely new items, and only plays a sound
 * for those — never for the initial historical batch that loads on login.
 */
const NotificationsContext = createContext([]);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const knownIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (!user?._id) {
      setItems([]);
      knownIdsRef.current = new Set();
      isFirstLoadRef.current = true;
      return;
    }

    const unsubscribe = listenToNotifications(user._id, (newItems) => {
      if (!isFirstLoadRef.current) {
        const hasGenuinelyNewItem = newItems.some((n) => !knownIdsRef.current.has(n.id));
        if (hasGenuinelyNewItem) playNotificationSound();
      }
      knownIdsRef.current = new Set(newItems.map((n) => n.id));
      isFirstLoadRef.current = false;
      setItems(newItems);
    });

    return () => unsubscribe && unsubscribe();
  }, [user?._id]);

  return <NotificationsContext.Provider value={items}>{children}</NotificationsContext.Provider>;
}

export const useNotificationsContext = () => useContext(NotificationsContext);
