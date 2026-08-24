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
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-black/5"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl mb-4">
            <ChurchIcon size={32} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">EBD Digital</h1>
          <p className="text-neutral-500 mt-2 italic serif">Gestão Inteligente para sua Escola Bíblica</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2 uppercase tracking-wider text-[10px]">Igreja</label>
            <div className="relative">
              <select
                required
                value={churchId}
                onChange={(e) => setChurchId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all appearance-none"
              >
                <option value="">Selecione sua igreja</option>
                {churches.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChurchIcon className="absolute left-3 top-3.5 text-neutral-400" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2 uppercase tracking-wider text-[10px]">E-mail</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="seu@email.com"
              />
              <Mail className="absolute left-3 top-3.5 text-neutral-400" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2 uppercase tracking-wider text-[10px]">Senha</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="••••••••"
              />
              <Lock className="absolute left-3 top-3.5 text-neutral-400" size={18} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Acessar Sistema'}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-top border-neutral-100 text-center">
          <p className="text-xs text-neutral-400 font-mono">v1.0.0 - 2026 © EBD Digital</p>
        </div>
      </motion.div>
    </div>
  );
}
