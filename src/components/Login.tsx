import React, { useState, useEffect } from 'react';
import api from '../api';
import { Church, Sector } from '../types';
import { Church as ChurchIcon, Lock, Mail, MapPin, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=setor, 2=congregação, 3=credenciais
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [churchId, setChurchId] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [filteredChurches, setFilteredChurches] = useState<Church[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Carrega setores e igrejas diretamente do Supabase (rota pública)
  useEffect(() => {
    supabase
      .from('sectors')
      .select('id, name, description')
      .order('name', { ascending: true })
      .then(({ data }) => { if (data) setSectors(data); });

    supabase
      .from('churches')
      .select('id, name, type, sector_id')
      .order('name', { ascending: true })
      .then(({ data }) => { if (data) setChurches(data); });
  }, []);

  // Filtra igrejas ao selecionar setor
  useEffect(() => {
    if (sectorId) {
      setFilteredChurches(churches.filter(c => c.sector_id?.toString() === sectorId));
    } else {
      setFilteredChurches(churches);
    }
    setChurchId('');
  }, [sectorId, churches]);

  const selectedSector = sectors.find(s => s.id.toString() === sectorId);
  const selectedChurch = churches.find(c => c.id.toString() === churchId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/login', { email, password, churchId });
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSectorSelect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectorId) return;
    setStep(2);
  };

  const handleChurchSelect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) return;
    setStep(3);
  };

  return (
    <div className="min-h-screen premium-gradient flex items-center justify-center p-4 font-sans selection:bg-emerald-500/30">

      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none -mt-40 -mr-40" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -mb-40 -ml-40" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full glass-panel rounded-[2rem] p-8 border border-white/60 relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/50 rounded-2xl mb-4 shadow-lg border border-white/60 p-2 overflow-hidden ring-1 ring-white/20">
            <img src="/logo-transparent.png" alt="Logo AD" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600">EBD Digital</h1>
          <p className="text-neutral-500 mt-2 text-sm">Gestão Inteligente para sua Escola Bíblica</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex items-center gap-2 ${s < 3 ? 'flex-1' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20' :
                step > s ? 'bg-emerald-500 text-white' : 'bg-neutral-200 text-neutral-500'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 rounded transition-all ${step > s ? 'bg-emerald-500' : 'bg-neutral-200'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* Passo 1 — Setor */}
          {step === 1 && (
            <motion.form key="step1" onSubmit={handleSectorSelect}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Selecione o Setor</label>
                <div className="relative group">
                  <select
                    required
                    value={sectorId}
                    onChange={e => setSectorId(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none shadow-sm hover:bg-white/80"
                  >
                    <option value="">Selecione seu setor</option>
                    {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <MapPin className="absolute left-4 top-4 text-neutral-400 group-hover:text-emerald-500 transition-colors" size={18} />
                </div>
                {selectedSector?.description && (
                  <p className="text-xs text-neutral-500 pl-1 mt-1">{selectedSector.description}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={!sectorId}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-40 hover:-translate-y-0.5 mt-2"
              >
                Continuar <ChevronRight size={18} />
              </button>
            </motion.form>
          )}

          {/* Passo 2 — Congregação */}
          {step === 2 && (
            <motion.form key="step2" onSubmit={handleChurchSelect}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-2 rounded-xl">
                <MapPin size={13} /> {selectedSector?.name}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Selecione a Congregação</label>
                <div className="relative group">
                  <select
                    required
                    value={churchId}
                    onChange={e => setChurchId(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none shadow-sm hover:bg-white/80"
                  >
                    <option value="">Selecione sua congregação</option>
                    {filteredChurches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChurchIcon className="absolute left-4 top-4 text-neutral-400 group-hover:text-emerald-500 transition-colors" size={18} />
                </div>
                {filteredChurches.length === 0 && (
                  <p className="text-xs text-amber-600 pl-1">Nenhuma congregação encontrada neste setor.</p>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-3.5 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 font-semibold text-sm transition-colors">
                  <ChevronLeft size={16} /> Voltar
                </button>
                <button type="submit" disabled={!churchId}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-40 hover:-translate-y-0.5">
                  Continuar <ChevronRight size={18} />
                </button>
              </div>
            </motion.form>
          )}

          {/* Passo 3 — Credenciais */}
          {step === 3 && (
            <motion.form key="step3" onSubmit={handleSubmit}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">
              {/* Info do setor/congregação selecionada */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-2 rounded-xl">
                  <MapPin size={13} /> {selectedSector?.name}
                  <span className="text-neutral-300">·</span>
                  <ChurchIcon size={13} /> {selectedChurch?.name}
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {error}
                </motion.div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">E-mail</label>
                <div className="relative group">
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm hover:bg-white/80"
                    placeholder="seu@email.com" />
                  <Mail className="absolute left-4 top-4 text-neutral-400 group-hover:text-emerald-500 transition-colors" size={18} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Senha</label>
                <div className="relative group">
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm hover:bg-white/80"
                    placeholder="••••••••" />
                  <Lock className="absolute left-4 top-4 text-neutral-400 group-hover:text-emerald-500 transition-colors" size={18} />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-3.5 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 font-semibold text-sm transition-colors">
                  <ChevronLeft size={16} /> Voltar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-0.5 relative overflow-hidden group mt-2">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10">{loading ? 'Verificando...' : 'Acessar Sistema'}</span>
                </button>
              </div>
            </motion.form>
          )}

        </AnimatePresence>

        <div className="mt-8 pt-6 border-t border-neutral-100/50 text-center">
          <p className="text-xs text-neutral-400 font-mono tracking-wider">v1.3.0 • 2026 © EBD Digital</p>
        </div>
      </motion.div>
    </div>
  );
}
