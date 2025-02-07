const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');  
const path = require('path');  
const axios = require('axios');

const dataPath = path.join(__dirname, 'data.json');
const channelID = '1295447205024632864'; // ID del canal administrativo

// Crear data.json si no existe
if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify([]));
}

// ✅ Verificación del Token antes de iniciar el bot
if (!process.env.DISCORD_TOKEN) {
    console.error("❌ ERROR: El token de Discord no está definido en las variables de entorno.");
    process.exit(1);
}

// 🔹 Depuración de los intents
console.log("Configurando intents...");
const intentsList = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
];
console.log("Intents que se están configurando:", intentsList);

const client = new Client({
    intents: intentsList,
    partials: [Partials.Message, Partials.Channel, Partials.User]
});

// Objeto para almacenar estados de usuarios
const userStates = {};

// Evento cuando el bot está listo
client.once('ready', async () => {
    console.log(`✅ Bot iniciado como ${client.user.tag}`);

    try {
        await client.user.setPresence({
            activities: [{
                name: 'y garantizando la verificación de integrantes de TransBus Discord',
                type: "WATCHING",
            }],
            status: 'online',
        });
        console.log('✅ Presencia configurada correctamente');
    } catch (error) {
        console.error('❌ Error al establecer la presencia:', error);
    }
});

// Escucha mensajes en Discord
client.on('messageCreate', async (message) => {
    console.log(`📩 Mensaje recibido de ${message.author.username}: ${message.content}`);

    if (message.author.bot) return;

    if (message.content === '!codigo') {
        message.reply('¡Hola! 👋🏻\nPor favor, dime tu ID de usuario de Roblox *(los números que aparecen en el link de tu perfil)*:');
        userStates[message.author.id] = { step: 'awaitingRobloxID' };
    } else if (userStates[message.author.id]?.step === 'awaitingRobloxID') {
        const robloxID = message.content.trim();
        userStates[message.author.id].robloxID = robloxID;
        userStates[message.author.id].step = 'confirmGeneration';

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_yes').setLabel('Sí').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('confirm_no').setLabel('No').setStyle(ButtonStyle.Danger)
        );

        message.reply({
            content: `💠 El ID de usuario de Roblox digitado es: **${robloxID}**\n📂 Verifica que corresponda a tu perfil [aquí](https://roblox.com/users/${robloxID}/profile).\n\n¿Quieres que genere tu código PIN? 🤔`,
            components: [row]
        });
    }
});

// Manejo de botones
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const userId = interaction.user.id;
    const userState = userStates[userId];

    if (!userState || userState.step !== 'confirmGeneration') {
        interaction.reply({ content: 'Esta interacción no está asociada contigo.', ephemeral: true });
        return;
    }

    if (interaction.customId === 'confirm_yes') {
        const randomCode = Math.floor(100000 + Math.random() * 900000);
        const robloxID = userState.robloxID;
        const discordUsername = interaction.user.username;

        let avatarUrl = null;
        try {
            const response = await axios.get(`https://thumbnails.roproxy.com/v1/users/avatar?userIds=${robloxID}&size=720x720&format=Png&isCircular=true`);
            avatarUrl = response.data.data[0]?.imageUrl || null;
        } catch (error) {
            console.error('❌ Error al obtener el avatar de Roblox:', error);
        }

        if (avatarUrl) {
            const embed = new EmbedBuilder()
                .setAuthor({ name: discordUsername, iconURL: interaction.user.avatarURL() })
                .setThumbnail(avatarUrl)
                .setColor(2908045)
                .setTitle("🦉 Reporte de Trámite Efectivo en AplicativoVerifDiscord 📝")
                .setDescription(`
                    👩 **Nombre Responsable** @${discordUsername}
                    🪪 **ID Discord:** ${interaction.user.id}
                    🪪 **ID Roblox:** ${robloxID}
                    >>> 📋 **Detalle del Reporte:**
                    __Generación de PIN Verificación__ a Usuario(a) de Roblox con ID ${robloxID}, de forma SATISFACTORIA con el número __(PIN ${randomCode})__
                    [📂 Presione aquí para visitar el perfil del usuario](https://roblox.com/es/users/${robloxID}/profile)
                `)
                .setFooter({ text: "Recuerda: la información proyectada aquí tiene absoluta reserva, por lo tanto es confidencial." });

            const channel = await client.channels.fetch(channelID);
            if (channel) {
                await channel.send({ embeds: [embed] });
            }

            const existingData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            existingData.push({ user: discordUsername, robloxID, code: randomCode });
            fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));

            await interaction.update({
                content: `✅ Código generado satisfactoriamente.\n🔢 Su código PIN es: **${randomCode}**.\n\nPor favor continúa con los pasos indicados en el canal de <#1310582697055354930>, si tienes dudas o inquietudes contáctanos mediante un <#973243290474405938>.\n\n__¡Gracias por usar el bot, que tenga un feliz resto de día!__ 😄`,
                components: [],
            });

            delete userStates[userId];
        }
    } else if (interaction.customId === 'confirm_no') {
        await interaction.update({
            content: '❌ Proceso cancelado, si tienes dudas o inquietudes contáctanos mediante un <#973243290474405938>. ¡Puedes intentarlo de nuevo cuando quieras!',
            components: [],
        });

        delete userStates[userId];
    }
});

// 🔹 Inicia sesión en Discord
client.login(process.env.DISCORD_TOKEN);
