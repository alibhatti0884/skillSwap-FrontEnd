/**
 * FR7 (Firebase edition): One-to-one real-time chat.
 *
 * Firestore layout:
 *   chats/{swapId}/messages/{autoId}
 *     - senderId, senderName, text, createdAt
 *
 * Using the accepted SwapRequest._id as the chat/document id keeps a 1:1
 * mapping between "who is allowed to chat" (enforced by the MongoDB swap
 * status = Accepted) and "which Firestore thread they land in".
 */
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

export function listenToMessages(swapId, callback) {
  const messagesRef = collection(db, 'chats', swapId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  // Real-time listener - fires immediately with current data, then again on every change
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
}

export async function sendChatMessage(swapId, { senderId, senderName, text }) {
  const messagesRef = collection(db, 'chats', swapId, 'messages');
  await addDoc(messagesRef, {
    senderId,
    senderName,
    text: text.trim(),
    createdAt: serverTimestamp()
  });
}
