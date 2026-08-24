import React from 'react';
import { useApiLoading } from '../api/loadingStore';
import SpinningLogo from '../three/SpinningLogo';

/**
 * The branded "SkillSwap" loading indicator that appears whenever any API
 * request is in flight (wired via axios interceptors -> loadingStore.js).
 * Always mounted (so the WebGL context is created once, not re-initialized
 * on every request) — visibility is purely a CSS opacity/transform toggle
 * for a smooth fade rather than a flicker.
 */
export default function GlobalApiLoader() {
  const loading = useApiLoading();

  return (
    <div
      className={`fixed bottom-5 right-5 z-[70] flex items-center gap-2.5 bg-white/95 backdrop-blur border border-slate-200 rounded-full pl-1.5 pr-4 py-1.5 shadow-lg transition-all duration-300 ${
        loading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
      aria-hidden={!loading}
    >
      <SpinningLogo size={32} spin={loading} />
      <span className="text-xs font-medium text-slate-600">SkillSwap is loading...</span>
    </div>
  );
}
