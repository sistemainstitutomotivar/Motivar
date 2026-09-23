import { useState } from 'react';
import Header from './Header';
import HeroSection from './HeroSection';
import SpecialtyRoom from './SpecialtyRoom';
import PatientLogin from '../patient/PatientLogin';

export default function LandingPage() {
  const [showPatientLogin, setShowPatientLogin] = useState(false);

  if (showPatientLogin) {
    return (
      <PatientLogin 
        onLoginSuccess={() => {}} // O App.tsx vai assumir o controle automaticamente por causa do onAuthStateChange
        onBack={() => setShowPatientLogin(false)} 
      />
    );
  }

  return (
    <main className="relative w-full bg-slate-50 min-h-screen">
      <Header onPatientClick={() => setShowPatientLogin(true)} />
      
            <HeroSection />

      {/* 1. SCROLLYTELLING: ADENTRANDO A CLÍNICA */}
      {/* Placeholder para o futuro vídeo de entrada na clínica */}
      <div id="tour-clinica" className="w-full min-h-[50vh] bg-slate-900 flex flex-col items-center justify-center py-20 text-slate-400 text-center border-y border-slate-800">
        <span className="material-symbols-outlined text-4xl mb-4">movie</span>
        <h3 className="text-2xl font-bold text-white mb-2">Adentrando a Clínica</h3>
        <p className="max-w-md">Espaço reservado para o vídeo Scrollytelling de entrada pela porta até a recepção/corredor.</p>
      </div>

      <div id="especialidades">
        
        {/* 2. CEO (VÍDEO COM SCRUBBING) */}
        <SpecialtyRoom 
          title="Diretora Clínica & Psicomotricista"
          professionalName="CEO do Instituto"
          description="Bem-vindos ao Instituto Motivar. Veja na prática como o corpo e o movimento em harmonia abrem portas para o desenvolvimento pleno das nossas crianças."
          videoUrl="/videos/psicomotricidade.mp4"
          zoomScale={1.45}
          zoomOrigin="50% 0%"
          objectPosition="center top"
          scrubVideo={true}
        />

        {/* 3. DEMAIS TERAPEUTAS (IMAGENS COM ZOOM FLUIDO) */}
        <SpecialtyRoom 
          title="Psicomotricidade"
          professionalName="Especialista"
          description="Nossa sala é desenhada para estimular a coordenação motora, o equilíbrio e a consciência corporal, criando uma base sólida para a aprendizagem."
          imageUrl="/images/Psicomoticidade.jpeg"
          zoomScale={2.2}
          zoomOrigin="50% 0%"
        />

        <SpecialtyRoom 
          title="Fonoaudiologia"
          professionalName="Dra. Mariana Silva"
          description="A comunicação é a ponte para o mundo. Aqui na sala de fonoaudiologia, utilizamos estímulos lúdicos e técnicas baseadas em evidências para desenvolver a linguagem, fala e motricidade orofacial do seu filho(a)."
          imageUrl="https://images.unsplash.com/photo-1666214280557-f1b5022eb634?q=80&w=2000&auto=format&fit=crop"
        />

        <SpecialtyRoom 
          title="Terapia Ocupacional"
          professionalName="Dra. Letícia Costa"
          description="Autonomia e integração sensorial. Nossa sala de T.O. é um ambiente seguro onde cada desafio motor e sensorial se transforma em uma conquista, ajudando a criança a realizar suas atividades diárias com independência."
          imageUrl="https://images.unsplash.com/photo-1581056771107-24ca5f033842?q=80&w=2000&auto=format&fit=crop"
        />
        
        <SpecialtyRoom 
          title="Neuropsicopedagogia"
          professionalName="Dr. Carlos Mendes"
          description="Compreendendo como o cérebro aprende. Identificamos potenciais e barreiras na aprendizagem, criando estratégias personalizadas para que cada criança desabroche no seu próprio ritmo."
          imageUrl="https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=2000&auto=format&fit=crop"
        />
      </div>

      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <p>© 2026 Instituto Motivar. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
