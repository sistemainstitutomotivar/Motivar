import re
import os

files_to_patch = [
    'src/components/dashboard/TherapistDashboard.tsx',
    'src/components/dashboard/GestaoFinanceiro.tsx',
    'src/components/dashboard/PatientAgenda.tsx'
]

for filepath in files_to_patch:
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()

    # Add import
    if "formatDateBR" not in content:
        content = re.sub(r"(import .*?;)", r"import { formatDateBR } from '../../lib/utils';\n\1", content, count=1)

    # Patch rendering instances
    # {apt.date} -> {formatDateBR(apt.date)}
    content = content.replace('{apt.date}', '{formatDateBR(apt.date)}')
    content = content.replace('{apt?.date}', '{formatDateBR(apt?.date || \'\')}')
    
    # GestaoFinanceiro: {r.date} -> {formatDateBR(r.date)}
    content = content.replace('{r.date}', '{formatDateBR(r.date)}')
    
    # PatientAgenda: {session.date} -> {formatDateBR(session.date)}
    content = content.replace('{session.date}', '{formatDateBR(session.date)}')
    
    # TherapistDashboard: {note.date} -> {formatDateBR(note.date)}
    content = content.replace('{note.date}', '{formatDateBR(note.date)}')

    with open(filepath, 'w') as f:
        f.write(content)

print("Dates patched.")
