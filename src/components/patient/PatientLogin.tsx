import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

interface PatientLoginProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

export default function PatientLogin({ onLoginSuccess, onBack }: PatientLoginProps) {
  const [step, setStep] = useState<'login' | 'email' | 'otp' | 'create_password'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      onLoginSuccess();
    }
  };

  // 1. LOGIN PADRÃO
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;
      onLoginSuccess();
    } catch (err: any) {
      if (err.message === 'Invalid login credentials') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError(err.message || 'Erro ao fazer login.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. SOLICITAR CÓDIGO (PRIMEIRO ACESSO)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: isPatient, error: rpcError } = await supabase.rpc('check_patient_email', { p_email: email });
      if (rpcError) throw rpcError;
      if (!isPatient) {
        throw new Error('E-mail não encontrado nos registros da clínica. Procure a recepção.');
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({ email });
      if (otpError) throw otpError;

      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // 3. VERIFICAR CÓDIGO
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (verifyError) throw verifyError;
      setStep('create_password');
    } catch (err: any) {
      setError('Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  // 4. CRIAR SENHA DEFINITIVA
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      onLoginSuccess();
    } catch (err: any) {
      setError('Erro ao salvar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[448px]">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Área do Paciente
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'login' && 'Acompanhe as evoluções e agendamentos.'}
          {step === 'email' && 'Informe seu e-mail para receber o código'}
          {step === 'otp' && 'Digite o código que enviamos para o seu e-mail'}
          {step === 'create_password' && 'Crie uma senha definitiva para seus próximos acessos'}
        </p>
      </div>

      <div className="mt-8 mx-auto w-full max-w-[448px]">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10">
          
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-11 border px-3"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-11 border px-3"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-70 transition-colors"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Acessar Sistema'}
              </button>

              <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 text-center w-full"
                >
                  Primeiro acesso? Ou esqueceu a senha?
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 text-center w-full flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar para o site
                </button>
              </div>
            </form>
          )}

          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail Cadastrado</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-11 border px-3"
                    placeholder="voce@exemplo.com"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Receber Código'}
              </button>

              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-full text-sm font-medium text-gray-500 hover:text-gray-700 text-center flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar ao Login
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Código numérico</label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="mt-1 block w-full text-center text-2xl tracking-widest sm:text-lg border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-12 border"
                  placeholder="00000000"
                  maxLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Verificar Código'}
              </button>
              
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-sm font-medium text-gray-500 hover:text-gray-700 text-center"
              >
                Não recebeu? Tentar novamente
              </button>
            </form>
          )}

          {step === 'create_password' && (
            <form onSubmit={handleCreatePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Crie uma senha forte</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-11 border px-3"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || password.length < 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Salvar Senha e Entrar'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
