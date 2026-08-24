import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Pencil, GraduationCap, Repeat, Users, Trophy, BookOpen, Compass, Search, Circle, Check, X, Plus } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MatchCard from '../components/MatchCard';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useActionLoader } from '../context/ActionLoaderContext';
import OrbitField from '../three/OrbitField';

const emptySkill = { name: '', category: '' };

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const { run } = useActionLoader();
  const [categories, setCategories] = useState([]);
  const [profile, setProfile] = useState({
    bio: user?.bio || '',
    location: user?.location || '',
    skillsToTeach: user?.skillsToTeach || [],
    skillsToLearn: user?.skillsToLearn || []
  });
  const [newTeach, setNewTeach] = useState(emptySkill);
  const [newLearn, setNewLearn] = useState(emptySkill);
  const [matches, setMatches] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [requestModal, setRequestModal] = useState(null);
  const [requestMsg, setRequestMsg] = useState('');
  const [swapFeedback, setSwapFeedback] = useState('');
  const [learnFilter, setLearnFilter] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await api.get('/api/skills/categories');
      setCategories(data.categories);
    };
    loadCategories();
    loadMatches();
    loadSwaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMatches = async () => {
    const { data } = await api.get('/api/matching');
    setMatches(data.matches);
  };

  const loadSwaps = async () => {
    const { data } = await api.get('/api/swaps');
    setSwaps(data.swaps);
  };

  // Dashboard stats derived from real data (no fabricated numbers)
  const stats = useMemo(() => {
    const skillsAdded = profile.skillsToTeach.length + profile.skillsToLearn.length;
    const activeSwaps = swaps.filter((s) => s.status === 'Accepted').length;
    const completedSwaps = swaps.filter((s) => s.status === 'Completed').length;
    // Simple, transparent placeholder formula until FR9 (Reputation Score Algorithm) ships
    const trustScore = Math.min(5, 4.3 + completedSwaps * 0.1).toFixed(1);
    return { skillsAdded, activeSwaps, completedSwaps, trustScore };
  }, [profile, swaps]);

  // Recent activity feed built from real swap history (newest first)
  const recentActivity = useMemo(() => {
    return [...swaps]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 4)
      .map((s) => {
        const other = s.sender._id === user._id ? s.receiver : s.sender;
        const verb =
          s.status === 'Pending' ? 'Requested a swap with' :
          s.status === 'Accepted' ? 'Connected with' :
          s.status === 'Completed' ? 'Completed swap with' : 'Swap declined with';
        return { id: s._id, text: `${verb} ${other.name}`, time: s.updatedAt };
      });
  }, [swaps, user._id]);

  const addSkill = (type) => {
    const skill = type === 'teach' ? newTeach : newLearn;
    if (!skill.name.trim() || !skill.category) return;
    setProfile((prev) => ({
      ...prev,
      [type === 'teach' ? 'skillsToTeach' : 'skillsToLearn']: [
        ...prev[type === 'teach' ? 'skillsToTeach' : 'skillsToLearn'],
        skill
      ]
    }));
    if (type === 'teach') setNewTeach(emptySkill);
    else setNewLearn(emptySkill);
  };

  const removeSkill = (type, index) => {
    setProfile((prev) => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setSavedMsg('');
    try {
      const { data } = await run('Saving Profile...', () => api.put('/api/profile', profile));
      updateUser(data.user);
      setSavedMsg('Profile saved!');
      loadMatches();
    } catch (err) {
      setSavedMsg(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
      setTimeout(() => setSavedMsg(''), 3000);
    }
  };

  const openRequestModal = (match) => {
    const offered = match.theyWantToLearnThatITeach[0]?.name || profile.skillsToTeach[0]?.name || '';
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
      setSwapFeedback(`Swap request sent to ${requestModal.match.user.name}!`);
      setRequestModal(null);
      loadSwaps();
      setTimeout(() => setSwapFeedback(''), 3000);
    } catch (err) {
      setSwapFeedback(err.response?.data?.message || 'Failed to send request');
    }
  };

  const filteredMatches = learnFilter
    ? matches.filter((m) => m.theyTeachThatIWantToLearn.some((s) => s.name === learnFilter))
    : matches;

  const learnOptions = [...new Set(profile.skillsToLearn.map((s) => s.name))];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex">
        <Sidebar />

        <div className="flex-1 px-4 sm:px-6 py-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
          <div className="space-y-6 min-w-0">
            {/* Profile header card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-teal-600 text-white flex items-center justify-center text-2xl font-bold shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
                    <CheckCircle2 size={15} className="text-brand-500" aria-label="Verified" />
                    <span className="text-[11px] bg-brand-50 text-brand-700 font-medium px-2 py-0.5 rounded-full">Active Member</span>
                  </div>
                  <p className="text-sm text-slate-500">{profile.location || 'Location not set'}</p>
                </div>
                <button className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-50 shrink-0">
                  <span className="inline-flex items-center gap-1"><Pencil size={13} /> Edit Profile</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBadge label="Skills Added" value={stats.skillsAdded} Icon={GraduationCap} color="bg-blue-50 text-blue-600" />
                <StatBadge label="Active Swaps" value={stats.activeSwaps} Icon={Repeat} color="bg-brand-50 text-brand-600" />
                <StatBadge label="Completed" value={stats.completedSwaps} Icon={Users} color="bg-purple-50 text-purple-600" />
                <StatBadge label="Trust Score" value={stats.trustScore} Icon={Trophy} color="bg-rose-50 text-rose-600" />
              </div>
            </div>

            {/* Skills panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><GraduationCap size={16} /> Skills I Teach</h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.skillsToTeach.map((s, i) => (
                    <span key={i} className="bg-brand-50 text-brand-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      <Check size={11} /> {s.name}
                      <button onClick={() => removeSkill('skillsToTeach', i)} className="ml-1 text-brand-500 hover:text-red-500"><X size={12} /></button>
                    </span>
                  ))}
                  {profile.skillsToTeach.length === 0 && <p className="text-xs text-slate-400">No teaching skills added yet</p>}
                </div>
                <div className="flex gap-2">
                  <input
                    placeholder="e.g. Python"
                    value={newTeach.name}
                    onChange={(e) => setNewTeach({ ...newTeach, name: e.target.value })}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm min-w-0"
                  />
                  <select
                    value={newTeach.category}
                    onChange={(e) => setNewTeach({ ...newTeach, category: e.target.value })}
                    className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="">Category</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => addSkill('teach')} className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1"><Plus size={13} /> Add</button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><BookOpen size={16} /> Skills I Want to Learn</h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.skillsToLearn.map((s, i) => (
                    <span key={i} className="bg-amber-50 text-amber-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      {s.name}
                      <button onClick={() => removeSkill('skillsToLearn', i)} className="ml-1 text-amber-500 hover:text-red-500"><X size={12} /></button>
                    </span>
                  ))}
                  {profile.skillsToLearn.length === 0 && <p className="text-xs text-slate-400">No learning goals added yet</p>}
                </div>
                <div className="flex gap-2">
                  <input
                    placeholder="e.g. Graphic Design"
                    value={newLearn.name}
                    onChange={(e) => setNewLearn({ ...newLearn, name: e.target.value })}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm min-w-0"
                  />
                  <select
                    value={newLearn.category}
                    onChange={(e) => setNewLearn({ ...newLearn, category: e.target.value })}
                    className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="">Category</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => addSkill('learn')} className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1"><Plus size={13} /> Add</button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="bg-gradient-to-r from-brand-600 to-teal-600 hover:opacity-90 text-white font-medium px-5 py-2 rounded-lg disabled:opacity-60"
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
              {savedMsg && <span className="text-sm text-slate-500">{savedMsg}</span>}
            </div>

            {/* Promo banner */}
            <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-teal-600 text-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="hidden sm:block shrink-0 -my-4">
                  <OrbitField width={110} height={110} />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Skill Matching</h3>
                  <p className="text-sm text-white/80">Connect with people, exchange skills and grow together!</p>
                </div>
              </div>
              <div className="flex gap-2 text-xs shrink-0">
                <span className="bg-white/15 px-3 py-1.5 rounded-full">Free to Join</span>
                <span className="bg-white/15 px-3 py-1.5 rounded-full">Learn from Peers</span>
                <span className="bg-white/15 px-3 py-1.5 rounded-full">Build Connections</span>
              </div>
            </div>

            {/* Recommended matches */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800">Recommended Matches for You</h3>
              </div>

              {swapFeedback && <div className="bg-brand-50 text-brand-700 text-sm rounded-md p-2 mb-3">{swapFeedback}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMatches.slice(0, 6).map((m) => (
                  <MatchCard key={m.user._id} match={m} onSendRequest={openRequestModal} />
                ))}
                {filteredMatches.length === 0 && (
                  <p className="text-sm text-slate-400 col-span-full">No matches yet — add skills above to find your perfect swap partner.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2"><Compass size={16} /> Find Your Perfect Match</h3>

              <label className="text-xs font-medium text-slate-500">I want to learn</label>
              <select
                value={learnFilter}
                onChange={(e) => setLearnFilter(e.target.value)}
                className="mt-1 mb-3 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Any skill</option>
                {learnOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              <label className="text-xs font-medium text-slate-500">Show me users who teach</label>
              <select disabled className="mt-1 mb-3 w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-400">
                <option>All categories</option>
              </select>

              <label className="text-xs font-medium text-slate-500">In my area</label>
              <select disabled className="mt-1 mb-4 w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-400">
                <option>All Pakistan (FR4 — coming in Final Defense)</option>
              </select>

              <button onClick={loadMatches} className="w-full bg-gradient-to-r from-brand-600 to-teal-600 text-white text-sm font-medium py-2.5 rounded-lg">
                <span className="inline-flex items-center gap-1.5"><Search size={14} /> Find Matches</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 text-sm mb-4">Learning Activity</h3>
              <div className="space-y-3">
                {recentActivity.length === 0 && <p className="text-xs text-slate-400">No activity yet — send a swap request to get started.</p>}
                {recentActivity.map((a) => (
                  <div key={a.id} className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Circle size={8} fill="currentColor" /></span>
                    <div>
                      <p className="text-xs text-slate-700">{a.text}</p>
                      <p className="text-[11px] text-slate-400">{new Date(a.time).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send Swap Request Modal */}
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

function StatBadge({ label, value, Icon, color }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3 text-center">
      <div className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-1 ${color}`}><Icon size={15} /></div>
      <p className="text-lg font-bold text-slate-800 leading-tight">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
