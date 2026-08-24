import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useActionLoader } from '../context/ActionLoaderContext';
import { GraduationCap, BookOpen, MapPin, Pencil, CheckCircle2, Plus, X } from 'lucide-react';

const emptySkill = { name: '', category: '' };

// My Profile tab — full profile editor (FR2, FR3), separate from the
// Dashboard's quick-edit panel so the sidebar link goes somewhere dedicated.
export default function Profile() {
  const { user, updateUser } = useAuth();
  const { run } = useActionLoader();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    skillsToTeach: user?.skillsToTeach || [],
    skillsToLearn: user?.skillsToLearn || []
  });
  const [newTeach, setNewTeach] = useState(emptySkill);
  const [newLearn, setNewLearn] = useState(emptySkill);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    api.get('/api/skills/categories').then(({ data }) => setCategories(data.categories));
  }, []);

  const addSkill = (type) => {
    const skill = type === 'teach' ? newTeach : newLearn;
    if (!skill.name.trim() || !skill.category) return;
    const key = type === 'teach' ? 'skillsToTeach' : 'skillsToLearn';
    setForm((prev) => ({ ...prev, [key]: [...prev[key], skill] }));
    if (type === 'teach') setNewTeach(emptySkill);
    else setNewLearn(emptySkill);
  };

  const removeSkill = (key, index) => {
    setForm((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));
  };

  const save = async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      const { data } = await run('Saving Profile...', () => api.put('/api/profile', form));
      updateUser(data.user);
      setSavedMsg('Profile updated!');
    } catch (err) {
      setSavedMsg(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 px-4 sm:px-6 py-6 max-w-3xl">
          <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Pencil size={20} className="text-brand-600" /> My Profile
          </h2>
          <p className="text-sm text-slate-500 mb-6">Manage your public profile and skill tags (FR2, FR3)</p>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-teal-600 text-white flex items-center justify-center text-2xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{user?.email}</p>
                <p className="text-xs text-slate-400">Account type: {user?.authProvider === 'google' ? 'Google' : 'Email & Password'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <MapPin size={14} /> Location
                </label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Lahore, Pakistan"
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mb-2">
              <label className="text-sm font-medium text-slate-700">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                placeholder="Tell others about yourself"
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <SkillPanel
            title="Skills I Teach"
            Icon={GraduationCap}
            colorClasses="bg-brand-50 text-brand-700"
            skills={form.skillsToTeach}
            categories={categories}
            draft={newTeach}
            setDraft={setNewTeach}
            onAdd={() => addSkill('teach')}
            onRemove={(i) => removeSkill('skillsToTeach', i)}
          />

          <SkillPanel
            title="Skills I Want to Learn"
            Icon={BookOpen}
            colorClasses="bg-amber-50 text-amber-700"
            skills={form.skillsToLearn}
            categories={categories}
            draft={newLearn}
            setDraft={setNewLearn}
            onAdd={() => addSkill('learn')}
            onRemove={(i) => removeSkill('skillsToLearn', i)}
          />

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={save}
              disabled={saving}
              className="bg-gradient-to-r from-brand-600 to-teal-600 hover:opacity-90 text-white font-medium px-5 py-2 rounded-lg disabled:opacity-60 flex items-center gap-2"
            >
              <CheckCircle2 size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {savedMsg && <span className="text-sm text-slate-500">{savedMsg}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillPanel({ title, Icon, colorClasses, skills, categories, draft, setDraft, onAdd, onRemove }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
        <Icon size={16} /> {title}
      </h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {skills.map((s, i) => (
          <span key={i} className={`${colorClasses} text-xs px-3 py-1 rounded-full flex items-center gap-1`}>
            {s.name}
            <button onClick={() => onRemove(i)} className="ml-1 hover:text-red-500"><X size={12} /></button>
          </span>
        ))}
        {skills.length === 0 && <p className="text-xs text-slate-400">None added yet</p>}
      </div>
      <div className="flex gap-2">
        <input
          placeholder="Skill name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm min-w-0"
        />
        <select
          value={draft.category}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
        >
          <option value="">Category</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={onAdd} className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1">
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}
