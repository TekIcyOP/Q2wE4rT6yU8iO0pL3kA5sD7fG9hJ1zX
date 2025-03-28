const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
    ],
});

// Manejador de eventos para cuando el bot esté listo
client.on('ready', () => {
    console.log(`Bot conectado como ${client.user.tag}!`);
    console.log('Presiona Ctrl+C para apagar el bot');
});

// Manejador de eventos para mensajes de consola
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Función de apagado gracioso
function shutdown() {
    console.log('Apagando bot...');
    
    client.destroy(); // Desconecta el bot
    
    // Cierra la interfaz de readline
    rl.close();
    
    // Termina el proceso
    process.exit(0);
}

// Evento de interrupción (Ctrl+C)
process.on('SIGINT', shutdown);

// Comando de teclado para apagar
rl.on('line', (input) => {
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'salir') {
        shutdown();
    }
});

// Manejo de errores
client.on('error', console.error);
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Iniciar el bot
client.login(process.env.DISCORD_TOKEN);