import { showAlert, showConfirm } from '../../lib/customAlert';
import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Plus, Filter, Search, CheckCircle, XCircle, 
  Clock, MapPin, ChevronLeft, ChevronRight, X, Activity, Play,
  Repeat, CalendarRange, Trash2, Copy, Edit2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { 
  getAppointments, 
    createBatchAppointments, 
    updateAppointmentStatus,
  updateAppointment
} from '../../lib/appointments';
import type { ClinicAppointment } from '../../lib/appointments';

const today = new Date();
const formatYMD = (d: Date) => d.toISOString().split('T')[0];

const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

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
  const [patientsList, setPatientsList] = useState<{ id: string; name: string; avatar_url?: string; therapies?: string[] }[]>([]);
  const [therapistsList, setTherapistsList] = useState<{ id: string; name: string; specialty?: string; avatar_url?: string }[]>([]);

  // Estados dos Filtros
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [therapistFilter, setTherapistFilter] = useState('Todos os Terapeutas');
  const [recurrenceFilter, setRecurrenceFilter] = useState<'all' | 'single' | 'weekly' | 'biweekly'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Formulário de Planejamento Mensal
  const [formPatient, setFormPatient] = useState('');
  const [referenceMonth, setReferenceMonth] = useState(formatYMD(today).slice(0, 7)); // "YYYY-MM"
  const [weeklyTherapies, setWeeklyTherapies] = useState([{ id: crypto.randomUUID(), dayOfWeek: 1, time: '09:00', therapist: '', room: 'Sala 01 - Principal' }]);
  const [replicateNextMonth, setReplicateNextMonth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(formatYMD(today)); // Apenas para edição

  // Cancelamento
  const [cancelModalData, setCancelModalData] = useState<{
    isOpen: boolean;
    appointmentId: string | null;
    patientName: string | null;
    appointmentDate: string | null;
    appointmentTime: string | null;
    requestedBy: 'patient' | 'therapist' | 'clinic' | '';
    reason: string;
  }>({
    isOpen: false,
    appointmentId: null,
    patientName: null,
    appointmentDate: null,
    appointmentTime: null,
    requestedBy: '',
    reason: ''
  });

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
      const { data: dbPatients } = await supabase.from('clinic_patients').select('id, name, avatar_url, therapies').order('name');
      const basePatients = [
        { id: 'mock-p1', name: 'Lucas Matheus Silva', therapies: ['Psicologia', 'Fonoaudiologia'] },
        { id: 'mock-p2', name: 'Pedro Henrique', therapies: ['Terapia Ocupacional'] },
        { id: 'mock-p3', name: 'Ana Júlia', therapies: [] },
        { id: 'mock-p4', name: 'Rafael Gomes', therapies: [] },
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
    if (newStatus === 'cancelled') {
      openCancelModal(apt);
      return;
    }

    let justification: string | undefined = undefined;

    // Atualiza estado visual
    setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: newStatus, justification } : a));

    // Persiste no banco e gera log
    await updateAppointmentStatus(apt.id, newStatus, justification, apt.patient_name);
  };

  const openCancelModal = (apt: ClinicAppointment) => {
    setCancelModalData({
      isOpen: true,
      appointmentId: apt.id,
      patientName: apt.patient_name,
      appointmentDate: apt.date,
      appointmentTime: apt.time,
      requestedBy: '',
      reason: ''
    });
  };

  const confirmCancellation = async () => {
    const { appointmentId, requestedBy, reason, appointmentDate, appointmentTime, patientName } = cancelModalData;
    if (!requestedBy) {
      showAlert('Aviso', "Selecione quem solicitou o cancelamento.");
      return;
    }
    if (!reason.trim()) {
      showAlert('Aviso', "Informe a observação/motivo do cancelamento.");
      return;
    }
    if (!appointmentId || !appointmentDate || !appointmentTime) return;

    let statusNote = "";

    if (requestedBy === 'patient') {
      const now = new Date();
      const [year, month, day] = appointmentDate.split('-').map(Number);
      const [hours, minutes] = appointmentTime.split(':').map(Number);
      const aptDateTime = new Date(year, month - 1, day, hours, minutes);
      
      const diffMs = aptDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 24) {
        statusNote = "[CANCELADO PELO PACIENTE < 24H: Faturado]";
        const isPast = diffHours < 0;
        const confirmCancel = await showConfirm('Atenção', 
          `Atenção: Este cancelamento solicitado pelo PACIENTE está sendo feito com menos de 24h de antecedência (${
            isPast ? 'Sessão já ocorreu ou está no horário' : Math.floor(diffHours) + 'h restantes'
          }).\n\nSegundo a política da clínica, a sessão será faturada normalmente.\n\nDeseja prosseguir?`
        );
        if (!confirmCancel) return;
      } else {
        statusNote = "[CANCELADO PELO PACIENTE > 24H: Reagendamento Permitido]";
      }
    } else {
      const origin = requestedBy === 'therapist' ? 'TERAPEUTA' : 'CLÍNICA';
      statusNote = `[CANCELADO PELA ${origin}: Reagendamento Permitido]`;
    }

    const finalJustification = `${statusNote} ${reason.trim()}`;

    // Atualiza estado visual
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: 'cancelled', justification: finalJustification } : a));

    // Persiste no banco e gera log
    await updateAppointmentStatus(appointmentId, 'cancelled', finalJustification, patientName || undefined);
    
    // Fecha modal
    setCancelModalData(prev => ({ ...prev, isOpen: false }));
  };

  const handleEditAppointment = (apt: ClinicAppointment) => {
    setEditingAppointmentId(apt.id);
    setFormPatient(apt.patient_name);
    setFormDate(apt.date);
    const d = new Date(apt.date + 'T12:00:00');
    setWeeklyTherapies([{
      id: crypto.randomUUID(),
      dayOfWeek: d.getDay(),
      time: apt.time,
      therapist: apt.therapist_name,
      room: apt.room
    }]);
    setIsModalOpen(true);
  };

  const handleDuplicateAppointment = (apt: ClinicAppointment) => {
    setEditingAppointmentId(null);
    setFormPatient(apt.patient_name);
    setReferenceMonth(formatYMD(today).slice(0, 7));
    const d = new Date(apt.date + 'T12:00:00');
    setWeeklyTherapies([{
      id: crypto.randomUUID(),
      dayOfWeek: d.getDay(),
      time: apt.time,
      therapist: apt.therapist_name,
      room: apt.room
    }]);
    setReplicateNextMonth(false);
    setIsModalOpen(true);
  };


  // Salvar Novo Agendamento (Planejamento Mensal)
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatient) {
      showAlert('Aviso', 'Por favor, selecione o paciente.');
      return;
    }

    const invalidTherapy = weeklyTherapies.find(t => !t.therapist || !t.time);
    if (invalidTherapy) {
      showAlert('Aviso', 'Preencha horário e terapeuta para todas as terapias na grade.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedPatientObj = patientsList.find(p => p.name === formPatient);

      if (editingAppointmentId) {
        // Modo Edição de 1 sessão
        const t = weeklyTherapies[0];
        const selectedTherapistObj = therapistsList.find(th => th.name === t.therapist);
        const baseAppointmentData = {
          date: formDate,
          time: t.time,
          duration_minutes: 50,
          patient_id: selectedPatientObj?.id,
          patient_name: formPatient,
          patient_avatar: selectedPatientObj?.avatar_url,
          therapist_id: selectedTherapistObj?.id,
          therapist_name: t.therapist,
          therapist_avatar: selectedTherapistObj?.avatar_url,
          room: t.room,
        };
        await updateAppointment(editingAppointmentId, baseAppointmentData);
        setAppointments(prev => prev.map(a => 
          a.id === editingAppointmentId ? { ...a, ...baseAppointmentData } : a
        ));
        showAlert('Aviso', 'Agendamento atualizado com sucesso!');
      } else {
        // Modo Criação Mensal
        const groupId = crypto.randomUUID();
        const occurrences: any[] = [];
        
        const [year, month] = referenceMonth.split('-').map(Number);
        const monthsToGenerate = replicateNextMonth ? [month, month === 12 ? 1 : month + 1] : [month];
        const yearsToGenerate = replicateNextMonth ? [year, month === 12 ? year + 1 : year] : [year];

        monthsToGenerate.forEach((m, idx) => {
          const y = yearsToGenerate[idx];
          const daysInMonth = new Date(y, m, 0).getDate();
          
          for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(y, m - 1, day, 12, 0, 0);
            const dayOfWeek = dateObj.getDay();
            
            const matchedTherapies = weeklyTherapies.filter(t => t.dayOfWeek === dayOfWeek);
            
            matchedTherapies.forEach(t => {
              const selectedTherapistObj = therapistsList.find(th => th.name === t.therapist);
              occurrences.push({
                date: dateObj.toISOString().split('T')[0],
                time: t.time,
                duration_minutes: 50,
                patient_id: selectedPatientObj?.id,
                patient_name: formPatient,
                patient_avatar: selectedPatientObj?.avatar_url,
                therapist_id: selectedTherapistObj?.id,
                therapist_name: t.therapist,
                therapist_avatar: selectedTherapistObj?.avatar_url,
                room: t.room,
                status: 'confirmed',
                payment_status: 'pending',
                recurrence_type: 'weekly',
                recurrence_group_id: groupId,
              });
            });
          }
        });

        if (occurrences.length === 0) {
          showAlert('Aviso', 'Nenhum dia correspondente encontrado no mês selecionado.');
          setIsSubmitting(false);
          return;
        }

        const createdBatch = await createBatchAppointments(occurrences);
        setAppointments(prev => [...createdBatch, ...prev]);
        showAlert('Aviso', `Planejamento mensal gerado com sucesso! ${createdBatch.length} sessões agendadas.`);
      }

      setIsModalOpen(false);
      setFormPatient('');
      setWeeklyTherapies([{ id: crypto.randomUUID(), dayOfWeek: 1, time: '09:00', therapist: '', room: 'Sala 01 - Principal' }]);
      setEditingAppointmentId(null);
    } catch (err) {
      console.error(err);
      showAlert('Aviso', 'Ocorreu um erro ao salvar o planejamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Aplicação dos Filtros
  const filteredAppointments = appointments.filter(apt => {
    const matchesDate = apt.date === formatYMD(selectedDate);
    const matchesTherapist = therapistFilter === 'Todos os Terapeutas' || apt.therapist_name === therapistFilter;
    const matchesRecurrence = recurrenceFilter === 'all' || (apt.recurrence_type || 'single') === recurrenceFilter;
    const matchesSearch = apt.patient_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesTherapist && matchesRecurrence && matchesSearch;
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
          {/* Filtro por Terapeuta */}
          <div className="relative flex-1 md:w-56">
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

          {/* Filtro por Tipo de Recorrência */}
          <div className="relative flex-1 md:w-44">
            <Repeat className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <select 
              value={recurrenceFilter}
              onChange={(e) => setRecurrenceFilter(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-surface-variant rounded-xl focus:ring-2 focus:ring-primary outline-none font-body-sm text-on-surface appearance-none"
            >
              <option value="all">Todos os Planos</option>
              <option value="weekly">Semanal Fixo</option>
              <option value="biweekly">Quinzenal</option>
              <option value="single">Avulsa</option>
            </select>
          </div>

          {/* Busca por Paciente */}
          <div className="relative flex-1 md:w-64">
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
          <div className="col-span-3">Paciente & Plano</div>
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
                
                {/* Paciente Column com Avatar e Tipo de Plano */}
                <div className="col-span-3 flex items-center gap-3">
                  {apt.patient_avatar ? (
                    <img src={apt.patient_avatar} alt={apt.patient_name} className="w-10 h-10 rounded-full object-cover border border-surface-variant shadow-sm shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                      {apt.patient_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-label-md font-bold text-on-surface">{apt.patient_name}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {apt.recurrence_type === 'weekly' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200" title="Terapia semanal fixa">
                          <Repeat size={10} /> Semanal Fixo
                        </span>
                      ) : apt.recurrence_type === 'biweekly' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200" title="Terapia quinzenal">
                          <CalendarRange size={10} /> Quinzenal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200" title="Sessão avulsa">
                          <Clock size={10} /> Avulsa
                        </span>
                      )}
                      <span className="md:hidden font-body-sm text-on-surface-variant">Paciente</span>
                    </div>
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
                    
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                    
                    <button 
                      onClick={() => handleEditAppointment(apt)}
                      title="Editar Agendamento"
                      className="p-1 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>

                    <button 
                      onClick={() => handleDuplicateAppointment(apt)}
                      title="Copiar / Duplicar Consulta"
                      className="p-1 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Copy size={18} />
                    </button>
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

      {/* NOVO AGENDAMENTO MODAL (PLANEJAMENTO MENSAL) */}
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
              {editingAppointmentId ? 'Editar Agendamento' : 'Novo Planejamento Mensal'}
            </h3>
            
            <form className="space-y-6" onSubmit={handleSaveAppointment}>
              {/* Informações Gerais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>
                {!editingAppointmentId && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Mês/Ano de Referência *</label>
                    <input 
                      type="month" 
                      required
                      value={referenceMonth}
                      onChange={(e) => setReferenceMonth(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-slate-600" 
                    />
                  </div>
                )}
                {editingAppointmentId && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Data da Sessão *</label>
                    <input 
                      type="date" 
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-slate-600" 
                    />
                  </div>
                )}
              </div>

              <hr className="border-slate-100" />

              {/* Grade Semanal */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Grade Semanal do Paciente</h3>
                  {!editingAppointmentId && (
                    <p className="text-xs text-slate-500">Defina os dias fixos na semana</p>
                  )}
                </div>

                {weeklyTherapies.map((therapy) => (
                  <div key={therapy.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 relative">
                    {!editingAppointmentId && weeklyTherapies.length > 1 && (
                      <div 
                        className="absolute top-4 right-4 text-red-500 cursor-pointer hover:bg-red-500/10 p-1 rounded"
                        onClick={() => setWeeklyTherapies(prev => prev.filter(t => t.id !== therapy.id))}
                        title="Remover Terapia"
                      >
                        <Trash2 size={16} />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                      {!editingAppointmentId && (
                        <div>
                          <label className="block text-xs font-bold mb-1 text-slate-500">Dia da Semana *</label>
                          <select 
                            value={therapy.dayOfWeek}
                            onChange={(e) => setWeeklyTherapies(prev => prev.map(t => t.id === therapy.id ? { ...t, dayOfWeek: Number(e.target.value) } : t))}
                            className="w-full border border-slate-200 rounded-md p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-primary"
                          >
                            {DAYS_OF_WEEK.map(d => (
                              <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold mb-1 text-slate-500">Horário *</label>
                        <input 
                          type="time" 
                          required
                          value={therapy.time}
                          onChange={(e) => setWeeklyTherapies(prev => prev.map(t => t.id === therapy.id ? { ...t, time: e.target.value } : t))}
                          className="w-full border border-slate-200 rounded-md p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-slate-500">Terapeuta *</label>
                        <select 
                          required
                          value={therapy.therapist}
                          onChange={(e) => setWeeklyTherapies(prev => prev.map(t => t.id === therapy.id ? { ...t, therapist: e.target.value } : t))}
                          className="w-full border border-slate-200 rounded-md p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Selecione...</option>
                          {therapistsList.map(t => (
                            <option key={t.id} value={t.name}>
                              {t.name} {t.specialty ? `(${t.specialty})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-slate-500">Local (Sala)</label>
                        <select 
                          value={therapy.room}
                          onChange={(e) => setWeeklyTherapies(prev => prev.map(t => t.id === therapy.id ? { ...t, room: e.target.value } : t))}
                          className="w-full border border-slate-200 rounded-md p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option>Sala 01 - Principal</option>
                          <option>Sala 02 - Integração Sensorial</option>
                          <option>Sala 03</option>
                          <option>Sala 04</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                {!editingAppointmentId && (
                  <button 
                    type="button"
                    onClick={() => setWeeklyTherapies(prev => [...prev, { id: crypto.randomUUID(), dayOfWeek: 1, time: '10:00', therapist: '', room: 'Sala 01 - Principal' }])}
                    className="w-full py-3 border-2 border-dashed border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Adicionar Nova Terapia na Semana
                  </button>
                )}
              </div>

              {!editingAppointmentId && (
                <>
                  <hr className="border-slate-100" />
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={replicateNextMonth}
                        onChange={(e) => setReplicateNextMonth(e.target.checked)}
                        className="mt-1 w-4 h-4 accent-primary text-white rounded border-gray-300"
                      />
                      <div>
                        <span className="block font-bold text-slate-800">Replicar automaticamente para o mês seguinte</span>
                        <span className="block text-sm text-slate-500 mt-0.5">As terapias dessa grade serão copiadas para os mesmos dias da semana no mês subsequente.</span>
                      </div>
                    </label>
                  </div>
                </>
              )}

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
                  {isSubmitting ? 'Salvando...' : (editingAppointmentId ? 'Salvar Alteração' : 'Salvar Planejamento Mensal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CANCELAMENTO */}
      {cancelModalData.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-3xl p-6 w-full max-w-[500px] shadow-2xl relative flex flex-col">
            <button 
              onClick={() => setCancelModalData(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full z-10"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6 pr-8">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                <XCircle size={24} />
              </div>
              <h3 className="font-display-sm text-xl sm:text-2xl font-bold text-slate-800">
                Cancelar Sessão
              </h3>
            </div>

            <div className="bg-surface-variant/30 p-4 rounded-xl mb-6">
              <p className="text-sm text-on-surface-variant mb-1">
                <span className="font-bold text-slate-700">Paciente:</span> {cancelModalData.patientName}
              </p>
              <p className="text-sm text-on-surface-variant">
                <span className="font-bold text-slate-700">Data/Hora:</span> {cancelModalData.appointmentDate} às {cancelModalData.appointmentTime}
              </p>
            </div>
            
            <div className="space-y-4 flex-1">
              {/* Origem do Cancelamento */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Quem solicitou o cancelamento? *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCancelModalData(prev => ({ ...prev, requestedBy: 'patient' }))}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      cancelModalData.requestedBy === 'patient'
                        ? 'border-error bg-error/10 text-error ring-2 ring-error/20 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <span className="text-sm font-bold">O Paciente</span>
                    <span className="text-[11px] font-normal opacity-80">Sujeito a cobrança se &lt; 24h</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelModalData(prev => ({ ...prev, requestedBy: 'clinic' }))}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      cancelModalData.requestedBy === 'clinic' || cancelModalData.requestedBy === 'therapist'
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <span className="text-sm font-bold">A Clínica / Terapeuta</span>
                    <span className="text-[11px] font-normal opacity-80">Isenta o paciente (reagendamento)</span>
                  </button>
                </div>
              </div>

              {/* Justificativa */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Motivo / Observação *</label>
                <textarea
                  value={cancelModalData.reason}
                  onChange={(e) => setCancelModalData(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  placeholder="Ex: Cancelado pelo paciente via telefone..."
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-error outline-none text-slate-700 resize-none"
                />
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-6">
              <button 
                type="button" 
                onClick={() => setCancelModalData(prev => ({ ...prev, isOpen: false }))} 
                className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Voltar
              </button>
              <button 
                type="button" 
                onClick={confirmCancellation}
                disabled={!cancelModalData.requestedBy || !cancelModalData.reason.trim()}
                className="px-6 py-2.5 font-bold bg-error text-white hover:bg-error/90 rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
