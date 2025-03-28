const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuptkt')
        .setDescription('Configure support ticket categories with role access')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Create explanatory embed
        const setupEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Ticket Category Role Configuration')
            .setDescription('Select a category to configure role access')
            .addFields(
                { name: 'Support', value: 'Configure role access for general support' },
                { name: 'Mesh Support', value: 'Configure role access for Mesh support' },
                { name: 'Foundation Support', value: 'Configure role access for Foundation support' },
                { name: '\u200B', value: 'You will need to provide Role IDs for access' }
            )
            .setFooter({ text: 'Choose a category to configure its roles' });

        // Create category selection menu
        const categorySelect = new StringSelectMenuBuilder()
            .setCustomId('ticket_category_role_config')
            .setPlaceholder('Select a category')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Support')
                    .setValue('support')
                    .setDescription('Configure role access for general support'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Mesh Support')
                    .setValue('mesh_support')
                    .setDescription('Configure role access for Mesh support'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Foundation Support')
                    .setValue('foundation_support')
                    .setDescription('Configure role access for Foundation support')
            );

        // Create action row with menu
        const actionRow = new ActionRowBuilder().addComponents(categorySelect);

        // Send response
        await interaction.reply({
            embeds: [setupEmbed],
            components: [actionRow],
            ephemeral: true
        });
    },

    async handleCategoryRoleConfig(interaction) {
        if (!interaction.isStringSelectMenu()) return;

        const selectedCategory = interaction.values[0];

        // Create modal for role ID input
        const roleModal = new ModalBuilder()
            .setCustomId(`roles_config_${selectedCategory}`)
            .setTitle(`Configure Role Access - ${this.getCategoryName(selectedCategory)}`);

        // Create input for role IDs
        const rolesInput = new TextInputBuilder()
            .setCustomId('role_ids_input')
            .setLabel('Role IDs (comma-separated)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Example: 123456789, 987654321, 567890123')
            .setRequired(true);

        // Add input to modal
        const actionRow = new ActionRowBuilder().addComponents(rolesInput);
        roleModal.addComponents(actionRow);

        // Show modal
        await interaction.showModal(roleModal);
    },

    getCategoryName(categoryValue) {
        const categoryNames = {
            'support': 'Support',
            'mesh_support': 'Mesh Support',
            'foundation_support': 'Foundation Support'
        };
        return categoryNames[categoryValue] || categoryValue;
    },

    async handleRoleModalSubmit(interaction) {
        if (!interaction.isModalSubmit()) return;

        // Validate and clean role IDs
        const roleIds = interaction.fields.getTextInputValue('role_ids_input')
            .split(',')
            .map(id => id.trim())
            .filter(id => /^\d+$/.test(id)); // Ensure only numeric IDs

        const category = interaction.customId.split('_').slice(2).join('_');

        // Validate role IDs exist in the server
        const invalidRoles = [];
        const validRoles = [];

        for (const roleId of roleIds) {
            try {
                const role = await interaction.guild.roles.fetch(roleId);
                if (role) {
                    validRoles.push(roleId);
                } else {
                    invalidRoles.push(roleId);
                }
            } catch (error) {
                invalidRoles.push(roleId);
            }
        }

        // Create confirmation embed with robust field handling
        const fields = [
            { 
                name: 'Valid Role IDs', 
                value: validRoles.length > 0 
                    ? validRoles.map(role => `• <@&${role}>`).join('\n')
                    : 'No valid roles found'
            }
        ];

        // Add invalid roles field only if there are invalid roles
        if (invalidRoles.length > 0) {
            fields.push({ 
                name: 'Invalid Role IDs', 
                value: invalidRoles.map(role => `• ${role}`).join('\n')
            });
        }

        const confirmEmbed = new EmbedBuilder()
            .setColor(validRoles.length > 0 ? '#00ff00' : '#ff0000')
            .setTitle(`Role Access Configuration - ${this.getCategoryName(category)}`)
            .addFields(fields)
            .setFooter({ text: 'Role configuration processed' });

        // Save valid roles to configuration file
        const configPath = path.join(__dirname, '..', 'config', 'ticket_roles.json');
        
        // Ensure config directory exists
        const configDir = path.join(__dirname, '..', 'config');
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir);
        }

        // Read existing configuration or create new
        let roleConfig = {};
        try {
            if (fs.existsSync(configPath)) {
                roleConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (error) {
            console.error('Error reading existing role configuration:', error);
        }

        // Update role configuration with valid roles
        roleConfig[category] = validRoles;

        // Write updated configuration
        try {
            fs.writeFileSync(configPath, JSON.stringify(roleConfig, null, 2));
        } catch (error) {
            console.error('Error saving role configuration:', error);
        }

        // Respond to modal
        await interaction.reply({
            embeds: [confirmEmbed],
            ephemeral: true
        });
    }
};