import React from 'react';
import { PhoneIncoming, PhoneOff, Phone, PhoneCall } from 'lucide-react';
import { useCall } from '../context/CallContext';
import SpinningLogo from '../three/SpinningLogo';

// App-wide incoming call alert — top-right, visible no matter which page
// you're on, since CallContext's listener isn't scoped to any one chat.
export default function IncomingCallToast() {
  const { incomingCall, activeCall, acceptIncomingCall, declineIncomingCall, endedNotice } = useCall();

  return (
    <>
      {incomingCall && !activeCall && (
        <div className="fixed top-20 right-5 z-[75] w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative shrink-0">
              <SpinningLogo size={40} />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 animate-pulse border-2 border-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{incomingCall.callerName}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <PhoneIncoming size={12} /> Incoming video call
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={declineIncomingCall}
              className="flex-1 bg-red-50 text-red-600 text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-red-100"
            >
              <PhoneOff size={14} /> Decline
            </button>
            <button
              onClick={acceptIncomingCall}
              className="flex-1 bg-brand-600 text-white text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-brand-700"
            >
              <Phone size={14} /> Accept
            </button>
          </div>
        </div>
      )}

      {endedNotice && (
        <div className="fixed top-20 right-5 z-[75] bg-slate-800 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <PhoneCall size={14} /> {endedNotice}
        </div>
      )}
    </>
  );
}
