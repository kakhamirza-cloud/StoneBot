import { 
  SlashCommandBuilder, 
  CommandInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
  ButtonInteraction,
  StringSelectMenuBuilder
} from 'discord.js';
import { UserData, CommandContext, LootBoxReward } from './types';
import { StorageManager } from './storage';
import { LootBoxManager } from './lootbox';
import { PointManager } from './points';

export class CommandManager {
  private storage: StorageManager;
  private lootBoxManager: LootBoxManager;
  private pointManager: PointManager;

  constructor() {
    this.storage = new StorageManager();
    this.lootBoxManager = new LootBoxManager(this.storage);
    this.pointManager = new PointManager(this.storage);
  }

  // Command definitions
  getCommands() {
    return [
      // Announce command
      new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Send an announcement with reaction rewards (Admin only)'),

      // Edit announcement command
      new SlashCommandBuilder()
        .setName('edit')
        .setDescription('Edit an existing announcement message (Admin only)')
        .addStringOption(option =>
          option.setName('message_id')
            .setDescription('The message ID of the announcement to edit')
            .setRequired(true)
        ),

      // Buy loot box command
      new SlashCommandBuilder()
        .setName('buylootbox')
        .setDescription('Buy loot boxes with your $Stone Points')
        .addIntegerOption(option =>
          option.setName('quantity')
            .setDescription('Number of loot boxes to buy')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
        ),

      // Inventory command
      new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('View your inventory and items'),

      // Open loot box command
      new SlashCommandBuilder()
        .setName('openlootbox')
        .setDescription('Open your loot boxes'),

      // Edit wallet command
      new SlashCommandBuilder()
        .setName('editwallet')
        .setDescription('Edit your wallet address'),

      // Invite command
      new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get your personal invitation link to earn points'),

      // Help command
        new SlashCommandBuilder()
          .setName('help')
          .setDescription('Show all available commands and how to use them'),
        new SlashCommandBuilder()
          .setName('additems')
          .setDescription('Add items to a user (Admin only)')
          .setDefaultMemberPermissions(8) // Administrator permission
          .addUserOption(option =>
            option.setName('user')
              .setDescription('The user to add items to')
              .setRequired(true)
          )
          .addStringOption(option =>
            option.setName('item')
              .setDescription('Item type to add')
              .setRequired(true)
              .addChoices(
                { name: 'GTD Whitelist', value: 'gtd_whitelist' },
                { name: 'FCFS Whitelist', value: 'fcfs_whitelist' },
                { name: 'Airdrop Allocation', value: 'airdrop' },
                { name: '$Stone Tokens', value: 'spark_tokens' }
              )
          )
          .addIntegerOption(option =>
            option.setName('amount')
              .setDescription('Amount to add')
              .setRequired(true)
              .setMinValue(1)
          ),

      // Admin commands
      new SlashCommandBuilder()
        .setName('addpoints')
        .setDescription('Add points to a user (Admin only)')
        .setDefaultMemberPermissions(8) // Administrator permission
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to add points to')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('Amount of points to add')
            .setRequired(true)
        ),

      new SlashCommandBuilder()
        .setName('exportwallets')
        .setDescription('Export all submitted wallet addresses (Admin only)')
        .setDefaultMemberPermissions(8), // Administrator permission

      new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your current $Stone Points balance'),

      new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Display the Spark Stones ecosystem panel (Admin only)')
        .setDefaultMemberPermissions(8), // Administrator permission

      new SlashCommandBuilder()
        .setName('export-data')
        .setDescription('Export all user data to a downloadable file (Admin only)')
        .setDefaultMemberPermissions(8), // Administrator permission

      new SlashCommandBuilder()
        .setName('import-data')
        .setDescription('Import user data from a JSON file (Admin only)')
        .setDefaultMemberPermissions(8) // Administrator permission
        .addAttachmentOption(option =>
          option.setName('file')
            .setDescription('JSON file containing user data')
            .setRequired(true)
        )
    ];
  }

  // Command handlers
  async handleCommand(interaction: CommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const username = interaction.user.username;
    
    // Get or create user data
    let userData = this.storage.getUserData(userId);
    if (!userData) {
      userData = this.storage.createUserData(userId, username);
    }

    const context: CommandContext = {
      user: interaction.user,
      userId,
      userData,
      isAdmin: this.isAdmin(interaction.user.id, interaction)
    };

    try {
      switch (interaction.commandName) {
        case 'announce':
          await this.handleAnnounce(interaction, context);
          break;
        case 'edit':
          await this.handleEdit(interaction, context);
          break;
        case 'buylootbox':
          await this.handleBuyLootBox(interaction, context);
          break;
        case 'inventory':
          await this.handleInventory(interaction, context);
          break;
        case 'openlootbox':
          await this.handleOpenLootBox(interaction, context);
          break;
        case 'editwallet':
          await this.handleEditWallet(interaction, context);
          break;
        case 'invite':
          await this.handleInvite(interaction, context);
          break;
      case 'help':
        await this.handleHelp(interaction, context);
        break;
      case 'additems':
        await this.handleAddItems(interaction, context);
        break;
        case 'addpoints':
          await this.handleAddPoints(interaction, context);
          break;
        case 'exportwallets':
          await this.handleExportWallets(interaction, context);
          break;
        case 'balance':
          await this.handleBalance(interaction, context);
          break;
        case 'panel':
          await this.handlePanel(interaction, context);
          break;
        case 'export-data':
          await this.handleExportData(interaction, context);
          break;
        case 'import-data':
          await this.handleImportData(interaction, context);
          break;
        default:
          await interaction.reply({ content: 'Unknown command!', ephemeral: true });
      }
    } catch (error) {
      console.error('Error handling command:', error);
      await interaction.reply({ 
        content: 'An error occurred while processing your command.', 
        ephemeral: true 
      });
    }
  }


  private async handleBuyLootBox(interaction: CommandInteraction, context: CommandContext): Promise<void> {
    const quantity = (interaction as any).options.get('quantity')?.value as number;
    const userId = context.userId;
    
    if (!quantity || quantity <= 0) {
      await interaction.reply({ 
        content: '❌ Please enter a valid number!', 
        ephemeral: true 
      });
      return;
    }

    const config = this.storage.getConfig();
    const totalCost = quantity * config.lootBoxCost;
    
    let userData = this.storage.getUserData(userId);
    if (!userData) {
      userData = this.storage.createUserData(userId, context.user.username);
    }

    if (userData.points < totalCost) {
      await interaction.reply({ 
        content: `❌ You don't have enough points! You need ${totalCost} points but only have ${userData.points}.`, 
        ephemeral: true 
      });
      return;
    }

    // Deduct points and add loot boxes to active wallet
    userData.points -= totalCost;
    const activeWallet = this.storage.getActiveWallet(userData);
    activeWallet.inventory.lootBoxes += quantity;
    this.storage.saveUserData(userId, userData);

    // Create purchase embed
    const displayName = (context.user as any).globalName || context.user.username;
    const userAvatarUrl = context.user.displayAvatarURL({ size: 128 });
    const remainingPoints = userData.points;
    
    const embed = new EmbedBuilder()
      .setTitle('Loot Box Purchase')
      .setDescription(`**${displayName}** has bought\n**${quantity} loot boxes** for **${totalCost} points**, they have\n**${remainingPoints} points** left`)
      .setThumbnail(userAvatarUrl)
      .setColor(0x8B4513) // Dark brown color for the background
      .setTimestamp();

    // Add treasure chest image
    embed.setImage('https://i.imgur.com/q2RquH8.jpeg');

    await interaction.reply({ embeds: [embed] });
  }

  private async handleInventory(interaction: CommandInteraction, context: CommandContext): Promise<void> {
    // Check if user has wallet addresses in their active wallet
    const activeWallet = this.storage.getActiveWallet(context.userData);
    if (!activeWallet.sparkWalletAddress || !activeWallet.taprootWalletAddress) {
      // Show wallet submission modal
      const modal = new ModalBuilder()
        .setCustomId('wallet_modal')
        .setTitle('Submit Wallet Addresses');

      const sparkWalletInput = new TextInputBuilder()
        .setCustomId('spark_wallet')
        .setLabel('Spark Wallet Address')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter your Spark wallet address')
        .setRequired(true);

      const taprootWalletInput = new TextInputBuilder()
        .setCustomId('taproot_wallet')
        .setLabel('Taproot Wallet Address')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter your Taproot wallet address')
        .setRequired(true);

      const sparkRow = new ActionRowBuilder<TextInputBuilder>().addComponents(sparkWalletInput);
      const taprootRow = new ActionRowBuilder<TextInputBuilder>().addComponents(taprootWalletInput);
      
      modal.addComponents(sparkRow, taprootRow);

      await interaction.showModal(modal);
      return;
    }

    // Show inventory
    await this.showInventory(interaction, context);
  }

  private async showInventory(interaction: CommandInteraction, context: CommandContext): Promise<void> {
    const activeWallet = this.storage.getActiveWallet(context.userData);
    const maskedSparkWallet = activeWallet.sparkWalletAddress 
      ? this.maskWalletAddress(activeWallet.sparkWalletAddress)
      : 'Not set';
    
    const maskedTaprootWallet = activeWallet.taprootWalletAddress 
      ? this.maskWalletAddress(activeWallet.taprootWalletAddress)
      : 'Not set';
      
    const displayName = (context.user as any).globalName || context.user.username;
    const userAvatarUrl = context.user.displayAvatarURL({ size: 128 });
    
    const embed = new EmbedBuilder()
      .setTitle(`📦 ${displayName}'s Inventory - Wallet ${context.userData.activeWallet}`)
      .setDescription(`**Spark Wallet:** \`${maskedSparkWallet}\`\n**Taproot Wallet:** \`${maskedTaprootWallet}\`\n**Points:** ${context.userData.points}`)
      .setThumbnail(userAvatarUrl)
      .setColor(0x00FF00)
      .setTimestamp();

    // Add inventory items
    const inventory = activeWallet.inventory;
    
    // Handle both old and new inventory structures
    const sparkTokens = (inventory as any).sparkTokens || 0;
    
    const items = [
      { name: '<:lootbox:1427361328808595537> Loot Boxes', value: (inventory.lootBoxes || 0).toString() },
      { name: '<:GTD:1427361313360969931> GTD Whitelist', value: (inventory.gtdWhitelist || 0).toString() },
      { name: '<:FCFS:1427361295832711280> FCFS Whitelist', value: (inventory.fcfsWhitelist || 0).toString() },
      { name: '<:airdropinventory:1427361277109469214> Airdrop Allocations', value: (inventory.airdropAllocations || 0).toString() },
      { name: '<:stonealloc10:1427361220897275924> $Stone Tokens', value: sparkTokens.toString() }
    ];

    items.forEach(item => {
      embed.addFields({ name: item.name, value: item.value, inline: true });
    });

    // Create components
    const components = [];

    // Wallet selection dropdown
    const walletSelect = new StringSelectMenuBuilder()
      .setCustomId('wallet_select')
      .setPlaceholder(`Select Wallet (Currently: Wallet ${context.userData.activeWallet})`);

    for (let i = 1; i <= context.userData.wallets.length; i++) {
      walletSelect.addOptions({
        label: `Wallet ${i}`,
        value: i.toString(),
        description: i === context.userData.activeWallet ? 'Currently Active' : 'Click to switch'
      });
    }

    const walletRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(walletSelect);
    components.push(walletRow);

    // Wallet unlock button (only show for the last wallet if it has requirements met)
    const globalState = this.storage.getGlobalState();
    const lastWallet = context.userData.wallets[context.userData.wallets.length - 1];
    const hasGTD = lastWallet.inventory.gtdWhitelist >= 1;
    const hasFCFS = lastWallet.inventory.fcfsWhitelist >= 1;
    const hasAirdrop = lastWallet.inventory.airdropAllocations >= 1;
    
    // Check if last wallet can unlock the next one
    let canUnlockNext = false;
    if (globalState.totalAirdropsDistributed >= globalState.globalAirdropLimit) {
      canUnlockNext = hasGTD && hasFCFS;
    } else {
      canUnlockNext = hasGTD && hasFCFS && hasAirdrop;
    }
    
    const nextWalletId = context.userData.wallets.length + 1;

    // Only show unlock button if user is viewing the last wallet, it can unlock the next one, and hasn't reached the 10 wallet limit
    if (canUnlockNext && context.userData.activeWallet === context.userData.wallets.length && context.userData.wallets.length < 10) {
      const unlockButton = new ButtonBuilder()
        .setCustomId(`unlock_wallet_${nextWalletId}`)
        .setLabel(`Unlock Wallet ${nextWalletId}`)
        .setStyle(ButtonStyle.Success);

      const unlockRow = new ActionRowBuilder<ButtonBuilder>().addComponents(unlockButton);
      components.push(unlockRow);
    }

    await interaction.reply({ embeds: [embed], components });
  }

  private async updateInventoryDisplay(interaction: any, context: CommandContext): Promise<void> {
    const activeWallet = this.storage.getActiveWallet(context.userData);
    const maskedSparkWallet = activeWallet.sparkWalletAddress 
      ? this.maskWalletAddress(activeWallet.sparkWalletAddress)
      : 'Not set';
    
    const maskedTaprootWallet = activeWallet.taprootWalletAddress 
      ? this.maskWalletAddress(activeWallet.taprootWalletAddress)
      : 'Not set';
      
    const displayName = (context.user as any).globalName || context.user.username;
    const userAvatarUrl = context.user.displayAvatarURL({ size: 128 });
    
    const embed = new EmbedBuilder()
      .setTitle(`📦 ${displayName}'s Inventory - Wallet ${context.userData.activeWallet}`)
      .setDescription(`**Spark Wallet:** \`${maskedSparkWallet}\`\n**Taproot Wallet:** \`${maskedTaprootWallet}\`\n**Points:** ${context.userData.points}`)
      .setThumbnail(userAvatarUrl)
      .setColor(0x00FF00)
      .setTimestamp();

    // Add inventory items
    const inventory = activeWallet.inventory;
    
    // Handle both old and new inventory structures
    const sparkTokens = (inventory as any).sparkTokens || 0;
    
    const items = [
      { name: '<:lootbox:1427361328808595537> Loot Boxes', value: (inventory.lootBoxes || 0).toString() },
      { name: '<:GTD:1427361313360969931> GTD Whitelist', value: (inventory.gtdWhitelist || 0).toString() },
      { name: '<:FCFS:1427361295832711280> FCFS Whitelist', value: (inventory.fcfsWhitelist || 0).toString() },
      { name: '<:airdropinventory:1427361277109469214> Airdrop Allocations', value: (inventory.airdropAllocations || 0).toString() },
      { name: '<:stonealloc10:1427361220897275924> $Stone Tokens', value: sparkTokens.toString() }
    ];

    items.forEach(item => {
      embed.addFields({ name: item.name, value: item.value, inline: true });
    });

    // Create components
    const components = [];

    // Wallet selection dropdown
    const walletSelect = new StringSelectMenuBuilder()
      .setCustomId('wallet_select')
      .setPlaceholder(`Select Wallet (Currently: Wallet ${context.userData.activeWallet})`);

    for (let i = 1; i <= context.userData.wallets.length; i++) {
      walletSelect.addOptions({
        label: `Wallet ${i}`,
        value: i.toString(),
        description: i === context.userData.activeWallet ? 'Currently Active' : 'Click to switch'
      });
    }

    const walletRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(walletSelect);
    components.push(walletRow);

    // Wallet unlock button (only show for the last wallet if it has requirements met)
    const globalState = this.storage.getGlobalState();
    const lastWallet = context.userData.wallets[context.userData.wallets.length - 1];
    const hasGTD = lastWallet.inventory.gtdWhitelist >= 1;
    const hasFCFS = lastWallet.inventory.fcfsWhitelist >= 1;
    const hasAirdrop = lastWallet.inventory.airdropAllocations >= 1;
    
    // Check if last wallet can unlock the next one
    let canUnlockNext = false;
    if (globalState.totalAirdropsDistributed >= globalState.globalAirdropLimit) {
      canUnlockNext = hasGTD && hasFCFS;
    } else {
      canUnlockNext = hasGTD && hasFCFS && hasAirdrop;
    }
    
    const nextWalletId = context.userData.wallets.length + 1;

    // Only show unlock button if user is viewing the last wallet, it can unlock the next one, and hasn't reached the 10 wallet limit
    if (canUnlockNext && context.userData.activeWallet === context.userData.wallets.length && context.userData.wallets.length < 10) {
      const unlockButton = new ButtonBuilder()
        .setCustomId(`unlock_wallet_${nextWalletId}`)
        .setLabel(`Unlock Wallet ${nextWalletId}`)
        .setStyle(ButtonStyle.Success);

      const unlockRow = new ActionRowBuilder<ButtonBuilder>().addComponents(unlockButton);
      components.push(unlockRow);
    }

    // Update the existing message
    await interaction.update({ embeds: [embed], components });
  }

  private async handleOpenLootBox(interaction: CommandInteraction, context: CommandContext): Promise<void> {
    const activeWallet = this.storage.getActiveWallet(context.userData);
    
    if (activeWallet.inventory.lootBoxes === 0) {
      await interaction.reply({ 
        content: '❌ You don\'t have any loot boxes to open!', 
        ephemeral: true 
      });
      return;
    }

    // Open one loot box
    const reward = await this.lootBoxManager.openLootBox(context.userId, context.userData.activeWallet);
    
    if (!reward) {
      await interaction.reply({ 
        content: '❌ Failed to open loot box. Please try again.', 
        ephemeral: true 
      });
      return;
    }

    // Create reward embed
    const displayName = (context.user as any).globalName || context.user.username;
    const userAvatarUrl = context.user.displayAvatarURL({ size: 128 });
    
    const embed = new EmbedBuilder()
      .setTitle('Loot Box Opening')
      .setDescription(`**${displayName}** has opened a Loot Box and received...`)
      .setThumbnail(userAvatarUrl)
      .setColor(0xFF8C00) // Orange color for the background
      .setTimestamp();

    // Add reward information as a field
    embed.addFields({ 
      name: '🎁 Reward Received', 
      value: `**${reward.name}**\n${reward.description}`, 
      inline: false 
    });

    // Add specific image based on reward type
    if (reward.type === 'fcfs_whitelist') {
      embed.setImage('https://i.imgur.com/5JrpGWR.jpeg');
    } else if (reward.type === 'gtd_whitelist') {
      embed.setImage('https://i.imgur.com/ovoJNRN.jpeg');
    } else if (reward.type === 'airdrop') {
      embed.setImage('https://i.imgur.com/XMpG5Lp.jpeg');
    } else if (reward.type === 'spark_tokens') {
      if (reward.tokenAmount === 10) {
        embed.setImage('https://i.imgur.com/2sDdiFi.jpeg');
      } else if (reward.tokenAmount === 20) {
        embed.setImage('https://i.imgur.com/uC9vkfX.jpeg');
      }
    }

    await interaction.reply({ embeds: [embed] });

    // Send airdrop notifications if user received an airdrop allocation
    if (reward.type === 'airdrop') {
      await this.sendAirdropNotifications(interaction, context);
    }
  }

  private async handleEditWallet(interaction: CommandInteraction, context: CommandContext): Promise<void> {
    const activeWallet = this.storage.getActiveWallet(context.userData);
    
    const modal = new ModalBuilder()
      .setCustomId('editwallet_modal')
      .setTitle(`Edit Wallet Addresses - Wallet ${context.userData.activeWallet}`);

    const sparkWalletInput = new TextInputBuilder()
      .setCustomId('spark_wallet')
      .setLabel('Spark Wallet Address')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter your Spark wallet address')
      .setValue(activeWallet.sparkWalletAddress || '')
      .setRequired(true);

    const taprootWalletInput = new TextInputBuilder()
      .setCustomId('taproot_wallet')
      .setLabel('Taproot Wallet Address')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter your Taproot wallet address')
      .setValue(activeWallet.taprootWalletAddress || '')
      .setRequired(true);

    const sparkRow = new ActionRowBuilder<TextInputBuilder>().addComponents(sparkWalletInput);
    const taprootRow = new ActionRowBuilder<TextInputBuilder>().addComponents(taprootWalletInput);
    
    modal.addComponents(sparkRow, taprootRow);

    await interaction.showModal(modal);
  }

  private async handleAddPoints(interaction: CommandInteraction, context: CommandContext): Promise<void> {
    if (!context.isAdmin) {
      await interaction.reply({ 
        content: '❌ You don\'t have permission to use this command!', 
        ephemeral: true 
      });
      return;
    }

    const targetUser = (interaction as any).options.get('user')?.user;
    const amount = (interaction as any).options.get('amount')?.value as number;

    if (!targetUser) {
      await interaction.reply({ 
        content: '❌ Invalid user!', 
        ephemeral: true 
      });
      return;
    }

    await this.pointManager.addPoints(targetUser.id, amount);
    
    await interaction.reply({ 
      content: `✅ Added ${amount} points to ${targetUser.username}!`, 
      ephemeral: true 
    });
  }

  private async handleExportWallets(interaction: CommandInteraction, context: CommandContext): Promise<void> {
    if (!context.isAdmin) {
      await interaction.reply({ 
        content: '❌ You don\'t have permission to use this command!', 
        ephemeral: true 
      });
      return;
    }

    const allUsers = this.storage.getAllUsers();
    
    // Create CSV header
    const maxWallets = Math.max(...Object.values(allUsers).map(user => user.wallets.length), 1);
    let csvHeader = 'User ID,Username';
    
    // Add columns for each wallet
    for (let i = 1; i <= maxWallets; i++) {
      csvHeader += `,W${i}_Spark,W${i}_Taproot,W${i}_LootBoxes,W${i}_GTD,W${i}_FCFS,W${i}_Airdrop,W${i}_SparkTokens`;
    }
    
    // Create CSV rows
    const csvRows = Object.entries(allUsers).map(([userId, userData]) => {
      let row = `${userId},"${userData.username}"`;
      
      // Add data for each wallet
      for (let i = 1; i <= maxWallets; i++) {
        const wallet = userData.wallets.find(w => w.walletId === i);
        if (wallet) {
          row += `,"${wallet.sparkWalletAddress || 'Not set'}","${wallet.taprootWalletAddress || 'Not set'}",${wallet.inventory.lootBoxes},${wallet.inventory.gtdWhitelist},${wallet.inventory.fcfsWhitelist},${wallet.inventory.airdropAllocations},${wallet.inventory.sparkTokens}`;
        } else {
          row += ',"Not set","Not set",0,0,0,0,0';
        }
      }
      
      return row;
    });
    
    const csvContent = [csvHeader, ...csvRows].join('\n');

    const attachment = new AttachmentBuilder(
      Buffer.from(csvContent, 'utf8'),
      { name: 'wallets_with_inventory.csv' }
    );

    await interaction.reply({ 
      content: `📋 Exported ${Object.keys(allUsers).length} users with wallet addresses and inventory data:`,
      files: [attachment],
      ephemeral: true 
    });
  }

  private async handleBalance(interaction: CommandInteraction, context: CommandContext): Promise<void> {
    // Handle both old and new inventory structures for spark tokens
    const activeWallet = this.storage.getActiveWallet(context.userData);
    const inventory = activeWallet.inventory;
    const sparkTokens = (inventory as any).sparkTokens || 
                       ((inventory as any).sparkTokens10 || 0) + 
                       ((inventory as any).sparkTokens20 || 0);

    const displayName = (context.user as any).globalName || context.user.username;
    const userAvatarUrl = context.user.displayAvatarURL({ size: 128 });
    
    const embed = new EmbedBuilder()
      .setTitle('💰 Spark Balance')
      .setDescription(`**${displayName}**, here's your current balance:`)
      .setThumbnail(userAvatarUrl)
      .addFields(
        { name: '🪙 $Stone Points', value: `${context.userData.points}`, inline: true },
        { name: '🪙 $Stone Tokens', value: `${sparkTokens}`, inline: true }
      )
      .setColor(0xFFD700)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  private async handleAnnounce(interaction: CommandInteraction, context: CommandContext): Promise<void> {
    // Check if user is admin
    if (!context.isAdmin) {
      await interaction.reply({ 
        content: '❌ Only admins can use this command!', 
        ephemeral: true 
      });
      return;
    }

    // Create modal for announcement
    const modal = new ModalBuilder()
      .setCustomId('announce_modal')
      .setTitle('Create Announcement');

    // Title input
    const titleInput = new TextInputBuilder()
      .setCustomId('announce_title')
      .setLabel('Title')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter announcement title...')
      .setRequired(true);

    // Message input (multi-line)
    const messageInput = new TextInputBuilder()
      .setCustomId('announce_message')
      .setLabel('Message')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter announcement message... (Press Enter for new lines)')
      .setRequired(true);

    // Role input
    const roleInput = new TextInputBuilder()
      .setCustomId('announce_role')
      .setLabel('Role ID (optional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter role ID to mention (optional)')
      .setRequired(false);

    // Reactions input
    const reactionsInput = new TextInputBuilder()
      .setCustomId('announce_reactions')
      .setLabel('Reactions (optional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('👍,❤️,🔥,💯,🎉 (up to 5 reactions)')
      .setRequired(false);

    // Images input (logo and picture combined)
    const imagesInput = new TextInputBuilder()
      .setCustomId('announce_images')
      .setLabel('Images (optional)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Logo URL (first line) and Picture URL (second line) - one per line')
      .setRequired(false);

    // Add inputs to modal
    const titleRow = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
    const messageRow = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
    const roleRow = new ActionRowBuilder<TextInputBuilder>().addComponents(roleInput);
    const reactionsRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reactionsInput);
    const imagesRow = new ActionRowBuilder<TextInputBuilder>().addComponents(imagesInput);

    modal.addComponents(titleRow, messageRow, roleRow, reactionsRow, imagesRow);

    await interaction.showModal(modal);
  }

  private async handleEdit(interaction: CommandInteraction, context: CommandContext): Promise<void> {
    // Check if user is admin
    if (!context.isAdmin) {
      await interaction.reply({ 
        content: '❌ Only admins can use this command!', 
        ephemeral: true 
      });
      return;
    }

    const messageId = (interaction as any).options.get('message_id')?.value as string;

    try {
      // Fetch the message to edit
      const message = await interaction.channel?.messages.fetch(messageId);
      if (!message) {
        await interaction.reply({ 
          content: '❌ Message not found! Make sure the message ID is correct and the message is in this channel.', 
          ephemeral: true 
        });
        return;
      }

      // Check if the message has an embed (announcement)
      if (!message.embeds || message.embeds.length === 0) {
        await interaction.reply({ 
          content: '❌ This message is not an announcement! Only announcement messages can be edited.', 
          ephemeral: true 
        });
        return;
      }

      const originalEmbed = message.embeds[0];
      
      // Extract current values
      const currentTitle = originalEmbed.title || '';
      const currentMessage = originalEmbed.description || '';
      const currentRoleId = message.content ? message.content.replace(/[<@&>]/g, '') : '';
      const currentLogoUrl = originalEmbed.thumbnail?.url || '';
      const currentPictureUrl = originalEmbed.image?.url || '';
      
      // Get current reactions
      const currentReactions = message.reactions.cache.map(reaction => reaction.emoji.name || reaction.emoji.toString()).join(', ');

      // Create modal for editing
      const modal = new ModalBuilder()
        .setCustomId(`edit_modal_${messageId}`)
        .setTitle('Edit Announcement');

      // Title input (pre-filled)
      const titleInput = new TextInputBuilder()
        .setCustomId('edit_title')
        .setLabel('Title')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter announcement title...')
        .setValue(currentTitle)
        .setRequired(true);

      // Message input (pre-filled, multi-line)
      const messageInput = new TextInputBuilder()
        .setCustomId('edit_message')
        .setLabel('Message')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Enter announcement message... (Press Enter for new lines)')
        .setValue(currentMessage)
        .setRequired(true);

      // Role input (pre-filled)
      const roleInput = new TextInputBuilder()
        .setCustomId('edit_role')
        .setLabel('Role ID (optional)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter role ID to mention (optional)')
        .setValue(currentRoleId)
        .setRequired(false);

      // Reactions input (pre-filled)
      const reactionsInput = new TextInputBuilder()
        .setCustomId('edit_reactions')
        .setLabel('Reactions (optional)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('👍,❤️,🔥,💯,🎉 (up to 5 reactions)')
        .setValue(currentReactions)
        .setRequired(false);

      // Images input (logo and picture combined, pre-filled)
      const imagesInput = new TextInputBuilder()
        .setCustomId('edit_images')
        .setLabel('Images (optional)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Logo URL (first line) and Picture URL (second line) - one per line')
        .setValue(`${currentLogoUrl}\n${currentPictureUrl}`.trim())
        .setRequired(false);

      // Add inputs to modal
      const titleRow = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
      const messageRow = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
      const roleRow = new ActionRowBuilder<TextInputBuilder>().addComponents(roleInput);
      const reactionsRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reactionsInput);
      const imagesRow = new ActionRowBuilder<TextInputBuilder>().addComponents(imagesInput);

      modal.addComponents(titleRow, messageRow, roleRow, reactionsRow, imagesRow);

      await interaction.showModal(modal);

    } catch (error) {
      console.error('Error preparing edit modal:', error);
      await interaction.reply({ 
        content: '❌ Failed to prepare edit form. Please check the message ID and try again.', 
        ephemeral: true 
      });
    }
  }

  private async handleInvite(interaction: CommandInteraction, context: CommandContext): Promise<void> {
    try {
      // Check if user already has an active invite
      if (context.userData.inviteData.inviteCode) {
        // User already has an invite, show it (don't create new one)
        const inviteUrl = `https://discord.gg/${context.userData.inviteData.inviteCode}`;
        const embed = new EmbedBuilder()
          .setTitle('🔗 Your Invitation Link')
          .setDescription(`**Your personal invite link:**\n${inviteUrl}\n\n**Stats:**\n• Uses: ${context.userData.inviteData.uses}\n• Points Earned: ${context.userData.inviteData.pointsEarned}\n• Invited Users: ${context.userData.inviteData.invitedUsers.length}`)
          .setColor(0x00FF00)
          .setFooter({ text: 'Share this link to earn 10 $Stone Points per successful invite!' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      // Create new invite
      const guild = interaction.guild;
      if (!guild) {
        await interaction.reply({ 
          content: '❌ This command can only be used in a server!', 
          ephemeral: true 
        });
        return;
      }

      // Find a text channel to create invite in
      const textChannel = guild.channels.cache.find(channel => 
        channel.type === 0 && channel.permissionsFor(guild.members.me!)?.has('CreateInstantInvite')
      ) as any;
      
      if (!textChannel) {
        await interaction.reply({ 
          content: '❌ No suitable channel found to create invite. Please contact an admin.', 
          ephemeral: true 
        });
        return;
      }

      // Create invite with permanent expiration and unlimited uses
      const invite = await textChannel.createInvite({
        maxAge: 0, // 0 = permanent (no expiration)
        maxUses: 0, // 0 = unlimited uses
        unique: true,
        reason: `Invite created by ${context.user.username} via bot`
      });

      // Update user data with new invite
      context.userData.inviteData.inviteCode = invite.code;
      context.userData.inviteData.uses = 0;
      context.userData.inviteData.pointsEarned = 0;
      context.userData.inviteData.invitedUsers = [];
      this.storage.saveUserData(context.userId, context.userData);

      // Create response embed
      const inviteUrl = `https://discord.gg/${invite.code}`;
      const embed = new EmbedBuilder()
        .setTitle('🔗 Your New Invitation Link')
        .setDescription(`**Your personal invite link:**\n${inviteUrl}\n\n**Details:**\n• Expires: Never (Permanent)\n• Max uses: Unlimited\n• Points per invite: 10 points\n\n**Stats:**\n• Uses: 0\n• Points Earned: 0\n• Invited Users: 0`)
        .setColor(0x00FF00)
        .setFooter({ text: 'Share this link to earn 10 points when someone joins!' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
      console.log(`🔗 Created new invite for ${context.user.username}: ${invite.code}`);
    } catch (error) {
      console.error('Error creating invite:', error);
      await interaction.reply({ 
        content: '❌ Failed to create invitation link. Please try again later.', 
        ephemeral: true 
      });
    }
  }


  private async handleAddItems(interaction: CommandInteraction, context: CommandContext): Promise<void> {
    if (!context.isAdmin) {
      await interaction.reply({ 
        content: '❌ You don\'t have permission to use this command!', 
        ephemeral: true 
      });
      return;
    }

    const targetUser = (interaction as any).options.get('user')?.user;
    const itemType = (interaction as any).options.get('item')?.value as string;
    const amount = (interaction as any).options.get('amount')?.value as number;

    if (!targetUser) {
      await interaction.reply({ 
        content: '❌ User not found!', 
        ephemeral: true 
      });
      return;
    }

    let userData = this.storage.getUserData(targetUser.id);
    if (!userData) {
      userData = this.storage.createUserData(targetUser.id, targetUser.username);
    }

    const activeWallet = this.storage.getActiveWallet(userData);
    
    // Add items to active wallet
    switch (itemType) {
      case 'gtd_whitelist':
        activeWallet.inventory.gtdWhitelist = Math.min(activeWallet.inventory.gtdWhitelist + amount, 1);
        break;
      case 'fcfs_whitelist':
        activeWallet.inventory.fcfsWhitelist = Math.min(activeWallet.inventory.fcfsWhitelist + amount, 1);
        break;
      case 'airdrop':
        activeWallet.inventory.airdropAllocations = Math.min(activeWallet.inventory.airdropAllocations + amount, 1);
        // Update global airdrop counter
        const globalState = this.storage.getGlobalState();
        globalState.totalAirdropsDistributed = Math.min(globalState.totalAirdropsDistributed + amount, globalState.globalAirdropLimit);
        this.storage.saveGlobalState(globalState);
        break;
      case 'spark_tokens':
        activeWallet.inventory.sparkTokens += amount;
        break;
    }

    this.storage.saveUserData(targetUser.id, userData);

    await interaction.reply({ 
      content: `✅ Added ${amount} ${itemType.replace('_', ' ')} to ${targetUser.username}'s Wallet ${userData.activeWallet}!`, 
      ephemeral: true 
    });
  }

  private async handlePanel(interaction: CommandInteraction, context: CommandContext): Promise<void> {
    // Check if user is admin
    if (!context.isAdmin) {
      await interaction.reply({ 
        content: '❌ Only admins can use this command!', 
        ephemeral: true 
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('Welcome to the *Spark Stones ecosystem 💠')
      .setDescription(`Our server has a Loot Box system where you can get GTD WL, FCFS WL, a Spark Stone airdrop, and an allocation of our $STONE token.

Earn points by being active, inviting friends, participating in special events, and exchange your points for Loot Boxes.

💰 **Point Earning System**
🔗 Discord Invitations: Earn 10 $Stone Points for each successful invite
🌅 GM Messages: Earn 1 $Stone Point for saying "gm" in the designated channel (once per 24 hours)
📢 Announcement Reactions: Earn 1 $Stone Point per unique reaction on admin announcements
🎁 Loot Box Rewards: Earn $Stone Tokens and other items from loot boxes

🎁 **Loot Box System**
Purchase: Buy loot boxes for 5 $Stone Points each
Smart Rewards: Intelligent reward distribution based on wallet requirements
Reward Types:
🎫 GTD Whitelist (20% chance)
🎫 FCFS Whitelist (50% chance)
💰 Airdrop Allocation (3% chance, limited to 100 total)
🪙 10 $Stone Tokens (17% chance)
🪙 20 $Stone Tokens (10% chance)

👥 **Commands**
🔗 /invite - Get your personal invitation link to earn $Stone Points
📦 /inventory - View your inventory and manage multiple wallets
🎁 /buylootbox [quantity] - Buy loot boxes with your $Stone Points
🎲 /openlootbox - Open your loot boxes to get rewards
💰 /balance - Check your current $Stone Points balance
🏦 /editwallet - Set or edit your wallet addresses
❓ /help - View all available commands and information`)
      .setColor(0x00FF00)
      .setTimestamp();

    // Create buttons
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('panel_invite')
          .setLabel('🔗 invite')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('panel_inventory')
          .setLabel('📦 inventory')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('panel_buylootbox')
          .setLabel('🎁 buylootbox')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('panel_openlootbox')
          .setLabel('🎲 openlootbox')
          .setStyle(ButtonStyle.Primary)
      );

    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('panel_balance')
          .setLabel('💰 balance')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('panel_editwallet')
          .setLabel('🏦 editwallet')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('panel_help')
          .setLabel('❓ help')
          .setStyle(ButtonStyle.Primary)
      );

    // Send ephemeral confirmation to admin first
    await interaction.reply({ 
      content: '✅ Panel displayed successfully!', 
      ephemeral: true 
    });

    // Send the panel directly to the channel (completely anonymous)
    if (interaction.channel && 'send' in interaction.channel) {
      await (interaction.channel as any).send({ 
        embeds: [embed], 
        components: [row1, row2] 
      });
    }
  }

  // Utility methods

  private async sendAirdropNotifications(interaction: CommandInteraction, context: CommandContext): Promise<void> {
    try {
      const displayName = (context.user as any).globalName || context.user.username;
      const activeWallet = this.storage.getActiveWallet(context.userData);
      const maskedWallet = activeWallet.sparkWalletAddress 
        ? this.maskWalletAddress(activeWallet.sparkWalletAddress)
        : 'No wallet set';

      // Send DM to the user who got the airdrop
      try {
        await context.user.send('You have acquired an airdrop allocation from a lootbox.');
      } catch (error) {
        console.error('Failed to send DM to user:', error);
      }

      // Send admin notification to designated channel
      const airdropChannelId = process.env.AIRDROP_NOTIFICATION_CHANNEL_ID;
      if (airdropChannelId) {
        const channel = interaction.client.channels.cache.get(airdropChannelId);
        if (channel && 'send' in channel) {
          const adminMessage = `User **${displayName}** (\`${maskedWallet}\`) has opened a lootbox and received an airdrop allocation. Tagging <@${context.userId}>.`;
          await (channel as any).send(adminMessage);
        }
      }

      console.log(`🎉 Airdrop allocation given to ${displayName} (${context.userId})`);
    } catch (error) {
      console.error('Error sending airdrop notifications:', error);
    }
  }

  private maskWalletAddress(address: string): string {
    if (!address || address.length < 8) return address;
    
    const start = address.substring(0, 4);
    const end = address.substring(address.length - 4);
    const middle = '...';
    
    return `${start}${middle}${end}`;
  }

  private isAdmin(userId: string, interaction?: CommandInteraction): boolean {
    // Add your admin user IDs here
    const adminIds = process.env.ADMIN_IDS?.split(',') || [];
    
    // Hardcoded admin user IDs
    const hardcodedAdmins = [
      '410662767981232128', // Main admin
      '911029309286776894'  // stonetoshi
    ];
    
    // Check if user has admin role (1422925268158513212)
    if (interaction && interaction.guild) {
      const member = interaction.guild.members.cache.get(userId);
      if (member && member.roles.cache.has('1422925268158513212')) {
        return true;
      }
    }
    
    return adminIds.includes(userId) || hardcodedAdmins.includes(userId);
  }

  // Modal handlers
  async handleModal(interaction: any): Promise<void> {
    const customId = interaction.customId;
    
    if (customId === 'wallet_modal') {
      await this.handleWalletModal(interaction);
    } else if (customId === 'editwallet_modal') {
      await this.handleEditWalletModal(interaction);
    } else if (customId === 'twitter_link_modal') {
      await this.handleTwitterLinkModal(interaction);
    } else if (customId === 'announce_modal') {
      await this.handleAnnounceModal(interaction);
    } else if (customId.startsWith('edit_modal_')) {
      await this.handleEditModal(interaction);
    }
  }

  // Button and select menu handlers
  async handleComponentInteraction(interaction: any): Promise<void> {
    const customId = interaction.customId;
    
    if (customId === 'wallet_select') {
      await this.handleWalletSelect(interaction);
    } else if (customId.startsWith('unlock_wallet_')) {
      await this.handleUnlockWallet(interaction);
    }
  }

  private async handleWalletSelect(interaction: any): Promise<void> {
    const selectedWalletId = parseInt(interaction.values[0]);
    const userId = interaction.user.id;
    
    let userData = this.storage.getUserData(userId);
    if (!userData) {
      userData = this.storage.createUserData(userId, interaction.user.username);
    }

    // Check if the selected wallet exists
    const targetWallet = this.storage.getWallet(userData, selectedWalletId);
    if (!targetWallet) {
      await interaction.reply({ 
        content: '❌ Wallet not found!', 
        ephemeral: true 
      });
      return;
    }

    // Switch to the selected wallet
    userData.activeWallet = selectedWalletId;
    this.storage.saveUserData(userId, userData);

    // Create context for updated inventory
    const context: CommandContext = {
      user: interaction.user,
      userId,
      userData,
      isAdmin: this.isAdmin(userId, interaction)
    };

    // Update the inventory display live
    await this.updateInventoryDisplay(interaction, context);
  }

  private async handleUnlockWallet(interaction: any): Promise<void> {
    const walletId = parseInt(interaction.customId.split('_')[2]);
    const userId = interaction.user.id;
    
    let userData = this.storage.getUserData(userId);
    if (!userData) {
      userData = this.storage.createUserData(userId, interaction.user.username);
    }

    // Check if user can unlock this wallet
    const globalState = this.storage.getGlobalState();
    const canUnlock = this.storage.canUnlockNextWallet(userData, globalState);
    
    if (!canUnlock) {
      await interaction.reply({ 
        content: '❌ You don\'t meet the requirements to unlock this wallet!', 
        ephemeral: true 
      });
      return;
    }

    // Check wallet limit (maximum 10 wallets)
    if (userData.wallets.length >= 10) {
      await interaction.reply({ 
        content: '❌ You have reached the maximum limit of 10 wallets!', 
        ephemeral: true 
      });
      return;
    }

    // Create the new wallet
    const newWallet = this.storage.createNewWallet(userData);
    if (!newWallet) {
      await interaction.reply({ 
        content: '❌ Cannot create more wallets. Maximum limit of 10 wallets reached!', 
        ephemeral: true 
      });
      return;
    }
    
    userData.activeWallet = newWallet.walletId;
    this.storage.saveUserData(userId, userData);

    // Show wallet setup modal for the new wallet
    const modal = new ModalBuilder()
      .setCustomId('wallet_modal')
      .setTitle(`Submit Wallet Addresses - Wallet ${newWallet.walletId}`);

    const sparkWalletInput = new TextInputBuilder()
      .setCustomId('spark_wallet')
      .setLabel('Spark Wallet Address')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter your Spark wallet address')
      .setRequired(true);

    const taprootWalletInput = new TextInputBuilder()
      .setCustomId('taproot_wallet')
      .setLabel('Taproot Wallet Address')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter your Taproot wallet address')
      .setRequired(true);

    const sparkRow = new ActionRowBuilder<TextInputBuilder>().addComponents(sparkWalletInput);
    const taprootRow = new ActionRowBuilder<TextInputBuilder>().addComponents(taprootWalletInput);
    
    modal.addComponents(sparkRow, taprootRow);

    await interaction.showModal(modal);
  }


  private async handleWalletModal(interaction: any): Promise<void> {
    const sparkWalletAddress = interaction.fields.getTextInputValue('spark_wallet');
    const taprootWalletAddress = interaction.fields.getTextInputValue('taproot_wallet');
    const userId = interaction.user.id;
    
    let userData = this.storage.getUserData(userId);
    if (!userData) {
      userData = this.storage.createUserData(userId, interaction.user.username);
    }

    // Update the active wallet with the new addresses
    const activeWallet = this.storage.getActiveWallet(userData);
    activeWallet.sparkWalletAddress = sparkWalletAddress;
    activeWallet.taprootWalletAddress = taprootWalletAddress;
    
    this.storage.saveUserData(userId, userData);

    // Create context for updated inventory
    const context: CommandContext = {
      user: interaction.user,
      userId,
      userData,
      isAdmin: this.isAdmin(userId, interaction)
    };

    // Try to update the inventory display live, but handle errors gracefully
    try {
      await this.updateInventoryDisplay(interaction, context);
    } catch (error) {
      // If the original message is no longer available, just reply with success message
      await interaction.reply({ 
        content: `✅ Wallet addresses saved for Wallet ${userData.activeWallet}!`, 
        ephemeral: true 
      });
    }
  }

  private async handleEditWalletModal(interaction: any): Promise<void> {
    const sparkWalletAddress = interaction.fields.getTextInputValue('spark_wallet');
    const taprootWalletAddress = interaction.fields.getTextInputValue('taproot_wallet');
    const userId = interaction.user.id;
    
    let userData = this.storage.getUserData(userId);
    if (!userData) {
      userData = this.storage.createUserData(userId, interaction.user.username);
    }

    // Update the active wallet with the new addresses
    const activeWallet = this.storage.getActiveWallet(userData);
    activeWallet.sparkWalletAddress = sparkWalletAddress;
    activeWallet.taprootWalletAddress = taprootWalletAddress;
    
    this.storage.saveUserData(userId, userData);

    await interaction.reply({ 
      content: `✅ Wallet addresses updated for Wallet ${userData.activeWallet}!`, 
      ephemeral: true 
    });
  }



  private async handleHelp(interaction: CommandInteraction, context: CommandContext): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('🆘 $Stone Bot Help')
      .setDescription('Welcome to the $Stone Bot! Here are all the available commands and features:')
      .setColor(0x00FF00)
      .setTimestamp();

    // Commands section
    embed.addFields(
      {
        name: '📋 **Available Commands**',
        value: [
          '**`/balance`** - View your $Stone Points and $Stone Tokens',
          '**`/inventory`** - View your multi-wallet inventory and items',
          '**`/buylootbox`** - Purchase loot boxes with $Stone Points',
          '**`/openlootbox`** - Open your loot boxes to get rewards',
          '**`/invite`** - Get your personal invitation link to earn points',
          '**`/editwallet`** - Edit your wallet addresses',
          '**`/help`** - Show this help message'
        ].join('\n'),
        inline: false
      },
      {
        name: '💰 **How to Earn $Stone Points**',
        value: [
          '**Invite Friends:** 10 points per successful invite',
          '**GM Messages:** 1 point for saying "gm" in the designated channel (once per 24 hours)',
          '**Announcement Reactions:** 1 point per unique reaction on admin announcements'
        ].join('\n'),
        inline: false
      },
      {
        name: '🎁 **Loot Box Rewards**',
        value: [
          '**GTD Whitelist** - Guaranteed whitelist allocation (20% chance)',
          '**FCFS Whitelist** - First come first serve whitelist (50% chance)',
          '**Airdrop Allocations** - Airdrop allocation (3% chance, Limited to 100 globally)',
          '**$Stone Tokens** - 10 tokens (17% chance) or 20 tokens (10% chance)'
        ].join('\n'),
        inline: false
      },
      {
        name: '👛 **Multi-Wallet System**',
        value: [
          '**Wallet 1:** Available to all users',
          '**Wallet 2+:** Requires 1 GTD + 1 FCFS + 1 Airdrop (or 1 GTD + 1 FCFS if 100 airdrops distributed)',
          '**Independent Inventories:** Each wallet has its own separate inventory',
          '**Wallet Switching:** Use the dropdown in `/inventory` to switch between wallets'
        ].join('\n'),
        inline: false
      },
      {
        name: '📝 **Important Notes**',
        value: [
          '• Each wallet can hold max 1 GTD, 1 FCFS, and 1 Airdrop',
          '• Only 100 airdrops total across all users and wallets',
          '• Loot boxes cost 5 $Stone Points each',
          '• Invite links are permanent and unlimited use',
          '• Duplicate users joining = 0 points (no farming)',
          '• Bot accounts joining = 0 points'
        ].join('\n'),
        inline: false
      }
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async handleTwitterLinkModal(interaction: any): Promise<void> {
    const twitterLink = interaction.fields.getTextInputValue('twitter_link');
    
    await interaction.reply({ 
      content: `🔗 **Twitter link ready!**\n\nClick the link below to open Twitter in your browser:\n${twitterLink}\n\n**Note:** The link will open in a new tab. You can now like, retweet, or comment on the post!`, 
      ephemeral: true 
    });
  }

  private async handleAnnounceModal(interaction: any): Promise<void> {
    // Check if user is admin
    const userId = interaction.user.id;
    const isAdmin = this.isAdmin(userId, interaction);
    
    if (!isAdmin) {
      await interaction.reply({ 
        content: '❌ Only admins can use this command!', 
        ephemeral: true 
      });
      return;
    }

    const title = interaction.fields.getTextInputValue('announce_title');
    const message = interaction.fields.getTextInputValue('announce_message');
    const roleId = interaction.fields.getTextInputValue('announce_role');
    const reactionsInput = interaction.fields.getTextInputValue('announce_reactions');
    const imagesInput = interaction.fields.getTextInputValue('announce_images');
    
    // Parse images (logo on first line, picture on second line)
    const imageLines = imagesInput ? imagesInput.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0) : [];
    const logoUrl = imageLines[0] || '';
    const pictureUrl = imageLines[1] || '';

    // Parse reactions (up to 5)
    let reactions: string[] = [];
    if (reactionsInput) {
      reactions = reactionsInput.split(',').map((r: string) => r.trim()).filter((r: string) => r.length > 0).slice(0, 5);
    }

    // Send the announcement message
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(message)
      .setColor(0x808080) // Changed to grey
      .setTimestamp()
      .setFooter({ text: 'React to earn points!' });

    // Add logo to top right (thumbnail)
    if (logoUrl) {
      embed.setThumbnail(logoUrl);
    }

    // Add picture below message (image)
    if (pictureUrl) {
      embed.setImage(pictureUrl);
    }

    // Prepare the message content with optional role mention
    let messageContent = '';
    if (roleId) {
      messageContent = `<@&${roleId}>`;
    }

    // Send ephemeral confirmation to admin first
    await interaction.reply({ 
      content: '✅ Announcement sent successfully!', 
      ephemeral: true 
    });

    // Send the announcement directly to the channel (completely anonymous)
    const sentMessage = await interaction.channel?.send({ 
      content: messageContent,
      embeds: [embed]
    });

    // Add reactions to the message
    for (const reaction of reactions) {
      try {
        await sentMessage.react(reaction);
      } catch (error) {
        console.error(`Failed to add reaction ${reaction}:`, error);
      }
    }

    // Store announcement data for tracking
    if (reactions.length > 0) {
      this.storage.saveAnnouncementData(sentMessage.id, {
        messageId: sentMessage.id,
        channelId: sentMessage.channelId,
        reactions: reactions,
        createdAt: Date.now()
      });
    }

    const logoInfo = logoUrl ? ' with logo' : '';
    const pictureInfo = pictureUrl ? ' with picture' : '';
    console.log(`📢 Admin ${interaction.user.username} sent announcement "${title}" with ${reactions.length} reactions${logoInfo}${pictureInfo}`);
  }

  private async handleEditModal(interaction: any): Promise<void> {
    // Check if user is admin
    const userId = interaction.user.id;
    const isAdmin = this.isAdmin(userId, interaction);
    
    if (!isAdmin) {
      await interaction.reply({ 
        content: '❌ Only admins can use this command!', 
        ephemeral: true 
      });
      return;
    }

    const customId = interaction.customId;
    const messageId = customId.replace('edit_modal_', '');

    const newTitle = interaction.fields.getTextInputValue('edit_title');
    const newMessage = interaction.fields.getTextInputValue('edit_message');
    const newRoleId = interaction.fields.getTextInputValue('edit_role');
    const newReactionsInput = interaction.fields.getTextInputValue('edit_reactions');
    const newImagesInput = interaction.fields.getTextInputValue('edit_images');
    
    // Parse images (logo on first line, picture on second line)
    const imageLines = newImagesInput ? newImagesInput.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0) : [];
    const newLogoUrl = imageLines[0] || '';
    const newPictureUrl = imageLines[1] || '';

    try {
      // Fetch the message to edit
      const message = await interaction.channel?.messages.fetch(messageId);
      if (!message) {
        await interaction.reply({ 
          content: '❌ Message not found! The message may have been deleted.', 
          ephemeral: true 
        });
        return;
      }

      // Create new embed with updated content
      const newEmbed = new EmbedBuilder()
        .setTitle(newTitle)
        .setDescription(newMessage)
        .setColor(0x808080) // Changed to grey
        .setTimestamp()
        .setFooter({ text: 'React to earn points!' });

      // Update logo (thumbnail)
      if (newLogoUrl) {
        newEmbed.setThumbnail(newLogoUrl);
      }

      // Update picture (image)
      if (newPictureUrl) {
        newEmbed.setImage(newPictureUrl);
      }

      // Prepare the message content with optional role mention
      let messageContent = '';
      if (newRoleId) {
        messageContent = `<@&${newRoleId}>`;
      }

      // Update the message
      await message.edit({ 
        content: messageContent,
        embeds: [newEmbed]
      });

      // Handle reactions - preserve existing counts
      if (newReactionsInput) {
        // Parse new reactions
        const newReactions = newReactionsInput.split(',').map((r: string) => r.trim()).filter((r: string) => r.length > 0).slice(0, 5);
        
        // Get current reactions and their counts
        const currentReactions = message.reactions.cache;
        const reactionCounts = new Map<string, number>();
        
        // Store current reaction counts
        for (const [emoji, reaction] of currentReactions) {
          reactionCounts.set(emoji, reaction.count);
        }
        
        // Remove reactions that are not in the new list
        for (const [emoji, reaction] of currentReactions) {
          if (!newReactions.includes(emoji)) {
            try {
              await reaction.remove();
            } catch (error) {
              console.error(`Failed to remove reaction ${emoji}:`, error);
            }
          }
        }
        
        // Add new reactions (only if they don't already exist)
        for (const reaction of newReactions) {
          if (!currentReactions.has(reaction)) {
            try {
              await message.react(reaction);
            } catch (error) {
              console.error(`Failed to add reaction ${reaction}:`, error);
            }
          }
        }

        // Update announcement data for tracking
        this.storage.saveAnnouncementData(messageId, {
          messageId: messageId,
          channelId: message.channelId,
          reactions: newReactions,
          createdAt: Date.now()
        });
      }

      console.log(`✏️ Admin ${interaction.user.username} edited announcement ${messageId}`);

      await interaction.reply({ 
        content: `✅ Successfully edited announcement!`, 
        ephemeral: true 
      });

    } catch (error) {
      console.error('Error editing announcement:', error);
      await interaction.reply({ 
        content: '❌ Failed to edit announcement. Please try again.', 
        ephemeral: true 
      });
    }
  }

  private async handleExportData(interaction: CommandInteraction, context: CommandContext): Promise<void> {
    if (!context.isAdmin) {
      await interaction.reply({ 
        content: '❌ You don\'t have permission to use this command!', 
        ephemeral: true 
      });
      return;
    }

    try {
      // Get all user data
      const allUsers = this.storage.getAllUsers();
      const globalState = this.storage.getGlobalState();
      const config = this.storage.getConfig();
      
      // Create comprehensive export data
      const exportData = {
        timestamp: new Date().toISOString(),
        totalUsers: Object.keys(allUsers).length,
        globalState,
        config,
        users: allUsers,
        // Add summary statistics
        summary: {
          totalPoints: Object.values(allUsers).reduce((sum, user) => sum + user.points, 0),
          totalInvites: Object.values(allUsers).reduce((sum, user) => sum + user.inviteData.uses, 0),
          totalLootBoxes: Object.values(allUsers).reduce((sum, user) => 
            sum + user.wallets.reduce((walletSum, wallet) => walletSum + wallet.inventory.lootBoxes, 0), 0),
          topUsers: Object.entries(allUsers)
            .map(([userId, userData]) => ({
              userId,
              username: userData.username,
              points: userData.points,
              invites: userData.inviteData.uses,
              inviteCode: userData.inviteData.inviteCode
            }))
            .sort((a, b) => b.points - a.points)
            .slice(0, 20)
        }
      };

      // Create JSON file
      const jsonContent = JSON.stringify(exportData, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `spark-bot-data-export-${timestamp}.json`;

      const attachment = new AttachmentBuilder(
        Buffer.from(jsonContent, 'utf8'),
        { name: filename }
      );

      await interaction.reply({ 
        content: `📊 **Data Export Complete!**\n\n**Summary:**\n• Total Users: ${exportData.totalUsers}\n• Total Points: ${exportData.summary.totalPoints}\n• Total Invites: ${exportData.summary.totalInvites}\n• Total Loot Boxes: ${exportData.summary.totalLootBoxes}\n\n**Top 5 Users by Points:**\n${exportData.summary.topUsers.slice(0, 5).map((user, i) => `${i+1}. ${user.username}: ${user.points} points (${user.invites} invites)`).join('\n')}\n\n**File:** \`${filename}\``,
        files: [attachment],
        ephemeral: true 
      });

      console.log(`📊 Admin ${context.user.username} exported data: ${exportData.totalUsers} users, ${exportData.summary.totalPoints} total points`);
    } catch (error) {
      console.error('Error exporting data:', error);
      await interaction.reply({ 
        content: '❌ Failed to export data. Please try again.', 
        ephemeral: true 
      });
    }
  }

  private async handleImportData(interaction: CommandInteraction, context: CommandContext): Promise<void> {
    if (!context.isAdmin) {
      await interaction.reply({ 
        content: '❌ You don\'t have permission to use this command!', 
        ephemeral: true 
      });
      return;
    }

    try {
      const attachment = (interaction as any).options.getAttachment('file');
      
      if (!attachment || !attachment.name.endsWith('.json')) {
        await interaction.reply({ 
          content: '❌ Please upload a valid JSON file!', 
          ephemeral: true 
        });
        return;
      }

      // Download and parse the file
      const response = await fetch(attachment.url);
      const jsonContent = await response.text();
      const importData = JSON.parse(jsonContent);

      // Validate the data structure
      if (!importData.users || typeof importData.users !== 'object') {
        await interaction.reply({ 
          content: '❌ Invalid data format! The file must contain user data.', 
          ephemeral: true 
        });
        return;
      }

      // Import users
      let importedCount = 0;
      let updatedCount = 0;
      
      for (const [userId, userData] of Object.entries(importData.users)) {
        const existingUser = this.storage.getUserData(userId);
        if (existingUser) {
          updatedCount++;
        } else {
          importedCount++;
        }
        this.storage.saveUserData(userId, userData as any);
      }

      // Import global state if available
      if (importData.globalState) {
        this.storage.saveGlobalState(importData.globalState);
      }

      // Import config if available
      if (importData.config) {
        // Note: Config import would need to be implemented in StorageManager
        console.log('Config import not yet implemented');
      }

      await interaction.reply({ 
        content: `✅ **Data Import Complete!**\n\n• **Imported:** ${importedCount} new users\n• **Updated:** ${updatedCount} existing users\n• **Total Users:** ${Object.keys(importData.users).length}\n\n**Note:** This operation has overwritten existing data.`, 
        ephemeral: true 
      });

      console.log(`📥 Admin ${context.user.username} imported data: ${importedCount} new, ${updatedCount} updated users`);
    } catch (error) {
      console.error('Error importing data:', error);
      await interaction.reply({ 
        content: '❌ Failed to import data. Please check the file format and try again.', 
        ephemeral: true 
      });
    }
  }

  // Button handlers
  async handleButton(interaction: any): Promise<void> {
    const customId = interaction.customId;
    
    if (customId.startsWith('unlock_wallet_')) {
      await this.handleUnlockWallet(interaction);
    } else if (customId.startsWith('panel_')) {
      await this.handlePanelButton(interaction);
    }
    // Other button interactions can be added here
  }

  private async handlePanelButton(interaction: any): Promise<void> {
    const customId = interaction.customId;
    const channelId = interaction.channel.id;
    
    // Define channel mappings
    const channelMappings = {
      'panel_invite': '1427689549215174756',
      'panel_inventory': '1427689549215174756', 
      'panel_balance': '1427689549215174756',
      'panel_editwallet': '1427689549215174756',
      'panel_openlootbox': '1427690539892998195',
      'panel_buylootbox': '1427689754849448096',
      'panel_help': '1427689549215174756'
    };

    const targetChannelId = channelMappings[customId as keyof typeof channelMappings];
    
    if (!targetChannelId) {
      await interaction.reply({ 
        content: '❌ Unknown button action!', 
        ephemeral: true 
      });
      return;
    }

    // Get the target channel
    const targetChannel = interaction.client.channels.cache.get(targetChannelId);
    if (!targetChannel || !('send' in targetChannel)) {
      await interaction.reply({ 
        content: '❌ Target channel not found!', 
        ephemeral: true 
      });
      return;
    }

    // Send the appropriate message to the target channel
    let message = '';
    switch (customId) {
      case 'panel_invite':
        message = `Use /invite to get your personal invitation link to earn $Stone Points in this channel <#${targetChannelId}>`;
        break;
      case 'panel_inventory':
        message = `Use /inventory to view your inventory and manage multiple wallets in this channel <#${targetChannelId}>`;
        break;
      case 'panel_balance':
        message = `Use /balance to check your current $Stone Points balance in this channel <#${targetChannelId}>`;
        break;
      case 'panel_editwallet':
        message = `Use /editwallet to set or edit your wallet addresses in this channel <#${targetChannelId}>`;
        break;
      case 'panel_openlootbox':
        message = `Use /openlootbox to open your loot boxes to get rewards in this channel <#${targetChannelId}>`;
        break;
      case 'panel_buylootbox':
        message = `Use /buylootbox [quantity] to buy loot boxes with your $Stone Points in this channel <#${targetChannelId}>`;
        break;
      case 'panel_help':
        message = `Use /help to view all available commands and information`;
        break;
    }

    // Send ephemeral response to user with channel information
    await interaction.reply({ 
      content: message, 
      ephemeral: true 
    });
  }
}
