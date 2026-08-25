import React, { useState, useEffect } from 'react';
import api from '../api';
import { Magazine } from '../types';
import { BookOpen, Calendar, Plus, Edit2, Trash2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MagazineListProps {
  role: string;
  onNavigateToAI?: () => void;
  onNavigateToLessons?: (magazineId?: number) => void;
}

export default function MagazineList({ role, onNavigateToAI, onNavigateToLessons }: MagazineListProps) {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: '', quarter: '', year: '' });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/magazines');
      setMagazines(res.data);
    } catch {
      // Silencioso
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/magazines/${editingId}`, formData);
      } else {
        await api.post('/magazines', formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ title: '', quarter: '', year: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar revista.');
    }
  };

  const handleEdit = (mag: Magazine) => {
    setEditingId(mag.id);
    setFormData({ title: mag.title, quarter: mag.quarter, year: mag.year.toString() });
    setShowModal(true);
  };

  const handleDelete = async (mag: Magazine) => {
    if (confirm(`Deseja realmente excluir a revista "${mag.title}"?\n\n⚠️ Todas as lições vinculadas a esta revista também serão excluídas.`)) {
      setDeletingId(mag.id);
      try {
        await api.delete(`/magazines/${mag.id}`);
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Erro ao excluir revista.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Revistas e Temas</h1>
          <p className="text-neutral-500 text-sm italic serif">Catálogo de revistas bíblicas e temas da EBD.</p>
        </div>
        <div className="flex items-center gap-3">
          {onNavigateToAI && (
            <button
              onClick={onNavigateToAI}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 text-sm font-bold hover:-translate-y-0.5"
            >
              <Sparkles size={16} />
              Importar com IA
            </button>
          )}
          <button
            onClick={() => { setShowModal(true); setEditingId(null); setFormData({ title: '', quarter: '', year: new Date().getFullYear().toString() }); }}
            className="bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm text-sm font-semibold hover:-translate-y-0.5"
          >
            <Plus size={16} />
            Nova Revista Manual
          </button>
        </div>
      </div>

      {/* Grid de Revistas */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 h-44 animate-pulse" />
          ))}
        </div>
      ) : magazines.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-neutral-200 shadow-sm space-y-3">
          <BookOpen size={48} className="mx-auto text-neutral-300" />
          <h3 className="text-base font-bold text-neutral-700">Nenhuma revista cadastrada</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto">
            Você pode importar automaticamente as 13 lições com Texto Áureo e Verdade Prática usando o Gerador IA ou cadastrar manualmente.
          </p>
          {onNavigateToAI && (
            <button
              onClick={onNavigateToAI}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20"
            >
              <Sparkles size={16} />
              Gerar com IA agora
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {magazines.map((mag) => (
            <div
              key={mag.id}
              className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-neutral-200/80 hover:border-emerald-200 transition-all flex flex-col sm:flex-row gap-5 items-start sm:items-center relative group hover:shadow-md"
            >
              {/* Ícone / Capa */}
              <div className="w-20 h-28 sm:w-24 sm:h-32 bg-gradient-to-br from-emerald-50 to-neutral-100 rounded-xl flex flex-col items-center justify-center text-emerald-600 border border-emerald-100/80 flex-shrink-0 shadow-sm">
                <BookOpen size={30} />
                <span className="text-[9px] font-bold uppercase tracking-wider mt-2 text-neutral-500">CPAD</span>
              </div>

              {/* Informações */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-emerald-600 mb-1.5">
                  <Calendar size={13} />
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
                    {mag.quarter} • {mag.year}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 leading-snug break-words">{mag.title}</h3>

                {/* Ações */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <button
                    onClick={() => onNavigateToLessons?.(mag.id)}
                    className="text-xs font-bold text-emerald-600 uppercase tracking-wider hover:text-emerald-700 transition-colors flex items-center gap-1"
                  >
                    Visualizar Lições →
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(mag)}
                      className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Editar título/trimestre"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(mag)}
                      disabled={deletingId === mag.id}
                      className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Excluir Revista e Lições"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-neutral-900 mb-5">{editingId ? 'Editar Revista' : 'Nova Revista'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Título da Revista *</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: A Igreja dos Gentios"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Trimestre *</label>
                <select
                  required
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  value={formData.quarter}
                  onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
                >
                  <option value="">Selecione o trimestre</option>
                  <option value="1º Trimestre">1º Trimestre</option>
                  <option value="2º Trimestre">2º Trimestre</option>
                  <option value="3º Trimestre">3º Trimestre</option>
                  <option value="4º Trimestre">4º Trimestre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Ano *</label>
                <input
                  required
                  type="number"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="2026"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl font-semibold text-sm hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-emerald-500/20"
                >
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
