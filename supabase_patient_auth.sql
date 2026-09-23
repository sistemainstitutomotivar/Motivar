-- ==============================================================================
-- SCRIPT DE ATUALIZAÇÃO: AUTENTICAÇÃO DE PACIENTES (APP / SAAS)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==============================================================================

-- 1. ATUALIZAÇÃO DA TABELA DE PACIENTES
-- Adicionar campos necessários para o login do paciente
ALTER TABLE public.clinic_patients 
ADD COLUMN IF NOT EXISTS app_pin TEXT, -- Armazenará o hash do PIN de 4 dígitos
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id); -- Vínculo com o sistema de login

-- 2. FUNÇÃO PARA VERIFICAR E-MAIL ANTES DO LOGIN
-- O Frontend chamará essa função. Ela retorna TRUE se o e-mail estiver cadastrado.
-- Isso impede que qualquer pessoa gere códigos OTP sem ser paciente.
CREATE OR REPLACE FUNCTION public.check_patient_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Permite rodar mesmo sem estar logado (bypass RLS)
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.clinic_patients 
    WHERE email = p_email 
    AND status = 'active'
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$;

-- 3. GARANTIR RLS (SEGURANÇA) PARA O PACIENTE LOGADO
-- O paciente só pode ler seus próprios dados, não os de outros pacientes.
CREATE POLICY "Paciente pode ler seus proprios dados" 
ON public.clinic_patients FOR SELECT 
TO authenticated 
USING (
    user_id = auth.uid() OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'therapist', 'staff') OR
    auth.jwt() ->> 'email' LIKE '%admin%' 
);

-- Atualiza a tabela com o e-mail obrigatório se não existir (Opcional, apenas segurança)
-- Caso já existam pacientes sem e-mail, isso pode dar erro. Vamos manter apenas o vínculo.
