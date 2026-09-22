const fs = require('fs');
const file = 'src/components/landing/LandingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const newRoom = `
        <SpecialtyRoom 
          title="Psicomotricidade"
          professionalName="Especialista"
          description="O corpo e o movimento em harmonia. Nossa sala é preparada para estimular a coordenação motora, o equilíbrio e a consciência corporal, essenciais para o desenvolvimento global."
          imageUrl="/images/psicomoticidade.jpeg"
          zoomScale={2.2}
          zoomOrigin="50% 30%"
        />
`;

code = code.replace(
  /<div id="especialidades">/,
  '<div id="especialidades">\n' + newRoom
);

fs.writeFileSync(file, code);
