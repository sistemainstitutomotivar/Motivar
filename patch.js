const fs = require('fs');
const file = 'src/components/dashboard/GestaoCadastros.tsx';
let code = fs.readFileSync(file, 'utf8');

// replace await supabase.from(...).insert with const { error } = await ...; if (error) throw error;
code = code.replace(
  /await supabase\.from\('clinic_patients'\)\.update\(([\s\S]*?)\)\.eq\('id', editingId\);/,
  "const { error: err1 } = await supabase.from('clinic_patients').update($1).eq('id', editingId); if (err1) throw err1;"
);

code = code.replace(
  /await supabase\.from\('clinic_therapists'\)\.update\(([\s\S]*?)\)\.eq\('id', editingId\);/,
  "const { error: err2 } = await supabase.from('clinic_therapists').update($1).eq('id', editingId); if (err2) throw err2;"
);

code = code.replace(
  /await supabase\.from\('clinic_patients'\)\.insert\(\[\{([\s\S]*?)\}\]\);/,
  "const { error: err3 } = await supabase.from('clinic_patients').insert([{$1}]); if (err3) throw err3;"
);

code = code.replace(
  /await supabase\.from\('clinic_therapists'\)\.insert\(\[\{([\s\S]*?)\}\]\);/,
  "const { error: err4 } = await supabase.from('clinic_therapists').insert([{$1}]); if (err4) throw err4;"
);

code = code.replace(
  /alert\('Erro ao salvar o cadastro. Verifique se as tabelas existem no Supabase.'\);/,
  "alert('Erro do Banco de Dados: ' + (err.message || JSON.stringify(err)) + '\\n\\nVocê rodou o script SQL de criação das tabelas no Supabase?');"
);

fs.writeFileSync(file, code);
