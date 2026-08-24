import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNotificationsContext } from '../context/NotificationsContext';
import { markNotificationRead } from '../firebase/notifications';
import { MessageSquare } from 'lucide-react';

// Messages tab — pure conversation list (Accepted/Completed swaps only),
// distinct from Swap Requests which also handles Pending accept/reject.
export default function Messages() {
  const { user } = useAuth();
  const notifications = useNotificationsContext();
  const [swaps, setSwaps] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get('/api/swaps');
      const conversations = data.swaps.filter((s) => s.status === 'Accepted' || s.status === 'Completed');
      setSwaps(conversations);
      setLoading(false);
    };
    load();
  }, []);

  // Unread message count per conversation, derived from the same live
  // notification feed the bell/messages icon already use — no extra reads.
  const unreadBySwap = useMemo(() => {
    const counts = {};
    notifications.forEach((n) => {
      if (n.type === 'message' && !n.read && n.relatedId) {
        counts[n.relatedId] = (counts[n.relatedId] || 0) + 1;
      }
    });
    return counts;
  }, [notifications]);

  const openConversation = (swap) => {
    setActiveChat(swap);
    // Mark this conversation's message notifications read as soon as it's opened
    notifications
      .filter((n) => n.type === 'message' && !n.read && n.relatedId === swap._id)
      .forEach((n) => markNotificationRead(user._id, n.id));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 px-4 sm:px-6 py-6">
          <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
            <MessageSquare size={20} className="text-brand-600" /> Messages
          </h2>
          <p className="text-sm text-slate-500 mb-5">Real-time conversations for your accepted swaps (Firebase)</p>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden h-fit">
              {loading && <p className="text-sm text-slate-400 p-4">Loading...</p>}
              {!loading && swaps.length === 0 && (
                <p className="text-sm text-slate-400 p-4">
                  No conversations yet. Accept a swap request to start chatting.
                </p>
              )}
              {swaps.map((swap) => {
                const otherUser = swap.sender._id === user._id ? swap.receiver : swap.sender;
                const isActive = activeChat?._id === swap._id;
                const unread = unreadBySwap[swap._id] || 0;
                return (
                  <button
                    key={swap._id}
                    onClick={() => openConversation(swap)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 flex items-center gap-3 hover:bg-slate-50 ${
                      isActive ? 'bg-brand-50' : ''
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-teal-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                      {otherUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                        {otherUser.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{swap.offeredSkill} ↔ {swap.requestedSkill}</p>
                    </div>
                    {unread > 0 && (
                      <span className="shrink-0 bg-brand-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="h-[calc(100vh-220px)]">
              {activeChat ? (
                <ChatWindow key={activeChat._id} swap={activeChat} inline />
              ) : (
                <div className="h-full flex items-center justify-center bg-white rounded-2xl border border-slate-200 text-sm text-slate-400 text-center px-6">
                  Select a conversation to start chatting.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
