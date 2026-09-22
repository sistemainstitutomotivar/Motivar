import { useState } from 'react';
import { FileText, Calendar, Upload, Clock, Search, ChevronRight } from 'lucide-react';

interface PatientMock {
  id: string;
  name: string;
  photo: string;
  nextSession: string;
  condition: string;
}

const mockPatients: PatientMock[] = [
  {
    id: '1',
    name: 'Lucas Matheus Silva',
    photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2wTWY3mGuV9l8RmB487xwCEStUlPqivZGaejq_PCw8ylfjhtBGugcgvyH8u9oWbBki6g9FILqOMsWHjd8tLZapYdUSpucbAxLPNKTIqKUYU0-Opc9rq2RnGk4YX5NjEoli2HQgLGpq5_wgZK-gecaAlDKT--U_vneJXhqCdgeCL4omBd2RoAd3Cp2sXJ4CVVjgz9y1uCzDTx9VGmgqFUGrHyaDLYZJFYCB9E37-VnMgmTV0qEsLFn',
    nextSession: 'Hoje, 14:00',
    condition: 'TEA Nível 1'
  },
  {
    id: '2',
    name: 'Mariana Costa',
    photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATEcXMatvPpblW9g7KZcSMhMPh-nmtzp49A9nxwCd5N3wCXLAGs9Uhq2d7RbbL7o-sUm-G4yz2Lz7RA0uFFve9tsBhg88hoW4FDONEdeOxfbH_AvFZz6a5k8HNwgDTbpRyEZCIfMxBw7d7Uc84x0vocVnEKmy8SvNIXxb1ocXBY6St1PhCUaNBvau0Gcf4KS84Jl7HUdkpjDv-V1KOHBp-_4IgKomFDV-kpWUl-e4jYa7esuglE-Tw',
    nextSession: 'Amanhã, 09:00',
    condition: 'TDAH'
  }
];

export default function TherapistDashboard() {
  const [activeTab, setActiveTab] = useState<'agenda' | 'prontuarios'>('agenda');
  const [selectedPatient, setSelectedPatient] = useState<PatientMock | null>(null);

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* TABS */}
      <div className="flex bg-surface-variant/30 p-1 rounded-xl w-full md:w-fit mb-4">
        <button 
          onClick={() => { setActiveTab('agenda'); setSelectedPatient(null); }}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-label-md transition-all flex items-center gap-2 ${activeTab === 'agenda' ? 'bg-white text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <Calendar size={18} />
          Minha Agenda
        </button>
        <button 
          onClick={() => setActiveTab('prontuarios')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-label-md transition-all flex items-center gap-2 ${activeTab === 'prontuarios' ? 'bg-white text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <FileText size={18} />
          Meus Pacientes (Prontuários)
        </button>
      </div>

      {activeTab === 'agenda' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockPatients.map((patient, index) => (
            <div key={index} className="glass-card rounded-2xl p-5 border-l-4 border-l-primary flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <img src={patient.photo} alt={patient.name} className="w-12 h-12 rounded-full object-cover border-2 border-surface shadow-sm" />
                  <div>
                    <h4 className="font-headline-md text-[16px] font-bold text-on-surface">{patient.name}</h4>
                    <span className="font-label-sm text-on-surface-variant">{patient.condition}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-primary bg-primary-container/30 w-fit px-3 py-1.5 rounded-lg mt-2">
                <Clock size={16} />
                <span className="font-label-md font-bold">{patient.nextSession}</span>
              </div>
              <button 
                onClick={() => { setActiveTab('prontuarios'); setSelectedPatient(patient); }}
                className="mt-4 w-full py-2 bg-surface-variant text-on-surface rounded-xl font-label-sm hover:bg-surface-variant/80 transition-colors flex justify-center items-center gap-1"
              >
                Abrir Prontuário <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'prontuarios' && !selectedPatient && (
        <div className="bg-white rounded-3xl border border-surface-variant shadow-sm overflow-hidden p-6">
          <div className="relative w-full md:w-96 mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input 
              type="text" 
              placeholder="Buscar paciente..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-surface-variant rounded-xl focus:ring-2 focus:ring-primary outline-none font-body-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockPatients.map(patient => (
              <div 
                key={patient.id} 
                onClick={() => setSelectedPatient(patient)}
                className="flex items-center justify-between p-4 border border-surface-variant rounded-2xl hover:border-primary/50 hover:bg-surface-variant/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img src={patient.photo} alt={patient.name} className="w-14 h-14 rounded-full object-cover border-2 border-surface shadow-sm" />
                  <div>
                    <h4 className="font-headline-md text-[16px] font-bold text-on-surface">{patient.name}</h4>
                    <p className="font-body-sm text-on-surface-variant">{patient.condition}</p>
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

      {activeTab === 'prontuarios' && selectedPatient && (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Menu Lateral do Paciente */}
          <div className="w-full md:w-72 flex flex-col gap-4">
            <div className="bg-white p-6 rounded-3xl border border-surface-variant shadow-sm flex flex-col items-center text-center">
              <img src={selectedPatient.photo} alt={selectedPatient.name} className="w-24 h-24 rounded-full object-cover border-4 border-surface shadow-md mb-4" />
              <h3 className="font-headline-md text-lg font-bold text-on-surface">{selectedPatient.name}</h3>
              <p className="font-label-sm text-on-surface-variant bg-surface-variant px-3 py-1 rounded-full mt-2">{selectedPatient.condition}</p>
              
              <button 
                onClick={() => setSelectedPatient(null)}
                className="mt-6 text-sm text-secondary hover:underline font-bold"
              >
                Voltar para lista
              </button>
            </div>
          </div>

          {/* Área Principal do Prontuário */}
          <div className="flex-1 bg-white p-6 rounded-3xl border border-surface-variant shadow-sm flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-surface-variant">
              <h2 className="font-display-sm text-2xl font-bold text-on-surface">Prontuário Digital</h2>
              <button className="bg-primary text-on-primary px-4 py-2 rounded-xl font-label-md font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
                <Upload size={18} />
                Subir Laudo/Documento
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center text-on-surface-variant border-2 border-dashed border-surface-variant rounded-2xl p-8 bg-slate-50">
              <FileText size={48} className="mb-4 text-slate-300" />
              <h4 className="font-headline-md text-lg font-bold text-slate-700 mb-2">Nenhum documento recente</h4>
              <p className="font-body-md text-slate-500 max-w-sm">
                Faça o upload de laudos, evoluções, relatórios e outros documentos referentes ao paciente.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
