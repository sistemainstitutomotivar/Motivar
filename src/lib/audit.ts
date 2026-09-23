import { supabase } from './supabase';

export interface AuditLogEntry {
  id?: string;
  created_at?: string;
  user_id?: string | null;
  user_email?: string | null;
  user_role?: string | null;
  action: 'CRIACAO' | 'EDICAO' | 'EXCLUSAO' | 'CONFIRMACAO_AGENDAMENTO' | 'CANCELAMENTO_AGENDAMENTO' | 'INCLUSAO_NOTA' | 'PAGAMENTO_REGISTRADO' | 'ALTERACAO_CONFIGURACAO';
  entity_type: 'paciente' | 'terapeuta' | 'colaborador' | 'agendamento' | 'financeiro' | 'prontuario' | 'configuracao';
  entity_id?: string | null;
  entity_name: string;
  details?: Record<string, any> | string | null;
}

/**
 * Registra um evento de auditoria no Supabase.
 * Nunca trava a interface caso o banco esteja indisponível.
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): Promise<void> {
  try {
    // Tenta obter o usuário logado atualmente
    const { data: { user } } = await supabase.auth.getUser();
    
    let userEmail = entry.user_email || user?.email || 'usuario@sistema';
    let userId = entry.user_id || user?.id || null;
    let userRole = entry.user_role || user?.user_metadata?.role || 'admin';

    // Se temos o ID do usuário, tentamos consultar o role atual no profiles
    if (userId && !entry.user_role) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      if (profile?.role) {
        userRole = profile.role;
      }
    }

    const payload = {
      user_id: userId,
      user_email: userEmail,
      user_role: userRole,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id || null,
      entity_name: entry.entity_name,
      details: typeof entry.details === 'object' ? JSON.stringify(entry.details) : entry.details || null,
    };

    const { error } = await supabase.from('audit_logs').insert([payload]);
    
    if (error) {
      console.warn('Aviso: Falha ao persistir log de auditoria no Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Erro ao registrar log de auditoria:', err);
  }
}
