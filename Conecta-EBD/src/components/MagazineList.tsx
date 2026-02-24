import React, { useState, useEffect } from 'react';
import api from '../api';
import { Magazine } from '../types';
import { BookOpen, Calendar, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { motion } from 'motion/react';

export default function MagazineList({ role }: { role: string }) {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: '', quarter: '', year: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await api.get('/magazines');
    setMagazines(res.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.put(`/magazines/${editingId}`, formData);
    } else {
      await api.post('/magazines', formData);
    }
    setShowModal(false);
    setEditingId(null);
    setFormData({ title: '', quarter: '', year: '' });
    fetchData();
  };

  const handleEdit = (mag: Magazine) => {
    setEditingId(mag.id);
    setFormData({ title: mag.title, quarter: mag.quarter, year: mag.year.toString() });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente excluir esta revista?')) {
      try {
        await api.delete(`/magazines/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Erro ao excluir revista. Verifique se existem lições vinculadas.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Revistas e Temas</h1>
          <p className="text-neutral-500 text-sm italic serif">Catálogo de revistas bíblicas da CPAD.</p>
        </div>
        {role === 'master' && (
          <button 
            onClick={() => { setShowModal(true); setEditingId(null); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-100"
          >
            <Plus size={18} />
            Nova Revista
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {magazines.map((mag) => (
          <div key={mag.id} className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 flex gap-6 items-center relative group">
            <div className="w-24 h-32 bg-neutral-100 rounded-xl flex flex-col items-center justify-center text-neutral-400 border border-neutral-200">
              <BookOpen size={32} />
              <span className="text-[8px] font-bold uppercase mt-2">CPAD</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <Calendar size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{mag.quarter} - {mag.year}</span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900">{mag.title}</h3>
              <p className="text-sm text-neutral-500 mt-2 italic serif">O Deus Único Revelado em Três Pessoas Eternas</p>
              <div className="mt-4 flex items-center gap-4">
                <button className="text-xs font-bold text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors">Visualizar Lições →</button>
                {role === 'master' && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(mag)} className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(mag.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-neutral-900 mb-6">{editingId ? 'Editar Revista' : 'Nova Revista'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Título</label>
                <input required type="text" className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Trimestre</label>
                <input required type="text" className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none" value={formData.quarter} onChange={(e) => setFormData({ ...formData, quarter: e.target.value })} placeholder="Ex: 1º Trimestre" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Ano</label>
                <input required type="number" className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-neutral-200 rounded-xl font-medium">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium shadow-lg">Salvar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

