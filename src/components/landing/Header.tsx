import { useState } from 'react';
import IntranetLogin from './IntranetLogin';
import type { UserRole } from '../../App';

interface HeaderProps {
  onLogin: (role: UserRole) => void;
}

export default function Header({ onLogin }: HeaderProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center transition-all duration-300 bg-white/70 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center gap-2 md:gap-3">
          <img 
            src="/images/logo-motivar.png" 
            alt="Instituto Motivar Logo" 
            className="h-16 md:h-20 w-auto object-contain"
          />
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#inicio" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Início</a>
          <a href="#especialidades" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Especialidades</a>
        </nav>

        <button 
          onClick={() => setIsLoginOpen(true)}
          className="px-6 py-2.5 text-sm font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">login</span>
          Entrar
        </button>
      </header>

      {isLoginOpen && <IntranetLogin onClose={() => setIsLoginOpen(false)} onLogin={onLogin} />}
    </>
  );
}
