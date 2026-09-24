import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import { showAlert } from '../../lib/customAlert';

interface Props {
  onPasswordChanged: () => void;
}

export default function ForcePasswordChange({ onPasswordChanged }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);

    try {
      // 1. Atualiza a senha no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;

      // 2. Remove a flag de force_password_change no profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ force_password_change: false })
          .eq('id', user.id);
          
        if (profileError) throw profileError;
      }

      showAlert('Sucesso', 'Sua senha foi alterada com sucesso! Bem-vindo(a) ao sistema.', 'success');
      onPasswordChanged();

    } catch (err: any) {
      setError(err.message || 'Erro ao alterar a senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">
          Defina sua Senha Definitiva
        </h2>
        <p className="text-slate-600 text-center mb-8 text-sm">
          Para a sua segurança, por favor crie uma Senha Definitiva. Você usará esta senha para os seus próximos acessos rápidos ao sistema.
        </p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm font-medium flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nova Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Confirmar Nova Senha</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="Digite a senha novamente"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || password.length < 6}
            className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
