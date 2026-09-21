import { useState } from 'react';
import { X, Lock, User, Loader2 } from 'lucide-react';
import type { UserRole } from '../../App';
import { supabase } from '../../lib/supabase';

interface IntranetLoginProps {
  onClose: () => void;
}

export default function IntranetLogin({ onClose }: IntranetLoginProps) {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>('patient');

  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [emailReal, setEmailReal] = useState('');

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setError('Por favor, digite um CPF válido com 11 números.');
      return;
    }
    
    if (isRegistering && fullName.trim().length < 3) {
      setError('Por favor, digite seu nome completo.');
      return;
    }

    if (isRegistering && (!emailReal.includes('@') || emailReal.length < 5)) {
      setError('Por favor, digite um e-mail válido.');
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        // 1. Cadastrar usuário na Autenticação passando os dados do perfil junto
        const { error: signUpError } = await supabase.auth.signUp({
          email: emailReal,
          password: password,
          options: {
            data: {
              full_name: fullName,
              cpf: cleanCpf,
              role: role
            }
          }
        });

        if (signUpError) throw signUpError;
        
        // Removemos o insert manual no frontend! 
        // O banco de dados (via Trigger) vai fazer isso sozinho de forma 100% segura.
      } else {
        // Apenas fazer Login usando o CPF
        // 1. Chamar a função do banco que busca o e-mail atrelado a este CPF
        const { data: emailData, error: rpcError } = await supabase.rpc('get_email_by_cpf', { cpf_input: cleanCpf });
        
        if (rpcError || !emailData) {
          throw new Error('Invalid login credentials'); // Força erro de credencial se não achar CPF
        }

        // 2. Logar com o e-mail retornado
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailData,
          password: password,
        });

        if (signInError) throw signInError;
      }
      
      onClose();

    } catch (err: any) {
      console.error("ERRO COMPLETO:", err);
      if (err.message === 'Invalid login credentials') {
        setError('CPF ou senha incorretos.');
      } else if (err.message === 'User already registered') {
        setError('Este CPF já está cadastrado.');
      } else {
        setError(`Erro técnico: ${err.message || 'Falha na comunicação'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ minWidth: '100vw', minHeight: '100vh' }}>
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        className="relative bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 overflow-y-auto max-h-[90vh]"
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
            {isRegistering ? 'Criar Nova Conta' : role === 'patient' ? 'Área do Paciente' : role === 'professional' ? 'Área do Terapeuta' : 'Administração'}
          </h2>
          <p className="text-slate-500 text-sm mt-2" style={{ whiteSpace: 'normal', wordBreak: 'normal' }}>
            {isRegistering 
              ? 'Preencha os dados abaixo para se cadastrar.' 
              : role === 'patient' ? 'Acompanhe as evoluções e agendamentos.' : role === 'professional' ? 'Acesso restrito para terapeutas da clínica.' : 'Gestão administrativa e financeira.'}
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

        <form className="space-y-4 w-full flex flex-col" onSubmit={handleSubmit}>
          
          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg text-center font-medium border border-red-100">
              {error}
            </div>
          )}

          {isRegistering && (
            <>
              <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-1" style={{ textAlign: 'left' }}>Nome Completo</label>
                <div className="relative w-full flex items-center">
                  <div className="absolute left-3 text-slate-400 flex items-center justify-center h-full">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-700"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-1" style={{ textAlign: 'left' }}>E-mail (Para recuperação de senha)</label>
                <div className="relative w-full flex items-center">
                  <div className="absolute left-3 text-slate-400 flex items-center justify-center h-full">
                    <User size={18} />
                  </div>
                  <input 
                    type="email" 
                    value={emailReal}
                    onChange={(e) => setEmailReal(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-700"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </>
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
            {!isRegistering && (
              <div className="flex justify-end mt-2">
                <a href="#" className="text-xs font-medium text-primary hover:text-primary/80">Esqueceu a senha?</a>
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/30 mt-6 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ width: '100%' }}
          >
            {loading && <Loader2 className="animate-spin" size={20} />}
            {loading ? 'Processando...' : isRegistering ? 'Criar Conta' : 'Acessar Sistema'}
          </button>

          <div className="text-center mt-4">
            <button 
              type="button" 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-slate-500 hover:text-primary font-medium transition-colors"
            >
              {isRegistering ? 'Já tem uma conta? Fazer Login' : 'Ainda não tem conta? Cadastre-se'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
