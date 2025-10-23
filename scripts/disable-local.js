const fs = require('fs');
const path = require('path');

console.log('🛡️ Disabling local bot...');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Disable start scripts but allow Railway to run
packageJson.scripts = {
  "build": "tsc",
  "start": "node -e \"if(process.env.RAILWAY_ENVIRONMENT){require('./dist/index.js')}else{console.log('❌ LOCAL BOT DISABLED - Bot runs only on Railway. Use npm run enable-local to re-enable.');process.exit(1)}\"",
  "dev": "echo '❌ LOCAL BOT DISABLED - Bot runs only on Railway. Use npm run enable-local to re-enable.' && exit 1",
  "watch": "tsc -w",
  "register-commands": "ts-node src/register-commands.ts",
  "pm2:start": "echo '❌ LOCAL BOT DISABLED - Bot runs only on Railway. Use npm run enable-local to re-enable.' && exit 1",
  "pm2:stop": "pm2 stop spark-bot",
  "pm2:restart": "echo '❌ LOCAL BOT DISABLED - Bot runs only on Railway. Use npm run enable-local to re-enable.' && exit 1",
  "pm2:logs": "pm2 logs spark-bot",
  "pm2:status": "pm2 status",
  "enable-local": "node scripts/enable-local.js",
  "disable-local": "node scripts/disable-local.js"
};

// Write back to package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

console.log('✅ Local bot disabled! Bot will only run on Railway.');
console.log('');
console.log('🚀 Railway bot is still running at: https://railway.app');
console.log('📊 Check logs with: railway logs --service StoneBot');
console.log('');
console.log('💡 To re-enable local bot: npm run enable-local');
