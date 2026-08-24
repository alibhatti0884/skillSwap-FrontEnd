import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationsProvider } from './context/NotificationsContext.jsx';
import { CallProvider } from './context/CallContext.jsx';
import { ActionLoaderProvider } from './context/ActionLoaderContext.jsx';
import GlobalApiLoader from './components/GlobalApiLoader.jsx';
import ActionLoaderOverlay from './components/ActionLoaderOverlay.jsx';
import GlobalCallLayer from './components/GlobalCallLayer.jsx';
import PresenceHeartbeat from './components/PresenceHeartbeat.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
          <CallProvider>
            <ActionLoaderProvider>
              <App />
              <GlobalApiLoader />
              <ActionLoaderOverlay />
              <GlobalCallLayer />
              <PresenceHeartbeat />
            </ActionLoaderProvider>
          </CallProvider>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
