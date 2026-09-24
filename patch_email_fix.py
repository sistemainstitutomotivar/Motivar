import re

with open('src/components/dashboard/GestaoCadastros.tsx', 'r') as f:
    text = f.read()

email_field = """              {/* EMAIL DO PACIENTE */}
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

              {/* CPF */}"""

text = text.replace("{/* CPF */}", email_field)

with open('src/components/dashboard/GestaoCadastros.tsx', 'w') as f:
    f.write(text)
