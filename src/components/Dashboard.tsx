import React, { useState, useEffect } from 'react';
import api from '../api.js';
import { motion } from 'motion/react';
import { Users, GraduationCap, CheckSquare, Calendar, TrendingUp, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../utils.js';

interface DashboardProps {
  role: string;
  onNavigateToAttendance?: () => void;
}

export default function Dashboard({ role, onNavigateToAttendance }: DashboardProps) {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    attendance: 0,
    classes: 0
  });
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [students, teachers, classes, attendance, lessons] = await Promise.all([
        api.get('/students'),
        api.get('/teachers'),
        api.get('/classes'),
        api.get('/attendance'),
        api.get('/lessons')
      ]);
      setStats({
        students: students.data.length,
        teachers: teachers.data.length,
        classes: classes.data.length,
        attendance: attendance.data.length
      });
      setRecentAttendance(attendance.data.slice(0, 5));

      const today = new Date().toISOString().split('T')[0];
      const upcoming = lessons.data
        .filter((l: any) => l.date >= today)
        .sort((a: any, b: any) => a.date.localeCompare(b.date))
        .slice(0, 2);
      setUpcomingLessons(upcoming);
    };
    fetchData();
  }, []);

  const cards = [
    { label: 'Chamadas Realizadas', value: stats.attendance, icon: CheckSquare, color: 'bg-emerald-600', isAction: true },
    { label: 'Total de Alunos', value: stats.students, icon: GraduationCap, color: 'bg-blue-500' },
    { label: 'Professores', value: stats.teachers, icon: Users, color: 'bg-indigo-500' },
    { label: 'Classes Ativas', value: stats.classes, icon: Calendar, color: 'bg-purple-500' },
  ];

  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="space-y-8">
      {/* Hero Banner de Ação Rápida de Chamada */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-900 via-emerald-950 to-neutral-900 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl shadow-emerald-950/20 text-white"
      >
        {/* Background glow & accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} className="text-emerald-400 animate-pulse" />
              <span>Ação Principal da EBD</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="capitalize">{todayFormatted}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Realizar Chamada de Hoje
            </h1>
            <p className="text-sm sm:text-base text-neutral-300">
              Acesse a lista de alunos, marque presenças, registre visitantes e mantenha o histórico da sua classe sempre atualizado com apenas 1 clique.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNavigateToAttendance}
            className="shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-neutral-950 font-black text-base shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:from-emerald-400 hover:to-teal-300 transition-all border border-white/40 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-neutral-950/10 flex items-center justify-center text-neutral-950">
              <CheckSquare size={20} strokeWidth={2.5} />
            </div>
            <span>Fazer Chamada Agora</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={card.isAction ? onNavigateToAttendance : undefined}
            className={`glass-card p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group ${
              card.isAction ? 'cursor-pointer ring-2 ring-emerald-500/30 hover:ring-emerald-500/60 bg-emerald-50/40' : ''
            }`}
          >
            {/* Subtle highlight effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className={`w-14 h-14 ${card.color} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-neutral-200/50 ring-1 ring-white/60 relative z-10 transform group-hover:scale-110 transition-transform duration-300`}>
              <card.icon size={26} strokeWidth={1.5} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.15em]">{card.label}</p>
                {card.isAction && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">Abrir</span>}
              </div>
              <p className="text-3xl font-black text-neutral-800 tracking-tight mt-1">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Atividade Recente</h2>
              <p className="text-sm text-neutral-500 mt-1">Últimas presenças registradas</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <TrendingUp size={20} strokeWidth={2} />
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            {recentAttendance.map((record, i) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={record.id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 border border-white hover:bg-white/80 transition-colors shadow-sm"
              >
                <div className={`w-3 h-3 rounded-full shadow-sm ${record.present ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-red-500 shadow-red-500/30'}`}></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-neutral-800">{record.student_name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 font-medium">{formatDate(record.date)} • {record.lesson_title}</p>
                </div>
                <div className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full ${record.present ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {record.present ? 'Presente' : 'Ausente'}
                </div>
              </motion.div>
            ))}
            {recentAttendance.length === 0 && (
              <div className="p-6 text-center border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                <p className="text-sm text-neutral-500 font-medium">Nenhuma atividade recente.</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

          <div className="mb-8 relative z-10">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Próximas Lições</h2>
            <p className="text-sm text-neutral-500 mt-1">Cronograma de aulas</p>
          </div>

          <div className="space-y-4 relative z-10">
            {upcomingLessons.map((lesson, i) => (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={lesson.id}
                className={`p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md ${i === 0 ? 'border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-white/80' : 'border-white bg-white/60 hover:bg-white/80'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ${i === 0 ? 'text-emerald-600' : 'text-neutral-500'}`}>
                      {i === 0 ? 'Próxima Lição' : 'Programada'}
                    </p>
                    <p className="text-base font-bold text-neutral-800 leading-tight">Lição {lesson.number}: <span className="font-semibold text-neutral-600">{lesson.title}</span></p>
                  </div>
                  <div className={`flex flex-col items-center justify-center p-3 rounded-xl ${i === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                    <span className="text-xs font-bold uppercase">{new Date(lesson.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                    <span className="text-lg font-black leading-none">{new Date(lesson.date).getDate()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            {upcomingLessons.length === 0 && (
              <div className="p-6 text-center border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                <p className="text-sm text-neutral-500 font-medium">Nenhuma lição futura cadastrada.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
