import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import UserProfileModal from '../components/UserProfileModal';
import api from '../api/axios';
import { Search, MapPin } from 'lucide-react';

// Search Skills tab — searches other users by name, location, skill name, or
// skill category. A working slice of the deferred FR4 (full advanced filters
// land at Final Defense), but real, live-data search rather than a stub.
export default function SearchSkills() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [viewingUserId, setViewingUserId] = useState(null);

  const runSearch = async (q) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/api/profile/search/query', { params: { q } });
      setResults(data.users);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.get('q')) runSearch(params.get('q'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setParams(query ? { q: query } : {});
    runSearch(query);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 px-4 sm:px-6 py-6 max-w-4xl">
          <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Search size={20} className="text-brand-600" /> Search Skills
          </h2>
          <p className="text-sm text-slate-500 mb-5">Find people by name, location, or skill</p>

          <form onSubmit={handleSubmit} className="relative mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try 'Python', 'Graphic Design', or a city..."
              className="w-full border border-slate-300 rounded-full pl-9 pr-24 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand-600 text-white text-xs font-medium px-4 py-1.5 rounded-full"
            >
              Search
            </button>
          </form>

          {loading && <p className="text-sm text-slate-400">Searching...</p>}

          {!loading && searched && results.length === 0 && (
            <p className="text-sm text-slate-400">No users found for "{params.get('q')}".</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map((u) => (
              <div key={u._id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-teal-600 text-white flex items-center justify-center font-semibold shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{u.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                      <MapPin size={12} /> {u.location || 'Location not set'}
                    </p>
                  </div>
                </div>
                {u.skillsToTeach.length > 0 && (
                  <p className="text-xs text-slate-600">
                    <span className="font-medium text-slate-500">Teaches:</span> {u.skillsToTeach.map((s) => s.name).join(', ')}
                  </p>
                )}
                {u.skillsToLearn.length > 0 && (
                  <p className="text-xs text-slate-600">
                    <span className="font-medium text-slate-500">Wants to learn:</span> {u.skillsToLearn.map((s) => s.name).join(', ')}
                  </p>
                )}
                <button
                  onClick={() => setViewingUserId(u._id)}
                  className="mt-3 w-full border border-slate-200 text-slate-600 text-xs font-medium py-1.5 rounded-lg hover:bg-slate-50"
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {viewingUserId && (
        <UserProfileModal userId={viewingUserId} onClose={() => setViewingUserId(null)} />
      )}
    </div>
  );
}
