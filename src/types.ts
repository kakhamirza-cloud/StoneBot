import { User } from 'discord.js';

// User data structure
export interface UserData {
  userId: string;
  username: string;
  points: number;
  activeWallet: number; // Which wallet is currently active (1, 2, 3, etc.)
  wallets: UserWallet[]; // Array of user's wallets
  inviteData: InviteData;
  reactionData: UserReactionData;
  gmCooldown?: number; // Timestamp of last GM reward (for 24-hour cooldown)
}

// Individual wallet structure
export interface UserWallet {
  walletId: number; // 1, 2, 3, etc.
  sparkWalletAddress?: string;
  taprootWalletAddress?: string;
  inventory: Inventory;
}

// Inventory system
export interface Inventory {
  lootBoxes: number;
  gtdWhitelist: number;
  fcfsWhitelist: number;
  airdropAllocations: number;
  sparkTokens: number; // Combined $Stone tokens (10 + 20)
}


// Discord invite tracking
export interface InviteData {
  inviteCode: string;
  uses: number;
  pointsEarned: number;
  invitedUsers: string[]; // Array of user IDs
}


// Loot box system
export interface LootBoxReward {
  type: 'gtd_whitelist' | 'fcfs_whitelist' | 'airdrop' | 'spark_tokens';
  name: string;
  description: string;
  inventoryImage: string;
  openingImage: string;
  probability: number;
  tokenAmount?: number; // Amount of $Stone tokens to give (10 or 20) - only for spark_tokens type
  maxQuantity?: number; // For airdrop (20 max)
}

// Global state
export interface GlobalState {
  totalAirdropsGiven: number;
  maxAirdrops: number;
  lootBoxRewards: LootBoxReward[];
  globalAirdropLimit: number; // Total airdrops allowed across all users (20)
  totalAirdropsDistributed: number; // How many airdrops have been given out globally
}

// Command context
export interface CommandContext {
  user: User;
  userId: string;
  userData: UserData;
  isAdmin: boolean;
}

// Announcement system
export interface AnnouncementData {
  messageId: string;
  channelId: string;
  reactions: string[];
  createdAt: number;
}

export interface UserReactionData {
  [messageId: string]: string[]; // Array of reactions the user has made to this message
}

// Bot configuration
export interface BotConfig {
  lootBoxCost: number;
  invitePoints: number;
}
