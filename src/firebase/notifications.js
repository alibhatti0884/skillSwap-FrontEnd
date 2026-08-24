/**
 * Real-time notification feed, backed by Firestore.
 *
 * Firestore layout:
 *   notifications/{userId}/items/{autoId}
 *     - type: 'swap_request' | 'swap_accepted' | 'swap_rejected' | 'message'
 *     - title, body, read, relatedId, relatedType, createdAt
 *
 * Swap-related notifications (request/accept/reject) are written by the
 * Express backend via firebase-admin (see server/services/notificationService.js).
 * Message notifications are written directly from the client when a chat
 * message is sent, since chat itself is client-driven through Firestore.
 */
import { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from './config';

// Shared React hook so the notification bell and the messages icon in the
// Navbar can both react to the same live Firestore feed without duplicating
// listeners.
export function useNotifications(userId) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = listenToNotifications(userId, setItems);
    return () => unsubscribe && unsubscribe();
  }, [userId]);

  return items;
}

export function listenToNotifications(userId, callback) {
  const itemsRef = collection(db, 'notifications', userId, 'items');
  const q = query(itemsRef, orderBy('createdAt', 'desc'), limit(30));

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
}

export async function markNotificationRead(userId, notificationId) {
  const ref = doc(db, 'notifications', userId, 'items', notificationId);
  await updateDoc(ref, { read: true });
}

// Called from the client (chat.js caller) when a message is sent, so the
// recipient gets a live "New message" notification even if they aren't
// currently viewing that chat thread.
export async function notifyNewMessage(recipientId, { senderName, text, swapId }) {
  const itemsRef = collection(db, 'notifications', recipientId, 'items');
  await addDoc(itemsRef, {
    type: 'message',
    title: `New message from ${senderName}`,
    body: text.length > 60 ? text.slice(0, 60) + '…' : text,
    relatedId: swapId,
    relatedType: 'chat',
    read: false,
    createdAt: new Date().toISOString()
  });
}
