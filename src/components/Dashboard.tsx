import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion } from 'motion/react';
import { Users, GraduationCap, CheckSquare, Calendar, TrendingUp } from 'lucide-react';
import { formatDate } from '../utils';

export default function Dashboard({ role }: { role: string }) {
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
    { label: 'Total de Alunos', value: stats.students, icon: GraduationCap, color: 'bg-blue-500' },
    { label: 'Professores', value: stats.teachers, icon: Users, color: 'bg-emerald-500' },
    { label: 'Classes Ativas', value: stats.classes, icon: Calendar, color: 'bg-purple-500' },
    { label: 'Chamadas Realizadas', value: stats.attendance, icon: CheckSquare, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Bem-vindo ao Painel</h1>
        <p className="text-neutral-500 mt-1 italic serif">Visão geral das atividades da sua Escola Bíblica.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-4"
          >
            <div className={`w-12 h-12 ${card.color} text-white rounded-xl flex items-center justify-center shadow-lg shadow-neutral-200`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-2xl font-bold text-neutral-900">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-neutral-900">Atividade Recente</h2>
            <TrendingUp size={20} className="text-emerald-500" />
          </div>
          <div className="space-y-4">
            {recentAttendance.map((record, i) => (
              <div key={record.id} className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                <div className={`w-2 h-2 rounded-full ${record.present ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-800">{record.student_name} - {record.present ? 'Presente' : 'Ausente'}</p>
                  <p className="text-xs text-neutral-400">{formatDate(record.date)} • {record.lesson_title}</p>
                </div>
              </div>
            ))}
            {recentAttendance.length === 0 && (
              <p className="text-sm text-neutral-400 italic">Nenhuma atividade recente.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900 mb-6">Próximas Lições</h2>
          <div className="space-y-4">
            {upcomingLessons.map((lesson, i) => (
              <div key={lesson.id} className={`p-4 rounded-xl border ${i === 0 ? 'border-emerald-100 bg-emerald-50/30' : 'border-neutral-100 bg-neutral-50'}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${i === 0 ? 'text-emerald-600' : 'text-neutral-400'}`}>
                  {i === 0 ? 'Próxima Lição' : formatDate(lesson.date)}
                </p>
                <p className="text-sm font-bold text-neutral-800">Lição {lesson.number}: {lesson.title}</p>
                <p className="text-xs text-neutral-500 mt-1 italic serif">{formatDate(lesson.date)}</p>
              </div>
            ))}
            {upcomingLessons.length === 0 && (
              <p className="text-sm text-neutral-400 italic">Nenhuma lição futura cadastrada.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
