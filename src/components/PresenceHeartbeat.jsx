import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { goOnline } from '../firebase/presence';

// Mounted once at the app root — keeps this user's presence/{userId} doc
// alive with a heartbeat for as long as they're logged in and the tab is open.
export default function PresenceHeartbeat() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?._id) return;
    const stopHeartbeat = goOnline(user._id);
    return stopHeartbeat;
  }, [user?._id]);

  return null;
}
