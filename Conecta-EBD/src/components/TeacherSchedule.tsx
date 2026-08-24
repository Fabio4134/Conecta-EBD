import React, { useState, useEffect } from 'react';
import api from '../api';
import { ScheduleRecord, Teacher, Class, Lesson } from '../types';
import { Calendar, Download, Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion } from 'motion/react';
import { formatDate } from '../utils';

export default function TeacherSchedule({ role }: { role: string }) {
  const [schedule, setSchedule] = useState<ScheduleRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterClass, setFilterClass] = useState('');
  const [filterDate, setFilterDate] = useState('');
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
    const [sRes, tRes, cRes, lRes] = await Promise.all([
      api.get('/schedule'),
      api.get('/teachers'),
      api.get('/classes'),
      api.get('/lessons')
    ]);
    setSchedule(sRes.data);
    setTeachers(tRes.data);
    setClasses(cRes.data);
    setLessons(lRes.data);
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

  const filteredSchedule = schedule.filter(s => {
    const matchesClass = filterClass ? s.class_id === parseInt(filterClass) : true;
    const matchesDate = filterDate ? s.date === filterDate : true;
    return matchesClass && matchesDate;
  });

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
    doc.text(`Filtros ativos: ${filterClass ? classes.find(c => c.id.toString() === filterClass)?.name : 'Todas as classes'}  |  ${filterDate || 'Todas as datas'}`, 14, 29);

    const tableData = filteredSchedule.map(s => [
      formatDate(s.date),
      s.teacher_name || '',
      s.class_name || '',
      s.lesson_title || '',
      ...(role === 'master' ? [s.church_name || ''] : [])
    ]);

    const head = [['Data', 'Professor', 'Classe', 'Lição', ...(role === 'master' ? ['Igreja'] : [])]];

    autoTable(doc, {
      startY: 33,
      head,
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [237, 233, 254] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 28 },
        1: { fontStyle: 'bold', cellWidth: 55 },
        2: { cellWidth: 50 },
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

  const scheduleByClass = filteredSchedule.reduce((acc, curr) => {
    const className = curr.class_name || 'Sem Classe';
    if (!acc[className]) acc[className] = [];
    acc[className].push(curr);
    return acc;
  }, {} as Record<string, ScheduleRecord[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Escala de Professores</h1>
          <p className="text-neutral-500 text-sm italic serif">Acompanhe a programação das classes e professores.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowModal(true); setEditingId(null); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-100"
          >
            <Plus size={18} />
            Nova Escala
          </button>
          <button
            onClick={downloadPDF}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-100"
          >
            <Download size={18} />
            Baixar Escala
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Filtrar por Classe</label>
          <select
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg outline-none text-sm"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="">Todas as Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Filtrar por Data</label>
          <input
            type="date"
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg outline-none text-sm"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setFilterClass(''); setFilterDate(''); }}
          className="self-end px-4 py-2 text-sm font-bold text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          Limpar Filtros
        </button>
      </div>

      {Object.entries(scheduleByClass).map(([className, items]) => (
        <div key={className} className="space-y-4">
          <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
            <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
            {className}
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Professor</th>
                    <th className="px-6 py-4">Lição</th>
                    {role === 'master' && <th className="px-6 py-4">Igreja</th>}
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-mono text-neutral-500">{formatDate(item.date)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-neutral-800">{item.teacher_name}</td>
                      <td className="px-6 py-4 text-sm text-neutral-500 italic">{item.lesson_title}</td>
                      {role === 'master' && <td className="px-6 py-4 text-sm text-neutral-500">{item.church_name}</td>}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(item)} className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
        </div>
      ))}

      {schedule.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center text-neutral-400 italic border border-neutral-100">
          Nenhuma escala cadastrada.
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-neutral-900 mb-6">{editingId ? 'Editar Escala' : 'Nova Escala'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Professor</label>
                <select required className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none" value={formData.teacher_id} onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}>
                  <option value="">Selecione</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Classe</label>
                <select required className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none" value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}>
                  <option value="">Selecione</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Lição</label>
                <select required className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none" value={formData.lesson_id} onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}>
                  <option value="">Selecione</option>
                  {lessons.map(l => <option key={l.id} value={l.id}>{l.number}. {l.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Data</label>
                <input required type="date" className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
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

