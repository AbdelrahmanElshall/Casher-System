import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace('{rbac.canSeeFinance && ({rbac.canSeeFinance && (<button', '{rbac.canSeeFinance && (<button')
content = content.replace('</button>)}', '</button>)}') # Wait this is fine.

with open('src/App.tsx', 'w') as f:
    f.write(content)
