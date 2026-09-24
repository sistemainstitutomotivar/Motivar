import re

with open('src/components/dashboard/ConfiguracoesClinica.tsx', 'r') as f:
    text = f.read()

# 1. Imports
import_statement = "import { getSpecialties, createSpecialty, deleteSpecialty, Specialty } from '../../lib/specialties';\nimport { Stethoscope, Trash2 } from 'lucide-react';\n"
text = re.sub(r"(import type \{ AuditLogEntry \} from '\.\.\/\.\.\/lib\/audit';)", r"\1\n" + import_statement, text)

# 2. activeTab
text = text.replace("useState<'dados' | 'horarios' | 'auditoria'>('dados')", "useState<'dados' | 'horarios' | 'auditoria' | 'especialidades'>('dados')")

# 3. State & Fetch
state_code = """
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [newSpec, setNewSpec] = useState('');
  
  useEffect(() => {
    getSpecialties().then(setSpecialties);
  }, []);
  
  const handleAddSpec = async () => {
    if (!newSpec.trim()) return;
    const added = await createSpecialty(newSpec.trim());
    setSpecialties(prev => [...prev, added].sort((a,b) => a.name.localeCompare(b.name)));
    setNewSpec('');
  };
  
  const handleDelSpec = async (id: string) => {
    await deleteSpecialty(id);
    setSpecialties(prev => prev.filter(s => s.id !== id));
  };
"""
text = re.sub(r"(const \[activeTab.*?;\n)", r"\1" + state_code, text)

# 4. Tab Button
tab_button = """
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
          </button>
"""
text = text.replace("        </div>\n      </div>\n\n      {/* TAB CONTENT */}", tab_button + "        </div>\n      </div>\n\n      {/* TAB CONTENT */}")

# 5. Tab Content
tab_content = """
      {/* ESPECIALIDADES */}
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
text = text.replace("{/* TAB CONTENT */}", "{/* TAB CONTENT */}\n" + tab_content)

with open('src/components/dashboard/ConfiguracoesClinica.tsx', 'w') as f:
    f.write(text)
