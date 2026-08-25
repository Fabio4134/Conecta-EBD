import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { Magazine } from '../types';
import {
  BookOpen, Calendar, Plus, Edit2, Trash2, Sparkles,
  Search, Filter, Users, X, ArrowRight, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MagazineListProps {
  role: string;
  onNavigateToAI?: () => void;
  onNavigateToLessons?: (magazineId?: number) => void;
}

const CATEGORIES = [
  'Adultos',
  'Jovens',
  'Juvenis',
  'Adolescentes',
  'Infantil / Crianças',
  'Geral'
];

export default function MagazineList({ role, onNavigateToAI, onNavigateToLessons }: MagazineListProps) {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: '', quarter: '1º Trimestre', year: '2026', category: 'Adultos' });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filtros enxutos
  const [filterQuarter, setFilterQuarter] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');

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

  // Lista dinâmica de anos a partir das revistas cadastradas
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(magazines.map(m => m.year))).filter(Boolean);
    if (!years.includes(2026)) years.push(2026);
    return years.sort((a, b) => b - a);
  }, [magazines]);

  // Função que infere a categoria/turma caso não esteja salva na coluna
  const getCategory = (mag: Magazine) => {
    if (mag.category) return mag.category;
    const titleLower = mag.title.toLowerCase();
    if (titleLower.includes('jovens') || titleLower.includes('jovem')) return 'Jovens';
    if (titleLower.includes('juvenis') || titleLower.includes('juvenil')) return 'Juvenis';
    if (titleLower.includes('adolescentes') || titleLower.includes('adolescente')) return 'Adolescentes';
    if (titleLower.includes('infantil') || titleLower.includes('crianças') || titleLower.includes('primários')) return 'Infantil / Crianças';
    return 'Adultos';
  };

  // Filtragem enxuta
  const filtered = useMemo(() => {
    return magazines.filter(mag => {
      // Filtro Trimestre
      if (filterQuarter !== 'all' && !mag.quarter?.toLowerCase().includes(filterQuarter.toLowerCase())) {
        return false;
      }
      // Filtro Ano
      if (filterYear !== 'all' && mag.year.toString() !== filterYear) {
        return false;
      }
      // Filtro Turma / Categoria
      if (filterCategory !== 'all') {
        const cat = getCategory(mag);
        if (cat !== filterCategory) return false;
      }
      // Busca por texto
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = mag.title.toLowerCase().includes(q);
        const matchesQuarter = mag.quarter.toLowerCase().includes(q);
        const matchesYear = mag.year.toString().includes(q);
        if (!matchesTitle && !matchesQuarter && !matchesYear) return false;
      }
      return true;
    });
  }, [magazines, filterQuarter, filterYear, filterCategory, search]);

  const hasActiveFilters = filterQuarter !== 'all' || filterYear !== 'all' || filterCategory !== 'all' || search !== '';

  const clearFilters = () => {
    setFilterQuarter('all');
    setFilterYear('all');
    setFilterCategory('all');
    setSearch('');
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
      setFormData({ title: '', quarter: '1º Trimestre', year: '2026', category: 'Adultos' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar revista.');
    }
  };

  const handleEdit = (mag: Magazine) => {
    setEditingId(mag.id);
    setFormData({
      title: mag.title,
      quarter: mag.quarter,
      year: mag.year.toString(),
      category: getCategory(mag)
    });
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
            onClick={() => {
              setShowModal(true);
              setEditingId(null);
              setFormData({ title: '', quarter: '1º Trimestre', year: '2026', category: 'Adultos' });
            }}
            className="bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm text-sm font-semibold hover:-translate-y-0.5"
          >
            <Plus size={16} />
            Nova Revista Manual
          </button>
        </div>
      </div>

      {/* Barra de Filtros Enxuta */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          
          {/* Busca por texto */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar tema ou título da revista..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none"
            />
            <Search className="absolute left-3.5 top-2.5 text-neutral-400" size={16} />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtros em Linha: Trimestre, Ano e Turma */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Trimestre */}
            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-neutral-700">
              <Calendar size={14} className="text-emerald-600" />
              <select
                value={filterQuarter}
                onChange={e => setFilterQuarter(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-semibold text-neutral-700 cursor-pointer"
              >
                <option value="all">Todos os Trimestres</option>
                <option value="1º">1º Trimestre</option>
                <option value="2º">2º Trimestre</option>
                <option value="3º">3º Trimestre</option>
                <option value="4º">4º Trimestre</option>
              </select>
            </div>

            {/* Ano */}
            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-neutral-700">
              <select
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-semibold text-neutral-700 cursor-pointer"
              >
                <option value="all">Todos os Anos</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr.toString()}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Turma / Faixa Etária */}
            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-neutral-700">
              <Users size={14} className="text-emerald-600" />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-semibold text-neutral-700 cursor-pointer"
              >
                <option value="all">Todas as Turmas</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Botão Limpar Filtros */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors"
                title="Limpar todos os filtros"
              >
                <X size={13} />
                Limpar
              </button>
            )}

          </div>
        </div>

        {/* Resumo de Resultados */}
        <div className="flex items-center justify-between text-xs text-neutral-500 pt-1 border-t border-neutral-100">
          <span>
            Exibindo <strong>{filtered.length}</strong> de <strong>{magazines.length}</strong> revista{magazines.length !== 1 ? 's' : ''}
          </span>
          {hasActiveFilters && (
            <span className="text-emerald-600 font-medium">Filtro ativo</span>
          )}
        </div>
      </div>

      {/* Grid de Revistas */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 h-44 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 shadow-sm space-y-3">
          <BookOpen size={44} className="mx-auto text-neutral-300" />
          <h3 className="text-base font-bold text-neutral-700">Nenhuma revista encontrada</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto">
            {hasActiveFilters ? 'Nenhum resultado corresponde aos filtros selecionados.' : 'Cadastre ou importe uma nova revista com o Gerador IA.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-xl text-xs font-bold transition-colors"
            >
              <X size={14} /> Limpar Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((mag) => {
            const categoryBadge = getCategory(mag);

            return (
              <motion.div
                key={mag.id}
                layout
                className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-neutral-200/80 hover:border-emerald-300 transition-all flex flex-col sm:flex-row gap-5 items-start sm:items-center relative group hover:shadow-md"
              >
                {/* Capa estilizada com ícone */}
                <div className="w-20 h-28 sm:w-24 sm:h-32 bg-gradient-to-br from-emerald-50 to-neutral-100 rounded-xl flex flex-col items-center justify-center text-emerald-600 border border-emerald-100/80 flex-shrink-0 shadow-sm">
                  <BookOpen size={30} />
                  <span className="text-[9px] font-bold uppercase tracking-wider mt-2 text-neutral-500">CPAD</span>
                </div>

                {/* Informações */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                      {mag.quarter} • {mag.year}
                    </span>
                    <span className="text-[11px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md border border-neutral-200">
                      {categoryBadge}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug break-words">
                    {mag.title}
                  </h3>

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
                        title="Editar título/trimestre/turma"
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
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-neutral-900">{editingId ? 'Editar Revista' : 'Nova Revista'}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
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
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Turma / Faixa Etária *</label>
                <select
                  required
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Trimestre *</label>
                  <select
                    required
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                    value={formData.quarter}
                    onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
                  >
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
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="2026"
                  />
                </div>
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
