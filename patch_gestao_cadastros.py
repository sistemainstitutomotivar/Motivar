import re

with open('src/components/dashboard/GestaoCadastros.tsx', 'r') as f:
    content = f.read()

# 1. Add secondary supabase client at the top
if "const authSupabase =" not in content:
    imports_end = content.find("export default function")
    client_code = """
import { createClient } from '@supabase/supabase-js';

const authSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

"""
    content = content[:imports_end] + client_code + content[imports_end:]

# 2. Add handleGenerateAccess inside the component
if "const handleGenerateAccess =" not in content:
    hook_end = content.find("const handleImageUpload =")
    handler_code = """
  const handleGenerateAccess = async () => {
    if (!formData.email) {
       showAlert('Aviso', 'Preencha o e-mail do colaborador primeiro para poder gerar a senha.');
       return;
    }
    
    const tempPin = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    
    try {
      const { data, error } = await authSupabase.auth.signUp({
        email: formData.email,
        password: tempPin,
        options: {
          data: {
            full_name: formData.name,
            role: activeTab === 'professional' ? 'professional' : 'secretary'
          }
        }
      });

      if (error) {
         if (error.message.includes('already registered')) {
            showAlert('Aviso', 'Este usuário já possui acesso. Se ele esqueceu a senha, ele deve usar a opção "Esqueceu a senha" na tela de login.');
         } else {
            throw error;
         }
         return;
      }

      showAlert('Sucesso', `Acesso gerado com sucesso!\\n\\nE-mail: ${formData.email}\\nSenha Temporária: ${tempPin}\\n\\nCopie essa senha e envie para o colaborador.`);
    } catch(err: any) {
       showAlert('Erro', 'Erro ao gerar acesso: ' + err.message);
    }
  };

"""
    content = content[:hook_end] + handler_code + content[hook_end:]

# 3. Replace the email input with the new layout
email_regex = r"(<label className=\"block text-sm font-bold text-slate-700 mb-1\">E-mail de Acesso ao Sistema</label>\s*<input[^>]+>)"
# Actually, let's match the exact block:
old_input = """<label className="block text-sm font-bold text-slate-700 mb-1">E-mail de Acesso ao Sistema</label>
                    <input 
                      type="email" 
                      value={formData.email || ''} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="secretaria@institutomotivar.com.br"
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                    />"""

new_input = """<label className="block text-sm font-bold text-slate-700 mb-1">E-mail de Acesso ao Sistema</label>
                    <div className="flex gap-2">
                      <input 
                        type="email" 
                        value={formData.email || ''} 
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="secretaria@institutomotivar.com.br"
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                      />
                      <button 
                        type="button"
                        onClick={handleGenerateAccess}
                        className="px-4 py-3 bg-slate-800 text-white font-bold rounded-xl whitespace-nowrap hover:bg-slate-700 transition-colors"
                      >
                        Gerar Acesso
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Gere uma senha temporária (PIN) para este colaborador acessar o sistema.</p>"""

content = content.replace(old_input, new_input)

with open('src/components/dashboard/GestaoCadastros.tsx', 'w') as f:
    f.write(content)

print("GestaoCadastros.tsx patched.")
