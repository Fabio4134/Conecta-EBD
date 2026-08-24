import React, { useState, useEffect } from 'react';
import api from '../api.js';
import { Lesson, Magazine } from '../types.js';
import { formatDate } from '../utils.js';
import { Plus, Trash2, Search, Edit2, BookOpen, Eye, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

export default function LessonList({ role }: { role: string }) {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [magazines, setMagazines] = useState<Magazine[]>([]);
    const [search, setSearch] = useState('');
    const [selectedMagazineId, setSelectedMagazineId] = useState<number | null>(null);
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

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        const [lRes, mRes] = await Promise.all([
            api.get('/lessons'),
            api.get('/magazines')
        ]);
        setLessons(lRes.data);
        setMagazines(mRes.data);
    };

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
            date: lesson.date,
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

    const filtered = lessons.filter(l => {
        const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase()) ||
            l.magazine_title?.toLowerCase().includes(search.toLowerCase());
        const matchesMagazine = selectedMagazineId ? l.magazine_id === selectedMagazineId : true;
        return matchesSearch && matchesMagazine;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Lições</h1>
                    <p className="text-neutral-500 text-sm italic serif">Cadastre as lições vinculadas às revistas.</p>
                </div>
                <button
                    onClick={() => { setShowModal(true); setEditingId(null); resetForm(); }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-100"
                >
                    <Plus size={18} />
                    Nova Lição
                </button>
            </div>

            <div className="flex flex-wrap gap-4 pb-2">
                <button
                    onClick={() => setSelectedMagazineId(null)}
                    className={`glass-card p-6 rounded-3xl min-w-[200px] text-left transition-all group ${selectedMagazineId === null
                        ? 'ring-2 ring-purple-500 bg-white/60 shadow-lg shadow-purple-500/10'
                        : 'hover:bg-white/40'
                        }`}
                >
                    <BookOpen size={24} className={`mb-3 transition-colors ${selectedMagazineId === null ? 'text-purple-600' : 'text-neutral-400 group-hover:text-purple-500'}`} />
                    <h3 className="font-bold text-sm text-neutral-900">Todas as Revistas</h3>
                    <p className="text-xs mt-1 text-neutral-500">
                        {lessons.length} lições cadastradas
                    </p>
                </button>

                {magazines.map(mag => {
                    const magLessonsCount = lessons.filter(l => l.magazine_id === mag.id).length;
                    const isSelected = selectedMagazineId === mag.id;
                    return (
                        <button
                            key={mag.id}
                            onClick={() => setSelectedMagazineId(mag.id)}
                            className={`glass-card p-6 rounded-3xl min-w-[200px] text-left transition-all group overflow-hidden ${isSelected
                                ? 'ring-2 ring-purple-500 bg-white/60 shadow-lg shadow-purple-500/10'
                                : 'hover:bg-white/40'
                                }`}
                        >
                            <BookOpen size={24} className={`mb-3 transition-colors ${isSelected ? 'text-purple-600' : 'text-neutral-400 group-hover:text-purple-500'}`} />
                            <h3 className="font-bold text-sm text-neutral-900 line-clamp-2" title={mag.title}>{mag.title}</h3>
                            <p className="text-xs mt-1 text-neutral-500">
                                {magLessonsCount} lições cadastradas
                            </p>
                        </button>
                    );
                })}
            </div>

            <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="p-5 border-b border-neutral-200/50 flex items-center gap-3">
                    <div className="flex-1 w-full bg-white/50 px-4 py-2.5 rounded-xl flex items-center gap-2 border border-neutral-200/80 focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500 transition-all shadow-sm">
                        <Search size={18} className="text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Buscar por título ou revista..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {filtered.map((lesson) => (
                        <div key={lesson.id} className="glass-card p-6 rounded-3xl flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 relative group overflow-hidden">
                            {/* Decorative accent */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-purple-500/20"></div>

                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold shadow-sm">
                                        {lesson.number}
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 bg-white/60 text-neutral-500 rounded-lg font-bold border border-neutral-200/50">
                                        {lesson.magazine_title}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-neutral-800 leading-tight mb-2 line-clamp-2" title={lesson.title}>
                                    {lesson.title}
                                </h3>
                                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium bg-neutral-50/50 w-fit px-2 py-1 rounded-md">
                                    <Calendar size={14} className="text-neutral-400" />
                                    {formatDate(lesson.date)}
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedLesson(lesson);
                                        setShowDetailsModal(true);
                                    }}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl text-sm font-bold shadow-md shadow-purple-500/20 hover:from-purple-500 hover:to-purple-400 transition-all flex items-center justify-center gap-2"
                                >
                                    <Eye size={16} />
                                    <span>Ver</span>
                                </button>

                                <button
                                    onClick={() => handleEdit(lesson)}
                                    className="p-2.5 bg-white border border-neutral-200/80 text-neutral-600 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 rounded-xl transition-all shadow-sm"
                                    title="Editar Lição"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(lesson.id)}
                                    className="p-2.5 bg-white border border-neutral-200/80 text-neutral-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl transition-all shadow-sm"
                                    title="Excluir Lição"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full py-12 text-center text-neutral-400 text-sm glass-card rounded-2xl">
                            Nenhuma lição encontrada para o filtro atual.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Detalhes da Lição */}
            {showDetailsModal && selectedLesson && (
                <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }} className="glass-panel rounded-[2rem] p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto border border-white/60">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 bg-purple-100 text-purple-600 rounded-lg font-bold mb-3 inline-block">
                                    Revista: {selectedLesson.magazine_title}
                                </span>
                                <h2 className="text-2xl font-bold text-neutral-900 leading-tight">
                                    <span className="text-purple-600 mr-2">#{selectedLesson.number}</span>
                                    {selectedLesson.title}
                                </h2>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="glass-card p-4 rounded-2xl border-purple-100 bg-white/60">
                                <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">Data da Lição</div>
                                <div className="text-neutral-800 font-medium flex items-center gap-2">
                                    <Calendar size={16} className="text-purple-500" />
                                    {formatDate(selectedLesson.date)}
                                </div>
                            </div>

                            <div className="glass-card p-4 rounded-2xl bg-white/60">
                                <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Texto Áureo</div>
                                <p className="text-neutral-700 italic border-l-4 border-purple-300 pl-3 py-1">
                                    "{selectedLesson.golden_text || 'Não informado'}"
                                </p>
                            </div>

                            <div className="glass-card p-4 rounded-2xl bg-white/60">
                                <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Hinos Sugeridos</div>
                                <p className="text-neutral-700 font-medium">
                                    {selectedLesson.suggested_hymns || 'Não informado'}
                                </p>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="w-full py-3 bg-white border border-neutral-200/80 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all font-bold text-sm shadow-sm"
                                >
                                    Fechar Detalhes
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Modal de Nova/Editar Lição */}
            {showModal && (
                <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }} className="glass-panel rounded-[2rem] p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto border border-white/60">
                        <h2 className="text-xl font-bold text-neutral-900 mb-6">{editingId ? 'Editar Lição' : 'Nova Lição'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Revista</label>
                                    <select required className="w-full px-4 py-3 bg-white/50 border border-neutral-200/80 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-sm" value={formData.magazine_id} onChange={(e) => setFormData({ ...formData, magazine_id: e.target.value })}>
                                        <option value="">Selecione</option>
                                        {magazines.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Número</label>
                                    <input required type="number" min="1" className="w-full px-4 py-3 bg-white/50 border border-neutral-200/80 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-sm" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Título da Lição</label>
                                <input required type="text" className="w-full px-4 py-3 bg-white/50 border border-neutral-200/80 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-sm" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Data</label>
                                <input type="date" className="w-full px-4 py-3 bg-white/50 border border-neutral-200/80 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-sm" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Texto Áureo</label>
                                <input type="text" className="w-full px-4 py-3 bg-white/50 border border-neutral-200/80 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-sm" value={formData.golden_text} onChange={(e) => setFormData({ ...formData, golden_text: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Hinos Sugeridos</label>
                                <input type="text" className="w-full px-4 py-3 bg-white/50 border border-neutral-200/80 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-sm" value={formData.suggested_hymns} onChange={(e) => setFormData({ ...formData, suggested_hymns: e.target.value })} />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-neutral-200/80 text-neutral-600 rounded-xl hover:bg-neutral-100 transition-all font-bold text-sm bg-white/50">Cancelar</button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 mt-0">Salvar</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
