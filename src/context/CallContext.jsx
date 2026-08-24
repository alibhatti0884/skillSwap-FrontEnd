import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { listenForIncomingCalls, listenForCall, endCall } from '../firebase/webrtc';
import { startRingtone, stopRingtone } from '../utils/ringtone';

/**
 * Centralizes ALL call state app-wide, fixing two real bugs from the earlier
 * per-ChatWindow design:
 *
 * 1. Incoming calls were only detected while the exact chat for that swap was
 *    open — miss it entirely on any other page. Now `listenForIncomingCalls`
 *    (keyed on receiverId, not swapId) runs globally, so IncomingCallToast can
 *    render top-right no matter what page you're on.
 *
 * 2. Decline appeared to silently do nothing in some cases because the UI
 *    state and the Firestore delete were only ever watched from inside the
 *    one component. Here, decline updates local state immediately and
 *    synchronously (not waiting on a round-trip snapshot), and the caller's
 *    side separately watches the active call doc so it can detect
 *    "the other person declined/hung up" and close its own modal.
 */
const CallContext = createContext(null);

export function CallProvider({ children }) {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState(null); // { id, callerId, callerName }
  const [activeCall, setActiveCall] = useState(null); // { swapId, mode, otherUser }
  const [endedNotice, setEndedNotice] = useState(null);
  const endedByMeRef = useRef(false);

  // Global incoming-call listener — works from any page
  useEffect(() => {
    if (!user?._id) {
      setIncomingCall(null);
      return;
    }
    const unsubscribe = listenForIncomingCalls(user._id, (calls) => {
      setIncomingCall((current) => {
        if (activeCall) return null; // already on a call — ignore new rings for this simple 1-call-at-a-time model
        return calls[0] || null;
      });
    });
    return () => unsubscribe && unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, activeCall]);

  // Ring while a call is waiting for a response and we're not already on one
  useEffect(() => {
    if (incomingCall && !activeCall) {
      startRingtone();
    } else {
      stopRingtone();
    }
    return () => stopRingtone();
  }, [incomingCall, activeCall]);

  // Watch the active call's doc so the caller side notices if the callee
  // declines/hangs up before VideoCallModal's own logic would catch it.
  useEffect(() => {
    if (!activeCall) {
      endedByMeRef.current = false;
      return;
    }
    const unsubscribe = listenForCall(activeCall.swapId, (call) => {
      if (!call) {
        if (!endedByMeRef.current) {
          setEndedNotice(`${activeCall.otherUser.name} ended the call`);
        }
        endedByMeRef.current = false;
        setActiveCall(null);
      }
    });
    return () => unsubscribe && unsubscribe();
  }, [activeCall]);

  useEffect(() => {
    if (!endedNotice) return;
    const t = setTimeout(() => setEndedNotice(null), 3500);
    return () => clearTimeout(t);
  }, [endedNotice]);

  // Auto-decline if the incoming call isn't answered within 10s. This runs
  // independently of the caller's own 10s no-answer timeout in
  // VideoCallModal.jsx — whichever side's timer fires first deletes the
  // Firestore call doc, and the other side's listener picks that up and
  // closes on its own, so both directions are covered even if only one
  // side's tab is actually active/foregrounded.
  useEffect(() => {
    if (!incomingCall || activeCall) return;
    const timeout = setTimeout(() => {
      endCall(incomingCall.id, null, null);
      setIncomingCall(null);
    }, 10000);
    return () => clearTimeout(timeout);
  }, [incomingCall, activeCall]);

  const startCallTo = useCallback((swapId, otherUser) => {
    setActiveCall({ swapId, mode: 'caller', otherUser });
  }, []);

  const acceptIncomingCall = useCallback(() => {
    setIncomingCall((current) => {
      if (!current) return current;
      setActiveCall({
        swapId: current.id,
        mode: 'callee',
        otherUser: { _id: current.callerId, name: current.callerName }
      });
      return null;
    });
  }, []);

  const declineIncomingCall = useCallback(async () => {
    setIncomingCall((current) => {
      if (current) endCall(current.id, null, null);
      return null;
    });
  }, []);

  // Called by VideoCallModal's onClose — it has already handled its own
  // Firestore cleanup by this point, so we just mark "I ended this" to
  // suppress the doc-watch effect's "other person ended the call" notice.
  const closeActiveCall = useCallback(() => {
    endedByMeRef.current = true;
    setActiveCall(null);
  }, []);

  return (
    <CallContext.Provider
      value={{
        incomingCall,
        activeCall,
        endedNotice,
        startCallTo,
        acceptIncomingCall,
        declineIncomingCall,
        closeActiveCall
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export const useCall = () => useContext(CallContext);
