/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Menu, GraduationCap } from 'lucide-react';
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
import { User } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeMenu, setActiveMenu] = useState('inicio');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="min-h-screen bg-neutral-100 flex items-center justify-center font-mono text-xs uppercase tracking-widest text-neutral-400 animate-pulse">Carregando Sistema...</div>;

  if (!user) return <Login onLogin={handleLogin} />;

  const renderContent = () => {
    switch (activeMenu) {
      case 'inicio': return <Dashboard role={user.role} />;
      case 'igreja': return <ChurchList role={user.role} />;
      case 'revistas': return <MagazineList role={user.role} />;
      case 'licoes': return <LessonList role={user.role} />;
      case 'professores': return <TeacherList role={user.role} />;
      case 'alunos': return <StudentList role={user.role} />;
      case 'classes': return <ClassList role={user.role} />;
      case 'escala': return <TeacherSchedule role={user.role} />;
      case 'chamadas': return <Attendance role={user.role} />;
      case 'material': return <StudyMaterial role={user.role} />;
      case 'relatorios': return <Reports role={user.role} />;
      case 'estatisticas': return <Statistics role={user.role} />;
      case 'usuarios': return <UserManagement />;
      case 'senha': return <ChangePassword />;
      default: return <Dashboard role={user.role} />;
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

      <main className="flex-1 md:ml-64 min-h-screen relative overflow-hidden">
        {/* Subtle background decorative shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none"></div>

        <div className="md:hidden glass-panel text-neutral-900 p-4 flex items-center justify-between sticky top-0 z-30 mb-4 border-b border-neutral-200">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md shadow-emerald-500/20 rounded-lg flex items-center justify-center text-white ring-1 ring-white/50">
              <GraduationCap size={18} />
            </div>
            <h1 className="font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600">Conecta EBD</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -mr-2 text-neutral-500 hover:text-neutral-900 transition-colors relative z-10">
            <Menu size={24} />
          </button>
        </div>

        <div className="p-4 md:p-10 max-w-7xl mx-auto relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.98, filter: 'blur(2px)' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

