const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = dir + '/' + file;
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk('src');
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Regex to find img tags or components with avatar/profile semantics and change object-cover to object-cover object-top
  // This is a bit tricky. Let's just look for specific patterns from our search results.

  // 1. PostCard.tsx / StoryCarousel / Admin Feed
  content = content.replace(/className="w-full h-full object-cover" \/>/g, 'className="w-full h-full object-cover object-top" />');
  content = content.replace(/className="w-full h-full object-cover"\/>/g, 'className="w-full h-full object-cover object-top"/>');
  content = content.replace(/className="w-12 h-12 rounded-full object-cover border border-blue-100 shrink-0" \/>/g, 'className="w-12 h-12 rounded-full object-cover object-top border border-blue-100 shrink-0" />');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log('Updated', file);
  }
});

console.log('Total files changed:', changedFiles);
