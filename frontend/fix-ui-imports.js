const fs = require('fs');
const path = require('path');
const ui = path.join('src', 'components', 'ui');
fs.readdirSync(ui).filter(f => f.endsWith('.tsx')).forEach(f => {
  const file = path.join(ui, f);
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/from ["']([^"']+)@\d+\.\d+(\.\d+)?["']/g, (_, pkg) => 'from "' + pkg + '"');
  fs.writeFileSync(file, c);
});
console.log('Done');
