import re

with open('src/components/dashboard/GestaoAgenda.tsx', 'r') as f:
    content = f.read()

# 1. State Variables Replacement
states_regex = r"// Formulário de Novo Agendamento\s+const \[formPatient, setFormPatient\] = useState\(''\);.*?const \[additionalSlots, setAdditionalSlots\] = useState<RecurringSlot\[\]>\(\[\]\);"

new_states = """// Formulário de Planejamento Mensal
  const [formPatient, setFormPatient] = useState('');
  const [referenceMonth, setReferenceMonth] = useState(formatYMD(today).slice(0, 7)); // "YYYY-MM"
  const [weeklyTherapies, setWeeklyTherapies] = useState([{ id: crypto.randomUUID(), dayOfWeek: 1, time: '09:00', therapist: '', room: 'Sala 01 - Principal' }]);
  const [replicateNextMonth, setReplicateNextMonth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(formatYMD(today)); // Apenas para edição"""

content = re.sub(states_regex, new_states, content, flags=re.DOTALL)

# 2. handleEditAppointment / handleDuplicateAppointment Replacement
handlers_regex = r"const handleEditAppointment = \(apt: ClinicAppointment\) => \{.*?setIsModalOpen\(true\);\n  \};"

new_handlers = """const handleEditAppointment = (apt: ClinicAppointment) => {
    setEditingAppointmentId(apt.id);
    setFormPatient(apt.patient_name);
    setFormDate(apt.date);
    const d = new Date(apt.date + 'T12:00:00');
    setWeeklyTherapies([{
      id: crypto.randomUUID(),
      dayOfWeek: d.getDay(),
      time: apt.time,
      therapist: apt.therapist_name,
      room: apt.room
    }]);
    setIsModalOpen(true);
  };

  const handleDuplicateAppointment = (apt: ClinicAppointment) => {
    setEditingAppointmentId(null);
    setFormPatient(apt.patient_name);
    setReferenceMonth(formatYMD(today).slice(0, 7));
    const d = new Date(apt.date + 'T12:00:00');
    setWeeklyTherapies([{
      id: crypto.randomUUID(),
      dayOfWeek: d.getDay(),
      time: apt.time,
      therapist: apt.therapist_name,
      room: apt.room
    }]);
    setReplicateNextMonth(false);
    setIsModalOpen(true);
  };"""

content = re.sub(handlers_regex, new_handlers, content, flags=re.DOTALL)

# 3. handleSaveAppointment Replacement
save_regex = r"// Salvar Novo Agendamento.*?finally \{\n      setIsSubmitting\(false\);\n    \}\n  \};"

new_save = """// Salvar Novo Agendamento (Planejamento Mensal)
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatient) {
      alert('Por favor, selecione o paciente.');
      return;
    }

    const invalidTherapy = weeklyTherapies.find(t => !t.therapist || !t.time);
    if (invalidTherapy) {
      alert('Preencha horário e terapeuta para todas as terapias na grade.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedPatientObj = patientsList.find(p => p.name === formPatient);

      if (editingAppointmentId) {
        // Modo Edição de 1 sessão
        const t = weeklyTherapies[0];
        const selectedTherapistObj = therapistsList.find(th => th.name === t.therapist);
        const baseAppointmentData = {
          date: formDate,
          time: t.time,
          duration_minutes: 50,
          patient_id: selectedPatientObj?.id,
          patient_name: formPatient,
          patient_avatar: selectedPatientObj?.avatar_url,
          therapist_id: selectedTherapistObj?.id,
          therapist_name: t.therapist,
          therapist_avatar: selectedTherapistObj?.avatar_url,
          room: t.room,
        };
        await updateAppointment(editingAppointmentId, baseAppointmentData);
        setAppointments(prev => prev.map(a => 
          a.id === editingAppointmentId ? { ...a, ...baseAppointmentData } : a
        ));
        alert('Agendamento atualizado com sucesso!');
      } else {
        // Modo Criação Mensal
        const groupId = crypto.randomUUID();
        const occurrences = [];
        
        const [year, month] = referenceMonth.split('-').map(Number);
        const monthsToGenerate = replicateNextMonth ? [month, month === 12 ? 1 : month + 1] : [month];
        const yearsToGenerate = replicateNextMonth ? [year, month === 12 ? year + 1 : year] : [year];

        monthsToGenerate.forEach((m, idx) => {
          const y = yearsToGenerate[idx];
          const daysInMonth = new Date(y, m, 0).getDate();
          
          for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(y, m - 1, day, 12, 0, 0);
            const dayOfWeek = dateObj.getDay();
            
            const matchedTherapies = weeklyTherapies.filter(t => t.dayOfWeek === dayOfWeek);
            
            matchedTherapies.forEach(t => {
              const selectedTherapistObj = therapistsList.find(th => th.name === t.therapist);
              occurrences.push({
                date: dateObj.toISOString().split('T')[0],
                time: t.time,
                duration_minutes: 50,
                patient_id: selectedPatientObj?.id,
                patient_name: formPatient,
                patient_avatar: selectedPatientObj?.avatar_url,
                therapist_id: selectedTherapistObj?.id,
                therapist_name: t.therapist,
                therapist_avatar: selectedTherapistObj?.avatar_url,
                room: t.room,
                status: 'confirmed',
                payment_status: 'pending',
                recurrence_type: 'weekly',
                recurrence_group_id: groupId,
              });
            });
          }
        });

        if (occurrences.length === 0) {
          alert('Nenhum dia correspondente encontrado no mês selecionado.');
          setIsSubmitting(false);
          return;
        }

        const createdBatch = await createBatchAppointments(occurrences);
        setAppointments(prev => [...createdBatch, ...prev]);
        alert(`Planejamento mensal gerado com sucesso! ${createdBatch.length} sessões agendadas.`);
      }

      setIsModalOpen(false);
      setFormPatient('');
      setWeeklyTherapies([{ id: crypto.randomUUID(), dayOfWeek: 1, time: '09:00', therapist: '', room: 'Sala 01 - Principal' }]);
      setEditingAppointmentId(null);
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao salvar o planejamento.');
    } finally {
      setIsSubmitting(false);
    }
  };"""

content = re.sub(save_regex, new_save, content, flags=re.DOTALL)

with open('src/components/dashboard/GestaoAgenda.tsx', 'w') as f:
    f.write(content)
