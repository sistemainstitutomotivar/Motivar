# Spec Funcional — SaaS para Institutos de Desenvolvimento Neurológico
### (Neuropsicopedagogia, Fonoaudiologia, TO, Psicologia, Musicoterapia, Psicomotricidade, ABA etc.)

> Documento de referência para arquitetura de produto. Pensado para stack multi-tenant (React + Supabase + n8n), no mesmo padrão que você já usa no LouvorWeb.

---

## 1. Contexto do Nicho (por que não é "agenda genérica")

Uma clínica de neurodesenvolvimento tem características que um sistema de agendamento comum não resolve:

- **Paciente é atendido por vários profissionais diferentes**, muitas vezes na mesma semana (fono + TO + psicopedagogia), exigindo visão de "time terapêutico" em torno de uma criança.
- **Responsável legal ≠ paciente** (quase sempre criança/adolescente) — todo cadastro, comunicação e faturamento passa por um responsável.
- **Prontuário clínico é multiprofissional e sensível** (dado de saúde = LGPD categoria especial, art. 11).
- **Planos terapêuticos têm duração/pacote definido** (ex: "20 sessões de fono", "pacote trimestral"), diferente de agendamento avulso.
- **Convênios/reembolso** (guias TISS, recibos para plano de saúde) são recorrentes.
- **Evasão e frequência** são KPIs críticos (criança falta = terapia perde efeito, clínica perde receita).

---

## 2. Módulo — Cadastro de Pacientes

- Dados do paciente: nome, nascimento, foto, diagnóstico(s)/CID (opcional), escola, série.
- **Responsáveis legais** (1 ou mais): nome, CPF, parentesco, telefone/WhatsApp, e-mail, quem recebe cobrança, quem recebe comunicação.
- Anamnese inicial (formulário customizável por especialidade).
- Histórico de diagnósticos e laudos anexados (upload de PDF/imagem).
- Convênio/plano de saúde vinculado (nome, número da carteirinha, validade).
- Time terapêutico do paciente (quais profissionais/especialidades atendem esse paciente).
- Status: ativo, em avaliação, pausado, alta, desistência (com motivo — importante para métricas de evasão).
- Linha do tempo unificada: consolida evoluções de **todas** as especialidades num só lugar (visão do coordenador clínico).

## 3. Módulo — Cadastro de Profissionais

- Dados pessoais + registro de conselho (CRP, CREFONO, CREFITO, OMB para musicoterapia, etc.) com validade e alerta de vencimento.
- Especialidade(s) — um profissional pode ter mais de uma.
- Carga horária / dias e horários de atendimento (grade-base de disponibilidade).
- Vínculo: CLT, PJ, autônomo, comissionado — importante para o módulo financeiro.
- Percentual de comissão ou valor fixo por sessão/tipo de terapia.
- Documentos (contrato, certificações, cursos).
- Agenda individual + bloqueios (férias, folga, evento).

## 4. Módulo — Cadastro de Terapias/Especialidades (catálogo de serviços)

- Nome da terapia (ex: "Fonoaudiologia — sessão individual", "Musicoterapia em grupo").
- Duração padrão (30/45/50/60 min), valor, se é individual ou em grupo (capacidade máxima).
- Sala/recurso necessário (ex: sala com espelho, instrumentos musicais, sala sensorial).
- Protocolo de avaliação padrão vinculado (formulário específico daquela especialidade).
- Vinculação a pacotes (ex: "Pacote Avaliação Neuropsicológica = 4 sessões + devolutiva").

## 5. Módulo — Agendamento (o coração do sistema)

- **Visão multiprofissional**: calendário por sala, por profissional, ou consolidado por paciente (para ver o dia inteiro de uma criança).
- Agendamento recorrente (ex: toda terça 14h, por 12 semanas) com geração automática de sessões.
- Detecção de conflito (sala ocupada, profissional indisponível).
- Lista de espera por especialidade/profissional — muito comum nesse nicho (fila para fono, por ex.).
- Reagendamento com regras de antecedência mínima.
- **Confirmação automática via WhatsApp** (você já tem essa expertise pronta do LouvorWeb/n8n — reaproveitável 1:1 aqui).
- Check-in/check-out de sessão (marcação de comparecimento, falta, falta justificada) — alimenta relatório de frequência e financeiro.
- Encaixe/urgência sinalizado visualmente.

## 6. Módulo — Prontuário Eletrônico (por especialidade)

Este é o diferencial "premium" real do produto:

- **Templates de evolução por especialidade** (o que a fono registra é diferente do que o TO registra) — formulários dinâmicos configuráveis.
- Registro de evolução por sessão: objetivos trabalhados, observações, nível de resposta do paciente.
- Escalas e testes padronizados anexáveis (protocolos de avaliação, resultados quantitativos ao longo do tempo — permite gráfico de evolução).
- Plano terapêutico com metas (curto/médio/longo prazo) e acompanhamento de progresso (%).
- Assinatura digital do profissional na evolução (integridade do prontuário).
- Controle de acesso: cada profissional só vê prontuário das especialidades que atende, mas coordenação clínica vê tudo (RBAC granular).
- Log de auditoria (quem acessou, quando alterou) — obrigatório para dado sensível de saúde.

