const fs = require('fs');
const path = require('path');

function replaceRounded(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/rounded-(sm|md|lg|xl|2xl|3xl)/g, 'rounded-none');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Replaced rounded classes in ${filePath}`);
}

replaceRounded(path.join(__dirname, 'LeadProfile.jsx'));
replaceRounded(path.join(__dirname, 'LeadSidebar.jsx'));
replaceRounded(path.join(__dirname, 'LeadTable.jsx'));
