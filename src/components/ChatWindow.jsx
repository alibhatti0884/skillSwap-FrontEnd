import React, { useEffect, useRef, useState } from 'react';
import { Video, X, Smile, Paperclip, Mic, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { listenToMessages, sendChatMessage } from '../firebase/chat';
import { notifyNewMessage } from '../firebase/notifications';
import { listenToPresence } from '../firebase/presence';

function formatMessageTime(createdAt) {
  if (!createdAt) return 'Sending...';
  const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * FR7 (Firebase edition): one-to-one real-time chat for an Accepted swap.
 * Video calling itself is handled globally now (see CallContext.jsx,
 * IncomingCallToast.jsx, GlobalCallLayer.jsx) — this component only needs to
 * kick off an outgoing call via useCall().startCallTo(); it no longer tracks
 * incoming-call state locally, since that used to mean a call would be
 * missed entirely unless you already had this exact chat open.
 * Renders as a centered modal by default, or as an inline panel (used in the
 * Messages / Swap Requests pages) when `inline` is true.
 */
export default function ChatWindow({ swap, onClose, inline = false }) {
  const { user } = useAuth();
  const { startCallTo, activeCall } = useCall();
  const [messages, setMessages] = useState([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [text, setText] = useState('');
  const [otherOnline, setOtherOnline] = useState(false);
  const bottomRef = useRef(null);

  const otherUser = swap.sender._id === user._id ? swap.receiver : swap.sender;
  const isThisCallActive = activeCall?.swapId === swap._id;

  useEffect(() => {
    setMessages([]);
    setMessagesLoaded(false);
    const unsubscribe = listenToMessages(swap._id, (msgs) => {
      setMessages(msgs);
      setMessagesLoaded(true);
    });
    return () => unsubscribe && unsubscribe();
  }, [swap._id]);

  // Real presence (not a hardcoded "Online" label) — see firebase/presence.js
  useEffect(() => {
    const unsubscribe = listenToPresence(otherUser._id, (p) => setOtherOnline(p.online));
    return () => unsubscribe && unsubscribe();
  }, [otherUser._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');

    await sendChatMessage(swap._id, {
      senderId: user._id,
      senderName: user.name,
      text: trimmed
    });

    // Live "new message" notification for the other participant (FR7 + notifications)
    await notifyNewMessage(otherUser._id, {
      senderName: user.name,
      text: trimmed,
      swapId: swap._id
    });
  };

  const header = (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm">
            {otherUser.name.charAt(0).toUpperCase()}
          </div>
          <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${otherOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
        </div>
        <div className="leading-tight">
          <span className="block font-semibold text-slate-800 text-sm">{otherUser.name}</span>
          <span className={`block text-[11px] ${otherOnline ? 'text-green-600' : 'text-slate-400'}`}>
            {otherOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-slate-400">
        <button
          onClick={() => startCallTo(swap._id, otherUser)}
          disabled={!!activeCall}
          className={`hover:text-brand-600 disabled:opacity-40 disabled:hover:text-slate-400 ${isThisCallActive ? 'text-brand-600' : ''}`}
          title={isThisCallActive ? 'Call in progress' : 'Start video call'}
        >
          <Video size={18} />
        </button>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        )}
      </div>
    </div>
  );

  const body = (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-slate-50">
        {messagesLoaded && messages.length === 0 && (
          <p className="text-xs text-slate-400 text-center mt-6">
            Say hello to {otherUser.name} — messages sync in real time via Firebase.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === user._id;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  mine
                    ? 'bg-brand-600 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 px-1">{formatMessageTime(m.createdAt)}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-3 border-t border-slate-200 bg-white">
        <button type="button" className="text-slate-400" title="Emoji (not implemented)"><Smile size={19} /></button>
        <button type="button" className="text-slate-400" title="Attach (not implemented)"><Paperclip size={18} /></button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button type="button" className="text-slate-400" title="Voice (not implemented)"><Mic size={18} /></button>
        <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white rounded-full w-9 h-9 flex items-center justify-center shrink-0">
          <Send size={15} />
        </button>
      </form>
    </>
  );

  if (inline) {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {header}
        {body}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md h-[70vh] flex flex-col overflow-hidden">
        {header}
        {body}
      </div>
    </div>
  );
}
