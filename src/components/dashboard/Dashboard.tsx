import { useState } from 'react';
import { 
  Bell, 
  LayoutDashboard, 
  UserCircle, 
  History, 
  CreditCard, 
  Users, 
  Settings, 
  LogOut, 
  Search,
  Wrench,
  Calendar,
  Baby,
  MessageSquare,
  CheckCircle,
  Info,
  User,
  ShieldAlert
} from 'lucide-react';
import type { UserRole } from '../../App';
import PatientAgenda from './PatientAgenda';
import GestaoCadastros from './GestaoCadastros';
import TherapistDashboard from './TherapistDashboard';
import GestaoAgenda from './GestaoAgenda';
import GestaoFinanceiro from './GestaoFinanceiro';
import ConfiguracoesClinica from './ConfiguracoesClinica';

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

  const isManagement = activeRole === 'admin' || activeRole === 'secretary';

  return (
    <div className="text-on-surface font-body-md min-h-screen flex flex-col pb-24 md:pb-0 md:flex-row bg-[#FAF8F5]">
      {/* Mobile Top App Bar */}
      <header className="md:hidden flex justify-between items-center px-grid-margin py-base w-full z-50 bg-surface-container-lowest shadow-sm fixed top-0 left-0">
        <div className="flex items-center gap-sm">
          <img 
            alt="Instituto Motivar Logo" 
            className="h-14 w-auto object-contain" 
            src="/images/logo-motivar.png"
          />
        </div>
        <button className="w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors flex items-center justify-center text-primary active:scale-95 duration-100">
          <Bell size={24} />
        </button>
      </header>

      {/* Desktop Side Navigation Drawer */}
      <aside className="hidden md:flex flex-col h-screen sticky top-0 w-[280px] py-md gap-base bg-surface-bright shadow-xl z-40 rounded-r-2xl">
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
              <button 
                onClick={() => setActiveView('overview')} 
                className={`w-full flex items-center gap-md px-md py-sm rounded-full mx-sm transition-colors ${activeView === 'overview' ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-variant'}`}
              >
                <LayoutDashboard size={20} className={activeView === 'overview' ? 'text-primary' : ''} />
                <span className="font-label-md">{activeRole === 'patient' ? 'Minha Agenda' : 'Dashboard'}</span>
              </button>
            </li>

            {/* Apenas Profissionais */}
            {activeRole === 'professional' && (
              <li>
                <button 
                  onClick={() => setActiveView('pacientes')} 
                  className={`w-full flex items-center gap-md px-md py-sm rounded-full mx-sm transition-colors ${activeView === 'pacientes' ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-variant'}`}
                >
                  <UserCircle size={20} className={activeView === 'pacientes' ? 'text-primary' : ''} />
                  <span className="font-label-md">Meus Pacientes</span>
                </button>
              </li>
            )}

            {/* Apenas Pacientes */}
            {activeRole === 'patient' && (
              <li>
                <button 
                  onClick={() => setActiveView('historico')} 
                  className={`w-full flex items-center gap-md px-md py-sm rounded-full mx-sm transition-colors ${activeView === 'historico' ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-variant'}`}
                >
                  <History size={20} className={activeView === 'historico' ? 'text-primary' : ''} />
                  <span className="font-label-md">Histórico e Evolução</span>
                </button>
              </li>
            )}

            {/* Admin e Secretária (Recepção) */}
            {isManagement && (
              <>
                <li>
                  <button 
                    onClick={() => setActiveView('agenda')} 
                    className={`w-full flex items-center gap-md px-md py-sm rounded-full mx-sm transition-colors ${activeView === 'agenda' ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-variant'}`}
                  >
                    <Calendar size={20} className={activeView === 'agenda' ? 'text-primary' : ''} />
                    <span className="font-label-md">Agenda Geral</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveView('financeiro')} 
                    className={`w-full flex items-center gap-md px-md py-sm rounded-full mx-sm transition-colors ${activeView === 'financeiro' ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-variant'}`}
                  >
                    <CreditCard size={20} className={activeView === 'financeiro' ? 'text-primary' : ''} />
                    <span className="font-label-md">Financeiro</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveView('cadastros')} 
                    className={`w-full flex items-center gap-md px-md py-sm rounded-full mx-sm transition-colors ${activeView === 'cadastros' ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-variant'}`}
                  >
                    <Users size={20} className={activeView === 'cadastros' ? 'text-primary' : ''} />
                    <span className="font-label-md">Gestão de Cadastros</span>
                  </button>
                </li>
              </>
            )}

            {/* Exclusivo do Admin: Configurações & Auditoria */}
            {activeRole === 'admin' && (
              <li>
                <button 
                  onClick={() => setActiveView('configuracoes')} 
                  className={`w-full flex items-center gap-md px-md py-sm rounded-full mx-sm transition-colors ${activeView === 'configuracoes' ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-variant'}`}
                >
                  <Settings size={20} className={activeView === 'configuracoes' ? 'text-primary' : ''} />
                  <span className="font-label-md">Configurações & Auditoria</span>
                </button>
              </li>
            )}
          </ul>
        </nav>
        <div className="px-sm mt-auto">
          <button onClick={onLogout} className="flex w-full items-center gap-md px-md py-sm text-error mx-sm hover:bg-error-container rounded-full transition-colors cursor-pointer">
            <LogOut size={20} />
            <span className="font-label-md">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 px-grid-margin py-md mt-16 md:mt-0 max-w-7xl mx-auto w-full">
        {/* DEV MODE: ROLE SWITCHER (PACIENTE, TERAPEUTA, SECRETÁRIA, ADMIN) */}
        <div className="mb-6 p-3 bg-amber-100 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-amber-900">
            <Wrench size={20} />
            <span className="font-label-sm font-bold uppercase tracking-wider text-xs">Simulador de Perfis de Acesso</span>
          </div>
          <div className="flex flex-wrap bg-white rounded-xl p-1 shadow-sm border border-amber-200 gap-1">
            <button 
              onClick={() => handleRoleChange('patient')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeRole === 'patient' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Paciente
            </button>
            <button 
              onClick={() => handleRoleChange('professional')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeRole === 'professional' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Terapeuta
            </button>
            <button 
              onClick={() => handleRoleChange('secretary')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeRole === 'secretary' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Secretária
            </button>
            <button 
              onClick={() => handleRoleChange('admin')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeRole === 'admin' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Gestão (Admin)
            </button>
          </div>
        </div>

        {/* HEADER DE SAUDAÇÃO */}
        <div className="mb-lg flex justify-between items-end">
          <div>
            <p className="font-label-md text-on-surface-variant mb-1">
              Perfil ativo: <span className="font-bold text-primary capitalize">{activeRole === 'professional' ? 'Terapeuta' : activeRole === 'secretary' ? 'Secretária / Recepção' : activeRole === 'patient' ? 'Paciente / Responsável' : 'Administrador'}</span>
            </p>
            <h2 className="font-display-lg text-primary text-4xl sm:text-5xl font-bold">
              {activeRole === 'patient' ? 'Sua Agenda' : 
               activeRole === 'professional' ? 'Bom dia, Dra. Mariana' : 
               activeRole === 'secretary' ? 'Painel de Recepção' : 
               'Gestão Geral do Instituto'}
            </h2>
          </div>
          <div className="hidden md:flex gap-sm">
            <button className="w-12 h-12 rounded-full bg-white hover:bg-surface-variant transition-colors flex items-center justify-center text-primary shadow-sm border border-slate-200">
              <Search size={24} />
            </button>
            <button className="w-12 h-12 rounded-full bg-white hover:bg-surface-variant transition-colors flex items-center justify-center text-primary shadow-sm border border-slate-200 relative">
              <Bell size={24} />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-error rounded-full border-2 border-white"></span>
            </button>
          </div>
        </div>

        {/* ROTEAMENTO DE VISÕES DO DASHBOARD */}
        {activeView === 'agenda' && isManagement ? (
          <div className="mt-4">
            <GestaoAgenda />
          </div>
        ) : activeView === 'financeiro' && isManagement ? (
          <div className="mt-4">
            <GestaoFinanceiro />
          </div>
        ) : activeView === 'cadastros' && isManagement ? (
          <div className="mt-4">
            <GestaoCadastros />
          </div>
        ) : activeView === 'configuracoes' && activeRole === 'admin' ? (
          <div className="mt-4">
            <ConfiguracoesClinica />
          </div>
        ) : activeRole === 'patient' ? (
          <div className="mt-4">
            <PatientAgenda />
          </div>
        ) : activeRole === 'professional' ? (
          <div className="mt-4">
            <TherapistDashboard />
          </div>
        ) : (
          /* OVERVIEW PADRÃO (ADMIN & SECRETÁRIA) */
          <>
            {/* Banner Carrossel */}
            <div className="w-full relative h-60 md:h-[350px] rounded-3xl overflow-hidden mb-lg shadow-xl">
              <div className="flex w-full h-full snap-x snap-mandatory overflow-x-auto hide-scrollbar">
                <div className="w-full h-full flex-shrink-0 snap-center relative">
                  <img alt="Instalações" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvUWT4c4hP7_TYc120ZtRY8TGjvZG7NW4xg_FGW_Z5gfJI7ptKp-6PBp1Q2Y1Lmwize_D508Lxkv6VO70MD4BzaY6YA_DJKa8JB4m7Suceuads6Lgy9pPUJCJrChkS_k6q1PmW9resg18Cj9qwLOMUgA_yn9Ggeyv1g4uyy6hYhf60lpcsndgYee-fw3y8V0fD3MYpqedbGbCFAbO2ox0jkKU-geAnF_JC6ybPq9ax8JvuPyIZThId" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 text-white">
                    <h3 className="text-2xl font-bold">Instituto Motivar</h3>
                    <p className="text-sm text-slate-200">Ambiente acolhedor e seguro para o desenvolvimento pleno.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="flex overflow-x-auto hide-scrollbar gap-grid-gutter pb-4 mb-8 -mx-grid-margin px-grid-margin md:mx-0 md:px-0">
              <div className="glass-card bg-white rounded-2xl p-md flex-shrink-0 w-[280px] border-l-4 border-l-secondary flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-secondary-fixed p-2 rounded-xl text-secondary">
                    <Calendar size={20} />
                  </div>
                  <span className="font-label-sm text-secondary bg-secondary-fixed-dim px-3 py-1 rounded-full text-xs font-bold">Hoje</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-on-surface text-[36px] leading-tight font-bold">42</h3>
                  <p className="font-body-md text-on-surface-variant font-medium mt-1">Sessões Marcadas</p>
                </div>
              </div>

              <div className="glass-card bg-white rounded-2xl p-md flex-shrink-0 w-[280px] border-l-4 border-l-tertiary flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-tertiary-fixed p-2 rounded-xl text-tertiary">
                    <Baby size={20} />
                  </div>
                  <span className="font-label-sm text-tertiary bg-tertiary-fixed-dim px-3 py-1 rounded-full text-xs font-bold">+3 novos</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-on-surface text-[36px] leading-tight font-bold">38</h3>
                  <p className="font-body-md text-on-surface-variant font-medium mt-1">Crianças em Atendimento</p>
                </div>
              </div>

              <div className="glass-card bg-white rounded-2xl p-md flex-shrink-0 w-[280px] border-l-4 border-l-primary flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-primary-fixed p-2 rounded-xl text-primary">
                    <MessageSquare size={20} />
                  </div>
                  <span className="font-label-sm text-primary bg-primary-fixed-dim px-3 py-1 rounded-full text-xs font-bold">WhatsApp</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-on-surface text-[36px] leading-tight font-bold">156</h3>
                  <p className="font-body-md text-on-surface-variant font-medium mt-1">Lembretes Disparados</p>
                </div>
              </div>
            </div>

            {/* Atendimentos e Avisos */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-grid-gutter">
              <div className="md:col-span-8 flex flex-col gap-grid-gutter">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-headline-md text-on-surface text-[20px] font-bold">Atendimentos em Destaque</h3>
                  <button onClick={() => setActiveView('agenda')} className="font-label-md text-secondary hover:underline font-bold text-sm">
                    Abrir Agenda Geral →
                  </button>
                </div>
                
                {/* Card 1 */}
                <div className="glass-card bg-[#FFFDF0] rounded-2xl p-md flex items-center justify-between relative overflow-hidden border border-[#F4E99B] shadow-sm">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#E5C100]"></div>
                  <div className="flex items-center gap-md">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#E5C100] shadow-sm">
                      <img alt="Paciente" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1595454223600-91fb4eaebec3?w=150&h=150&fit=crop&q=80" />
                    </div>
                    <div>
                      <h4 className="font-headline-md text-on-surface text-[16px] font-bold">Lucas Matheus Silva</h4>
                      <p className="text-xs text-slate-500">Terapia Ocupacional • Sala 02</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#856F00] bg-[#FFF8CC] px-2.5 py-1 rounded-full">Em andamento</span>
                    <p className="text-xs text-slate-400 mt-1">10:00 - 10:50</p>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="glass-card bg-white rounded-2xl p-md flex items-center justify-between relative overflow-hidden border border-slate-200 shadow-sm">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary"></div>
                  <div className="flex items-center gap-md">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-secondary shadow-sm">
                      <img alt="Paciente" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1601288496920-b6154fe3626a?w=150&h=150&fit=crop&q=80" />
                    </div>
                    <div>
                      <h4 className="font-headline-md text-on-surface text-[16px] font-bold">Pedro Henrique</h4>
                      <p className="text-xs text-slate-500">Fonoaudiologia • Sala 01</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">Confirmado</span>
                    <p className="text-xs text-slate-400 mt-1">11:00 - 11:50</p>
                  </div>
                </div>
              </div>

              {/* Coluna Direita: Ações Rápidas */}
              <div className="md:col-span-4 flex flex-col gap-grid-gutter pt-0 md:pt-[36px]">
                <div className="glass-card bg-white border border-slate-200 rounded-2xl p-md shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-primary font-bold">
                    <ShieldAlert size={20} />
                    <h4>Trilha de Auditoria</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Todas as ações dos colaboradores e terapeutas estão sendo registradas no Supabase com data, usuário e detalhes.
                  </p>
                  {activeRole === 'admin' ? (
                    <button 
                      onClick={() => setActiveView('configuracoes')} 
                      className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                      Acessar Relatório de Auditoria
                    </button>
                  ) : (
                    <span className="block text-center text-xs text-slate-400 font-semibold bg-slate-50 py-2 rounded-lg">
                      Auditoria ativa no servidor
                    </span>
                  )}
                </div>

                <div className="glass-card bg-white border border-slate-200 rounded-2xl p-md shadow-sm">
                  <h4 className="font-bold text-slate-800 text-sm mb-3">Avisos do Dia</h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
                      <p className="text-slate-600">Disparo automático de confirmações de WhatsApp concluído.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Info size={16} className="text-primary shrink-0 mt-0.5" />
                      <p className="text-slate-600">3 cadastros de novos pacientes aguardando triagem.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center pt-xs pb-sm px-base bg-surface-container shadow-lg rounded-t-2xl border-t border-slate-200">
        <button onClick={() => setActiveView('overview')} className="flex flex-col items-center justify-center text-primary">
          <LayoutDashboard size={20} />
          <span className="font-label-sm mt-0.5 text-xs">Início</span>
        </button>
        {isManagement ? (
          <>
            <button onClick={() => setActiveView('agenda')} className="flex flex-col items-center justify-center text-on-surface-variant">
              <Calendar size={20} />
              <span className="font-label-sm mt-0.5 text-xs">Agenda</span>
            </button>
            <button onClick={() => setActiveView('cadastros')} className="flex flex-col items-center justify-center text-on-surface-variant">
              <Users size={20} />
              <span className="font-label-sm mt-0.5 text-xs">Cadastros</span>
            </button>
            <button onClick={() => setActiveView('financeiro')} className="flex flex-col items-center justify-center text-on-surface-variant">
              <CreditCard size={20} />
              <span className="font-label-sm mt-0.5 text-xs">Financeiro</span>
            </button>
          </>
        ) : (
          <button onClick={() => setActiveView('overview')} className="flex flex-col items-center justify-center text-on-surface-variant">
            <User size={20} />
            <span className="font-label-sm mt-0.5 text-xs">Perfil</span>
          </button>
        )}
      </nav>
    </div>
  );
}

export default Dashboard;
