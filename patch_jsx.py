import re

with open('src/components/dashboard/GestaoAgenda.tsx', 'r') as f:
    content = f.read()

jsx_regex = r"\{\/\* NOVO AGENDAMENTO MODAL \(DINÂMICO E AUDITADO\) \*\/\}.*?\{\/\* MODAL DE CANCELAMENTO \*\/\}"

new_jsx = """{/* NOVO AGENDAMENTO MODAL (PLANEJAMENTO MENSAL) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-3xl p-6 w-full max-w-[600px] shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full z-10"
            >
              <X size={20} />
            </button>
            
            <h3 className="font-display-sm text-xl sm:text-2xl font-bold text-slate-800 mb-6 pr-8">
              {editingAppointmentId ? 'Editar Agendamento' : 'Novo Planejamento Mensal'}
            </h3>
            
            <form className="space-y-6" onSubmit={handleSaveAppointment}>
              {/* Informações Gerais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Paciente *</label>
                  <select 
                    required
                    value={formPatient}
                    onChange={(e) => setFormPatient(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="">Selecione o paciente cadastrado...</option>
                    {patientsList.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                {!editingAppointmentId && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Mês/Ano de Referência *</label>
                    <input 
                      type="month" 
                      required
                      value={referenceMonth}
                      onChange={(e) => setReferenceMonth(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-slate-600" 
                    />
                  </div>
                )}
                {editingAppointmentId && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Data da Sessão *</label>
                    <input 
                      type="date" 
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-slate-600" 
                    />
                  </div>
                )}
              </div>

              <hr className="border-slate-100" />

              {/* Grade Semanal */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Grade Semanal do Paciente</h3>
                  {!editingAppointmentId && (
                    <p className="text-xs text-slate-500">Defina os dias fixos na semana</p>
                  )}
                </div>

                {weeklyTherapies.map((therapy, index) => (
                  <div key={therapy.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 relative">
                    {!editingAppointmentId && weeklyTherapies.length > 1 && (
                      <div 
                        className="absolute top-4 right-4 text-red-500 cursor-pointer hover:bg-red-500/10 p-1 rounded"
                        onClick={() => setWeeklyTherapies(prev => prev.filter(t => t.id !== therapy.id))}
                        title="Remover Terapia"
                      >
                        <Trash2 size={16} />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                      {!editingAppointmentId && (
                        <div>
                          <label className="block text-xs font-bold mb-1 text-slate-500">Dia da Semana *</label>
                          <select 
                            value={therapy.dayOfWeek}
                            onChange={(e) => setWeeklyTherapies(prev => prev.map(t => t.id === therapy.id ? { ...t, dayOfWeek: Number(e.target.value) } : t))}
                            className="w-full border border-slate-200 rounded-md p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-primary"
                          >
                            {DAYS_OF_WEEK.map(d => (
                              <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold mb-1 text-slate-500">Horário *</label>
                        <input 
                          type="time" 
                          required
                          value={therapy.time}
                          onChange={(e) => setWeeklyTherapies(prev => prev.map(t => t.id === therapy.id ? { ...t, time: e.target.value } : t))}
                          className="w-full border border-slate-200 rounded-md p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-slate-500">Terapeuta *</label>
                        <select 
                          required
                          value={therapy.therapist}
                          onChange={(e) => setWeeklyTherapies(prev => prev.map(t => t.id === therapy.id ? { ...t, therapist: e.target.value } : t))}
                          className="w-full border border-slate-200 rounded-md p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Selecione...</option>
                          {therapistsList.map(t => (
                            <option key={t.id} value={t.name}>
                              {t.name} {t.specialty ? `(${t.specialty})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-slate-500">Local (Sala)</label>
                        <select 
                          value={therapy.room}
                          onChange={(e) => setWeeklyTherapies(prev => prev.map(t => t.id === therapy.id ? { ...t, room: e.target.value } : t))}
                          className="w-full border border-slate-200 rounded-md p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option>Sala 01 - Principal</option>
                          <option>Sala 02 - Integração Sensorial</option>
                          <option>Sala 03</option>
                          <option>Sala 04</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                {!editingAppointmentId && (
                  <button 
                    type="button"
                    onClick={() => setWeeklyTherapies(prev => [...prev, { id: crypto.randomUUID(), dayOfWeek: 1, time: '10:00', therapist: '', room: 'Sala 01 - Principal' }])}
                    className="w-full py-3 border-2 border-dashed border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Adicionar Nova Terapia na Semana
                  </button>
                )}
              </div>

              {!editingAppointmentId && (
                <>
                  <hr className="border-slate-100" />
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={replicateNextMonth}
                        onChange={(e) => setReplicateNextMonth(e.target.checked)}
                        className="mt-1 w-4 h-4 accent-primary text-white rounded border-gray-300"
                      />
                      <div>
                        <span className="block font-bold text-slate-800">Replicar automaticamente para o mês seguinte</span>
                        <span className="block text-sm text-slate-500 mt-0.5">As terapias dessa grade serão copiadas para os mesmos dias da semana no mês subsequente.</span>
                      </div>
                    </label>
                  </div>
                </>
              )}

              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-full sm:w-auto px-6 py-3 sm:py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 sm:py-2.5 font-bold bg-primary text-white hover:bg-primary/90 rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : (editingAppointmentId ? 'Salvar Alteração' : 'Salvar Planejamento Mensal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CANCELAMENTO */}"""

content = re.sub(jsx_regex, new_jsx, content, flags=re.DOTALL)

with open('src/components/dashboard/GestaoAgenda.tsx', 'w') as f:
    f.write(content)
