import { useState, useEffect } from 'react';
import { UserPlus, Search, Edit, Trash2, X, Camera, ShieldCheck, UserCheck, Briefcase } from 'lucide-react';
import { getSpecialties } from '../../lib/specialties';
import type { Specialty } from '../../lib/specialties';
import { formatCPF } from '../../lib/utils';

import { supabase } from '../../lib/supabase';
import { logAuditEvent } from '../../lib/audit';
import imageCompression from 'browser-image-compression';

interface MockUser {
  id: string;
  name: string;
  role: 'patient' | 'professional' | 'collaborator';
  specialty?: string; // Para terapeutas
  council_number?: string;
  position?: string; // Para colaboradores (Secretária, Recepção, etc.)
  email?: string;
  mother_name?: string;
  mother_contact?: string;
  father_name?: string;
  father_contact?: string;
  contact: string; // Contato principal
  status: 'active' | 'inactive';
  cpf?: string;
  birthdate?: string;
  therapies?: string[]; // Para pacientes
  avatar_url?: string;
  // Convênio ou Particular
  payment_type?: 'particular' | 'convenio';
  insurance_name?: string;
  insurance_number?: string;
}

// Dados Fictícios Iniciais
const initialUsers: MockUser[] = [
  { id: '1', name: 'Lucas Matheus Silva', role: 'patient', mother_name: 'Maria Silva (Mãe)', contact: '(11) 98888-7777', status: 'active', therapies: ['Psicologia', 'Fonoaudiologia'], payment_type: 'particular' },
  { id: '2', name: 'Pedro Henrique', role: 'patient', father_name: 'João Henrique (Pai)', contact: '(11) 97777-6666', status: 'active', therapies: ['Terapia Ocupacional'], payment_type: 'convenio', insurance_name: 'Unimed' },
  { id: '3', name: 'Dra. Mariana Costa', role: 'professional', specialty: 'Psicologia', contact: '(11) 96666-5555', status: 'active' },
  { id: '4', name: 'Dr. Roberto Alves', role: 'professional', specialty: 'Fonoaudiologia', contact: '(11) 95555-4444', status: 'active' },
  { id: 'staff-1', name: 'Camila Albuquerque', role: 'collaborator', position: 'Secretária Geral & Recepção', email: 'secretaria@institutomotivar.com.br', contact: '(11) 94444-2222', status: 'active' },
];

