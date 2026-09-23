const fs = require('fs');
const file = 'src/components/landing/LandingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /imageUrl="\/images\/psicomoticidade\.jpeg"/g,
  'imageUrl="/images/Psicomoticidade.jpeg"'
);

fs.writeFileSync(file, code);
