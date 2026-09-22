import { useState } from 'react';
import type { UserRole } from '../../App';
import PatientAgenda from './PatientAgenda';
import GestaoCadastros from './GestaoCadastros';
import TherapistDashboard from './TherapistDashboard';

interface DashboardProps {
  onLogout: () => void;
  role: UserRole;
}

function Dashboard({ onLogout, role }: DashboardProps) {
  // Estado local para permitir a simulação de telas durante o desenvolvimento
  const [activeRole, setActiveRole] = useState<UserRole>(role || 'admin');
  const [activeView, setActiveView] = useState<string>('overview');

  // Ajusta a visão se trocar de role
  const handleRoleChange = (newRole: UserRole) => {
    setActiveRole(newRole);
    setActiveView('overview');
  };

  return (
    <div className="text-on-surface font-body-md min-h-screen flex flex-col pb-24 md:pb-0 md:flex-row">
      {/* Mobile Top App Bar */}
      <header className="md:hidden flex justify-between items-center px-grid-margin py-base w-full z-50 bg-surface-container-lowest shadow-sm fixed top-0 left-0">
        <div className="flex items-center gap-sm">
          <img 
            alt="Instituto Motivar Logo" 
            className="h-16 w-auto object-contain" 
            src="/images/logo-motivar.png"
          />
        </div>
        <button className="w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors flex items-center justify-center text-primary active:scale-95 duration-100">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      {/* Desktop Side Navigation Drawer */}
      <aside className="hidden md:flex flex-col h-screen sticky top-0 w-[280px] py-md gap-base bg-surface-bright shadow-xl z-40 rounded-r-xl">
        <div className="px-md pb-md pt-4 flex items-center justify-center border-b border-surface-variant">
          <img 
            alt="Instituto Motivar Logo" 
            className="w-full max-w-[200px] h-auto object-contain drop-shadow-sm" 
            src="/images/logo-motivar.png"
          />
        </div>
        <nav className="flex-1 overflow-y-auto mt-sm">
          <ul className="flex flex-col gap-1">
            {/* Todos veem o Início */}
            <li>
              <button onClick={() => setActiveView('overview')} className={`w-full flex items-center gap-md px-md py-sm rounded-full mx-sm transition-colors ${activeView === 'overview' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: activeView === 'overview' ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
                <span className="font-label-md">{activeRole === 'patient' ? 'Minha Agenda' : 'Dashboard'}</span>
              </button>
            </li>

            {/* Apenas Profissionais e Admins */}
            {(activeRole === 'professional' || activeRole === 'admin') && (
              <li>
                <button onClick={() => setActiveView('pacientes')} className={`w-full flex items-center gap-md px-md py-sm rounded-full mx-sm transition-colors ${activeView === 'pacientes' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: activeView === 'pacientes' ? "'FILL' 1" : "'FILL' 0" }}>assignment_ind</span>
                  <span className="font-label-md">Meus Pacientes</span>
                </button>
              </li>
            )}

            {/* Apenas Pacientes */}
            {activeRole === 'patient' && (
              <li>
                <button onClick={() => setActiveView('historico')} className={`w-full flex items-center gap-md px-md py-sm rounded-full mx-sm transition-colors ${activeView === 'historico' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: activeView === 'historico' ? "'FILL' 1" : "'FILL' 0" }}>history</span>
                  <span className="font-label-md">Histórico e Evolução</span>
                </button>
              </li>
            )}

            {/* Apenas Admins */}
            {activeRole === 'admin' && (
              <>
                <li>
                  <button onClick={() => setActiveView('financeiro')} className={`w-full flex items-center gap-md px-md py-sm rounded-full mx-sm transition-colors ${activeView === 'financeiro' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: activeView === 'financeiro' ? "'FILL' 1" : "'FILL' 0" }}>payments</span>
                    <span className="font-label-md">Financeiro</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveView('cadastros')} className={`w-full flex items-center gap-md px-md py-sm rounded-full mx-sm transition-colors ${activeView === 'cadastros' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: activeView === 'cadastros' ? "'FILL' 1" : "'FILL' 0" }}>groups</span>
                    <span className="font-label-md">Gestão de Cadastros</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveView('configuracoes')} className={`w-full flex items-center gap-md px-md py-sm rounded-full mx-sm transition-colors ${activeView === 'configuracoes' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: activeView === 'configuracoes' ? "'FILL' 1" : "'FILL' 0" }}>settings</span>
                    <span className="font-label-md">Configurações</span>
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
        <div className="px-sm mt-auto">
          <button onClick={onLogout} className="flex w-full items-center gap-md px-md py-sm text-error mx-sm hover:bg-error-container rounded-full transition-colors cursor-pointer">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 px-grid-margin py-md mt-16 md:mt-0 max-w-7xl mx-auto w-full">
        {/* DEV MODE: ROLE SWITCHER */}
        <div className="mb-6 p-3 bg-amber-100 border border-amber-300 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <span className="material-symbols-outlined text-[20px]">construction</span>
            <span className="font-label-sm font-bold uppercase tracking-wider">Modo Desenvolvedor: Alternar Visão</span>
          </div>
          <div className="flex bg-white rounded-lg p-1 shadow-sm border border-amber-200">
            <button 
              onClick={() => handleRoleChange('patient')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${activeRole === 'patient' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Paciente
            </button>
            <button 
              onClick={() => handleRoleChange('professional')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${activeRole === 'professional' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Terapeuta
            </button>
            <button 
              onClick={() => handleRoleChange('admin')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${activeRole === 'admin' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Gestão
            </button>
          </div>
        </div>

        <div className="mb-lg flex justify-between items-end">
          <div>
            <p className="font-label-md text-on-surface-variant mb-1">Bem-vindo(a)</p>
            <h2 className="font-display-lg text-primary text-5xl">
              {activeRole === 'patient' ? 'Sua Agenda' : activeRole === 'professional' ? 'Bom dia, Dra. Mariana' : 'Visão Geral (Admin)'}
            </h2>
          </div>
          <div className="hidden md:flex gap-sm">
            <button className="w-12 h-12 rounded-full bg-surface-container-highest hover:bg-surface-variant transition-colors flex items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined">search</span>
            </button>
            <button className="w-12 h-12 rounded-full bg-surface-container-highest hover:bg-surface-variant transition-colors flex items-center justify-center text-primary shadow-sm relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface-container-highest"></span>
            </button>
          </div>
        </div>

        {/* High-Impact Image Carousel */}
        <div className="w-full relative h-64 md:h-[400px] rounded-3xl overflow-hidden mb-lg shadow-xl">
          <div className="flex w-full h-full snap-x snap-mandatory overflow-x-auto hide-scrollbar">
            <div className="w-full h-full flex-shrink-0 snap-center relative">
              <img alt="Premium facility" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvUWT4c4hP7_TYc120ZtRY8TGjvZG7NW4xg_FGW_Z5gfJI7ptKp-6PBp1Q2Y1Lmwize_D508Lxkv6VO70MD4BzaY6YA_DJKa8JB4m7Suceuads6Lgy9pPUJCJrChkS_k6q1PmW9resg18Cj9qwLOMUgA_yn9Ggeyv1g4uyy6hYhf60lpcsndgYee-fw3y8V0fD3MYpqedbGbCFAbO2ox0jkKU-geAnF_JC6ybPq9ax8JvuPyIZThId" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
            <div className="w-full h-full flex-shrink-0 snap-center relative">
              <img alt="Therapy session" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaEK6cA3gGg0P15cubt5ZenUsK_tmNVGIpqEQRvHtGEhOcIznmz1vUyonIJP4vvdv0shAuwWnx0k1oITl9VBTX3jvPMYVzO3pksgOCY20K9IMAPuv1VxohLM0ti46o2UyEXiNZiLR-a9_abVMspKu1uiE4uBzGodMn68zIuBNxDisQ5zvxrHYqoETz7D8fB8Ml92EZCp9Mbl01amKmrcwMLMoSIZbikZ-AypwOGdHLZXuM8Uu2cQTZ" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
            <div className="w-full h-full flex-shrink-0 snap-center relative">
              <img alt="Clinical excellence" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbzeebi_UGqVnVdZGD3oLAog3y-yzW_mIx8QvFiKoS02NjqBzAcR0DlYk6k0hzNwMF2OxNfvsjDX52y4q-5y6X1I1a0dchRdDfI-P1PV9J6wqOoSRuiweC-4-sJlbugt7SVMZBTkZR6Ev8-3AhZ5XMl4KSFwO9AUqVc2AWMswL3W9p-7CQsz7IGNUPJicltwPq2Nz67ctbzOTEXwXPP6Rw6mTcNDkAajG6jmwjm7bIWiSpyTwlYdP2" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <div className="w-2 h-2 rounded-full bg-white/50"></div>
            <div className="w-2 h-2 rounded-full bg-white/50"></div>
          </div>
        </div>

        {/* Horizontal Scroll Summary Cards - ONLY FOR ADMIN */}
        {activeRole === 'admin' && (
          <div className="flex overflow-x-auto hide-scrollbar gap-grid-gutter pb-4 mb-8 -mx-grid-margin px-grid-margin md:mx-0 md:px-0">
            <div className="glass-card rounded-2xl p-md flex-shrink-0 w-[280px] border-l-4 border-l-secondary flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-secondary-fixed p-2 rounded-xl">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                </div>
                <span className="font-label-sm text-secondary bg-secondary-fixed-dim px-3 py-1 rounded-full">Hoje</span>
              </div>
              <div>
                <h3 className="font-headline-md text-on-surface text-[40px] leading-tight font-bold">42</h3>
                <p className="font-body-md text-on-surface-variant font-medium mt-1">Sessões Agendadas</p>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-md flex-shrink-0 w-[280px] border-l-4 border-l-tertiary flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-tertiary-fixed p-2 rounded-xl">
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>child_care</span>
                </div>
                <span className="font-label-sm text-tertiary bg-tertiary-fixed-dim px-3 py-1 rounded-full">+3 novos</span>
              </div>
              <div>
                <h3 className="font-headline-md text-on-surface text-[40px] leading-tight font-bold">38</h3>
                <p className="font-body-md text-on-surface-variant font-medium mt-1">Pacientes Previstos</p>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-md flex-shrink-0 w-[280px] border-l-4 border-l-primary flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-primary-fixed p-2 rounded-xl">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                </div>
                <span className="font-label-sm text-primary bg-primary-fixed-dim px-3 py-1 rounded-full">Automático</span>
              </div>
              <div>
                <h3 className="font-headline-md text-on-surface text-[40px] leading-tight font-bold">156</h3>
                <p className="font-body-md text-on-surface-variant font-medium mt-1">Mensagens Enviadas</p>
              </div>
            </div>
          </div>
        )}

        {/* Conditional Content based on activeView & activeRole */}
        {activeView === 'cadastros' ? (
          <div className="mt-8">
            <GestaoCadastros />
          </div>
        ) : activeRole === 'patient' ? (
          <div className="mt-8">
            <PatientAgenda />
          </div>
        ) : activeRole === 'professional' ? (
          <div className="mt-8">
            <TherapistDashboard />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-grid-gutter">
            
            {/* Main Feed Column */}
            <div className="md:col-span-8 flex flex-col gap-grid-gutter">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-headline-md text-on-surface text-[20px] font-bold">Próximos Atendimentos</h3>
                <button className="font-label-md text-secondary hover:underline">Ver Agenda Completa</button>
              </div>
              
              {/* Patient Card: In Progress */}
              <div className="glass-card bg-[#FFFDF0]/80 rounded-2xl p-md flex items-center justify-between relative overflow-hidden border border-[#F4E99B]">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#E5C100]"></div>
                <div className="flex items-center gap-md">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#E5C100] shadow-sm">
                      <img alt="Paciente" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2wTWY3mGuV9l8RmB487xwCEStUlPqivZGaejq_PCw8ylfjhtBGugcgvyH8u9oWbBki6g9FILqOMsWHjd8tLZapYdUSpucbAxLPNKTIqKUYU0-Opc9rq2RnGk4YX5NjEoli2HQgLGpq5_wgZK-gecaAlDKT--U_vneJXhqCdgeCL4omBd2RoAd3Cp2sXJ4CVVjgz9y1uCzDTx9VGmgqFUGrHyaDLYZJFYCB9E37-VnMgmTV0qEsLFn" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#E5C100] border-2 border-white rounded-full animate-pulse"></span>
                  </div>
                  <div>
                    <h4 className="font-headline-md text-on-surface text-[18px] font-bold">Lucas Matheus Silva</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-label-sm text-[#00497d] bg-[#cce5ff] px-2.5 py-1 rounded-md">Terapia Ocupacional</span>
                      <span className="font-label-sm text-on-surface-variant font-medium">Sala 02</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-label-md text-[#856F00]">Em andamento</p>
                  <p className="font-body-md text-on-surface-variant mt-0.5">10:00 - 10:45</p>
                </div>
              </div>

              {/* Patient Card: Upcoming */}
              <div className="glass-card rounded-2xl p-md flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary"></div>
                <div className="flex items-center gap-md">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-secondary shadow-sm">
                    <img alt="Paciente" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuATEcXMatvPpblW9g7KZcSMhMPh-nmtzp49A9nxwCd5N3wCXLAGs9Uhq2d7RbbL7o-sUm-G4yz2Lz7RA0uFFve9tsBhg88hoW4FDONEdeOxfbH_AvFZz6a5k8HNwgDTbpRyEZCIfMxBw7d7Uc84x0vocVnEKmy8SvNIXxb1ocXBY6St1PhCUaNBvau0Gcf4KS84Jl7HUdkpjDv-V1KOHBp-_4IgKomFDV-kpWUl-e4jYa7esuglE-Tw" />
                  </div>
                  <div>
                    <h4 className="font-headline-md text-on-surface text-[18px] font-bold">Mariana Costa</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-label-sm text-tertiary bg-tertiary-fixed px-2.5 py-1 rounded-md">Psicologia</span>
                      <span className="font-label-sm text-on-surface-variant font-medium">Sala 04</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-label-md text-secondary">Aguardando</p>
                  <p className="font-body-md text-on-surface-variant mt-0.5">10:45 - 11:30</p>
                </div>
              </div>

              {/* Patient Card: Upcoming */}
              <div className="glass-card rounded-2xl p-md flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
                <div className="flex items-center gap-md">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary shadow-sm">
                    <img alt="Paciente" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPLKn6B9mMifFQXKOli8-3quD2SbVDMHZeDb3tClSYdurv82VuH0NYqdNQveJrVTtMned3suHn7XmLT0zNbowm5JS5lEoX8iUOj2Nuq8FFfc_G-uwsWhcJwFkg2BlNYQ-y3vmatJuQ7kEya89VIbsoFQnZWlxfKe9Ml22m366QatW5IIN1aH2M17tws38cLYi4xyb3oQy7-FGCfumoAdwoYSYZ2GvmLK8fvO-V1usqIPdJXKDOy6gD" />
                  </div>
                  <div>
                    <h4 className="font-headline-md text-on-surface text-[18px] font-bold">Pedro Henrique</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-label-sm text-primary bg-primary-fixed px-2.5 py-1 rounded-md">Fonoaudiologia</span>
                      <span className="font-label-sm text-on-surface-variant font-medium">Sala 01</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-label-md text-on-surface-variant">Próximo</p>
                  <p className="font-body-md text-on-surface-variant mt-0.5">11:30 - 12:15</p>
                </div>
              </div>
            </div>

            {/* Right Column - Alerts & Quick Actions */}
            <div className="md:col-span-4 flex flex-col gap-grid-gutter pt-0 md:pt-[40px]">
              {/* Action Required */}
              <div className="glass-card bg-error-container/80 rounded-2xl p-md">
                <div className="flex items-center gap-sm mb-4">
                  <span className="material-symbols-outlined text-error">error</span>
                  <h3 className="font-headline-md text-error text-[18px] font-bold">Pendências de Cadastro</h3>
                </div>
                <p className="font-body-md text-on-error-container mb-6">2 pacientes agendados para hoje estão com a documentação incompleta.</p>
                <button className="w-full py-3 bg-error text-on-error rounded-xl font-label-md font-bold hover:bg-[#93000a] transition-colors shadow-sm">
                  Revisar Documentos
                </button>
              </div>
              
              {/* System Alerts */}
              <div className="glass-card rounded-2xl p-md flex-1">
                <h3 className="font-headline-md text-on-surface text-[18px] font-bold mb-5">Avisos do Sistema</h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="bg-surface-container-highest p-2 rounded-xl mt-0.5">
                      <span className="material-symbols-outlined text-on-surface-variant text-[20px]">check_circle</span>
                    </div>
                    <div>
                      <p className="font-label-md text-on-surface mb-0.5">Lembretes enviados</p>
                      <p className="font-body-md text-[14px] leading-snug text-on-surface-variant">Todos os lembretes de amanhã foram disparados via WhatsApp.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-surface-container-highest p-2 rounded-xl mt-0.5">
                      <span className="material-symbols-outlined text-on-surface-variant text-[20px]">info</span>
                    </div>
                    <div>
                      <p className="font-label-md text-on-surface mb-0.5">Atualização de Software</p>
                      <p className="font-body-md text-[14px] leading-snug text-on-surface-variant">Nova versão do módulo de avaliações disponível às 18h.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center pt-xs pb-sm px-base bg-surface-container shadow-lg rounded-t-xl">
        <a className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 tap-highlight-transparent hover:bg-surface-container-high transition-all active:scale-90" href="#">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="font-label-sm mt-0.5">Início</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 tap-highlight-transparent hover:bg-surface-container-high transition-all active:scale-90" href="#">
          <span className="material-symbols-outlined">child_care</span>
          <span className="font-label-sm mt-0.5">Pacientes</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 tap-highlight-transparent hover:bg-surface-container-high transition-all active:scale-90" href="#">
          <span className="material-symbols-outlined">calendar_month</span>
          <span className="font-label-sm mt-0.5">Agenda</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 tap-highlight-transparent hover:bg-surface-container-high transition-all active:scale-90 relative" href="#">
          <span className="material-symbols-outlined">chat</span>
          <span className="absolute top-1 right-3 w-2 h-2 bg-error rounded-full"></span>
          <span className="font-label-sm mt-0.5">Mensagens</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 tap-highlight-transparent hover:bg-surface-container-high transition-all active:scale-90" href="#">
          <span className="material-symbols-outlined">person</span>
          <span className="font-label-sm mt-0.5">Perfil</span>
        </a>
      </nav>
    </div>
  );
}

export default Dashboard;
