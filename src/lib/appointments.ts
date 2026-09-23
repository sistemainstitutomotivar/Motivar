import { supabase } from './supabase';
import { logAuditEvent } from './audit';

export interface ClinicAppointment {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration_minutes?: number;
  patient_id?: string;
  patient_name: string;
  patient_avatar?: string;
  therapist_id?: string;
  therapist_name: string;
  therapist_avatar?: string;
  room: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'in_progress';
  justification?: string;
  price?: number;
  payment_status?: 'paid' | 'pending';
  recurrence_type?: 'single' | 'weekly' | 'biweekly';
  recurrence_group_id?: string;
  created_at?: string;
}

export interface RecurringSlot {
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  time: string; // HH:mm
  room?: string;
}

// Datas relativas para garantir que o mock sempre tenha dados hoje/amanhã/ontem
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const formatYMD = (d: Date) => d.toISOString().split('T')[0];
const inProgressDate = new Date();
inProgressDate.setMinutes(inProgressDate.getMinutes() - 25);
const formatTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export const initialMockAppointments: ClinicAppointment[] = [
  { 
    id: 'mock-1', 
    date: formatYMD(today), 
    time: '08:00', 
    duration_minutes: 50,
    patient_name: 'Pedro Henrique', 
    patient_avatar: 'https://images.unsplash.com/photo-1601288496920-b6154fe3626a?w=150&h=150&fit=crop&q=80', 
    therapist_name: 'Dra. Mariana Costa', 
    therapist_avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&q=80', 
    room: 'Sala 01 - Principal', 
    status: 'confirmed',
    price: 180,
    payment_status: 'paid',
    recurrence_type: 'weekly'
  },
  { 
    id: 'mock-2', 
    date: formatYMD(today), 
    time: '09:00', 
    duration_minutes: 50,
    patient_name: 'Lucas Matheus Silva', 
    patient_avatar: 'https://images.unsplash.com/photo-1595454223600-91fb4eaebec3?w=150&h=150&fit=crop&q=80', 
    therapist_name: 'Dr. Roberto Alves', 
    therapist_avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&q=80', 
    room: 'Sala 02 - Integração Sensorial', 
    status: 'pending',
    price: 200,
    payment_status: 'pending',
    recurrence_type: 'weekly'
  },
  { 
    id: 'mock-3', 
    date: formatYMD(today), 
    time: '10:00', 
    duration_minutes: 50,
    patient_name: 'Ana Júlia', 
    therapist_name: 'Dra. Mariana Costa', 
    therapist_avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&q=80', 
    room: 'Sala 01 - Principal', 
    status: 'cancelled', 
    justification: 'Paciente amanheceu com febre.',
    price: 180,
    payment_status: 'pending',
    recurrence_type: 'biweekly'
  },
  { 
    id: 'mock-6', 
    date: formatYMD(today), 
    time: formatTime(inProgressDate), 
    duration_minutes: 50, 
    patient_name: 'Rafael Gomes', 
    patient_avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&h=150&fit=crop&q=80', 
    therapist_name: 'Dra. Mariana Costa', 
    therapist_avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&q=80', 
    room: 'Sala 03', 
    status: 'in_progress',
    price: 180,
    payment_status: 'paid',
    recurrence_type: 'single'
  },
  { 
    id: 'mock-4', 
    date: formatYMD(tomorrow), 
    time: '11:00', 
    duration_minutes: 50,
    patient_name: 'Marcos Vinícius', 
    therapist_name: 'Dra. Mariana Costa', 
    room: 'Sala 02 - Integração Sensorial', 
    status: 'confirmed',
    price: 180,
    payment_status: 'pending',
    recurrence_type: 'weekly'
  },
  { 
    id: 'mock-5', 
    date: formatYMD(yesterday), 
    time: '14:00', 
    duration_minutes: 50,
    patient_name: 'Fernanda Lima', 
    therapist_name: 'Dr. Roberto Alves', 
    room: 'Sala 04', 
    status: 'confirmed',
    price: 200,
    payment_status: 'paid',
    recurrence_type: 'single'
  },
];

/**
 * Busca agendamentos do Supabase mesclando com os mocks
 */
export async function getAppointments(): Promise<ClinicAppointment[]> {
  try {
    const { data, error } = await supabase
      .from('clinic_appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.warn('Tabela clinic_appointments pode não existir ainda:', error.message);
      return initialMockAppointments;
    }

    if (data && data.length > 0) {
      const dbIds = new Set(data.map(d => d.id));
      const remainingMocks = initialMockAppointments.filter(m => !dbIds.has(m.id));
      return [...data, ...remainingMocks];
    }

    return initialMockAppointments;
  } catch (err) {
    console.warn('Erro ao buscar agendamentos:', err);
    return initialMockAppointments;
  }
}

/**
 * Gera ocorrências para planos de agendamento (Avulsa, Semanal com múltiplos dias, Quinzenal)
 */
