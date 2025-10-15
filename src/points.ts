import { StorageManager } from './storage';
import { UserData } from './types';

export class PointManager {
  private storage: StorageManager;

  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  /**
   * Add points to a user
   */
  addPoints(userId: string, amount: number): boolean {
    if (amount <= 0) return false;

    let userData = this.storage.getUserData(userId);
    if (!userData) {
      // Create new user data if it doesn't exist
      userData = this.storage.createUserData(userId, 'Unknown');
    }

    userData.points += amount;
    this.storage.saveUserData(userId, userData);
    return true;
  }

  /**
   * Remove points from a user
   */
  removePoints(userId: string, amount: number): boolean {
    if (amount <= 0) return false;

    const userData = this.storage.getUserData(userId);
    if (!userData || userData.points < amount) {
      return false;
    }

    userData.points -= amount;
    this.storage.saveUserData(userId, userData);
    return true;
  }

  /**
   * Set points for a user
   */
  setPoints(userId: string, amount: number): boolean {
    if (amount < 0) return false;

    let userData = this.storage.getUserData(userId);
    if (!userData) {
      userData = this.storage.createUserData(userId, 'Unknown');
    }

    userData.points = amount;
    this.storage.saveUserData(userId, userData);
    return true;
  }

  /**
   * Get user's current points
   */
  getPoints(userId: string): number {
    const userData = this.storage.getUserData(userId);
    return userData?.points || 0;
  }

  /**
   * Award points for Discord invite
   */
  awardInvitePoints(inviterId: string, invitedUserId: string): boolean {
    const config = this.storage.getConfig();
    const invitePoints = config.invitePoints;

    let inviterData = this.storage.getUserData(inviterId);
    if (!inviterData) {
      inviterData = this.storage.createUserData(inviterId, 'Unknown');
    }

    // Check if this user was already invited by this inviter
    if (inviterData.inviteData.invitedUsers.includes(invitedUserId)) {
      console.log(`🚫 Duplicate user ${invitedUserId} - 0 points awarded to ${inviterId}`);
      return false; // Already awarded points for this invite - duplicate user gets 0 points
    }

    // Add points and update invite data
    inviterData.points += invitePoints;
    inviterData.inviteData.uses++;
    inviterData.inviteData.pointsEarned += invitePoints;
    inviterData.inviteData.invitedUsers.push(invitedUserId);

    this.storage.saveUserData(inviterId, inviterData);
    return true;
  }


  /**
   * Get leaderboard of top users by points
   */
  getLeaderboard(limit: number = 10): Array<{ userId: string; username: string; points: number }> {
    const allUsers = this.storage.getAllUsers();
    
    return Object.entries(allUsers)
      .map(([userId, userData]) => ({
        userId,
        username: userData.username,
        points: userData.points
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }

  /**
   * Get user's point earning statistics
   */
  getUserPointStats(userId: string): {
    totalPoints: number;
    invitePoints: number;
    inviteCount: number;
  } {
    const userData = this.storage.getUserData(userId);
    if (!userData) {
      return {
        totalPoints: 0,
        invitePoints: 0,
        inviteCount: 0
      };
    }

    return {
      totalPoints: userData.points,
      invitePoints: userData.inviteData.pointsEarned,
      inviteCount: userData.inviteData.uses
    };
  }

  /**
   * Transfer points between users
   */
  transferPoints(fromUserId: string, toUserId: string, amount: number): boolean {
    if (amount <= 0) return false;

    const fromUserData = this.storage.getUserData(fromUserId);
    if (!fromUserData || fromUserData.points < amount) {
      return false;
    }

    let toUserData = this.storage.getUserData(toUserId);
    if (!toUserData) {
      toUserData = this.storage.createUserData(toUserId, 'Unknown');
    }

    // Transfer points
    fromUserData.points -= amount;
    toUserData.points += amount;

    this.storage.saveUserData(fromUserId, fromUserData);
    this.storage.saveUserData(toUserId, toUserData);

    return true;
  }

  /**
   * Get total points distributed across all users
   */
  getTotalPointsDistributed(): number {
    const allUsers = this.storage.getAllUsers();
    return Object.values(allUsers).reduce((total, userData) => total + userData.points, 0);
  }

  /**
   * Get points distribution statistics
   */
  getPointsDistribution(): {
    totalUsers: number;
    totalPoints: number;
    averagePoints: number;
    medianPoints: number;
    top10Percent: number;
  } {
    const allUsers = this.storage.getAllUsers();
    const userCount = Object.keys(allUsers).length;
    
    if (userCount === 0) {
      return {
        totalUsers: 0,
        totalPoints: 0,
        averagePoints: 0,
        medianPoints: 0,
        top10Percent: 0
      };
    }

    const points = Object.values(allUsers).map(user => user.points).sort((a, b) => a - b);
    const totalPoints = points.reduce((sum, point) => sum + point, 0);
    const averagePoints = totalPoints / userCount;
    const medianPoints = points[Math.floor(userCount / 2)];
    const top10Percent = points[Math.floor(userCount * 0.9)];

    return {
      totalUsers: userCount,
      totalPoints,
      averagePoints: Math.round(averagePoints * 100) / 100,
      medianPoints,
      top10Percent
    };
  }
}





