import { useState } from 'react';
import { Calendar as CalendarIcon, Plus, Filter, Search, CheckCircle, XCircle, Clock, MapPin, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface MasterAppointment {
  id: string;
  date: string;
  time: string;
  patientName: string;
  therapistName: string;
  room: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  justification?: string;
}

// Auxiliares para datas relativas no Mock
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const formatYMD = (d: Date) => d.toISOString().split('T')[0];

const mockAppointments: MasterAppointment[] = [
  { id: '1', date: formatYMD(today), time: '08:00', patientName: 'Pedro Henrique', therapistName: 'Dra. Mariana Costa', room: 'Sala 01', status: 'confirmed' },
  { id: '2', date: formatYMD(today), time: '09:00', patientName: 'Lucas Matheus Silva', therapistName: 'Dr. Roberto Alves', room: 'Sala 04', status: 'pending' },
  { id: '3', date: formatYMD(today), time: '10:00', patientName: 'Ana Júlia', therapistName: 'Dra. Mariana Costa', room: 'Sala 01', status: 'cancelled', justification: 'Paciente amanheceu com febre.' },
  { id: '4', date: formatYMD(tomorrow), time: '11:00', patientName: 'Marcos Vinícius', therapistName: 'Dra. Mariana Costa', room: 'Sala 02', status: 'confirmed' },
  { id: '5', date: formatYMD(yesterday), time: '14:00', patientName: 'Fernanda Lima', therapistName: 'Dr. Roberto Alves', room: 'Sala 03', status: 'confirmed' },
];

export default function GestaoAgenda() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados dos Filtros
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [therapistFilter, setTherapistFilter] = useState('Todos os Terapeutas');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Aplicação dos Filtros
  const filteredAppointments = mockAppointments.filter(apt => {
    const matchesDate = apt.date === formatYMD(selectedDate);
    const matchesTherapist = therapistFilter === 'Todos os Terapeutas' || apt.therapistName === therapistFilter;
    const matchesSearch = apt.patientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesTherapist && matchesSearch;
  });

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant shadow-sm">
        <div>
          <h2 className="font-display-sm text-3xl font-bold text-on-surface">Agenda Geral</h2>
          <p className="font-body-md text-on-surface-variant mt-1">Gerencie e acompanhe todos os agendamentos da clínica.</p>
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
              <option>Dra. Mariana Costa</option>
              <option>Dr. Roberto Alves</option>
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
          <div className="col-span-3">Status</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-surface-variant flex-1">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((apt) => (
              <div key={apt.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-surface-variant/10 transition-colors">
                <div className="col-span-1 font-headline-md font-bold text-on-surface flex items-center justify-center bg-surface-variant/30 py-2 rounded-lg">
                  {apt.time}
                </div>
                
                <div className="col-span-3 flex flex-col">
                  <span className="font-label-md font-bold text-on-surface">{apt.patientName}</span>
                  <span className="md:hidden font-body-sm text-on-surface-variant">Paciente</span>
                </div>
                
                <div className="col-span-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold text-xs">
                    {apt.therapistName.charAt(apt.therapistName.indexOf(' ') + 1)}
                  </div>
                  <span className="font-body-md text-on-surface-variant">{apt.therapistName}</span>
                </div>
                
                <div className="col-span-2 font-body-md text-on-surface-variant flex items-center gap-1">
                  <MapPin size={16} />
                  {apt.room}
                </div>
                
                <div className="col-span-3 flex flex-col items-start gap-1">
                  <div className={`px-3 py-1.5 rounded-full font-label-sm flex items-center gap-1.5 w-fit ${
                    apt.status === 'confirmed' ? 'bg-[#dcfce7] text-[#15803d]' : 
                    apt.status === 'cancelled' ? 'bg-error-container text-on-error-container' : 
                    'bg-secondary-container text-on-secondary-container'
                  }`}>
                    {apt.status === 'confirmed' && <CheckCircle size={14} />}
                    {apt.status === 'pending' && <Clock size={14} />}
                    {apt.status === 'cancelled' && <XCircle size={14} />}
                    
                    {apt.status === 'confirmed' ? 'Confirmado' : 
                     apt.status === 'cancelled' ? 'Cancelado' : 'Aguardando'}
                  </div>
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
              <p className="font-body-md text-on-surface-variant max-w-sm mt-2">
                Não há sessões marcadas para os filtros selecionados nesta data.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* NOVO AGENDAMENTO MODAL (DRAFT) */}
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
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Paciente</label>
                <select className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none appearance-none">
                  <option value="">Selecione o paciente...</option>
                  <option>Lucas Matheus Silva</option>
                  <option>Pedro Henrique</option>
                  <option>Ana Júlia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Terapeuta</label>
                <select className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none appearance-none">
                  <option value="">Selecione o terapeuta...</option>
                  <option>Dra. Mariana Costa (Psicologia)</option>
                  <option>Dr. Roberto Alves (Fonoaudiologia)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Data</label>
                  <input type="date" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-slate-600" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Horário</label>
                  <input type="time" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-slate-600" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Local (Sala)</label>
                <select className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none appearance-none">
                  <option>Sala 01 - Principal</option>
                  <option>Sala 02 - Integração Sensorial</option>
                  <option>Sala 03</option>
                </select>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-3 sm:py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="w-full sm:w-auto px-8 py-3 sm:py-2.5 font-bold bg-primary text-white hover:bg-primary/90 rounded-xl shadow-md transition-colors">
                  Agendar Sessão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
