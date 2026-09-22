import { useState, useEffect } from 'react';
import { UserPlus, Search, Edit, Trash2, X, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import imageCompression from 'browser-image-compression';

interface MockUser {
  id: string;
  name: string;
  role: 'patient' | 'professional';
  specialty?: string;
  mother_name?: string;
  mother_contact?: string;
  father_name?: string;
  father_contact?: string;
  contact: string; // Contato principal ou do terapeuta
  status: 'active' | 'inactive';
  cpf?: string;
  birthdate?: string;
  therapies?: string[]; // Para pacientes
  avatar_url?: string;
}

// Dados Fictícios Fixos
const initialUsers: MockUser[] = [
  { id: '1', name: 'Lucas Matheus Silva', role: 'patient', mother_name: 'Maria Silva (Mãe)', contact: '(11) 98888-7777', status: 'active', therapies: ['Psicologia', 'Fonoaudiologia'] },
  { id: '2', name: 'Pedro Henrique', role: 'patient', father_name: 'João Henrique (Pai)', contact: '(11) 97777-6666', status: 'active', therapies: ['Terapia Ocupacional'] },
  { id: '3', name: 'Dra. Mariana Costa', role: 'professional', specialty: 'Psicologia', contact: '(11) 96666-5555', status: 'active' },
  { id: '4', name: 'Dr. Roberto Alves', role: 'professional', specialty: 'Fonoaudiologia', contact: '(11) 95555-4444', status: 'active' },
];

export default function GestaoCadastros() {
  const [activeTab, setActiveTab] = useState<'patient' | 'professional'>('patient');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // State for Users fetched from Supabase
  const [dbUsers, setDbUsers] = useState<MockUser[]>([]);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<MockUser>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchDbUsers();
  }, [activeTab]);

  const fetchDbUsers = async () => {
    if (activeTab === 'patient') {
      const { data, error } = await supabase.from('clinic_patients').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        const formatted = data.map(d => ({
          id: d.id,
          name: d.name,
          role: 'patient',
          mother_name: d.mother_name,
          mother_contact: d.mother_contact,
          father_name: d.father_name,
          father_contact: d.father_contact,
          contact: d.contact,
          status: d.status,
          cpf: d.cpf,
          birthdate: d.birthdate,
          therapies: d.therapies,
          avatar_url: d.avatar_url
        } as MockUser));
        setDbUsers(formatted);
      } else if (error) {
        console.warn('Tabela clinic_patients pode não existir ainda:', error);
      }
    } else {
      const { data, error } = await supabase.from('clinic_therapists').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        const formatted = data.map(d => ({
          id: d.id,
          name: d.name,
          role: 'professional',
          specialty: d.specialty,
          contact: d.contact,
          status: d.status,
          cpf: d.cpf,
          avatar_url: d.avatar_url
        } as MockUser));
        setDbUsers(formatted);
      } else if (error) {
        console.warn('Tabela clinic_therapists pode não existir ainda:', error);
      }
    }
  };

  const allUsers = [...initialUsers, ...dbUsers];
  const filteredUsers = allUsers.filter(u => u.role === activeTab && u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este cadastro?')) {
      if (id.length < 10) {
        alert('Os usuários de demonstração (fictícios) não podem ser excluídos. Exclua apenas os que você cadastrou no banco real.');
        return;
      }
      
      if (activeTab === 'patient') {
        await supabase.from('clinic_patients').delete().eq('id', id);
      } else {
        await supabase.from('clinic_therapists').delete().eq('id', id);
      }
      fetchDbUsers();
    }
  };

  const handleEdit = (user: MockUser) => {
    setFormData(user);
    setEditingId(user.id);
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setFormData({ role: activeTab, therapies: [] });
    setEditingId(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      setAvatarFile(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (editingId && editingId.length < 10) {
        alert('Não é possível editar usuários de demonstração. Eles são apenas para visualização.');
        setIsSaving(false);
        return;
      }
      
      let uploadedAvatarUrl = formData.avatar_url;

      if (avatarFile) {
        try {
          const options = {
            maxSizeMB: 0.2,
            maxWidthOrHeight: 800,
            useWebWorker: true
          };
          const compressedFile = await imageCompression(avatarFile, options);
          
          const fileExt = compressedFile.name.split('.').pop() || 'jpg';
          const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, compressedFile);
            
          if (uploadError) throw uploadError;
          
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
            
          uploadedAvatarUrl = publicUrlData.publicUrl;
        } catch (imgError) {
          console.error("Erro ao comprimir/subir imagem:", imgError);
          alert('Houve um erro ao enviar a imagem (verifique se o bucket "avatars" foi criado e está público no Supabase). O cadastro será salvo sem foto.');
        }
      }

      if (editingId) {
        if (activeTab === 'patient') {
          const { error: err1 } = await supabase.from('clinic_patients').update({
            name: formData.name,
            mother_name: formData.mother_name,
            mother_contact: formData.mother_contact,
            father_name: formData.father_name,
            father_contact: formData.father_contact,
            contact: formData.contact,
            cpf: formData.cpf,
            birthdate: formData.birthdate,
            therapies: formData.therapies,
            avatar_url: uploadedAvatarUrl
          }).eq('id', editingId); if (err1) throw err1;
        } else {
          const { error: err2 } = await supabase.from('clinic_therapists').update({
            name: formData.name,
            specialty: formData.specialty,
            contact: formData.contact,
            cpf: formData.cpf,
            avatar_url: uploadedAvatarUrl
          }).eq('id', editingId); if (err2) throw err2;
        }
      } else {
        if (activeTab === 'patient') {
          const { error: err3 } = await supabase.from('clinic_patients').insert([{
            name: formData.name,
            mother_name: formData.mother_name,
            mother_contact: formData.mother_contact,
            father_name: formData.father_name,
            father_contact: formData.father_contact,
            contact: formData.contact,
            cpf: formData.cpf,
            birthdate: formData.birthdate,
            therapies: formData.therapies || [],
            status: 'active',
            avatar_url: uploadedAvatarUrl
          }]); if (err3) throw err3;
        } else {
          const { error: err4 } = await supabase.from('clinic_therapists').insert([{
            name: formData.name,
            specialty: formData.specialty,
            contact: formData.contact,
            cpf: formData.cpf,
            status: 'active',
            avatar_url: uploadedAvatarUrl
          }]); if (err4) throw err4;
        }
      }
      
      setIsModalOpen(false);
      fetchDbUsers();
    } catch (err) {
      console.error("Erro ao salvar:", err);
      const errorMsg = err instanceof Error ? err.message : (err as any)?.message || JSON.stringify(err);
      alert('ERRO DO SUPABASE:\n\n' + errorMsg + '\n\n(Tire um print deste erro e mande para o chat)');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTherapy = (therapy: string) => {
    const currentTherapies = formData.therapies || [];
    if (currentTherapies.includes(therapy)) {
      setFormData({ ...formData, therapies: currentTherapies.filter(t => t !== therapy) });
    } else {
      setFormData({ ...formData, therapies: [...currentTherapies, therapy] });
    }
  };

  const therapyOptions = ['Psicologia', 'Fonoaudiologia', 'Terapia Ocupacional', 'Psicopedagogia', 'Musicoterapia'];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant shadow-sm">
        <div>
          <h2 className="font-display-sm text-3xl font-bold text-on-surface">Gestão de Cadastros</h2>
          <p className="font-body-md text-on-surface-variant mt-1">Gerencie pacientes e terapeutas da clínica.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-md"
        >
          <UserPlus size={20} />
          {activeTab === 'patient' ? 'Novo Paciente' : 'Novo Terapeuta'}
        </button>
      </div>

      {/* CONTROLS (TABS & SEARCH) */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
        <div className="flex bg-surface-variant/30 p-1 rounded-xl w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('patient')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-label-md transition-all ${activeTab === 'patient' ? 'bg-white text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Pacientes
          </button>
          <button 
            onClick={() => setActiveTab('professional')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-label-md transition-all ${activeTab === 'professional' ? 'bg-white text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Terapeutas
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-variant rounded-xl focus:ring-2 focus:ring-primary outline-none font-body-sm"
          />
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-3xl border border-surface-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-surface-variant">
                <th className="font-label-sm font-bold text-on-surface-variant px-6 py-4 uppercase tracking-wider">Nome</th>
                <th className="font-label-sm font-bold text-on-surface-variant px-6 py-4 uppercase tracking-wider">
                  {activeTab === 'patient' ? 'Responsável' : 'Especialidade'}
                </th>
                {activeTab === 'patient' && (
                  <th className="font-label-sm font-bold text-on-surface-variant px-6 py-4 uppercase tracking-wider">Terapias</th>
                )}
                <th className="font-label-sm font-bold text-on-surface-variant px-6 py-4 uppercase tracking-wider">Contato</th>
                <th className="font-label-sm font-bold text-on-surface-variant px-6 py-4 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-surface-variant/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full object-cover shadow-sm border border-surface-variant" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-label-md font-bold text-on-surface">{user.name}</span>
                        {user.id.length < 10 && <span className="text-[10px] text-primary/70 font-medium tracking-wide">DADO FICTÍCIO</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-body-md text-on-surface-variant">
                    {user.role === 'patient' ? (user.mother_name || user.father_name || 'Não informado') : user.specialty}
                  </td>
                  {activeTab === 'patient' && (
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.therapies?.map((t, i) => (
                          <span key={i} className="text-[10px] font-bold px-2 py-0.5 bg-surface-variant text-on-surface-variant rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 font-body-md text-on-surface-variant">{user.contact}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(user)} className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-variant/50">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="p-2 text-on-surface-variant hover:text-error transition-colors rounded-full hover:bg-error-container/50 ml-1">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant font-body-md">
                    Nenhum {activeTab === 'patient' ? 'paciente' : 'terapeuta'} encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-3xl p-6 w-full max-w-[650px] shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full z-10"
              disabled={isSaving}
            >
              <X size={20} />
            </button>
            
            <h3 className="font-display-sm text-xl sm:text-2xl font-bold text-slate-800 mb-6 pr-8">
              {editingId ? 'Editar' : 'Cadastrar Novo'} {activeTab === 'patient' ? 'Paciente' : 'Terapeuta'}
            </h3>
            
            <form className="space-y-6" onSubmit={handleSave}>
              
              {/* ÁREA DE FOTO DE PERFIL */}
              <div className="flex flex-col items-center justify-center mb-6">
                <label className="cursor-pointer group relative">
                  <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden transition-all group-hover:shadow-lg group-hover:border-primary/20">
                    {avatarPreview || formData.avatar_url ? (
                      <img src={avatarPreview || formData.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      <Camera size={32} className="text-slate-300 group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={isSaving} />
                </label>
                <span className="text-xs text-slate-500 mt-2 font-medium">
                  {avatarPreview ? 'Clique para trocar' : 'Adicionar foto'}
                </span>
              </div>

              {/* DADOS GERAIS */}
              <div>
                <h4 className="text-sm font-bold text-primary mb-3 border-b border-surface-variant pb-2">Dados Pessoais</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                    <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: João da Silva" disabled={isSaving} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">CPF</label>
                    <input value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})} type="text" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none" placeholder="000.000.000-00" disabled={isSaving} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Data de Nascimento</label>
                    <input value={formData.birthdate || ''} onChange={e => setFormData({...formData, birthdate: e.target.value})} type="date" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-slate-600" disabled={isSaving} />
                  </div>
                </div>
              </div>

              {activeTab === 'patient' ? (
                <>
                  <div>
                    <h4 className="text-sm font-bold text-primary mb-3 border-b border-surface-variant pb-2">Filiação / Responsáveis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Mãe (ou Resp.)</label>
                        <input value={formData.mother_name || ''} onChange={e => setFormData({...formData, mother_name: e.target.value})} type="text" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none" disabled={isSaving} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Telefone da Mãe/Resp.</label>
                        <input value={formData.mother_contact || ''} onChange={e => setFormData({...formData, mother_contact: e.target.value})} type="text" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none" placeholder="(00) 00000-0000" disabled={isSaving} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Pai</label>
                        <input value={formData.father_name || ''} onChange={e => setFormData({...formData, father_name: e.target.value})} type="text" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none" disabled={isSaving} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Telefone do Pai</label>
                        <input value={formData.father_contact || ''} onChange={e => setFormData({...formData, father_contact: e.target.value})} type="text" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none" placeholder="(00) 00000-0000" disabled={isSaving} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Outro Contato / Fixo</label>
                        <input value={formData.contact || ''} onChange={e => setFormData({...formData, contact: e.target.value})} type="text" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none" placeholder="(00) 00000-0000" disabled={isSaving} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-primary mb-3 border-b border-surface-variant pb-2">Terapias Indicadas</h4>
                    <div className="flex flex-wrap gap-2">
                      {therapyOptions.map(therapy => {
                        const isSelected = formData.therapies?.includes(therapy);
                        return (
                          <button
                            key={therapy}
                            type="button"
                            disabled={isSaving}
                            onClick={() => toggleTherapy(therapy)}
                            className={`px-3 py-1.5 rounded-full text-sm font-bold border transition-colors ${
                              isSelected 
                                ? 'bg-primary text-white border-primary shadow-sm' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
                            } disabled:opacity-50`}
                          >
                            {therapy}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      As terapias selecionadas direcionarão o paciente automaticamente para a lista dos respectivos profissionais.
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <h4 className="text-sm font-bold text-primary mb-3 border-b border-surface-variant pb-2">Dados Profissionais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Especialidade</label>
                      <select required value={formData.specialty || ''} onChange={e => setFormData({...formData, specialty: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-slate-600 appearance-none" disabled={isSaving}>
                        <option value="">Selecione...</option>
                        {therapyOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Registro (CRM/CRP/etc)</label>
                      <input type="text" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: CRP 00/00000" disabled={isSaving} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Celular (Contato)</label>
                      <input required value={formData.contact || ''} onChange={e => setFormData({...formData, contact: e.target.value})} type="text" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none" placeholder="(00) 00000-0000" disabled={isSaving} />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-3 sm:py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors" disabled={isSaving}>
                  Cancelar
                </button>
                <button type="submit" className="w-full sm:w-auto px-8 py-3 sm:py-2.5 font-bold bg-primary text-white hover:bg-primary/90 rounded-xl shadow-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Salvando...
                    </>
                  ) : (
                    editingId ? 'Atualizar Cadastro' : 'Salvar no Banco'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
