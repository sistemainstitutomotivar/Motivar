const fs = require('fs');
const file = 'src/components/landing/LandingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const newRoom = `
        <SpecialtyRoom 
          title="Psicomotricidade (Vídeo)"
          professionalName="Especialista em Ação"
          description="Veja na prática como o corpo e o movimento em harmonia ajudam no desenvolvimento. Nossa sala é preparada para estimular a coordenação motora de forma lúdica."
          videoUrl="/videos/psicomotricidade.mp4"
          zoomScale={1.5}
          zoomOrigin="50% 50%"
        />
`;

// Insert after the first Psicomotricidade block
code = code.replace(
  /(<SpecialtyRoom\s*title="Psicomotricidade"[\s\S]*?\/>)/,
  '$1\n' + newRoom
);

fs.writeFileSync(file, code);
