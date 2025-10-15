import { REST, Routes } from 'discord.js';
import { CommandManager } from './commands';
import * as dotenv from 'dotenv';

dotenv.config();

export async function registerCommands(): Promise<void> {
  const commands = new CommandManager().getCommands();
  const commandData = commands.map(command => command.toJSON());

  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

  try {
    console.log('🔄 Started refreshing application (/) commands.');

    const clientId = process.env.CLIENT_ID;
    const guildId = process.env.GUILD_ID;

    if (!clientId) {
      throw new Error('CLIENT_ID is not set in environment variables');
    }

    if (!guildId) {
      throw new Error('GUILD_ID is not set in environment variables');
    }

    // Register commands for specific guild (faster for development)
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commandData }
    );
    console.log(`✅ Successfully reloaded application (/) commands for guild ${guildId}.`);
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  registerCommands().catch(console.error);
}
