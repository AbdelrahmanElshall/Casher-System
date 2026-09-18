import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Fix finance: `{rbac.canSeeFinance && ({rbac.canSeeFinance && (<button`
content = content.replace('{rbac.canSeeFinance && ({rbac.canSeeFinance && (<button', '{rbac.canSeeFinance && (<button')

with open('src/App.tsx', 'w') as f:
    f.write(content)
