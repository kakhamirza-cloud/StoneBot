# $Stone Bot

A comprehensive Discord bot for the $Stone ecosystem that allows users to earn points through various activities and use those points to purchase and open loot boxes containing valuable rewards including airdrop allocations.

## 🚀 Features

### 💰 Point Earning System
- **🔗 Discord Invitations**: Earn 10 $Stone Points for each successful invite
- **🌅 GM Messages**: Earn 1 $Stone Point for saying "gm" in the designated channel (once per 24 hours)
- **📢 Announcement Reactions**: Earn 1 $Stone Point per unique reaction on admin announcements
- **🎁 Loot Box Rewards**: Earn $Stone Tokens and other items from loot boxes

### 🌅 GM Reward System
- **Channel**: Designated GM channel (configurable via `GM_CHANNEL_ID`)
- **Triggers**: "gm", "Gm", "GM", "good morning", "morning", or "GM<emoji>" (case-insensitive)
- **Cooldown**: 24 hours per user (admins bypass cooldown)
- **Reward**: 1 $Stone Point per valid GM message
- **Notification**: Ephemeral confirmation message sent to user

### 📢 Announcement System
- **Admin Only**: Only admins can create announcements
- **Modal Interface**: User-friendly modal forms for creating and editing announcements
- **Anonymous Posting**: Announcements appear without showing who created them
- **Title Required**: Each announcement must have a title
- **Role Mentions**: Optional role mentions for targeted announcements
- **Reaction Rewards**: Up to 5 reactions per announcement
- **Point System**: 1 $Stone Point per unique reaction (no duplicate points for same emoji)
- **Reaction Preservation**: Editing announcements preserves existing reaction counts
- **Image Support**: Optional logo and picture URLs (combined in single field)
- **Grey Theme**: All announcements use consistent grey color scheme
- **Tracking**: Bot tracks which users have reacted to prevent spam

### 🔗 Invite System
- **One Link Per User**: Each user can only have one active invite link
- **Permanent Links**: Invite links never expire and have unlimited uses
- **Point Rewards**: 10 $Stone Points per successful invite
- **Duplicate Prevention**: Same person joining multiple times = 0 points
- **Bot Filtering**: Bot accounts joining = 0 points
- **Smart Tracking**: Bot correctly identifies invite owners despite Discord's bot-created invites

### 🎁 Loot Box System
- **Purchase**: Buy loot boxes for 5 $Stone Points each
- **Smart Rewards**: Intelligent reward distribution based on wallet requirements
- **Reward Types**:
  - 🎫 **GTD Whitelist** (20% chance)
  - 🎫 **FCFS Whitelist** (50% chance)
  - 💰 **Airdrop Allocation** (3% chance, limited to 100 total)
  - 🪙 **10 $Stone Tokens** (17% chance)
  - 🪙 **20 $Stone Tokens** (10% chance)

### 🎯 Airdrop Notification System
- **Admin Notification**: Sent to designated admin channel when someone gets an airdrop
- **User DM**: Private message sent to the user who received the airdrop
- **Details Included**: Username, masked wallet address, and user ID tagging
- **Channel**: Configurable via `AIRDROP_NOTIFICATION_CHANNEL_ID` environment variable

### 🏦 Multi-Wallet System
- **Unlimited Wallets**: Users can unlock multiple independent wallets
- **Dual Address Support**: Each wallet requires both Spark and Taproot addresses
- **Independent Inventories**: Each wallet has its own separate inventory
- **Smart Unlocking**: Unlock new wallets by collecting required items
- **Live Updates**: Real-time inventory updates when switching wallets

### 📊 Wallet Unlock Requirements
- **Wallet 2+ Requirements**: 
  - 1 GTD Whitelist + 1 FCFS Whitelist + 1 Airdrop Allocation
  - OR 1 GTD Whitelist + 1 FCFS Whitelist (if 100 airdrops already distributed)
- **Item Limits**: Maximum 1 of each item type per wallet
- **Global Airdrop Limit**: Only 100 airdrop allocations total across all users

### 🎛️ Panel System
- **Admin Panel**: `/panel` command displays comprehensive ecosystem information
- **Interactive Buttons**: Users can click buttons for quick access to commands
- **Channel Routing**: Buttons provide information about where to use specific commands
- **Ephemeral Responses**: Button clicks show information only to the user who clicked

## 🎮 Commands

### 👥 Member Commands
- **🔗 `/invite`** - Get your personal invitation link to earn $Stone Points
- **📦 `/inventory`** - View your inventory and manage multiple wallets
- **🎁 `/buylootbox [quantity]`** - Buy loot boxes with your $Stone Points
- **🎲 `/openlootbox`** - Open your loot boxes to get rewards
- **💰 `/balance`** - Check your current $Stone Points balance
- **🏦 `/editwallet`** - Set or edit your wallet addresses
- **❓ `/help`** - View all available commands and information

