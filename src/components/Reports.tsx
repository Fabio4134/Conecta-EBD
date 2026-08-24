import React, { useState, useEffect } from 'react';
import api from '../api';
import { AttendanceRecord, Student, Lesson, Class, Magazine } from '../types';
import { FileText, Download, Filter, BarChart2, Users, CheckCircle, XCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../utils';

export default function Reports({ role }: { role: string }) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [filter, setFilter] = useState({ student: '', lesson: '', church: '', class: '', magazine: '' });

  useEffect(() => {
    const fetchData = async () => {
      const [aRes, sRes, lRes, cRes, mRes] = await Promise.all([
        api.get('/attendance'),
        api.get('/students'),
        api.get('/lessons'),
        api.get('/classes'),
        api.get('/magazines')
      ]);
      setAttendance(aRes.data);
      setStudents(sRes.data);
      setLessons(lRes.data);
      setClasses(cRes.data);
      setMagazines(mRes.data);
    };
    fetchData();
  }, []);

  const filteredData = attendance.filter(a => {
    const matchesStudent = filter.student === '' || a.student_id === parseInt(filter.student);
    const matchesLesson = filter.lesson === '' || a.lesson_id === parseInt(filter.lesson);
    const matchesChurch = filter.church === '' || a.church_name?.toLowerCase().includes(filter.church.toLowerCase());
    // find student's class_id
    const student = students.find(s => s.id === a.student_id);
    const matchesClass = filter.class === '' || (student && student.class_id === parseInt(filter.class));
    // find lesson's magazine
    const lesson = lessons.find(l => l.id === a.lesson_id);
    const matchesMagazine = filter.magazine === '' || (lesson && lesson.magazine_id === parseInt(filter.magazine));
    return matchesStudent && matchesLesson && matchesChurch && matchesClass && matchesMagazine;
  });

  const presentCount = filteredData.filter(a => a.present).length;
  const absentCount = filteredData.filter(a => !a.present).length;
  const attendanceRate = filteredData.length > 0 ? Math.round((presentCount / filteredData.length) * 100) : 0;

  const downloadPDF = () => {
    const doc = new jsPDF('landscape') as any;
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('EBD Digital — Relatório de Frequência', 14, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}   |   Total: ${filteredData.length}   |   Taxa de presença: ${attendanceRate}%`, pageW - 14, 14, { align: 'right' });

    const tableData = filteredData.map(a => {
      const student = students.find(s => s.id === a.student_id);
      const cls = classes.find(c => c.id === student?.class_id);
      return [
        a.student_name || '',
        cls?.name || '',
        a.lesson_title || '',
        a.present ? 'Presente' : 'Ausente',
        formatDate(a.date),
        ...(role === 'master' ? [a.church_name || ''] : [])
      ];
    });

    const head = [['Aluno', 'Classe', 'Lição', 'Status', 'Data', ...(role === 'master' ? ['Igreja'] : [])]];

    autoTable(doc, {
      startY: 28,
      head,
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      didParseCell: (data: any) => {
        if (data.column.index === 3 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'Presente' ? [5, 150, 105] : [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    doc.save('relatorio-frequencia-ebd.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Relatórios</h1>
          <p className="text-neutral-500 text-sm italic serif">Frequência e desempenho da Escola Bíblica.</p>
        </div>
        <button
          onClick={downloadPDF}
          className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg"
        >
          <Download size={18} />
          Baixar PDF
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-neutral-100 text-neutral-600 flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{filteredData.length}</p>
            <p className="text-xs text-neutral-400 uppercase tracking-widest">Total registros</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
            <p className="text-xs text-neutral-400 uppercase tracking-widest">Presenças ({attendanceRate}%)</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-100 text-red-500 flex items-center justify-center">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">{absentCount}</p>
            <p className="text-xs text-neutral-400 uppercase tracking-widest">Ausências</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
        <div className="flex items-center gap-2 mb-4 text-neutral-400">
          <Filter size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Aluno</label>
            <select className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" value={filter.student} onChange={(e) => setFilter({ ...filter, student: e.target.value })}>
              <option value="">Todos os alunos</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Classe</label>
            <select className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" value={filter.class} onChange={(e) => setFilter({ ...filter, class: e.target.value })}>
              <option value="">Todas as classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Revista</label>
            <select className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" value={filter.magazine} onChange={(e) => setFilter({ ...filter, magazine: e.target.value })}>
              <option value="">Todas as revistas</option>
              {magazines.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Lição</label>
            <select className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" value={filter.lesson} onChange={(e) => setFilter({ ...filter, lesson: e.target.value })}>
              <option value="">Todas as lições</option>
              {lessons.filter(l => filter.magazine ? l.magazine_id === parseInt(filter.magazine) : true).map(l => <option key={l.id} value={l.id}>{l.number}. {l.title}</option>)}
            </select>
          </div>
          {role === 'master' && (
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Igreja</label>
              <input type="text" placeholder="Filtrar por igreja..." className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" value={filter.church} onChange={(e) => setFilter({ ...filter, church: e.target.value })} />
            </div>
          )}
        </div>
        {(filter.student || filter.lesson || filter.church || filter.class || filter.magazine) && (
          <button onClick={() => setFilter({ student: '', lesson: '', church: '', class: '', magazine: '' })} className="mt-3 text-xs text-neutral-400 hover:text-neutral-600 font-bold underline transition-colors">
            Limpar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-sm">
            {attendance.length === 0 ? 'Nenhuma chamada registrada ainda. Realize uma chamada na seção Chamada.' : 'Nenhum registro encontrado com os filtros aplicados.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                  <th className="px-6 py-4">Aluno</th>
                  <th className="px-6 py-4">Classe</th>
                  <th className="px-6 py-4">Lição</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Data</th>
                  {role === 'master' && <th className="px-6 py-4">Igreja</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredData.map((record) => {
                  const student = students.find(s => s.id === record.student_id);
                  const cls = classes.find(c => c.id === student?.class_id);
                  return (
                    <tr key={record.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-neutral-800">{record.student_name}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded-lg font-medium">{cls?.name || '—'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-500">{record.lesson_title}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-widest ${record.present ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {record.present ? 'Presente' : 'Ausente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-500 font-mono">{formatDate(record.date)}</td>
                      {role === 'master' && <td className="px-6 py-4 text-sm text-neutral-500">{record.church_name}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
