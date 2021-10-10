"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const builders_1 = require("@discordjs/builders");
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const discord_js_1 = require("discord.js");
const config_json_1 = require("./config.json");
const roles_json_1 = require("./roles.json");
const client = new discord_js_1.Client({ intents: [discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_MEMBERS, discord_js_1.Intents.FLAGS.GUILD_BANS, discord_js_1.Intents.FLAGS.GUILD_MESSAGES, discord_js_1.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, discord_js_1.Intents.FLAGS.DIRECT_MESSAGES, discord_js_1.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS] });
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const rest = new rest_1.REST({ version: '9' }).setToken(config_json_1.token);
client["commands"] = new discord_js_1.Collection();
/**
 * Ready logic
 */
client.on('ready', () => __awaiter(void 0, void 0, void 0, function* () { }));
/**
 * Logs in client and registers Commands
 */
client.login(config_json_1.token).then(() => __awaiter(void 0, void 0, void 0, function* () {
    let commands = [];
    //Collect and Register Commands
    yield collectAndSetCommandFiles(commands, commandFiles);
    yield registerClientCommands(commands);
}));
/**
 * Listens for multiple Interaction events
 */
client.on('interactionCreate', (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    //Sort Interactions
    if (interaction.isButton())
        yield receiveButton(interaction);
    if (interaction.isSelectMenu())
        yield receiveSelectMenu(interaction);
    if (interaction.isCommand())
        yield receiveCommand(interaction);
}));
/**
 * Takes data from Commands files (./commands/**) and set's them as Clients Commands
 * @param commands
 * @param commandFiles
 */
function collectAndSetCommandFiles(commands, commandFiles) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let commandFile of commandFiles) {
            let command = require(`./commands/${commandFile}`);
            commands.push(command.data.toJSON());
            yield client["commands"].set(command.data.name, command);
        }
    });
}
/**
 * Takes all Commands and registers them with Discord Restful API
 * @param commands
 */
function registerClientCommands(commands) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Started refreshing application (/) commands.');
            yield rest.put(v9_1.Routes.applicationGuildCommands(config_json_1.client_id, config_json_1.guild_id), { body: commands });
            console.log('Successfully reloaded application (/) commands.');
        }
        catch (error) {
            console.error(error);
        }
    });
}
/**
 * Executes logic on a Command Interaction
 * @param interaction
 */
function receiveCommand(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = client["commands"].get(interaction.commandName);
        if (!command)
            return;
        yield command.execute(interaction);
    });
}
/**
 * Executes logic on a Button Interaction
 * @param interaction
 */
function receiveButton(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        let snowflake = interaction.customId;
        let guildMember = interaction.member;
        yield determineRoleAction(guildMember, snowflake, interaction);
    });
}
/**
 * Executes logic on a SelectMenu Interaction
 * @param interaction
 */
function receiveSelectMenu(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        let guildMember = interaction.member;
        let snowflake = interaction.values[0];
        let schoolRoles = yield getAnyCurrentSchoolRoles(guildMember);
        schoolRoles.forEach(role => { removeRoleFromMember(role.id, guildMember); });
        yield determineRoleAction(guildMember, snowflake, interaction);
    });
}
/**
 * Determines whether to add or remove a Role from a GuildMember
 * @param guildMember
 * @param snowflake
 * @param interaction
 */
function determineRoleAction(guildMember, snowflake, interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        let hasRole = yield memberHasRole(snowflake, guildMember);
        if (hasRole) {
            yield removeRoleFromMember(snowflake, guildMember);
            interaction.reply({ content: `You removed the role **${builders_1.roleMention(snowflake)}**`, ephemeral: true });
        }
        else {
            yield addRoleToMember(snowflake, guildMember);
            interaction.reply({ content: `You received the role **${builders_1.roleMention(snowflake)}**`, ephemeral: true });
        }
    });
}
/**
 * Adds a Role to a GuildMember
 * @param snowflake
 * @param guildMember
 */
function addRoleToMember(snowflake, guildMember) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield memberHasRole(snowflake, guildMember)))
            yield guildMember.roles.add(snowflake);
        else
            yield removeRoleFromMember(snowflake, guildMember);
    });
}
/**
 * Removes a Role from a GuildMember
 * @param snowflake
 * @param guildMember
 */
function removeRoleFromMember(snowflake, guildMember) {
    return __awaiter(this, void 0, void 0, function* () {
        yield guildMember.roles.remove(snowflake);
    });
}
/**
 * Returns any current school Roles a GuildMember has.
 * @param guildMember
 */
function getAnyCurrentSchoolRoles(guildMember) {
    return __awaiter(this, void 0, void 0, function* () {
        let roles = [];
        let guildMemberRoles = guildMember.roles.cache;
        roles_json_1.team_roles.forEach(role => {
            guildMemberRoles.forEach(guildMemberRole => {
                if (guildMemberRole.id === role["role_id"])
                    roles.push(guildMemberRole);
            });
        });
        return roles;
    });
}
/**
 * Determines whether a GuildMember has a certain Role
 * @param snowflake
 * @param guildMember
 */
function memberHasRole(snowflake, guildMember) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = false;
        let roles = guildMember.roles.cache;
        roles.forEach(role => {
            if (role.id === snowflake)
                result = true;
        });
        return result;
    });
}
