const fs = require('fs');
const file = 'src/components/dashboard/GestaoCadastros.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /editingId \? 'Atualizar Cadastro' \: 'Salvar no Banco'/g,
  "editingId ? 'Atualizar Cadastro' : 'Salvar'"
);

fs.writeFileSync(file, code);
