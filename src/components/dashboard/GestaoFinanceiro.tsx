import { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, Clock, CheckCircle, AlertCircle, Plus, Search, Filter, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logAuditEvent } from '../../lib/audit';

export interface FinancialRecord {
  id: string;
  date: string;
  patient_name: string;
  description: string;
  amount: number;
  payment_method: 'PIX' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Dinheiro' | 'Convênio';
  status: 'paid' | 'pending' | 'overdue';
  receipt_number?: string;
  notes?: string;
}

const initialFinancialRecords: FinancialRecord[] = [
  {
    id: 'fin-1',
    date: '2026-09-23',
    patient_name: 'Lucas Matheus Silva',
    description: 'Sessão de Psicomotricidade & TO',
    amount: 180.00,
    payment_method: 'PIX',
    status: 'paid',
    receipt_number: 'REC-2026-091'
  },
  {
    id: 'fin-2',
    date: '2026-09-23',
    patient_name: 'Pedro Henrique',
    description: 'Sessão de Fonoaudiologia',
    amount: 180.00,
    payment_method: 'Cartão de Crédito',
    status: 'paid',
    receipt_number: 'REC-2026-092'
  },
  {
    id: 'fin-3',
    date: '2026-09-22',
    patient_name: 'Mariana Costa',
    description: 'Avaliação Neuropsicopedagógica',
    amount: 350.00,
    payment_method: 'PIX',
    status: 'pending',
    receipt_number: 'REC-2026-093'
  },
  {
    id: 'fin-4',
    date: '2026-09-20',
    patient_name: 'Rafael Gomes',
    description: 'Pacote Mensal (4 Sessões)',
    amount: 680.00,
    payment_method: 'PIX',
    status: 'paid',
    receipt_number: 'REC-2026-088'
  },
  {
    id: 'fin-5',
    date: '2026-09-15',
    patient_name: 'Ana Júlia',
    description: 'Sessão de Psicologia Clínica',
    amount: 180.00,
    payment_method: 'Dinheiro',
    status: 'overdue',
    receipt_number: 'REC-2026-075'
  }
];

