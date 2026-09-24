import { formatDateBR } from '../../lib/utils';
import { showAlert } from '../../lib/customAlert';
import { useState, useEffect } from 'react';
import { FileText, Calendar, Clock, Search, ChevronRight, Plus, UserCheck } from 'lucide-react';
import { getAppointments } from '../../lib/appointments';
import type { ClinicAppointment } from '../../lib/appointments';
import { logAuditEvent } from '../../lib/audit';
import { supabase } from '../../lib/supabase';

interface ClinicalNote {
  id: string;
  patient_id?: string;
  patient_name: string;
  therapist_name: string;
  date: string;
  content: string;
}

const initialNotes: ClinicalNote[] = [
  {
    id: 'note-1',
    patient_name: 'Lucas Matheus Silva',
    therapist_name: 'Dra. Mariana Costa',
    date: '2026-09-20',
    content: 'Paciente demonstrou excelente resposta aos estímulos visomotores hoje. Houve maior contato visual e tolerância às mudanças de atividade.'
  },
  {
    id: 'note-2',
    patient_name: 'Mariana Costa',
    therapist_name: 'Dra. Mariana Costa',
    date: '2026-09-21',
    content: 'Trabalhada a regulação emocional e atenção compartilhada. Sessão produtiva com participação ativa.'
  }
];

