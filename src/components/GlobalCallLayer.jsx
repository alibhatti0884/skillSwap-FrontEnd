import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import IncomingCallToast from './IncomingCallToast';
import VideoCallModal from './VideoCallModal';

// Mounted once at the app root (main.jsx) — a single VideoCallModal instance
// driven by CallContext, regardless of which page triggered or is receiving
// the call. This replaces the old design where every open ChatWindow rendered
// its own independent copy.
export default function GlobalCallLayer() {
  const { user } = useAuth();
  const { activeCall, closeActiveCall } = useCall();

  if (!user) return null;

  return (
    <>
      <IncomingCallToast />
      {activeCall && (
        <VideoCallModal
          swap={{ _id: activeCall.swapId }}
          mode={activeCall.mode}
          user={user}
          otherUser={activeCall.otherUser}
          onClose={closeActiveCall}
        />
      )}
    </>
  );
}
