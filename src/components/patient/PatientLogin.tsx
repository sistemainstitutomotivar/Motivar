import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

interface PatientLoginProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

export default function PatientLogin({ onLoginSuccess, onBack }: PatientLoginProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'create_pin' | 'lockscreen'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verifica se já existe uma sessão ativa ao abrir a tela
  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Tem sessão. Vamos ver se tem PIN cadastrado
      const { data: patient } = await supabase
        .from('clinic_patients')
        .select('app_pin')
        .eq('user_id', session.user.id)
        .single();
        
      if (patient?.app_pin) {
        setStep('lockscreen');
      } else {
        setStep('create_pin');
      }
    }
  };

  // Função auxiliar para criar hash do PIN (SHA-256)
  const hashPin = async (plainPin: string) => {
    const msgBuffer = new TextEncoder().encode(plainPin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Verifica se o paciente existe na clínica
      const { data: isPatient, error: rpcError } = await supabase.rpc('check_patient_email', { p_email: email });
      
      if (rpcError) throw rpcError;
      if (!isPatient) {
        throw new Error('E-mail não encontrado nos registros da clínica. Procure a recepção.');
      }

      // 2. Envia o código OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({ email });
      if (otpError) throw otpError;

      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (verifyError) throw verifyError;
      
      // Associa o ID do Auth à tabela de pacientes, caso ainda não tenha sido feito
      await supabase
        .from('clinic_patients')
        .update({ user_id: data.user?.id })
        .eq('email', email);

      // Verifica se já tem PIN
      const { data: patient } = await supabase
        .from('clinic_patients')
        .select('app_pin')
        .eq('email', email)
        .single();

      if (patient?.app_pin) {
        onLoginSuccess();
      } else {
        setStep('create_pin');
      }
    } catch (err: any) {
      setError('Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (pin.length !== 4) {
      setError('O PIN deve ter 4 dígitos numéricos.');
      return;
    }
    
    if (pin !== confirmPin) {
      setError('Os PINs não conferem.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessão inválida');

      const hashedPin = await hashPin(pin);

      const { error: updateError } = await supabase
        .from('clinic_patients')
        .update({ app_pin: hashedPin })
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      
      onLoginSuccess();
    } catch (err: any) {
      setError('Erro ao salvar o PIN.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStep('email');
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const { data: patient } = await supabase
        .from('clinic_patients')
        .select('app_pin')
        .eq('user_id', user.id)
        .single();

      const hashedAttempt = await hashPin(pin);
      
      if (patient?.app_pin === hashedAttempt) {
        onLoginSuccess();
      } else {
        setError('PIN incorreto.');
        setPin(''); // Limpa o campo
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao desbloquear.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async () => {
    await supabase.auth.signOut();
    setStep('email');
    setPin('');
    setOtp('');
    setError(null);
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
          {step === 'email' && 'Informe seu e-mail cadastrado na clínica'}
          {step === 'otp' && 'Digite o código que enviamos para seu e-mail'}
          {step === 'create_pin' && 'Crie um PIN de acesso rápido'}
          {step === 'lockscreen' && 'Digite seu PIN de 4 dígitos'}
        </p>
      </div>

      <div className="mt-8 mx-auto w-full max-w-[448px]">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
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

          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Endereço de E-mail
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-10 border px-3"
                    placeholder="voce@exemplo.com"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={onBack}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Aguarde...' : 'Receber Código'}
                </button>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Código de 6 dígitos
                </label>
                <div className="mt-1">
                  <input
                    id="otp"
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="block w-full text-center tracking-[0.5em] font-mono text-2xl sm:text-xl border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-12 border px-3"
                    placeholder="000000"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 text-center">
                  O código foi enviado para {email}
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Validando...' : 'Entrar'}
              </button>
            </form>
          )}

          {step === 'create_pin' && (
            <form onSubmit={handleCreatePin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Crie um PIN (4 números)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="mt-1 block w-full text-center tracking-[1em] font-mono text-2xl border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-12 border px-3"
                  placeholder="••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirme o PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="mt-1 block w-full text-center tracking-[1em] font-mono text-2xl border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-12 border px-3"
                  placeholder="••••"
                />
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex">
                  <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5" />
                  <p className="ml-3 text-sm text-blue-700">
                    Este PIN será solicitado na próxima vez que você acessar o aplicativo, 
                    garantindo rapidez e segurança.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar PIN e Entrar'}
              </button>
            </form>
          )}

          {step === 'lockscreen' && (
            <form onSubmit={handleUnlock} className="space-y-6">
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="mt-1 block w-full text-center tracking-[1em] font-mono text-3xl border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-16 border px-3"
                  placeholder="••••"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || pin.length !== 4}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Desbloquear'}
              </button>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={handleResetPin}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Esqueci meu PIN (Acessar com E-mail)
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
