import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, User, Shield, Save, Lock, Loader2, Fingerprint, CheckCircle, Smartphone } from 'lucide-react';
import { showAlert } from '../../lib/customAlert';

interface PatientProfileModalProps {
  onClose: () => void;
}

export default function PatientProfileModal({ onClose }: PatientProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile Data
  const [profileId, setProfileId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    mother_name: '',
    mother_contact: '',
    father_name: '',
    father_contact: '',
    cpf: '',
    email: ''
  });

  // Security Data
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      const { data } = await supabase
        .from('clinic_patients')
        .select('*')
        .eq('email', user.email)
        .single();

      if (data) {
        setProfileId(data.id);
        setFormData({
          name: data.name || '',
          mother_name: data.mother_name || '',
          mother_contact: data.mother_contact || '',
          father_name: data.father_name || '',
          father_contact: data.father_contact || '',
          cpf: data.cpf || '',
          email: data.email || user.email
        });
      } else {
        setFormData(prev => ({ ...prev, email: user.email || '' }));
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clinic_patients')
        .update({
          mother_name: formData.mother_name,
          mother_contact: formData.mother_contact,
          father_name: formData.father_name,
          father_contact: formData.father_contact,
          cpf: formData.cpf
        })
        .eq('id', profileId);

      if (error) throw error;
      showAlert('Sucesso', 'Seus dados foram atualizados com sucesso.', 'success');
    } catch (err) {
      console.error(err);
      showAlert('Erro', 'Ocorreu um erro ao atualizar os dados.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      showAlert('Aviso', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Aviso', 'As senhas não conferem.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      showAlert('Sucesso', 'Senha alterada com sucesso!', 'success');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      showAlert('Erro', 'Não foi possível alterar a senha.');
    } finally {
      setSaving(false);
    }
  };

  const handleBiometrics = () => {
    showAlert(
      'Configurar Biometria',
      'O suporte ao WebAuthn (Face ID / Digital) exige a configuração de segurança avançada no seu aparelho. O assistente de configuração será aberto na próxima versão do aplicativo.'
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-end">
      <div className="bg-[#fff8f7] w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* HEADER */}
        <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-rose-100 shadow-sm shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Meus Dados</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-primary flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* TABS */}
        <div className="flex p-4 gap-2 shrink-0 bg-white border-b border-rose-50">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'profile' 
                ? 'bg-primary text-white shadow-md shadow-primary/20' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <User size={18} /> Perfil
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'security' 
                ? 'bg-primary text-white shadow-md shadow-primary/20' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Shield size={18} /> Segurança
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 space-y-4">
                    <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                      <User className="text-primary w-5 h-5" /> Dados do Paciente
                    </h3>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome Completo</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        disabled
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium cursor-not-allowed"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">O nome do paciente só pode ser alterado pela clínica.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">CPF</label>
                      <input 
                        type="text" 
                        value={formData.cpf}
                        onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 space-y-4">
                    <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                      <Smartphone className="text-blue-500 w-5 h-5" /> Contatos Responsáveis
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome da Mãe</label>
                        <input 
                          type="text" 
                          value={formData.mother_name}
                          onChange={e => setFormData({ ...formData, mother_name: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">WhatsApp (Mãe)</label>
                        <input 
                          type="text" 
                          value={formData.mother_contact}
                          onChange={e => setFormData({ ...formData, mother_contact: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome do Pai</label>
                        <input 
                          type="text" 
                          value={formData.father_name}
                          onChange={e => setFormData({ ...formData, father_name: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">WhatsApp (Pai)</label>
                        <input 
                          type="text" 
                          value={formData.father_contact}
                          onChange={e => setFormData({ ...formData, father_contact: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Salvar Alterações
                  </button>
                </form>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  
                  {/* BIOMETRIA */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Fingerprint className="w-32 h-32 text-white" />
                    </div>
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/10">
                        <Fingerprint className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="font-bold text-white text-xl mb-2">Entrar com Biometria</h3>
                      <p className="text-slate-300 text-sm mb-6 leading-relaxed max-w-[280px]">
                        Acesse o sistema usando o Face ID ou Leitor de Digital do seu celular, sem precisar digitar senhas.
                      </p>
                      <button 
                        onClick={handleBiometrics}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Configurar agora
                      </button>
                    </div>
                  </div>

                  {/* SENHA */}
                  <form onSubmit={handleUpdatePassword} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                    <h3 className="font-bold text-slate-800 text-lg mb-2 flex items-center gap-2">
                      <Lock className="text-slate-400 w-5 h-5" /> Alterar Senha
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Defina uma nova senha para usar caso você não acesse com biometria.
                    </p>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nova Senha</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Mínimo de 6 caracteres"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Confirmar Senha</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Digite novamente"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={saving || !password}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Atualizar Senha'}
                    </button>
                  </form>
                  
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
