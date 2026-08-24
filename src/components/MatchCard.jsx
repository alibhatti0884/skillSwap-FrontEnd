import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import UserProfileModal from './UserProfileModal';

// Converts the raw integer matchScore from the backend's matching engine into
// a friendly, capped percentage for display. Purely a presentation heuristic
// (not a probability) — the real ranking signal is matchScore itself, which
// the backend already sorts by.
function scoreToPercent(score) {
  return Math.min(99, Math.round((score / (score + 1.5)) * 100));
}

export default function MatchCard({ match, onSendRequest }) {
  const { user, matchScore, theyTeachThatIWantToLearn, theyWantToLearnThatITeach } = match;
  const percent = scoreToPercent(matchScore);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white hover:shadow-md transition flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-teal-600 text-white flex items-center justify-center font-semibold shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">
              <MapPin size={11} className="inline -mt-0.5 mr-0.5" />
              {user.location || 'Location not set'}
            </p>
          </div>
        </div>
        <span className="text-xs bg-brand-50 text-brand-700 font-semibold px-2 py-1 rounded-full shrink-0">
          {percent}% Match
        </span>
      </div>

      {theyTeachThatIWantToLearn.length > 0 && (
        <p className="text-xs text-slate-600 mb-1">
          <span className="font-medium text-slate-500">Teaches:</span>{' '}
          {theyTeachThatIWantToLearn.map((s) => s.name).join(', ')}
        </p>
      )}
      {theyWantToLearnThatITeach.length > 0 && (
        <p className="text-xs text-slate-600 mb-3">
          <span className="font-medium text-slate-500">Wants to learn:</span>{' '}
          {theyWantToLearnThatITeach.map((s) => s.name).join(', ')}
        </p>
      )}

      <div className="mt-auto flex gap-2 pt-1">
        <button
          onClick={() => setShowProfile(true)}
          className="flex-1 border border-slate-200 text-slate-600 text-xs font-medium py-1.5 rounded-lg hover:bg-slate-50"
        >
          View Profile
        </button>
        <button
          onClick={() => onSendRequest(match)}
          className="flex-1 bg-gradient-to-r from-brand-600 to-teal-600 text-white text-xs font-medium py-1.5 rounded-lg"
        >
          Send Request
        </button>
      </div>

      {showProfile && (
        <UserProfileModal
          userId={user._id}
          onClose={() => setShowProfile(false)}
          onSendRequest={() => {
            setShowProfile(false);
            onSendRequest(match);
          }}
        />
      )}
    </div>
  );
}
