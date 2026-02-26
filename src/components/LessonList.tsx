import React, { useState, useEffect } from 'react';
import api from '../api.js';
import { Lesson, Magazine } from '../types.js';
import { Plus, Trash2, Search, Edit2, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

export default function LessonList({ role }: { role: string }) {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [magazines, setMagazines] = useState<Magazine[]>([]);
    const [search, setSearch] = useState('');
    const [selectedMagazineId, setSelectedMagazineId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
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
                {role === 'master' && (
                    <button
                        onClick={() => { setShowModal(true); setEditingId(null); resetForm(); }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-100"
                    >
                        <Plus size={18} />
                        Nova Lição
                    </button>
                )}
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

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/40 text-[10px] uppercase tracking-widest text-neutral-500 font-bold border-b border-neutral-200/50">
                                <th className="px-6 py-4">Nº</th>
                                <th className="px-6 py-4">Título</th>
                                <th className="px-6 py-4">Revista</th>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Texto Áureo</th>
                                {role === 'master' && <th className="px-6 py-4 text-right">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200/50">
                            {filtered.map((lesson) => (
                                <tr key={lesson.id} className="hover:bg-white/40 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                                            {lesson.number}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-neutral-800">{lesson.title}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-lg font-bold">{lesson.magazine_title}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-neutral-500">{lesson.date}</td>
                                    <td className="px-6 py-4 text-sm text-neutral-500 max-w-xs truncate">{lesson.golden_text}</td>
                                    {role === 'master' && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(lesson)} className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(lesson.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-400 text-sm">Nenhuma lição encontrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
