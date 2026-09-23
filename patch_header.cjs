const fs = require('fs');
const file = 'src/components/landing/Header.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace standard imports and add useEffect, LogIn
code = code.replace(
  /import \{ useState \} from 'react';/,
  "import { useState, useEffect } from 'react';\nimport { LogIn } from 'lucide-react';"
);

// Add scroll logic state
const scrollLogic = `
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
`;

code = code.replace(
  /const \[isLoginOpen, setIsLoginOpen\] = useState\(false\);/,
  'const [isLoginOpen, setIsLoginOpen] = useState(false);\n' + scrollLogic
);

// Update classes for visibility
code = code.replace(
  /className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center transition-all duration-300 bg-white\/70 backdrop-blur-md border-b border-white\/20"/,
  'className={`fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center transition-transform duration-300 bg-white/70 backdrop-blur-md border-b border-white/20 ${isVisible ? \'translate-y-0\' : \'-translate-y-full\'}`}'
);

// Fix the icon
code = code.replace(
  /<span className="material-symbols-outlined text-\[18px\]">login<\/span>/,
  '<LogIn size={18} />'
);

fs.writeFileSync(file, code);
