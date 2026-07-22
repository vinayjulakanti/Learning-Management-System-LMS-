import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEMO_MODE } from '../config';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (DEMO_MODE) {
    return children;
  }

  if (loading) return <div style={{padding: 24}}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && (user.role || '').toLowerCase() !== (role || '').toLowerCase()) return <Navigate to="/" replace />;
  return children;
}
