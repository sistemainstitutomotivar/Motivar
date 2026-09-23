import React from 'react';
import { supabase } from '../../lib/supabase';
import { LogOut, Calendar, User, FileText, Bell } from 'lucide-react';

interface PatientDashboardProps {
  onLogout: () => void;
}

export default function PatientDashboard({ onLogout }: PatientDashboardProps) {
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar simplificada para o Paciente */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-blue-600">Instituto Motivar</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                <Bell className="h-5 w-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-5 w-5 mr-1" /> Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Olá, bem-vindo(a)</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card: Próximas Consultas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden md:col-span-2">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                Próximas Consultas
              </h3>
            </div>
            <div className="p-6 text-center text-gray-500 py-12">
              <p>Nenhuma consulta agendada para os próximos dias.</p>
              <p className="text-sm mt-2">Sua clínica agendará as próximas sessões.</p>
            </div>
          </div>

          {/* Card: Meus Dados / Links Rápidos */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-500" />
                Meus Dados
              </h3>
              <ul className="space-y-3">
                <li>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Atualizar informações pessoais
                  </button>
                </li>
                <li>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Histórico financeiro
                  </button>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Precisa de ajuda?
              </h3>
              <p className="text-sm text-blue-800 mb-4">
                Entre em contato com a nossa recepção para dúvidas ou remarcações.
              </p>
              <button className="w-full bg-white text-blue-600 border border-blue-300 rounded-md py-2 px-4 text-sm font-medium hover:bg-blue-50 transition-colors">
                Falar no WhatsApp
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
