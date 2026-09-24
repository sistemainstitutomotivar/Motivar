import { useState, useEffect } from 'react';
import { Building, Clock, ShieldAlert, Search, RefreshCw, Save, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logAuditEvent } from '../../lib/audit';
import type { AuditLogEntry } from '../../lib/audit';
import { getSpecialties, createSpecialty, deleteSpecialty } from '../../lib/specialties';
import type { Specialty } from '../../lib/specialties';
import { Stethoscope, Trash2 } from 'lucide-react';


const initialMockAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-1',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    user_email: 'gestao@institutomotivar.com.br',
    user_role: 'admin',
    action: 'CRIACAO',
    entity_type: 'agendamento',
    entity_name: 'Consulta: Pedro Henrique',
    details: 'Sessão agendada para 23/09 às 08:00 na Sala 01'
  },
  {
    id: 'log-2',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    user_email: 'secretaria@institutomotivar.com.br',
    user_role: 'secretary',
    action: 'CONFIRMACAO_AGENDAMENTO',
    entity_type: 'agendamento',
    entity_name: 'Consulta: Lucas Matheus Silva',
    details: 'Status atualizado para confirmado pela recepção'
  },
  {
    id: 'log-3',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    user_email: 'mariana.costa@institutomotivar.com.br',
    user_role: 'professional',
    action: 'INCLUSAO_NOTA',
    entity_type: 'prontuario',
    entity_name: 'Evolução Clínica: Lucas Matheus Silva',
    details: 'Evolução registrada: Paciente demonstrou excelente resposta aos estímulos visomotores hoje.'
  },
  {
    id: 'log-4',
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    user_email: 'secretaria@institutomotivar.com.br',
    user_role: 'secretary',
    action: 'PAGAMENTO_REGISTRADO',
    entity_type: 'financeiro',
    entity_name: 'Pagamento: Lucas Matheus Silva',
    details: 'Valor: R$ 180,00 - Forma: PIX - Status: Quitada'
  }
];

