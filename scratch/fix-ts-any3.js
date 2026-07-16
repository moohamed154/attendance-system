const fs = require('fs');
const path = require('path');

function replaceRegexInFile(filePath, regex, replacement) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf-8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(fullPath, content);
  console.log('Fixed', filePath);
}

const filterFiles = [
  'app/dashboard/payments/payments-filters.tsx',
  'app/dashboard/sessions/sessions-filters.tsx',
  'app/dashboard/students/students-filters.tsx',
  'app/dashboard/users/users-filters.tsx'
];

for (const file of filterFiles) {
  replaceRegexInFile(file, /const updateFilters = useCallback\(\((.*?)\) => \{/g, (match, args) => {
    const newArgs = args.split(',').map(a => {
      const name = a.split(':')[0].trim();
      return `${name}: any`;
    }).join(', ');
    return `const updateFilters = useCallback((${newArgs}) => {`;
  });
}

replaceRegexInFile('actions/payments.ts', /status: \(status as any\) \|\| undefined,/g, 'status: status ? (status as any) : undefined,');

