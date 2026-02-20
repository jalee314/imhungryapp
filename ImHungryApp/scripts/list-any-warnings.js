const fs = require('fs');
const r = JSON.parse(fs.readFileSync('./lint-report.json', 'utf-8'));
const out = [];
let total = 0;
r.forEach(f => {
    const msgs = f.messages.filter(m => m.ruleId === '@typescript-eslint/no-explicit-any');
    if (msgs.length === 0) return;
    const s = f.filePath.replace('/Users/jason.leee/imhungryapp/ImHungryApp/', '');
    if (!s.startsWith('src/services/') && !s.startsWith('src/types/')) return;
    out.push(s + ' (' + msgs.length + '):');
    msgs.forEach(m => {
        out.push('  L' + m.line);
    });
    total += msgs.length;
});
console.log('Total no-explicit-any in services+types: ' + total + '\n');
console.log(out.join('\n'));
