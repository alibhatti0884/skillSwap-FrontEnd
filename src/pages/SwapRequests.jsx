import React, { useEffect, useMemo, useState } from 'react';
import { Clock, CheckCircle2, Award, Repeat } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useActionLoader } from '../context/ActionLoaderContext';

const TABS = ['All', 'Pending', 'Accepted', 'Rejected', 'Completed'];

// Interface 3: Swap Requests & Real-Time Chat System (FR6, FR7 — Firebase edition)
export default function SwapRequests() {
  const { user } = useAuth();
  const { run } = useActionLoader();
  const [swaps, setSwaps] = useState([]);
  const [tab, setTab] = useState('All');
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSwaps = async () => {
    setLoading(true);
    const { data } = await api.get('/api/swaps');
    setSwaps(data.swaps);
    setLoading(false);
  };

  useEffect(() => {
    loadSwaps();
  }, []);

  const respond = async (id, status) => {
    await run(status === 'Accepted' ? 'Accepting Request...' : 'Rejecting Request...', () =>
      api.put(`/api/swaps/${id}`, { status })
    );
    loadSwaps();
  };

  const markCompleted = async (id) => {
    await run('Marking as Completed...', () => api.put(`/api/swaps/${id}/complete`));
    loadSwaps();
  };

  const filtered = swaps.filter((s) => tab === 'All' || s.status === tab);

  const counts = useMemo(
    () => ({
      Pending: swaps.filter((s) => s.status === 'Pending').length,
      Accepted: swaps.filter((s) => s.status === 'Accepted').length,
      Completed: swaps.filter((s) => s.status === 'Completed').length,
      Active: swaps.filter((s) => s.status === 'Accepted' || s.status === 'Completed').length
    }),
    [swaps]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex">
        <Sidebar />

        <div className="flex-1 px-4 sm:px-6 py-6">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Swap Requests</h2>
          <p className="text-sm text-slate-500 mb-5">Manage incoming and outgoing skill swap requests</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard Icon={Clock} color="bg-blue-50 text-blue-600" label="Pending Requests" value={counts.Pending} onClick={() => setTab('Pending')} />
            <StatCard Icon={CheckCircle2} color="bg-brand-50 text-brand-600" label="Accepted" value={counts.Accepted} onClick={() => setTab('Accepted')} />
            <StatCard Icon={Award} color="bg-purple-50 text-purple-600" label="Completed" value={counts.Completed} onClick={() => setTab('Completed')} />
            <StatCard Icon={Repeat} color="bg-amber-50 text-amber-600" label="Active Swaps" value={counts.Active} onClick={() => setTab('Accepted')} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
            {/* Requests list */}
            <div>
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap ${
                      tab === t ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {loading && <p className="text-sm text-slate-400">Loading...</p>}

              <div className="space-y-3">
                {filtered.map((swap) => {
                  const isReceiver = swap.receiver._id === user._id;
                  const otherUser = isReceiver ? swap.sender : swap.receiver;
                  const canChat = swap.status === 'Accepted' || swap.status === 'Completed';

                  return (
                    <div
                      key={swap._id}
                      className={`bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        activeChat?._id === swap._id ? 'border-brand-300 ring-1 ring-brand-200' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-teal-600 text-white flex items-center justify-center font-semibold">
                            {otherUser.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm">{otherUser.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            Teaches <span className="font-medium">{swap.offeredSkill}</span>
                            {'  '}↔{'  '}
                            Wants <span className="font-medium">{swap.requestedSkill}</span>
                          </p>
                          <p className="text-[11px] text-slate-400">{new Date(swap.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={swap.status} />

                        {swap.status === 'Pending' && isReceiver && (
                          <>
                            <button onClick={() => respond(swap._id, 'Accepted')} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg">Accept</button>
                            <button onClick={() => respond(swap._id, 'Rejected')} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">Reject</button>
                          </>
                        )}

                        {swap.status === 'Accepted' && (
                          <button onClick={() => markCompleted(swap._id)} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">
                            Mark Complete
                          </button>
                        )}

                        {canChat && (
                          <button
                            onClick={() => setActiveChat(swap)}
                            className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg"
                          >
                            View Chat
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {!loading && filtered.length === 0 && (
                  <p className="text-sm text-slate-400">No {tab.toLowerCase()} requests.</p>
                )}
              </div>
            </div>

            {/* Persistent chat panel (desktop) */}
            <div className="hidden lg:block h-[calc(100vh-220px)] sticky top-20">
              {activeChat ? (
                <ChatWindow key={activeChat._id} swap={activeChat} inline />
              ) : (
                <div className="h-full flex items-center justify-center bg-white rounded-2xl border border-slate-200 text-sm text-slate-400 text-center px-6">
                  Accept a swap request to start chatting in real time via Firebase.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile chat modal */}
      {activeChat && (
        <div className="lg:hidden">
          <ChatWindow key={activeChat._id} swap={activeChat} onClose={() => setActiveChat(null)} />
        </div>
      )}
    </div>
  );
}

function StatCard({ Icon, color, label, value, onClick }) {
  return (
    <button onClick={onClick} className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:shadow-sm transition">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}><Icon size={15} /></div>
      <p className="text-xl font-bold text-slate-800 leading-tight">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </button>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Pending: 'bg-amber-50 text-amber-700',
    Accepted: 'bg-brand-50 text-brand-700',
    Rejected: 'bg-red-50 text-red-600',
    Completed: 'bg-purple-50 text-purple-700'
  };
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status]}`}>{status}</span>;
}
