import React, { useState, useEffect } from 'react';
import api from '../api';
import { Student, Lesson, AttendanceRecord, Class, Magazine } from '../types';
import { Check, X, Calendar, BookOpen, Save, Trash2, Search, Layers, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate } from '../utils';

export default function Attendance({ role }: { role: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedMagazine, setSelectedMagazine] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [attendance, setAttendance] = useState<Record<number, boolean>>({});
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [alreadyExists, setAlreadyExists] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedLesson && selectedClassId) {
      checkExistingAttendance();
    } else {
      setAlreadyExists(false);
    }
  }, [selectedLesson, selectedClassId]);

  const fetchData = async () => {
    const [sRes, lRes, mRes, hRes, cRes] = await Promise.all([
      api.get('/students'),
      api.get('/lessons'),
      api.get('/magazines'),
      api.get('/attendance'),
      api.get('/classes')
    ]);
    setStudents(sRes.data);
    setLessons(lRes.data);
    setMagazines(mRes.data);
    setHistory(hRes.data);
    setClasses(cRes.data);
  };

  const checkExistingAttendance = async () => {
    const date = new Date().toISOString().split('T')[0];
    const res = await api.get(`/attendance/check?lesson_id=${selectedLesson}&class_id=${selectedClassId}&date=${date}`);
    setAlreadyExists(res.data.exists);
  };

  const handleToggle = (studentId: number) => {
    if (alreadyExists && role !== 'master') return;
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleSubmit = async () => {
    if (!selectedLesson || !selectedClassId) return alert('Selecione uma lição e uma classe');
    if (alreadyExists && role !== 'master') return alert('Esta chamada já foi realizada e apenas usuários Master podem modificá-la.');

    setLoading(true);
    try {
      const date = new Date().toISOString().split('T')[0];
      const classStudents = students.filter(s => s.class_id === parseInt(selectedClassId));
      const records = classStudents.map(s => ({
        student_id: s.id,
        lesson_id: parseInt(selectedLesson),
        present: attendance[s.id] ? 1 : 0,
        date
      }));

      await api.post('/attendance', { records });
      setSuccess(true);
      setAttendance({});
      setSelectedLesson('');
      setSelectedClassId('');
      fetchData();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar chamada');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (role !== 'master') return alert('Apenas usuários Master podem excluir registros de chamada.');
    if (confirm('Deseja realmente excluir este registro de chamada?')) {
      try {
        await api.delete(`/attendance/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Erro ao excluir registro de chamada');
      }
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) &&
    (selectedClassId ? s.class_id === parseInt(selectedClassId) : true)
  );

  const filteredHistory = history.filter(record => {
    const student = students.find(s => s.id === record.student_id);
    const matchesClass = filterClass ? student?.class_id === parseInt(filterClass) : true;
    const matchesDate = filterDate ? record.date === filterDate : true;
    return matchesClass && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Realizar Chamada</h1>
          <p className="text-neutral-500 text-sm italic serif">Registre a presença dos alunos para a lição de hoje.</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || !selectedLesson || !selectedClassId || (alreadyExists && role !== 'master')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
        >
          <Save size={18} />
          {loading ? 'Salvando...' : 'Finalizar Chamada'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Filtro: Revista</label>
                <div className="relative">
                  <select
                    className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                    value={selectedMagazine}
                    onChange={(e) => {
                      setSelectedMagazine(e.target.value);
                      setSelectedLesson('');
                    }}
                  >
                    <option value="">Selecione a revista</option>
                    {magazines.map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                  <BookOpen className="absolute left-3 top-2.5 text-neutral-400" size={18} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Filtro: Lição</label>
                <div className="relative">
                  <select
                    className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                    value={selectedLesson}
                    onChange={(e) => setSelectedLesson(e.target.value)}
                    disabled={!selectedMagazine}
                  >
                    <option value="">Selecione a lição</option>
                    {lessons.filter(l => selectedMagazine ? l.magazine_id === parseInt(selectedMagazine) : true).map(l => (
                      <option key={l.id} value={l.id}>{l.number}. {l.title}</option>
                    ))}
                  </select>
                  <BookOpen className="absolute left-3 top-2.5 text-neutral-400" size={18} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Classe</label>
                <div className="relative">
                  <select
                    className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                    value={selectedClassId}
                    onChange={(e) => {
                      const classId = e.target.value;
                      setSelectedClassId(classId);
                      if (classId) {
                        const cls = classes.find(c => c.id === parseInt(classId));
                        if (cls && cls.magazine_id) {
                          setSelectedMagazine(cls.magazine_id.toString());
                          setSelectedLesson('');
                        }
                      }
                    }}
                  >
                    <option value="">Selecione a classe</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <Layers className="absolute left-3 top-2.5 text-neutral-400" size={18} />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Buscar Aluno</label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Nome do aluno..."
                    className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {alreadyExists && (
              <div className="bg-amber-50 text-amber-700 p-4 rounded-xl border border-amber-200 flex items-center gap-3">
                <AlertCircle size={20} />
                <div className="text-sm">
                  <p className="font-bold">Chamada já realizada!</p>
                  <p className="opacity-80">
                    {role === 'master'
                      ? 'Você é Master e pode modificar os registros abaixo.'
                      : 'Esta chamada já foi salva. Apenas usuários Master podem alterá-la.'}
                  </p>
                </div>
              </div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 text-sm font-medium"
              >
                Chamada realizada com sucesso!
              </motion.div>
            )}

            {!selectedLesson || !selectedClassId ? (
              <div className="text-center py-12 text-neutral-400 border border-dashed border-neutral-200 rounded-xl">
                <Check size={48} className="mx-auto mb-4 opacity-30" />
                <p>Selecione a revista, a lição e a classe para ver a lista de chamada.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => handleToggle(student.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${attendance[student.id]
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-white border-neutral-100 text-neutral-600 hover:border-neutral-200'
                      }`}
                  >
                    <div className="text-left">
                      <p className="font-bold text-sm">{student.name}</p>
                      <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold">{student.class_name}</p>
                    </div>
                    {attendance[student.id] ? <Check size={20} className="text-emerald-600" /> : <div className="w-5 h-5 rounded-full border-2 border-neutral-200" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Calendar size={20} className="text-indigo-500" />
            Histórico Recente
          </h2>

          <div className="bg-white p-4 rounded-xl border border-neutral-100 space-y-3">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Filtrar Histórico</label>
              <select
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg outline-none text-xs"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="">Todas as Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input
                type="date"
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg outline-none text-xs"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {filteredHistory.slice(0, 20).map((record) => (
                <div key={record.id} className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex items-center justify-between group">
                  <div>
                    <p className="text-sm font-bold text-neutral-800">{record.student_name}</p>
                    <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest">{formatDate(record.date)} • {record.lesson_title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${record.present ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <button onClick={() => handleDelete(record.id)} className="p-1.5 text-neutral-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredHistory.length === 0 && (
                <p className="text-center text-xs text-neutral-400 italic py-4">Nenhum registro encontrado.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

