const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf-8');
  for (const { from, to } of replacements) {
    content = content.replace(from, to);
  }
  fs.writeFileSync(fullPath, content);
  console.log('Fixed', filePath);
}

replaceInFile('app/dashboard/attendance/attendance-filters.tsx', [
  { from: '}: Dictionary) {', to: '}: any) {' }
]);

replaceInFile('app/dashboard/payments/payments-filters.tsx', [
  { from: "updateFilters(newStatus, month)", to: "updateFilters(newStatus || '', month || '')" },
  { from: "updateFilters(status, newMonth)", to: "updateFilters(status || '', newMonth || '')" }
]);

replaceInFile('app/dashboard/sessions/sessions-filters.tsx', [
  { from: "updateFilters(newGrade, day)", to: "updateFilters(newGrade || '', day || '')" },
  { from: "updateFilters(grade, newDay)", to: "updateFilters(grade || '', newDay || '')" },
  { from: "dict.grades[`grade${grade}`]", to: "(dict.grades as any)[`grade${grade}`]" }
]);

replaceInFile('app/dashboard/students/students-filters.tsx', [
  { from: "updateFilters(newGrade)", to: "updateFilters(newGrade || '')" },
  { from: "dict.grades[`grade${grade}`]", to: "(dict.grades as any)[`grade${grade}`]" },
  { from: "dict.grades[student.grade]", to: "(dict.grades as any)[student.grade]" },
  { from: "dict.grades[`grade${student.grade}`]", to: "(dict.grades as any)[`grade${student.grade}`]" }
]);

replaceInFile('app/dashboard/users/users-filters.tsx', [
  { from: "updateFilters(newRole)", to: "updateFilters(newRole || '')" }
]);

// Fix string | undefined issues in pages
const pagesToFix = [
  'app/dashboard/activity/page.tsx',
  'app/dashboard/payments/page.tsx',
  'app/dashboard/sessions/page.tsx',
  'app/dashboard/students/page.tsx',
  'app/dashboard/users/page.tsx'
];

for (const p of pagesToFix) {
  replaceInFile(p, [
    { from: "q: params.q,", to: "q: params.q || ''," },
    { from: "role: params.role,", to: "role: params.role || ''," },
    { from: "month: params.month,", to: "month: params.month || ''," },
    { from: "status: params.status,", to: "status: params.status || ''," },
    { from: "grade: params.grade,", to: "grade: params.grade || ''," },
    { from: "day: params.day,", to: "day: params.day || ''," },
    { from: "q={params.q}", to: "q={params.q || ''}" },
    { from: "grade={params.grade}", to: "grade={params.grade || ''}" },
    { from: "day={params.day}", to: "day={params.day || ''}" },
    { from: "month={params.month}", to: "month={params.month || ''}" },
    { from: "status={params.status}", to: "status={params.status || ''}" },
    { from: "role={params.role}", to: "role={params.role || ''}" },
  ]);
}
