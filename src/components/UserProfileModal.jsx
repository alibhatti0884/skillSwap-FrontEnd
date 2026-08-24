import React, { useEffect, useState } from 'react';
import { X, MapPin, GraduationCap, BookOpen } from 'lucide-react';
import api from '../api/axios';

// Read-only profile viewer, backed by the existing GET /api/profile/:id
// route. Used from "View Profile" buttons on match cards / search results.
export default function UserProfileModal({ userId, onClose, onSendRequest }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .get(`/api/profile/${userId}`)
      .then(({ data }) => {
        if (!cancelled) setProfile(data.user);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load this profile');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>

        {loading && <p className="text-sm text-slate-400 py-10 text-center">Loading profile...</p>}
        {error && <p className="text-sm text-red-500 py-10 text-center">{error}</p>}

        {profile && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-teal-600 text-white flex items-center justify-center text-2xl font-bold shrink-0">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-800 text-lg truncate">{profile.name}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <MapPin size={13} /> {profile.location || 'Location not set'}
                </p>
              </div>
            </div>

            {profile.bio && <p className="text-sm text-slate-600 mb-5">{profile.bio}</p>}

            <div className="mb-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <GraduationCap size={13} /> Skills Taught
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.skillsToTeach.length === 0 && <p className="text-xs text-slate-400">None listed</p>}
                {profile.skillsToTeach.map((s, i) => (
                  <span key={i} className="bg-brand-50 text-brand-700 text-xs px-3 py-1 rounded-full">{s.name}</span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <BookOpen size={13} /> Wants to Learn
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.skillsToLearn.length === 0 && <p className="text-xs text-slate-400">None listed</p>}
                {profile.skillsToLearn.map((s, i) => (
                  <span key={i} className="bg-amber-50 text-amber-700 text-xs px-3 py-1 rounded-full">{s.name}</span>
                ))}
              </div>
            </div>

            {onSendRequest && (
              <button
                onClick={onSendRequest}
                className="w-full bg-gradient-to-r from-brand-600 to-teal-600 text-white text-sm font-medium py-2.5 rounded-lg"
              >
                Send Swap Request
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
