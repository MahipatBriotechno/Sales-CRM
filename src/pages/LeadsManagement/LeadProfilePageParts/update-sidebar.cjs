const fs = require('fs');
const path = require('path');

const sidebarPath = path.join(__dirname, 'LeadSidebar.jsx');
let content = fs.readFileSync(sidebarPath, 'utf8');

// 1. Comment out the ActionGuard edit buttons in the section headers
content = content.replace(/!\s*editingSection\s*&&\s*!\s*editingField\s*&&\s*\(\s*<ActionGuard[\s\S]*?<\/ActionGuard>\s*\)/g, 
  'null /* $& */');

// 2. Make the sidebar sticky
content = content.replace(
  'className="w-[320px] bg-white border-r border-gray-100 flex-shrink-0 flex flex-col relative z-10"',
  'className="w-[320px] bg-white border-r border-gray-100 flex-shrink-0 flex flex-col relative z-10 sticky top-0 h-[calc(100vh-64px)] overflow-y-auto no-scrollbar"'
);

fs.writeFileSync(sidebarPath, content, 'utf8');
console.log('Modified LeadSidebar.jsx to comment out edit buttons and make it sticky.');
