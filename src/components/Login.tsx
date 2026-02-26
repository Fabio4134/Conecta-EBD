import React, { useState, useEffect } from 'react';
import api from '../api';
import { Church } from '../types';
import { Church as ChurchIcon, Lock, Mail, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [churchId, setChurchId] = useState('');
  const [churches, setChurches] = useState<Church[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/churches').then(res => setChurches(res.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/login', { email, password, churchId });
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen premium-gradient flex items-center justify-center p-4 font-sans selection:bg-emerald-500/30">

      {/* Decorative background blur shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none -mt-40 -mr-40"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -mb-40 -ml-40"></div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full glass-panel rounded-[2rem] p-8 border border-white/60 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20 text-white rounded-2xl mb-4 ring-1 ring-white/50">
            <ChurchIcon size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600">EBD Digital</h1>
          <p className="text-neutral-500 mt-2 text-sm">Gestão Inteligente para sua Escola Bíblica</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
              {error}
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Igreja</label>
            <div className="relative group">
              <select
                required
                value={churchId}
                onChange={(e) => setChurchId(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none shadow-sm hover:bg-white/80 group-hover:border-neutral-300"
              >
                <option value="">Selecione sua igreja</option>
                {churches.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChurchIcon className="absolute left-4 top-4 text-neutral-400 group-hover:text-emerald-500 transition-colors" size={18} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">E-mail</label>
            <div className="relative group">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm hover:bg-white/80 group-hover:border-neutral-300"
                placeholder="seu@email.com"
              />
              <Mail className="absolute left-4 top-4 text-neutral-400 group-hover:text-emerald-500 transition-colors" size={18} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Senha</label>
            <div className="relative group">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm hover:bg-white/80 group-hover:border-neutral-300"
                placeholder="••••••••"
              />
              <Lock className="absolute left-4 top-4 text-neutral-400 group-hover:text-emerald-500 transition-colors" size={18} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group mt-2"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span className="relative z-10">{loading ? 'Verificando acessos...' : 'Acessar Sistema'}</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-100/50 text-center">
          <p className="text-xs text-neutral-400 font-mono tracking-wider">v1.2.0 • 2026 © EBD Digital</p>
        </div>
      </motion.div>
    </div>
  );
}
