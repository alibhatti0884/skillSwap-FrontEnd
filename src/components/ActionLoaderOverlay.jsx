import React from 'react';
import { useActionLoader } from '../context/ActionLoaderContext';
import SpinningLogo from '../three/SpinningLogo';

// Renders the centered "SkillSwap is Sending Skill Request..." style overlay
// whenever an explicit action is in progress (see ActionLoaderContext.run()).
export default function ActionLoaderOverlay() {
  const { label } = useActionLoader();
  if (!label) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[80] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl px-8 py-7 flex flex-col items-center gap-3 shadow-2xl">
        <SpinningLogo size={72} />
        <p className="text-sm font-medium text-slate-700 text-center">{label}</p>
      </div>
    </div>
  );
}
