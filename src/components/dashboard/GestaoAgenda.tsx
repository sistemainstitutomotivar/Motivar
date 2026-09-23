import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Filter, Search, CheckCircle, XCircle, Clock, MapPin, ChevronLeft, ChevronRight, X, Activity, Play } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getAppointments, createAppointment, updateAppointmentStatus } from '../../lib/appointments';
import type { ClinicAppointment } from '../../lib/appointments';

const today = new Date();
const formatYMD = (d: Date) => d.toISOString().split('T')[0];

function SessionProgressBar({ startTime, durationMinutes = 50 }: { startTime: string, durationMinutes?: number }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateProgress = () => {
      const now = new Date();
      const [hours, minutes] = startTime.split(':').map(Number);
      const start = new Date();
      start.setHours(hours, minutes, 0, 0);

      const elapsedMs = now.getTime() - start.getTime();
      const elapsedMinutes = Math.max(0, elapsedMs / 60000);
      const percentage = Math.min(100, (elapsedMinutes / durationMinutes) * 100);
      setProgress(percentage);
    };

    calculateProgress();
    const interval = setInterval(calculateProgress, 10000);
    return () => clearInterval(interval);
  }, [startTime, durationMinutes]);

  return (
    <div className="w-full max-w-[140px] mt-2" title={`${Math.round(progress)}% concluído`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Progresso</span>
        <span className="text-[10px] font-bold text-primary">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-surface-variant rounded-full h-1.5 overflow-hidden">
        <div 
          className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function GestaoAgenda() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<ClinicAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Listas reais do banco de dados
  const [patientsList, setPatientsList] = useState<{ id: string; name: string; avatar_url?: string }[]>([]);
  const [therapistsList, setTherapistsList] = useState<{ id: string; name: string; specialty?: string; avatar_url?: string }[]>([]);

  // Estados dos Filtros
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [therapistFilter, setTherapistFilter] = useState('Todos os Terapeutas');
  const [searchQuery, setSearchQuery] = useState('');

  // Formulário de Novo Agendamento
  const [formPatient, setFormPatient] = useState('');
  const [formTherapist, setFormTherapist] = useState('');
  const [formDate, setFormDate] = useState(formatYMD(today));
  const [formTime, setFormTime] = useState('09:00');
  const [formRoom, setFormRoom] = useState('Sala 01 - Principal');
  const [formPrice, setFormPrice] = useState('180');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Carrega Agendamentos
      const apts = await getAppointments();
      setAppointments(apts);

      // 2. Busca Pacientes Reais no Banco
      const { data: dbPatients } = await supabase.from('clinic_patients').select('id, name, avatar_url').order('name');
      const basePatients = [
        { id: 'mock-p1', name: 'Lucas Matheus Silva' },
        { id: 'mock-p2', name: 'Pedro Henrique' },
        { id: 'mock-p3', name: 'Ana Júlia' },
        { id: 'mock-p4', name: 'Rafael Gomes' },
      ];
      if (dbPatients && dbPatients.length > 0) {
        // Junta pacientes reais com base
        const merged = [...dbPatients, ...basePatients.filter(b => !dbPatients.some(p => p.name === b.name))];
        setPatientsList(merged);
      } else {
        setPatientsList(basePatients);
      }

      // 3. Busca Terapeutas Reais no Banco
      const { data: dbTherapists } = await supabase.from('clinic_therapists').select('id, name, specialty, avatar_url').order('name');
      const baseTherapists = [
        { id: 'mock-t1', name: 'Dra. Mariana Costa', specialty: 'Psicologia' },
        { id: 'mock-t2', name: 'Dr. Roberto Alves', specialty: 'Fonoaudiologia' },
        { id: 'mock-t3', name: 'Dra. Letícia Costa', specialty: 'Terapia Ocupacional' },
        { id: 'mock-t4', name: 'Dr. Carlos Mendes', specialty: 'Neuropsicopedagogia' },
      ];
      if (dbTherapists && dbTherapists.length > 0) {
        const merged = [...dbTherapists, ...baseTherapists.filter(b => !dbTherapists.some(t => t.name === b.name))];
        setTherapistsList(merged);
      } else {
        setTherapistsList(baseTherapists);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados da agenda:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lógica de manipulação de data
  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const formatDateDisplay = (d: Date) => {
    const isToday = formatYMD(d) === formatYMD(new Date());
    const dateStr = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    return isToday ? `Hoje, ${dateStr}` : dateStr;
  };

  // Ações de Status com Auditoria
  const handleStatusChange = async (apt: ClinicAppointment, newStatus: ClinicAppointment['status']) => {
    let justification: string | undefined = undefined;

    if (newStatus === 'cancelled') {
      const reason = window.prompt('Informe o motivo do cancelamento da sessão:');
      if (reason === null) return; // Usuário cancelou o prompt
      if (!reason.trim()) {
        alert('É obrigatório informar o motivo do cancelamento para fins de auditoria.');
        return;
      }
      justification = reason.trim();
    }

    // Atualiza estado visual
    setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: newStatus, justification } : a));

    // Persiste no banco e gera log
    await updateAppointmentStatus(apt.id, newStatus, justification, apt.patient_name);
  };

  // Salvar Novo Agendamento
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatient || !formTherapist || !formDate || !formTime) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedPatientObj = patientsList.find(p => p.name === formPatient);
      const selectedTherapistObj = therapistsList.find(t => t.name === formTherapist);

      const created = await createAppointment({
        date: formDate,
        time: formTime,
        duration_minutes: 50,
        patient_id: selectedPatientObj?.id,
        patient_name: formPatient,
        patient_avatar: selectedPatientObj?.avatar_url,
        therapist_id: selectedTherapistObj?.id,
        therapist_name: formTherapist,
        therapist_avatar: selectedTherapistObj?.avatar_url,
        room: formRoom,
        status: 'confirmed',
        price: parseFloat(formPrice) || 180,
        payment_status: 'pending'
      });

      setAppointments(prev => [created, ...prev]);
      setIsModalOpen(false);

      // Reseta formulário
      setFormPatient('');
      setFormTherapist('');
      alert('Agendamento realizado e registrado na trilha de auditoria com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao salvar o agendamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Aplicação dos Filtros
  const filteredAppointments = appointments.filter(apt => {
    const matchesDate = apt.date === formatYMD(selectedDate);
    const matchesTherapist = therapistFilter === 'Todos os Terapeutas' || apt.therapist_name === therapistFilter;
    const matchesSearch = apt.patient_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesTherapist && matchesSearch;
  });

  const sortedAppointments = [...filteredAppointments].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant shadow-sm">
        <div>
          <h2 className="font-display-sm text-3xl font-bold text-on-surface">Agenda Geral</h2>
          <p className="font-body-md text-on-surface-variant mt-1">
            Central única de agendamentos. Todos os dados criados aqui refletem na agenda dos terapeutas e dos pacientes.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-md"
        >
          <Plus size={20} />
          Novo Agendamento
        </button>
      </div>

      {/* CONTROLS */}
      <div className="flex flex-col xl:flex-row justify-between gap-4 items-center bg-white p-4 rounded-2xl border border-surface-variant shadow-sm">
        
        {/* Date Selector */}
        <div className="flex items-center justify-between w-full xl:w-auto gap-4 bg-surface-container-lowest border border-surface-variant rounded-xl p-1">
          <button onClick={handlePrevDay} className="p-2 hover:bg-surface-variant rounded-lg text-on-surface-variant transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 text-primary font-bold px-4">
            <CalendarIcon size={20} />
            <span className="whitespace-nowrap min-w-[160px] text-center">{formatDateDisplay(selectedDate)}</span>
          </div>
          <button onClick={handleNextDay} className="p-2 hover:bg-surface-variant rounded-lg text-on-surface-variant transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row w-full xl:w-auto gap-3">
          <div className="relative flex-1 md:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <select 
              value={therapistFilter}
              onChange={(e) => setTherapistFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-surface-variant rounded-xl focus:ring-2 focus:ring-primary outline-none font-body-sm text-on-surface appearance-none"
            >
              <option>Todos os Terapeutas</option>
              {therapistsList.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <input 
              type="text" 
              placeholder="Buscar paciente..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-surface-variant rounded-xl focus:ring-2 focus:ring-primary outline-none font-body-sm text-on-surface"
            />
          </div>
        </div>
      </div>

      {/* TIMELINE / LIST VIEW */}
      <div className="bg-white rounded-3xl border border-surface-variant shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-surface-container-lowest border-b border-surface-variant font-label-sm font-bold text-on-surface-variant uppercase tracking-wider hidden md:grid">
          <div className="col-span-1 text-center">Hora</div>
          <div className="col-span-3">Paciente</div>
          <div className="col-span-3">Terapeuta</div>
          <div className="col-span-2">Local</div>
          <div className="col-span-3">Status & Ações</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-surface-variant flex-1">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Carregando agendamentos...</div>
          ) : sortedAppointments.length > 0 ? (
            sortedAppointments.map((apt) => (
              <div key={apt.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-surface-variant/10 transition-colors">
                <div className="col-span-1 font-headline-md font-bold text-on-surface flex items-center justify-center bg-surface-variant/30 py-2 rounded-lg">
                  {apt.time}
                </div>
                
                {/* Paciente Column com Avatar */}
                <div className="col-span-3 flex items-center gap-3">
                  {apt.patient_avatar ? (
                    <img src={apt.patient_avatar} alt={apt.patient_name} className="w-10 h-10 rounded-full object-cover border border-surface-variant shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-sm shadow-sm">
                      {apt.patient_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-label-md font-bold text-on-surface">{apt.patient_name}</span>
                    <span className="md:hidden font-body-sm text-on-surface-variant">Paciente</span>
                  </div>
                </div>
                
                {/* Terapeuta Column com Avatar */}
                <div className="col-span-3 flex items-center gap-3">
                  {apt.therapist_avatar ? (
                    <img src={apt.therapist_avatar} alt={apt.therapist_name} className="w-8 h-8 rounded-full object-cover border border-surface-variant shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold text-xs shadow-sm">
                      {apt.therapist_name.charAt(apt.therapist_name.indexOf(' ') + 1 || 0)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-body-md text-on-surface-variant">{apt.therapist_name}</span>
                    <span className="md:hidden font-body-sm text-on-surface-variant">Terapeuta</span>
                  </div>
                </div>
                
                <div className="col-span-2 font-body-md text-on-surface-variant flex items-center gap-1">
                  <MapPin size={16} />
                  {apt.room}
                </div>
                
                <div className="col-span-3 flex flex-col items-start gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full font-label-sm flex items-center gap-1.5 w-fit ${
                      apt.status === 'confirmed' ? 'bg-[#dcfce7] text-[#15803d]' : 
                      apt.status === 'cancelled' ? 'bg-error-container text-on-error-container' : 
                      apt.status === 'in_progress' ? 'bg-primary-container text-on-primary-container ring-1 ring-primary/30' :
                      'bg-secondary-container text-on-secondary-container'
                    }`}>
                      {apt.status === 'confirmed' && <CheckCircle size={14} />}
                      {apt.status === 'pending' && <Clock size={14} />}
                      {apt.status === 'cancelled' && <XCircle size={14} />}
                      {apt.status === 'in_progress' && <Activity size={14} className="animate-pulse" />}
                      
                      {apt.status === 'confirmed' ? 'Confirmado' : 
                       apt.status === 'cancelled' ? 'Cancelado' : 
                       apt.status === 'in_progress' ? 'Em andamento' : 'Aguardando'}
                    </div>

                    {/* Quick action buttons */}
                    {apt.status === 'pending' && (
                      <button 
                        onClick={() => handleStatusChange(apt, 'confirmed')}
                        title="Confirmar Presença"
                        className="p-1 rounded-lg text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    {apt.status === 'confirmed' && (
                      <button 
                        onClick={() => handleStatusChange(apt, 'in_progress')}
                        title="Iniciar Atendimento"
                        className="p-1 rounded-lg text-primary hover:bg-primary-container transition-colors"
                      >
                        <Play size={18} />
                      </button>
                    )}
                    {apt.status !== 'cancelled' && (
                      <button 
                        onClick={() => handleStatusChange(apt, 'cancelled')}
                        title="Cancelar Sessão"
                        className="p-1 rounded-lg text-error hover:bg-error-container transition-colors"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>

                  {/* Renderiza a barra de progresso se estiver em andamento */}
                  {apt.status === 'in_progress' && (
                    <SessionProgressBar startTime={apt.time} durationMinutes={apt.duration_minutes} />
                  )}

                  {apt.status === 'cancelled' && apt.justification && (
                    <span className="text-xs text-error font-medium truncate w-full" title={apt.justification}>
                      Motivo: {apt.justification}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <CalendarIcon size={48} className="text-surface-variant mb-4" />
              <h4 className="font-headline-md text-lg text-on-surface font-bold">Nenhum agendamento encontrado</h4>
              <p className="font-body-md text-on-surface-variant w-full max-w-[384px] mx-auto px-4 mt-2">
                Não há sessões marcadas para os filtros selecionados nesta data.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* NOVO AGENDAMENTO MODAL (DINÂMICO E AUDITADO) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-3xl p-6 w-full max-w-[500px] shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full z-10"
            >
              <X size={20} />
            </button>
            
            <h3 className="font-display-sm text-xl sm:text-2xl font-bold text-slate-800 mb-6 pr-8">Novo Agendamento</h3>
            
            <form className="space-y-4" onSubmit={handleCreateAppointment}>
              {/* Paciente do Banco */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Paciente *</label>
                <select 
                  required
                  value={formPatient}
                  onChange={(e) => setFormPatient(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">Selecione o paciente cadastrado...</option>
                  {patientsList.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">Carregado automaticamente da Gestão de Cadastros.</p>
              </div>

              {/* Terapeuta do Banco */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Terapeuta *</label>
                <select 
                  required
                  value={formTherapist}
                  onChange={(e) => setFormTherapist(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">Selecione o(a) terapeuta...</option>
                  {therapistsList.map(t => (
                    <option key={t.id} value={t.name}>
                      {t.name} {t.specialty ? `(${t.specialty})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Data *</label>
                  <input 
                    type="date" 
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-slate-600" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Horário *</label>
                  <input 
                    type="time" 
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-slate-600" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Local (Sala)</label>
                  <select 
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option>Sala 01 - Principal</option>
                    <option>Sala 02 - Integração Sensorial</option>
                    <option>Sala 03</option>
                    <option>Sala 04</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Valor da Sessão (R$)</label>
                  <input 
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="180,00"
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-slate-600"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-full sm:w-auto px-6 py-3 sm:py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 sm:py-2.5 font-bold bg-primary text-white hover:bg-primary/90 rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
