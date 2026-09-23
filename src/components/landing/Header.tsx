import { useState, useEffect } from 'react';
import { LogIn } from 'lucide-react';
import IntranetLogin from './IntranetLogin';
export default function Header() {
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

        <button 
          onClick={() => setIsLoginOpen(true)}
          className="px-6 py-2.5 text-sm font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2"
        >
          <LogIn size={18} />
          Entrar
        </button>
      </header>

      {isLoginOpen && <IntranetLogin onClose={() => setIsLoginOpen(false)} />}
    </>
  );
}
