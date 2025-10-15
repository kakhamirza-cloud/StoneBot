import * as fs from 'fs';
import * as path from 'path';
import { UserData, UserWallet, GlobalState, BotConfig, AnnouncementData } from './types';

export class StorageManager {
  private dataDir: string;
  private usersFile: string;
  private stateFile: string;
  private configFile: string;
  private announcementsFile: string;

  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.stateFile = path.join(this.dataDir, 'state.json');
    this.configFile = path.join(this.dataDir, 'config.json');
    this.announcementsFile = path.join(this.dataDir, 'announcements.json');
    
    this.ensureDataDirectory();
    this.initializeFiles();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private initializeFiles(): void {
    // Initialize users.json
    if (!fs.existsSync(this.usersFile)) {
      fs.writeFileSync(this.usersFile, JSON.stringify({}, null, 2));
    }

    // Initialize state.json
    if (!fs.existsSync(this.stateFile)) {
      const initialState: GlobalState = {
        totalAirdropsGiven: 0,
        maxAirdrops: 20,
        globalAirdropLimit: 20,
        totalAirdropsDistributed: 0,
        lootBoxRewards: [
          {
            type: 'gtd_whitelist',
            name: 'GTD Whitelist',
            description: 'Guaranteed whitelist allocation',
            inventoryImage: 'https://i.imgur.com/ovoJNRN.jpeg',
            openingImage: 'https://i.imgur.com/ovoJNRN.jpeg',
            probability: 0.20
          },
          {
            type: 'fcfs_whitelist',
            name: 'FCFS Whitelist',
            description: 'First come first serve whitelist allocation',
            inventoryImage: 'https://i.imgur.com/5JrpGWR.jpeg',
            openingImage: 'https://i.imgur.com/5JrpGWR.jpeg',
            probability: 0.60
          },
          {
            type: 'airdrop',
            name: 'Airdrop Allocation',
            description: 'Token airdrop allocation',
            inventoryImage: 'https://i.imgur.com/w00So6j.jpeg',
            openingImage: 'https://i.imgur.com/XMpG5Lp.jpeg',
            probability: 0.03,
            maxQuantity: 20
          },
          {
            type: 'spark_tokens',
            name: '10 $Stone Tokens',
            description: '10 $Stone tokens',
            inventoryImage: 'https://i.imgur.com/2sDdiFi.jpeg',
            openingImage: 'https://i.imgur.com/2sDdiFi.jpeg',
            probability: 0.10,
            tokenAmount: 10
          },
          {
            type: 'spark_tokens',
            name: '20 $Stone Tokens',
            description: '20 $Stone tokens',
            inventoryImage: 'https://i.imgur.com/uC9vkfX.jpeg',
            openingImage: 'https://i.imgur.com/uC9vkfX.jpeg',
            probability: 0.07,
            tokenAmount: 20
          }
        ]
      };
      fs.writeFileSync(this.stateFile, JSON.stringify(initialState, null, 2));
    }

    // Initialize config.json
    if (!fs.existsSync(this.configFile)) {
      const config: BotConfig = {
        lootBoxCost: 50,
        invitePoints: 20
      };
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
    }

    // Initialize announcements.json
    if (!fs.existsSync(this.announcementsFile)) {
      fs.writeFileSync(this.announcementsFile, JSON.stringify({}, null, 2));
    }
  }

  // User data methods
  getUserData(userId: string): UserData | null {
    try {
      const data = JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
      return data[userId] || null;
    } catch (error) {
      console.error('Error reading user data:', error);
      return null;
    }
  }

