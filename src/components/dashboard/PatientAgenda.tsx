import { supabase } from '../../lib/supabase';
import { formatDateBR } from '../../lib/utils';
import { showAlert, showConfirm } from '../../lib/customAlert';
import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Info, CheckCircle, XCircle, Search } from 'lucide-react';

export default function PatientAgenda() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [justification, setJustification] = useState('');
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPatientName, setCurrentPatientName] = useState('Paciente');
  const [currentPatientAvatar, setCurrentPatientAvatar] = useState<string | null>(null);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterProf, setFilterProf] = useState('');

  useEffect(() => {
    loadPatientAppointments();
  }, []);

  const loadPatientAppointments = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      const { data: patientData } = await supabase
        .from('clinic_patients')
        .select('id, name, avatar_url')
        .eq('email', user.email)
        .single();

      if (patientData) {
        setCurrentPatientName(patientData.name);
        setCurrentPatientAvatar(patientData.avatar_url);
        
        // Puxa consultas a partir de hoje
        const today = new Date().toISOString().split('T')[0];
        const { data: appts } = await supabase
          .from('clinic_appointments')
          .select('*')
          .eq('patient_id', patientData.id)
          .gte('date', today)
          .order('date', { ascending: true })
          .order('time', { ascending: true });
          
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

  const handleConfirm = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase.from('clinic_appointments').update({ status: 'confirmed' }).eq('id', id);
      if (!error) {
        setAppointments(prev => prev.map(s => s.id === id ? { ...s, status: 'confirmed' } : s));
        showAlert('Aviso', 'Presença confirmada com sucesso! A clínica já foi notificada.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openCancelModal = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAppointmentToCancel(id);
    setJustification('');
    setCancelModalOpen(true);
  };

  const confirmCancellation = async () => {
    if (justification.trim() === '' || !appointmentToCancel) return;
    const target = appointments.find(a => a.id === appointmentToCancel);
    if (!target) return;

    // Lógica 24h
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
          isPast ? 'Sessão já ocorreu' : Math.floor(diffHours) + 'h restantes'
        }).\n\nSegundo as regras, essa sessão será considerada executada. Deseja confirmar?`
      );
      if (!confirmCancel) return;
    } else {
      statusNote = "[CANCELADO PELO PACIENTE > 24H: Reagendamento Permitido]";
      showAlert('Aviso', `Cancelamento dentro do prazo (mais de 24h).\nVocê tem direito a reagendar sem custo.`);
    }

    const finalReason = `${statusNote} ${justification.trim()}`;

    try {
      const { error } = await supabase.from('clinic_appointments').update({ status: 'cancelled', justification: finalReason }).eq('id', appointmentToCancel);
      if (!error) {
        setAppointments(prev => prev.map(s => s.id === appointmentToCancel ? { ...s, status: 'cancelled', justification: finalReason } : s));
      }
    } catch (err) {
      console.error(err);
    }

    setCancelModalOpen(false);
    setAppointmentToCancel(null);
    setExpandedId(null);
  };

  // Filtragem
  const filteredAppointments = appointments.filter(apt => {
    const matchDate = filterDate ? apt.date === filterDate : true;
    const matchProf = filterProf ? apt.therapist_name.toLowerCase().includes(filterProf.toLowerCase()) : true;
    return matchDate && matchProf;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const firstDate = filteredAppointments.length > 0 ? filteredAppointments[0].date : null;
  
  const featuredApts = filteredAppointments.filter(a => a.date === firstDate);
  const futureApts = filteredAppointments.filter(a => a.date !== firstDate);

  let featuredTitle = "Próximas Sessões";
  if (firstDate) {
    if (firstDate === todayStr) {
      featuredTitle = "Sessões de Hoje";
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (firstDate === tomorrow.toISOString().split('T')[0]) {
        featuredTitle = "Sessões de Amanhã";
      } else {
        featuredTitle = `Sessões do dia ${formatDateBR(firstDate)}`;
      }
    }
  }

  return (
    <div className="space-y-8 w-full">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100 flex flex-col sm:flex-row gap-4 items-end justify-between">
        <div className="w-full sm:w-auto">
          <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
            <Calendar className="text-primary w-6 h-6" />
            Minha Agenda
          </h3>
          <p className="text-sm text-slate-500">Sincronizada em tempo real com a clínica.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative">
            <label className="text-xs font-bold text-slate-500 mb-1 block">Buscar por Data</label>
            <input 
              type="date" 
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="pl-4 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-primary focus:border-primary outline-none w-full text-slate-600"
            />
          </div>
          <div className="relative">
            <label className="text-xs font-bold text-slate-500 mb-1 block">Profissional</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Nome do profissional"
                value={filterProf}
                onChange={e => setFilterProf(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-primary focus:border-primary outline-none w-full text-slate-600"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* SESSÕES EM DESTAQUE - CARDS EXPANSÍVEIS */}
          {featuredApts.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-slate-700 flex items-center gap-2 px-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(233,40,108,0.6)]"></span>
                {featuredTitle}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                {featuredApts.map(session => {
                  const isExpanded = expandedId === session.id;

                  return (
                    <div 
                      key={session.id} 
                      className={`bg-white rounded-3xl overflow-hidden transition-all duration-300 ease-in-out border ${
                        isExpanded ? 'border-primary shadow-xl scale-[1.02] z-10' : 'border-rose-100 hover:border-primary/50 cursor-pointer shadow-sm'
                      } flex flex-col relative`}
                      onClick={() => !isExpanded && setExpandedId(session.id)}
                    >
                      <div className="p-5 relative">
                        <div className="flex items-center gap-4">
                          {/* OVERLAPPING AVATARS */}
                          <div className={`relative flex items-center justify-center transition-all duration-300 ${isExpanded ? 'w-full gap-8 mb-4' : 'w-24'}`}>
                            <div className={`flex flex-col items-center ${isExpanded ? 'z-10' : 'z-10 absolute left-0'}`}>
                              {session.therapist_avatar ? (
                                <img src={session.therapist_avatar} alt="Terapeuta" className={`object-cover border-2 border-white shadow-sm rounded-full transition-all duration-300 ${isExpanded ? 'w-20 h-20' : 'w-12 h-12'}`} />
                              ) : (
                                <div className={`rounded-full bg-rose-100 text-primary flex items-center justify-center font-bold shadow-sm ${isExpanded ? 'w-20 h-20 text-2xl' : 'w-12 h-12 text-lg'}`}>
                                  {session.therapist_name.charAt(0)}
                                </div>
                              )}
                              {isExpanded && <span className="font-label-sm text-primary font-bold mt-2 text-xs">{session.therapist_name.split(' ')[0]}</span>}
                            </div>
                            
                            <div className={`flex flex-col items-center ${isExpanded ? 'z-10' : 'z-0 absolute left-8'}`}>
                              {currentPatientAvatar ? (
                                <img src={currentPatientAvatar} alt="Paciente" className={`object-cover border-2 border-white shadow-sm rounded-full transition-all duration-300 ${isExpanded ? 'w-20 h-20' : 'w-12 h-12'}`} />
                              ) : (
                                <div className={`rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold border-2 border-white shadow-sm transition-all duration-300 ${isExpanded ? 'w-20 h-20 text-2xl' : 'w-12 h-12 text-sm'}`}>
                                  {currentPatientName.charAt(0)}
                                </div>
                              )}
                              {isExpanded && <span className="font-label-sm text-blue-600 font-bold mt-2 text-xs">{currentPatientName.split(' ')[0]}</span>}
                            </div>
                          </div>

                          <div className={`${isExpanded ? 'hidden' : 'ml-2 flex-1'}`}>
                            <h4 className="font-bold text-slate-800 text-[16px] leading-tight">{session.therapist_name}</h4>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-1 inline-block font-medium">
                              {session.room}
                            </span>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-rose-50 hover:text-primary transition-colors z-20"
                          >
                            <X size={18} />
                          </button>
                        )}
                        
                        {isExpanded && (
                          <div className="text-center mt-2 mb-4">
                            <h4 className="font-bold text-slate-800 text-xl">{session.therapist_name}</h4>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md mt-1 inline-block font-medium">
                              {session.room}
                            </span>
                          </div>
                        )}

                        <div className={`flex items-center gap-4 mt-2 ${isExpanded ? 'justify-center bg-rose-50 p-3 rounded-2xl' : ''}`}>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Calendar size={18} className="text-primary" />
                            <span className="text-sm font-bold">{formatDateBR(session.date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Clock size={18} className="text-primary" />
                            <span className="text-sm font-bold">{session.time}</span>
                          </div>
                        </div>
                      </div>

                      <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-slate-50 ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-5 border-t border-slate-100 space-y-4">
                          <div className="flex items-start gap-2">
                            <MapPin size={18} className="text-slate-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Local do Atendimento</p>
                              <p className="text-sm font-bold text-slate-700 mt-0.5">{session.room}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Info size={18} className="text-slate-400 mt-0.5" />
                            <div className="w-full">
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Status da Sessão</p>
                              <p className={`text-sm font-bold mt-0.5 ${session.status === 'confirmed' ? 'text-emerald-600' : session.status === 'cancelled' ? 'text-red-600' : 'text-blue-600'}`}>
                                {session.status === 'confirmed' ? 'Presença Confirmada' : session.status === 'cancelled' ? 'Sessão Cancelada' : 'Aguardando sua Confirmação'}
                              </p>
                              {session.status === 'cancelled' && session.justification && (
                                <div className="mt-2 p-2.5 bg-red-50/50 border border-red-100 rounded-lg">
                                  <p className="text-xs text-red-700"><span className="font-bold">Motivo:</span> {session.justification}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            {(!session.status || session.status === 'pending') && (
                              <button onClick={(e) => handleConfirm(session.id, e)} className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-primary/30">
                                <CheckCircle size={18} /> Confirmar Presença
                              </button>
                            )}
                            {session.status !== 'cancelled' && (
                              <button onClick={(e) => openCancelModal(session.id, e)} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                                <XCircle size={18} /> Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SESSÕES FUTURAS - LISTA COMPACTA */}
          {futureApts.length > 0 && (
            <div className="space-y-4 mt-8">
              <h4 className="font-bold text-lg text-slate-700 flex items-center gap-2 px-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                Agendamentos Futuros
              </h4>
              <div className="bg-white rounded-3xl shadow-sm border border-rose-100 divide-y divide-rose-50 overflow-hidden">
                {futureApts.map(apt => (
                  <div key={apt.id} className="p-4 sm:p-6 hover:bg-rose-50/30 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {apt.therapist_avatar ? (
                        <img src={apt.therapist_avatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-rose-100 shadow-sm shrink-0" />
                      ) : (
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-primary font-bold border-2 border-white shadow-sm shrink-0">
                          {formatDateBR(apt.date).substring(0, 2)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-800">{apt.therapist_name}</p>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">{apt.room} • {apt.modality || 'Sessão'}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-end gap-3 w-full lg:w-auto">
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">
                          {formatDateBR(apt.date)} às {apt.time}
                        </span>
                      </div>
                      
                      {(!apt.status || apt.status === 'pending') && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => openCancelModal(apt.id)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Cancelar
                          </button>
                          <button onClick={() => handleConfirm(apt.id)} className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors shadow-sm flex items-center gap-1 shadow-emerald-500/20">
                            <CheckCircle size={14} /> Confirmar
                          </button>
                        </div>
                      )}
                      
                      {apt.status === 'confirmed' && (
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1">
                            <CheckCircle size={14} /> Confirmada
                          </div>
                          <button onClick={() => openCancelModal(apt.id)} className="px-2 py-1.5 text-xs font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancelar sessão confirmada">
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}

                      {apt.status === 'cancelled' && (
                        <div className="flex flex-col items-end gap-1">
                          <div className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-1">
                            <XCircle size={14} /> Cancelada
                          </div>
                        </div>
                      )}

                      {apt.status === 'cancelled' && apt.justification && (
                        <div className="w-full sm:w-auto px-3 py-1.5 text-xs text-red-600 bg-red-50/50 border border-red-100 rounded-lg ml-auto">
                          <span className="font-bold">Motivo:</span> {apt.justification}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {featuredApts.length === 0 && futureApts.length === 0 && (
            <div className="p-12 bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center mt-4 shadow-sm">
              <Calendar className="w-12 h-12 text-slate-300 mb-4" />
              <h4 className="text-lg font-bold text-slate-700 mb-1">Nenhuma consulta encontrada</h4>
              <p className="text-slate-500 text-sm max-w-sm">
                Tente limpar os filtros ou verifique com a recepção caso ache que falta algum agendamento.
              </p>
            </div>
          )}
        </>
      )}

      {/* MODAL DE JUSTIFICATIVA (GLOBAL PARA CARDS E LISTA) */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-[90vw] max-w-[400px] sm:w-[400px] min-w-[300px] shrink-0 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setCancelModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <X size={18} />
            </button>
            
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <XCircle size={24} />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">Cancelar Sessão</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Por favor, informe o motivo do cancelamento para a clínica. Lembre-se que cancelamentos com menos de 24h são faturados normalmente.
            </p>
            
            <textarea
              value={justification}
              onChange={e => setJustification(e.target.value)}
              placeholder="Digite sua justificativa (obrigatória)..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none h-32 mb-6 text-sm text-slate-700 placeholder:text-slate-400 transition-all"
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                Voltar
              </button>
              <button 
                onClick={confirmCancellation}
                disabled={!justification.trim()}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-red-500/30"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
