const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf-8');
  for (const { from, to } of replacements) {
    // If it's regex
    if (from instanceof RegExp) {
      content = content.replace(from, to);
    } else {
      content = content.split(from).join(to);
    }
  }
  fs.writeFileSync(fullPath, content);
  console.log('Fixed', filePath);
}

replaceInFile('actions/auth.ts', [
  { from: /} catch \{/g, to: '} catch (error) {' }
]);

replaceInFile('actions/payments.ts', [
  { from: "status: status || undefined,", to: "status: (status as any) || undefined," }
]);

const pageFiles = [
  'app/dashboard/activity/page.tsx',
  'app/dashboard/payments/page.tsx',
  'app/dashboard/sessions/page.tsx',
  'app/dashboard/students/page.tsx',
  'app/dashboard/users/page.tsx'
];

for (const p of pageFiles) {
  replaceInFile(p, [
    { from: "q: searchParams.q,", to: "q: searchParams.q || ''," },
    { from: "role: searchParams.role,", to: "role: searchParams.role || ''," },
    { from: "month: searchParams.month,", to: "month: searchParams.month || ''," },
    { from: "status: searchParams.status,", to: "status: searchParams.status || ''," },
    { from: "grade: searchParams.grade,", to: "grade: searchParams.grade || ''," },
    { from: "day: searchParams.day,", to: "day: searchParams.day || ''," },
    { from: "q={searchParams.q}", to: "q={searchParams.q || ''}" },
    { from: "grade={searchParams.grade}", to: "grade={searchParams.grade || ''}" },
    { from: "day={searchParams.day}", to: "day={searchParams.day || ''}" },
    { from: "month={searchParams.month}", to: "month={searchParams.month || ''}" },
    { from: "status={searchParams.status}", to: "status={searchParams.status || ''}" },
    { from: "role={searchParams.role}", to: "role={searchParams.role || ''}" },
    // Await params destructuring:
    { from: "q = searchParams.q", to: "q = searchParams.q || ''" },
    { from: "grade = searchParams.grade", to: "grade = searchParams.grade || ''" }
  ]);
}

const filtersFiles = [
  'app/dashboard/payments/payments-filters.tsx',
  'app/dashboard/sessions/sessions-filters.tsx',
  'app/dashboard/students/students-filters.tsx',
  'app/dashboard/users/users-filters.tsx'
];

for (const f of filtersFiles) {
  replaceInFile(f, [
    { from: "searchParams.get('status')", to: "searchParams.get('status') || ''" },
    { from: "searchParams.get('month')", to: "searchParams.get('month') || ''" },
    { from: "searchParams.get('grade')", to: "searchParams.get('grade') || ''" },
    { from: "searchParams.get('day')", to: "searchParams.get('day') || ''" },
    { from: "searchParams.get('role')", to: "searchParams.get('role') || ''" },
  ]);
}
