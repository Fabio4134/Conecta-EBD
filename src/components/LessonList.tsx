import React, { useState, useEffect, useMemo } from 'react';
import api from '../api.js';
import { Lesson, Magazine } from '../types.js';
import { formatDate } from '../utils.js';
import {
    Plus, Trash2, Search, Edit2, BookOpen, Eye, Calendar,
    LayoutGrid, List, Filter, Download, X, Sparkles, Layers,
    BookMarked, ChevronRight, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const CATEGORIES = [
    'Adultos',
    'Jovens',
    'Juvenis',
    'Adolescentes',
    'Infantil / Crianças',
    'Geral'
];

export default function LessonList({ role }: { role: string }) {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [magazines, setMagazines] = useState<Magazine[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtros por caixas de seleção
    const [filterMagazine, setFilterMagazine] = useState('all');
    const [filterQuarter, setFilterQuarter] = useState('all');
    const [filterYear, setFilterYear] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [search, setSearch] = useState('');

    // Modo de visualização: 'grid' (cards) ou 'table' (lista compacta)
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // Modais
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        magazine_id: '',
        number: '',
        title: '',
        date: '',
        golden_text: '',
        suggested_hymns: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [lRes, mRes] = await Promise.all([
                api.get('/lessons'),
                api.get('/magazines')
            ]);
            setLessons(lRes.data || []);
            setMagazines(mRes.data || []);
        } catch (err) {
            console.error('Erro ao buscar lições:', err);
        } finally {
            setLoading(false);
        }
    };

    // Helper para identificar a categoria da revista
    const getCategory = (mag?: Magazine) => {
        if (!mag) return 'Adultos';
        if (mag.category) return mag.category;
        const titleLower = mag.title.toLowerCase();
        if (titleLower.includes('jovens') || titleLower.includes('jovem')) return 'Jovens';
        if (titleLower.includes('juvenis') || titleLower.includes('juvenil')) return 'Juvenis';
        if (titleLower.includes('adolescentes') || titleLower.includes('adolescente')) return 'Adolescentes';
        if (titleLower.includes('infantil') || titleLower.includes('crianças') || titleLower.includes('primários')) return 'Infantil / Crianças';
        return 'Adultos';
    };

    // Lista dinâmica de anos a partir das revistas cadastradas
    const availableYears = useMemo(() => {
        const years = Array.from(new Set(magazines.map(m => m.year))).filter(Boolean);
        if (!years.includes(2026)) years.push(2026);
        return years.sort((a, b) => b - a);
    }, [magazines]);

    // Map para lookup rápido de revista por id
    const magazineMap = useMemo(() => {
        const map = new Map<number, Magazine>();
        magazines.forEach(m => map.set(m.id, m));
        return map;
    }, [magazines]);

    // Revistas filtradas pelas opções de ano, trimestre e categoria para o dropdown
    const availableMagazines = useMemo(() => {
        return magazines.filter(mag => {
            if (filterQuarter !== 'all' && !mag.quarter?.toLowerCase().includes(filterQuarter.toLowerCase())) return false;
            if (filterYear !== 'all' && mag.year.toString() !== filterYear) return false;
            if (filterCategory !== 'all' && getCategory(mag) !== filterCategory) return false;
            return true;
        });
    }, [magazines, filterQuarter, filterYear, filterCategory]);

    // Filtragem principal das lições
    const filteredLessons = useMemo(() => {
        return lessons.filter(lesson => {
            const mag = magazineMap.get(lesson.magazine_id);

            // Filtro de Revista específica
            if (filterMagazine !== 'all' && lesson.magazine_id.toString() !== filterMagazine) {
                return false;
            }

            // Filtro de Trimestre
            if (filterQuarter !== 'all' && mag) {
                if (!mag.quarter?.toLowerCase().includes(filterQuarter.toLowerCase())) return false;
            }

            // Filtro de Ano
            if (filterYear !== 'all' && mag) {
                if (mag.year.toString() !== filterYear) return false;
            }

            // Filtro de Categoria
            if (filterCategory !== 'all' && mag) {
                if (getCategory(mag) !== filterCategory) return false;
            }

            // Busca por texto
            if (search.trim()) {
                const q = search.toLowerCase();
                const matchTitle = lesson.title.toLowerCase().includes(q);
                const matchMag = lesson.magazine_title?.toLowerCase().includes(q) || mag?.title.toLowerCase().includes(q);
                const matchNumber = lesson.number.toString() === q || `lição ${lesson.number}`.includes(q);
                const matchGolden = lesson.golden_text?.toLowerCase().includes(q);
                const matchHymns = lesson.suggested_hymns?.toLowerCase().includes(q);
                if (!matchTitle && !matchMag && !matchNumber && !matchGolden && !matchHymns) return false;
            }

            return true;
        }).sort((a, b) => {
            // Ordena por revista e número da lição
            if (a.magazine_id !== b.magazine_id) {
                return (a.magazine_title || '').localeCompare(b.magazine_title || '');
            }
            return a.number - b.number;
        });
    }, [lessons, magazineMap, filterMagazine, filterQuarter, filterYear, filterCategory, search]);

    const activeFiltersCount = (filterMagazine !== 'all' ? 1 : 0) +
        (filterQuarter !== 'all' ? 1 : 0) +
        (filterYear !== 'all' ? 1 : 0) +
        (filterCategory !== 'all' ? 1 : 0) +
        (search.trim() ? 1 : 0);

    const handleClearFilters = () => {
        setFilterMagazine('all');
        setFilterQuarter('all');
        setFilterYear('all');
        setFilterCategory('all');
        setSearch('');
    };

    const selectedMagazineObj = filterMagazine !== 'all' ? magazineMap.get(Number(filterMagazine)) : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/lessons/${editingId}`, formData);
            } else {
                await api.post('/lessons', formData);
            }
            setShowModal(false);
            setEditingId(null);
            resetForm();
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao salvar lição');
        }
    };

    const resetForm = () => setFormData({ magazine_id: '', number: '', title: '', date: '', golden_text: '', suggested_hymns: '' });

    const handleEdit = (lesson: Lesson) => {
        setEditingId(lesson.id);
        setFormData({
            magazine_id: lesson.magazine_id.toString(),
            number: lesson.number.toString(),
            title: lesson.title,
            date: lesson.date || '',
            golden_text: lesson.golden_text || '',
            suggested_hymns: lesson.suggested_hymns || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Deseja realmente excluir esta lição?')) {
            try {
                await api.delete(`/lessons/${id}`);
                fetchData();
            } catch (err: any) {
                alert(err.response?.data?.error || 'Erro ao excluir lição. Verifique se há chamadas vinculadas.');
            }
        }
    };

    const downloadPDF = () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as any;
        const pageW = doc.internal.pageSize.getWidth();

        doc.setFillColor(147, 51, 234);
        doc.rect(0, 0, pageW, 24, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('EBD Digital — Programação de Lições', 14, 15);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} | Total: ${filteredLessons.length} lições`, pageW - 14, 15, { align: 'right' });

        const head = [['#', 'Título da Lição', 'Revista', 'Data']];
        const body = filteredLessons.map(l => [
            `Lição ${l.number}`,
            l.title,
            l.magazine_title || '',
            formatDate(l.date)
        ]);

        autoTable(doc, {
            startY: 30,
            head,
            body,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3.5 },
            headStyles: { fillColor: [147, 51, 234], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [250, 245, 255] },
            columnStyles: {
                0: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 50 },
                3: { cellWidth: 26, halign: 'center' }
            }
        });

        doc.save('licoes-ebd.pdf');
    };

    return (
        <div className="space-y-6">
            {/* Header com ações principais */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Lições e Temas</h1>
                    <p className="text-neutral-500 text-sm italic serif">Gerencie e visualize os conteúdos das lições bíblicas.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={downloadPDF}
                        disabled={filteredLessons.length === 0}
                        className="px-4 py-2.5 bg-white border border-neutral-200/80 hover:bg-neutral-50 text-neutral-700 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                        title="Baixar lista de lições em PDF"
                    >
                        <Download size={16} />
                        Exportar PDF
                    </button>
                    <button
                        onClick={() => { setShowModal(true); setEditingId(null); resetForm(); }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 font-semibold text-sm"
                    >
                        <Plus size={18} />
                        Nova Lição
                    </button>
                </div>
            </div>

            {/* Painel de Filtros Despoluído com Caixas de Seleção */}
            <div className="glass-panel rounded-3xl p-5 space-y-4 border border-white/80 shadow-sm">
                {/* Linha 1: Caixas de seleção (Revista, Trimestre, Ano, Categoria) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Caixa de Seleção: Revista */}
                    <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <BookOpen size={12} className="text-purple-600" />
                            Revista
                        </label>
                        <select
                            className="w-full px-3.5 py-2.5 bg-white/70 border border-neutral-200/80 rounded-xl outline-none text-xs sm:text-sm font-medium text-neutral-700 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-sm hover:bg-white"
                            value={filterMagazine}
                            onChange={(e) => setFilterMagazine(e.target.value)}
                        >
                            <option value="all">Todas as Revistas ({lessons.length} lições)</option>
                            {availableMagazines.map(m => {
                                const count = lessons.filter(l => l.magazine_id === m.id).length;
                                return (
                                    <option key={m.id} value={m.id.toString()}>
                                        {m.title} ({count} lições)
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Caixa de Seleção: Trimestre */}
                    <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Calendar size={12} className="text-purple-600" />
                            Trimestre
                        </label>
                        <select
                            className="w-full px-3.5 py-2.5 bg-white/70 border border-neutral-200/80 rounded-xl outline-none text-xs sm:text-sm font-medium text-neutral-700 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-sm hover:bg-white"
                            value={filterQuarter}
                            onChange={(e) => {
                                setFilterQuarter(e.target.value);
                                setFilterMagazine('all');
                            }}
                        >
                            <option value="all">Todos os Trimestres</option>
                            <option value="1º Trimestre">1º Trimestre</option>
                            <option value="2º Trimestre">2º Trimestre</option>
                            <option value="3º Trimestre">3º Trimestre</option>
                            <option value="4º Trimestre">4º Trimestre</option>
                        </select>
                    </div>

                    {/* Caixa de Seleção: Ano */}
                    <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Layers size={12} className="text-purple-600" />
                            Ano
                        </label>
                        <select
                            className="w-full px-3.5 py-2.5 bg-white/70 border border-neutral-200/80 rounded-xl outline-none text-xs sm:text-sm font-medium text-neutral-700 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-sm hover:bg-white"
                            value={filterYear}
                            onChange={(e) => {
                                setFilterYear(e.target.value);
                                setFilterMagazine('all');
                            }}
                        >
                            <option value="all">Todos os Anos</option>
                            {availableYears.map(year => (
                                <option key={year} value={year.toString()}>{year}</option>
                            ))}
                        </select>
                    </div>

                    {/* Caixa de Seleção: Categoria / Faixa Etária */}
                    <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <BookMarked size={12} className="text-purple-600" />
                            Categoria / Turma
                        </label>
                        <select
                            className="w-full px-3.5 py-2.5 bg-white/70 border border-neutral-200/80 rounded-xl outline-none text-xs sm:text-sm font-medium text-neutral-700 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-sm hover:bg-white"
                            value={filterCategory}
                            onChange={(e) => {
                                setFilterCategory(e.target.value);
                                setFilterMagazine('all');
                            }}
                        >
                            <option value="all">Todas as Categorias</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Linha 2: Busca por texto + Alternador de Visualização (Cards / Tabela) */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-neutral-200/50">
                    <div className="flex-1 w-full bg-white/70 px-4 py-2.5 rounded-xl flex items-center gap-2 border border-neutral-200/80 focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500 transition-all shadow-sm">
                        <Search size={18} className="text-neutral-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Buscar por título, número, revista ou texto bíblico..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-xs sm:text-sm outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="p-1 text-neutral-400 hover:text-neutral-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={handleClearFilters}
                                className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5"
                            >
                                <X size={14} />
                                Limpar ({activeFiltersCount})
                            </button>
                        )}

                        {/* Alternador de Layout Criativo: Cards vs Tabela */}
                        <div className="bg-neutral-100 p-1 rounded-xl flex items-center border border-neutral-200/60 shadow-inner">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    viewMode === 'grid'
                                        ? 'bg-white text-purple-700 shadow-sm'
                                        : 'text-neutral-500 hover:text-neutral-800'
                                }`}
                                title="Visualização em Grade de Cards"
                            >
                                <LayoutGrid size={14} />
                                <span className="hidden sm:inline">Cards</span>
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    viewMode === 'table'
                                        ? 'bg-white text-purple-700 shadow-sm'
                                        : 'text-neutral-500 hover:text-neutral-800'
                                }`}
                                title="Visualização em Tabela Compacta"
                            >
                                <List size={14} />
                                <span className="hidden sm:inline">Tabela</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Banner Compacto quando uma Revista Específica estiver selecionada */}
            {selectedMagazineObj && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border border-purple-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                                    {selectedMagazineObj.quarter} • {selectedMagazineObj.year}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-purple-200 text-neutral-600">
                                    {getCategory(selectedMagazineObj)}
                                </span>
                            </div>
                            <h3 className="font-bold text-neutral-900 text-sm sm:text-base mt-0.5">
                                {selectedMagazineObj.title}
                            </h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-xs font-semibold text-purple-700 bg-white/80 px-3 py-1.5 rounded-xl border border-purple-200/60 shadow-sm">
                            {filteredLessons.length} lições cadastradas
                        </span>
                        <button
                            onClick={() => setFilterMagazine('all')}
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-white/60 rounded-lg transition-colors"
                            title="Ver todas as revistas"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Resumo de contagem */}
            <div className="flex items-center justify-between text-xs font-medium text-neutral-500 px-1">
                <span>
                    Exibindo <strong>{filteredLessons.length}</strong> de <strong>{lessons.length}</strong> lições
                </span>
            </div>

            {/* Renderização do Conteúdo: MODO CARDS OU MODO TABELA */}
            {loading ? (
                <div className="py-20 text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-600 rounded-full animate-spin mx-auto" />
                    <p className="text-neutral-400 text-xs font-mono uppercase tracking-widest">Carregando Lições...</p>
                </div>
            ) : filteredLessons.length === 0 ? (
                <div className="glass-card rounded-3xl p-12 text-center space-y-3 border border-neutral-200/60">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                        <BookOpen size={24} />
                    </div>
                    <h3 className="font-bold text-neutral-800 text-base">Nenhuma lição encontrada</h3>
                    <p className="text-neutral-500 text-xs max-w-sm mx-auto">
                        Nenhum resultado corresponde aos filtros selecionados. Tente ajustar os seletores acima.
                    </p>
                    {activeFiltersCount > 0 && (
                        <button
                            onClick={handleClearFilters}
                            className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-colors inline-block mt-2"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                /* ── MODO CARDS ── */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredLessons.map((lesson, idx) => (
                        <motion.div
                            key={lesson.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                            className="glass-card p-6 rounded-3xl flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden border border-white/80 shadow-sm hover:shadow-lg hover:shadow-purple-500/5 bg-white/70"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-purple-500/15 transition-all" />

                            <div>
                                <div className="flex justify-between items-start mb-3 gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 flex items-center justify-center text-sm font-black shadow-sm shrink-0">
                                        {lesson.number}
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 bg-neutral-100/80 text-neutral-600 rounded-lg font-bold border border-neutral-200/50 line-clamp-1 max-w-[190px]" title={lesson.magazine_title}>
                                        {lesson.magazine_title}
                                    </span>
                                </div>

                                <h3 className="text-base font-bold text-neutral-900 leading-snug mb-2 line-clamp-2" title={lesson.title}>
                                    {lesson.title}
                                </h3>

                                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium bg-neutral-100/60 w-fit px-2.5 py-1 rounded-lg mb-3">
                                    <Calendar size={13} className="text-purple-500" />
                                    {formatDate(lesson.date)}
                                </div>

                                {lesson.golden_text && (
                                    <p className="text-xs text-neutral-600 italic line-clamp-2 border-l-2 border-purple-300 pl-2.5 my-2">
                                        "{lesson.golden_text.split('[Verdade Prática]:')[0].trim()}"
                                    </p>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedLesson(lesson);
                                        setShowDetailsModal(true);
                                    }}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Eye size={15} />
                                    <span>Ver Conteúdo</span>
                                </button>

                                <button
                                    onClick={() => handleEdit(lesson)}
                                    className="p-2.5 bg-white border border-neutral-200/80 text-neutral-600 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 rounded-xl transition-all shadow-sm"
                                    title="Editar Lição"
                                >
                                    <Edit2 size={15} />
                                </button>
                                <button
                                    onClick={() => handleDelete(lesson.id)}
                                    className="p-2.5 bg-white border border-neutral-200/80 text-neutral-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl transition-all shadow-sm"
                                    title="Excluir Lição"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                /* ── MODO TABELA COMPACTA ── */
                <div className="glass-panel rounded-3xl overflow-hidden border border-white/80 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/60 text-[10px] uppercase tracking-widest text-neutral-500 font-bold border-b border-neutral-200/60">
                                    <th className="px-6 py-4">#</th>
                                    <th className="px-6 py-4">Título da Lição</th>
                                    <th className="px-6 py-4">Revista / Trimestre</th>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200/50">
                                {filteredLessons.map((lesson) => (
                                    <tr key={lesson.id} className="hover:bg-white/60 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                                                {lesson.number}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-neutral-900 leading-snug">{lesson.title}</p>
                                            {lesson.golden_text && (
                                                <p className="text-xs text-neutral-500 italic mt-0.5 line-clamp-1">
                                                    {lesson.golden_text.split('[Verdade Prática]:')[0].trim()}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-medium text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-lg inline-block">
                                                {lesson.magazine_title}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-neutral-600">
                                            {formatDate(lesson.date)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <button
                                                    onClick={() => {
                                                        setSelectedLesson(lesson);
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="Ver Detalhes"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(lesson)}
                                                    className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Editar Lição"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(lesson.id)}
                                                    className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir Lição"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de Detalhes da Lição */}
            {showDetailsModal && selectedLesson && (
                <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }} className="glass-panel rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto border border-white/80 bg-white/95">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg font-bold mb-2 inline-block">
                                    Revista: {selectedLesson.magazine_title}
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">
                                    <span className="text-purple-600 mr-2">#{selectedLesson.number}</span>
                                    {selectedLesson.title}
                                </h2>
                            </div>
                            <button onClick={() => setShowDetailsModal(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="glass-card p-4 rounded-2xl border border-neutral-200/70 bg-neutral-50/70">
                                <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">Data da Lição</div>
                                <div className="text-neutral-800 font-medium flex items-center gap-2 text-sm">
                                    <Calendar size={16} className="text-purple-500" />
                                    {formatDate(selectedLesson.date)}
                                </div>
                            </div>

                            <div className="glass-card p-4 rounded-2xl bg-white border border-emerald-100 shadow-sm">
                                <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold mb-1.5">Texto Áureo</div>
                                <p className="text-neutral-800 italic border-l-4 border-emerald-400 pl-3 py-1 text-sm leading-relaxed">
                                    {selectedLesson.golden_text?.includes('[Verdade Prática]:')
                                        ? selectedLesson.golden_text.split('[Verdade Prática]:')[0].trim()
                                        : (selectedLesson.golden_text || 'Não informado')}
                                </p>
                            </div>

                            {selectedLesson.golden_text?.includes('[Verdade Prática]:') && (
                                <div className="glass-card p-4 rounded-2xl bg-white border border-amber-100 shadow-sm">
                                    <div className="text-[10px] uppercase tracking-widest text-amber-700 font-bold mb-1.5">Verdade Prática</div>
                                    <p className="text-neutral-800 border-l-4 border-amber-400 pl-3 py-1 text-sm leading-relaxed">
                                        {selectedLesson.golden_text.split('[Verdade Prática]:')[1].trim()}
                                    </p>
                                </div>
                            )}

                            <div className="glass-card p-4 rounded-2xl bg-white border border-neutral-200/70 shadow-sm">
                                <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1.5">Hinos Sugeridos</div>
                                <p className="text-neutral-700 font-medium text-sm">
                                    {selectedLesson.suggested_hymns || 'Não informado'}
                                </p>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl transition-all font-bold text-sm shadow-md"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Modal de Nova/Editar Lição */}
            {showModal && (
                <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }} className="glass-panel rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto border border-white/80 bg-white">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-bold text-neutral-900">
                                {editingId ? 'Editar Lição' : 'Nova Lição'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Revista *</label>
                                    <select required className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm" value={formData.magazine_id} onChange={(e) => setFormData({ ...formData, magazine_id: e.target.value })}>
                                        <option value="">Selecione a revista</option>
                                        {magazines.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Número da Lição *</label>
                                    <input required type="number" min="1" max="52" className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm font-medium" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} placeholder="Ex: 1" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Título da Lição *</label>
                                <input required type="text" className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm font-medium" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: A Importância da Oração" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Data Prevista</label>
                                <input type="date" className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm text-neutral-800" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Texto Áureo</label>
                                <textarea rows={2} className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm resize-none" value={formData.golden_text} onChange={(e) => setFormData({ ...formData, golden_text: e.target.value })} placeholder="Ex: O Senhor é o meu pastor... (Sl 23.1)" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Hinos Sugeridos</label>
                                <input type="text" className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm" value={formData.suggested_hymns} onChange={(e) => setFormData({ ...formData, suggested_hymns: e.target.value })} placeholder="Ex: Harpa Cristã 115, 186" />
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all font-semibold text-sm">Cancelar</button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5">Salvar Lição</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
