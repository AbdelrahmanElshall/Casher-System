import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace finance
content = re.sub(
    r'(<button\s+id="nav-finance"[\s\S]*?</button>)',
    r'{rbac.canSeeFinance && (\1)}',
    content
)

# Replace customers
content = re.sub(
    r'(<button\s+id="nav-customers"[\s\S]*?</button>)',
    r'{rbac.canSeeCustomers && (\1)}',
    content
)

# Replace audit
content = re.sub(
    r'(<button\s+id="nav-audit"[\s\S]*?</button>)',
    r'{rbac.canSeeAudit && (\1)}',
    content
)

# Replace settings
content = re.sub(
    r'(<button\s+id="nav-settings"[\s\S]*?</button>)',
    r'{rbac.canSeeSettings && (\1)}',
    content
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