export function generateOccurrences(
  base: Omit<ClinicAppointment, 'id' | 'created_at'>,
  recurrenceType: 'single' | 'weekly' | 'biweekly',
  periodWeeks: number, // 4, 8, 12, 24
  additionalSlots: RecurringSlot[] = []
): Omit<ClinicAppointment, 'id' | 'created_at'>[] {
  if (recurrenceType === 'single') {
    return [{ ...base, recurrence_type: 'single' }];
  }

  const groupId = crypto.randomUUID();
  const results: Omit<ClinicAppointment, 'id' | 'created_at'>[] = [];
  
  // Data base de início
  const [year, month, day] = base.date.split('-').map(Number);
  const startObj = new Date(year, month - 1, day, 12, 0, 0);
  
  if (recurrenceType === 'biweekly') {
    const totalSessions = Math.max(1, Math.floor(periodWeeks / 2));
    for (let i = 0; i < totalSessions; i++) {
      const curDate = new Date(startObj);
      curDate.setDate(curDate.getDate() + (i * 14));
      const dateStr = curDate.toISOString().split('T')[0];
      results.push({
        ...base,
        date: dateStr,
        recurrence_type: 'biweekly',
        recurrence_group_id: groupId,
      });
    }
    return results;
  }

  // recurrenceType === 'weekly'
  const baseDayOfWeek = startObj.getDay();

  for (let w = 0; w < periodWeeks; w++) {
    // 1. Sessão principal da semana
    const curDate = new Date(startObj);
    curDate.setDate(curDate.getDate() + (w * 7));
    results.push({
      ...base,
      date: curDate.toISOString().split('T')[0],
      recurrence_type: 'weekly',
      recurrence_group_id: groupId,
    });

    // 2. Dias adicionais na semana (ex: Quarta 15h, Sexta 17h)
    for (const slot of additionalSlots) {
      let diffDays = slot.dayOfWeek - baseDayOfWeek;
      const slotDate = new Date(curDate);
      slotDate.setDate(slotDate.getDate() + diffDays);
      results.push({
        ...base,
        date: slotDate.toISOString().split('T')[0],
        time: slot.time,
        room: slot.room || base.room,
        recurrence_type: 'weekly',
        recurrence_group_id: groupId,
      });
    }
  }

  results.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  return results;
}

/**
 * Cria um único agendamento e registra na trilha de auditoria
 */
export async function createAppointment(apt: Omit<ClinicAppointment, 'id' | 'created_at'>): Promise<ClinicAppointment> {
  const newAppointment: ClinicAppointment = {
    ...apt,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('clinic_appointments')
      .insert([newAppointment])
      .select()
      .single();

    if (error) {
      console.warn('Aviso: gravando agendamento apenas localmente:', error.message);
    } else if (data) {
      newAppointment.id = data.id;
    }
  } catch (err) {
    console.warn('Erro ao persistir agendamento no Supabase:', err);
  }

  // Registra auditoria compulsória
  await logAuditEvent({
    action: 'CRIACAO',
    entity_type: 'agendamento',
    entity_id: newAppointment.id,
    entity_name: `Consulta: ${newAppointment.patient_name}`,
    details: {
      paciente: newAppointment.patient_name,
      terapeuta: newAppointment.therapist_name,
      data: newAppointment.date,
      horario: newAppointment.time,
      sala: newAppointment.room,
      valor: newAppointment.price,
      tipo_recorrencia: newAppointment.recurrence_type || 'single'
    }
  });

  return newAppointment;
}

/**
 * Cria um lote de agendamentos (plano fixo semanal ou quinzenal) com auditoria
 */
export async function createBatchAppointments(
  apts: Omit<ClinicAppointment, 'id' | 'created_at'>[]
): Promise<ClinicAppointment[]> {
  const newAppointments: ClinicAppointment[] = apts.map(apt => ({
    ...apt,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString()
  }));

  try {
    const { data, error } = await supabase
      .from('clinic_appointments')
      .insert(newAppointments)
      .select();

    if (error) {
      console.warn('Aviso: gravando agendamentos apenas localmente:', error.message);
    } else if (data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('Erro ao persistir lote de agendamentos no Supabase:', err);
  }

  const first = newAppointments[0];
  await logAuditEvent({
    action: 'CRIACAO',
    entity_type: 'agendamento',
    entity_id: first.recurrence_group_id || first.id,
    entity_name: `Plano Fixo (${newAppointments.length} sessões): ${first.patient_name}`,
    details: {
      paciente: first.patient_name,
      terapeuta: first.therapist_name,
      total_sessoes: newAppointments.length,
      tipo_recorrencia: first.recurrence_type || 'weekly',
      primeira_data: first.date,
      ultima_data: newAppointments[newAppointments.length - 1].date
    }
  });

  return newAppointments;
}

/**
 * Atualiza o status de um agendamento e gera log de auditoria
 */
export async function updateAppointmentStatus(
  id: string, 
  status: ClinicAppointment['status'], 
  justification?: string,
  patientName?: string
): Promise<void> {
  try {
    const updatePayload: Record<string, any> = { status };
    if (justification) updatePayload.justification = justification;

    const { error } = await supabase
      .from('clinic_appointments')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.warn('Aviso ao atualizar status no banco:', error.message);
    }
  } catch (err) {
    console.warn('Erro ao atualizar agendamento:', err);
  }

  const actionType = status === 'confirmed' 
    ? 'CONFIRMACAO_AGENDAMENTO' 
    : status === 'cancelled' 
    ? 'CANCELAMENTO_AGENDAMENTO' 
    : 'EDICAO';

  await logAuditEvent({
    action: actionType,
    entity_type: 'agendamento',
    entity_id: id,
    entity_name: patientName ? `Consulta: ${patientName}` : `Agendamento #${id.slice(0, 8)}`,
    details: {
      novo_status: status,
      justificativa: justification || null
    }
  });
}
