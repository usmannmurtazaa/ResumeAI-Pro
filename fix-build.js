const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'src/components/common/Navbar.jsx',
    from: /useNotification/g,
    to: 'useNotifications'
  },
  {
    file: 'src/layouts/AdminLayout.jsx',
    from: /useNotification/g,
    to: 'useNotifications'
  },
  {
    file: 'src/layouts/DashboardLayout.jsx',
    from: /useNotification/g,
    to: 'useNotifications'
  },
  {
    file: 'src/pages/Settings.jsx',
    from: /useNotification/g,
    to: 'useNotifications'
  }
];

fixes.forEach(({ file, from, to }) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(from, to);
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${file}`);
  }
});

console.log('🎉 All fixes applied!');