export default function GestaoFinanceiro() {
  const [records, setRecords] = useState<FinancialRecord[]>(initialFinancialRecords);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtros
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [methodFilter, setMethodFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Formulário de Novo Lançamento
  const [formPatient, setFormPatient] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formMethod, setFormMethod] = useState<FinancialRecord['payment_method']>('PIX');
  const [formStatus, setFormStatus] = useState<FinancialRecord['status']>('paid');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadFinancialRecords();
  }, []);

  const loadFinancialRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinic_financial_records')
        .select('*')
        .order('date', { ascending: false });

      if (data && !error && data.length > 0) {
        setRecords([...data, ...initialFinancialRecords]);
      } else {
        setRecords(initialFinancialRecords);
      }
    } catch (err) {
      console.warn('Carregando registros financeiros padrão:', err);
    } finally {
      setLoading(false);
    }
  };

  // KPIs Calculados
  const totalRecebido = records
    .filter(r => r.status === 'paid')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPendente = records
    .filter(r => r.status === 'pending' || r.status === 'overdue')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const sessoesPagas = records.filter(r => r.status === 'paid').length;

  // Dar Baixa / Confirmar Pagamento com Auditoria
  const handleConfirmPayment = async (record: FinancialRecord) => {
    if (!window.confirm(`Deseja confirmar o recebimento de R$ ${record.amount.toFixed(2)} de ${record.patient_name}?`)) {
      return;
    }

    setRecords(prev => prev.map(r => r.id === record.id ? { ...r, status: 'paid' } : r));

    try {
      await supabase
        .from('clinic_financial_records')
        .update({ status: 'paid' })
        .eq('id', record.id);
    } catch (err) {
      console.warn(err);
    }

    // Registra Auditoria
    await logAuditEvent({
      action: 'PAGAMENTO_REGISTRADO',
      entity_type: 'financeiro',
      entity_id: record.id,
      entity_name: `Pagamento: ${record.patient_name}`,
      details: {
        valor: record.amount,
        forma: record.payment_method,
        status_anterior: record.status,
        novo_status: 'paid'
      }
    });

    alert('Pagamento confirmado e registrado na trilha de auditoria!');
  };

  // Criar Lançamento com Auditoria
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatient.trim() || !formAmount) return;

    setIsSaving(true);
    const amountVal = parseFloat(formAmount.replace(',', '.')) || 0;

    const newRecord: FinancialRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      patient_name: formPatient.trim(),
      description: formDesc.trim() || 'Atendimento Clínico',
      amount: amountVal,
      payment_method: formMethod,
      status: formStatus,
      receipt_number: `REC-${Date.now().toString().slice(-6)}`
    };

    try {
      await supabase.from('clinic_financial_records').insert([newRecord]);
    } catch (err) {
      console.warn('Persistindo financeiro apenas em memória:', err);
    }

    setRecords(prev => [newRecord, ...prev]);

    // Registra Auditoria Compulsória
    await logAuditEvent({
      action: 'PAGAMENTO_REGISTRADO',
      entity_type: 'financeiro',
      entity_id: newRecord.id,
      entity_name: `Lançamento: ${newRecord.patient_name}`,
      details: {
        paciente: newRecord.patient_name,
        valor: newRecord.amount,
        forma: newRecord.payment_method,
        status: newRecord.status,
        recibo: newRecord.receipt_number
      }
    });

    setIsSaving(false);
    setIsModalOpen(false);
    setFormPatient('');
    setFormDesc('');
    setFormAmount('');
    alert('Lançamento financeiro registrado com sucesso!');
  };

  // Filtros
  const filteredRecords = records.filter(r => {
    const matchesStatus = statusFilter === 'Todos' || 
      (statusFilter === 'Pago' && r.status === 'paid') ||
      (statusFilter === 'Pendente' && r.status === 'pending') ||
      (statusFilter === 'Atrasado' && r.status === 'overdue');

    const matchesMethod = methodFilter === 'Todos' || r.payment_method === methodFilter;
    const matchesSearch = r.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesMethod && matchesSearch;
  });

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant shadow-sm">
        <div>
          <h2 className="font-display-sm text-3xl font-bold text-on-surface">Gestão Financeira</h2>
          <p className="font-body-md text-on-surface-variant mt-1">
            Controle de faturamento, cobranças, baixas de pagamentos e recibos com auditoria integrada.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-md"
        >
          <Plus size={20} />
          Novo Lançamento
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-[#008537] bg-white shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Recebido</span>
            <div className="p-2 rounded-xl bg-green-50 text-[#008537]">
              <TrendingUp size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-800">
              R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-green-700 font-semibold mt-1">
              {sessoesPagas} atendimentos quitados
            </p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-amber-500 bg-white shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">A Receber / Pendente</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-800">
              R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-amber-700 font-semibold mt-1">
              {records.filter(r => r.status !== 'paid').length} cobranças em aberto
            </p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-primary bg-white shadow-sm flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ticket Médio por Sessão</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <CreditCard size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-800">
              R$ {(records.length > 0 ? (totalRecebido + totalPendente) / records.length : 180).toFixed(2)}
            </h3>
            <p className="text-xs text-primary font-semibold mt-1">
              Baseado em {records.length} lançamentos totais
            </p>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="flex flex-col xl:flex-row justify-between gap-4 items-center bg-white p-4 rounded-2xl border border-surface-variant shadow-sm">
        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3">
          <div className="relative flex-1 sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-surface-variant rounded-xl focus:ring-2 focus:ring-primary outline-none font-body-sm text-on-surface"
            >
              <option value="Todos">Status: Todos</option>
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
              <option value="Atrasado">Atrasado</option>
            </select>
          </div>

          <div className="relative flex-1 sm:w-56">
            <select 
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-surface-variant rounded-xl focus:ring-2 focus:ring-primary outline-none font-body-sm text-on-surface"
            >
              <option value="Todos">Forma de Pagto: Todas</option>
              <option value="PIX">PIX</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Convênio">Convênio</option>
            </select>
          </div>
        </div>

        <div className="relative w-full xl:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por paciente ou sessão..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-surface-variant rounded-xl focus:ring-2 focus:ring-primary outline-none font-body-sm text-on-surface"
          />
        </div>
      </div>

      {/* TABELA DE LANÇAMENTOS */}
      <div className="bg-white rounded-3xl border border-surface-variant shadow-sm overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-surface-container-lowest border-b border-surface-variant font-label-sm font-bold text-on-surface-variant uppercase tracking-wider hidden md:grid text-xs">
          <div className="col-span-2">Data / Recibo</div>
          <div className="col-span-3">Paciente</div>
          <div className="col-span-3">Descrição / Sessão</div>
          <div className="col-span-2">Forma / Valor</div>
          <div className="col-span-2 text-right">Status / Ação</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-surface-variant flex-1">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Carregando dados financeiros...</div>
          ) : filteredRecords.length > 0 ? (
            filteredRecords.map((r) => (
              <div key={r.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50/80 transition-colors">
                
                {/* Data e Recibo */}
                <div className="col-span-2 flex flex-col">
                  <span className="font-bold text-slate-800 text-sm">{r.date}</span>
                  <span className="text-xs text-slate-400 font-mono">{r.receipt_number || 'Sem recibo'}</span>
                </div>

                {/* Paciente */}
                <div className="col-span-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-xs shrink-0">
                    {r.patient_name.charAt(0)}
                  </div>
                  <span className="font-bold text-slate-800 text-sm truncate">{r.patient_name}</span>
                </div>

                {/* Descrição */}
                <div className="col-span-3 text-sm text-slate-600">
                  {r.description}
                </div>

                {/* Forma e Valor */}
                <div className="col-span-2 flex flex-col">
                  <span className="font-bold text-slate-900 text-sm">
                    R$ {r.amount.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400">{r.payment_method}</span>
                </div>

                {/* Status e Ação */}
                <div className="col-span-2 flex items-center justify-between md:justify-end gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    r.status === 'paid' ? 'bg-[#dcfce7] text-[#15803d]' : 
                    r.status === 'overdue' ? 'bg-red-100 text-red-700' : 
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {r.status === 'paid' && <CheckCircle size={12} />}
                    {r.status === 'pending' && <Clock size={12} />}
                    {r.status === 'overdue' && <AlertCircle size={12} />}
                    {r.status === 'paid' ? 'Pago' : r.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                  </span>

                  {r.status !== 'paid' && (
                    <button
                      onClick={() => handleConfirmPayment(r)}
                      title="Confirmar Recebimento"
                      className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      Dar Baixa
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-500">
              Nenhum lançamento financeiro encontrado com os filtros selecionados.
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE NOVO LANÇAMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-3xl p-6 w-full max-w-[500px] shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full"
            >
              <X size={20} />
            </button>
            
            <h3 className="font-display-sm text-xl font-bold text-slate-800 mb-6">Novo Lançamento Financeiro</h3>

            <form onSubmit={handleCreateRecord} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Paciente *</label>
                <input 
                  type="text" 
                  required
                  value={formPatient} 
                  onChange={(e) => setFormPatient(e.target.value)}
                  placeholder="Ex: Lucas Matheus Silva"
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição / Serviço *</label>
                <input 
                  type="text" 
                  required
                  value={formDesc} 
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ex: Sessão de T.O. ou Pacote Mensal"
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Valor (R$) *</label>
                  <input 
                    type="text" 
                    required
                    value={formAmount} 
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="180,00"
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Status Inicial</label>
                  <select 
                    value={formStatus} 
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="paid">Já Pago (Quitado)</option>
                    <option value="pending">Aguardando Pagamento</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                <select 
                  value={formMethod} 
                  onChange={(e) => setFormMethod(e.target.value as any)}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Convênio">Convênio</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-8 py-2.5 font-bold bg-primary text-white hover:bg-primary/90 rounded-xl shadow-md disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Registrar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
