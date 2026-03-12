import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { ServerDashboard } from './pages/ServerDashboard';
import { KitchenBarDashboard } from './pages/KitchenBarDashboard';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { Tutorial } from './components/Tutorial';

function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Tutorial />
      {user.role === 'owner' && <OwnerDashboard />}
      {user.role === 'server' && <ServerDashboard />}
      {(user.role === 'kitchen' || user.role === 'bar') && <KitchenBarDashboard />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardRouter />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
