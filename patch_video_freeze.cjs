const fs = require('fs');
const file = 'src/components/landing/SpecialtyRoom.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldScrubLogic = `    // Scrub video se ativado
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
    }`;

const newScrubLogic = `    // Scrub video se ativado com proteção contra travamento (Debounce Seek)
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
    }`;

code = code.replace(oldScrubLogic, newScrubLogic);

fs.writeFileSync(file, code);