### 👑 Admin Commands
- **🎛️ `/panel`** - Display the Spark Stones ecosystem panel with interactive buttons
- **📢 `/announce`** - Send announcements with reaction rewards (modal interface)
- **✏️ `/edit [message_id]`** - Edit existing announcements while preserving reaction counts
- **➕ `/addpoints [user] [amount]`** - Add $Stone Points to a user
- **🎁 `/additems [user] [item] [amount]`** - Add items to a user's active wallet
- **📋 `/exportwallets`** - Export all submitted wallet addresses with usernames and inventory data

## 🛠️ Setup

### Prerequisites
- Node.js (v16 or higher)
- Discord Bot Token
- Discord Application with bot permissions

### Installation

1. **Clone or download the project**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file:**
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here
   ADMIN_IDS=admin_user_id_1,admin_user_id_2
   AIRDROP_NOTIFICATION_CHANNEL_ID=your_notification_channel_id
   GM_CHANNEL_ID=your_gm_channel_id
   ```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DISCORD_TOKEN` | Your Discord bot token | ✅ |
| `CLIENT_ID` | Your Discord application client ID | ✅ |
| `GUILD_ID` | Your Discord server (guild) ID | ✅ |
| `ADMIN_IDS` | Comma-separated list of admin user IDs | ✅ |
| `AIRDROP_NOTIFICATION_CHANNEL_ID` | Channel ID for airdrop notifications | ✅ |
| `GM_CHANNEL_ID` | Channel ID for GM message rewards | ✅ |

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Register slash commands:**
   ```bash
   npm run register-commands
   ```

6. **Start the bot:**
   ```bash
   npm start
   ```

### Bot Permissions
The bot needs the following Discord permissions:
- **Send Messages** - To send command responses and notifications
- **Use Slash Commands** - To register and respond to slash commands
- **Embed Links** - To send rich embeds with formatting
- **Attach Files** - To send CSV exports and other files
- **Read Message History** - To track reactions and GM messages
- **Add Reactions** - To add reactions to announcements
- **Create Instant Invite** - To generate invite links for users
- **Manage Messages** - To manage announcement messages
- **Read Messages** - To read messages in channels
- **Send Messages in Threads** - To respond in threads if needed

## ⚙️ Configuration

### Loot Box Configuration
Loot box rewards and probabilities can be configured in `data/state.json`:
```json
{
  "lootBoxRewards": [
    {
      "type": "gtd_whitelist",
      "name": "GTD Whitelist",
      "description": "Guaranteed whitelist allocation",
      "probability": 0.20
    },
    {
      "type": "fcfs_whitelist",
      "name": "FCFS Whitelist",
      "description": "First come first serve whitelist allocation",
      "probability": 0.50
    },
    {
      "type": "airdrop",
      "name": "Airdrop Allocation",
      "description": "Token airdrop allocation",
      "probability": 0.03,
      "maxQuantity": 100
    },
    {
      "type": "spark_tokens",
      "name": "10 $Stone Tokens",
      "description": "10 $Stone tokens",
      "probability": 0.17,
      "tokenAmount": 10
    },
    {
      "type": "spark_tokens",
      "name": "20 $Stone Tokens",
      "description": "20 $Stone tokens",
      "probability": 0.10,
      "tokenAmount": 20
    }
  ],
  "globalAirdropLimit": 100,
  "totalAirdropsDistributed": 0
}
```

### Point System Configuration
Point rewards can be configured in `data/config.json`:
```json
{
  "lootBoxCost": 5,
  "invitePoints": 10,
  "twitterPoints": {
    "like": 1,
    "retweet": 1,
    "comment": 1
  },
  "cooldowns": {
    "tweetSubmission": 86400000
  }
}
```

## 📖 Usage Guide

### For Users

#### Getting Started
1. **First Time Setup**: Use `/inventory` to submit your Spark and Taproot wallet addresses
2. **Earn Points**: Use `/invite` to get your invitation link and invite friends
3. **React to Announcements**: React to admin announcements to earn points
4. **Buy Loot Boxes**: Use `/buylootbox [quantity]` to purchase loot boxes
5. **Open Rewards**: Use `/openlootbox` to open your loot boxes

