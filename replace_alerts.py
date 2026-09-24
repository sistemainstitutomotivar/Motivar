import os
import re

files_to_patch = [
    'src/components/landing/IntranetLogin.tsx',
    'src/components/dashboard/GestaoAgenda.tsx',
    'src/components/dashboard/PatientAgenda.tsx',
    'src/components/dashboard/GestaoCadastros.tsx',
    'src/components/dashboard/TherapistDashboard.tsx',
    'src/components/dashboard/ConfiguracoesClinica.tsx',
    'src/components/dashboard/GestaoFinanceiro.tsx'
]

for filepath in files_to_patch:
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # 1. Add Import
    # Calculate depth to src/lib
    depth = filepath.count('/') - 1
    rel_path = '../' * depth + 'lib/customAlert'
    
    import_stmt = f"import {{ showAlert, showConfirm }} from '{rel_path}';\n"
    
    if "import { showAlert" not in content:
        # Find first import and prepend
        content = re.sub(r"(import .*?;)", import_stmt + r"\1", content, count=1)
        
    # 2. Replace confirm()
    # Note: confirm is synchronous natively. Our showConfirm is async.
    # Therefore, replacing `if (window.confirm(...))` requires `if (await showConfirm(...))`
    # And we must ensure the surrounding function is async. Fortunately, most save handlers are async.
    # If any is not async, this will cause a TS error, but let's check and fix if needed.
    
    content = re.sub(r"window\.confirm\((.*?)\)", r"await showConfirm('Atenção', \1)", content)
    
    # Replace single line `const confirmCancel = window.confirm`
    # It might be `if (!window.confirm(` or `const confirmCancel = await showConfirm(`
    
    # 3. Replace alert()
    # alert() -> showAlert('Aviso', ...)
    content = re.sub(r"(?<!show)alert\((.*?)\)", r"showAlert('Aviso', \1)", content)
    
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
