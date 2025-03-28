const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

// Create a collection to store commands
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    // Set a new item in the Collection with the key as the command name
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

// Load command handler
const handleCommand = require('./handlers/commandHandler');

client.on('ready', async () => {
    console.log(`Bot connected as ${client.user.tag}`);
    console.log(`Client ID: ${client.user.id}`);
});

// Interaction handler
client.on('interactionCreate', async (interaction) => {
    // Pass all interactions to the command handler
    await handleCommand(interaction, client);
});

client.login(process.env.DISCORD_TOKEN);