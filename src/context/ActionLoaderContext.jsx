import React, { createContext, useContext, useCallback, useState } from 'react';

/**
 * A centered, labeled loading overlay for explicit user-initiated actions
 * (send swap request, save profile, accept/reject, change password, sign in...).
 * Distinct from GlobalApiLoader's small bottom-right pill, which fires for
 * *every* API call including quiet background list refreshes — this one is
 * opt-in per action, with text that says what's actually happening, so a
 * button press never looks like it silently did nothing.
 */
const ActionLoaderContext = createContext({
  label: null,
  run: async (_label, fn) => fn()
});

export function ActionLoaderProvider({ children }) {
  const [label, setLabel] = useState(null);

  // Wrap any async action: shows the overlay with `text`, runs `fn`, always
  // hides the overlay afterward (success or failure) so it never gets stuck.
  const run = useCallback(async (text, fn) => {
    setLabel(text);
    try {
      return await fn();
    } finally {
      setLabel(null);
    }
  }, []);

  return (
    <ActionLoaderContext.Provider value={{ label, run }}>
      {children}
    </ActionLoaderContext.Provider>
  );
}

export const useActionLoader = () => useContext(ActionLoaderContext);