  saveUserData(userId: string, userData: UserData): void {
    try {
      const data = JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
      data[userId] = userData;
      fs.writeFileSync(this.usersFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  createUserData(userId: string, username: string): UserData {
    const userData: UserData = {
      userId,
      username,
      points: 0,
      activeWallet: 1,
      wallets: [{
        walletId: 1,
        inventory: {
          lootBoxes: 0,
          gtdWhitelist: 0,
          fcfsWhitelist: 0,
          airdropAllocations: 0,
          sparkTokens: 0
        }
      }],
      inviteData: {
        inviteCode: '',
        uses: 0,
        pointsEarned: 0,
        invitedUsers: []
      },
      reactionData: {},
      gmCooldown: 0
    };
    
    this.saveUserData(userId, userData);
    return userData;
  }

  getAllUsers(): { [userId: string]: UserData } {
    try {
      return JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
    } catch (error) {
      console.error('Error reading all users:', error);
      return {};
    }
  }

  // Global state methods
  getGlobalState(): GlobalState {
    try {
      const data = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      // Ensure new fields exist for backward compatibility
      if (data.globalAirdropLimit === undefined) {
        data.globalAirdropLimit = 20;
      }
      if (data.totalAirdropsDistributed === undefined) {
        data.totalAirdropsDistributed = 0;
      }
      return data;
    } catch (error) {
      console.error('Error reading global state:', error);
      return {
        totalAirdropsGiven: 0,
        maxAirdrops: 20,
        lootBoxRewards: [],
        globalAirdropLimit: 20,
        totalAirdropsDistributed: 0
      };
    }
  }

  saveGlobalState(state: GlobalState): void {
    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('Error saving global state:', error);
    }
  }

  // Config methods
  getConfig(): BotConfig {
    try {
      return JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
    } catch (error) {
      console.error('Error reading config:', error);
      return {
        lootBoxCost: 50,
        invitePoints: 20
      };
    }
  }

  // Export methods
  exportWallets(): { [userId: string]: string } {
    const users = this.getAllUsers();
    const wallets: { [userId: string]: string } = {};
    
    for (const [userId, userData] of Object.entries(users)) {
      // For backward compatibility, check if user has old structure
      if ((userData as any).walletAddress) {
        wallets[userId] = (userData as any).walletAddress;
      } else if (userData.wallets && userData.wallets.length > 0) {
        // Use active wallet's spark address
        const activeWallet = this.getActiveWallet(userData);
        if (activeWallet.sparkWalletAddress) {
          wallets[userId] = activeWallet.sparkWalletAddress;
        }
      }
    }
    
    return wallets;
  }

  // Announcement methods
  saveAnnouncementData(messageId: string, data: AnnouncementData): void {
    try {
      const announcements = JSON.parse(fs.readFileSync(this.announcementsFile, 'utf8'));
      announcements[messageId] = data;
      fs.writeFileSync(this.announcementsFile, JSON.stringify(announcements, null, 2));
    } catch (error) {
      console.error('Error saving announcement data:', error);
    }
  }

  getAnnouncementData(messageId: string): AnnouncementData | null {
    try {
      const announcements = JSON.parse(fs.readFileSync(this.announcementsFile, 'utf8'));
      return announcements[messageId] || null;
    } catch (error) {
      console.error('Error reading announcement data:', error);
      return null;
    }
  }

  // Multi-wallet helper methods
  getActiveWallet(userData: UserData): UserWallet {
    // Handle backward compatibility for existing users
    if (!userData.wallets || userData.wallets.length === 0) {
      // Convert old structure to new structure
      const wallet: UserWallet = {
        walletId: 1,
        sparkWalletAddress: (userData as any).walletAddress,
        taprootWalletAddress: (userData as any).taprootWalletAddress,
        inventory: (userData as any).inventory || {
          lootBoxes: 0,
          gtdWhitelist: 0,
          fcfsWhitelist: 0,
          airdropAllocations: 0,
          sparkTokens: 0
        }
      };
      
      // Update user data to new structure
      userData.wallets = [wallet];
      userData.activeWallet = 1;
      
      // Remove old properties
      delete (userData as any).walletAddress;
      delete (userData as any).taprootWalletAddress;
      delete (userData as any).inventory;
      
      // Save updated structure
      this.saveUserData(userData.userId, userData);
      
      return wallet;
    }
    
    return userData.wallets.find(w => w.walletId === userData.activeWallet) || userData.wallets[0];
  }

  getWallet(userData: UserData, walletId: number): UserWallet | null {
    // Handle backward compatibility for existing users
    if (!userData.wallets || userData.wallets.length === 0) {
      // Convert old structure to new structure first
      this.getActiveWallet(userData);
    }
    
    return userData.wallets.find(w => w.walletId === walletId) || null;
  }

  createNewWallet(userData: UserData): UserWallet {
    const newWalletId = userData.wallets.length + 1;
    const newWallet: UserWallet = {
      walletId: newWalletId,
      inventory: {
        lootBoxes: 0,
        gtdWhitelist: 0,
        fcfsWhitelist: 0,
        airdropAllocations: 0,
        sparkTokens: 0
      }
    };
    userData.wallets.push(newWallet);
    return newWallet;
  }

  canUnlockNextWallet(userData: UserData, globalState: GlobalState): boolean {
    const activeWallet = this.getActiveWallet(userData);
    const hasGTD = activeWallet.inventory.gtdWhitelist >= 1;
    const hasFCFS = activeWallet.inventory.fcfsWhitelist >= 1;
    const hasAirdrop = activeWallet.inventory.airdropAllocations >= 1;
    
    // If global airdrop limit reached, only need GTD + FCFS
    if (globalState.totalAirdropsDistributed >= globalState.globalAirdropLimit) {
      return hasGTD && hasFCFS;
    }
    
    // Otherwise need all three
    return hasGTD && hasFCFS && hasAirdrop;
  }

  // Backup methods
  createBackup(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.dataDir, 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    const allData = {
      users: this.getAllUsers(),
      state: this.getGlobalState(),
      config: this.getConfig(),
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(allData, null, 2));
    return backupFile;
  }
}
