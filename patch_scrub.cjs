const fs = require('fs');

let code = fs.readFileSync('src/components/landing/SpecialtyRoom.tsx', 'utf8');

code = code.replace(
  /zoomOrigin\?: string; \/\/ Não usaremos mais/,
  'zoomOrigin?: string;\n  scrubVideo?: boolean; // Não usaremos mais'
);

code = code.replace(
  /videoUrl, zoomScale, zoomOrigin \}: SpecialtyRoomProps\) \{/,
  'videoUrl, zoomScale, zoomOrigin, scrubVideo }: SpecialtyRoomProps) {'
);

const scrubLogic = `
    // Scrub video se ativado
    if (scrubVideo && videoUrl) {
      const progressObj = { value: 0 };
      tl.to(progressObj, {
        value: 1,
        ease: "none",
        onUpdate: () => {
          if (mediaRef.current) {
            const vid = mediaRef.current as HTMLVideoElement;
            if (vid.duration) {
              // Pause is enforced by removing autoPlay, but just to be safe:
              if (!vid.paused) vid.pause();
              vid.currentTime = vid.duration * progressObj.value;
            }
          }
        }
      }, 0);
    }

    // Zoom no rosto/busto
`;

code = code.replace(
  /\/\/ Zoom no rosto\/busto do profissional \(centro superior da imagem\)/,
  scrubLogic
);

code = code.replace(
  /autoPlay\s+loop/,
  'autoPlay={!scrubVideo}\n          loop={!scrubVideo}'
);

fs.writeFileSync('src/components/landing/SpecialtyRoom.tsx', code);

// Now update LandingPage.tsx
let landingCode = fs.readFileSync('src/components/landing/LandingPage.tsx', 'utf8');
landingCode = landingCode.replace(
  /title="Psicomotricidade \(Vídeo\)"[\s\S]*?zoomOrigin="50% 50%"/,
  `title="Psicomotricidade (Vídeo)"
          professionalName="Especialista em Ação"
          description="Veja na prática como o corpo e o movimento em harmonia ajudam no desenvolvimento. Nossa sala é preparada para estimular a coordenação motora de forma lúdica."
          videoUrl="/videos/psicomotricidade.mp4"
          zoomScale={1.8}
          zoomOrigin="50% 10%"
          scrubVideo={true}`
);
fs.writeFileSync('src/components/landing/LandingPage.tsx', landingCode);

