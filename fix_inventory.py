import re

with open('src/components/InventoryManager.tsx', 'r') as f:
    content = f.read()

# Import rbac
if "import { getRoleConfig" not in content:
    content = content.replace("import { PosStorageEngine", "import { getRoleConfig } from '../rbac';\nimport { PosStorageEngine")

# Define rbac inside component
if "const rbac = getRoleConfig(" not in content:
    content = content.replace("const t = TRANSLATIONS[lang];", "const t = TRANSLATIONS[lang];\n  const rbac = getRoleConfig(currentUser.roleId);")

# Hide first New Category button
content = re.sub(
    r'({\/\* New Category Button \*\/}[\s\S]*?<button[\s\S]*?{isArabic \? \'إضافة تصنيف جديد\' : \'New Category\'}<\/span>\n\s*<\/button>)',
    r'{rbac.canCreateCategory && (\n            \1\n          )}',
    content
)

# Hide second New Category button
content = re.sub(
    r'(<button[\s\S]*?{isArabic \? \'تصنيف جديد\' : \'New Category\'}<\/span>\n\s*<\/button>)',
    r'{rbac.canCreateCategory && (\n                \1\n              )}',
    content
)

with open('src/components/InventoryManager.tsx', 'w') as f:
    f.write(content)
