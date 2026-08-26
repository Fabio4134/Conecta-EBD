import React, { useState, useEffect } from 'react';
import api from '../api';
import { ScheduleRecord, Teacher, Class, Lesson, Sector, Church } from '../types';
import {
  Calendar, Download, Search, Plus, Edit2, Trash2, X,
  ChevronDown, ChevronUp, Users, BookOpen, Clock, Layers
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../utils';

export default function TeacherSchedule({ role }: { role: string }) {
  const [schedule, setSchedule] = useState<ScheduleRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterSector, setFilterSector] = useState('');
  const [filterChurch, setFilterChurch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    teacher_id: '',
    class_id: '',
    lesson_id: '',
    date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [sRes, tRes, cRes, lRes, secRes, chuRes] = await Promise.all([
      api.get('/schedule'),
      api.get('/teachers'),
      api.get('/classes'),
      api.get('/lessons'),
      role === 'master' ? api.get('/sectors').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      role === 'master' ? api.get('/churches').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    ]);
    const sortedSchedule = (sRes.data || []).sort((a: ScheduleRecord, b: ScheduleRecord) =>
      (a.date || '').localeCompare(b.date || '')
    );
    setSchedule(sortedSchedule);
    const sortedT = (tRes.data || []).sort((a: Teacher, b: Teacher) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );
    setTeachers(sortedT);
    setClasses(cRes.data || []);
    setLessons(lRes.data || []);
    setSectors(secRes.data || []);
    setChurches(chuRes.data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/schedule/${editingId}`, formData);
      } else {
        await api.post('/schedule', formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ teacher_id: '', class_id: '', lesson_id: '', date: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar escala');
    }
  };

  const handleEdit = (item: ScheduleRecord) => {
    setEditingId(item.id);
    setFormData({
      teacher_id: item.teacher_id.toString(),
      class_id: item.class_id.toString(),
      lesson_id: item.lesson_id.toString(),
      date: item.date
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente excluir esta escala?')) {
      try {
        await api.delete(`/schedule/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Erro ao excluir escala');
      }
    }
  };

  const availableChurches = filterSector
    ? churches.filter(c => c.sector_id === parseInt(filterSector) || c.sector_name === filterSector)
    : churches;

  const availableClasses = filterChurch
    ? classes.filter(c => c.church_name === filterChurch || c.church_id?.toString() === filterChurch)
    : filterSector
    ? classes.filter(c => c.sector_id === parseInt(filterSector) || c.sector_name === filterSector)
    : classes;

  const filteredSchedule = React.useMemo(() => {
    return schedule
      .filter(s => {
        const matchesSector = filterSector
          ? (s.sector_id === parseInt(filterSector) || s.sector_name === filterSector)
          : true;
        const matchesChurch = filterChurch
          ? (s.church_name === filterChurch || s.church_id?.toString() === filterChurch)
          : true;
        const matchesClass = filterClass ? s.class_id === parseInt(filterClass) : true;
        const matchesDate = filterDate ? s.date === filterDate : true;
        return matchesSector && matchesChurch && matchesClass && matchesDate;
      })
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [schedule, filterSector, filterChurch, filterClass, filterDate]);

  const scheduleByClass = React.useMemo(() => {
    const grouped = filteredSchedule.reduce((acc, curr) => {
      const className = curr.class_name || 'Sem Classe';
      if (!acc[className]) acc[className] = [];
      acc[className].push(curr);
      return acc;
    }, {} as Record<string, ScheduleRecord[]>);

    Object.keys(grouped).forEach(className => {
      grouped[className].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    });

    return grouped;
  }, [filteredSchedule]);

  const toggleClass = (className: string) => {
    setExpandedClasses(prev => ({
      ...prev,
      [className]: !prev[className]
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    Object.keys(scheduleByClass).forEach(c => {
      all[c] = true;
    });
    setExpandedClasses(all);
  };

  const collapseAll = () => {
    setExpandedClasses({});
  };

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }) as any;
    const pageW = doc.internal.pageSize.getWidth();

    // Header bar
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageW, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.text('EBD Digital — Escala de Professores', 14, 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}   |   Total: ${filteredSchedule.length} registros`, pageW - 14, 15, { align: 'right' });

    // Class legend block
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    const sectorInfo = filterSector ? `Setor: ${sectors.find(s => s.id.toString() === filterSector)?.name || filterSector}` : 'Todos os Setores';
    const churchInfo = filterChurch ? `Congregação: ${churches.find(c => c.id.toString() === filterChurch)?.name || filterChurch}` : 'Todas as Congregações';
    const classInfo = filterClass ? `Classe: ${classes.find(c => c.id.toString() === filterClass)?.name}` : 'Todas as classes';
    doc.text(`Filtros: ${sectorInfo} | ${churchInfo} | ${classInfo}  |  Data: ${filterDate || 'Todas as datas'}`, 14, 29);

    const tableData = filteredSchedule.map(s => [
      formatDate(s.date),
      s.teacher_name || '',
      s.class_name || '',
      s.lesson_title || '',
      ...(role === 'master' ? [s.church_name || '—', s.sector_name || '—'] : [])
    ]);

    const head = [['Data', 'Professor', 'Classe', 'Lição', ...(role === 'master' ? ['Congregação / Igreja', 'Setor'] : [])]];

    autoTable(doc, {
      startY: 33,
      head,
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [237, 233, 254] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 26 },
        1: { fontStyle: 'bold', cellWidth: 50 },
        2: { cellWidth: 45 },
        3: { cellWidth: 'auto', fontStyle: 'italic' },
      },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 1) {
          data.cell.styles.textColor = [55, 48, 163];
        }
      }
    });

    doc.save('escala-professores-ebd.pdf');
  };

  const classNamesList = Object.keys(scheduleByClass);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Escala de Professores</h1>
          <p className="text-neutral-500 text-sm italic serif">Acompanhe a programação das classes e professores.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowModal(true); setEditingId(null); setFormData({ teacher_id: '', class_id: '', lesson_id: '', date: '' }); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-100 font-semibold text-sm"
          >
            <Plus size={18} />
            Nova Escala
          </button>
          <button
            onClick={downloadPDF}
            disabled={filteredSchedule.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-100 font-semibold text-sm disabled:opacity-50"
          >
            <Download size={18} />
            Baixar Escala
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/80 shadow-sm flex flex-col sm:flex-row items-center gap-3 flex-wrap">
        {role === 'master' && sectors.length > 0 && (
          <div className="w-full sm:w-48">
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Setor</label>
            <select
              className="w-full px-3.5 py-2.5 bg-white/70 border border-neutral-200/80 rounded-xl outline-none text-sm text-neutral-700 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
              value={filterSector}
              onChange={(e) => {
                setFilterSector(e.target.value);
                setFilterChurch('');
                setFilterClass('');
              }}
            >
              <option value="">Todos os Setores</option>
              {sectors.map(sec => (
                <option key={sec.id} value={sec.id.toString()}>{sec.name}</option>
              ))}
            </select>
          </div>
        )}

        {role === 'master' && availableChurches.length > 0 && (
          <div className="w-full sm:w-56">
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Congregação</label>
            <select
              className="w-full px-3.5 py-2.5 bg-white/70 border border-neutral-200/80 rounded-xl outline-none text-sm text-neutral-700 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
              value={filterChurch}
              onChange={(e) => {
                setFilterChurch(e.target.value);
                setFilterClass('');
              }}
            >
              <option value="">Todas as Congregações</option>
              {availableChurches.map(church => (
                <option key={church.id} value={church.name}>{church.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="w-full sm:flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Classe</label>
          <select
            className="w-full px-3.5 py-2.5 bg-white/70 border border-neutral-200/80 rounded-xl outline-none text-sm text-neutral-700 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="">Todas as Classes ({filteredSchedule.length} escalas)</option>
            {availableClasses.map(c => (
              <option key={c.id} value={c.id.toString()}>
                {c.name}{role === 'master' && !filterChurch && c.church_name ? ` (${c.church_name})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-44">
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Data</label>
          <input
            type="date"
            className="w-full px-3.5 py-2.5 bg-white/70 border border-neutral-200/80 rounded-xl outline-none text-sm text-neutral-700 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        {(filterSector || filterChurch || filterClass || filterDate) && (
          <button
            onClick={() => { setFilterSector(''); setFilterChurch(''); setFilterClass(''); setFilterDate(''); }}
            className="sm:self-end px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Controles de Expansão / Resumo */}
      {classNamesList.length > 0 && (
        <div className="flex items-center justify-between px-1 text-xs text-neutral-500 font-medium">
          <span>
            Exibindo <strong>{filteredSchedule.length}</strong> escalas divididas em <strong>{classNamesList.length}</strong> classes
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Expandir Todas
            </button>
            <span>•</span>
            <button
              onClick={collapseAll}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Recolher Todas
            </button>
          </div>
        </div>
      )}

      {/* Lista de Classes como Botões Clicáveis (Accordions) */}
      <div className="space-y-4">
        {classNamesList.map((className) => {
          const items = scheduleByClass[className];
          // Se o usuário filtrou especificamente por classe ou abriu manualmente
          const isExpanded = filterClass ? true : !!expandedClasses[className];
          const nextLesson = items[0];

          return (
            <div
              key={className}
              className="glass-panel rounded-3xl overflow-hidden border border-white/80 shadow-sm transition-all bg-white/80"
            >
              {/* Botão Clicável do Cabeçalho da Classe */}
              <button
                type="button"
                onClick={() => toggleClass(className)}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-indigo-50/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
                    <Users size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-neutral-900 group-hover:text-indigo-700 transition-colors truncate">
                        {className}
                      </h2>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-full">
                        {items.length} {items.length === 1 ? 'aula' : 'aulas'}
                      </span>
                    </div>

                    {nextLesson && (
                      <p className="text-xs text-neutral-500 mt-0.5 truncate">
                        Próxima aula: <strong className="text-neutral-700 font-semibold">{formatDate(nextLesson.date)}</strong> • {nextLesson.teacher_name} ({nextLesson.lesson_title})
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden sm:inline-block text-xs font-bold text-indigo-600 bg-indigo-50 group-hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200/60 transition-colors">
                    {isExpanded ? 'Ocultar Escala' : 'Abrir Escala'}
                  </span>
                  <div className={`w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-all ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown size={18} />
                  </div>
                </div>
              </button>

              {/* Tabela de Escalas Expansível */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="border-t border-neutral-200/60 overflow-hidden"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-neutral-50/80 text-[10px] uppercase tracking-widest text-neutral-500 font-bold border-b border-neutral-200/50">
                            <th className="px-6 py-3.5">Data</th>
                            <th className="px-6 py-3.5">Professor Responsável</th>
                            <th className="px-6 py-3.5">Lição Programada</th>
                            {role === 'master' && <th className="px-6 py-3.5">Igreja</th>}
                            <th className="px-6 py-3.5 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200/50">
                          {items.map((item) => (
                            <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                              <td className="px-6 py-4 text-sm font-mono font-bold text-indigo-700 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Calendar size={14} className="text-indigo-500" />
                                  {formatDate(item.date)}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-neutral-800">
                                {item.teacher_name}
                              </td>
                              <td className="px-6 py-4 text-sm text-neutral-600 italic">
                                {item.lesson_title}
                              </td>
                              {role === 'master' && <td className="px-6 py-4 text-xs text-neutral-500 font-mono">{item.church_name}</td>}
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Editar Escala"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir Escala"
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {schedule.length === 0 && (
        <div className="glass-panel rounded-3xl p-12 text-center text-neutral-400 italic border border-neutral-100">
          Nenhuma escala cadastrada no momento. Clique em "+ Nova Escala" para começar.
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900">{editingId ? 'Editar Escala' : 'Nova Escala'}</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Professor</label>
                <select required className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none text-sm" value={formData.teacher_id} onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}>
                  <option value="">Selecione o professor</option>
                  {[...teachers].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Classe</label>
                <select required className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none text-sm" value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}>
                  <option value="">Selecione a classe</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Lição</label>
                <select required className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none text-sm" value={formData.lesson_id} onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}>
                  <option value="">Selecione a lição</option>
                  {lessons.map(l => <option key={l.id} value={l.id}>{l.number}. {l.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Data</label>
                <input required type="date" className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none text-sm" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all font-semibold text-sm">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 transition-all">Salvar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
