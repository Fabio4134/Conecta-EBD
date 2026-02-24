import React, { useState } from 'react';
import api from '../api';
import { Key, Save, AlertCircle } from 'lucide-react';

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setMessage({ text: 'As senhas não coincidem', type: 'error' });
    }
    setLoading(true);
    try {
      await api.post('/change-password', { newPassword });
      setMessage({ text: 'Senha alterada com sucesso!', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ text: 'Erro ao alterar senha', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Segurança da Conta</h1>
        <p className="text-neutral-500 text-sm italic serif">Mantenha seus dados protegidos.</p>
      </header>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          {message.text && (
            <div className={`p-3 rounded-xl text-sm flex items-center gap-2 border ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
            }`}>
              <AlertCircle size={16} />
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Nova Senha</label>
            <input 
              required
              type="password" 
              className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Confirmar Nova Senha</label>
            <input 
              required
              type="password" 
              className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? 'Salvando...' : 'Atualizar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
