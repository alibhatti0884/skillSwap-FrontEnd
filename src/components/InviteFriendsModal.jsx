import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// A real, working invite flow: a shareable registration link (with a ?ref=
// tag identifying the inviter — cosmetic for now, but ready to be read by a
// future referral-tracking backend route) plus copy-to-clipboard and the
// native share sheet on devices/browsers that support it.
export default function InviteFriendsModal({ onClose }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/register?ref=${user?._id || ''}`;
  const shareText = `Join me on SkillSwap — swap skills, not money! ${inviteLink}`;
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail on non-HTTPS/insecure contexts — fall back silently
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: 'Join SkillSwap', text: shareText, url: inviteLink });
    } catch {
      // User cancelled the share sheet — nothing to do
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>

        <h3 className="font-bold text-slate-800 mb-1">Invite Friends</h3>
        <p className="text-sm text-slate-500 mb-4">
          Share your link — when friends join SkillSwap, you'll both get more people to swap skills with.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <input
            readOnly
            value={inviteLink}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-600 truncate"
          />
          <button
            onClick={handleCopy}
            className="shrink-0 bg-slate-800 text-white text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1.5"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {canShare && (
          <button
            onClick={handleShare}
            className="w-full bg-gradient-to-r from-brand-600 to-teal-600 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2"
          >
            <Share2 size={16} /> Share via...
          </button>
        )}
      </div>
    </div>
  );
}
