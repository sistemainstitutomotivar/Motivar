import { useState } from 'react';
import { X, Lock, Loader2, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface IntranetLoginProps {
  onClose: () => void;
}

export default function IntranetLogin({ onClose }: IntranetLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.includes('@') || email.length < 5) {
      setError('Por favor, digite um e-mail válido.');
      return;
    }
    
    setLoading(true);

    try {
      // Apenas fazer Login usando o E-MAIL nativamente
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) throw signInError;
      
      onClose();

    } catch (err: any) {
      console.error("ERRO COMPLETO:", err);
      if (err.message === 'Invalid login credentials') {
        setError('E-mail ou senha incorretos.');
      } else if (err.message === 'Email not confirmed') {
        setError('Confirme seu e-mail antes de fazer login.');
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
            Acesso Restrito
          </h2>
          <p className="text-slate-500 text-sm mt-2" style={{ whiteSpace: 'normal', wordBreak: 'normal' }}>
            Área exclusiva para colaboradores e gestão da clínica.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center font-medium w-full">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1" style={{ textAlign: 'left' }}>E-mail</label>
              <div className="relative w-full flex items-center">
                <div className="absolute left-3 text-slate-400 flex items-center justify-center h-full">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
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
            </div>

            <div className="flex justify-end mt-2">
              <a href="#" className="text-xs font-medium text-primary hover:text-primary/80">Esqueceu a senha?</a>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/30 mt-6 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ width: '100%' }}
          >
            {loading && <Loader2 className="animate-spin" size={20} />}
            {loading ? 'Autenticando...' : 'Acessar Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
