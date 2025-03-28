module.exports = async (interaction, client) => {
    // Slash command handler
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true
            });
        }
    }

    // Ticket category selection handler
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category_select') {
        const codetktCommand = client.commands.get('codetkt');
        
        if (codetktCommand && codetktCommand.handleCategorySelection) {
            await codetktCommand.handleCategorySelection(interaction);
        }
    }

    // Ticket modal submit handler
    if (interaction.isModalSubmit() && interaction.customId === 'support_ticket_modal') {
        const codetktCommand = client.commands.get('codetkt');
        
        if (codetktCommand && codetktCommand.handleModalSubmit) {
            await codetktCommand.handleModalSubmit(interaction);
        }
    }

    // Ticket close button handler
    if (interaction.isButton() && interaction.customId.startsWith('close_ticket_')) {
        const codetktCommand = client.commands.get('codetkt');
        
        if (codetktCommand && codetktCommand.handleTicketClose) {
            await codetktCommand.handleTicketClose(interaction);
        }
    }

    // Existing handlers
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category_role_config') {
        const setuptktCommand = client.commands.get('setuptkt');
        if (setuptktCommand && setuptktCommand.handleCategoryRoleConfig) {
            await setuptktCommand.handleCategoryRoleConfig(interaction);
        }
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('roles_config_')) {
        const setuptktCommand = client.commands.get('setuptkt');
        if (setuptktCommand && setuptktCommand.handleRoleModalSubmit) {
            await setuptktCommand.handleRoleModalSubmit(interaction);
        }
    }
};