#### Multi-Wallet System
1. **Collect Items**: Open loot boxes to get GTD, FCFS, and Airdrop items
2. **Unlock New Wallets**: When you have the required items, unlock Wallet 2, 3, etc.
3. **Submit Addresses**: Each new wallet requires both Spark and Taproot addresses
4. **Switch Wallets**: Use the dropdown in `/inventory` to switch between wallets
5. **Independent Progress**: Each wallet has its own inventory and progress

#### Panel System
1. **View Panel**: Admins can use `/panel` to display the ecosystem information
2. **Interactive Buttons**: Click buttons to get information about where to use commands
3. **Channel Guidance**: Buttons show which channels to use for specific commands
4. **Quick Access**: Get instant information about command usage and locations

#### Important Rules
- **Invite Links**: Each user can only have 1 active invite link (permanent, unlimited uses)
- **Duplicate Users**: Same person joining multiple times = 0 points for inviter
- **Bot Accounts**: Bot accounts joining = 0 points for inviter
- **Airdrop Limit**: Only 100 airdrop allocations total across all users
- **Item Limits**: Maximum 1 of each item type per wallet
- **Loot Box Cost**: Each loot box costs 5 $Stone Points

### For Admins

#### Managing Users
1. **Add Points**: Use `/addpoints @user amount` to manually add points
2. **Add Items**: Use `/additems @user [item] [amount]` to add items to a user's active wallet
3. **Export Data**: Use `/exportwallets` to get all submitted wallet addresses
4. **Send Announcements**: Use `/announce` to send messages with reaction rewards (modal interface)
5. **Edit Announcements**: Use `/edit [message_id]` to modify existing announcements while preserving reaction counts
6. **Display Panel**: Use `/panel` to show the ecosystem information with interactive buttons

#### Announcement Features
- **Modal Interface**: User-friendly forms for creating and editing announcements
- **Anonymous Posting**: Announcements appear without showing who created them
- **Reaction Preservation**: Editing announcements keeps existing reaction counts
- **Image Support**: Add logos and pictures using URLs (one per line in the images field)
- **Grey Theme**: Consistent visual styling for all announcements
- **Smart Editing**: Only removes reactions not in the new list, adds new ones, preserves existing counts

#### Monitoring
- **Airdrop Notifications**: Bot automatically notifies when users receive airdrops
- **User Activity**: Monitor invite usage and point accumulation
- **Global Limits**: Track airdrop distribution and item limits
- **Panel Usage**: Monitor button interactions and user engagement

## 📁 File Structure

```
src/
├── index.ts              # Main bot file with event handlers
├── commands.ts           # All command handlers and interactions
├── types.ts              # TypeScript type definitions
├── storage.ts            # Data storage and management
├── lootbox.ts            # Loot box system and reward logic
├── points.ts             # Point management system
└── register-commands.ts  # Slash command registration

data/
├── users.json            # User data storage (points, wallets, inventory)
├── state.json            # Global bot state (airdrop limits, rewards)
├── config.json           # Bot configuration (costs, points)
└── announcements.json    # Announcement tracking data

logs/                     # Application logs
dist/                     # Compiled JavaScript files
```

### Data File Structures

#### `users.json`
Stores all user-specific data including points, wallets, and activity:
```json
{
  "user_id": {
    "userId": "user_id",
    "username": "username",
    "points": 100,
    "activeWallet": 1,
    "wallets": [
      {
        "walletId": 1,
        "sparkWalletAddress": "address",
        "taprootWalletAddress": "address",
        "inventory": {
          "lootBoxes": 5,
          "gtdWhitelist": 1,
          "fcfsWhitelist": 1,
          "airdropAllocations": 0,
          "sparkTokens": 30
        }
      }
    ],
    "inviteData": {
      "inviteCode": "ABC123",
      "uses": 3,
      "pointsEarned": 30,
      "invitedUsers": ["user1", "user2", "user3"]
    },
    "reactionData": {},
    "gmCooldown": 0
  }
}
```

#### `state.json`
Stores global bot state and configuration:
```json
{
  "totalAirdropsGiven": 5,
  "maxAirdrops": 100,
  "globalAirdropLimit": 100,
  "totalAirdropsDistributed": 5,
  "lootBoxRewards": [...]
}
```

#### `config.json`
Stores bot configuration settings:
```json
{
  "lootBoxCost": 5,
  "invitePoints": 10,
  "twitterPoints": {
    "like": 1,
    "retweet": 1,
    "comment": 1
  },
  "cooldowns": {
    "tweetSubmission": 86400000
  }
}
```

## 🔧 Development

### Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start the bot
- `npm run dev` - Start with ts-node for development
- `npm run watch` - Watch for changes and recompile
- `npm run register-commands` - Register slash commands
- `npm run pm2:start` - Start with PM2 process manager
- `npm run pm2:stop` - Stop PM2 process
- `npm run pm2:restart` - Restart PM2 process
- `npm run pm2:logs` - View PM2 logs
- `npm run pm2:status` - Check PM2 status

