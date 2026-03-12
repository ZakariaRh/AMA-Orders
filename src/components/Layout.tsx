import React from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex flex-col">
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-zinc-950 font-bold">
            C
          </div>
          <h1 className="text-xl font-bold tracking-tight">Comanda</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <UserIcon size={16} />
            <span>{user.name}</span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs uppercase tracking-wider">
              {user.role}
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-100"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
