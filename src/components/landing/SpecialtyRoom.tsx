import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SpecialtyRoomProps {
  title: string;
  professionalName: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  reverse?: boolean;
  zoomScale?: number;
  zoomOrigin?: string;
  scrubVideo?: boolean; // Não usaremos mais o reverse neste layout de 3 colunas, mas mantemos para compatibilidade
}

export default function SpecialtyRoom({ title, professionalName, description, imageUrl, videoUrl, zoomScale, zoomOrigin, scrubVideo }: SpecialtyRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLImageElement & HTMLVideoElement>(null);
  const leftTextRef = useRef<HTMLDivElement>(null);
  const rightTextRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current || !mediaRef.current || !leftTextRef.current || !rightTextRef.current || !overlayRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=200%", // Duração do scroll
        scrub: 1,      
        pin: true,     
        anticipatePin: 1,
      }
    });

    
    // Scrub video se ativado com proteção contra travamento (Debounce Seek)
    if (scrubVideo && videoUrl && mediaRef.current) {
      const vid = mediaRef.current as HTMLVideoElement;
      vid.pause(); // Garante que não está tocando
      
      const progressObj = { value: 0 };
      let isSeeking = false;
      let targetTime = 0;

      const handleSeeked = () => {
        isSeeking = false;
        // Se a barra de rolagem mudou enquanto o video pensava, atualiza de novo
        if (Math.abs(vid.currentTime - targetTime) > 0.05) {
          isSeeking = true;
          vid.currentTime = targetTime;
        }
      };

      vid.addEventListener('seeked', handleSeeked);

      tl.to(progressObj, {
        value: 1,
        ease: "none",
        onUpdate: () => {
          if (!vid.duration) return;
          targetTime = vid.duration * progressObj.value;
          
          if (!isSeeking) {
            isSeeking = true;
            vid.currentTime = targetTime;
          }
        }
      }, 0);
    }

    // Zoom no rosto/busto

    tl.to(mediaRef.current, {
      scale: zoomScale || 1.8,
      transformOrigin: zoomOrigin || "50% 25%", 
      ease: "power1.inOut",
    }, 0);

    // Escurece o fundo para dar leitura ao texto branco
    tl.to(overlayRef.current, {
      opacity: 0.65,
      ease: "none"
    }, 0);

    // Texto da esquerda (Título e Nome) entra
    tl.fromTo(leftTextRef.current, 
      { x: -100, opacity: 0 },
      { x: 0, opacity: 1, ease: "power2.out" },
      0.2
    );

    // Texto da direita (Descrição) entra
    tl.fromTo(rightTextRef.current, 
      { x: 100, opacity: 0 },
      { x: 0, opacity: 1, ease: "power2.out" },
      0.2
    );

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-slate-900 flex items-center justify-center">
      
      {/* Imagem/Vídeo de fundo */}
      {videoUrl ? (
        <video 
          ref={mediaRef as any}
          src={videoUrl}
          autoPlay={!scrubVideo}
          loop={!scrubVideo}
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
      ) : (
        <img 
          ref={mediaRef as any}
          src={imageUrl} 
          alt={title} 
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
      )}
      
      {/* Overlay escuro (Gradiente radial para deixar o centro mais claro) */}
      <div 
        ref={overlayRef} 
        className="absolute inset-0 opacity-0"
        style={{
          background: 'radial-gradient(circle, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)'
        }}
      />

      {/* Conteúdo em 3 Colunas (Esquerda: Título | Centro: Vazio/Busto | Direita: Texto) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 h-full flex flex-col md:flex-row justify-between items-center py-20 gap-8 md:gap-0">
        
        {/* Coluna Esquerda: Título e Nome */}
        <div ref={leftTextRef} className="w-full md:w-1/3 text-left">
          <span className="text-primary font-bold tracking-widest uppercase text-sm mb-3 block drop-shadow-md">
            {title}
          </span>
          <h2 className="text-5xl md:text-7xl font-bold text-white drop-shadow-xl leading-[1.1]">
            <span className="block text-2xl md:text-3xl font-medium text-slate-300 mb-2">Conheça o(a)</span>
            {professionalName}
          </h2>
        </div>

        {/* Coluna Central: Vazia para exibir o profissional */}
        <div className="hidden md:block w-1/3 h-full"></div>

        {/* Coluna Direita: Descrição e Botão */}
        <div ref={rightTextRef} className="w-full md:w-1/3 text-left md:text-right mt-auto md:mt-0 flex flex-col md:items-end">
          <p className="text-lg md:text-xl text-slate-100 font-medium drop-shadow-lg leading-relaxed mb-8">
            {description}
          </p>
          <button className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-full font-bold transition-all shadow-lg shadow-primary/40 hover:scale-105 active:scale-95">
            Agendar Sessão
          </button>
        </div>

      </div>

    </div>
  );
}
