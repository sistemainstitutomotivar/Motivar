import { useState } from 'react';
import { Calendar as CalendarIcon, Plus, Filter, Search, CheckCircle, XCircle, Clock } from 'lucide-react';

interface MasterAppointment {
  id: string;
  time: string;
  patientName: string;
  therapistName: string;
  room: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  justification?: string;
}

const mockAppointments: MasterAppointment[] = [
  { id: '1', time: '08:00', patientName: 'Pedro Henrique', therapistName: 'Dra. Mariana Costa', room: 'Sala 01', status: 'confirmed' },
  { id: '2', time: '09:00', patientName: 'Lucas Matheus Silva', therapistName: 'Dr. Roberto Alves', room: 'Sala 04', status: 'pending' },
  { id: '3', time: '10:00', patientName: 'Ana Júlia', therapistName: 'Dra. Mariana Costa', room: 'Sala 01', status: 'cancelled', justification: 'Paciente amanheceu com febre.' },
  { id: '4', time: '11:00', patientName: 'Marcos Vinícius', therapistName: 'Dr. João Silva', room: 'Sala 02', status: 'confirmed' },
];

export default function GestaoAgenda() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Todos os Terapeutas');

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
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-white p-4 rounded-2xl border border-surface-variant shadow-sm">
        
        {/* Date Selector (Visual Mock) */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="flex items-center gap-2 text-primary font-bold">
            <CalendarIcon size={20} />
            <span>Hoje, 22 de Setembro</span>
          </div>
          <button className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <select 
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-surface-variant rounded-xl focus:ring-2 focus:ring-primary outline-none font-body-sm text-on-surface appearance-none"
            >
              <option>Todos os Terapeutas</option>
              <option>Dra. Mariana Costa</option>
              <option>Dr. Roberto Alves</option>
            </select>
          </div>
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <input 
              type="text" 
              placeholder="Buscar paciente..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-surface-variant rounded-xl focus:ring-2 focus:ring-primary outline-none font-body-sm text-on-surface"
            />
          </div>
        </div>
      </div>

      {/* TIMELINE / LIST VIEW */}
      <div className="bg-white rounded-3xl border border-surface-variant shadow-sm overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-surface-container-lowest border-b border-surface-variant font-label-sm font-bold text-on-surface-variant uppercase tracking-wider hidden md:grid">
          <div className="col-span-1 text-center">Hora</div>
          <div className="col-span-3">Paciente</div>
          <div className="col-span-3">Terapeuta</div>
          <div className="col-span-2">Local</div>
          <div className="col-span-3">Status</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-surface-variant">
          {mockAppointments.map((apt) => (
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
                <span className="material-symbols-outlined text-[16px]">room</span>
                {apt.room}
              </div>
              
              <div className="col-span-3 flex flex-col items-start gap-1">
                <div className={`px-3 py-1.5 rounded-full font-label-sm flex items-center gap-1.5 w-fit ${
                  apt.status === 'confirmed' ? 'bg-[#cce5ff] text-[#00497d]' : 
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
          ))}
        </div>
      </div>

      {/* NOVO AGENDAMENTO MODAL (DRAFT) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            
            <h3 className="font-display-sm text-2xl font-bold text-slate-800 mb-6">Novo Agendamento</h3>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Paciente</label>
                <select className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none">
                  <option value="">Selecione o paciente...</option>
                  <option>Lucas Matheus Silva</option>
                  <option>Pedro Henrique</option>
                  <option>Ana Júlia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Terapeuta</label>
                <select className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none">
                  <option value="">Selecione o terapeuta...</option>
                  <option>Dra. Mariana Costa (Psicologia)</option>
                  <option>Dr. Roberto Alves (Fonoaudiologia)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <select className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none">
                  <option>Sala 01 - Principal</option>
                  <option>Sala 02 - Integração Sensorial</option>
                  <option>Sala 03</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-8 py-2.5 font-bold bg-primary text-white hover:bg-primary/90 rounded-xl shadow-md transition-colors">
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