### Key Features Implementation
- **Multi-Wallet System**: Independent wallet management with live UI updates
- **Smart Loot Box Logic**: Intelligent reward distribution based on wallet requirements
- **Real-Time Updates**: Live inventory updates without page refresh
- **Panel System**: Interactive button system for command guidance
- **Modal Interface**: User-friendly forms for announcements and wallet management
- **Anonymous Announcements**: Clean posting without showing command usage
- **Reaction Preservation**: Smart editing that maintains existing reaction counts
- **Error Handling**: Graceful handling of Discord API limitations and modal component limits
- **Data Persistence**: JSON-based storage with automatic backups

### Adding New Features
1. Define types in `types.ts`
2. Add command logic in `commands.ts`
3. Update storage methods in `storage.ts` if needed
4. Register new commands in `register-commands.ts`
5. Test with `npm run dev`

## 🐛 Troubleshooting

### Common Issues

#### Bot Not Responding
1. **Check bot status**: Ensure the bot is online and has proper permissions
2. **Verify token**: Make sure `DISCORD_TOKEN` is correct in `.env`
3. **Check logs**: Look at `logs/` directory for error messages
4. **Restart bot**: Use `pm2 restart spark-bot` or restart the process

#### Commands Not Working
1. **Commands not appearing**: Run `npm run register-commands` after changes
2. **Permission errors**: Ensure bot has all required permissions
3. **Guild ID mismatch**: Verify `GUILD_ID` in `.env` matches your server
4. **Admin commands failing**: Check `ADMIN_IDS` includes your user ID

#### Invite System Issues
1. **No points awarded**: Check if user is already in `invitedUsers` array
2. **Bot accounts**: Bot accounts joining won't award points (by design)
3. **Duplicate users**: Same person joining multiple times = 0 points (by design)
4. **Invite tracking**: Bot uses smart tracking to identify invite owners

#### Data Issues
1. **Missing user data**: Bot automatically creates user data on first interaction
2. **Corrupted data**: Check JSON syntax in `data/` files
3. **Backup data**: Always backup `data/` directory before major changes
4. **Reset user**: Delete user entry from `users.json` to reset their data

#### GM System Issues
1. **No GM points**: Check `GM_CHANNEL_ID` is set correctly
2. **Cooldown issues**: Users can only get 1 GM point per 24 hours
3. **Admin bypass**: Admins bypass GM cooldown automatically
4. **Pattern matching**: GM detection is case-insensitive and flexible

#### Multi-Wallet Issues
1. **Wallet not unlocking**: Ensure you have the required items (GTD + FCFS + Airdrop)
2. **Addresses not saving**: Ensure both Spark and Taproot addresses are provided
3. **Wallet switching**: Use the dropdown in `/inventory` to switch wallets
4. **Modal not showing**: Check for interaction conflicts (only one response per interaction)

#### Loot Box Issues
1. **No rewards**: Check if you have loot boxes in your inventory
2. **Airdrop limit**: Only 100 airdrops total across all users
3. **Item limits**: Max 1 of each item type per wallet
4. **Smart rewards**: Rewards are filtered based on your current wallet's items

#### Panel System Issues
1. **Panel not showing**: Ensure you have admin permissions
2. **Buttons not working**: Check if bot has proper permissions in the channel
3. **Channel routing**: Verify channel IDs are correct in the button handlers
4. **Ephemeral responses**: Button responses are only visible to the user who clicked

#### Announcement System Issues
1. **Modal not showing**: Check for interaction conflicts (only one response per interaction)
2. **Component limit error**: Discord modals are limited to 5 components (fixed by combining image fields)
3. **Reaction counts reset**: Use the new `/edit` command which preserves reaction counts
4. **Anonymous posting**: Announcements now appear without showing who created them
5. **Image uploads**: Use URLs for logos and pictures (one per line in the images field)
6. **Grey theme**: All announcements use consistent grey color scheme (0x808080)

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Check the troubleshooting section above
- Review the logs in the `logs/` directory
- Ensure all environment variables are set correctly
- Verify bot permissions in Discord

### PM2 Management
- `pm2 start spark-bot` - Start the bot
- `pm2 restart spark-bot` - Restart the bot
- `pm2 stop spark-bot` - Stop the bot
- `pm2 logs spark-bot` - View logs
- `pm2 status` - Check bot status

---

**$Stone Bot** - A comprehensive Discord bot for the $Stone ecosystem with multi-wallet support, loot boxes, point earning systems, and interactive panel management.