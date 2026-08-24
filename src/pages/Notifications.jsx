import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNotificationsContext } from '../context/NotificationsContext';
import { markNotificationRead } from '../firebase/notifications';
import { Bell, Repeat, CheckCircle2, XCircle, MessageCircle } from 'lucide-react';

const ICONS = {
  swap_request: Repeat,
  swap_accepted: CheckCircle2,
  swap_rejected: XCircle,
  message: MessageCircle
};

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Notifications tab — full live feed (bell dropdown only shows the latest 30, trimmed)
export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const items = useNotificationsContext();

  const markAllRead = () => {
    items.filter((n) => !n.read).forEach((n) => markNotificationRead(user._id, n.id));
  };

  const handleClick = async (n) => {
    if (!n.read) await markNotificationRead(user._id, n.id);
    if (n.relatedType === 'swap' || n.relatedType === 'chat') navigate('/swaps');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 px-4 sm:px-6 py-6 max-w-2xl">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Bell size={20} className="text-brand-600" /> Notifications
            </h2>
            {items.some((n) => !n.read) && (
              <button onClick={markAllRead} className="text-xs text-brand-600 font-medium hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-5">Live updates via Firebase — swap requests, responses, and messages</p>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {items.length === 0 && <p className="text-sm text-slate-400 p-6 text-center">No notifications yet</p>}
            {items.map((n) => {
              const Icon = ICONS[n.type] || Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-5 py-4 border-b border-slate-50 hover:bg-slate-50 flex gap-3 ${
                    !n.read ? 'bg-brand-50/40' : ''
                  }`}
                >
                  <span className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <Icon size={16} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-slate-800">{n.title}</span>
                    <span className="block text-xs text-slate-500">{n.body}</span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="w-2 h-2 mt-1 rounded-full bg-brand-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
