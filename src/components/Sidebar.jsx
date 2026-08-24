import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User, Search, Repeat, ArrowLeftRight, MessageSquare, Bell, Settings } from 'lucide-react';
import InviteFriendsModal from './InviteFriendsModal';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', Icon: Home, end: true },
  { to: '/profile', label: 'My Profile', Icon: User },
  { to: '/search', label: 'Search Skills', Icon: Search },
  { to: '/matching', label: 'Skill Matching', Icon: Repeat },
  { to: '/swaps', label: 'Swap Requests', Icon: ArrowLeftRight },
  { to: '/messages', label: 'Messages', Icon: MessageSquare },
  { to: '/notifications', label: 'Notifications', Icon: Bell },
  { to: '/settings', label: 'Settings', Icon: Settings }
];

export default function Sidebar() {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-64px)] px-3 py-5">
      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-500 to-teal-600 text-white p-4">
        <p className="font-semibold text-sm leading-snug mb-3">
          Share Skills.<br />Build a Better Future.
        </p>
        <button
          onClick={() => setInviteOpen(true)}
          className="w-full bg-white/95 hover:bg-white text-brand-700 text-xs font-semibold py-2 rounded-lg"
        >
          Invite Friends
        </button>
      </div>

      {inviteOpen && <InviteFriendsModal onClose={() => setInviteOpen(false)} />}
    </aside>
  );
}
