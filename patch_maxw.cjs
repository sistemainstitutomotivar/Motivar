const fs = require('fs');

function patch(file) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/className="font-body-md text-on-surface-variant max-w-sm mt-2"/g, 'className="font-body-md text-on-surface-variant w-full max-w-[384px] mx-auto px-4 mt-2"');
    code = code.replace(/className="font-body-md text-slate-500 max-w-sm"/g, 'className="font-body-md text-slate-500 w-full max-w-[384px] mx-auto px-4 mt-2"');
    fs.writeFileSync(file, code);
    console.log("Patched", file);
  }
}

patch('src/components/dashboard/GestaoAgenda.tsx');
patch('src/components/dashboard/TherapistDashboard.tsx');
