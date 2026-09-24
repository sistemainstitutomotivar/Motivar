import re

with open('src/components/dashboard/GestaoCadastros.tsx', 'r') as f:
    content = f.read()

# 1. Fix mapPatientRecord
patient_map_regex = r"(id: d\.id,\n\s*name: d\.name,)"
patient_map_replace = r"\1\n    email: d.email,"
content = re.sub(patient_map_regex, patient_map_replace, content, count=1) # only first occurrence inside mapPatientRecord

# 2. Fix formatted professional
prof_map_regex = r"(role: 'professional',\n\s*specialty: d\.specialty,\n\s*contact: d\.contact,)"
prof_map_replace = r"\1\n            email: d.email,\n            council_number: d.council_number,"
content = re.sub(prof_map_regex, prof_map_replace, content)

# 3. Fix formatted staff
staff_map_regex = r"(role: 'collaborator',\n\s*position: d\.position,\n\s*email: d\.email,\n\s*contact: d\.contact,)"
staff_map_replace = r"\1\n            council_number: d.council_number,"
content = re.sub(staff_map_regex, staff_map_replace, content)

with open('src/components/dashboard/GestaoCadastros.tsx', 'w') as f:
    f.write(content)
