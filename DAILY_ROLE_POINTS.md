# Daily Role Points System

## Overview

The Spark Bot automatically awards points to members daily based on their Discord roles. The bot runs a check once per day at midnight UTC and awards points to eligible members.

## How It Works

### Roles and Points

- **Role `1432390111865077781`** → 300 points daily
- **Role `1432395369689649273`** → 30 points daily
- **Users with BOTH roles** → 330 points daily (300 + 30)

### Timing

- Runs at **midnight UTC** (00:00 UTC) every day
- First run occurs at the next midnight UTC after the bot starts
- Subsequent runs happen every 24 hours

### Example Flow

**Day 1 - December 1, 2024 (Midnight UTC)**
- User A has role `1432390111865077781` → Gets 300 points
- User B has role `1432395369689649273` → Gets 30 points
- User C has both roles → Gets 330 points

**Day 2 - December 2, 2024 (Midnight UTC)**
- User A gets 300 points again
- User B gets 30 points again
- User C gets 330 points again
- ...and so on

### Prevention of Duplicate Claims

The bot tracks when each user last received their daily points to prevent duplicates:
- Each user can only claim ONCE per day
- Uses `lastDailyPointsClaim` timestamp in the database
- Checks if the last claim was today before awarding new points

### New Member Behavior

**Example Scenario:**
- User joins the server on December 5 at 3:00 PM UTC with a qualifying role
- User will **NOT** receive points immediately
- User will receive points at the **next midnight UTC** (December 6 at 00:00 UTC)

**Why?**
- Prevents abuse of leaving and rejoining
- Ensures fair distribution
- Everyone gets points at the same time

## Technical Details

### Database Tracking

Each user in the `users.json` file now has a `lastDailyPointsClaim` field:
```json
{
  "userId": "123456789",
  "username": "User#1234",
  "points": 300,
  "lastDailyPointsClaim": 1733011200000,  // Unix timestamp
  ...
}
```

### Algorithm

1. Bot fetches all guild members
2. For each member:
   - Check if they have qualifying roles
   - Calculate total points based on roles
   - If has role 1432390111865077781 → add 300
   - If has role 1432395369689649273 → add 30
   - If has BOTH → add 330 total
3. Check `lastDailyPointsClaim` timestamp
4. If last claim was today → skip
5. If last claim was before today → award points
6. Update database with new points and timestamp

## Logs

The bot logs all daily point distributions:

```
🎁 Starting daily role points check at 2024-12-01T00:00:00.000Z
📊 Processing guild: Example Server (123456789)

  ✓ Role 1432390111865077781: +300 points
✅ User#1234 (123456789): Awarded 300 points (Total: 300)
⏭️  OtherUser#5678 (987654321): Already claimed today, skipping

📊 Guild Summary: 2 eligible members, 1 awarded, 1 skipped
🎉 Daily role points check completed at 2024-12-01T00:00:05.000Z
```

## Configuration

To modify role IDs or point amounts, edit `src/daily-role-points.ts`:

```typescript
private readonly ROLE_CONFIG = {
  '1432390111865077781': 300, // Your role ID: points
  '1432395369689649273': 30
};
```

## Testing

To manually trigger the daily points check (for testing):

```typescript
// In the bot console or command
bot.dailyRolePointsService.triggerNow();
```

## Monitoring

The bot shows:
- Next scheduled check time when starting
- How many minutes until the next check
- Daily summary of awarded and skipped users

## Notes

- Bot must be running continuously for daily checks to occur
- All times are in UTC
- Bot processes all guilds it's in
- Bots are excluded from receiving points
- Members who no longer have the roles won't receive points