export default function TherapistDashboard() {
  const [activeTab, setActiveTab] = useState<'agenda' | 'prontuarios'>('agenda');
  const [appointments, setAppointments] = useState<ClinicAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Terapeuta ativa (simulada ou do login)
  const currentTherapistName = 'Dra. Mariana Costa';

  // Pacientes e Prontuários
  const [selectedPatientName, setSelectedPatientName] = useState<string | null>(null);
  const [notes, setNotes] = useState<ClinicalNote[]>(initialNotes);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTherapistAppointments();
    loadClinicalNotes();
  }, []);

  const loadTherapistAppointments = async () => {
    setLoading(true);
    try {
      const allApts = await getAppointments();
      // Filtra os agendamentos da Agenda Geral vinculados a esta terapeuta
      const myApts = allApts.filter(a => 
        a.therapist_name.toLowerCase().includes('mariana') || 
        a.therapist_name === currentTherapistName
      );
      setAppointments(myApts.length > 0 ? myApts : allApts.slice(0, 3));
    } catch (err) {
      console.warn('Erro ao carregar agenda do terapeuta:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClinicalNotes = async () => {
    try {
      const { data } = await supabase.from('clinic_clinical_notes').select('*').order('date', { ascending: false });
      if (data && data.length > 0) {
        setNotes([...data, ...initialNotes]);
      }
    } catch (err) {
      console.warn('Erro ao carregar notas:', err);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !selectedPatientName) return;

    const newNote: ClinicalNote = {
      id: crypto.randomUUID(),
      patient_name: selectedPatientName,
      therapist_name: currentTherapistName,
      date: new Date().toLocaleDateString('pt-BR'),
      content: newNoteContent.trim(),
    };

    // Salva no estado
    setNotes(prev => [newNote, ...prev]);
    setNewNoteContent('');
    setIsAddingNote(false);

    // Tenta persistir no Supabase
    try {
      await supabase.from('clinic_clinical_notes').insert([newNote]);
    } catch (err) {
      console.warn('Persistindo nota apenas em memória:', err);
    }

    // Registra Auditoria Compulsória
    await logAuditEvent({
      action: 'INCLUSAO_NOTA',
      entity_type: 'prontuario',
      entity_id: newNote.id,
      entity_name: `Evolução Clínica: ${selectedPatientName}`,
      details: {
        paciente: selectedPatientName,
        terapeuta: currentTherapistName,
        trecho: newNote.content.slice(0, 100) + '...'
      }
    });

    showAlert('Aviso', 'Evolução clínica salva e registrada na trilha de auditoria!');
  };

  // Extrai lista única de pacientes desta terapeuta
  const therapistPatients = Array.from(new Set(appointments.map(a => a.patient_name)))
    .map(name => {
      const apt = appointments.find(a => a.patient_name === name);
      return {
        name,
        avatar: apt?.patient_avatar,
        nextSession: `${formatDateBR(apt?.date || '')} às ${apt?.time}`,
        condition: 'Em Acompanhamento Terapêutico'
      };
    });

  const filteredPatients = therapistPatients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* TABS */}
      <div className="flex bg-surface-variant/30 p-1 rounded-xl w-full md:w-fit mb-4">
        <button 
          onClick={() => { setActiveTab('agenda'); setSelectedPatientName(null); }}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-label-md transition-all flex items-center gap-2 ${activeTab === 'agenda' ? 'bg-white text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <Calendar size={18} />
          Minha Agenda (Sincronizada)
        </button>
        <button 
          onClick={() => setActiveTab('prontuarios')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-label-md transition-all flex items-center gap-2 ${activeTab === 'prontuarios' ? 'bg-white text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <FileText size={18} />
          Meus Pacientes (Prontuários & Evolução)
        </button>
      </div>

      {/* ABA 1: MINHA AGENDA (ALIMENTADA DA AGENDA GERAL) */}
      {activeTab === 'agenda' && (
        <div className="space-y-6">
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCheck size={24} className="text-primary" />
              <div>
                <p className="font-bold text-slate-800">Visualizando agenda de: {currentTherapistName}</p>
                <p className="text-xs text-slate-500">Agendamentos criados pela recepção ou admin na Agenda Geral aparecem automaticamente aqui.</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-primary text-white px-3 py-1 rounded-full">
              {appointments.length} Sessões marcadas
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">Carregando sessões sincronizadas...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appointments.map((apt) => (
              <div key={apt.id} className="glass-card rounded-2xl p-5 border-l-4 border-l-primary flex flex-col justify-between hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {apt.patient_avatar ? (
                      <img src={apt.patient_avatar} alt={apt.patient_name} className="w-12 h-12 rounded-full object-cover border-2 border-surface shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-sm shadow-sm">
                        {apt.patient_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-headline-md text-[16px] font-bold text-on-surface">{apt.patient_name}</h4>
                      <span className="font-label-sm text-on-surface-variant">{apt.room}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-primary bg-primary-container/30 w-fit px-3 py-1.5 rounded-lg mt-2">
                  <Clock size={16} />
                  <span className="font-label-md font-bold">{formatDateBR(apt.date)} - {apt.time}</span>
                </div>

                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => { setActiveTab('prontuarios'); setSelectedPatientName(apt.patient_name); }}
                    className="flex-1 py-2 bg-surface-variant text-on-surface rounded-xl font-label-sm hover:bg-surface-variant/80 transition-colors flex justify-center items-center gap-1 font-semibold"
                  >
                    Abrir Prontuário <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

      {/* ABA 2: PRONTUÁRIOS E EVOLUÇÕES CLÍNICAS */}
      {activeTab === 'prontuarios' && !selectedPatientName && (
        <div className="bg-white rounded-3xl border border-surface-variant shadow-sm overflow-hidden p-6">
          <div className="relative w-full md:w-96 mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input 
              type="text" 
              placeholder="Buscar paciente pelo nome..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-surface-variant rounded-xl focus:ring-2 focus:ring-primary outline-none font-body-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPatients.map(patient => (
              <div 
                key={patient.name} 
                onClick={() => setSelectedPatientName(patient.name)}
                className="flex items-center justify-between p-4 border border-surface-variant rounded-2xl hover:border-primary/50 hover:bg-surface-variant/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  {patient.avatar ? (
                    <img src={patient.avatar} alt={patient.name} className="w-14 h-14 rounded-full object-cover border-2 border-surface shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-lg shadow-sm">
                      {patient.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-headline-md text-[16px] font-bold text-on-surface">{patient.name}</h4>
                    <p className="font-body-sm text-on-surface-variant">{patient.nextSession}</p>
                  </div>
                </div>
                <button className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center">
                  <FileText size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETALHE DO PRONTUÁRIO COM INCLUSÃO DE NOTAS AUDITADAS */}
      {activeTab === 'prontuarios' && selectedPatientName && (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Menu Lateral do Paciente */}
          <div className="w-full md:w-72 flex flex-col gap-4">
            <div className="bg-white p-6 rounded-3xl border border-surface-variant shadow-sm flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-secondary-container text-secondary flex items-center justify-center text-3xl font-bold shadow-md mb-4">
                {selectedPatientName.charAt(0)}
              </div>
              <h3 className="font-headline-md text-lg font-bold text-on-surface">{selectedPatientName}</h3>
              <p className="font-label-sm text-on-surface-variant bg-surface-variant px-3 py-1 rounded-full mt-2">Prontuário Ativo</p>
              
              <button 
                onClick={() => setSelectedPatientName(null)}
                className="mt-6 text-sm text-secondary hover:underline font-bold"
              >
                ← Voltar para lista
              </button>
            </div>
          </div>

          {/* Área Principal do Prontuário */}
          <div className="flex-1 bg-white p-6 rounded-3xl border border-surface-variant shadow-sm flex flex-col min-h-[500px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-surface-variant">
              <div>
                <h2 className="font-display-sm text-2xl font-bold text-on-surface">Prontuário & Evolução</h2>
                <p className="text-xs text-slate-400">Todas as notas inseridas são carimbadas na trilha de auditoria do sistema.</p>
              </div>
              <button 
                onClick={() => setIsAddingNote(true)}
                className="bg-primary text-on-primary px-4 py-2 rounded-xl font-label-md font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Plus size={18} />
                Nova Evolução Clínica
              </button>
            </div>

            {/* Modal / Formulário de Nova Nota */}
            {isAddingNote && (
              <form onSubmit={handleSaveNote} className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-700 text-sm">Registrar Nova Evolução Clínica</h4>
                <textarea 
                  required
                  rows={4}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Descreva as atividades realizadas na sessão, respostas do paciente, avanços observados e orientações para os pais..."
                  className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary outline-none font-body-sm text-slate-700"
                />
                <div className="flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingNote(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-200 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 text-sm font-bold bg-primary text-white rounded-lg shadow-sm hover:bg-primary/90"
                  >
                    Salvar no Prontuário
                  </button>
                </div>
              </form>
            )}

            {/* Lista de Evoluções Cadastradas */}
            <div className="space-y-4">
              {notes.filter(n => n.patient_name === selectedPatientName).length > 0 ? (
                notes
                  .filter(n => n.patient_name === selectedPatientName)
                  .map(note => (
                    <div key={note.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="flex justify-between items-center text-xs text-slate-500 pb-2 border-b border-slate-200">
                        <span className="font-bold text-primary">{note.therapist_name}</span>
                        <span>{formatDateBR(note.date)}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-on-surface-variant border-2 border-dashed border-surface-variant rounded-2xl p-8 bg-slate-50">
                  <FileText size={48} className="mb-4 text-slate-300" />
                  <h4 className="font-headline-md text-lg font-bold text-slate-700 mb-2">Nenhuma evolução registrada ainda</h4>
                  <p className="font-body-md text-slate-500 w-full max-w-[384px] mx-auto px-4 mt-2">
                    Clique no botão acima para registrar a primeira evolução clínica deste paciente.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
