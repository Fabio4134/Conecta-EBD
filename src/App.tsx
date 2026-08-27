/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Menu, GraduationCap, CheckSquare, Sparkles, Plus, ArrowRight } from 'lucide-react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChurchList from './components/ChurchList';
import MagazineList from './components/MagazineList';
import LessonList from './components/LessonList';
import TeacherList from './components/TeacherList';
import StudentList from './components/StudentList';
import ClassList from './components/ClassList';
import TeacherSchedule from './components/TeacherSchedule';
import Attendance from './components/Attendance';
import StudyMaterial from './components/StudyMaterial';
import Reports from './components/Reports';
import Statistics from './components/Statistics.js';
import ChangePassword from './components/ChangePassword';
import UserManagement from './components/UserManagement';
import Suggestions from './components/Suggestions';
import SectorList from './components/SectorList';
import ChurchProfile from './components/ChurchProfile';
import MagazineAIGenerator from './components/MagazineAIGenerator';
import StudentSelfRegister from './components/StudentSelfRegister';
import MapaSvador from './components/MapaSvador';
import { User } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeMenu, setActiveMenu] = useState('inicio');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if opening via public class registration link (e.g. ?cadastro=5 or ?classe=5)
  const [cadastroClassId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('cadastro') || params.get('classe') || null;
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (cadastroClassId) {
    return <StudentSelfRegister classId={cadastroClassId} />;
  }

  if (loading) return <div className="min-h-screen bg-neutral-100 flex items-center justify-center font-mono text-xs uppercase tracking-widest text-neutral-400 animate-pulse">Carregando Sistema...</div>;

  if (!user) return <Login onLogin={handleLogin} />;

  const renderContent = () => {
    switch (activeMenu) {
      case 'inicio': return <Dashboard role={user.role} onNavigateToAttendance={() => setActiveMenu('chamadas')} />;
      case 'setores': return <SectorList role={user.role} />;
      case 'mapa': return <MapaSvador role={user.role} />;
      case 'perfil': return <ChurchProfile user={user} />;
      case 'igreja': return <ChurchList role={user.role} churchId={user.church_id} />;
      case 'gerador_ia': return <MagazineAIGenerator onNavigateToLessons={() => setActiveMenu('licoes')} />;
      case 'revistas': return <MagazineList role={user.role} onNavigateToAI={() => setActiveMenu('gerador_ia')} onNavigateToLessons={() => setActiveMenu('licoes')} />;
      case 'licoes': return <LessonList role={user.role} />;
      case 'professores': return <TeacherList role={user.role} />;
      case 'alunos': return <StudentList role={user.role} />;
      case 'classes': return <ClassList role={user.role} />;
      case 'escala': return <TeacherSchedule role={user.role} />;
      case 'chamadas': return <Attendance role={user.role} />;
      case 'material': return <StudyMaterial role={user.role} />;
      case 'relatorios': return <Reports role={user.role} />;
      case 'estatisticas': return <Statistics role={user.role} />;
      case 'sugestoes': return <Suggestions role={user.role} />;
      case 'usuarios': return <UserManagement />;
      case 'senha': return <ChangePassword />;
      default: return <Dashboard role={user.role} onNavigateToAttendance={() => setActiveMenu('chamadas')} />;
    }
  };

  return (
    <div className="min-h-screen premium-gradient flex font-sans text-neutral-900 selection:bg-emerald-500/30">
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={(menu) => {
          setActiveMenu(menu);
          setIsSidebarOpen(false);
        }}
        role={user.role}
        churchName={user.church_name}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 md:ml-64 min-h-screen relative w-full overflow-x-hidden">
        {/* Subtle background decorative shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none"></div>

        {/* Topbar Global com Botão de Destaque Estratégico para Chamadas */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-neutral-200/80 px-4 sm:px-6 py-2.5 sm:py-3 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            {/* Mobile Brand / Desktop Context */}
            <div className="flex items-center gap-3">
              <div className="md:hidden flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md shadow-emerald-500/20 rounded-lg flex items-center justify-center text-white ring-1 ring-white/50">
                  <GraduationCap size={18} />
                </div>
                <h1 className="font-bold text-sm tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600">Conecta EBD</h1>
              </div>

              <div className="hidden md:flex items-center gap-2 text-xs text-neutral-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-neutral-700">{user.church_name || 'Escola Bíblica Dominical'}</span>
              </div>
            </div>

            {/* Ações Rápidas do Header */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Botão Estratégico de Chamada em Destaque */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveMenu('chamadas')}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md active:scale-95 ${
                  activeMenu === 'chamadas'
                    ? 'bg-neutral-900 text-emerald-400 border border-emerald-500/40 shadow-emerald-950/20 ring-2 ring-emerald-500/30'
                    : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-500 hover:to-teal-400 border border-emerald-400/40'
                }`}
                title="Acesso rápido para Registrar Chamada"
              >
                <CheckSquare size={16} strokeWidth={2.5} className={activeMenu === 'chamadas' ? 'text-emerald-400' : 'text-white'} />
                <span className="tracking-tight">Fazer Chamada</span>
                {activeMenu !== 'chamadas' && (
                  <span className="hidden sm:inline-flex text-[10px] font-extrabold uppercase bg-black/20 text-white px-1.5 py-0.5 rounded">
                    Rápido
                  </span>
                )}
              </motion.button>

              {/* Botão Hambúrguer para Mobile */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 active:scale-95 transition-all rounded-xl hover:bg-neutral-100"
                aria-label="Abrir menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </header>

        <div className="px-3.5 py-4 sm:px-6 md:p-10 pb-28 sm:pb-32 md:pb-36 max-w-7xl mx-auto relative z-10 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Action Button (FAB) para Acesso Ultra Rápido em Qualquer Tela */}
        <AnimatePresence>
          {activeMenu !== 'chamadas' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.25 }}
              className="fixed bottom-6 right-6 z-40"
            >
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setActiveMenu('chamadas')}
                className="flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white font-extrabold text-sm shadow-2xl shadow-emerald-600/40 hover:shadow-emerald-500/60 border border-white/30 group cursor-pointer"
                aria-label="Ir para Chamadas"
              >
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                  <CheckSquare size={17} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                </div>
                <span className="tracking-tight drop-shadow-sm">Fazer Chamada</span>
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

