# PM2 Setup for Spark Bot

This guide explains how to set up PM2 (Process Manager 2) to run the Spark Bot as a background service.

## Installation

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

## Setup

1. Make sure your `.env` file is configured with all required variables
2. Build the project:
   ```bash
   npm run build
   ```

3. Start the bot with PM2:
   ```bash
   pm2 start ecosystem.config.js
   ```

## PM2 Commands

- **Start bot**: `pm2 start ecosystem.config.js`
- **Stop bot**: `pm2 stop spark-bot`
- **Restart bot**: `pm2 restart spark-bot`
- **View logs**: `pm2 logs spark-bot`
- **View status**: `pm2 status`
- **Delete bot**: `pm2 delete spark-bot`

## Auto-start on System Boot

To make the bot start automatically when your system boots:

1. Save current PM2 processes:
   ```bash
   pm2 save
   ```

2. Generate startup script:
   ```bash
   pm2 startup
   ```

3. Follow the instructions provided by the startup command

## Logs

Logs are stored in the `logs/` directory:
- `err.log` - Error logs
- `out.log` - Output logs
- `combined.log` - Combined logs

## Monitoring

- View real-time logs: `pm2 logs spark-bot --lines 100`
- Monitor resource usage: `pm2 monit`
- View detailed info: `pm2 show spark-bot`

## Troubleshooting

- If the bot doesn't start, check the logs: `pm2 logs spark-bot`
- If there are permission issues, make sure the bot has proper file permissions
- If the bot keeps crashing, check the error logs and ensure all environment variables are set





