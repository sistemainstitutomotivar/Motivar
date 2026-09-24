import os
import re

files_to_patch = [
    'src/components/dashboard/GestaoAgenda.tsx',
    'src/components/dashboard/PatientAgenda.tsx',
    'src/components/dashboard/GestaoCadastros.tsx',
    'src/components/dashboard/GestaoFinanceiro.tsx'
]

for filepath in files_to_patch:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if window.confirm exists
    if "window.confirm(" in content:
        # Re-add showConfirm to import if it's not there
        content = content.replace("import { showAlert }", "import { showAlert, showConfirm }")
        
        # We need to replace multiline window.confirm
        # We'll use a safer approach: match `window.confirm(` and find the matching `)`
        # But a regex with (?s) is easier
        content = re.sub(r"window\.confirm\((.*?)\)", r"await showConfirm('Atenção', \1)", content, flags=re.DOTALL)
        
        with open(filepath, 'w') as f:
            f.write(content)
