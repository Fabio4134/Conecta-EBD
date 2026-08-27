import {
  Home, Church, BookOpen, FileText, Users, GraduationCap,
  Layers, Calendar, CheckSquare, Download, BarChart2, TrendingUp,
  LogOut, Key, X, MessageSquare, MapPin, Building2, Sparkles, Map as MapIcon
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
  role: 'master' | 'standard' | 'secretary' | string;
  churchName?: string;
  onLogout: () => void;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export default function Sidebar({ activeMenu, setActiveMenu, role, churchName, onLogout, isOpen, setIsOpen }: SidebarProps) {
  const isMasterOrSec = role === 'master' || role === 'secretary';

  const menus = [
    { id: 'inicio', label: 'Tela Inicial', icon: Home },
    { id: 'chamadas', label: 'Chamadas', icon: CheckSquare, featured: true, badge: 'Mais Usado' },
    ...(isMasterOrSec ? [{ id: 'setores', label: 'Setores', icon: MapPin }] : []),
    { id: 'mapa', label: 'Mapa Salvador', icon: MapIcon },
    { id: 'perfil', label: 'Editar Perfil', icon: Building2 },
    { id: 'igreja', label: 'Igreja', icon: Church },
    { id: 'gerador_ia', label: 'Gerador IA de Lições', icon: Sparkles },
    { id: 'revistas', label: 'Revistas e Temas', icon: BookOpen },
    { id: 'licoes', label: 'Lições e Temas', icon: FileText },
    { id: 'classes', label: 'Classes', icon: Layers },
    { id: 'professores', label: 'Professores', icon: Users },
    { id: 'alunos', label: 'Alunos', icon: GraduationCap },
    { id: 'escala', label: 'Escala de Prof.', icon: Calendar },
    { id: 'material', label: 'Material de Apoio', icon: Download },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart2 },
    { id: 'estatisticas', label: 'Estatísticas', icon: TrendingUp },
    { id: 'sugestoes', label: 'Sugestões e ajustes', icon: MessageSquare },
    ...(role === 'master' ? [{ id: 'usuarios', label: 'Usuários', icon: Users }] : []),
    { id: 'senha', label: 'Trocar Senha', icon: Key },
  ];

  const roleLabel = role === 'master' ? 'MASTER' : role === 'secretary' ? 'SECRETÁRIO(A)' : 'PADRÃO';
  const roleBadgeColor = role === 'master' ? 'text-emerald-400/90' : role === 'secretary' ? 'text-sky-400' : 'text-neutral-400';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen?.(false)}
        />
      )}
      <div className={cn(
        "w-72 sm:w-64 bg-neutral-900 border-r border-white/10 h-screen h-[100dvh] max-h-[100dvh] fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300 md:translate-x-0 overflow-hidden",
        "bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        {/* Decorative background glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 relative z-10 border-b border-white/5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center p-1 border border-white/10 shadow-lg shadow-black/20 overflow-hidden">
                <img src="/logo-transparent.png" alt="Logo ADMTN" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <div>
                <h1 className="text-white font-bold tracking-tight text-sm sm:text-base leading-tight">Conecta EBD</h1>
                <p className={cn("text-[10px] uppercase tracking-[0.2em] font-bold mt-0.5", roleBadgeColor)}>{roleLabel}</p>
              </div>
            </div>
            <button
              className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors rounded-xl active:bg-white/10"
              onClick={() => setIsOpen?.(false)}
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
          </div>

          {churchName && (
            <div className="w-full px-1">
              <p className="text-emerald-400 font-semibold text-xs leading-relaxed italic border-l-2 border-emerald-500/50 pl-3 py-0.5 opacity-90 truncate">
                {churchName}
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 min-h-0 px-3.5 py-2 space-y-1 overflow-y-auto custom-scrollbar relative z-10 overscroll-contain">
          {menus.map((menu: any) => {
            const isActive = activeMenu === menu.id;
            const isFeatured = menu.featured;
            return (
              <button
                key={menu.id}
                onClick={() => {
                  setActiveMenu(menu.id);
                  setIsOpen?.(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3.5 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-sm font-medium group relative overflow-hidden active:scale-[0.98]",
                  isFeatured && !isActive && "bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border border-emerald-500/30 text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-500/20 shadow-sm shadow-emerald-950/40",
                  isActive
                    ? "text-emerald-400 bg-white/10 shadow-inner shadow-white/5 ring-1 ring-white/10 font-bold"
                    : !isFeatured && "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                )}
                <div className="flex items-center gap-3 min-w-0">
                  <menu.icon
                    size={isActive || isFeatured ? 19 : 18}
                    className={cn(
                      "transition-all duration-200 shrink-0",
                      isActive
                        ? "text-emerald-400"
                        : isFeatured
                        ? "text-emerald-400 group-hover:scale-110 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                        : "text-neutral-500 group-hover:text-neutral-300"
                    )}
                  />
                  <span className={cn("truncate text-left", isFeatured && "font-semibold text-emerald-100")}>{menu.label}</span>
                </div>
                {menu.badge && (
                  <span className="shrink-0 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-neutral-950 shadow-sm shadow-emerald-500/30 animate-pulse">
                    {menu.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 sm:p-4 border-t border-white/10 relative z-20 bg-neutral-950/95 backdrop-blur-md shrink-0 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] shadow-lg shadow-black">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 transition-all border border-red-500/30 group active:scale-[0.98] shadow-sm"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform shrink-0 text-red-400" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </div>
    </>
  );
}
