import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useActionLoader } from '../context/ActionLoaderContext';
import { Settings as SettingsIcon, KeyRound, LogOut } from 'lucide-react';

export default function Settings() {
  const { user, logout } = useAuth();
  const { run } = useActionLoader();
  const navigate = useNavigate();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [saving, setSaving] = useState(false);

  const isGoogleAccount = user?.authProvider === 'google';

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg('');
    setPwError('');

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New password and confirmation do not match');
      return;
    }

    setSaving(true);
    try {
      await run('Updating Password...', () =>
        api.put('/api/auth/change-password', {
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword
        })
      );
      setPwMsg('Password updated successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 px-4 sm:px-6 py-6 max-w-xl">
          <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
            <SettingsIcon size={20} className="text-brand-600" /> Settings
          </h2>
          <p className="text-sm text-slate-500 mb-6">Manage your account</p>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Account</h3>
            <div className="text-sm text-slate-600 space-y-1">
              <p><span className="text-slate-400">Name:</span> {user?.name}</p>
              <p><span className="text-slate-400">Email:</span> {user?.email}</p>
              <p><span className="text-slate-400">Sign-in method:</span> {isGoogleAccount ? 'Google' : 'Email & Password'}</p>
            </div>
          </div>

          {!isGoogleAccount && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <KeyRound size={16} /> Change Password
              </h3>

              {pwError && <div className="bg-red-50 text-red-600 text-sm rounded-md p-2 mb-3">{pwError}</div>}
              {pwMsg && <div className="bg-brand-50 text-brand-700 text-sm rounded-md p-2 mb-3">{pwMsg}</div>}

              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">Current Password</label>
                  <input
                    type="password"
                    required
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-brand-600 to-teal-600 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
          {isGoogleAccount && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 text-sm text-slate-500">
              This account signs in with Google, so there's no local password to manage here.
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm bg-red-50 text-red-600 font-medium px-4 py-2 rounded-lg hover:bg-red-100"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
