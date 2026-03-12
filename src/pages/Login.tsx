import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';

export function Login() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(pin);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid PIN. Try 1111 (Owner), 2222 (Server), 4444 (Kitchen), 5555 (Bar)');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-zinc-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 rounded-2xl p-8 border border-zinc-800 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4 text-zinc-950">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Comanda</h1>
          <p className="text-zinc-400 mt-2 text-center">Enter your PIN to access your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-center text-4xl tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
              maxLength={4}
              autoFocus
            />
          </div>
          
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-4 rounded-xl transition-colors text-lg"
          >
            Unlock
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-800 text-xs text-zinc-500 text-center space-y-1">
          <p>Demo PINs:</p>
          <p>Owner: 1111 | Server: 2222 | Kitchen: 4444 | Bar: 5555</p>
        </div>
      </motion.div>
    </div>
  );
}
