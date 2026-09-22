const fs = require('fs');
const file = 'src/components/landing/SpecialtyRoom.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /videoUrl\?: string;\n  reverse\?: boolean;/g,
  "videoUrl?: string;\n  reverse?: boolean;\n  zoomScale?: number;\n  zoomOrigin?: string;"
);

code = code.replace(
  /export default function SpecialtyRoom\(\{ title, professionalName, description, imageUrl, videoUrl \}: SpecialtyRoomProps\) \{/g,
  "export default function SpecialtyRoom({ title, professionalName, description, imageUrl, videoUrl, zoomScale, zoomOrigin }: SpecialtyRoomProps) {"
);

code = code.replace(
  /scale: 1\.6,\n      transformOrigin: "50% 25%",/g,
  "scale: zoomScale || 1.8,\n      transformOrigin: zoomOrigin || \"50% 25%\","
);

fs.writeFileSync(file, code);
