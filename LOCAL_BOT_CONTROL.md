# 🛡️ Local Bot Control System

## 🚀 Current Status: **LOCAL BOT DISABLED**

The Spark Bot is configured to run **ONLY on Railway** to prevent conflicts and ensure consistent operation.

## 📋 Available Commands

### ✅ **Safe Commands (Always Available)**
```bash
npm run build                    # Build TypeScript to JavaScript
npm run watch                    # Watch and build TypeScript files
npm run register-commands        # Register Discord slash commands
npm run pm2:stop                 # Stop any running PM2 processes
npm run pm2:logs                 # View PM2 logs
npm run pm2:status               # Check PM2 status
```

### ❌ **Disabled Commands (Will Show Error)**
```bash
npm start                        # ❌ DISABLED
npm run dev                      # ❌ DISABLED  
npm run pm2:start                # ❌ DISABLED
npm run pm2:restart              # ❌ DISABLED
```

## 🔧 **Enable Local Bot (When You Want to Edit)**

**To enable local development:**
```bash
npm run enable-local
```

**Then you can run:**
```bash
npm start                        # ✅ ENABLED
npm run dev                      # ✅ ENABLED
npm run pm2:start                # ✅ ENABLED
```

## 🛡️ **Disable Local Bot (After Editing)**

**To disable local bot again:**
```bash
npm run disable-local
```

## 🚀 **Railway Bot Status**

- **Status**: ✅ Running
- **URL**: https://railway.app
- **Logs**: `railway logs --service StoneBot`
- **Status**: `railway status`

## 💡 **Development Workflow**

1. **Make changes** to source files
2. **Test locally** (if needed):
   ```bash
   npm run enable-local
   npm run dev
   # Test your changes
   npm run disable-local
   ```
3. **Commit and push** to GitHub
4. **Railway auto-deploys** the changes

## ⚠️ **Important Notes**

- **Railway bot continues running** even when local is disabled
- **No conflicts** between local and Railway bots
- **Data stays synchronized** through Railway
- **Always disable local** after development

## 🆘 **Troubleshooting**

**If you accidentally run a disabled command:**
- You'll see: `❌ LOCAL BOT DISABLED - Bot runs only on Railway`
- This is normal! Just use `npm run enable-local` if you need to develop

**If Railway bot stops:**
- Check Railway dashboard
- Run `railway logs --service StoneBot`
- Redeploy if needed
