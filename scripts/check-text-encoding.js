const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'src');
const badTextPattern = /Ã|Â|�/;
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json']);
const ignoredDirs = new Set(['node_modules', '.expo', 'dist', 'build']);
const offenders = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!extensions.has(path.extname(entry.name))) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    if (badTextPattern.test(content)) {
      offenders.push(path.relative(path.resolve(__dirname, '..'), fullPath));
    }
  }
}

walk(root);

if (offenders.length) {
  console.error('Textos com codificação quebrada encontrados:');
  offenders.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

console.log('Textos verificados: nenhum caractere quebrado encontrado.');
