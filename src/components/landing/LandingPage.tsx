import Header from './Header';
import HeroSection from './HeroSection';
import SpecialtyRoom from './SpecialtyRoom';

export default function LandingPage() {
  return (
    <main className="relative w-full bg-slate-50 min-h-screen">
      <Header />
      
      <HeroSection />

      <div id="especialidades">

        <SpecialtyRoom 
          title="Psicomotricidade"
          professionalName="Especialista"
          description="O corpo e o movimento em harmonia. Nossa sala é preparada para estimular a coordenação motora, o equilíbrio e a consciência corporal, essenciais para o desenvolvimento global."
          imageUrl="/images/Psicomoticidade.jpeg"
          zoomScale={2.2}
          zoomOrigin="50% 10%"
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
