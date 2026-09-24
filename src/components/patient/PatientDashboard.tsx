import { supabase } from '../../lib/supabase';
import { LogOut, Calendar, User, FileText, Bell, MessageCircle, ChevronRight, Activity, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PatientDashboardProps {
  onLogout: () => void;
}

export default function PatientDashboard({ onLogout }: PatientDashboardProps) {
  const [userName, setUserName] = useState<string>('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Busca perfil para o nome
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
          
        if (profile?.full_name) {
          setUserName(profile.full_name.split(' ')[0]);
        }

        // 2. Busca o ID do paciente na tabela clinic_patients pelo email
        if (user.email) {
          const { data: patientData } = await supabase
            .from('clinic_patients')
            .select('id')
            .eq('email', user.email)
            .single();

          if (patientData) {
            // 3. Busca as consultas futuras deste paciente
            const today = new Date().toISOString().split('T')[0];
            const { data: appts } = await supabase
              .from('clinic_appointments')
              .select('*')
              .eq('patient_id', patientData.id)
              .gte('date', today)
              .order('date', { ascending: true })
              .order('time', { ascending: true })
              .limit(5);

            if (appts) {
              setAppointments(appts);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do paciente:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-[#fff8f7] font-sans selection:bg-primary/20">
      
      {/* NAVBAR MODERNA */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-rose-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <img 
                src="/images/logo-motivar.png" 
                alt="Instituto Motivar" 
                className="h-10 w-auto"
              />
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button className="p-2.5 rounded-full text-slate-400 hover:text-primary hover:bg-rose-50 transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-bold text-slate-500 hover:text-primary hover:bg-rose-50 rounded-full transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" /> 
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        {/* HERO SECTION - BOAS VINDAS */}
        <div className="bg-gradient-to-r from-primary to-rose-400 rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-rose-200/50 relative overflow-hidden">
          {/* Elementos decorativos de fundo */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-32 translate-y-12 w-40 h-40 bg-rose-600/20 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
              Olá{userName ? `, ${userName}` : ''}! 👋
            </h1>
            <p className="text-rose-100 text-lg max-w-xl">
              Que bom ter você por aqui. Acompanhe suas consultas, histórico e documentos de forma simples e rápida.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA PRINCIPAL - CONSULTAS */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow-sm border border-rose-100/50 overflow-hidden">
              <div className="px-8 py-6 border-b border-rose-50 flex items-center justify-between bg-white">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-rose-100 rounded-xl text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  Próximas Consultas
                </h3>
              </div>
              
              {loading ? (
                <div className="p-12 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : appointments.length > 0 ? (
                <div className="divide-y divide-rose-50">
                  {appointments.map((apt, idx) => (
                    <div key={idx} className="p-6 hover:bg-rose-50/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center text-primary font-bold text-lg border-2 border-white shadow-sm shrink-0">
                          {formatDateBR(apt.date).substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-lg">{apt.therapist_name}</p>
                          <p className="text-sm text-slate-500 font-medium">{apt.room || 'Consultório'} • {apt.modality || 'Sessão'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-white border border-rose-100 px-4 py-2.5 rounded-xl shadow-sm">
                        <Calendar className="w-4 h-4 text-rose-400" />
                        <span className="font-bold text-slate-700">
                          {formatDateBR(apt.date)} às {apt.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 flex flex-col items-center justify-center text-center bg-slate-50/50">
                  <div className="w-24 h-24 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                    <Activity className="h-10 w-10 text-slate-300" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-700 mb-2">Nenhuma consulta agendada</h4>
                  <p className="text-slate-500 max-w-sm">
                    No momento você não possui compromissos próximos. Nossa equipe entrará em contato caso haja atualizações!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* COLUNA LATERAL - ACESSOS RÁPIDOS */}
          <div className="space-y-6">
            
            {/* TILE: MEUS DADOS */}
            <button className="w-full bg-white p-6 rounded-3xl shadow-sm border border-rose-100/50 hover:shadow-md hover:border-rose-200 transition-all group flex items-center justify-between text-left">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Meus Dados</h4>
                  <p className="text-sm text-slate-500">Atualizar informações</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
            </button>

            {/* TILE: FINANCEIRO */}
            <button className="w-full bg-white p-6 rounded-3xl shadow-sm border border-rose-100/50 hover:shadow-md hover:border-rose-200 transition-all group flex items-center justify-between text-left">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Financeiro</h4>
                  <p className="text-sm text-slate-500">Mensalidades e notas</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
            </button>

            {/* TILE: DOCUMENTOS */}
            <button className="w-full bg-white p-6 rounded-3xl shadow-sm border border-rose-100/50 hover:shadow-md hover:border-rose-200 transition-all group flex items-center justify-between text-left">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Documentos</h4>
                  <p className="text-sm text-slate-500">Laudos e receitas</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
            </button>

            {/* WIDGET WHATSAPP */}
            <div className="bg-[#25D366]/10 rounded-3xl p-6 border border-[#25D366]/20 relative overflow-hidden mt-8">
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-[#1e9a49] mb-2 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Precisa de ajuda?
                </h3>
                <p className="text-[#20a34e] text-sm mb-5">
                  Fale diretamente com nossa recepção para dúvidas ou remarcações.
                </p>
                <button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 px-4 rounded-xl font-bold transition-all shadow-lg shadow-[#25D366]/30 flex items-center justify-center gap-2">
                  Chamar no WhatsApp
                </button>
              </div>
              <MessageCircle className="absolute -bottom-4 -right-4 h-32 w-32 text-[#25D366]/10 pointer-events-none" />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
