import re

with open('src/components/dashboard/GestaoCadastros.tsx', 'r') as f:
    text = f.read()

# 1. Add imports
import_statement = "import { getSpecialties, Specialty } from '../../lib/specialties';\nimport { formatCPF } from '../../lib/utils';\n"
text = re.sub(r"(import .*? from 'lucide-react';)", r"\1\n" + import_statement, text)

# 2. Add state
state_statement = "  const [specialties, setSpecialties] = useState<Specialty[]>([]);\n  const [loadingSpecs, setLoadingSpecs] = useState(true);\n\n  useEffect(() => {\n    getSpecialties().then(data => {\n      setSpecialties(data);\n      setLoadingSpecs(false);\n    });\n  }, []);\n"
text = re.sub(r"(const \[activeTab, setActiveTab\].*?;)", r"\1\n" + state_statement, text)

# 3. Replace therapyOptions map
text = re.sub(r"\{therapyOptions\.map\(opt => \(\n\s*<option key=\{opt\} value=\{opt\}>\{opt\}</option>\n\s*\)\)\}",
              r"{specialties.map(opt => (\n                        <option key={opt.id} value={opt.name}>{opt.name}</option>\n                      ))}", text)

# 4. Modify Therapist form to add council_number
therapist_form_regex = r"(<label className=\"block text-sm font-bold text-slate-700 mb-1\">Especialidade Principal \*</label>\s*<select\s*value=\{formData\.specialty \|\| 'Psicologia'\}\s*onChange=\{\(e\) => setFormData\(\{ \.\.\.formData, specialty: e\.target\.value \}\)\}\s*className=\"w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none\"\s*>\s*\{specialties\.map\(opt => \(\n\s*<option key=\{opt\.id\} value=\{opt\.name\}>\{opt\.name\}</option>\n\s*\)\)\}\s*</select>\s*</div>)"

new_therapist_fields = r"""\1
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Número do Conselho (CRM, CRP, etc)</label>
                    <input 
                      type="text" 
                      value={formData.council_number || ''} 
                      onChange={(e) => setFormData({ ...formData, council_number: e.target.value })}
                      placeholder="Ex: CRP 12345/SP"
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>"""

text = re.sub(therapist_form_regex, new_therapist_fields, text, flags=re.DOTALL)

# Let's adjust the grid columns for the therapist form since we added a field
# find: {activeTab === 'professional' && (\n                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
text = text.replace("{activeTab === 'professional' && (\n                <div className=\"grid grid-cols-1 sm:grid-cols-2 gap-4\">",
                    "{activeTab === 'professional' && (\n                <div className=\"grid grid-cols-1 sm:grid-cols-3 gap-4\">")

# 5. Mask CPF in GestaoCadastros.tsx
text = text.replace("onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}",
                    "onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}")

# Make sure to pass council_number in backend functions inside handleSave
text = text.replace("contact: formData.contact,", "contact: formData.contact,\n          council_number: formData.council_number,")

with open('src/components/dashboard/GestaoCadastros.tsx', 'w') as f:
    f.write(text)
