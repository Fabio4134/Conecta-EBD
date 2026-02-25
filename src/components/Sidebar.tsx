import React from 'react';
import {
  Home, Church, BookOpen, FileText, Users, GraduationCap,
  Layers, Calendar, CheckSquare, Download, BarChart2, LogOut, Key, X
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  role: 'master' | 'standard';
  onLogout: () => void;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export default function Sidebar({ activeMenu, setActiveMenu, role, onLogout, isOpen, setIsOpen }: SidebarProps) {
  const menus = [
    { id: 'inicio', label: 'Tela Inicial', icon: Home },
    { id: 'igreja', label: 'Igreja', icon: Church },
    { id: 'revistas', label: 'Revistas e Temas', icon: BookOpen },
    { id: 'licoes', label: 'Lições e Temas', icon: FileText },
    { id: 'classes', label: 'Classes', icon: Layers },
    { id: 'professores', label: 'Professores', icon: Users },
    { id: 'alunos', label: 'Alunos', icon: GraduationCap },
    { id: 'escala', label: 'Escala de Prof.', icon: Calendar },
    { id: 'chamadas', label: 'Chamadas', icon: CheckSquare },
    { id: 'material', label: 'Material de Apoio', icon: Download },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart2 },
    ...(role === 'master' ? [{ id: 'usuarios', label: 'Usuários', icon: Users }] : []),
    { id: 'senha', label: 'Trocar Senha', icon: Key },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen?.(false)}
        />
      )}
      <div className={cn(
        "w-64 bg-neutral-900 text-neutral-400 h-screen fixed left-0 top-0 flex flex-col border-r border-white/5 z-50 transition-transform duration-300 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-white font-bold tracking-tight">Conecta EBD</h1>
              <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">{role}</p>
            </div>
          </div>
          <button
            className="md:hidden p-2 text-neutral-400 hover:text-white"
            onClick={() => setIsOpen?.(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => setActiveMenu(menu.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                activeMenu === menu.id
                  ? "bg-emerald-600/10 text-emerald-500"
                  : "hover:bg-white/5 hover:text-white"
              )}
            >
              <menu.icon size={18} />
              {menu.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut size={18} />
            Sair do Sistema
          </button>
        </div>
      </div>
    </>
  );
}
