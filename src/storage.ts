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
            type: 'spark_tokens',
            name: '20 $Stone Tokens',
            description: '20 $Stone tokens',
            inventoryImage: 'https://i.imgur.com/uC9vkfX.jpeg',
            openingImage: 'https://i.imgur.com/uC9vkfX.jpeg',
            imageUrl: 'https://i.imgur.com/uC9vkfX.jpeg',
            probability: 0.40,
            tokenAmount: 20
          },
          {
            type: 'spark_tokens',
            name: '50 $Stone Tokens',
            description: '50 $Stone tokens',
            inventoryImage: 'https://i.imgur.com/PLACEHOLDER_50_TOKENS.jpeg',
            openingImage: 'https://i.imgur.com/PLACEHOLDER_50_TOKENS.jpeg',
            imageUrl: 'https://i.imgur.com/e8N1Kf0.jpeg',
            probability: 0.30,
            tokenAmount: 50
          },
          {
            type: 'spark_tokens',
            name: '100 $Stone Tokens',
            description: '100 $Stone tokens',
            inventoryImage: 'https://i.imgur.com/PLACEHOLDER_100_TOKENS.jpeg',
            openingImage: 'https://i.imgur.com/PLACEHOLDER_100_TOKENS.jpeg',
            imageUrl: 'https://i.imgur.com/HdjJ3ck.jpeg',
            probability: 0.20,
            tokenAmount: 100
          },
          {
            type: 'spark_tokens',
            name: '500 $Stone Tokens',
            description: '500 $Stone tokens',
            inventoryImage: 'https://i.imgur.com/PLACEHOLDER_500_TOKENS.jpeg',
            openingImage: 'https://i.imgur.com/PLACEHOLDER_500_TOKENS.jpeg',
            imageUrl: 'https://i.imgur.com/8NMrJ1T.jpeg',
            probability: 0.05,
            tokenAmount: 500
          },
          {
            type: 'spark_tokens',
            name: '1000 $Stone Tokens',
            description: '1000 $Stone tokens',
            inventoryImage: 'https://i.imgur.com/PLACEHOLDER_1000_TOKENS.jpeg',
            openingImage: 'https://i.imgur.com/PLACEHOLDER_1000_TOKENS.jpeg',
            imageUrl: 'https://i.imgur.com/fdS8Mnj.jpeg',
            probability: 0.03,
            tokenAmount: 1000
          },
          {
            type: 'airdrop',
            name: 'Airdrop Allocation',
            description: 'Airdrop allocation',
            inventoryImage: 'https://i.imgur.com/w00So6j.jpeg',
            openingImage: 'https://i.imgur.com/PLACEHOLDER_AIRDROP.jpeg',
            imageUrl: 'https://i.imgur.com/PLACEHOLDER_AIRDROP.jpeg',
            probability: 0.01,
            maxQuantity: 100
          },
          {
            type: 'spark_tokens',
            name: '4444 $Stone Tokens',
            description: '4444 $Stone tokens',
            inventoryImage: 'https://i.imgur.com/PLACEHOLDER_4444_TOKENS.jpeg',
            openingImage: 'https://i.imgur.com/PLACEHOLDER_4444_TOKENS.jpeg',
            imageUrl: 'https://i.imgur.com/x4s3EoU.jpeg',
            probability: 0.01,
            tokenAmount: 4444
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
      gmCooldown: 0,
      twitterHandle: undefined,
      lastLootBoxOpen: undefined
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
