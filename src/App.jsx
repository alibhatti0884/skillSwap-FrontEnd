import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import SearchSkills from './pages/SearchSkills';
import SkillMatching from './pages/SkillMatching';
import SwapRequests from './pages/SwapRequests';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';

function Protected(Component) {
  return (
    <ProtectedRoute>
      <Component />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={Protected(Dashboard)} />
      <Route path="/profile" element={Protected(Profile)} />
      <Route path="/search" element={Protected(SearchSkills)} />
      <Route path="/matching" element={Protected(SkillMatching)} />
      <Route path="/swaps" element={Protected(SwapRequests)} />
      <Route path="/messages" element={Protected(Messages)} />
      <Route path="/notifications" element={Protected(Notifications)} />
      <Route path="/settings" element={Protected(Settings)} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
