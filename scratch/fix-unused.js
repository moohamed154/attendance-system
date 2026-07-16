const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'actions/subscriptions.ts',
    replacements: [
      { from: 'const bulkError = await tx.errorLog.create', to: 'await tx.errorLog.create' }
    ]
  },
  {
    file: 'app/dashboard/attendance/[sessionId]/page.tsx',
    replacements: [
      { from: 'import { Button } from "@/components/ui/button";', to: '' }
    ]
  },
  {
    file: 'app/dashboard/attendance/history/[sessionId]/[date]/page.tsx',
    replacements: [
      { from: 'import { Button } from "@/components/ui/button";', to: '' }
    ]
  },
  {
    file: 'app/dashboard/attendance/history/page.tsx',
    replacements: [
      { from: 'import { Button } from "@/components/ui/button";', to: '' }
    ]
  },
  {
    file: 'app/dashboard/page.tsx',
    replacements: [
      { from: 'CardDescription, ', to: '' },
      { from: 'Users, ', to: '' },
      { from: 'CheckCircle2, ', to: '' },
      { from: 'const adminStats', to: '// const adminStats' }
    ]
  },
  {
    file: 'app/dashboard/payments/edit-payment-button.tsx',
    replacements: [
      { from: 'const MONTHS =', to: '// const MONTHS =' },
      { from: 'const [year, setYear] =', to: 'const [year] =' }
    ]
  },
  {
    file: 'app/dashboard/payments/page.tsx',
    replacements: [
      { from: 'FileText, ', to: '' }
    ]
  },
  {
    file: 'app/dashboard/payments/record-transaction-button.tsx',
    replacements: [
      { from: 'import { Badge } from "@/components/ui/badge";', to: '' }
    ]
  },
  {
    file: 'app/dashboard/sessions/add-session-button.tsx',
    replacements: [
      { from: 'import { Input } from "@/components/ui/input";', to: '' }
    ]
  },
  {
    file: 'app/dashboard/sessions/page.tsx',
    replacements: [
      { from: 'CardContent, ', to: '' }
    ]
  },
  {
    file: 'app/dashboard/students/[id]/page.tsx',
    replacements: [
      { from: "import { RecordPaymentButton } from './record-payment-button';", to: '' },
      { from: '"YYYY-MM"', to: '&quot;YYYY-MM&quot;' }
    ]
  },
  {
    file: 'app/dashboard/students/[id]/quick-attendance-button.tsx',
    replacements: [
      { from: 'Loader2, ', to: '' }
    ]
  }
];

fixes.forEach(({ file, replacements }) => {
  const fullPath = path.join('E:/attendance-system', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    replacements.forEach(({ from, to }) => {
      content = content.replace(from, to);
    });
    fs.writeFileSync(fullPath, content);
    console.log('Fixed', file);
  } else {
    console.log('Not found:', file);
  }
});
