import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, PhoneCall } from 'lucide-react';
import {
  createPeerConnection,
  getLocalStream,
  startCall,
  answerCall,
  endCall
} from '../firebase/webrtc';
import { sendChatMessage } from '../firebase/chat';
import { notifyNewMessage } from '../firebase/notifications';
import { startRingtone, stopRingtone } from '../utils/ringtone';
import { listenToPresence } from '../firebase/presence';
import SpinningLogo from '../three/SpinningLogo';

function formatDuration(ms) {
  const totalSeconds = Math.round(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * FR7 extension: one-to-one video calling, signaled through Firestore.
 * `mode` is 'caller' (I clicked the video icon) or 'callee' (I'm accepting
 * someone else's incoming call).
 */
export default function VideoCallModal({ swap, mode, user, otherUser, onClose }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const cleanupSignalRef = useRef(null);
  const connectedAtRef = useRef(null);

  const [status, setStatus] = useState('connecting'); // connecting | ringing | connected | ended | error
  const [errorMsg, setErrorMsg] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [endedDuration, setEndedDuration] = useState(0);
  const [otherOnline, setOtherOnline] = useState(false);

  // Real presence for the other participant — decides "Ringing..." (they're
  // online, actively being notified right now) vs "Calling..." (they're
  // offline, so this is more like leaving a call attempt for whenever they
  // next open the app) per the requested wording.
  useEffect(() => {
    const unsubscribe = listenToPresence(otherUser._id, (p) => setOtherOnline(p.online));
    return () => unsubscribe && unsubscribe();
  }, [otherUser._id]);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      try {
        const stream = await getLocalStream();
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = createPeerConnection();
        pcRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
          if (!connectedAtRef.current) connectedAtRef.current = Date.now();
          setStatus('connected');
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            handleClose(false); // connection dropped — don't post a duplicate summary
          }
        };

        if (mode === 'caller') {
          setStatus('ringing');
          cleanupSignalRef.current = await startCall(swap._id, pc, {
            callerId: user._id,
            callerName: user.name,
            receiverId: otherUser._id
          });
        } else {
          cleanupSignalRef.current = await answerCall(swap._id, pc);
        }
      } catch (err) {
        setStatus('error');
        setErrorMsg(
          err.name === 'NotAllowedError'
            ? 'Camera/microphone permission was denied.'
            : err.message || 'Could not start the call.'
        );
      }
    };

    setup();

    // Always release the camera/mic and close the peer connection on unmount,
    // regardless of *why* it unmounted (manual hangup, remote hangup, or the
    // parent forcing it closed because the Firestore call doc disappeared).
    return () => {
      cancelled = true;
      if (cleanupSignalRef.current) cleanupSignalRef.current();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
      if (pcRef.current) pcRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ringback tone for the caller while waiting for the other side to answer
  // (the callee's own incoming-call ring is handled separately, in ChatWindow's
  // banner — the two sides never ring simultaneously since each browser is
  // only ever one role at a time for a given call).
  useEffect(() => {
    if (mode === 'caller' && status === 'ringing') {
      startRingtone();
    } else {
      stopRingtone();
    }
    return () => stopRingtone();
  }, [mode, status]);

  // No-answer timeout: if the callee hasn't picked up within 10s, auto-hang
  // up on the caller's side. The callee's own 10s auto-decline timer (see
  // CallContext.jsx) handles their side independently — whichever fires
  // first deletes the Firestore call doc, and the other side's listener
  // picks up the change and closes too.
  useEffect(() => {
    if (mode !== 'caller' || status !== 'ringing') return;
    const timeout = setTimeout(() => {
      handleClose(false); // no answer — not a manual hangup, no summary posted
    }, 10000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, status]);

  // manual = true when *I* clicked the hang-up button (as opposed to the
  // connection just dropping) — only then do we post a "call ended" summary,
  // so both sides don't each log a duplicate entry.
  const handleClose = async (manual = true) => {
    const duration = connectedAtRef.current ? Date.now() - connectedAtRef.current : 0;

    await endCall(swap._id, pcRef.current, localStreamRef.current);

    if (manual && duration > 1000) {
      const summary = `Video call ended — ${formatDuration(duration)}`;
      try {
        await sendChatMessage(swap._id, { senderId: user._id, senderName: user.name, text: summary });
        await notifyNewMessage(otherUser._id, { senderName: user.name, text: summary, swapId: swap._id });
      } catch {
        // Non-critical — the call itself already ended cleanly either way
      }
      setEndedDuration(duration);
      setStatus('ended');
      setTimeout(onClose, 2500);
    } else {
      onClose();
    }
  };

  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMicOn((m) => !m);
  };

  const toggleCam = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setCamOn((c) => !c);
  };

  if (status === 'ended') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
        <div className="w-full max-w-sm bg-slate-900 rounded-2xl p-8 text-center text-white">
          <div className="w-14 h-14 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4">
            <PhoneCall size={22} />
          </div>
          <p className="font-semibold mb-1">Call ended</p>
          <p className="text-sm text-white/60">with {otherUser.name} · {formatDuration(endedDuration)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="relative w-full max-w-2xl aspect-video bg-slate-900 rounded-2xl overflow-hidden">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-slate-900" />

        {status !== 'connected' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
            {status === 'error' ? (
              <p className="text-sm text-red-300 px-6 text-center">{errorMsg}</p>
            ) : (
              <>
                <SpinningLogo size={88} />
                <p className="text-sm text-white/80">
                  {status === 'ringing'
                    ? otherOnline
                      ? `Ringing ${otherUser.name}...`
                      : `Calling ${otherUser.name}...`
                    : 'Connecting...'}
                </p>
              </>
            )}
          </div>
        )}

        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-4 right-4 w-28 sm:w-36 aspect-video object-cover rounded-lg border-2 border-white/20 bg-slate-800"
        />

        <div className="absolute top-4 left-4 text-white text-sm font-medium bg-black/30 px-3 py-1 rounded-full">
          {otherUser.name}
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <button
            onClick={toggleMic}
            className={`w-11 h-11 rounded-full flex items-center justify-center ${micOn ? 'bg-white/20 text-white' : 'bg-white text-slate-800'}`}
            title={micOn ? 'Mute' : 'Unmute'}
          >
            {micOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
          <button
            onClick={() => handleClose(true)}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
            title="End call"
          >
            <PhoneOff size={20} />
          </button>
          <button
            onClick={toggleCam}
            className={`w-11 h-11 rounded-full flex items-center justify-center ${camOn ? 'bg-white/20 text-white' : 'bg-white text-slate-800'}`}
            title={camOn ? 'Turn camera off' : 'Turn camera on'}
          >
            {camOn ? <Video size={18} /> : <VideoOff size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