export default function GestaoCadastros() {
  const [activeTab, setActiveTab] = useState<'patient' | 'professional' | 'collaborator'>('patient');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  

  useEffect(() => {
    getSpecialties().then(data => {
      setSpecialties(data);
      
    });
  }, []);

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

  const mapPatientRecord = (d: any): MockUser => ({
    id: d.id,
    name: d.name,
    role: 'patient',
    mother_name: d.mother_name,
    mother_contact: d.mother_contact,
    father_name: d.father_name,
    father_contact: d.father_contact,
    contact: d.contact || d.mother_contact || d.father_contact || '',
    status: d.status || 'active',
    cpf: d.cpf,
    birthdate: d.birthdate,
    therapies: d.therapies || [],
    avatar_url: d.avatar_url,
    payment_type: d.payment_type || 'particular',
    insurance_name: d.insurance_name,
    insurance_number: d.insurance_number,
  });

  const fetchDbUsers = async () => {
    try {
      if (activeTab === 'patient') {
        const { data, error } = await supabase
          .from('clinic_patients')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Tentando busca sem ordenação de created_at:', error.message);
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('clinic_patients')
            .select('*');
          if (fallbackData && !fallbackError) {
            setDbUsers(fallbackData.map(mapPatientRecord));
          } else {
            console.error('Erro definitivo ao buscar clinic_patients:', fallbackError);
          }
        } else if (data) {
          setDbUsers(data.map(mapPatientRecord));
        }
      } else if (activeTab === 'professional') {
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
      } else {
        // Colaboradores / Secretária
        const { data, error } = await supabase.from('clinic_staff').select('*').order('created_at', { ascending: false });
        if (data && !error) {
          const formatted = data.map(d => ({
            id: d.id,
            name: d.name,
            role: 'collaborator',
            position: d.position,
            email: d.email,
            contact: d.contact,
            status: d.status,
            cpf: d.cpf,
            avatar_url: d.avatar_url
          } as MockUser));
          setDbUsers(formatted);
        } else if (error) {
          console.warn('Tabela clinic_staff pode não existir ainda:', error);
        }
      }
    } catch (err) {
      console.error('Exceção ao buscar cadastros:', err);
    }
  };

  const allUsers = [...initialUsers, ...dbUsers];
  const filteredUsers = allUsers.filter(u => u.role === activeTab && (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDelete = async (id: string) => {
    const userToDelete = allUsers.find(u => u.id === id);
    if (!window.confirm(`Tem certeza que deseja remover o cadastro de "${userToDelete?.name || 'este registro'}"?`)) {
      return;
    }

    if (id.length < 10) {
      alert('Os usuários de demonstração (fictícios) não podem ser excluídos. Exclua apenas os que você cadastrou no banco real.');
      return;
    }
    
    try {
      if (activeTab === 'patient') {
        await supabase.from('clinic_patients').delete().eq('id', id);
      } else if (activeTab === 'professional') {
        await supabase.from('clinic_therapists').delete().eq('id', id);
      } else {
        await supabase.from('clinic_staff').delete().eq('id', id);
      }

      // Registra Auditoria de Exclusão
      await logAuditEvent({
        action: 'EXCLUSAO',
        entity_type: activeTab === 'patient' ? 'paciente' : activeTab === 'professional' ? 'terapeuta' : 'colaborador',
        entity_id: id,
        entity_name: userToDelete?.name || 'Registro removido',
        details: {
          id,
          tipo: activeTab,
          dados_anteriores: userToDelete
        }
      });

      alert('Cadastro removido com sucesso e registrado na trilha de auditoria.');
      fetchDbUsers();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir o cadastro.');
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
    setFormData({ 
      role: activeTab, 
      therapies: [],
      status: 'active',
      payment_type: 'particular',
      position: activeTab === 'collaborator' ? 'Secretária' : undefined 
    });
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
          alert('Houve um erro ao enviar a imagem (verifique se o bucket "avatars" está público no Supabase). O cadastro será salvo sem foto.');
        }
      }

      if (editingId) {
        // EDIÇÃO
        if (activeTab === 'patient') {
          const { error: err1 } = await supabase.from('clinic_patients').update({
            name: formData.name,
            mother_name: formData.mother_name,
            mother_contact: formData.mother_contact,
            father_name: formData.father_name,
            father_contact: formData.father_contact,
            contact: formData.contact || formData.mother_contact || '',
            cpf: formData.cpf,
            email: formData.email,
            birthdate: formData.birthdate,
            therapies: formData.therapies,
            avatar_url: uploadedAvatarUrl,
            payment_type: formData.payment_type || 'particular',
            insurance_name: formData.payment_type === 'convenio' ? formData.insurance_name : null,
            insurance_number: formData.payment_type === 'convenio' ? formData.insurance_number : null
          }).eq('id', editingId); 
          if (err1) throw err1;
        } else if (activeTab === 'professional') {
          const { error: err2 } = await supabase.from('clinic_therapists').update({
            name: formData.name,
            specialty: formData.specialty,
            contact: formData.contact,
          council_number: formData.council_number,
            cpf: formData.cpf,
            avatar_url: uploadedAvatarUrl
          }).eq('id', editingId); 
          if (err2) throw err2;
        } else {
          const { error: errStaff } = await supabase.from('clinic_staff').update({
            name: formData.name,
            position: formData.position || 'Secretária',
            email: formData.email,
            contact: formData.contact,
          council_number: formData.council_number,
            cpf: formData.cpf,
            avatar_url: uploadedAvatarUrl
          }).eq('id', editingId);
          if (errStaff) throw errStaff;
        }

        // Log de Auditoria: EDICAO
        await logAuditEvent({
          action: 'EDICAO',
          entity_type: activeTab === 'patient' ? 'paciente' : activeTab === 'professional' ? 'terapeuta' : 'colaborador',
          entity_id: editingId,
          entity_name: formData.name || 'Registro',
          details: { ...formData, avatar_url: uploadedAvatarUrl }
        });

      } else {
        // CRIAÇÃO
        let newRecordId: string | undefined = undefined;

        if (activeTab === 'patient') {
          const { data, error: err3 } = await supabase.from('clinic_patients').insert([{
            name: formData.name,
            mother_name: formData.mother_name,
            mother_contact: formData.mother_contact,
            father_name: formData.father_name,
            father_contact: formData.father_contact,
            contact: formData.contact || formData.mother_contact || '',
            cpf: formData.cpf,
            email: formData.email,
            birthdate: formData.birthdate,
            therapies: formData.therapies || [],
            status: 'active',
            avatar_url: uploadedAvatarUrl,
            payment_type: formData.payment_type || 'particular',
            insurance_name: formData.payment_type === 'convenio' ? formData.insurance_name : null,
            insurance_number: formData.payment_type === 'convenio' ? formData.insurance_number : null
          }]).select(); 
          if (err3) throw err3;
          newRecordId = data?.[0]?.id;
        } else if (activeTab === 'professional') {
          const { data, error: err4 } = await supabase.from('clinic_therapists').insert([{
            name: formData.name,
            specialty: formData.specialty,
            contact: formData.contact,
          council_number: formData.council_number,
            cpf: formData.cpf,
            status: 'active',
            avatar_url: uploadedAvatarUrl
          }]).select(); 
          if (err4) throw err4;
          newRecordId = data?.[0]?.id;
        } else {
          const { data, error: errStaffInsert } = await supabase.from('clinic_staff').insert([{
            name: formData.name,
            position: formData.position || 'Secretária',
            email: formData.email,
            contact: formData.contact,
          council_number: formData.council_number,
            cpf: formData.cpf,
            status: 'active',
            avatar_url: uploadedAvatarUrl
          }]).select();
          if (errStaffInsert) throw errStaffInsert;
          newRecordId = data?.[0]?.id;
        }

        // Log de Auditoria: CRIACAO
        await logAuditEvent({
          action: 'CRIACAO',
          entity_type: activeTab === 'patient' ? 'paciente' : activeTab === 'professional' ? 'terapeuta' : 'colaborador',
          entity_id: newRecordId,
          entity_name: formData.name || 'Novo Registro',
          details: { ...formData, avatar_url: uploadedAvatarUrl }
        });
      }
      
      setIsModalOpen(false);
      fetchDbUsers();
      alert('Cadastro salvo e registrado na auditoria com sucesso!');
    } catch (err) {
      console.error("Erro ao salvar:", err);
      const errorMsg = err instanceof Error ? err.message : (err as any)?.message || JSON.stringify(err);
      alert('ERRO DO SUPABASE:\n\n' + errorMsg);
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

  const therapyOptions = ['Psicologia', 'Fonoaudiologia', 'Terapia Ocupacional', 'Psicopedagogia', 'Musicoterapia', 'Psicomotricidade'];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant shadow-sm">
        <div>
          <h2 className="font-display-sm text-3xl font-bold text-on-surface">Gestão de Cadastros</h2>
          <p className="font-body-md text-on-surface-variant mt-1">
            Gerencie pacientes, terapeutas e a equipe de secretárias/colaboradores da clínica com trilha de auditoria ativa.
          </p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-md"
        >
          <UserPlus size={20} />
          {activeTab === 'patient' ? 'Novo Paciente' : activeTab === 'professional' ? 'Novo Terapeuta' : 'Nova Secretária/Colaborador'}
        </button>
      </div>

      {/* TABS DE SELEÇÃO */}
      <div className="flex bg-surface-variant/30 p-1.5 rounded-2xl w-full md:w-fit gap-1">
        <button
          onClick={() => setActiveTab('patient')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-label-md font-bold transition-all flex items-center gap-2 ${
            activeTab === 'patient' 
              ? 'bg-white text-primary shadow-sm' 
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <UserCheck size={18} />
          Pacientes ({allUsers.filter(u => u.role === 'patient').length})
        </button>
        <button
          onClick={() => setActiveTab('professional')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-label-md font-bold transition-all flex items-center gap-2 ${
            activeTab === 'professional' 
              ? 'bg-white text-primary shadow-sm' 
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <ShieldCheck size={18} />
          Terapeutas ({allUsers.filter(u => u.role === 'professional').length})
        </button>
        <button
          onClick={() => setActiveTab('collaborator')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-label-md font-bold transition-all flex items-center gap-2 ${
            activeTab === 'collaborator' 
              ? 'bg-white text-primary shadow-sm' 
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Briefcase size={18} />
          Secretárias & Recepção ({allUsers.filter(u => u.role === 'collaborator').length})
        </button>
      </div>

      {/* BARRA DE PESQUISA */}
      <div className="relative w-full md:w-96">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
        <input 
          type="text" 
          placeholder={`Buscar ${activeTab === 'patient' ? 'paciente' : activeTab === 'professional' ? 'terapeuta' : 'secretária'} por nome...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-surface-variant rounded-2xl focus:ring-2 focus:ring-primary outline-none font-body-sm shadow-sm"
        />
      </div>

      {/* LISTAGEM */}
      <div className="bg-white rounded-3xl border border-surface-variant shadow-sm overflow-hidden">
        <div className="divide-y divide-surface-variant">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-variant/10 transition-colors">
                <div className="flex items-center gap-4">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-14 h-14 rounded-full object-cover border-2 border-surface-variant shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold text-xl shadow-sm">
                      {(user.name || '?').charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-headline-md text-lg font-bold text-on-surface">{user.name}</h4>
                      {user.id.length < 10 && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                          Exemplo
                        </span>
                      )}
                    </div>

                    {user.role === 'patient' ? (
                      <div className="flex flex-col gap-1 mt-1 text-sm text-on-surface-variant">
                        {/* BADGE CONVÊNIO OU PARTICULAR */}
                        <div className="flex items-center gap-2">
                          {user.payment_type === 'convenio' ? (
                            <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                              Convênio: {user.insurance_name || 'Convênio Ativo'}
                              {user.insurance_number ? ` • Matrícula: ${user.insurance_number}` : ''}
                            </span>
                          ) : (
                            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                              Particular
                            </span>
                          )}
                        </div>

                        {user.mother_name && <span><strong className="text-slate-700">Mãe:</strong> {user.mother_name} {user.mother_contact ? `(${user.mother_contact})` : ''}</span>}
                        {user.father_name && <span><strong className="text-slate-700">Pai:</strong> {user.father_name} {user.father_contact ? `(${user.father_contact})` : ''}</span>}
                        {user.therapies && user.therapies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.therapies.map(t => (
                              <span key={t} className="text-xs bg-secondary-container text-secondary font-semibold px-2 py-0.5 rounded-md">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : user.role === 'professional' ? (
                      <p className="text-sm text-primary font-semibold mt-0.5">
                        {user.specialty || 'Terapeuta'} • <span className="text-on-surface-variant font-normal">{user.contact}</span>
                      </p>
                    ) : (
                      <div className="text-sm mt-0.5">
                        <span className="text-primary font-bold">{user.position || 'Secretária'}</span>
                        <span className="text-on-surface-variant ml-2">• {user.contact}</span>
                        {user.email && <span className="text-slate-400 block text-xs mt-0.5">{user.email}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button 
                    onClick={() => handleEdit(user)}
                    className="p-2.5 hover:bg-surface-variant rounded-xl text-on-surface-variant transition-colors"
                    title="Editar Cadastro"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="p-2.5 hover:bg-error-container text-error rounded-xl transition-colors"
                    title="Excluir Cadastro"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-on-surface-variant">
              Nenhum cadastro encontrado.
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CADASTRO E EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-3xl p-6 w-full max-w-[600px] shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full z-10"
            >
              <X size={20} />
            </button>
            
            <h3 className="font-display-sm text-xl sm:text-2xl font-bold text-slate-800 mb-6 pr-8">
              {editingId ? 'Editar Cadastro' : activeTab === 'patient' ? 'Novo Paciente' : activeTab === 'professional' ? 'Novo Terapeuta' : 'Nova Secretária/Colaborador'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              
              {/* UPLOAD DE AVATAR COM FOTO */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center border-2 border-primary/20 shadow-sm shrink-0">
                  {avatarPreview || formData.avatar_url ? (
                    <img src={avatarPreview || formData.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={24} className="text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Foto de Perfil</label>
                  <div>
                    <label className="cursor-pointer inline-block py-1.5 px-4 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm mt-1">
                      Escolher arquivo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* NOME COMPLETO */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {activeTab === 'patient' ? 'Nome da Criança / Paciente *' : 'Nome Completo *'}
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.name || ''} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Nicole Santos"
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              {/* MODALIDADE: PARTICULAR OU CONVÊNIO (APENAS PARA PACIENTES) */}
              {activeTab === 'patient' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <label className="block text-sm font-bold text-slate-700">Modalidade de Atendimento *</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_type: 'particular' })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        (formData.payment_type || 'particular') === 'particular'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Particular
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_type: 'convenio' })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        formData.payment_type === 'convenio'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Convênio Médico
                    </button>
                  </div>

                  {formData.payment_type === 'convenio' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Convênio *</label>
                        <input
                          type="text"
                          required
                          value={formData.insurance_name || ''}
                          onChange={(e) => setFormData({ ...formData, insurance_name: e.target.value })}
                          placeholder="Ex: Unimed, Bradesco Saúde, Amil, SulAmérica..."
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nº Carteirinha / Matrícula (Opcional)</label>
                        <input
                          type="text"
                          value={formData.insurance_number || ''}
                          onChange={(e) => setFormData({ ...formData, insurance_number: e.target.value })}
                          placeholder="Ex: 0012345678"
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CAMPOS ESPECÍFICOS PARA PACIENTE */}
              {activeTab === 'patient' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Mãe ou Responsável</label>
                      <input 
                        type="text" 
                        value={formData.mother_name || ''} 
                        onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                        placeholder="Nome da mãe"
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp da Mãe</label>
                      <input 
                        type="text" 
                        value={formData.mother_contact || ''} 
                        onChange={(e) => setFormData({ ...formData, mother_contact: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Pai</label>
                      <input 
                        type="text" 
                        value={formData.father_name || ''} 
                        onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                        placeholder="Nome do pai"
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp do Pai</label>
                      <input 
                        type="text" 
                        value={formData.father_contact || ''} 
                        onChange={(e) => setFormData({ ...formData, father_contact: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Terapias Indicadas</label>
                    <div className="flex flex-wrap gap-2">
                      {therapyOptions.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTherapy(t)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            (formData.therapies || []).includes(t)
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* CAMPOS ESPECÍFICOS PARA TERAPEUTA */}
              {activeTab === 'professional' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Especialidade Principal *</label>
                    <select
                      value={formData.specialty || 'Psicologia'}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                    >
                      {specialties.map(opt => (
                        <option key={opt.id} value={opt.name}>{opt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Número do Conselho (CRM, CRP, etc)</label>
                    <input 
                      type="text" 
                      value={formData.council_number || ''} 
                      onChange={(e) => setFormData({ ...formData, council_number: e.target.value })}
                      placeholder="Ex: CRP 12345/SP"
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp / Telefone *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.contact || ''} 
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              )}

              {/* CAMPOS ESPECÍFICOS PARA COLABORADOR / SECRETÁRIA */}
              {activeTab === 'collaborator' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Cargo / Função *</label>
                      <select
                        value={formData.position || 'Secretária'}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="Secretária">Secretária</option>
                        <option value="Recepcionista">Recepcionista</option>
                        <option value="Auxiliar Administrativo">Auxiliar Administrativo</option>
                        <option value="Financeiro">Assistente Financeiro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp / Telefone *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.contact || ''} 
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">E-mail de Acesso ao Sistema</label>
                    <input 
                      type="email" 
                      value={formData.email || ''} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="secretaria@institutomotivar.com.br"
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </>
              )}

              {/* CPF */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">CPF (Opcional)</label>
                <input 
                  type="text" 
                  value={formData.cpf || ''} 
                  onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              {/* BOTÕES */}
              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-full sm:w-auto px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 py-3 font-bold bg-primary text-white hover:bg-primary/90 rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
