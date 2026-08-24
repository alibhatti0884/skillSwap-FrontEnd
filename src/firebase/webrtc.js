/**
 * One-to-one video/audio calling using WebRTC, with Firestore as the
 * signaling channel (Firebase itself has no video-calling product — this is
 * the standard "Firestore as signaling server" pattern: peers exchange SDP
 * offer/answer + ICE candidates as documents, then media flows directly
 * peer-to-peer once connected).
 *
 * Firestore layout, one document per swap (reused across calls for that swap):
 *   calls/{swapId}
 *     - callerId, callerName, receiverId, status ('ringing' | 'connected'), offer, answer
 *   calls/{swapId}/callerCandidates/{autoId}
 *   calls/{swapId}/calleeCandidates/{autoId}
 *
 * `receiverId` + `callerName` exist specifically so a listener can find
 * "calls ringing for me" from anywhere in the app (see listenForIncomingCalls
 * below) — the earlier version of this app only detected incoming calls from
 * inside the exact chat window for that swap, which meant you'd miss a call
 * entirely if you were on any other page. See CallContext.jsx for how this
 * is used app-wide.
 *
 * Limitation (worth knowing for the viva): this uses public STUN servers
 * only, no TURN relay. It works great on the same network / most home
 * connections, but a small percentage of strict corporate/mobile NATs
 * would need a TURN server to connect — out of scope for a local prototype.
 */
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  addDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from './config';

const ICE_SERVERS = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
  ]
};

export function createPeerConnection() {
  return new RTCPeerConnection(ICE_SERVERS);
}

export async function getLocalStream({ video = true, audio = true } = {}) {
  return navigator.mediaDevices.getUserMedia({ video, audio });
}

// Watches one specific swap's call doc (used while a call is actively in
// progress, to detect the other side hanging up).
export function listenForCall(swapId, callback) {
  const callDoc = doc(db, 'calls', swapId);
  return onSnapshot(callDoc, (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

// App-wide: watches for ANY call currently ringing for this user, regardless
// of which page they're on. This is what powers the global "Incoming call"
// toast (IncomingCallToast.jsx via CallContext.jsx).
export function listenForIncomingCalls(userId, callback) {
  const q = query(
    collection(db, 'calls'),
    where('receiverId', '==', userId),
    where('status', '==', 'ringing')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Caller side: create the offer, write it to Firestore (including who it's
// for, so listenForIncomingCalls can find it), and start relaying local ICE
// candidates + listening for the callee's answer/candidates.
export async function startCall(swapId, pc, { callerId, callerName, receiverId }) {
  const callDoc = doc(db, 'calls', swapId);
  const callerCandidates = collection(callDoc, 'callerCandidates');

  pc.onicecandidate = (event) => {
    if (event.candidate) addDoc(callerCandidates, event.candidate.toJSON());
  };

  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  await setDoc(callDoc, {
    offer: { type: offerDescription.type, sdp: offerDescription.sdp },
    answer: null,
    callerId,
    callerName,
    receiverId,
    status: 'ringing'
  });

  const unsubAnswer = onSnapshot(callDoc, (snap) => {
    const data = snap.data();
    if (data?.answer && !pc.currentRemoteDescription) {
      pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  });

  const calleeCandidates = collection(callDoc, 'calleeCandidates');
  const unsubCandidates = onSnapshot(calleeCandidates, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        pc.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(() => {});
      }
    });
  });

  return () => {
    unsubAnswer();
    unsubCandidates();
  };
}

// Callee side: read the pending offer, create + write the answer, and start
// relaying local ICE candidates + listening for the caller's candidates.
export async function answerCall(swapId, pc) {
  const callDoc = doc(db, 'calls', swapId);
  const calleeCandidates = collection(callDoc, 'calleeCandidates');

  pc.onicecandidate = (event) => {
    if (event.candidate) addDoc(calleeCandidates, event.candidate.toJSON());
  };

  const callSnap = await getDoc(callDoc);
  const callData = callSnap.data();
  if (!callData?.offer) throw new Error('This call is no longer available');

  await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  await updateDoc(callDoc, {
    answer: { type: answerDescription.type, sdp: answerDescription.sdp },
    status: 'connected'
  });

  const callerCandidates = collection(callDoc, 'callerCandidates');
  const unsubCandidates = onSnapshot(callerCandidates, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        pc.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(() => {});
      }
    });
  });

  return () => unsubCandidates();
}

// Ends the call for both sides (deletes the signaling doc + candidate
// subcollections) and stops all local media tracks.
export async function endCall(swapId, pc, localStream) {
  try {
    if (localStream) localStream.getTracks().forEach((t) => t.stop());
    if (pc) pc.close();

    const callDoc = doc(db, 'calls', swapId);
    for (const sub of ['callerCandidates', 'calleeCandidates']) {
      const snap = await getDocs(collection(callDoc, sub));
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    }
    await deleteDoc(callDoc);
  } catch (err) {
    // Call doc may already be gone if the other side hung up first — that's fine
    console.warn('[webrtc] endCall cleanup:', err.message);
  }
}
