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

replaceRegexInFile('actions/auth.ts', /\} catch \{[\s\S]{0,100}error/g, '} catch (error) {\n    logger.error');

replaceRegexInFile('actions/payments.ts', /status: status \|\| undefined,/g, 'status: (status as any) || undefined,');

const pagesToFix = [
  'app/dashboard/activity/page.tsx',
  'app/dashboard/payments/page.tsx',
  'app/dashboard/sessions/page.tsx',
  'app/dashboard/students/page.tsx',
  'app/dashboard/users/page.tsx'
];

for (const p of pagesToFix) {
  replaceRegexInFile(p, /resolvedSearchParams\.([a-zA-Z]+)(?!\s*\|\|)/g, 'resolvedSearchParams.$1 || \'\'');
}

const filtersFiles = [
  'app/dashboard/payments/payments-filters.tsx',
  'app/dashboard/sessions/sessions-filters.tsx',
  'app/dashboard/students/students-filters.tsx',
  'app/dashboard/users/users-filters.tsx'
];

for (const f of filtersFiles) {
  replaceRegexInFile(f, /searchParams\.get\('([a-zA-Z]+)'\)(?!\s*\|\|)/g, 'searchParams.get(\'$1\') || \'\'');
}

// Special fixes for the dict.grades index errors
replaceRegexInFile('app/dashboard/sessions/sessions-filters.tsx', /dict\.grades\[`grade\$\{grade\}`\]/g, '(dict.grades as any)[`grade${grade}`]');

replaceRegexInFile('app/dashboard/students/students-filters.tsx', /dict\.grades\[`grade\$\{grade\}`\]/g, '(dict.grades as any)[`grade${grade}`]');
replaceRegexInFile('app/dashboard/students/students-filters.tsx', /dict\.grades\[student\.grade\]/g, '(dict.grades as any)[student.grade]');
replaceRegexInFile('app/dashboard/students/students-filters.tsx', /dict\.grades\[`grade\$\{student\.grade\}`\]/g, '(dict.grades as any)[`grade${student.grade}`]');
