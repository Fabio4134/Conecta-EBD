import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { AttendanceRecord, Student, Lesson, Class, Magazine, Sector, Church } from '../types';
import { FileText, Download, Filter, BarChart2, Users, CheckCircle, XCircle, Building2, MapPin, Calendar, MessageCircle, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../utils';
import Pagination from './Pagination.js';

export default function Reports({ role }: { role: string }) {
  const isMasterOrSec = role === 'master' || role === 'secretary';
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [activeTab, setActiveTab] = useState<'records' | 'absences'>('records');
  const [minAbsences, setMinAbsences] = useState(2);

  const [filter, setFilter] = useState({
    sector: '',
    church: '',
    class: '',
    student: '',
    magazine: '',
    lesson: '',
    status: '', // 'present' | 'absent' | ''
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      const [aRes, sRes, lRes, cRes, mRes, secRes, chuRes] = await Promise.all([
        api.get('/attendance'),
        api.get('/students'),
        api.get('/lessons'),
        api.get('/classes'),
        api.get('/magazines'),
        isMasterOrSec ? api.get('/sectors').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        isMasterOrSec ? api.get('/churches').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);
      setAttendance(aRes.data || []);
      setStudents(sRes.data || []);
      setLessons(lRes.data || []);
      setClasses(cRes.data || []);
      setMagazines(mRes.data || []);
      setSectors(secRes.data || []);
      setChurches(chuRes.data || []);
    };
    fetchData();
  }, [role]);

  const availableChurches = useMemo(() => {
    if (!filter.sector) return churches;
    return churches.filter(c => c.sector_id === parseInt(filter.sector) || c.sector_name === filter.sector);
  }, [churches, filter.sector]);

  const availableClasses = useMemo(() => {
    if (filter.church) {
      return classes.filter(c => c.church_name === filter.church || c.church_id?.toString() === filter.church);
    }
    if (filter.sector) {
      return classes.filter(c => c.sector_id === parseInt(filter.sector) || c.sector_name === filter.sector);
    }
    return classes;
  }, [classes, filter.church, filter.sector]);

  const filteredData = useMemo(() => {
    return attendance.filter(a => {
      const matchesSector = filter.sector
        ? (a.sector_id === parseInt(filter.sector) || a.sector_name === filter.sector)
        : true;
      const matchesChurch = filter.church
        ? (a.church_name === filter.church || a.church_id?.toString() === filter.church)
        : true;
      const matchesStudent = filter.student === '' || a.student_id === parseInt(filter.student);
      const matchesLesson = filter.lesson === '' || a.lesson_id === parseInt(filter.lesson);

      // Student's class
      const student = students.find(s => s.id === a.student_id);
      const studentClassId = a.class_id || student?.class_id;
      const matchesClass = filter.class === '' || (studentClassId === parseInt(filter.class));

      // Lesson's magazine
      const lesson = lessons.find(l => l.id === a.lesson_id);
      const matchesMagazine = filter.magazine === '' || (lesson && lesson.magazine_id === parseInt(filter.magazine));

      // Presence status
      const matchesStatus = filter.status === ''
        ? true
        : filter.status === 'present'
        ? a.present
        : !a.present;

      // Dates
      const matchesStartDate = filter.startDate ? a.date >= filter.startDate : true;
      const matchesEndDate = filter.endDate ? a.date <= filter.endDate : true;

      return matchesSector && matchesChurch && matchesStudent && matchesLesson && matchesClass && matchesMagazine && matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [attendance, students, lessons, filter]);

  const presentCount = filteredData.filter(a => a.present).length;
  const absentCount = filteredData.filter(a => !a.present).length;
  const attendanceRate = filteredData.length > 0 ? Math.round((presentCount / filteredData.length) * 100) : 0;

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }) as any;
    const pageW = doc.internal.pageSize.getWidth();

    // Header bar
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageW, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Conecta EBD — Relatório Geral de Chamadas e Frequência', 14, 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}   |   Total Registros: ${filteredData.length}`, pageW - 14, 15, { align: 'right' });

    // Subtitle / Filters overview
    doc.setTextColor(70, 70, 70);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    const sectorInfo = filter.sector ? `Setor: ${sectors.find(s => s.id.toString() === filter.sector)?.name || filter.sector}` : 'Todos os Setores';
    const churchInfo = filter.church ? `Congregação: ${churches.find(c => c.id.toString() === filter.church)?.name || filter.church}` : 'Todas as Congregações';
    const classInfo = filter.class ? `Classe: ${classes.find(c => c.id.toString() === filter.class)?.name}` : 'Todas as Classes';
    const periodInfo = (filter.startDate || filter.endDate) ? `Período: ${filter.startDate ? formatDate(filter.startDate) : 'Início'} até ${filter.endDate ? formatDate(filter.endDate) : 'Hoje'}` : 'Todo o Histórico';
    doc.text(`Filtros: ${sectorInfo}  |  ${churchInfo}  |  ${classInfo}  |  ${periodInfo}`, 14, 30);
    doc.text(`Resumo: ${presentCount} Presenças (${attendanceRate}%)  •  ${absentCount} Ausências  •  Total de Linhas: ${filteredData.length}`, 14, 34);

    const tableData = filteredData.map((a, idx) => {
      const student = students.find(s => s.id === a.student_id);
      const studentClassId = a.class_id || student?.class_id;
      const cls = classes.find(c => c.id === studentClassId);
      return [
        (idx + 1).toString(),
        a.student_name || '—',
        cls?.name || '—',
        a.lesson_title || '—',
        formatDate(a.date),
        a.present ? 'Presente' : 'Ausente',
        ...(isMasterOrSec ? [a.church_name || '—', a.sector_name || '—'] : [])
      ];
    });

    const head = [['#', 'Aluno', 'Classe', 'Lição', 'Data', 'Status', ...(isMasterOrSec ? ['Congregação / Igreja', 'Setor'] : [])]];

    autoTable(doc, {
      startY: 38,
      head,
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 3.5, overflow: 'linebreak' },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { fontStyle: 'bold', cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 'auto' },
        4: { halign: 'center', cellWidth: 24 },
        5: { halign: 'center', cellWidth: 20 }
      },
      didParseCell: (data: any) => {
        if (data.column.index === 5 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'Presente' ? [5, 150, 105] : [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    doc.save('relatorio-frequencia-conecta-ebd.pdf');
  };

  // Ranking de Alunos com Faltas para Alerta Pastoral WhatsApp
  const absentRanking = useMemo(() => {
    const map: Record<number, {
      student: Student;
      absences: number;
      presences: number;
      total: number;
      className?: string;
      churchName?: string;
      sectorName?: string;
      lastDate?: string;
    }> = {};

    attendance.forEach(a => {
      if (!map[a.student_id]) {
        const stu = students.find(s => s.id === a.student_id);
        if (stu) {
          const cls = classes.find(c => c.id === stu.class_id);
          map[a.student_id] = {
            student: stu,
            absences: 0,
            presences: 0,
            total: 0,
            className: cls?.name || stu.class_name || 'Sem classe',
            churchName: stu.church_name || a.church_name,
            sectorName: stu.sector_name || a.sector_name,
            lastDate: a.date
          };
        }
      }
      if (map[a.student_id]) {
        map[a.student_id].total += 1;
        if (!a.present) {
          map[a.student_id].absences += 1;
          if (!map[a.student_id].lastDate || a.date > (map[a.student_id].lastDate || '')) {
            map[a.student_id].lastDate = a.date;
          }
        } else {
          map[a.student_id].presences += 1;
        }
      }
    });

    return Object.values(map)
      .filter(item => {
        if (item.absences < minAbsences) return false;
        if (filter.sector && item.student.sector_id?.toString() !== filter.sector && item.sectorName !== filter.sector) return false;
        if (filter.church && item.student.church_name !== filter.church && item.churchName !== filter.church) return false;
        if (filter.class && item.student.class_id?.toString() !== filter.class) return false;
        if (filter.student && item.student.id.toString() !== filter.student) return false;
        return true;
      })
      .sort((a, b) => b.absences - a.absences);
  }, [attendance, students, classes, minAbsences, filter]);

  const isAll = pageSize >= (activeTab === 'records' ? filteredData.length : absentRanking.length) || pageSize >= 9999;
  const paginatedData = isAll ? filteredData : filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedAbsences = isAll ? absentRanking : absentRanking.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Relatórios & Alertas</h1>
          <p className="text-neutral-500 text-sm italic serif">Frequência da EBD e acompanhamento pastoral de ausências.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {activeTab === 'records' && (
            <button
              onClick={downloadPDF}
              disabled={filteredData.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 font-semibold text-sm disabled:opacity-50"
            >
              <Download size={18} />
              Baixar Relatório (PDF)
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-neutral-100/80 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'records'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <FileText size={16} className={activeTab === 'records' ? 'text-emerald-600' : ''} />
          Histórico de Chamadas
        </button>
        <button
          onClick={() => setActiveTab('absences')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'absences'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <AlertTriangle size={16} className={activeTab === 'absences' ? 'text-amber-600' : ''} />
          Alerta de Faltas (WhatsApp)
          {absentRanking.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 font-bold">
              {absentRanking.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'records' ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl border border-neutral-100 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-600 flex items-center justify-center">
                <Users size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{filteredData.length}</p>
                <p className="text-xs text-neutral-400 uppercase font-bold tracking-widest">Total Chamadas</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-neutral-100 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
                <p className="text-xs text-neutral-400 uppercase font-bold tracking-widest">Presenças ({attendanceRate}%)</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-neutral-100 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center">
                <XCircle size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{absentCount}</p>
                <p className="text-xs text-neutral-400 uppercase font-bold tracking-widest">Ausências</p>
              </div>
            </div>
          </div>

          {/* Filtros Completos para Master, Secretário e Standard */}
          <div className="glass-panel p-6 rounded-3xl shadow-sm border border-neutral-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200/50 pb-3">
              <div className="flex items-center gap-2 text-neutral-600">
                <Filter size={18} className="text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider">Filtros Avançados de Chamadas</span>
              </div>
              {(filter.sector || filter.church || filter.class || filter.student || filter.magazine || filter.lesson || filter.status || filter.startDate || filter.endDate) && (
                <button
                  onClick={() => setFilter({ sector: '', church: '', class: '', student: '', magazine: '', lesson: '', status: '', startDate: '', endDate: '' })}
                  className="text-xs font-bold text-red-600 hover:text-red-700 underline transition-colors"
                >
                  Limpar Filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {isMasterOrSec && sectors.length > 0 && (
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Setor</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-white/70 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    value={filter.sector}
                    onChange={(e) => setFilter({ ...filter, sector: e.target.value, church: '', class: '' })}
                  >
                    <option value="">Todos os Setores</option>
                    {sectors.map(sec => <option key={sec.id} value={sec.id.toString()}>{sec.name}</option>)}
                  </select>
                </div>
              )}

              {isMasterOrSec && availableChurches.length > 0 && (
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Congregação</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-white/70 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    value={filter.church}
                    onChange={(e) => setFilter({ ...filter, church: e.target.value, class: '' })}
                  >
                    <option value="">Todas as Congregações</option>
                    {availableChurches.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Classe</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-white/70 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  value={filter.class}
                  onChange={(e) => setFilter({ ...filter, class: e.target.value })}
                >
                  <option value="">Todas as classes</option>
                  {availableClasses.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Revista</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-white/70 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  value={filter.magazine}
                  onChange={(e) => setFilter({ ...filter, magazine: e.target.value, lesson: '' })}
                >
                  <option value="">Todas as revistas</option>
                  {magazines.map(m => (
                    <option key={m.id} value={m.id.toString()}>
                      {m.title}{m.active === false ? ' (Concluída)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Lição</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-white/70 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  value={filter.lesson}
                  onChange={(e) => setFilter({ ...filter, lesson: e.target.value })}
                >
                  <option value="">Todas as lições</option>
                  {lessons.filter(l => filter.magazine ? l.magazine_id === parseInt(filter.magazine) : true).map(l => (
                    <option key={l.id} value={l.id.toString()}>{l.number}. {l.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Aluno</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-white/70 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  value={filter.student}
                  onChange={(e) => setFilter({ ...filter, student: e.target.value })}
                >
                  <option value="">Todos os alunos</option>
                  {students.map(s => <option key={s.id} value={s.id.toString()}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Status Presença</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-white/70 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                >
                  <option value="">Todos os status</option>
                  <option value="present">Somente Presentes</option>
                  <option value="absent">Somente Ausentes</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Data Inicial</label>
                <input
                  type="date"
                  className="w-full px-3.5 py-2.5 bg-white/70 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  value={filter.startDate}
                  onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Data Final</label>
                <input
                  type="date"
                  className="w-full px-3.5 py-2.5 bg-white/70 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  value={filter.endDate}
                  onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="glass-panel rounded-3xl shadow-sm border border-neutral-200/80 overflow-hidden">
            {filteredData.length === 0 ? (
              <div className="p-12 text-center text-neutral-400 text-sm">
                {attendance.length === 0 ? 'Nenhuma chamada registrada ainda.' : 'Nenhum registro encontrado com os filtros aplicados.'}
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/40 text-[10px] uppercase tracking-widest text-neutral-500 font-bold border-b border-neutral-200/50">
                        <th className="px-6 py-4">Aluno</th>
                        <th className="px-6 py-4">Classe</th>
                        <th className="px-6 py-4">Lição</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Data</th>
                        {isMasterOrSec && <th className="px-6 py-4">Congregação / Igreja</th>}
                        {isMasterOrSec && <th className="px-6 py-4">Setor</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/50">
                      {paginatedData.map((record) => {
                        const student = students.find(s => s.id === record.student_id);
                        const studentClassId = record.class_id || student?.class_id;
                        const cls = classes.find(c => c.id === studentClassId);
                        return (
                          <tr key={record.id} className="hover:bg-white/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold text-neutral-800">{record.student_name}</td>
                            <td className="px-6 py-4">
                              <span className="text-xs px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-lg font-semibold">{cls?.name || '—'}</span>
                            </td>
                            <td className="px-6 py-4 text-xs text-neutral-600 font-medium">{record.lesson_title || '—'}</td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-widest ${record.present ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {record.present ? 'Presente' : 'Ausente'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-neutral-500 font-mono">{formatDate(record.date)}</td>
                            {isMasterOrSec && <td className="px-6 py-4 text-xs text-neutral-600 font-medium">{record.church_name || '—'}</td>}
                            {isMasterOrSec && (
                              <td className="px-6 py-4 text-xs text-neutral-500">
                                {record.sector_name ? (
                                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold">{record.sector_name}</span>
                                ) : '—'}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredData.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[10, 25, 50, 100]}
                  itemName="registros"
                />
              </div>
            )}
          </div>
        </>
      ) : (
        /* ABA: ALERTA DE FALTAS & CONTATO PASTORAL WHATSAPP */
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900">Alerta de Frequência & Busca Ativa de Alunos</h2>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Identifique os alunos que acumularam faltas e envie uma mensagem fraterna e acolhedora no WhatsApp com 1 clique.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <label className="text-xs font-bold text-neutral-600 whitespace-nowrap">Mínimo de Faltas:</label>
              <select
                value={minAbsences}
                onChange={(e) => setMinAbsences(parseInt(e.target.value) || 1)}
                className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value={1}>1 ou mais faltas</option>
                <option value={2}>2 ou mais faltas</option>
                <option value={3}>3 ou mais faltas</option>
                <option value={5}>5 ou mais faltas</option>
              </select>
            </div>
          </div>

          <div className="glass-panel rounded-3xl shadow-sm border border-neutral-200/80 overflow-hidden">
            {absentRanking.length === 0 ? (
              <div className="p-12 text-center text-neutral-400 text-sm">
                Nenhum aluno atingiu o critério de {minAbsences} ou mais faltas com os filtros selecionados. Glória a Deus! 🎉
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/40 text-[10px] uppercase tracking-widest text-neutral-500 font-bold border-b border-neutral-200/50">
                        <th className="px-6 py-4">Aluno</th>
                        <th className="px-6 py-4">Classe</th>
                        {isMasterOrSec && <th className="px-6 py-4">Congregação</th>}
                        <th className="px-6 py-4">Total de Faltas</th>
                        <th className="px-6 py-4">Frequência</th>
                        <th className="px-6 py-4 text-right">Ação Pastoral</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/50">
                      {paginatedAbsences.map((item) => {
                        const { student, absences, presences, total, className, churchName } = item;
                        const freq = total > 0 ? Math.round((presences / total) * 100) : 0;
                        const phone = student.phone ? student.phone.replace(/\D/g, '') : '';
                        const message = `A Paz do Senhor, ${student.name}! Sentimos muito sua falta nas últimas aulas da Escola Bíblica Dominical (Classe: ${className || 'EBD'}). Você é muito precioso(a) para nós e estamos orando por sua vida. Esperamos você no próximo domingo! 🙏📖`;

                        return (
                          <tr key={student.id} className="hover:bg-white/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-neutral-800">{student.name}</p>
                              {student.phone && (
                                <p className="text-xs text-neutral-400 font-mono mt-0.5">{student.phone}</p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-lg font-semibold">{className}</span>
                            </td>
                            {isMasterOrSec && (
                              <td className="px-6 py-4 text-xs text-neutral-500 font-mono">{churchName || student.church_name || '—'}</td>
                            )}
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-red-100 text-red-700">
                                <XCircle size={14} />
                                {absences} {absences === 1 ? 'falta' : 'faltas'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-neutral-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${freq < 50 ? 'bg-red-500' : 'bg-amber-500'}`}
                                    style={{ width: `${freq}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-neutral-600">{freq}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {phone ? (
                                <a
                                  href={`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
                                  title="Enviar mensagem personalizada no WhatsApp"
                                >
                                  <MessageCircle size={15} />
                                  Enviar WhatsApp
                                </a>
                              ) : (
                                <span className="text-xs text-neutral-400 italic">Sem telefone</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalItems={absentRanking.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[10, 25, 50, 100]}
                  itemName="alunos com faltas"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
