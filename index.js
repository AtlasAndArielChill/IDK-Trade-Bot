// This Discord bot handles trade requests using a slash command.
// It uses discord.js for a clean and efficient implementation.

// Import necessary classes from the discord.js library
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
// Import the dotenv library to load environment variables from the .env file
require('dotenv').config();
// Import the express library to create a web server for Render's health check
const express = require('express');

// Define the ID of the channel where trade requests will be sent
const TRADE_CHANNEL_ID = '1419373453626183760';

// Define the regular expression to validate the Roblox private server link format
// The `[^&]+` part now matches any character that is not an ampersand, allowing for flexibility.
const SERVER_LINK_PATTERN = /https:\/\/www\.roblox\.com\/share\?code=[^&]+&type=Server/;

// Create a new client instance with necessary intents
// Intents are required for the bot to receive certain events from Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Event that triggers when the bot is ready and connected to Discord
// The event name 'ready' has been changed to 'clientReady' to avoid the deprecation warning
client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Set the bot's presence (optional but good practice)
    client.user.setPresence({
        activities: [{ name: '/trade', type: 3 }],
        status: 'online',
    });

    // Register the slash command globally
    try {
        await client.application.commands.set([
            {
                name: 'trade',
                description: 'Sends a trade request to the designated channel.',
                options: [
                    {
                        name: 'item_to_trade',
                        description: "The item you want to trade.",
                        type: 3, // String type
                        required: true,
                    },
                    {
                        name: 'item_looking_for',
                        description: "The item you are looking for.",
                        type: 3, // String type
                        required: true,
                    },
                    {
                        name: 'private_server_link',
                        description: 'The private server link for the trade.',
                        type: 3, // String type
                        required: true,
                    },
                ],
            },
        ]);
        console.log('Slash commands registered successfully.');
    } catch (error) {
        console.error('Failed to register slash commands:', error);
    }
});

// Event that handles interactions (like slash commands)
client.on('interactionCreate', async interaction => {
    // Check if the interaction is a slash command and the command name is 'trade'
    if (!interaction.isCommand() || interaction.commandName !== 'trade') {
        return;
    }

    // Defer the reply to give the bot time to process the request
    await interaction.deferReply({ ephemeral: true });

    // Get the trade channel object
    const tradeChannel = client.channels.cache.get(TRADE_CHANNEL_ID);

    // Check if the channel exists
    if (!tradeChannel) {
        return await interaction.editReply({ content: 'Error: The trade channel could not be found. Please check the channel ID.' });
    }

    // Extract command options
    const itemToTrade = interaction.options.getString('item_to_trade');
    const itemLookingFor = interaction.options.getString('item_looking_for');
    const privateServerLink = interaction.options.getString('private_server_link');

    // Validate the private server link format
    if (!SERVER_LINK_PATTERN.test(privateServerLink)) {
        return await interaction.editReply({
            content: "Error: Invalid private server link format. It must be in the format `https://www.roblox.com/share?code=________________________&type=Server`."
        });
    }

    // Create the embed message for the trade request
    const tradeEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('✨ New Trade Request ✨')
        .setDescription('A user has submitted a trade request.')
        .addFields(
            { name: 'Trader', value: interaction.user.toString(), inline: false },
            { name: 'Item to Trade', value: itemToTrade, inline: true },
            { name: 'Item Looking For', value: itemLookingFor, inline: true },
            { name: 'Private Server Link', value: `[Click to Join](${privateServerLink})`, inline: false }
        )
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Trade Bot | Use the /trade command to create your own request!' });

    try {
        // Send the embed to the designated trade channel
        await tradeChannel.send({ embeds: [tradeEmbed] });
        
        // Send a confirmation message back to the user
        await interaction.editReply({ content: '✅ Your trade request has been successfully sent to the trade channel!' });
    } catch (error) {
        console.error('Failed to send message to trade channel:', error);
        await interaction.editReply({ content: 'An error occurred while sending your trade request.' });
    }
});

// Log in to Discord with the bot token from the .env file
client.login(process.env.DISCORD_BOT_TOKEN);

// Create a simple express server to satisfy Render's health check
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.status(200).send('Bot is running and healthy!');
});

app.listen(PORT, () => {
    console.log(`Web server listening on port ${PORT}`);
});
