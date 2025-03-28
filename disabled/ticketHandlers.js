const { MessageActionRow, MessageButton, MessageEmbed, Modal, TextInputComponent } = require('discord.js');

module.exports = {
    data: {
        name: 'ticketHandlers',
    },
    async handleButton(interaction, client) {
        if (interaction.customId.startsWith('ticket_type_')) {
            const modal = new Modal()
                .setCustomId('ticket_form')
                .setTitle('Ticket Form')
                .addComponents(
                    new MessageActionRow().addComponents(
                        new TextInputComponent()
                            .setCustomId('ticket_subject')
                            .setLabel('Subject')
                            .setStyle('SHORT')
                            .setRequired(true)
                    ),
                    new MessageActionRow().addComponents(
                        new TextInputComponent()
                            .setCustomId('ticket_description')
                            .setLabel('Description')
                            .setStyle('PARAGRAPH')
                            .setRequired(true)
                    )
                );

            await interaction.showModal(modal);
        } else if (interaction.customId === 'close_ticket') {
            const ticketChannel = interaction.channel;
            const logChannel = client.channels.cache.get(process.env.LOGCHANNEL);

            const transcript = await createTranscript(ticketChannel);
            await ticketChannel.delete();

            await interaction.user.send({ content: 'Here is your ticket transcript:', files: [transcript] });
            await logChannel.send({ content: `Ticket closed by ${interaction.user.tag}`, files: [transcript] });

        } else if (interaction.customId === 'close_ticket_with_reason') {
            const modal = new Modal()
                .setCustomId('reason_form')
                .setTitle('Reason for Closing')
                .addComponents(
                    new MessageActionRow().addComponents(
                        new TextInputComponent()
                            .setCustomId('close_reason')
                            .setLabel('Reason')
                            .setStyle('PARAGRAPH')
                            .setRequired(true)
                    )
                );

            await interaction.showModal(modal);
        }
    },

    async handleModal(interaction, client) {
        if (interaction.customId === 'ticket_form') {
            const subject = interaction.fields.getTextInputValue('ticket_subject');
            const description = interaction.fields.getTextInputValue('ticket_description');
            const ticketCategory = client.channels.cache.get(process.env.CATEGORY_ID);

            const ticketChannel = await interaction.guild.channels.create(`ticket-${interaction.user.username}`, {
                type: 'GUILD_TEXT',
                parent: ticketCategory.id,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: ['VIEW_CHANNEL'],
                    },
                    {
                        id: interaction.user.id,
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'],
                    },
                    {
                        id: interaction.guild.roles.cache.find(role => role.name === 'Staff').id,
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
                    }
                ],
            });

            const ticketEmbed = new MessageEmbed()
                .setTitle(`Ticket: ${subject}`)
                .setDescription(description)
                .setColor('#00FF00')
                .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL());

            const ticketButtons = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('close_ticket')
                        .setLabel('Close')
                        .setStyle('DANGER'),
                    new MessageButton()
                        .setCustomId('close_ticket_with_reason')
                        .setLabel('Close with Reason')
                        .setStyle('SECONDARY')
                );

            await ticketChannel.send({ embeds: [ticketEmbed], components: [ticketButtons] });
            await interaction.reply({ content: `Ticket created: ${ticketChannel}`, ephemeral: true });
        } else if (interaction.customId === 'reason_form') {
            const reason = interaction.fields.getTextInputValue('close_reason');
            const ticketChannel = interaction.channel;
            const logChannel = client.channels.cache.get(process.env.LOGCHANNEL);

            const transcript = await createTranscript(ticketChannel);
            await ticketChannel.delete();

            await logChannel.send({ content: `Ticket closed by ${interaction.user.tag} with reason: ${reason}`, files: [transcript] });
            await interaction.user.send({ content: 'Here is your ticket transcript:', files: [transcript] });
        }
    },
};
