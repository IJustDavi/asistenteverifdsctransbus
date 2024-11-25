const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    InteractionType 
} = require('discord.js');
const fs = require('fs');
const dataPath = './src/data.json';

const client = new Client({
    intents: [
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageComponents
    ]
});

// Asegúrate de que el archivo JSON existe
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify([]));

// Objeto para almacenar datos temporales durante la interacción
const userStates = {};

client.on('ready', () => {
    console.log(`Bot iniciado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // Ignorar mensajes del bot
    if (message.author.bot) return;

    // Comando para iniciar el proceso
    if (message.content === '!codigo') {
        message.reply('Por favor, dime tu ID de usuario de Roblox (los números que aparecen en el link de tu perfil):');
        userStates[message.author.id] = { step: 'awaitingRobloxID' }; // Guardamos el estado del usuario
    } else if (userStates[message.author.id]?.step === 'awaitingRobloxID') {
        // Guardar el ID de Roblox proporcionado
        const robloxID = message.content.trim();
        userStates[message.author.id].robloxID = robloxID;
        userStates[message.author.id].step = 'confirmGeneration';

        // Crear botones
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_yes')
                .setLabel('Sí')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('confirm_no')
                .setLabel('No')
                .setStyle(ButtonStyle.Danger)
        );

        message.reply({
            content: `Tu ID de usuario de Roblox es: **${robloxID}**. ¿Quieres que genere tu código PIN?`,
            components: [row]
        });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const userId = interaction.user.id;
    const userState = userStates[userId];

    if (!userState || userState.step !== 'confirmGeneration') {
        interaction.reply({ content: 'Esta interacción no está asociada contigo.', ephemeral: true });
        return;
    }

    if (interaction.customId === 'confirm_yes') {
        // Generar código PIN
        const randomCode = Math.floor(1000 + Math.random() * 9000);

        // Guardar datos en el archivo JSON
        const existingData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        const robloxID = userState.robloxID;

        existingData.push({ user: interaction.user.username, robloxID, code: randomCode });
        fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));

        // Responder al usuario
        await interaction.update({
            content: `Su código PIN es: **${randomCode}**. Por favor continúa con los pasos indicados en el canal de <#1310582697055354930>, si tienes dudas o inquietudes contáctanos mediante un <#973243290474405938>. ¡Gracias por usar el bot, que tenga un feliz resto de día!`,
            components: []
        });

        // Limpiar el estado del usuario
        delete userStates[userId];
    } else if (interaction.customId === 'confirm_no') {
        await interaction.update({
            content: 'Proceso cancelado, si tienes dudas o inquietudes contáctanos mediante un <#973243290474405938>. ¡Puedes intentarlo de nuevo cuando quieras!',
            components: []
        });

        // Limpiar el estado del usuario
        delete userStates[userId];
    }
});

// Inicia sesión en Discord
client.login(process.env.DISCORD_TOKEN);
