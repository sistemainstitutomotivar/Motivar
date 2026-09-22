const fs = require('fs');
const file = 'src/components/dashboard/GestaoCadastros.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /alert\('ERRO DO SUPABASE:\\n\\n' \+ \(err\.message \|\| JSON\.stringify\(err\)\) \+ '\\n\\n\(Tire um print deste erro e mande para o chat\)'\);/,
  "const errorMsg = err instanceof Error ? err.message : (err as any)?.message || JSON.stringify(err);\n      alert('ERRO DO SUPABASE:\\n\\n' + errorMsg + '\\n\\n(Tire um print deste erro e mande para o chat)');"
);

fs.writeFileSync(file, code);
