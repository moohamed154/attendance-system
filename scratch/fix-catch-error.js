const fs = require('fs');
const path = require('path');

const filesToFix = [
  'actions/subscriptions.ts',
  'actions/users.ts',
  'actions/attendance.ts',
];

for (const file of filesToFix) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // We need to replace `} catch {` with `} catch (error: any) {` 
  // Wait, if we use `any` ESLint will complain. 
  // If we use `error` we might get unused var if not used. 
  // But these are the files with TypeScript errors, so we know they ARE used!
  // Wait, subscriptions.ts has 11 `catch {` blocks, but only 4 use `error`.
  // So a regex is better: `} catch {\s*(?:console|logger)\.error\([^,]+,\s*error`
  
  content = content.replace(/} catch \{(\s*.*error.*)/g, '} catch (error) {$1');
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed', file);
}
