const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('codetkt')
        .setDescription('Configure the ticket support system.')
        .addChannelOption(option =>
            option.setName('panel_channel')
                .setDescription('The channel where the ticket panel will be sent.')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName('logs_channel')
                .setDescription('The channel where ticket logs will be sent.')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Check administrator permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: 'Only administrators can use this command.',
                flags: 64 // Ephemeral flag
            });
        }

        // Get selected channels
        const panelChannel = interaction.options.getChannel('panel_channel');
        const logsChannel = interaction.options.getChannel('logs_channel');

        // Validate text channels
        if (panelChannel.type !== 0 || logsChannel.type !== 0) {
            return interaction.reply({
                content: 'Please select valid text channels.',
                flags: 64 // Ephemeral flag
            });
        }

        // Save logs channel configuration
        const logsConfigPath = path.join(__dirname, '..', 'config', 'ticket_logs.json');
        const logsConfigDir = path.dirname(logsConfigPath);

        // Ensure config directory exists
        if (!fs.existsSync(logsConfigDir)) {
            fs.mkdirSync(logsConfigDir, { recursive: true });
        }

        // Write logs channel configuration
        fs.writeFileSync(logsConfigPath, JSON.stringify({ logsChannelId: logsChannel.id }, null, 2));

        // Read ticket role configuration
        const configPath = path.join(__dirname, '..', 'config', 'ticket_roles.json');
        let roleConfig = {};
        try {
            if (fs.existsSync(configPath)) {
                roleConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (error) {
            console.error('Error reading role configuration:', error);
        }

        // Predefined categories
        const predefinedCategories = ['support', 'mesh_support', 'foundation_support'];

        // Create ticket panel embed
        const ticketEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📋 Support System - Ticket Creation')
            .setDescription('Select a category to open a ticket:')
            .setFooter({ text: 'Choose an option to get started' });

        // Create select menu with configured categories
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_category_select')
            .setPlaceholder('Select a ticket category');

        // Add only the predefined categories that have been configured
        predefinedCategories.forEach(category => {
            if (roleConfig[category]) {
                let label = this.getCategoryLabel(category);
                let emoji = this.getCategoryEmoji(category);

                selectMenu.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(label)
                        .setDescription(`${label} ticket`)
                        .setValue(category)
                        .setEmoji(emoji)
                );
            }
        });

        // Create action row for the select menu
        const actionRow = new ActionRowBuilder().addComponents(selectMenu);

        try {
            // Send the embed with select menu to the specified panel channel
            await panelChannel.send({ 
                embeds: [ticketEmbed], 
                components: [actionRow] 
            });

            // Respond to the interaction
            await interaction.reply({
                content: `Ticket panel successfully set up in ${panelChannel}. Logs will be sent to ${logsChannel}.`,
                flags: 64 // Ephemeral flag
            });
        } catch (error) {
            console.error('Error setting up ticket system:', error);
            await interaction.reply({
                content: 'There was an error setting up the ticket system.',
                flags: 64 // Ephemeral flag
            });
        }
    },

    async handleCategorySelection(interaction) {
        if (interaction.values[0] === 'support') {
            // Create a modal for ticket details
            const ticketModal = new ModalBuilder()
                .setCustomId('support_ticket_modal')
                .setTitle('Support Ticket Details');

            // Create input fields
            const psnInput = new TextInputBuilder()
                .setCustomId('psn_username')
                .setLabel('PSN (PlayStation Username)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const tribeNameInput = new TextInputBuilder()
                .setCustomId('tribe_name')
                .setLabel('Tribe Name')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const mapInput = new TextInputBuilder()
                .setCustomId('map_number')
                .setLabel('Map (Include Number)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const inGameNameInput = new TextInputBuilder()
                .setCustomId('ingame_name')
                .setLabel('In-Game Name (Character Name)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            // Add inputs to the modal
            const psnRow = new ActionRowBuilder().addComponents(psnInput);
            const tribeRow = new ActionRowBuilder().addComponents(tribeNameInput);
            const mapRow = new ActionRowBuilder().addComponents(mapInput);
            const inGameRow = new ActionRowBuilder().addComponents(inGameNameInput);

            ticketModal.addComponents(psnRow, tribeRow, mapRow, inGameRow);

            // Show the modal
            await interaction.showModal(ticketModal);
        }
    },

    async handleModalSubmit(interaction) {
        if (!interaction.isModalSubmit() || interaction.customId !== 'support_ticket_modal') return;

        // Generate a random ticket number
        const ticketNumber = crypto.randomBytes(4).toString('hex').toUpperCase();

        // Extract form values
        const psnUsername = interaction.fields.getTextInputValue('psn_username');
        const tribeName = interaction.fields.getTextInputValue('tribe_name');
        const mapNumber = interaction.fields.getTextInputValue('map_number');
        const inGameName = interaction.fields.getTextInputValue('ingame_name');

        // Read ticket configuration
        const configPath = path.join(__dirname, '..', 'config', 'ticket_roles.json');
        let roleConfig = {};
        try {
            if (fs.existsSync(configPath)) {
                roleConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (error) {
            console.error('Error reading role configuration:', error);
        }

        // Create ticket embed
        const ticketEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`Support Ticket #${ticketNumber}`)
            .setDescription('New support ticket opened')
            .addFields(
                { name: 'PSN Username', value: psnUsername, inline: true },
                { name: 'Tribe Name', value: tribeName, inline: true },
                { name: 'Map', value: mapNumber, inline: true },
                { name: 'In-Game Name', value: inGameName, inline: true }
            )
            .setTimestamp();

        // Create close ticket button
        const closeButton = new ButtonBuilder()
            .setCustomId(`close_ticket_${ticketNumber}`)
            .setLabel('[🔒 Close]')
            .setStyle(ButtonStyle.Danger);

        const actionRow = new ActionRowBuilder().addComponents(closeButton);

        // Find or create support tickets category
        let ticketCategory = interaction.guild.channels.cache.find(
            c => c.name.toLowerCase() === 'support-tickets' && c.type === 4
        );

        if (!ticketCategory) {
            ticketCategory = await interaction.guild.channels.create({
                name: 'support-tickets',
                type: 4, // Category type
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: ['ViewChannel']
                    }
                ]
            });
        }

        try {
            // Create ticket channel
            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${ticketNumber}`,
                parent: ticketCategory.id,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: ['ViewChannel']
                    },
                    {
                        id: interaction.user.id,
                        allow: ['ViewChannel', 'SendMessages']
                    },
                    // Add support roles
                    ...(roleConfig['support'] || []).map(roleId => ({
                        id: roleId,
                        allow: ['ViewChannel', 'SendMessages']
                    }))
                ]
            });

            // Send ticket embed to the channel
            await ticketChannel.send({ 
                embeds: [ticketEmbed], 
                components: [actionRow] 
            });

            // Respond to the initial interaction
            await interaction.reply({
                content: `Ticket #${ticketNumber} has been created in ${ticketChannel}`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error creating ticket channel:', error);
            await interaction.reply({
                content: 'There was an error creating the ticket channel.',
                ephemeral: true
            });
        }
    },

    async handleTicketClose(interaction) {
        // Extract ticket number from button custom ID
        const ticketNumber = interaction.customId.split('_')[2];

        // Generate ticket transcript (simple HTML version)
        const generateTranscript = async () => {
            const messagesCollection = await interaction.channel.messages.fetch({ limit: 100 });
            const messages = Array.from(messagesCollection.values())
                .map(msg => `<div><strong>${msg.author.username}</strong>: ${msg.content}</div>`)
                .join('');
            
            return `
                <html>
                    <head>
                        <title>Ticket #${ticketNumber} Transcript</title>
                        <style>
                            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; }
                            div { margin: 10px 0; padding: 5px; border-bottom: 1px solid #eee; }
                        </style>
                    </head>
                    <body>
                        <h1>Ticket #${ticketNumber} Transcript</h1>
                        ${messages}
                    </body>
                </html>
            `;
        };

        // Save transcript
        const transcriptPath = path.join(__dirname, '..', 'transcripts', `ticket-${ticketNumber}.html`);
        const transcriptDir = path.join(__dirname, '..', 'transcripts');
        
        // Ensure transcripts directory exists
        if (!fs.existsSync(transcriptDir)) {
            fs.mkdirSync(transcriptDir);
        }

        // Generate and save transcript
        const transcriptContent = await generateTranscript();
        fs.writeFileSync(transcriptPath, transcriptContent);
        const transcriptUrl = `transcripts/ticket-${ticketNumber}.html`; // Relative URL

        // Read ticket logs configuration
        const logsConfigPath = path.join(__dirname, '..', 'config', 'ticket_logs.json');
        let logsConfig = {};
        try {
            if (fs.existsSync(logsConfigPath)) {
                logsConfig = JSON.parse(fs.readFileSync(logsConfigPath, 'utf8'));
            }
        } catch (error) {
            console.error('Error reading logs configuration:', error);
        }

        // Create closing embed
        const closeEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`Ticket #${ticketNumber} Closed`)
            .addFields(
                { name: 'Ticket Owner', value: interaction.user.toString(), inline: true },
                { name: 'Ticket Number', value: ticketNumber, inline: true },
                { name: 'Ticket Type', value: 'Support', inline: true },
                { name: 'Ticket Transcript', value: `[View Transcript](${transcriptUrl})` }
            )
            .setDescription('Ticket has been closed and archived.')
            .setTimestamp();

        // Send log to configured logs channel
        if (logsConfig.logsChannelId) {
            const logsChannel = interaction.guild.channels.cache.get(logsConfig.logsChannelId);
            if (logsChannel) {
                await logsChannel.send({ embeds: [closeEmbed] });
            }
        }

        // Send DM to ticket owner
        try {
            await interaction.user.send({ embeds: [closeEmbed] });
        } catch (error) {
            console.error('Could not send DM to user:', error);
        }

        // Delete the ticket channel
        await interaction.channel.delete();
    },

    getCategoryLabel(category) {
        const labels = {
            'support': 'General Support',
            'mesh_support': 'Mesh Support',
            'foundation_support': 'Foundation Support'
        };
        return labels[category] || category;
    },

    getCategoryEmoji(category) {
        const emojis = {
            'support': '❓',
            'mesh_support': '🌐',
            'foundation_support': '🏗️'
        };
        return emojis[category] || '❓';
    }
};