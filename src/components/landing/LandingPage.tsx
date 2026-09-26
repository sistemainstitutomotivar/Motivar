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
      <section className="scrollytelling-section" id="tour-virtual">
        <div className="scrollytelling-sticky-viewport">
          <div className="scrollytelling-slides-wrapper">
            
            {/* Slide 1: Para testar na prática */}
            <div className="scrolly-slide" data-slide-index="0" data-is-360="false" data-is-canvas="true">
              <div className="scrolly-media-wrapper">
                
                <canvas id="canvas-seq-0" className="scrolly-canvas-seq" data-frames-dir="assets/frames_slide_1" data-total-frames="60"></canvas>
                <div className="scrolly-360-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>
                  <span>Sequência Canvas 60fps</span>
                </div>
                <div className="scrolly-overlay"></div>
              </div>
              
              <div className="scrolly-caption-box pos-center-left theme-glass">
                <div className="scrolly-step-tag">
                  <span className="step-num">01</span>
                  <span className="step-divider">/</span>
                  <span className="step-total">01</span>
                  <span className="step-label">Passo a Passo do Imóvel</span>
                </div>
                <h3 className="scrolly-title">Para testar na prática</h3>
              </div>
            </div>
          </div>
          
          {/* Indicador de Navegação */}
          <div className="scrolly-scroll-hint">
            <div className="mouse-icon"></div>
            <small>Role para avançar e adentrar nos ambientes</small>
          </div>
        </div>
      </section>

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
