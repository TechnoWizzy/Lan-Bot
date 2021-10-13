import * as fs from 'fs';
import {roleMention} from "@discordjs/builders";
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import {
    Client,
    Intents,
    Collection,
    Snowflake,
    GuildMember,
    ButtonInteraction,
    SelectMenuInteraction, ApplicationCommand
} from 'discord.js';
import { token, client_id, guild_id } from './config.json';
import { team_roles } from './roles.json';

const client = new Client({
    intents:
        [
            Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS,
            Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES,
            Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
        ]
});
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const rest = new REST({ version: '9' }).setToken(token);

client["commands"] = new Collection();

/**
 * Ready logic
 */
client.on('ready', async () => { });

/**
 * Logs in client and registers Commands
 */
client.login(token).then(async () => {
    let commands = [];

    //Collect and Register Commands
    await collectAndSetCommandFiles(commands, commandFiles);
    await registerClientCommands(commands);
});

/**
 * Listens for multiple Interaction events
 */
client.on('interactionCreate', async interaction => {
    //Sort Interactions
    if (interaction.isButton()) await receiveButton(interaction);
    if (interaction.isSelectMenu()) await receiveSelectMenu(interaction);
    if (interaction.isCommand()) await receiveCommand(interaction);
});

/**
 * Takes data from Commands files (./commands/**) and set's them as Clients Commands
 * @param commands
 * @param commandFiles
 */
async function collectAndSetCommandFiles(commands, commandFiles) {
    for (let commandFile of commandFiles) {
        let command = require(`./commands/${commandFile}`);
        commands.push(command.data.toJSON());
        await client["commands"].set(command.data.name, command);
    }
}

/**
 * Takes all Commands and registers them with Discord Restful API
 * @param commands
 */
async function registerClientCommands(commands) {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(client_id, guild_id),
            {body: commands},
        );

        let guildCommands = await rest.get(Routes.applicationGuildCommands(client_id, guild_id)) as Array <ApplicationCommand>;

        for (let guildCommand of guildCommands) {
            let guild = await client.guilds.fetch(guild_id);
            let command = client["commands"].get(guildCommand.name);
            await guild.commands.permissions.set({ fullPermissions: [
                    {
                        id: guildCommand.id,
                        permissions: [{
                            id: guild_id,
                            type: 'ROLE',
                            permission: false,
                        }],
                    },
                ]})
            await command.setPermissions(guild, guildCommand.id);
        }

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
}

/**
 * Executes logic for a Command Interaction
 * @param interaction
 */
async function receiveCommand(interaction) {
    const command = client["commands"].get(interaction.commandName);

    if (!command) return;

    await command.execute(interaction);
}

/**
 * Executes logic for a Button Interaction
 * @param interaction
 */
async function receiveButton(interaction) {
    let snowflake = interaction.customId;
    let guildMember = interaction.member;

    await determineRoleAction(guildMember, snowflake, interaction);
}

/**
 * Executes logic for a SelectMenu Interaction
 * @param interaction
 */
async function receiveSelectMenu(interaction: SelectMenuInteraction) {
    let guildMember = <GuildMember> interaction.member;
    let snowflake = interaction.values[0];
    let schoolRoles = await getAnyCurrentSchoolRoles(guildMember);

    schoolRoles.forEach(role => { removeRoleFromMember(role.id, guildMember) });
    await determineRoleAction(guildMember, snowflake, interaction);
}

/**
 * Determines whether to add or remove a Role from a GuildMember
 * @param guildMember
 * @param snowflake
 * @param interaction
 */
async function determineRoleAction(guildMember: GuildMember, snowflake: Snowflake, interaction: ButtonInteraction | SelectMenuInteraction) {
    let hasRole = await memberHasRole(snowflake, guildMember);

    if (hasRole) {
        await removeRoleFromMember(snowflake, guildMember);
        await interaction.reply({content: `You removed the role **${roleMention(snowflake)}**`, ephemeral: true});
    } else {
        await addRoleToMember(snowflake, guildMember);
        await interaction.reply({content: `You received the role **${roleMention(snowflake)}**`, ephemeral: true});
    }
}

/**
 * Adds a Role to a GuildMember
 * @param snowflake
 * @param guildMember
 */
async function addRoleToMember(snowflake: Snowflake, guildMember: GuildMember) {
    await guildMember.roles.add(snowflake);
}

/**
 * Removes a Role from a GuildMember
 * @param snowflake
 * @param guildMember
 */
async function removeRoleFromMember(snowflake: Snowflake, guildMember: GuildMember) {
    await guildMember.roles.remove(snowflake);
}

/**
 * Returns any current school Roles a GuildMember has.
 * @param guildMember
 */
async function getAnyCurrentSchoolRoles(guildMember: GuildMember) {
    let roles = [];
    let guildMemberRoles = guildMember.roles.cache;

    team_roles.forEach(role => {
        guildMemberRoles.forEach(guildMemberRole => {
            if (guildMemberRole.id === role["role_id"]) roles.push(guildMemberRole)
        });
    });
    return roles;
}

/**
 * Determines whether a GuildMember has a certain Role
 * @param snowflake
 * @param guildMember
 */
async function memberHasRole(snowflake: Snowflake, guildMember: GuildMember) {
    let result = false;
    let roles = guildMember.roles.cache;

    roles.forEach(role => {
        if (role.id === snowflake) result = true;
    })
    return result;
}