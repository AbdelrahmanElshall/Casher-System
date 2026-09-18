import re

with open('src/types.ts', 'r') as f:
    content = f.read()

# Add status to Product
content = content.replace('  unit: string;', "  unit: string;\n  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';")

# Add status to Customer
content = content.replace('  isActive: boolean;\n}', "  isActive: boolean;\n  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';\n}")

with open('src/types.ts', 'w') as f:
    f.write(content)
