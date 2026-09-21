import { ChevronDown } from 'lucide-react';

export default function HeroSection() {
  return (
    <section id="inicio" className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-slate-50">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/50 to-slate-50 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=80&w=2000&auto=format&fit=crop" 
          alt="Clínica Moderna" 
          className="w-full h-full object-cover opacity-30"
        />
      </div>
      
      <div className="relative z-10 text-center max-w-4xl px-6 flex flex-col items-center">
        <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide mb-6 inline-block">
          Especialistas em Autismo e TDAH
        </span>
        <h1 className="text-5xl md:text-7xl font-bold text-slate-800 tracking-tight leading-[1.1] mb-6">
          Desenvolvimento <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">integrado</span> e acolhedor.
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Nossa equipe multidisciplinar trabalha unida para transformar o potencial do seu filho(a) em autonomia e conquistas reais.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-full font-semibold transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2">
            Agendar Avaliação <ChevronDown size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
