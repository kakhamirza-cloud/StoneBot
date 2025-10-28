import { Client, Guild, GuildMember } from 'discord.js';
import { StorageManager } from './storage';

export class DailyRolePointsService {
  private client: Client;
  private storage: StorageManager;
  private dailyCheckInterval: NodeJS.Timeout | null = null;

  // Role configuration
  private readonly ROLE_CONFIG = {
    '1432390111865077781': 300, // 300 points daily
    '1432395369689649273': 30  // 30 points daily
  };

  // Notification channel ID
  private readonly NOTIFICATION_CHANNEL_ID = '1427379036841054258';

  constructor(client: Client, storage: StorageManager) {
    this.client = client;
    this.storage = storage;
  }

  /**
   * Start the daily points check service
   * This will run once per day at midnight UTC
   */
  public start(): void {
    console.log('🔔 Daily Role Points Service started');
    
    // Calculate time until next midnight UTC
    const now = new Date();
    const nextMidnight = this.getNextMidnightUTC();
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    console.log(`⏰ Next daily points check: ${nextMidnight.toISOString()}`);
    console.log(`⏰ Time until next check: ${Math.floor(msUntilMidnight / 1000 / 60)} minutes`);

    // Wait until midnight, then run checks daily
    setTimeout(() => {
      this.processDailyPoints();
      // Then run every 24 hours
      this.dailyCheckInterval = setInterval(() => {
        this.processDailyPoints();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, msUntilMidnight);
  }

  /**
   * Stop the daily points service
   */
  public stop(): void {
    if (this.dailyCheckInterval) {
      clearInterval(this.dailyCheckInterval);
      this.dailyCheckInterval = null;
    }
    console.log('🛑 Daily Role Points Service stopped');
  }

  /**
   * Get the next midnight UTC
   */
  private getNextMidnightUTC(): Date {
    const now = new Date();
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
    return midnight;
  }

  /**
   * Process daily points for all eligible members
   */
  private async processDailyPoints(): Promise<void> {
    const now = Date.now();
    const today = this.getDateString(now);
    
    console.log(`\n🎁 Starting daily role points check at ${new Date().toISOString()}`);

    try {
      // Get all guilds the bot is in
      const guilds = this.client.guilds.cache;
      const guildResults: Array<{ guildName: string; awarded: number; skipped: number; totalEligible: number }> = [];
      
      for (const [guildId, guild] of guilds) {
        console.log(`\n📊 Processing guild: ${guild.name} (${guildId})`);
        
        try {
          // Fetch all members
          await guild.members.fetch();
          const members = guild.members.cache;
          
          let eligibleCount = 0;
          let awardedCount = 0;
          let skippedCount = 0;
          let totalPointsAwarded = 0;

          for (const [memberId, member] of members) {
            // Skip bots
            if (member.user.bot) continue;

            // Calculate points based on roles
            const pointsToAward = this.calculatePointsForMember(member);
            
            if (pointsToAward > 0) {
              eligibleCount++;
              
              // Check if already claimed today
              const userData = this.storage.getUserData(memberId);
              const lastClaimDate = userData?.lastDailyPointsClaim 
                ? this.getDateString(userData.lastDailyPointsClaim) 
                : null;

              if (lastClaimDate === today) {
                // Already claimed today, skip
                skippedCount++;
                console.log(`⏭️  ${member.user.username} (${memberId}): Already claimed today, skipping`);
                continue;
              }

              // Award points
              let currentUserData = userData;
              if (!currentUserData) {
                currentUserData = this.storage.createUserData(memberId, member.user.username);
              }

              currentUserData.points += pointsToAward;
              currentUserData.lastDailyPointsClaim = now;
              this.storage.saveUserData(memberId, currentUserData);

              totalPointsAwarded += pointsToAward;
              awardedCount++;
              console.log(`✅ ${member.user.username} (${memberId}): Awarded ${pointsToAward} points (Total: ${currentUserData.points})`);
            }
          }

          console.log(`\n📊 Guild Summary: ${eligibleCount} eligible members, ${awardedCount} awarded, ${skippedCount} skipped`);

          // Store results for notification
          if (awardedCount > 0 || eligibleCount > 0) {
            guildResults.push({
              guildName: guild.name,
              awarded: awardedCount,
              skipped: skippedCount,
              totalEligible: eligibleCount
            });
          }

        } catch (error) {
          console.error(`❌ Error processing guild ${guildId}:`, error);
        }
      }

      console.log(`\n🎉 Daily role points check completed at ${new Date().toISOString()}`);

      // Send notification to the channel
      await this.sendNotification(guildResults);

    } catch (error) {
      console.error('❌ Error in daily points check:', error);
    }
  }

  /**
   * Calculate points for a member based on their roles
   */
  private calculatePointsForMember(member: GuildMember): number {
    let totalPoints = 0;

    // Check each role in the config
    for (const [roleId, points] of Object.entries(this.ROLE_CONFIG)) {
      if (member.roles.cache.has(roleId)) {
        totalPoints += points;
        console.log(`  ✓ Role ${roleId}: +${points} points`);
      }
    }

    return totalPoints;
  }

  /**
   * Get date string in YYYY-MM-DD format (for comparing dates)
   */
  private getDateString(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Send notification to the designated channel
   */
  private async sendNotification(guildResults: Array<{ guildName: string; awarded: number; skipped: number; totalEligible: number }>): Promise<void> {
    try {
      // Find the notification channel
      const channel = this.client.channels.cache.get(this.NOTIFICATION_CHANNEL_ID);
      
      if (!channel || !('send' in channel)) {
        console.error(`❌ Could not find notification channel ${this.NOTIFICATION_CHANNEL_ID} or channel doesn't support sending messages`);
        return;
      }

      // Calculate totals
      const totalAwarded = guildResults.reduce((sum, result) => sum + result.awarded, 0);
      const totalSkipped = guildResults.reduce((sum, result) => sum + result.skipped, 0);
      const totalEligible = guildResults.reduce((sum, result) => sum + result.totalEligible, 0);

      // Create the notification message
      const date = new Date().toUTCString();
      let message = `🎁 **Daily Role Points Distribution Complete**\n\n`;
      message += `📅 **Date:** ${date}\n\n`;
      message += `📊 **Summary:**\n`;
      message += `✅ Points awarded: **${totalAwarded}** members\n`;
      message += `⏭️  Already claimed today: **${totalSkipped}** members\n`;
      message += `👥 Total eligible members: **${totalEligible}**\n\n`;

      if (guildResults.length > 0) {
        message += `📋 **Breakdown by Server:**\n`;
        for (const result of guildResults) {
          message += `\n🏠 **${result.guildName}**\n`;
          message += `   ✅ Awarded: ${result.awarded} members\n`;
          message += `   ⏭️  Skipped: ${result.skipped} members\n`;
        }
      }

      if (totalAwarded === 0 && totalEligible === 0) {
        message += `\n💡 No eligible members found today.`;
      }

      message += `\n\n✅ Bot is working correctly! 🎉`;

      // Send the message
      await (channel as any).send(message);
      console.log(`📢 Notification sent to channel ${this.NOTIFICATION_CHANNEL_ID}`);

    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  }

  /**
   * Manually trigger daily points check (for testing)
   */
  public async triggerNow(): Promise<void> {
    console.log('🔧 Manually triggering daily points check...');
    await this.processDailyPoints();
  }
}
