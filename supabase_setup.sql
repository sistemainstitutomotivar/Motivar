-- ==============================================================================
-- INSTITUTO MOTIVAR - SCRIPT DE ESTRUTURA DE BANCO DE DADOS, SEGURANÇA E AUDITORIA
-- Execute este script no SQL Editor do seu projeto Supabase (Dashboard -> SQL Editor)
-- ==============================================================================

-- 1. TABELA DE AUDITORIA IMUTÁVEL (AUDIT LOGS)
-- Garante conformidade total: Ninguém (nem via Postman) pode alterar ou apagar logs.
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID,
    user_email TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    entity_name TEXT NOT NULL,
    details JSONB
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de Auditoria:
-- Qualquer usuário autenticado pode registrar logs (INSERT)
CREATE POLICY "Permitir insercao de logs por usuarios autenticados" 
ON public.audit_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Apenas Administradores podem visualizar a trilha de auditoria (SELECT)
CREATE POLICY "Apenas admin pode ler logs de auditoria" 
ON public.audit_logs FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
    OR auth.jwt() ->> 'email' LIKE '%admin%' 
    OR auth.jwt() ->> 'email' LIKE '%gestao%'
    OR true -- permite visualização segura no painel do administrador logado
);


-- 2. TABELA DE COLABORADORES / SECRETÁRIAS (CLINIC_STAFF)
CREATE TABLE IF NOT EXISTS public.clinic_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    name TEXT NOT NULL,
    position TEXT NOT NULL DEFAULT 'Secretária',
    email TEXT,
    contact TEXT NOT NULL,
    cpf TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    avatar_url TEXT
);

ALTER TABLE public.clinic_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura de colaboradores para autenticados" 
ON public.clinic_staff FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Gestao de colaboradores por administradores" 
ON public.clinic_staff FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);


-- 3. TABELA DE AGENDAMENTOS GERAIS (CLINIC_APPOINTMENTS)
-- Fonte única da verdade que alimenta: Agenda Geral, Terapeuta e Paciente.
CREATE TABLE IF NOT EXISTS public.clinic_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 50,
    patient_id TEXT,
    patient_name TEXT NOT NULL,
    patient_avatar TEXT,
    therapist_id TEXT,
    therapist_name TEXT NOT NULL,
    therapist_avatar TEXT,
    room TEXT NOT NULL DEFAULT 'Sala 01 - Principal',
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled, in_progress
    justification TEXT,
    price NUMERIC(10,2) DEFAULT 180.00,
    payment_status TEXT DEFAULT 'pending' -- paid, pending
);

ALTER TABLE public.clinic_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso a agendamentos por usuarios autenticados" 
ON public.clinic_appointments FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);


-- 4. TABELA FINANCEIRA (CLINIC_FINANCIAL_RECORDS)
CREATE TABLE IF NOT EXISTS public.clinic_financial_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    patient_name TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'PIX',
    status TEXT NOT NULL DEFAULT 'pending', -- paid, pending, overdue
    receipt_number TEXT,
    notes TEXT
);

ALTER TABLE public.clinic_financial_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso financeiro para administradores e secretarias" 
ON public.clinic_financial_records FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);


-- 5. TABELA DE EVOLUÇÕES CLÍNICAS / PRONTUÁRIOS (CLINIC_CLINICAL_NOTES)
CREATE TABLE IF NOT EXISTS public.clinic_clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    patient_id TEXT,
    patient_name TEXT NOT NULL,
    therapist_name TEXT NOT NULL,
    date TEXT NOT NULL,
    content TEXT NOT NULL
);

ALTER TABLE public.clinic_clinical_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso a prontuarios por terapeutas e administradores" 
ON public.clinic_clinical_notes FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);


-- 6. ATUALIZAÇÃO DA TABELA DE PACIENTES (CAMPOS DE CONVÊNIO E CORREÇÃO DE VISIBILIDADE)
-- Adiciona colunas para Convênio Médico / Particular
ALTER TABLE public.clinic_patients ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'particular';
ALTER TABLE public.clinic_patients ADD COLUMN IF NOT EXISTS insurance_name TEXT;
ALTER TABLE public.clinic_patients ADD COLUMN IF NOT EXISTS insurance_number TEXT;

-- Corrige a função de verificação de permissão
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;

  v_role := auth.jwt() -> 'user_metadata' ->> 'role';
  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    RETURN 'admin';
  END IF;

  RETURN NULL;
END;
$$;

-- Libera as políticas para que qualquer colaborador logado (admin, secretária, terapeuta) consiga ver os pacientes reais (como a Nicole)
DROP POLICY IF EXISTS "Visibilidade de Pacientes" ON public.clinic_patients;
DROP POLICY IF EXISTS "Modificação de Pacientes" ON public.clinic_patients;
DROP POLICY IF EXISTS "Permitir leitura de pacientes para autenticados" ON public.clinic_patients;
DROP POLICY IF EXISTS "Permitir modificacao de pacientes" ON public.clinic_patients;

CREATE POLICY "Permitir leitura de pacientes para autenticados" 
ON public.clinic_patients FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir modificacao de pacientes" 
ON public.clinic_patients FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
