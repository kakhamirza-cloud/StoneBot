const fs = require('fs');
const path = require('path');

// Paths
const exportFile = path.join(__dirname, '..', 'spark-bot-data-export-2025-11-13T18-29-36.json');
const dataDir = path.join(__dirname, '..', 'data');
const usersFile = path.join(dataDir, 'users.json');
const stateFile = path.join(dataDir, 'state.json');
const configFile = path.join(dataDir, 'config.json');

try {
  console.log('📥 Starting data import...');
  
  // Read the export file
  console.log(`📂 Reading export file: ${exportFile}`);
  const exportData = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
  
  // Validate the export data
  if (!exportData.users || typeof exportData.users !== 'object') {
    throw new Error('Invalid export data: users data not found');
  }
  
  // Create backup of existing data
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.join(dataDir, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Backup existing files
  if (fs.existsSync(usersFile)) {
    fs.copyFileSync(usersFile, path.join(backupDir, `users-backup-${timestamp}.json`));
    console.log('💾 Backed up existing users.json');
  }
  
  if (fs.existsSync(stateFile)) {
    fs.copyFileSync(stateFile, path.join(backupDir, `state-backup-${timestamp}.json`));
    console.log('💾 Backed up existing state.json');
  }
  
  if (fs.existsSync(configFile)) {
    fs.copyFileSync(configFile, path.join(backupDir, `config-backup-${timestamp}.json`));
    console.log('💾 Backed up existing config.json');
  }
  
  // Import users data
  console.log(`📊 Importing ${Object.keys(exportData.users).length} users...`);
  fs.writeFileSync(usersFile, JSON.stringify(exportData.users, null, 2));
  console.log('✅ Users data imported successfully');
  
  // Import global state
  if (exportData.globalState) {
    console.log('📊 Importing global state...');
    fs.writeFileSync(stateFile, JSON.stringify(exportData.globalState, null, 2));
    console.log('✅ Global state imported successfully');
  } else {
    console.log('⚠️  No global state found in export file');
  }
  
  // Import config
  if (exportData.config) {
    console.log('📊 Importing config...');
    fs.writeFileSync(configFile, JSON.stringify(exportData.config, null, 2));
    console.log('✅ Config imported successfully');
  } else {
    console.log('⚠️  No config found in export file');
  }
  
  console.log('\n✅ Data import completed successfully!');
  console.log(`📊 Total users imported: ${Object.keys(exportData.users).length}`);
  
  if (exportData.globalState) {
    console.log(`📊 Global state: ${exportData.globalState.totalAirdropsDistributed || 0} airdrops distributed`);
  }
  
  if (exportData.config) {
    console.log(`📊 Config: lootBoxCost=${exportData.config.lootBoxCost}, invitePoints=${exportData.config.invitePoints}`);
  }
  
} catch (error) {
  console.error('❌ Error importing data:', error);
  process.exit(1);
}

