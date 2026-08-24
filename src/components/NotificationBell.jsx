import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Repeat, CheckCircle2, XCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { markNotificationRead } from '../firebase/notifications';

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

/**
 * Real-time notification bell, backed by Firestore (notifications/{userId}/items).
 * Covers: swap request received, swap accepted, swap rejected, new message.
 * `items` is the full live feed, shared from Navbar so we don't open a second listener.
 */
export default function NotificationBell({ items }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  const handleClick = async (n) => {
    if (!n.read) await markNotificationRead(user._id, n.id);
    setOpen(false);
    if (n.relatedType === 'swap' || n.relatedType === 'chat') navigate('/swaps');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
        aria-label="Notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-700">
            Notifications
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="text-sm text-slate-400 px-4 py-6 text-center">No notifications yet</p>
            )}
            {items.map((n) => {
              const Icon = ICONS[n.type] || Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 flex gap-3 ${
                    !n.read ? 'bg-brand-50/40' : ''
                  }`}
                >
                  <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <Icon size={15} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-slate-800 truncate">{n.title}</span>
                    <span className="block text-xs text-slate-500 truncate">{n.body}</span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="w-2 h-2 mt-1 rounded-full bg-brand-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
