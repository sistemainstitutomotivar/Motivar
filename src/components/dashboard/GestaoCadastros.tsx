import { useState } from 'react';
import { UserPlus, Search, Edit, Trash2, X } from 'lucide-react';

interface MockUser {
  id: string;
  name: string;
  role: 'patient' | 'professional';
  specialtyOrResponsible?: string;
  contact: string;
  status: 'active' | 'inactive';
  cpf?: string;
  birthdate?: string;
  therapies?: string[]; // Para pacientes
}

const initialUsers: MockUser[] = [
  { id: '1', name: 'Lucas Matheus Silva', role: 'patient', specialtyOrResponsible: 'Maria Silva (Mãe)', contact: '(11) 98888-7777', status: 'active', therapies: ['Psicologia', 'Fonoaudiologia'] },
  { id: '2', name: 'Pedro Henrique', role: 'patient', specialtyOrResponsible: 'João Henrique (Pai)', contact: '(11) 97777-6666', status: 'active', therapies: ['Terapia Ocupacional'] },
  { id: '3', name: 'Dra. Mariana Costa', role: 'professional', specialtyOrResponsible: 'Psicologia', contact: '(11) 96666-5555', status: 'active' },
  { id: '4', name: 'Dr. Roberto Alves', role: 'professional', specialtyOrResponsible: 'Fonoaudiologia', contact: '(11) 95555-4444', status: 'active' },
];

export default function GestaoCadastros() {
  const [activeTab, setActiveTab] = useState<'patient' | 'professional'>('patient');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for Users
  const [users, setUsers] = useState<MockUser[]>(initialUsers);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<MockUser>>({});

  const filteredUsers = users.filter(u => u.role === activeTab && u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este cadastro?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleEdit = (user: MockUser) => {
    setFormData(user);
    setEditingId(user.id);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setFormData({ role: activeTab, therapies: [] });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setUsers(users.map(u => u.id === editingId ? { ...u, ...formData } as MockUser : u));
    } else {
      const newUser: MockUser = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        status: 'active',
        name: formData.name || 'Novo Usuário',
        role: activeTab,
        contact: formData.contact || '',
        specialtyOrResponsible: formData.specialtyOrResponsible || ''
      } as MockUser;
      setUsers([...users, newUser]);
    }
    setIsModalOpen(false);
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
                <th className="font-label-sm font-bold text-on-surface-variant px-6 py-4 uppercase tracking-wider">Status</th>
                <th className="font-label-sm font-bold text-on-surface-variant px-6 py-4 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-surface-variant/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-label-md font-bold text-on-surface">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-body-md text-on-surface-variant">{user.specialtyOrResponsible}</td>
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
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full font-label-sm ${user.status === 'active' ? 'bg-[#cce5ff] text-[#00497d]' : 'bg-surface-variant text-on-surface-variant'}`}>
                      {user.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
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

      {/* REGISTRATION MODAL (DRAFT) */}
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
              {editingId ? 'Editar' : 'Cadastrar Novo'} {activeTab === 'patient' ? 'Paciente' : 'Terapeuta'}
            </h3>
            
            <form className="space-y-5" onSubmit={handleSave}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                  <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: João da Silva" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">CPF</label>
                  <input value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})} type="text" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none" placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Data de Nascimento</label>
                  <input value={formData.birthdate || ''} onChange={e => setFormData({...formData, birthdate: e.target.value})} type="date" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-slate-600" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Celular / WhatsApp</label>
                  <input required value={formData.contact || ''} onChange={e => setFormData({...formData, contact: e.target.value})} type="text" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none" placeholder="(00) 00000-0000" />
                </div>

                {activeTab === 'patient' ? (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Responsável (se menor)</label>
                      <input value={formData.specialtyOrResponsible || ''} onChange={e => setFormData({...formData, specialtyOrResponsible: e.target.value})} type="text" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none" placeholder="Nome da mãe, pai ou tutor" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Terapias / Especialidades Indicadas</label>
                      <div className="flex flex-wrap gap-2">
                        {therapyOptions.map(therapy => {
                          const isSelected = formData.therapies?.includes(therapy);
                          return (
                            <button
                              key={therapy}
                              type="button"
                              onClick={() => toggleTherapy(therapy)}
                              className={`px-3 py-1.5 rounded-full text-sm font-bold border transition-colors ${
                                isSelected 
                                  ? 'bg-primary text-white border-primary shadow-sm' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
                              }`}
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
                  <>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Especialidade</label>
                      <select required value={formData.specialtyOrResponsible || ''} onChange={e => setFormData({...formData, specialtyOrResponsible: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-slate-600 appearance-none">
                        <option value="">Selecione...</option>
                        {therapyOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Registro (CRM/CRP/etc)</label>
                      <input type="text" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: CRP 00/00000" />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-3 sm:py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="w-full sm:w-auto px-8 py-3 sm:py-2.5 font-bold bg-primary text-white hover:bg-primary/90 rounded-xl shadow-md transition-colors">
                  {editingId ? 'Atualizar Cadastro' : 'Salvar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
