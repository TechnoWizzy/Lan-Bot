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
const discord_js_1 = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu } = require("discord.js");
const { team_roles } = require('../roles.json');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Creates a various purpose menu')
        .addStringOption(option => option
        .setName('menu_name')
        .setDescription('The name of the menu to setup')
        .setRequired(true)
        .addChoice('roles', 'roles_menu')
        .addChoice('teams', 'teams_menu')
        .addChoice('warning', 'warning')),
    /**
     * Execution logic for the Setup Command
     * @param interaction
     */
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            let menuName;
            let guildMember;
            menuName = interaction.options.getString('menu_name');
            guildMember = interaction.member;
            if (guildMember.permissions.has(discord_js_1.Permissions.FLAGS.MANAGE_MESSAGES)) {
                if (menuName === 'roles_menu')
                    yield buildRolesMenu(interaction);
                if (menuName === 'teams_menu')
                    yield buildTeamsMenu(interaction);
                else
                    yield buildWarningMessage(interaction);
            }
            else {
                interaction.reply({ content: 'Sorry, you don\'t have permission to do this' });
            }
        });
    }
};
/**
 * Builds a warning message
 * @param interaction
 */
function buildWarningMessage(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        let embed = new MessageEmbed()
            .setDescription("Be careful to check if you already have your schools role.\n" +
            "The bot will add the role if you don't have it.\n" +
            "The bot will remove the role if you already have it.\n" +
            "You can view your school channels once the specific role is applied to you.\n" +
            "If there's an issues let any admin know!");
        interaction.reply({ embeds: [embed] });
    });
}
/**
 * Builds the Roles Menu
 * @param interaction
 */
function buildRolesMenu(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        let embed;
        let actionRow;
        embed = buildRolesEmbed();
        actionRow = buildRolesActionRow();
        interaction.reply({ embeds: [embed], components: [actionRow] });
    });
}
/**
 * Builds the Teams Menu
 * @param interaction
 */
function buildTeamsMenu(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        let embed;
        let actionRows;
        embed = buildTeamsEmbed();
        actionRows = buildTeamsActionRow();
        interaction.reply({ embeds: [embed], components: actionRows });
    });
}
/**
 * Builds the Teams Embed
 */
function buildTeamsEmbed() {
    return new MessageEmbed()
        .setTitle('Schools Menu')
        .setDescription('Select which school you represent.');
}
/**
 * Builds the Roles Embed
 */
function buildRolesEmbed() {
    return new MessageEmbed()
        .setTitle('Roles Menu')
        .setDescription('Select all roles that apply to you.');
}
/**
 * Builds the Teams ActionRow
 */
function buildTeamsActionRow() {
    let schools;
    let actionRowsArray;
    schools = sortSchools();
    actionRowsArray = [];
    for (let i = 0; i < Math.ceil(schools.length / 25); i++) {
        let actionRow = new MessageActionRow();
        let selectMenu = new MessageSelectMenu()
            .setCustomId(`school_${i}`)
            .setPlaceholder('Select Your School');
        for (let j = i * 25; j < (i * 25) + 25; j++) {
            if (schools[j] !== undefined) {
                selectMenu.addOptions([
                    {
                        label: `${schools[j]["name"]}`,
                        value: `${schools[j]["role_id"]}`
                    }
                ]);
            }
        }
        actionRow.addComponents(selectMenu);
        actionRowsArray.push(actionRow);
    }
    return actionRowsArray;
}
/**
 * Builds the Roles ActionRow
 */
function buildRolesActionRow() {
    return new MessageActionRow()
        .addComponents(new MessageButton()
        .setCustomId('864329849916358666')
        .setLabel('Player')
        .setStyle('PRIMARY'), new MessageButton()
        .setCustomId('864329792156729354')
        .setLabel('Team Rep')
        .setStyle('PRIMARY'));
}
/**
 * Sorts the list of schools alphabetically
 */
function sortSchools() {
    let schools;
    schools = team_roles;
    return schools.sort(function (a, b) {
        let name1 = a.name.toLowerCase();
        let name2 = b.name.toLowerCase();
        if (name1 < name2) {
            return -1;
        }
        if (name2 < name1) {
            return 1;
        }
        return 0;
    });
}
