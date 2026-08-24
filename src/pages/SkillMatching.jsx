import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MatchCard from '../components/MatchCard';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useActionLoader } from '../context/ActionLoaderContext';
import { Repeat } from 'lucide-react';

// Skill Matching tab — full-page version of the FR5 matching engine results
// (the Dashboard only teases the top 6).
export default function SkillMatching() {
  const { user } = useAuth();
  const { run } = useActionLoader();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [learnFilter, setLearnFilter] = useState('');
  const [requestModal, setRequestModal] = useState(null);
  const [requestMsg, setRequestMsg] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadMatches = async () => {
    setLoading(true);
    const { data } = await api.get('/api/matching');
    setMatches(data.matches);
    setLoading(false);
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const learnOptions = useMemo(
    () => [...new Set((user?.skillsToLearn || []).map((s) => s.name))],
    [user]
  );

  const filtered = learnFilter
    ? matches.filter((m) => m.theyTeachThatIWantToLearn.some((s) => s.name === learnFilter))
    : matches;

  const openRequestModal = (match) => {
    const offered = match.theyWantToLearnThatITeach[0]?.name || user?.skillsToTeach?.[0]?.name || '';
    const requested = match.theyTeachThatIWantToLearn[0]?.name || match.user.skillsToTeach[0]?.name || '';
    setRequestModal({ match, offered, requested });
    setRequestMsg('');
  };

  const sendSwapRequest = async () => {
    if (!requestModal) return;
    try {
      await run('Sending Skill Request...', () =>
        api.post('/api/swaps', {
          receiverId: requestModal.match.user._id,
          offeredSkill: requestModal.offered,
          requestedSkill: requestModal.requested,
          message: requestMsg
        })
      );
      setFeedback(`Swap request sent to ${requestModal.match.user.name}!`);
      setRequestModal(null);
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Failed to send request');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 px-4 sm:px-6 py-6">
          <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Repeat size={20} className="text-brand-600" /> Skill Matching
          </h2>
          <p className="text-sm text-slate-500 mb-5">FR5: everyone whose skills overlap with yours, ranked by match strength</p>

          <div className="flex items-center gap-3 mb-5">
            <select
              value={learnFilter}
              onChange={(e) => setLearnFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Filter: any skill I want to learn</option>
              {learnOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={loadMatches} className="text-sm bg-slate-800 text-white px-4 py-2 rounded-lg">Refresh</button>
          </div>

          {feedback && <div className="bg-brand-50 text-brand-700 text-sm rounded-md p-2 mb-4 max-w-md">{feedback}</div>}

          {loading && <p className="text-sm text-slate-400">Finding matches...</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m) => (
              <MatchCard key={m.user._id} match={m} onSendRequest={openRequestModal} />
            ))}
            {!loading && filtered.length === 0 && (
              <p className="text-sm text-slate-400 col-span-full">
                No matches found. Add skills to teach/learn on your profile to get matched.
              </p>
            )}
          </div>
        </div>
      </div>

      {requestModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-slate-800 mb-4">Send Swap Request to {requestModal.match.user.name}</h3>
            <label className="text-sm font-medium text-slate-700">I will teach</label>
            <input
              value={requestModal.offered}
              onChange={(e) => setRequestModal({ ...requestModal, offered: e.target.value })}
              className="mt-1 mb-3 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <label className="text-sm font-medium text-slate-700">I want to learn</label>
            <input
              value={requestModal.requested}
              onChange={(e) => setRequestModal({ ...requestModal, requested: e.target.value })}
              className="mt-1 mb-3 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <label className="text-sm font-medium text-slate-700">Message (optional)</label>
            <textarea
              value={requestMsg}
              onChange={(e) => setRequestMsg(e.target.value)}
              className="mt-1 mb-4 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              rows={2}
            />
            <div className="flex gap-2">
              <button onClick={() => setRequestModal(null)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={sendSwapRequest} className="flex-1 bg-brand-600 text-white py-2 rounded-lg text-sm">Send Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
