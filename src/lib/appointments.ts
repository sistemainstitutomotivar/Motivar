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
  created_at?: string;
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
    payment_status: 'paid'
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
    payment_status: 'pending'
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
    payment_status: 'pending'
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
    payment_status: 'paid'
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
    payment_status: 'pending'
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
    payment_status: 'paid'
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
      // Mescla os agendamentos reais do banco com os de demonstração sem duplicar id
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
 * Cria um novo agendamento e registra na trilha de auditoria
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
      valor: newAppointment.price
    }
  });

  return newAppointment;
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

  // Registra log de auditoria
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
