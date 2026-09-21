import { useState } from 'react';
import { X, Lock, User } from 'lucide-react';
import type { UserRole } from '../../App';

interface IntranetLoginProps {
  onClose: () => void;
  onLogin: (role: UserRole) => void;
}

export default function IntranetLogin({ onClose, onLogin }: IntranetLoginProps) {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState<UserRole>('patient');

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, '') // Remove tudo que não é número
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto entre o 3º e o 4º dígitos
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto entre o 6º e o 7º dígitos
      .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Coloca traço entre o 9º e o 10º dígitos
      .replace(/(-\d{2})\d+?$/, '$1'); // Impede que passe de 14 caracteres no total
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (cpf === '123.456.789-00' && password === '12345678') {
      onLogin(role); // Passa o papel (role) selecionado
    } else {
      setError('CPF ou senha incorretos. Tente CPF: 123.456.789-00');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ minWidth: '100vw', minHeight: '100vh' }}>
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        className="relative bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8"
        style={{ width: '100%', maxWidth: '420px', minWidth: '300px' }}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Lock size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 w-full" style={{ wordBreak: 'normal' }}>
            {role === 'patient' ? 'Área do Paciente' : role === 'professional' ? 'Área do Terapeuta' : 'Administração'}
          </h2>
          <p className="text-slate-500 text-sm mt-2" style={{ whiteSpace: 'normal', wordBreak: 'normal' }}>
            {role === 'patient' ? 'Acompanhe as evoluções e agendamentos.' : role === 'professional' ? 'Acesso restrito para terapeutas da clínica.' : 'Gestão administrativa e financeira.'}
          </p>
        </div>

        {/* Abas de Seleção de Perfil */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-6 relative gap-1">
          <button 
            type="button"
            onClick={() => setRole('patient')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all z-10 ${role === 'patient' ? 'text-primary shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Paciente
          </button>
          <button 
            type="button"
            onClick={() => setRole('professional')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all z-10 ${role === 'professional' ? 'text-primary shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Terapeuta
          </button>
          <button 
            type="button"
            onClick={() => setRole('admin')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all z-10 ${role === 'admin' ? 'text-primary shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Gestão
          </button>
        </div>

        <form className="space-y-4 w-full flex flex-col" onSubmit={handleLogin}>
          
          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg text-center font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1" style={{ textAlign: 'left' }}>CPF</label>
            <div className="relative w-full flex items-center">
              <div className="absolute left-3 text-slate-400 flex items-center justify-center h-full">
                <User size={18} />
              </div>
              <input 
                type="text" 
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-700"
                style={{ width: '100%' }}
              />
            </div>
          </div>
          
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1" style={{ textAlign: 'left' }}>Senha</label>
            <div className="relative w-full flex items-center">
              <div className="absolute left-3 text-slate-400 flex items-center justify-center h-full">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-700"
                style={{ width: '100%' }}
              />
            </div>
            <div className="flex justify-end mt-2">
              <a href="#" className="text-xs font-medium text-primary hover:text-primary/80">Esqueceu a senha?</a>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/30 mt-6"
            style={{ width: '100%' }}
          >
            Acessar Sistema
          </button>
        </form>
      </div>
    </div>
  );
}
