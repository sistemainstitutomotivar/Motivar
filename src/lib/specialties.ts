import { supabase } from './supabase';

export interface Specialty {
  id: string;
  name: string;
  created_at?: string;
}

const defaultSpecialties = [
  { id: '1', name: 'Psicologia' },
  { id: '2', name: 'Fonoaudiologia' },
  { id: '3', name: 'Terapia Ocupacional' },
  { id: '4', name: 'Psicopedagogia' },
  { id: '5', name: 'Musicoterapia' },
  { id: '6', name: 'Psicomotricidade' }
];

export async function getSpecialties(): Promise<Specialty[]> {
  try {
    const { data, error } = await supabase.from('clinic_specialties').select('*').order('name');
    if (error) throw error;
    if (data && data.length > 0) return data;
    return defaultSpecialties;
  } catch (err) {
    console.warn('Fallback para especialidades default (tabela pode não existir):', err);
    return defaultSpecialties;
  }
}

export async function createSpecialty(name: string): Promise<Specialty> {
  const newSpec = { id: crypto.randomUUID(), name };
  try {
    const { data, error } = await supabase.from('clinic_specialties').insert([newSpec]).select().single();
    if (!error && data) return data;
  } catch (err) {
    console.warn('Erro ao criar especialidade no Supabase:', err);
  }
  return newSpec;
}

export async function deleteSpecialty(id: string): Promise<void> {
  try {
    await supabase.from('clinic_specialties').delete().eq('id', id);
  } catch (err) {
    console.warn('Erro ao deletar especialidade:', err);
  }
}
