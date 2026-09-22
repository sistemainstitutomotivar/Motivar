import { useState, useEffect } from 'react';
import LandingPage from './components/landing/LandingPage';
import Dashboard from './components/dashboard/Dashboard';
import { supabase } from './lib/supabase';

export type UserRole = 'patient' | 'professional' | 'admin' | null;

function App() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão atual assim que o app carrega
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    };

    checkSession();

    // Fica escutando mudanças (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Busca qual é o nível de acesso (role) do usuário na tabela profiles
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
        
      if (error) {
        throw error;
      }
        
      if (data && data.role) {
        setUserRole(data.role as UserRole);
      } else {
        throw new Error('Perfil não encontrado na tabela profiles');
      }
    } catch (err) {
      console.warn("Aviso (buscando perfil):", err);
      // Fallback de segurança: se a tabela profiles falhar (ex: Trigger não rodou), pega o role direto dos metadados
      const { data: { user } } = await supabase.auth.getUser();
      const fallbackRole = user?.user_metadata?.role || 'patient';
      setUserRole(fallbackRole as UserRole);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Carregando sistema...</div>;
  }

  if (userRole) {
    return <Dashboard role={userRole} onLogout={handleLogout} />;
  }

  return <LandingPage />;
}

export default App;
