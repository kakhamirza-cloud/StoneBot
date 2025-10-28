import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import { CommandManager } from './commands';
import { StorageManager } from './storage';
import { PointManager } from './points';
import { TwitterValidator } from './twitter-validator';
import { DailyRolePointsService } from './daily-role-points';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Prevent local running unless explicitly enabled
if (!process.env.RAILWAY_ENVIRONMENT && !process.env.ENABLE_LOCAL_BOT) {
  console.log('❌ LOCAL BOT DISABLED');
  console.log('🚀 This bot is configured to run only on Railway');
  console.log('💡 To enable local development, set ENABLE_LOCAL_BOT=true in your .env file');
  console.log('📊 Railway bot is running at: https://railway.app');
  process.exit(0);
}

class SparkBot {
  private client: Client;
  private commandManager: CommandManager;
  private storage: StorageManager;
  private pointManager: PointManager;
  private dailyRolePointsService: DailyRolePointsService;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.MessageContent
      ]
    });

    this.storage = new StorageManager();
    this.pointManager = new PointManager(this.storage);
    this.commandManager = new CommandManager();
    this.dailyRolePointsService = new DailyRolePointsService(this.client, this.storage);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Bot ready event
    this.client.once(Events.ClientReady, async (readyClient) => {
      console.log(`🚀 Spark Bot is ready! Logged in as ${readyClient.user.tag}`);
      console.log(`📊 Bot is in ${readyClient.guilds.cache.size} guild(s)`);
      
      // Start the daily role points service
      console.log('🎁 Starting Daily Role Points Service...');
      this.dailyRolePointsService.start();
    });

    // Slash command interaction
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (interaction.isChatInputCommand()) {
        await this.commandManager.handleCommand(interaction);
      } else if (interaction.isModalSubmit()) {
        await this.commandManager.handleModal(interaction);
      } else if (interaction.isButton()) {
        await this.commandManager.handleButton(interaction);
      } else if (interaction.isStringSelectMenu()) {
        await this.commandManager.handleComponentInteraction(interaction);
      }
    });

    // Guild member add (for invite tracking)
    this.client.on(Events.GuildMemberAdd, async (member) => {
      await this.handleNewMember(member);
    });

    // Message reaction add (for announcement points)
    this.client.on(Events.MessageReactionAdd, async (reaction, user) => {
      await this.handleReactionAdd(reaction, user);
    });

    // Message create (for GM detection)
    this.client.on(Events.MessageCreate, async (message) => {
      await this.handleMessageCreate(message);
    });

    // Error handling
    this.client.on(Events.Error, (error) => {
      console.error('Discord client error:', error);
    });

    this.client.on(Events.Warn, (warning) => {
      console.warn('Discord client warning:', warning);
    });
  }

  private async handleNewMember(member: any): Promise<void> {
    try {
      console.log(`👤 New member joined: ${member.user.username} (${member.id})`);
      console.log(`🔍 Account details: Bot=${member.user.bot}, Created=${member.user.createdAt}`);
      
      // Skip bot accounts - they don't earn points for inviters
      if (member.user.bot) {
        console.log(`🤖 Bot account ${member.user.username} joined - no points awarded`);
        return;
      }

      // Get all invites for the guild
      const invites = await member.guild.invites.fetch();
      console.log(`📋 Found ${invites.size} total invites in server`);
      
      // Find which invite was used by checking bot-tracked invites only
      for (const [code, invite] of invites) {
        console.log(`🔍 Checking invite ${code}: uses=${invite.uses}, inviter=${invite.inviter?.username || 'Unknown'}`);
        
        if (invite.uses && invite.uses > 0) {
          const inviterId = invite.inviter?.id;
          console.log(`✅ Invite ${code} has been used, inviter ID: ${inviterId}`);
          
          // Only award points if:
          // 1. Inviter exists and is not the new member
          // 2. The new member is not a bot account
          // 3. The invite code matches what we have stored for any user (bot-generated invite)
          if (inviterId && inviterId !== member.id && !member.user.bot) {
            // Find which user has this invite code stored
            const allUsers = this.storage.getAllUsers();
            let targetUser = null;
            
            for (const [userId, userData] of Object.entries(allUsers)) {
              if (userData.inviteData.inviteCode === code) {
                targetUser = { userId, userData };
                break;
              }
            }
            
            console.log(`👤 User with invite code ${code}: ${targetUser ? targetUser.userId : 'None found'}`);
            
            if (targetUser) {
              console.log(`🎯 Bot-tracked invite match! Awarding points to ${targetUser.userId}...`);
              // This is a bot-tracked invite, award points to the user who owns this invite code
              const success = await this.pointManager.awardInvitePoints(targetUser.userId, member.id);
              if (success) {
                console.log(`🎉 Awarded 10 points to ${targetUser.userId} for inviting ${member.user.username} (${member.id}) with bot-generated invite ${code}`);
              } else {
                console.log(`🚫 0 points awarded to ${targetUser.userId} for ${member.user.username} (${member.id}) - duplicate user detected`);
              }
            } else {
              console.log(`❌ Invite ${code} not tracked by bot - no user found with this invite code`);
            }
          } else {
            console.log(`❌ Invite ${code} conditions not met: inviterId=${inviterId}, memberId=${member.id}, isBot=${member.user.bot}`);
          }
        }
      }
    } catch (error) {
      console.error('Error handling new member:', error);
    }
  }

  private async handleTwitterLinkMonitoring(message: any): Promise<void> {
    try {
      const messageContent = message.content;
      console.log(`🔍 Checking message from ${message.author.username} in channel ${message.channel.id}: "${messageContent}"`);
      
      // Check if message contains Twitter/X URLs
      const twitterUrls = this.extractTwitterUrls(messageContent);
      console.log(`🔗 Found ${twitterUrls.length} Twitter URLs:`, twitterUrls);
      
      if (twitterUrls.length === 0) return;
      
      // Send notification to the designated channel
      const notificationChannelId = '1427379036841054258';
      const userToTag = '1246080513417023498';
      
      console.log(`📢 Attempting to send notification to channel ${notificationChannelId}`);
      
      const channel = message.client.channels.cache.get(notificationChannelId);
      if (channel && 'send' in channel) {
        const twitterLinks = twitterUrls.map(url => `🔗 ${url}`).join('\n');
        
        const notificationMessage = `**Twitter Link Detected!**\n\n**Posted by:** ${message.author.username} (${message.author.id})\n**Channel:** <#${message.channel.id}>\n**Links:**\n${twitterLinks}\n\n<@${userToTag}> please check these Twitter links.`;
        
        await (channel as any).send(notificationMessage);
        
        console.log(`🐦 Twitter link notification sent for ${twitterUrls.length} link(s) from ${message.author.username}`);
      } else {
        console.error(`❌ Could not find notification channel ${notificationChannelId} or channel doesn't support sending messages`);
      }
      
    } catch (error) {
      console.error('Error handling Twitter link monitoring:', error);
    }
  }

  private extractTwitterUrls(text: string): string[] {
    const urls: string[] = [];
    
    // Regex patterns for Twitter/X URLs - more comprehensive
    const patterns = [
      /https?:\/\/(?:www\.)?twitter\.com\/[a-zA-Z0-9_]+\/status\/\d+/g,
      /https?:\/\/(?:www\.)?x\.com\/[a-zA-Z0-9_]+\/status\/\d+/g,
      /https?:\/\/(?:www\.)?twitter\.com\/[a-zA-Z0-9_]+/g,
      /https?:\/\/(?:www\.)?x\.com\/[a-zA-Z0-9_]+/g,
      /https?:\/\/t\.co\/[a-zA-Z0-9]+/g,
      // Additional patterns for better detection
      /twitter\.com\/[a-zA-Z0-9_]+\/status\/\d+/g,
      /x\.com\/[a-zA-Z0-9_]+\/status\/\d+/g,
      /twitter\.com\/[a-zA-Z0-9_]+/g,
      /x\.com\/[a-zA-Z0-9_]+/g,
      /t\.co\/[a-zA-Z0-9]+/g
    ];
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        // Add https:// prefix if missing
        const fullUrls = matches.map(url => {
          if (!url.startsWith('http')) {
            return `https://${url}`;
          }
          return url;
        });
        urls.push(...fullUrls);
      }
    }
    
    // Remove duplicates
    return [...new Set(urls)];
  }

  private async handleReactionAdd(reaction: any, user: any): Promise<void> {
    try {
      // Ignore bot reactions
      if (user.bot) return;

      // Get the message
      const message = reaction.message;
      if (!message) return;

      // Check if this is an announcement message
      const announcementData = this.storage.getAnnouncementData(message.id);
      if (!announcementData) return;

      // Check if the reaction is one of the tracked reactions
      const emoji = reaction.emoji.name;
      if (!announcementData.reactions.includes(emoji)) return;

      // Get user data
      let userData = this.storage.getUserData(user.id);
      if (!userData) {
        userData = this.storage.createUserData(user.id, user.username);
      }

      // Initialize reactionData if it doesn't exist (for existing users)
      if (!userData.reactionData) {
        userData.reactionData = {};
      }

      // Check if user already reacted to this emoji on this message
      const messageReactions = userData.reactionData[message.id] || [];
      if (messageReactions.includes(emoji)) {
        console.log(`🚫 Duplicate reaction from ${user.username} (${user.id}) to emoji ${emoji} on message ${message.id} - 0 points`);
        return;
      }

      // Award 1 point for the reaction
      userData.points += 1;
      
      // Track this reaction to prevent duplicates
      if (!userData.reactionData[message.id]) {
        userData.reactionData[message.id] = [];
      }
      userData.reactionData[message.id].push(emoji);

      this.storage.saveUserData(user.id, userData);

      console.log(`🎉 Awarded 1 point to ${user.username} (${user.id}) for reacting with ${emoji} to announcement ${message.id}`);
    } catch (error) {
      console.error('Error handling reaction add:', error);
    }
  }

  private async handleMessageCreate(message: any): Promise<void> {
    try {
      // Ignore bot messages
      if (message.author.bot) return;

      console.log(`📝 Message received from ${message.author.username} in channel ${message.channel.id}`);

      // Check for Twitter links in monitoring channel
      const twitterMonitoringChannelId = '1422957619181523099';
      if (message.channel.id === twitterMonitoringChannelId) {
        console.log(`🐦 Twitter monitoring channel detected! Processing message...`);
        await this.handleTwitterLinkMonitoring(message);
      }

      // Check if message is in the GM channel
      const gmChannelId = process.env.GM_CHANNEL_ID;
      if (!gmChannelId || message.channel.id !== gmChannelId) return;

      // Check if message contains GM patterns (case-insensitive)
      const messageContent = message.content.toLowerCase();
      const gmPatterns = ['gm', 'good morning', 'morning'];
      
      let isGmMessage = false;
      
      // Check for exact GM patterns
      for (const pattern of gmPatterns) {
        if (messageContent.includes(pattern)) {
          isGmMessage = true;
          break;
        }
      }
      
      // Check for "GM" followed by any emoji
      if (!isGmMessage && /gm\p{Emoji}/u.test(messageContent)) {
        isGmMessage = true;
      }

      if (!isGmMessage) return;

      // Get user data
      let userData = this.storage.getUserData(message.author.id);
      if (!userData) {
        userData = this.storage.createUserData(message.author.id, message.author.username);
      }

      // Check if user is admin (admins can bypass cooldown)
      const adminIds = process.env.ADMIN_IDS?.split(',') || [];
      let isAdmin = adminIds.includes(message.author.id);
      
      // Check if user has admin role (1422925268158513212)
      if (message.guild) {
        const member = message.guild.members.cache.get(message.author.id);
        if (member && member.roles.cache.has('1422925268158513212')) {
          isAdmin = true;
        }
      }

      // Check cooldown (24 hours = 86400000 milliseconds)
      const now = Date.now();
      const cooldownTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (!isAdmin && userData.gmCooldown && (now - userData.gmCooldown) < cooldownTime) {
        const remainingTime = cooldownTime - (now - userData.gmCooldown);
        const remainingHours = Math.ceil(remainingTime / (60 * 60 * 1000));
        
        await message.reply({
          content: `⏰ You can get GM points again in ${remainingHours} hours!`,
          ephemeral: true
        });
        return;
      }

      // Award 1 point for GM message
      userData.points += 1;
      userData.gmCooldown = now;
      this.storage.saveUserData(message.author.id, userData);

      // Send ephemeral confirmation message
      await message.reply({
        content: `🌅 Good morning! You earned **1 $Stone Point** for your GM message!`,
        ephemeral: true
      });

      console.log(`🌅 Awarded 1 GM point to ${message.author.username} (${message.author.id}) in channel ${message.channel.id}`);
    } catch (error) {
      console.error('Error handling GM message:', error);
    }
  }

  public async start(): Promise<void> {
    try {
      const token = process.env.DISCORD_TOKEN;
      if (!token) {
        throw new Error('DISCORD_TOKEN is not set in environment variables');
      }

      await this.client.login(token);
    } catch (error) {
      console.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    console.log('🛑 Shutting down Spark Bot...');
    this.dailyRolePointsService.stop();
    this.client.destroy();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  if (bot) {
    await bot.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  if (bot) {
    await bot.stop();
  }
  process.exit(0);
});

// Start the bot
const bot = new SparkBot();
bot.start().catch(console.error);