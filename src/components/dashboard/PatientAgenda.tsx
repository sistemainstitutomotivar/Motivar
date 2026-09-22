import { useState } from 'react';
import { X, Calendar, Clock, MapPin, Info, CheckCircle, XCircle } from 'lucide-react';

interface Session {
  id: string;
  date: string;
  time: string;
  therapistName: string;
  therapistRole: string;
  therapistPhoto: string;
  patientName: string;
  patientPhoto: string;
  status: 'scheduled' | 'confirmed' | 'cancelled';
  location: string;
}

const mockSessions: Session[] = [
  {
    id: '1',
    date: '25 de Setembro',
    time: '14:00 - 14:45',
    therapistName: 'Dra. Mariana Costa',
    therapistRole: 'Psicologia',
    therapistPhoto: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATEcXMatvPpblW9g7KZcSMhMPh-nmtzp49A9nxwCd5N3wCXLAGs9Uhq2d7RbbL7o-sUm-G4yz2Lz7RA0uFFve9tsBhg88hoW4FDONEdeOxfbH_AvFZz6a5k8HNwgDTbpRyEZCIfMxBw7d7Uc84x0vocVnEKmy8SvNIXxb1ocXBY6St1PhCUaNBvau0Gcf4KS84Jl7HUdkpjDv-V1KOHBp-_4IgKomFDV-kpWUl-e4jYa7esuglE-Tw',
    patientName: 'Lucas Matheus Silva',
    patientPhoto: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2wTWY3mGuV9l8RmB487xwCEStUlPqivZGaejq_PCw8ylfjhtBGugcgvyH8u9oWbBki6g9FILqOMsWHjd8tLZapYdUSpucbAxLPNKTIqKUYU0-Opc9rq2RnGk4YX5NjEoli2HQgLGpq5_wgZK-gecaAlDKT--U_vneJXhqCdgeCL4omBd2RoAd3Cp2sXJ4CVVjgz9y1uCzDTx9VGmgqFUGrHyaDLYZJFYCB9E37-VnMgmTV0qEsLFn',
    status: 'scheduled',
    location: 'Clínica Principal - Sala 04',
  },
  {
    id: '2',
    date: '28 de Setembro',
    time: '09:00 - 09:45',
    therapistName: 'Dr. Roberto Alves',
    therapistRole: 'Fonoaudiologia',
    therapistPhoto: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    patientName: 'Lucas Matheus Silva',
    patientPhoto: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2wTWY3mGuV9l8RmB487xwCEStUlPqivZGaejq_PCw8ylfjhtBGugcgvyH8u9oWbBki6g9FILqOMsWHjd8tLZapYdUSpucbAxLPNKTIqKUYU0-Opc9rq2RnGk4YX5NjEoli2HQgLGpq5_wgZK-gecaAlDKT--U_vneJXhqCdgeCL4omBd2RoAd3Cp2sXJ4CVVjgz9y1uCzDTx9VGmgqFUGrHyaDLYZJFYCB9E37-VnMgmTV0qEsLFn',
    status: 'confirmed',
    location: 'Clínica Principal - Sala 01',
  }
];

export default function PatientAgenda() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [justifyingId, setJustifyingId] = useState<string | null>(null);
  const [justification, setJustification] = useState('');
  
  const [sessions, setSessions] = useState<Session[]>(mockSessions);

  const handleConfirm = (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'confirmed' } : s));
  };

  const handleCancel = (id: string) => {
    if (justification.trim() === '') return;
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' } : s));
    setJustifyingId(null);
    setJustification('');
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-headline-md text-on-surface text-2xl font-bold">Minha Agenda</h3>
      </div>

      {/* Adicionado items-start para evitar que os cards não expandidos estiquem acompanhando a altura do card expandido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {sessions.map(session => {
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
                  
                  {/* IMAGENS E TÍTULO (Dinâmico: Sobreposto ou Separado) */}
                  <div className={`flex w-full ${isExpanded ? 'flex-col gap-4' : 'items-center gap-3'}`}>
                    
                    {/* CONTAINER DE FOTOS */}
                    <div className={isExpanded ? 'flex items-center gap-6 justify-center w-full bg-surface-container-lowest p-4 rounded-2xl border border-surface-variant' : 'relative shrink-0'}>
                      {/* Terapeuta */}
                      <div className={isExpanded ? 'flex flex-col items-center gap-2' : ''}>
                        <img 
                          src={session.therapistPhoto} 
                          alt="Terapeuta" 
                          className={`object-cover border-2 border-surface shadow-sm rounded-full transition-all duration-300 ${isExpanded ? 'w-20 h-20' : 'w-12 h-12 z-10 relative'}`} 
                        />
                        {isExpanded && <span className="font-label-sm text-primary font-bold">Terapeuta</span>}
                      </div>
                      
                      {/* Paciente */}
                      <div className={isExpanded ? 'flex flex-col items-center gap-2' : ''}>
                        <img 
                          src={session.patientPhoto} 
                          alt="Paciente" 
                          className={`object-cover border-2 border-surface shadow-sm rounded-full transition-all duration-300 ${isExpanded ? 'w-20 h-20' : 'w-10 h-10 absolute -bottom-2 -right-3 z-0'}`} 
                        />
                        {isExpanded && <span className="font-label-sm text-secondary font-bold">Você</span>}
                      </div>
                    </div>

                    {/* NOME E FUNÇÃO */}
                    <div className={`${isExpanded ? 'text-center w-full' : 'ml-2'}`}>
                      <h4 className={`font-headline-md font-bold text-on-surface leading-tight ${isExpanded ? 'text-xl' : 'text-[16px]'}`}>
                        {session.therapistName}
                      </h4>
                      <span className="font-label-sm text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded-md mt-1 inline-block">
                        {session.therapistRole}
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

                {/* HORÁRIO E DATA (Sempre visível) */}
                <div className={`flex items-center gap-4 mt-2 ${isExpanded ? 'justify-center bg-surface-variant/30 p-3 rounded-xl' : ''}`}>
                  <div className="flex items-center gap-1.5 text-on-surface">
                    <Calendar size={20} className="text-primary" />
                    <span className="font-label-md font-bold">{session.date}</span>
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
                      <p className="font-body-md text-on-surface font-medium">{session.location}</p>
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
                         'Aguardando sua Confirmação'}
                      </p>
                    </div>
                  </div>

                  {session.status === 'scheduled' && !isJustifying && (
                    <div className="flex gap-3 pt-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleConfirm(session.id); }}
                        className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl font-label-md font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <CheckCircle size={20} />
                        Confirmar
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
    </div>
  );
}
