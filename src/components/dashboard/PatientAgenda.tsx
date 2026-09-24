import { supabase } from '../../lib/supabase';
import { formatDateBR } from '../../lib/utils';
import { showAlert, showConfirm } from '../../lib/customAlert';
import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Info, CheckCircle, XCircle } from 'lucide-react';
import { updateAppointmentStatus } from '../../lib/appointments';

export default function PatientAgenda() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [justifyingId, setJustifyingId] = useState<string | null>(null);
  const [justification, setJustification] = useState('');
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPatientName, setCurrentPatientName] = useState('Paciente');

  useEffect(() => {
    loadPatientAppointments();
  }, []);

  const loadPatientAppointments = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      // 1. Busca paciente
      const { data: patientData } = await supabase
        .from('clinic_patients')
        .select('id, name')
        .eq('email', user.email)
        .single();

      if (patientData) {
        setCurrentPatientName(patientData.name);
        
        // 2. Busca consultas futuras
        const today = new Date().toISOString().split('T')[0];
        const { data: appts } = await supabase
          .from('clinic_appointments')
          .select('*')
          .eq('patient_id', patientData.id)
          .gte('date', today)
          .order('date', { ascending: true })
          .order('time', { ascending: true })
          .limit(10);
          
        if (appts) {
          setAppointments(appts);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar agenda do paciente:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    setAppointments(prev => prev.map(s => s.id === id ? { ...s, status: 'confirmed' } : s));
    const target = appointments.find(a => a.id === id);
    await updateAppointmentStatus(id, 'confirmed', undefined, target?.patient_name || currentPatientName);
    showAlert('Aviso', 'Presença confirmada com sucesso! A clínica já foi notificada.');
  };

  const handleCancel = async (id: string) => {
    if (justification.trim() === '') return;
    const target = appointments.find(a => a.id === id);
    if (!target) return;

    // Lógica 24h do lado do Paciente
    const now = new Date();
    const [year, month, day] = target.date.split('-').map(Number);
    const [hours, minutes] = target.time.split(':').map(Number);
    const aptDateTime = new Date(year, month - 1, day, hours, minutes);
    
    const diffMs = aptDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let statusNote = "";
    if (diffHours < 24) {
      statusNote = "[CANCELADO PELO PACIENTE < 24H: Faturado]";
      const isPast = diffHours < 0;
      const confirmCancel = await showConfirm('Atenção', 
        `Atenção: Você está cancelando esta sessão com menos de 24h de antecedência (${
          isPast ? 'Sessão já ocorreu ou está no horário' : Math.floor(diffHours) + 'h restantes'
        }).\n\nSegundo as políticas da clínica, essa sessão será considerada executada e faturada normalmente no seu plano.\n\nDeseja confirmar o cancelamento ciente desta regra?`
      );
      if (!confirmCancel) return;
    } else {
      statusNote = "[CANCELADO PELO PACIENTE > 24H: Reagendamento Permitido]";
      showAlert('Aviso', `Cancelamento dentro do prazo (mais de 24h).\n\nVocê tem direito a reagendar esta sessão sem custo adicional.`);
    }

    const finalReason = `${statusNote} ${justification.trim()}`;

    setAppointments(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled', justification: finalReason } : s));
    setJustifyingId(null);
    setJustification('');

    await updateAppointmentStatus(id, 'cancelled', finalReason, target.patient_name || currentPatientName);
    showAlert('Aviso', 'Cancelamento registrado na clínica com justificativa salva na auditoria.');
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="font-headline-md text-on-surface text-2xl font-bold">Minha Agenda</h3>
          <p className="text-sm text-slate-500">Sincronizada em tempo real com a Agenda Geral da clínica.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Carregando seus agendamentos...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 items-start">
          {appointments.map(session => {
            const isExpanded = expandedId === session.id;
            const isJustifying = justifyingId === session.id;

            return (
              <div 
                key={session.id} 
                className={`glass-card rounded-3xl overflow-hidden transition-all duration-300 ease-in-out border ${
                  isExpanded ? 'border-primary shadow-xl scale-[1.02]' : 'border-surface-variant hover:border-primary/50 cursor-pointer shadow-md'
                } flex flex-col`}
                onClick={() => !isExpanded && setExpandedId(session.id)}
              >
                {/* STATUS INDICATOR BAR */}
                <div className={`h-2 w-full transition-colors ${
                  session.status === 'confirmed' ? 'bg-[#008537]' : 
                  session.status === 'cancelled' ? 'bg-error' : 
                  'bg-secondary'
                }`} />

                {/* MINI CARD HEADER */}
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    
                    {/* IMAGENS E TÍTULO */}
                    <div className={`flex w-full ${isExpanded ? 'flex-col gap-4' : 'items-center gap-3'}`}>
                      
                      {/* CONTAINER DE FOTOS */}
                      <div className={isExpanded ? 'flex items-center gap-6 justify-center w-full bg-surface-container-lowest p-4 rounded-2xl border border-surface-variant' : 'relative shrink-0'}>
                        {/* Terapeuta */}
                        <div className={isExpanded ? 'flex flex-col items-center gap-2' : ''}>
                          {session.therapist_avatar ? (
                            <img 
                              src={session.therapist_avatar} 
                              alt="Terapeuta" 
                              className={`object-cover border-2 border-surface shadow-sm rounded-full transition-all duration-300 ${isExpanded ? 'w-20 h-20' : 'w-12 h-12 z-10 relative'}`} 
                            />
                          ) : (
                            <div className={`rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-sm ${isExpanded ? 'w-20 h-20 text-2xl' : 'w-12 h-12 z-10 relative text-sm'}`}>
                              {session.therapist_name.charAt(session.therapist_name.indexOf(' ') + 1 || 0)}
                            </div>
                          )}
                          {isExpanded && <span className="font-label-sm text-primary font-bold">Terapeuta</span>}
                        </div>
                        
                        {/* Paciente */}
                        <div className={isExpanded ? 'flex flex-col items-center gap-2' : ''}>
                          {session.patient_avatar ? (
                            <img 
                              src={session.patient_avatar} 
                              alt="Paciente" 
                              className={`object-cover border-2 border-surface shadow-sm rounded-full transition-all duration-300 ${isExpanded ? 'w-20 h-20' : 'w-10 h-10 absolute -bottom-2 -right-3 z-0'}`} 
                            />
                          ) : (
                            <div className={`rounded-full bg-secondary text-white flex items-center justify-center font-bold shadow-sm ${isExpanded ? 'w-20 h-20 text-2xl' : 'w-10 h-10 absolute -bottom-2 -right-3 z-0 text-xs'}`}>
                              {session.patient_name.charAt(0)}
                            </div>
                          )}
                          {isExpanded && <span className="font-label-sm text-secondary font-bold">Você</span>}
                        </div>
                      </div>

                      {/* NOME E FUNÇÃO */}
                      <div className={`${isExpanded ? 'text-center w-full' : 'ml-2'}`}>
                        <h4 className={`font-headline-md font-bold text-on-surface leading-tight ${isExpanded ? 'text-xl' : 'text-[16px]'}`}>
                          {session.therapist_name}
                        </h4>
                        <span className="font-label-sm text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded-md mt-1 inline-block">
                          {session.room}
                        </span>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setExpandedId(null); setJustifyingId(null); }}
                        className="absolute top-6 right-6 w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center hover:bg-error/10 hover:text-error transition-colors z-20"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  {/* HORÁRIO E DATA */}
                  <div className={`flex items-center gap-4 mt-2 ${isExpanded ? 'justify-center bg-surface-variant/30 p-3 rounded-xl' : ''}`}>
                    <div className="flex items-center gap-1.5 text-on-surface">
                      <Calendar size={20} className="text-primary" />
                      <span className="font-label-md font-bold">{formatDateBR(session.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface">
                      <Clock size={20} className="text-primary" />
                      <span className="font-label-md">{session.time}</span>
                    </div>
                  </div>
                </div>

                {/* EXPANDED DETAILS */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-surface-container-lowest ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-5 border-t border-surface-variant space-y-4">
                    
                    <div className="flex items-start gap-2">
                      <MapPin size={20} className="text-on-surface-variant" />
                      <div>
                        <p className="font-label-sm text-on-surface-variant">Local do Atendimento</p>
                        <p className="font-body-md text-on-surface font-medium">{session.room}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Info size={20} className="text-on-surface-variant" />
                      <div>
                        <p className="font-label-sm text-on-surface-variant">Status da Sessão</p>
                        <p className={`font-body-md font-bold ${
                          session.status === 'confirmed' ? 'text-[#008537]' : 
                          session.status === 'cancelled' ? 'text-error' : 
                          'text-secondary'
                        }`}>
                          {session.status === 'confirmed' ? 'Confirmada (Te aguardamos lá!)' : 
                           session.status === 'cancelled' ? 'Cancelada' : 
                           session.status === 'in_progress' ? 'Em andamento na sala' :
                           'Aguardando sua Confirmação'}
                        </p>
                        {session.status === 'cancelled' && session.justification && (
                          <p className="text-xs text-error mt-1">Motivo: {session.justification}</p>
                        )}
                      </div>
                    </div>

                    {session.status === 'pending' && !isJustifying && (
                      <div className="flex gap-3 pt-4">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleConfirm(session.id); }}
                          className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl font-label-md font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <CheckCircle size={20} />
                          Confirmar Presença
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setJustifyingId(session.id); }}
                          className="flex-1 py-2.5 bg-error-container text-on-error-container rounded-xl font-label-md font-bold hover:bg-error hover:text-on-error transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle size={20} />
                          Cancelar
                        </button>
                      </div>
                    )}

                    {isJustifying && (
                      <div className="pt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <label className="font-label-sm text-on-surface font-bold">Motivo do cancelamento:</label>
                        <textarea 
                          className="w-full p-3 rounded-xl border border-error focus:ring-2 focus:ring-error outline-none text-on-surface text-sm bg-surface-container-lowest resize-none"
                          rows={3}
                          placeholder="Por favor, informe o motivo para avisarmos a clínica..."
                          value={justification}
                          onChange={(e) => setJustification(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setJustifyingId(null)}
                            className="flex-1 py-2 bg-surface-variant text-on-surface rounded-xl font-label-sm hover:bg-surface-variant/80 transition-colors"
                          >
                            Voltar
                          </button>
                          <button 
                            onClick={() => handleCancel(session.id)}
                            disabled={!justification.trim()}
                            className="flex-1 py-2 bg-error text-on-error rounded-xl font-label-sm font-bold hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Confirmar Cancelamento
                          </button>
                        </div>
                      </div>
                    )}
                    
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
