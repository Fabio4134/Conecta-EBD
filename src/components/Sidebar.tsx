import React from 'react';
import {
  Home, Church, BookOpen, FileText, Users, GraduationCap,
  Layers, Calendar, CheckSquare, Download, BarChart2, TrendingUp, LogOut, Key, X
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
  churchName?: string;
  onLogout: () => void;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export default function Sidebar({ activeMenu, setActiveMenu, role, churchName, onLogout, isOpen, setIsOpen }: SidebarProps) {
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
    { id: 'estatisticas', label: 'Estatísticas', icon: TrendingUp },
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
        "w-64 bg-neutral-900 border-r border-white/10 h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300 md:translate-x-0 overflow-hidden",
        "bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        {/* Decorative background glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="p-6 flex flex-col gap-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center p-1 border border-white/10 shadow-lg shadow-black/20 overflow-hidden">
                <img src="/logo-transparent.png" alt="Logo ADMTN" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <div>
                <h1 className="text-white font-bold tracking-tight text-lg leading-tight">Conecta EBD</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400/90 font-bold mt-0.5">{role}</p>
              </div>
            </div>
            <button
              className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors"
              onClick={() => setIsOpen?.(false)}
            >
              <X size={20} />
            </button>
          </div>

          {churchName && (
            <div className="w-full px-1">
              <p className="text-emerald-400 font-semibold text-xs leading-relaxed italic border-l-2 border-emerald-500/50 pl-3 py-0.5 opacity-90">
                {churchName}
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto custom-scrollbar relative z-10">
          {menus.map((menu) => {
            const isActive = activeMenu === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => setActiveMenu(menu.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium group relative overflow-hidden",
                  isActive
                    ? "text-emerald-400 bg-white/5 shadow-inner shadow-white/5 ring-1 ring-white/10"
                    : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                )}
                <menu.icon size={isActive ? 20 : 18} className={cn("transition-all duration-300", isActive ? "text-emerald-400" : "text-neutral-500 group-hover:text-neutral-300")} />
                <span className="relative z-10">{menu.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 relative z-10 bg-black/20 backdrop-blur-md">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400/90 hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20 group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            Sair do Sistema
          </button>
        </div>
      </div>
    </>
  );
}
