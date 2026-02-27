import React, { useState, useEffect } from 'react';
import api from '../api.js';
import { Class, Teacher, Student, Magazine } from '../types.js';
import {
    Plus, Trash2, Search, Edit2, BookOpen, Power, PowerOff, Eye, ArrowLeft,
    Users, Download, GraduationCap
} from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ClassList({ role }: { role: string }) {
    const [classes, setClasses] = useState<Class[]>([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<{ name: string; magazine_id: number | string }>({ name: '', magazine_id: '' });
    const [magazines, setMagazines] = useState<Magazine[]>([]);

    // Detail view
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [classTeachers, setClassTeachers] = useState<Teacher[]>([]);
    const [classStudents, setClassStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [clsRes, magRes] = await Promise.all([
                api.get('/classes'),
                api.get('/magazines')
            ]);
            setClasses(clsRes.data);
            setMagazines(magRes.data);
        } catch (error) {
            console.error('Error fetching class data:', error);
        }
    };

    const handleViewClass = async (cls: Class) => {
        setSelectedClass(cls);
        setLoading(true);
        try {
            const [tRes, sRes] = await Promise.all([api.get('/teachers'), api.get('/students')]);
            setClassTeachers(tRes.data.filter((t: Teacher) => t.class_id === cls.id));
            setClassStudents(sRes.data.filter((s: Student) => s.class_id === cls.id));
        } catch { setClassTeachers([]); setClassStudents([]); }
        finally { setLoading(false); }
    };

    const downloadClassPDF = () => {
        if (!selectedClass) return;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }) as any;
        const pageW = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, pageW, 24, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`EBD Digital — Classe: ${selectedClass.name}`, 14, 15);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageW - 14, 15, { align: 'right' });

        // Teachers table
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Professores', 14, 32);

        autoTable(doc, {
            startY: 36,
            head: [['Nome', 'Status']],
            body: classTeachers.map(t => [t.name, t.active ? 'Ativo' : 'Inativo']),
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 4 },
            headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 253, 244] },
            columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 30, halign: 'center' } },
        });

        const teacherEndY = (doc as any).lastAutoTable.finalY + 8;

        // Students table
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Alunos', 14, teacherEndY);

        autoTable(doc, {
            startY: teacherEndY + 4,
            head: [['#', 'Nome', 'Data de Nascimento', 'Status']],
            body: classStudents.map((s, i) => [i + 1, s.name, s.birth_date || '—', s.active ? 'Ativo' : 'Inativo']),
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 4 },
            headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 253, 244] },
            columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 2: { cellWidth: 45, halign: 'center' }, 3: { cellWidth: 25, halign: 'center' } },
        });

        doc.save(`classe-${selectedClass.name.replace(/\s+/g, '-')}.pdf`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/classes/${editingId}`, formData);
            } else {
                await api.post('/classes', formData);
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({ name: '', magazine_id: '' });
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao salvar classe');
        }
    };

    const handleEdit = (cls: Class) => {
        setEditingId(cls.id);
        setFormData({ name: cls.name, magazine_id: cls.magazine_id || '' });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Deseja realmente excluir esta classe?')) {
            try {
                await api.delete(`/classes/${id}`);
                if (selectedClass?.id === id) setSelectedClass(null);
                fetchData();
            } catch (err: any) {
                alert(err.response?.data?.error || 'Erro ao excluir. Verifique se há alunos ou professores vinculados.');
            }
        }
    };

    const handleToggleStatus = async (id: number) => {
        try {
            await api.patch(`/classes/${id}/toggle`);
            fetchData();
        } catch { alert('Erro ao alterar status da classe'); }
    };

    const filtered = classes.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.church_name?.toLowerCase().includes(search.toLowerCase())
    );

    // ── DETAIL VIEW ──────────────────────────────────────────────────────────
    if (selectedClass) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedClass(null)} className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-neutral-900">Classe: {selectedClass.name}</h1>
                        <p className="text-neutral-500 text-sm italic">Professores e alunos desta turma.</p>
                    </div>
                    <button onClick={downloadClassPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition-all shadow-lg shadow-emerald-100">
                        <Download size={16} />
                        Baixar Lista (PDF)
                    </button>
                    <span className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest ${selectedClass.active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {selectedClass.active ? 'Ativa' : 'Inativa'}
                    </span>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-12 h-12 rounded-xl bg-emerald-100/50 text-emerald-600 flex items-center justify-center relative z-10"><GraduationCap size={22} /></div>
                        <div className="relative z-10">
                            <p className="text-2xl font-bold text-neutral-900">{classTeachers.filter(t => t.active).length}</p>
                            <p className="text-xs text-neutral-500 uppercase tracking-widest">Professores ativos</p>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-12 h-12 rounded-xl bg-blue-100/50 text-blue-600 flex items-center justify-center relative z-10"><Users size={22} /></div>
                        <div className="relative z-10">
                            <p className="text-2xl font-bold text-neutral-900">{classStudents.filter(s => s.active).length}</p>
                            <p className="text-xs text-neutral-500 uppercase tracking-widest">Alunos ativos</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center text-neutral-400">Carregando...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Teachers */}
                        <div className="glass-panel rounded-3xl overflow-hidden relative">
                            <div className="px-6 py-4 border-b border-neutral-200/50 bg-emerald-500/5 flex items-center gap-3">
                                <GraduationCap size={16} className="text-emerald-600" />
                                <span className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Professores ({classTeachers.length})</span>
                            </div>
                            {classTeachers.length === 0 ? (
                                <div className="p-8 text-center text-neutral-400 text-sm">Nenhum professor vinculado.</div>
                            ) : (
                                <div className="divide-y divide-neutral-200/50">
                                    {classTeachers.map((t, idx) => (
                                        <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} className={`flex items-center gap-3 px-5 py-3 hover:bg-white/40 transition-colors ${!t.active ? 'opacity-50' : ''}`}>
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${t.active ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-400'}`}>
                                                {t.name.charAt(0)}
                                            </div>
                                            <span className="flex-1 text-sm font-medium text-neutral-800">{t.name}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase ${t.active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                                                {t.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Students */}
                        <div className="glass-panel rounded-3xl overflow-hidden relative">
                            <div className="px-6 py-4 border-b border-neutral-200/50 bg-blue-500/5 flex items-center gap-3">
                                <Users size={16} className="text-blue-600" />
                                <span className="text-sm font-bold text-blue-700 uppercase tracking-wider">Alunos ({classStudents.length})</span>
                            </div>
                            {classStudents.length === 0 ? (
                                <div className="p-8 text-center text-neutral-400 text-sm">Nenhum aluno vinculado a esta classe.</div>
                            ) : (
                                <div className="divide-y divide-neutral-200/50">
                                    {classStudents.map((s, idx) => (
                                        <motion.div key={s.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }} className={`flex items-center gap-3 px-5 py-3 hover:bg-white/40 transition-colors ${!s.active ? 'opacity-50' : ''}`}>
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${s.active ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-400'}`}>
                                                {s.name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-neutral-800">{s.name}</p>
                                                {s.birth_date && <p className="text-[11px] text-neutral-400 font-mono">{s.birth_date}</p>}
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase ${s.active ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-500'}`}>
                                                {s.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── LIST VIEW ─────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Classes</h1>
                    <p className="text-neutral-500 text-sm italic serif">Gerencie as turmas da Escola Bíblica Dominical.</p>
                </div>
                <button
                    onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', magazine_id: '' }); }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-100"
                >
                    <Plus size={18} />
                    Nova Classe
                </button>
            </div>

            <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="p-5 border-b border-neutral-200/50 flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex-1 w-full bg-white/50 px-4 py-2.5 rounded-xl flex items-center gap-2 border border-neutral-200/80 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all shadow-sm">
                        <Search size={18} className="text-neutral-400" />
                        <input type="text" placeholder="Buscar por nome..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/40 text-[10px] uppercase tracking-widest text-neutral-500 font-bold border-b border-neutral-200/50">
                                <th className="px-6 py-4">Classe</th>
                                {role === 'master' && <th className="px-6 py-4">Igreja</th>}
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200/50">
                            {filtered.map((cls) => (
                                <tr key={cls.id} className={`hover:bg-white/40 transition-colors group ${!cls.active ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cls.active ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-neutral-400'}`}>
                                                <BookOpen size={16} />
                                            </div>
                                            <p className="text-sm font-bold text-neutral-800">{cls.name}</p>
                                        </div>
                                        {cls.magazine_title && (
                                            <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                                                <BookOpen size={12} className="text-emerald-500" />
                                                Revista: {cls.magazine_title}
                                            </div>
                                        )}
                                    </td>
                                    {role === 'master' && <td className="px-6 py-4 text-xs text-neutral-500 font-mono">{cls.church_name}</td>}
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-widest ${cls.active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                            {cls.active ? 'Ativa' : 'Inativa'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleViewClass(cls)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Visualizar">
                                                <Eye size={16} />
                                            </button>
                                            <button onClick={() => handleToggleStatus(cls.id)} className={`p-2 rounded-lg ${cls.active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-400 hover:bg-red-50'}`}>
                                                {cls.active ? <Power size={16} /> : <PowerOff size={16} />}
                                            </button>
                                            <button onClick={() => handleEdit(cls)} className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(cls.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-neutral-400 text-sm">Nenhuma classe encontrada.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }} className="glass-panel rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-white/60">
                        <h2 className="text-xl font-bold text-neutral-900 mb-6">{editingId ? 'Editar Classe' : 'Nova Classe'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Nome da Classe</label>
                                <input required type="text" className="w-full px-4 py-3 bg-white/50 border border-neutral-200/80 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Vincular Revista (Opcional)</label>
                                <select
                                    className="w-full px-4 py-3 bg-white/50 border border-neutral-200/80 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm text-neutral-700"
                                    value={formData.magazine_id || ''}
                                    onChange={(e) => setFormData({ ...formData, magazine_id: e.target.value ? Number(e.target.value) : '' })}
                                >
                                    <option value="">Nenhuma revista (Todas as lições visíveis)</option>
                                    {magazines.map(m => (
                                        <option key={m.id} value={m.id}>{m.title} ({m.quarter}º Tri/{m.year})</option>
                                    ))}
                                </select>
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
