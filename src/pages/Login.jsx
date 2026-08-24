import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Palette, Music2, ChefHat, Languages, CheckCircle2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useActionLoader } from '../context/ActionLoaderContext';
import { signInWithGoogle, completeGoogleRedirect } from '../firebase/googleAuth';
import SpinningLogo from '../three/SpinningLogo';

const CATEGORY_ICONS = [
  { Icon: Code2, label: 'Programming', bg: 'bg-blue-100 text-blue-600' },
  { Icon: Palette, label: 'Graphic Design', bg: 'bg-purple-100 text-purple-600' },
  { Icon: Music2, label: 'Music', bg: 'bg-red-100 text-red-600' },
  { Icon: ChefHat, label: 'Cooking', bg: 'bg-amber-100 text-amber-600' },
  { Icon: Languages, label: 'Languages', bg: 'bg-green-100 text-green-600' }
];

export default function Login() {
  const { login, googleLogin } = useAuth();
  const { run } = useActionLoader();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Picks up the result if we just came back from a redirect-based Google
  // sign-in (mobile flow — see firebase/googleAuth.js)
  useEffect(() => {
    (async () => {
      try {
        const idToken = await completeGoogleRedirect();
        if (idToken) {
          await run('Signing In with Google...', () => googleLogin(idToken));
          navigate('/dashboard');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Google sign-in failed');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await run('Signing In...', () => login(form.email, form.password));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const idToken = await run('Connecting to Google...', () => signInWithGoogle());
      if (idToken) {
        // Popup flow (desktop) — redirect flow (mobile) resolves via the
        // completeGoogleRedirect effect above instead, after the page reloads.
        await run('Signing In with Google...', () => googleLogin(idToken));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left: brand illustration */}
        <div className="hidden lg:block px-6">
          <div className="flex items-center gap-2 mb-8">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-teal-600 text-white flex items-center justify-center font-bold">S</span>
            <span className="font-bold text-xl text-slate-800">SkillSwap</span>
          </div>

          <div className="mb-2">
            <SpinningLogo size={110} />
          </div>

          <h1 className="text-4xl font-extrabold text-slate-800 leading-tight mb-3">
            Learn. Teach.<br />
            <span className="text-brand-600">Grow Together.</span>
          </h1>
          <p className="text-slate-500 mb-8">
            Join Pakistan's largest peer-to-peer skill exchange community.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            {CATEGORY_ICONS.map(({ Icon, label, bg }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white shadow-sm border border-slate-100">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
                  <Icon size={16} strokeWidth={2.25} />
                </span>
                <span className="text-sm font-medium text-slate-600">{label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm">
            {['Secure Authentication', 'JWT Session Management', 'Community Verified', 'Skill Matching'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 size={14} className="text-brand-500 shrink-0" />{f}
              </div>
            ))}
          </div>
        </div>

        {/* Right: login card */}
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-teal-600 text-white font-bold text-xl mb-3">S</span>
            <h1 className="text-2xl font-bold text-slate-800">Welcome Back!</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to continue your learning journey.</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm rounded-md p-3 mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <div className="relative mt-1">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative mt-1">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full border border-slate-300 rounded-lg pl-9 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-600 to-teal-600 hover:opacity-90 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs text-slate-400">OR</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full border border-slate-300 rounded-lg py-2.5 text-sm font-medium text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 disabled:opacity-60"
          >
            <GoogleIcon />
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-medium">Register Now</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Official multi-color "G" mark, since Google's brand glyph isn't part of lucide-react's outline set
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.1 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.4 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.3 5.3C40.6 36.2 44 30.6 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}
