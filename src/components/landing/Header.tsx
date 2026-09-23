import { useState, useEffect } from 'react';
import { LogIn, User } from 'lucide-react';
import IntranetLogin from './IntranetLogin';

interface HeaderProps {
  onPatientClick?: () => void;
}

export default function Header({ onPatientClick }: HeaderProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);


  return (
    <>
      <header className={`fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center transition-transform duration-300 bg-white/70 backdrop-blur-md border-b border-white/20 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
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

        <div className="flex items-center gap-3">
          <button 
            onClick={onPatientClick}
            className="px-4 md:px-6 py-2.5 text-sm font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2"
          >
            <User size={18} />
            <span className="hidden sm:inline">Área do Paciente</span>
            <span className="sm:hidden">Paciente</span>
          </button>

          <button 
            onClick={() => setIsLoginOpen(true)}
            className="px-4 py-2.5 text-sm font-semibold rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <LogIn size={18} />
            <span className="hidden sm:inline">Colaborador</span>
          </button>
        </div>
      </header>

      {isLoginOpen && <IntranetLogin onClose={() => setIsLoginOpen(false)} />}
    </>
  );
}