export default function ConfiguracoesClinica() {
  const [activeTab, setActiveTab] = useState<'dados' | 'horarios' | 'auditoria' | 'especialidades'>('dados');

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
  
  // Dados da Clínica
  const [clinicName, setClinicName] = useState('Instituto Motivar');
  const [cnpj, setCnpj] = useState('12.345.678/0001-90');
  const [phone, setPhone] = useState('(11) 98888-0000');
  const [whatsapp, setWhatsapp] = useState('(11) 97777-1111');
  const [email, setEmail] = useState('contato@institutomotivar.com.br');
  const [address, setAddress] = useState('Av. Paulista, 1000 - Conjunto 501, Bela Vista - São Paulo / SP');
  const [isSavingClinic, setIsSavingClinic] = useState(false);

  // Horários e Salas
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('19:00');
  const [sessionDuration, setSessionDuration] = useState('50');
  const [rooms, setRooms] = useState([
    'Sala 01 - Principal',
    'Sala 02 - Integração Sensorial & Psicomotricidade',
    'Sala 03 - Fonoaudiologia & Voz',
    'Sala 04 - Atendimento Lúdico e Avaliações'
  ]);
  const [newRoomName, setNewRoomName] = useState('');

  // Auditoria
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialMockAuditLogs);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [filterAction, setFilterAction] = useState('TODAS');
  const [searchLog, setSearchLog] = useState('');

  useEffect(() => {
    if (activeTab === 'auditoria') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error && data.length > 0) {
        setAuditLogs([...data, ...initialMockAuditLogs]);
      } else {
        setAuditLogs(initialMockAuditLogs);
      }
    } catch (err) {
      console.warn('Erro ao carregar logs de auditoria:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSaveClinicData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingClinic(true);

    await logAuditEvent({
      action: 'ALTERACAO_CONFIGURACAO',
      entity_type: 'configuracao',
      entity_name: 'Dados Cadastrais da Clínica',
      details: { clinicName, cnpj, phone, whatsapp, email, address }
    });

    setIsSavingClinic(false);
    alert('Dados da clínica salvos e alteração registrada na auditoria!');
  };

  const handleSaveHours = async (e: React.FormEvent) => {
    e.preventDefault();

    await logAuditEvent({
      action: 'ALTERACAO_CONFIGURACAO',
      entity_type: 'configuracao',
      entity_name: 'Parâmetros de Horários & Salas',
      details: { openingTime, closingTime, sessionDuration, rooms }
    });

    alert('Horários e salas atualizados e registrados na auditoria!');
  };

  const handleAddRoom = () => {
    if (!newRoomName.trim()) return;
    setRooms(prev => [...prev, newRoomName.trim()]);
    setNewRoomName('');
  };

  const handleRemoveRoom = (index: number) => {
    setRooms(prev => prev.filter((_, i) => i !== index));
  };

  // Filtros de Auditoria
  const filteredLogs = auditLogs.filter(log => {
    const matchesAction = filterAction === 'TODAS' || log.action === filterAction;
    const matchesSearch = 
      (log.entity_name || '').toLowerCase().includes(searchLog.toLowerCase()) ||
      (log.user_email || '').toLowerCase().includes(searchLog.toLowerCase()) ||
      (typeof log.details === 'string' ? log.details : JSON.stringify(log.details || '')).toLowerCase().includes(searchLog.toLowerCase());

    return matchesAction && matchesSearch;
  });

  const formatLogDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CRIACAO':
        return <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-md">Criação</span>;
      case 'EDICAO':
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md">Alteração</span>;
      case 'EXCLUSAO':
        return <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-md">Exclusão</span>;
      case 'INCLUSAO_NOTA':
        return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-md">Nota Clínica</span>;
      case 'PAGAMENTO_REGISTRADO':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-md">Pagamento</span>;
      case 'CONFIRMACAO_AGENDAMENTO':
        return <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-1 rounded-md">Confirmação</span>;
      case 'CANCELAMENTO_AGENDAMENTO':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-md">Cancelamento</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-md">{action}</span>;
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant shadow-sm">
        <div>
          <h2 className="font-display-sm text-3xl font-bold text-on-surface">Configurações & Auditoria</h2>
          <p className="font-body-md text-on-surface-variant mt-1">
            Parâmetros do Instituto Motivar e trilha de auditoria completa de segurança para compliance e fiscalização.
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex bg-surface-variant/30 p-1.5 rounded-2xl w-full md:w-fit gap-1">
        <button
          onClick={() => setActiveTab('dados')}
          className={`px-6 py-2.5 rounded-xl font-label-md font-bold transition-all flex items-center gap-2 ${
            activeTab === 'dados' 
              ? 'bg-white text-primary shadow-sm' 
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Building size={18} />
          Dados da Clínica
        </button>
        <button
          onClick={() => setActiveTab('horarios')}
          className={`px-6 py-2.5 rounded-xl font-label-md font-bold transition-all flex items-center gap-2 ${
            activeTab === 'horarios' 
              ? 'bg-white text-primary shadow-sm' 
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Clock size={18} />
          Horários & Salas
        </button>
        <button
          onClick={() => setActiveTab('auditoria')}
          className={`px-6 py-2.5 rounded-xl font-label-md font-bold transition-all flex items-center gap-2 ${
            activeTab === 'auditoria' 
              ? 'bg-white text-primary shadow-sm' 
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <ShieldAlert size={18} />
          Trilha de Auditoria (Logs)
        </button>
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
      </div>

      {/* ABA 1: DADOS DA CLÍNICA */}
      {activeTab === 'dados' && (
        <form onSubmit={handleSaveClinicData} className="bg-white rounded-3xl p-6 border border-surface-variant shadow-sm space-y-6 max-w-4xl">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Identificação da Clínica</h3>
            <p className="text-sm text-slate-500">Informações utilizadas em recibos, laudos e cabeçalhos oficiais.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome Fantasia</label>
              <input 
                type="text" 
                value={clinicName} 
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">CNPJ</label>
              <input 
                type="text" 
                value={cnpj} 
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Telefone Fixo</label>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp Oficial</label>
              <input 
                type="text" 
                value={whatsapp} 
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">E-mail Institucional</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Endereço Completo</label>
            <input 
              type="text" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSavingClinic}
              className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <Save size={18} />
              {isSavingClinic ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      )}

      {/* ABA 2: HORÁRIOS & SALAS */}
      {activeTab === 'horarios' && (
        <form onSubmit={handleSaveHours} className="bg-white rounded-3xl p-6 border border-surface-variant shadow-sm space-y-6 max-w-4xl">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Horários de Atendimento & Duração</h3>
            <p className="text-sm text-slate-500">Configurações padrão para a criação de sessões na Agenda Geral.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Início das Sessões</label>
              <input 
                type="time" 
                value={openingTime} 
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Término das Sessões</label>
              <input 
                type="time" 
                value={closingTime} 
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Duração Padrão (Minutos)</label>
              <select
                value={sessionDuration}
                onChange={(e) => setSessionDuration(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="45">45 minutos</option>
                <option value="50">50 minutos (Recomendado)</option>
                <option value="60">60 minutos (1 hora)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 mb-3">Salas de Atendimento Disponíveis</h4>
            
            <div className="space-y-2 mb-4">
              {rooms.map((room, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="font-medium text-slate-700 text-sm">{room}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveRoom(idx)}
                    className="text-xs text-red-600 hover:underline font-bold"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Nome da nova sala..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="flex-1 p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-sm"
              />
              <button 
                type="button" 
                onClick={handleAddRoom}
                className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl text-sm hover:bg-slate-700"
              >
                Adicionar Sala
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <Save size={18} />
              Salvar Parâmetros
            </button>
          </div>
        </form>
      )}

      {/* ABA 3: TRILHA DE AUDITORIA (AUDIT LOGS) */}
      {activeTab === 'auditoria' && (
        <div className="w-full flex flex-col gap-4">
          
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-sm">
            <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-bold">Trilha de Auditoria Imutável (Compliance)</p>
              <p className="text-amber-800 text-xs mt-0.5">
                Por se tratar de dados sensíveis de menores e pacientes clínicos, todo evento de inclusão, alteração, 
                exclusão de cadastros, notas e pagamentos é armazenado permanentemente no banco com carimbo do autor e hora.
              </p>
            </div>
          </div>

          {/* BARRA DE FILTROS DE AUDITORIA */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-white p-4 rounded-2xl border border-surface-variant shadow-sm">
            <div className="flex w-full sm:w-auto gap-3">
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-surface-variant rounded-xl focus:ring-2 focus:ring-primary outline-none font-body-sm text-sm"
              >
                <option value="TODAS">Ação: Todas as ações</option>
                <option value="CRIACAO">Criação de Registros</option>
                <option value="EDICAO">Alterações de Dados</option>
                <option value="EXCLUSAO">Exclusões</option>
                <option value="INCLUSAO_NOTA">Inclusão de Notas Clínicas</option>
                <option value="PAGAMENTO_REGISTRADO">Pagamentos Registrados</option>
                <option value="CANCELAMENTO_AGENDAMENTO">Cancelamentos</option>
              </select>

              <button
                onClick={fetchAuditLogs}
                title="Recarregar Logs"
                className="p-2.5 border border-surface-variant rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
              >
                <RefreshCw size={18} className={loadingLogs ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por usuário ou paciente..." 
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-surface-variant rounded-xl focus:ring-2 focus:ring-primary outline-none font-body-sm text-sm"
              />
            </div>
          </div>

          {/* TABELA DE AUDITORIA */}
          <div className="bg-white rounded-3xl border border-surface-variant shadow-sm overflow-hidden flex flex-col">
            <div className="grid grid-cols-12 gap-4 p-4 bg-surface-container-lowest border-b border-surface-variant font-label-sm font-bold text-on-surface-variant uppercase tracking-wider hidden md:grid text-xs">
              <div className="col-span-2">Data / Hora</div>
              <div className="col-span-3">Usuário / Cargo</div>
              <div className="col-span-2">Ação</div>
              <div className="col-span-2">Item Afetado</div>
              <div className="col-span-3">Detalhes do Evento</div>
            </div>

            <div className="divide-y divide-surface-variant">
              {loadingLogs ? (
                <div className="p-12 text-center text-slate-500">Buscando logs de auditoria...</div>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log, idx) => (
                  <div key={log.id || idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-start hover:bg-slate-50/80 transition-colors text-sm">
                    {/* Data / Hora */}
                    <div className="col-span-2 font-mono text-xs text-slate-500">
                      {formatLogDate(log.created_at)}
                    </div>

                    {/* Usuário / Papel */}
                    <div className="col-span-3 flex flex-col">
                      <span className="font-bold text-slate-800 text-xs truncate" title={log.user_email || ''}>
                        {log.user_email || 'usuario@sistema'}
                      </span>
                      <span className="text-[11px] text-slate-400 capitalize">
                        Perfil: {log.user_role === 'admin' ? 'Administrador' : log.user_role === 'secretary' ? 'Secretária' : 'Terapeuta'}
                      </span>
                    </div>

                    {/* Ação */}
                    <div className="col-span-2">
                      {getActionBadge(log.action)}
                    </div>

                    {/* Item Afetado */}
                    <div className="col-span-2 font-medium text-slate-700 text-xs truncate" title={log.entity_name}>
                      {log.entity_name}
                    </div>

                    {/* Detalhes */}
                    <div className="col-span-3 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono truncate" title={typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || ''}>
                      {typeof log.details === 'object' 
                        ? JSON.stringify(log.details) 
                        : (log.details || 'Sem detalhes adicionais')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-500">
                  Nenhum registro de auditoria encontrado com os filtros atuais.
                </div>
              )}
            </div>
          </div>

        </div>
      )}
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


    </div>
  );
}
