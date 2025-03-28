const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupticketsystem')
        .setDescription('Setup the ticket system')
        .addChannelOption(option => option.setName('channel').setDescription('The channel to send the ticket embed').setRequired(true))
        .addChannelOption(option => option.setName('category').setDescription('The category for ticket creation').setRequired(true))
        .addChannelOption(option => option.setName('logchannel').setDescription('The channel to send ticket transcripts').setRequired(true)),
    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel');
        const ticketCategory = interaction.options.getChannel('category');
        const logChannel = interaction.options.getChannel('logchannel');

        const embed = new MessageEmbed()
            .setTitle('Ticket System')
            .setDescription('Select the type of ticket you want to create:')
            .setThumbnail(process.env.THUMBNAILURL)
            .setColor('#00FF00');

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('ticket_type_1')
                    .setLabel('Type 1')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('ticket_type_2')
                    .setLabel('Type 2')
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('ticket_type_3')
                    .setLabel('Type 3')
                    .setStyle('SUCCESS')
            );

        await targetChannel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Ticket system setup complete!', ephemeral: true });
    },
};
