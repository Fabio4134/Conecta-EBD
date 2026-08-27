import React, { useState, useEffect } from 'react';
import api from '../api.js';
import { Class, Teacher, Student, Magazine, Sector, Church } from '../types.js';
import {
    Plus, Trash2, Search, Edit2, BookOpen, Power, PowerOff, Eye, ArrowLeft,
    Users, Download, GraduationCap, X, Share2, Copy, Check, ExternalLink, MessageCircle,
    Building2, MapPin
} from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from './Pagination.js';

export default function ClassList({ role }: { role: string }) {
    const isMasterOrSec = role === 'master' || role === 'secretary';
    const [classes, setClasses] = useState<Class[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [churches, setChurches] = useState<Church[]>([]);
    const [search, setSearch] = useState('');
    const [filterSector, setFilterSector] = useState('');
    const [filterChurch, setFilterChurch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<{ name: string; magazine_id: number | string; church_id?: string; sector_id?: string }>({ name: '', magazine_id: '', church_id: '', sector_id: '' });
    const [magazines, setMagazines] = useState<Magazine[]>([]);

    // Share link modal
    const [shareModalClass, setShareModalClass] = useState<Class | null>(null);
    const [copied, setCopied] = useState(false);

    // Detail view
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [classTeachers, setClassTeachers] = useState<Teacher[]>([]);
    const [classStudents, setClassStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [clsRes, magRes, secRes, chuRes] = await Promise.all([
                api.get('/classes'),
                api.get('/magazines'),
                isMasterOrSec ? api.get('/sectors').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                isMasterOrSec ? api.get('/churches').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
            ]);
            setClasses(clsRes.data || []);
            setMagazines(magRes.data || []);
            setSectors(secRes.data || []);
            setChurches(chuRes.data || []);
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

        // Students table
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        const teachersTableFinalY = (doc as any).lastAutoTable.finalY || 60;
        doc.text('Alunos Matriculados', 14, teachersTableFinalY + 10);

        autoTable(doc, {
            startY: teachersTableFinalY + 14,
            head: [['#', 'Nome', 'Telefone', 'Status']],
            body: classStudents.map((s, index) => [
                (index + 1).toString(),
                s.name,
                s.phone || 'Não informado',
                s.active ? 'Ativo' : 'Inativo'
            ]),
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3.5 },
            headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 253, 244] },
            columnStyles: {
                0: { cellWidth: 12, halign: 'center' },
                1: { cellWidth: 'auto', fontStyle: 'bold' },
                2: { cellWidth: 45 },
                3: { cellWidth: 25, halign: 'center' }
            },
        });

        doc.save(`classe-${selectedClass.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                name: formData.name.trim(),
                magazine_id: formData.magazine_id ? Number(formData.magazine_id) : null
            };
            if (isMasterOrSec && formData.church_id) {
                payload.church_id = parseInt(formData.church_id);
            }

            if (editingId) {
                await api.put(`/classes/${editingId}`, payload);
            } else {
                await api.post('/classes', payload);
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({ name: '', magazine_id: '', church_id: '', sector_id: '' });
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao salvar classe');
        }
    };

    const handleEdit = (cls: Class) => {
        setEditingId(cls.id);
        setFormData({
            name: cls.name,
            magazine_id: cls.magazine_id || '',
            church_id: cls.church_id ? cls.church_id.toString() : '',
            sector_id: cls.sector_id ? cls.sector_id.toString() : ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (role === 'secretary') {
            return alert('Secretários não possuem permissão para excluir registros.');
        }
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

    const availableChurches = filterSector
        ? churches.filter(c => c.sector_id === parseInt(filterSector) || c.sector_name === filterSector)
        : churches;

    const filtered = classes.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.church_name?.toLowerCase().includes(search.toLowerCase()) ||
            c.sector_name?.toLowerCase().includes(search.toLowerCase());
        const matchesSector = filterSector
            ? (c.sector_id === parseInt(filterSector) || c.sector_name === filterSector)
            : true;
        const matchesChurch = filterChurch
            ? (c.church_id?.toString() === filterChurch || c.church_name === filterChurch)
            : true;
        return matchesSearch && matchesSector && matchesChurch;
    });

    const isAll = pageSize >= filtered.length || pageSize >= 9999;
    const paginatedClasses = isAll ? filtered : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // ── DETAIL VIEW ──────────────────────────────────────────────────────────
    if (selectedClass) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedClass(null)} className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500 transition-colors" aria-label="Voltar">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 truncate">Classe: {selectedClass.name}</h1>
                            <p className="text-neutral-500 text-xs sm:text-sm italic truncate">Professores e alunos desta turma.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <button
                            onClick={() => {
                                setShareModalClass(selectedClass);
                                setCopied(false);
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-all shadow-sm"
                            title="Compartilhar link de autocadastro da classe"
                        >
                            <Share2 size={16} />
                            Link da Classe
                        </button>
                        <button onClick={downloadClassPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-emerald-100">
                            <Download size={16} />
                            Baixar Lista (PDF)
                        </button>
                        <span className={`text-[10px] px-2.5 py-1.5 rounded-lg font-bold uppercase tracking-widest ${selectedClass.active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {selectedClass.active ? 'Ativa' : 'Inativa'}
                        </span>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-neutral-900">{classTeachers.length}</p>
                            <p className="text-xs text-neutral-500 font-medium">Professores Vinculados</p>
                        </div>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-neutral-900">{classStudents.length}</p>
                            <p className="text-xs text-neutral-500 font-medium">Alunos Matriculados</p>
                        </div>
                    </div>
                </div>

                {/* Teachers and Students Lists */}
                {loading ? (
                    <div className="p-12 text-center text-neutral-400">Carregando dados da turma...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Teachers */}
                        <div className="glass-panel rounded-3xl overflow-hidden">
                            <div className="p-5 border-b border-neutral-200/50 flex items-center justify-between">
                                <h2 className="font-bold text-neutral-800 flex items-center gap-2">
                                    <Users size={18} className="text-emerald-600" />
                                    Professores ({classTeachers.length})
                                </h2>
                            </div>
                            {classTeachers.length === 0 ? (
                                <div className="p-8 text-center text-neutral-400 text-sm">Nenhum professor vinculado a esta classe.</div>
                            ) : (
                                <div className="divide-y divide-neutral-200/50">
                                    {classTeachers.map((t, idx) => (
                                        <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} className={`flex items-center gap-3 px-5 py-3 hover:bg-white/40 transition-colors ${!t.active ? 'opacity-50' : ''}`}>
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${t.active ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-400'}`}>
                                                {t.name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-neutral-800">{t.name}</p>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase ${t.active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                                                {t.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Students */}
                        <div className="glass-panel rounded-3xl overflow-hidden">
                            <div className="p-5 border-b border-neutral-200/50 flex items-center justify-between">
                                <h2 className="font-bold text-neutral-800 flex items-center gap-2">
                                    <GraduationCap size={18} className="text-blue-600" />
                                    Alunos ({classStudents.length})
                                </h2>
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

    const downloadAllClassesPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }) as any;
        const pageW = doc.internal.pageSize.getWidth();

        // Header bar
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, pageW, 24, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Conecta EBD — Relação Geral de Classes', 14, 15);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageW - 14, 15, { align: 'right' });

        // Summary Metrics block
        const activeCount = filtered.filter(c => c.active).length;
        const inactiveCount = filtered.length - activeCount;
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        const sectorLabel = filterSector ? `Setor: ${sectors.find(s => s.id.toString() === filterSector)?.name || filterSector}` : 'Todos os Setores';
        const churchLabel = filterChurch ? `Congregação: ${churches.find(c => c.id.toString() === filterChurch)?.name || filterChurch}` : 'Todas as Congregações';
        doc.text(`Filtros: ${sectorLabel} | ${churchLabel}  —  Resumo: ${filtered.length} Classes (${activeCount} Ativas, ${inactiveCount} Inativas)`, 14, 30);

        const tableData = filtered.map((c, index) => [
            (index + 1).toString(),
            c.name,
            c.magazine_title || 'Nenhuma revista vinculada',
            c.active ? 'Ativa' : 'Inativa',
            ...(isMasterOrSec ? [c.church_name || '—', c.sector_name || '—'] : [])
        ]);

        const head = [['#', 'Nome da Classe', 'Revista Vinculada', 'Status', ...(isMasterOrSec ? ['Congregação / Igreja', 'Setor'] : [])]];

        autoTable(doc, {
            startY: 34,
            head,
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
            headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', halign: 'center' },
            alternateRowStyles: { fillColor: [240, 253, 244] },
            columnStyles: {
                0: { halign: 'center', cellWidth: 12 },
                1: { fontStyle: 'bold', cellWidth: 55 },
                2: { cellWidth: 'auto' },
                3: { halign: 'center', cellWidth: 22 }
            }
        });

        doc.save('relatorio-classes-ebd.pdf');
    };

    // ── LIST VIEW ─────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Classes</h1>
                    <p className="text-neutral-500 text-sm italic serif">Gerencie as turmas da Escola Bíblica Dominical.</p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
                    <button
                        onClick={downloadAllClassesPDF}
                        disabled={filtered.length === 0}
                        className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 font-semibold text-sm disabled:opacity-50"
                        title="Baixar lista completa de classes em PDF"
                    >
                        <Download size={18} />
                        Baixar Classes (PDF)
                    </button>
                    <button
                        onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', magazine_id: '' }); }}
                        className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100 font-semibold text-sm"
                    >
                        <Plus size={18} />
                        Nova Classe
                    </button>
                </div>
            </div>

            <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="p-5 border-b border-neutral-200/50 flex flex-col sm:flex-row items-center gap-3 flex-wrap">
                    <div className="flex-1 w-full bg-white/50 px-4 py-2.5 rounded-xl flex items-center gap-2 border border-neutral-200/80 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all shadow-sm min-w-[220px]">
                        <Search size={18} className="text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Buscar por classe, congregação..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    {isMasterOrSec && sectors.length > 0 && (
                        <select
                            className="w-full sm:w-auto px-4 py-2.5 bg-white/50 border border-neutral-200/80 rounded-xl outline-none text-sm text-neutral-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm hover:bg-white/80"
                            value={filterSector}
                            onChange={(e) => {
                                setFilterSector(e.target.value);
                                setFilterChurch('');
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">Todos os Setores</option>
                            {sectors.map(sec => (
                                <option key={sec.id} value={sec.id.toString()}>{sec.name}</option>
                            ))}
                        </select>
                    )}

                    {isMasterOrSec && availableChurches.length > 0 && (
                        <select
                            className="w-full sm:w-auto px-4 py-2.5 bg-white/50 border border-neutral-200/80 rounded-xl outline-none text-sm text-neutral-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm hover:bg-white/80"
                            value={filterChurch}
                            onChange={(e) => {
                                setFilterChurch(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">Todas as Congregações</option>
                            {availableChurches.map(church => (
                                <option key={church.id} value={church.name}>{church.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/40 text-[10px] uppercase tracking-widest text-neutral-500 font-bold border-b border-neutral-200/50">
                                <th className="px-6 py-4">Classe</th>
                                {isMasterOrSec && <th className="px-6 py-4">Igreja</th>}
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200/50">
                            {paginatedClasses.map((cls) => (
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
                                    {isMasterOrSec && <td className="px-6 py-4 text-xs text-neutral-500 font-mono">{cls.church_name}</td>}
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-widest ${cls.active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                            {cls.active ? 'Ativa' : 'Inativa'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setShareModalClass(cls);
                                                    setCopied(false);
                                                }}
                                                className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                title="Link de Autocadastro para Alunos"
                                            >
                                                <Share2 size={16} />
                                            </button>
                                            <button onClick={() => handleViewClass(cls)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Visualizar">
                                                <Eye size={16} />
                                            </button>
                                            <button onClick={() => handleToggleStatus(cls.id)} className={`p-2 rounded-lg ${cls.active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-400 hover:bg-red-50'}`}>
                                                {cls.active ? <Power size={16} /> : <PowerOff size={16} />}
                                            </button>
                                            <button onClick={() => handleEdit(cls)} className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                                <Edit2 size={16} />
                                            </button>
                                            {role !== 'secretary' && (
                                                <button onClick={() => handleDelete(cls.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
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

                <Pagination
                    currentPage={currentPage}
                    totalItems={filtered.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    itemName="classes"
                />
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-100"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold text-neutral-900">
                                {editingId ? 'Editar Classe' : 'Nova Classe'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                                    Nome da Classe *
                                </label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm font-medium text-neutral-800"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Jovens - Herdeiros de Deus"
                                />
                            </div>

                            {isMasterOrSec && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                    <div>
                                        <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">
                                            Setor
                                        </label>
                                        <select
                                            className="w-full px-3 py-2 bg-white border border-emerald-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none text-xs text-neutral-700"
                                            value={formData.sector_id}
                                            onChange={(e) => {
                                                const secId = e.target.value;
                                                setFormData({ ...formData, sector_id: secId, church_id: '' });
                                            }}
                                        >
                                            <option value="">Todos os setores</option>
                                            {sectors.map(s => <option key={s.id} value={s.id.toString()}>{s.name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">
                                            Congregação / Igreja *
                                        </label>
                                        <select
                                            required={isMasterOrSec}
                                            className="w-full px-3 py-2 bg-white border border-emerald-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none text-xs text-neutral-700"
                                            value={formData.church_id}
                                            onChange={(e) => {
                                                const chuId = e.target.value;
                                                const selectedChu = churches.find(c => c.id.toString() === chuId);
                                                setFormData({
                                                    ...formData,
                                                    church_id: chuId,
                                                    sector_id: selectedChu?.sector_id?.toString() || formData.sector_id
                                                });
                                            }}
                                        >
                                            <option value="">Selecione a congregação</option>
                                            {(formData.sector_id
                                                ? churches.filter(c => c.sector_id?.toString() === formData.sector_id)
                                                : churches
                                            ).map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                                    Vincular Revista (Opcional)
                                </label>
                                <select
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm text-neutral-700"
                                    value={formData.magazine_id || ''}
                                    onChange={(e) => setFormData({ ...formData, magazine_id: e.target.value ? Number(e.target.value) : '' })}
                                >
                                    <option value="">Nenhuma revista (Todas as lições visíveis)</option>
                                    {magazines.filter(m => m.active !== false).map(m => (
                                        <option key={m.id} value={m.id}>{m.title} ({m.quarter} • {m.year})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors font-semibold text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
                                >
                                    {editingId ? 'Salvar Alterações' : 'Criar Classe'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {shareModalClass && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-neutral-100 space-y-5"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                    <Share2 size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-neutral-900">Link de Autocadastro</h2>
                                    <p className="text-xs text-neutral-500 font-medium">Classe: {shareModalClass.name}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShareModalClass(null)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-sm text-neutral-600 leading-relaxed">
                            Envie este link para os alunos pelo WhatsApp ou redes sociais. Eles poderão preencher o próprio cadastro diretamente pelo celular ou computador, sem necessidade de login.
                        </p>

                        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                className="bg-transparent border-none text-xs font-mono text-neutral-700 flex-1 outline-none select-all"
                                value={`${window.location.origin}/?cadastro=${shareModalClass.id}`}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/?cadastro=${shareModalClass.id}`);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2500);
                                }}
                                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                                    copied
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm'
                                }`}
                            >
                                {copied ? (
                                    <>
                                        <Check size={14} />
                                        Copiado!
                                    </>
                                ) : (
                                    <>
                                        <Copy size={14} />
                                        Copiar Link
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                            <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                    `Olá! Faça sua matrícula na classe *${shareModalClass.name}* da Escola Bíblica Dominical (EBD) através do link:\n\n${window.location.origin}/?cadastro=${shareModalClass.id}`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={18} />
                                Compartilhar no WhatsApp
                            </a>
                            <a
                                href={`/?cadastro=${shareModalClass.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-3 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5"
                            >
                                <ExternalLink size={16} />
                                Abrir Link
                            </a>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
