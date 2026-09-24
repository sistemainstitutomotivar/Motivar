import re

with open('src/components/dashboard/GestaoCadastros.tsx', 'r') as f:
    text = f.read()

# Add Email field to Patient Form
# We'll find CPF field and insert Email before it
cpf_section = r"(              \{\/\* CPF \*\/\}\n              <div className=\"grid grid-cols-1 sm:grid-cols-2 gap-4\">)"

email_field = r"""              {/* EMAIL DO PACIENTE */}
              {activeTab === 'patient' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">E-mail de Contato (Acesso do Paciente) *</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email || ''} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="paciente@email.com"
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">Este e-mail será usado pelo paciente para acessar a agenda.</p>
                </div>
              )}

\1"""

text = re.sub(cpf_section, email_field, text)

# Also ensure formData.email is saved for patients
# Wait, let's check if email is saved in handleSave
# line 271: if (editingId) {
# line 274: await supabase.from('clinic_patients').update({ ... })
# line 290: await supabase.from('clinic_patients').insert([{ ... }])

# Let's use regex to add email to update and insert
text = re.sub(r"(contact: formData\.contact \|\| formData\.mother_contact \|\| '',\n\s*cpf: formData\.cpf,)", r"\1\n            email: formData.email,", text)

with open('src/components/dashboard/GestaoCadastros.tsx', 'w') as f:
    f.write(text)
