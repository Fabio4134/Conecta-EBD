/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import ChangePassword from './components/ChangePassword';
import UserManagement from './components/UserManagement';
import { User } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeMenu, setActiveMenu] = useState('inicio');
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
      case 'usuarios': return <UserManagement />;
      case 'senha': return <ChangePassword />;
      default: return <Dashboard role={user.role} />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans text-neutral-900">
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        role={user.role} 
        onLogout={handleLogout} 
      />
      
      <main className="flex-1 ml-64 p-10 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

