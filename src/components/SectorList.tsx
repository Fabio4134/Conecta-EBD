import React, { useState, useEffect } from 'react';
import api from '../api';
import { Sector } from '../types';
import { Building2, Plus, Pencil, Trash2, X, Check, MapPin, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Pagination from './Pagination.js';

interface SectorListProps {
  role: string;
}

export default function SectorList({ role }: SectorListProps) {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSectors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sectors');
      setSectors(res.data);
    } catch {
      setError('Erro ao carregar setores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSectors(); }, []);

  const openCreate = () => {
    setEditingSector(null);
    setFormData({ name: '', description: '' });
    setShowForm(true);
    setError('');
  };

  const openEdit = (s: Sector) => {
    setEditingSector(s);
    setFormData({ name: s.name, description: s.description || '' });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingSector) {
        await api.put(`/sectors/${editingSector.id}`, formData);
        setSuccess('Setor atualizado com sucesso!');
      } else {
        await api.post('/sectors', formData);
        setSuccess('Setor criado com sucesso!');
      }
      setShowForm(false);
      fetchSectors();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar setor.');
    }
  };

  const handleDelete = async (s: Sector) => {
    if (!window.confirm(`Excluir o setor "${s.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/sectors/${s.id}`);
      setSuccess('Setor excluído!');
      fetchSectors();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao excluir setor.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const filtered = sectors.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const isAll = pageSize >= filtered.length || pageSize >= 9999;
  const paginatedSectors = isAll ? filtered : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Setores</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Gerencie os setores do sistema</p>
        </div>
        {role === 'master' && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5"
          >
            <Plus size={18} />
            Novo Setor
          </button>
        )}
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
            <Check size={16} /> {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 text-sm">
            <X size={16} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-neutral-900">
                  {editingSector ? 'Editar Setor' : 'Novo Setor'}
                </h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Nome do Setor *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
                    placeholder="Ex: Setor Tancredo Neves"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm resize-none"
                    placeholder="Descrição opcional do setor..."
                  />
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-3 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl text-sm font-semibold hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/25">
                    {editingSector ? 'Salvar Alterações' : 'Criar Setor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <input
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Buscar por nome ou descrição..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm shadow-sm"
        />
        <MapPin className="absolute left-3.5 top-3.5 text-neutral-400" size={16} />
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <Building2 size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum setor encontrado</p>
          <p className="text-sm mt-1">Crie o primeiro setor clicando em "Novo Setor"</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedSectors.map(s => (
              <motion.div key={s.id} layout
                className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <MapPin size={18} className="text-white" />
                  </div>
                  {role === 'master' && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(s)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-emerald-600 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(s)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-500 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-neutral-900 text-base leading-tight">{s.name}</h3>
                {s.description && <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{s.description}</p>}
                <div className="flex items-center gap-1.5 mt-4 text-xs text-emerald-600 font-semibold">
                  <Building2 size={13} />
                  <span>{s.church_count || 0} congregação{(s.church_count || 0) !== 1 ? 'ões' : ''}</span>
                  <ChevronRight size={13} className="ml-auto text-neutral-300" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <Pagination
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[6, 12, 24, 48]}
              itemName="setores"
            />
          </div>
        </div>
      )}
    </div>
  );
}
