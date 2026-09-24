import re

# 1. Fix GestaoCadastros.tsx
with open('src/components/dashboard/GestaoCadastros.tsx', 'r') as f:
    text = f.read()

# Fix import
text = text.replace("import { getSpecialties, Specialty } from '../../lib/specialties';", "import { getSpecialties } from '../../lib/specialties';\nimport type { Specialty } from '../../lib/specialties';")

# Add council_number to MockUser
text = text.replace("specialty?: string; // Para terapeutas", "specialty?: string; // Para terapeutas\n  council_number?: string;")

with open('src/components/dashboard/GestaoCadastros.tsx', 'w') as f:
    f.write(text)

# 2. Fix ConfiguracoesClinica.tsx
with open('src/components/dashboard/ConfiguracoesClinica.tsx', 'r') as f:
    text2 = f.read()

# Fix import
text2 = text2.replace("import { getSpecialties, createSpecialty, deleteSpecialty, Specialty } from '../../lib/specialties';", "import { getSpecialties, createSpecialty, deleteSpecialty } from '../../lib/specialties';\nimport type { Specialty } from '../../lib/specialties';")

# Insert Tab button
if "Especialidades" not in text2:
    button_regex = r"(onClick=\{\(\) => setActiveTab\('auditoria'\)\}.*?</button>)"
    new_button = r"""\1
          <button 
            onClick={() => setActiveTab('especialidades')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 flex-1 py-4 font-bold border-b-2 transition-colors ${
              activeTab === 'especialidades' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Stethoscope size={20} />
            <span>Especialidades</span>
          </button>"""
    text2 = re.sub(button_regex, new_button, text2, flags=re.DOTALL)

    # Insert Tab content
    content_regex = r"(\{activeTab === 'auditoria' && \(.*?</div\>\n      \)\})"
    
    new_content = r"""\1
      {activeTab === 'especialidades' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Stethoscope size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Especialidades e Terapias</h3>
              <p className="text-sm text-slate-500">Gerencie as especialidades que aparecerão no cadastro de terapeutas e agendamentos.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <input 
              type="text" 
              value={newSpec}
              onChange={(e) => setNewSpec(e.target.value)}
              placeholder="Nova especialidade (ex: Neuropsicologia)"
              className="flex-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAddSpec()}
            />
            <button 
              onClick={handleAddSpec}
              className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Adicionar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {specialties.map(spec => (
              <div key={spec.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-700">{spec.name}</span>
                <button 
                  onClick={() => handleDelSpec(spec.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remover especialidade"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
"""
    text2 = re.sub(content_regex, new_content, text2, flags=re.DOTALL)

with open('src/components/dashboard/ConfiguracoesClinica.tsx', 'w') as f:
    f.write(text2)
