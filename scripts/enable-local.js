const fs = require('fs');
const path = require('path');

console.log('🔧 Enabling local bot...');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Restore original scripts
packageJson.scripts = {
  "build": "tsc",
  "start": "node dist/index.js",
  "dev": "ts-node src/index.ts",
  "watch": "tsc -w",
  "register-commands": "ts-node src/register-commands.ts",
  "pm2:start": "pm2 start ecosystem.config.js",
  "pm2:stop": "pm2 stop spark-bot",
  "pm2:restart": "pm2 restart spark-bot",
  "pm2:logs": "pm2 logs spark-bot",
  "pm2:status": "pm2 status",
  "enable-local": "node scripts/enable-local.js",
  "disable-local": "node scripts/disable-local.js"
};

// Write back to package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

console.log('✅ Local bot enabled! You can now run:');
console.log('   npm start');
console.log('   npm run dev');
console.log('   npm run pm2:start');
console.log('');
console.log('⚠️  Remember to disable it again with: npm run disable-local');
