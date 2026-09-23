const fs = require('fs');
const file = 'src/components/landing/LandingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /zoomOrigin="50% -15%"/g,
  'zoomOrigin="50% 0%"'
);

code = code.replace(
  /zoomOrigin="50% 10%"/g,
  'zoomOrigin="50% 0%"'
);

fs.writeFileSync(file, code);
