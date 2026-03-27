const fs = require('fs');

const path = 'd:/dda adata/dhakad-doctors/dda-clod/src/components/ui/AdminElectionManager.tsx';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split('\n');

// The missing tag is right after line 168 (index 167) which currently is `                                </div>`
// Insert a closing div at line 169 (index 168)
lines.splice(168, 0, '                             </div>');

content = lines.join('\n');
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed syntax error via exact line insertion successfully.');
