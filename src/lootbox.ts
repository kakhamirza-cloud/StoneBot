import { StorageManager } from './storage';
import { UserData, LootBoxReward, GlobalState } from './types';

export class LootBoxManager {
  private storage: StorageManager;

  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  /**
   * Open a loot box for a user and give them a random reward
   */
  async openLootBox(userId: string, walletId: number = 1): Promise<LootBoxReward | null> {
    const userData = this.storage.getUserData(userId);
    if (!userData) {
      return null;
    }

    const activeWallet = this.storage.getActiveWallet(userData);
    if (!activeWallet || activeWallet.inventory.lootBoxes === 0) {
      return null;
    }

    const globalState = this.storage.getGlobalState();
    
    // Check if user can get certain rewards based on their current wallet's items
    const canGetAirdrop = activeWallet.inventory.airdropAllocations < 1 && 
                         globalState.totalAirdropsDistributed < globalState.globalAirdropLimit;
    
    // If user has airdrop allocation, they can only get $Stone tokens
    if (!canGetAirdrop) {
      const sparkTokenReward = this.selectSparkTokenReward(globalState);
      if (sparkTokenReward) {
        this.giveReward(userId, sparkTokenReward, globalState, walletId);
        return sparkTokenReward;
      }
    }

    const reward = this.selectRandomReward(globalState, canGetAirdrop);

    if (!reward) {
      return null;
    }

    // Give the reward
    this.giveReward(userId, reward, globalState, walletId);

    // Update global state if needed
    if (reward.type === 'airdrop') {
      globalState.totalAirdropsDistributed++;
    }
    this.storage.saveGlobalState(globalState);

    return reward;
  }

  /**
   * Select a random reward based on probabilities
   */
  private selectRandomReward(globalState: GlobalState, canGetAirdrop: boolean = true): LootBoxReward | null {
    // Filter rewards based on availability
    const availableRewards = globalState.lootBoxRewards.filter(reward => {
      switch (reward.type) {
        case 'airdrop':
          return canGetAirdrop;
        case 'spark_tokens':
          return true; // Always available
        default:
          return true;
      }
    });

    if (availableRewards.length === 0) return null;

    // Generate random number between 0 and 1
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const reward of availableRewards) {
      cumulativeProbability += reward.probability;
      if (random <= cumulativeProbability) {
        return reward;
      }
    }

    // Fallback to last reward if something goes wrong
    return availableRewards[availableRewards.length - 1];
  }

  /**
   * Select an alternative reward when airdrop is maxed out
   */
  private selectAlternativeReward(globalState: GlobalState): LootBoxReward | null {
    // Create a new reward pool without airdrop
    const alternativeRewards = globalState.lootBoxRewards.filter(
      reward => reward.type !== 'airdrop'
    );

    if (alternativeRewards.length === 0) return null;

    // Recalculate probabilities to maintain relative ratios
    const totalProbability = alternativeRewards.reduce(
      (sum, reward) => sum + reward.probability, 0
    );

    const random = Math.random() * totalProbability;
    let cumulativeProbability = 0;

    for (const reward of alternativeRewards) {
      cumulativeProbability += reward.probability;
      if (random <= cumulativeProbability) {
        return reward;
      }
    }

    return alternativeRewards[alternativeRewards.length - 1];
  }

  /**
   * Select a spark token reward (10 or 20 tokens)
   */
  private selectSparkTokenReward(globalState: GlobalState): LootBoxReward | null {
    const sparkTokenRewards = globalState.lootBoxRewards.filter(
      reward => reward.type === 'spark_tokens'
    );

    if (sparkTokenRewards.length === 0) return null;

    // Generate random number between 0 and 1
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const reward of sparkTokenRewards) {
      cumulativeProbability += reward.probability;
      if (random <= cumulativeProbability) {
        return reward;
      }
    }

    // Fallback to last spark token reward
    return sparkTokenRewards[sparkTokenRewards.length - 1];
  }

  /**
   * Give a reward to a user
   */
  private giveReward(userId: string, reward: LootBoxReward, globalState: GlobalState, walletId: number = 1): void {
    const userData = this.storage.getUserData(userId);
    if (!userData) return;

    const targetWallet = this.storage.getActiveWallet(userData);
    if (!targetWallet) return;

    // Remove one loot box from the target wallet
    targetWallet.inventory.lootBoxes--;

    // Add the reward to the target wallet's inventory
    switch (reward.type) {
      case 'airdrop':
        targetWallet.inventory.airdropAllocations = Math.min(targetWallet.inventory.airdropAllocations + 1, 1);
        break;
      case 'spark_tokens':
        targetWallet.inventory.sparkTokens += reward.tokenAmount || 0;
        break;
    }

    this.storage.saveUserData(userId, userData);
  }

  /**
   * Get loot box statistics
   */
  getLootBoxStats(): {
    totalAirdropsGiven: number;
    maxAirdrops: number;
    airdropsRemaining: number;
    rewards: LootBoxReward[];
  } {
    const globalState = this.storage.getGlobalState();
    return {
      totalAirdropsGiven: globalState.totalAirdropsGiven,
      maxAirdrops: globalState.maxAirdrops,
      airdropsRemaining: globalState.maxAirdrops - globalState.totalAirdropsGiven,
      rewards: globalState.lootBoxRewards
    };
  }

  /**
   * Update reward probabilities (admin function)
   */
  updateRewardProbabilities(rewards: LootBoxReward[]): void {
    const globalState = this.storage.getGlobalState();
    globalState.lootBoxRewards = rewards;
    this.storage.saveGlobalState(globalState);
  }

  /**
   * Reset airdrop counter (admin function)
   */
  resetAirdropCounter(): void {
    const globalState = this.storage.getGlobalState();
    globalState.totalAirdropsGiven = 0;
    this.storage.saveGlobalState(globalState);
  }

  /**
   * Get user's loot box count
   */
  getUserLootBoxCount(userId: string, walletId: number = 1): number {
    const userData = this.storage.getUserData(userId);
    if (!userData) return 0;
    
    const wallet = this.storage.getActiveWallet(userData);
    return wallet?.inventory.lootBoxes || 0;
  }

  /**
   * Get user's total inventory value (for statistics)
   */
  getUserInventoryValue(userId: string, walletId: number = 1): {
    totalItems: number;
    breakdown: {
      lootBoxes: number;
      airdropAllocations: number;
      sparkTokens: number;
    };
  } {
    const userData = this.storage.getUserData(userId);
    if (!userData) {
      return {
        totalItems: 0,
        breakdown: {
          lootBoxes: 0,
          airdropAllocations: 0,
          sparkTokens: 0
        }
      };
    }

    const wallet = this.storage.getActiveWallet(userData);
    if (!wallet) {
      return {
        totalItems: 0,
        breakdown: {
          lootBoxes: 0,
          airdropAllocations: 0,
          sparkTokens: 0
        }
      };
    }

    const inventory = wallet.inventory;
    const totalItems = Object.values(inventory).reduce((sum: number, count: any) => sum + (count || 0), 0);

    return {
      totalItems,
      breakdown: { ...inventory }
    };
  }
}
