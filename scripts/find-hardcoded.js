const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDirs = [
  path.join('E:', 'attendance-system', 'app'),
  path.join('E:', 'attendance-system', 'components')
];

let hardcodedCount = 0;
let excludeStrings = ['/dashboard', 'div', 'span', 'e.g.', 'p', 'M'];

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir, (filePath) => {
      if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, i) => {
        // Skip log statements, imports, and comments
        if (line.includes('console.log') || line.trim().startsWith('//') || line.trim().startsWith('import ') || line.trim().startsWith('export ')) return;
        
        // Find JSX text between > and <
        const matches = line.match(/>([^<{}]+)</g);
        if (matches) {
          matches.forEach(match => {
            let text = match.replace(/[><]/g, '').trim();
            if (/[a-zA-Z]/.test(text) && !excludeStrings.some(e => text.includes(e))) {
              if(text.length > 2) {
                console.log(\[\:\] \\);
                hardcodedCount++;
              }
            }
          });
        }
      });
    });
  }
});

console.log('Total potential hardcoded strings:', hardcodedCount);
