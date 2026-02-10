
'use client';

import React, { useState } from 'react';
import { Shield, Lock, User as UserIcon, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { User } from '@/lib/types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

const SotkonLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 60" className={className} xmlns="http://www.w3.org/2000/svg">
    <g fill="white" fontWeight="900" fontFamily="Inter, sans-serif">
      <text x="0" y="38" fontSize="42">s</text>
      <circle cx="56" cy="33" r="12" stroke="#92c83e" strokeWidth="8" fill="none" />
      <rect x="63" y="15" width="10" height="7" fill="#92c83e" rx="1" transform="rotate(-15 63 15)" />
      <text x="82" y="38" fontSize="42">tkon</text>
    </g>
    <text x="82" y="55" fill="#999" fontSize="14" fontWeight="400" fontFamily="Inter, sans-serif" letterSpacing="1">
      waste systems
    </text>
  </svg>
);

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const user = await response.json();
        onLogin(user);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Acesso negado. Verifique as credenciais corporativas.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Erro de ligação ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-[#121212] border border-[#333] rounded-[2rem] shadow-2xl overflow-hidden">
          <div className="p-10 pb-4 text-center">
            <div className="mb-8 flex justify-center">
              <SotkonLogo className="h-16 w-auto" />
            </div>
            <h1 className="text-[10px] font-black text-blue-500 tracking-[0.4em] uppercase mb-1">
              Logistics Planning System
            </h1>
            <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mt-2">AZURE CLOUD SECURE ACCESS</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Utilizador Primavera</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors">
                  <UserIcon size={18} />
                </div>
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-blue-600 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-blue-600 transition-all font-medium"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 uppercase tracking-widest text-xs mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Aceder ao Planeamento"}
            </button>
          </form>

          <div className="px-8 pb-8 flex flex-col items-center gap-4 text-center">
             <div className="w-full h-px bg-gradient-to-r from-transparent via-[#333] to-transparent" />
             <div className="flex items-center gap-2 text-gray-600 font-mono text-[9px] uppercase font-bold">
               <Shield size={10} />
               Secure Sotkon Enterprise Network
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
