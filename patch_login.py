import re

with open('src/components/landing/IntranetLogin.tsx', 'r') as f:
    text = f.read()

# 1. Import formatCPF
text = text.replace("import { Lock, User, ArrowLeft, HeartPulse } from 'lucide-react';", "import { Lock, User, ArrowLeft, HeartPulse } from 'lucide-react';\nimport { formatCPF } from '../../lib/utils';")

# 2. Replace formatCpf definition and usages
text = re.sub(r"const formatCpf = \(value: string\) => \{[\s\S]*?\};\n", "", text)
text = text.replace("formatCpf(", "formatCPF(")

with open('src/components/landing/IntranetLogin.tsx', 'w') as f:
    f.write(text)