## 7. Módulo — Documentos e Laudos

- Geração automática de: declaração de comparecimento, relatório de evolução, laudo/parecer, recibo para convênio.
- Templates com identidade visual da clínica (logo, timbre).
- Assinatura digital (ICP-Brasil ou assinatura eletrônica simples, dependendo do uso).
- Histórico de documentos emitidos por paciente.

## 8. Módulo — Financeiro

- Modelos de cobrança: avulso, pacote fechado (X sessões), mensalidade recorrente.
- Split de comissão automático por profissional (comissão % ou valor fixo).
- Emissão de cobrança (Pix, cartão, boleto) — integração de pagamento.
- Gestão de convênios: tabela de valores por convênio, geração de guia (TISS, se for atender convênios de verdade — isso é um diferencial forte de "premium").
- Inadimplência: régua de cobrança automática (WhatsApp/e-mail), bloqueio de agendamento por inadimplência (configurável).
- Relatório de faturamento por profissional, por especialidade, por convênio x particular.

## 9. Módulo — Portal da Família / App do Responsável

- Visualização da agenda dos filhos, confirmação/reagendamento self-service.
- Acesso a relatórios de evolução (com curadoria — o que o profissional libera para a família ver).
- Central de documentos (recibos, declarações) para download.
- Canal de comunicação com a clínica.
- Notificações de sessão, lembrete de pagamento.

## 10. Módulo — Portal/App do Profissional

- Agenda do dia/semana, prontuário rápido no celular (PWA), registro de evolução pós-sessão.
- Visão de comissões e sessões realizadas no mês.
- Chat interno com coordenação clínica.

## 11. Dashboard / BI para Coordenação Clínica

- Taxa de ocupação de agenda por profissional/sala.
- Taxa de evasão e faltas (geral e por especialidade).
- Faturamento x inadimplência.
- Pacientes por status (ativo, em avaliação, alta).
- Tempo médio de fila de espera por especialidade.
- Evolução clínica agregada (quantos pacientes atingiram metas no período).

## 12. Compliance e Segurança (LGPD — crítico nesse nicho)

- Dado de saúde é **dado sensível** (LGPD art. 11) — exige base legal específica e consentimento explícito do responsável.
- Termo de consentimento digital no cadastro (uso de imagem, compartilhamento de dados com convênio, etc.).
- Criptografia em repouso para prontuário.
- Política de retenção e exclusão de dados.
- Log de auditoria de acesso a prontuário (quem, quando, o quê).
- Controle de acesso por papel (profissional, coordenação, financeiro, recepção) — cada um vê só o que precisa.

## 13. Multi-unidade / Multi-tenant

- Se o produto for SaaS (várias clínicas clientes), replicar o padrão que você já validou no LouvorWeb: `organization_id` em tudo, isolamento de dados por clínica, múltiplas unidades físicas por clínica (se for rede).

## 14. Integrações que agregam valor "premium"

- WhatsApp (confirmação, lembrete, régua de cobrança) — você já domina via Evolution API/n8n.
- Google Calendar / Outlook (sincronização da agenda do profissional).
- Pagamento (Pix automático, cartão recorrente).
- Telemedicina/teleterapia (chamada de vídeo embutida para sessões online — cada vez mais comum em fono e psicologia).
- Assinatura eletrônica de documentos.

## 15. Diferenciais que separam "bom" de "premium"

- **IA de apoio clínico**: sugestão de horário ótimo considerando padrão de faltas do paciente; resumo automático de evolução ao longo do trimestre para gerar laudo com um clique.
- **Visão de "jornada da criança"**: timeline visual cruzando todas as especialidades, tipo prontuário unificado bonito de ver (aqui seu approach de UI premium/glassmorphism realmente brilha, é um produto onde a experiência visual importa para pais ansiosos).
- **Gamificação leve para os pacientes** (crianças) — selos de presença, progresso visual de metas.
- **Relatório para escola**: muitos pais precisam levar relatório de evolução para a escola do filho — gerar isso automaticamente é um diferencial forte e pouco explorado no mercado.

---

## Observação sobre reaproveitamento do que você já construiu

Boa parte da infraestrutura do LouvorWeb é diretamente reaproveitável aqui:
- Multi-tenancy com Supabase (`organization_id`) — mesmo padrão.
- WhatsApp via Evolution API + n8n para confirmação/lembrete — praticamente copy-paste do fluxo "Lembrete Confirmações".
- Import de escalas em massa via planilha — o mesmo padrão de importação serve para carga inicial de pacientes/profissionais.

A diferença principal de complexidade está no **prontuário eletrônico multiprofissional** e no **compliance de dado sensível de saúde**, que exigem modelagem de permissões mais granular do que uma escala de louvor.
