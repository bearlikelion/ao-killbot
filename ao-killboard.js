/*
* @Author: Mark Arneman
* @Date:   2017-08-18 11:12:18
* @Last Modified by:   Mark Arneman
* @Last Modified time: 2017-08-18 12:43:41
*/

/**
 * Define static constants and load libraries
 */
const config = require("./config.json");
const Discord = require('discord.js');
const client = new Discord.Client();

/**
 * Wait until ready and logged in
 * If we do not wait for the ready event
 * All commands will process before we are authorized
 */
client.on('ready', () => {
    console.log('Ready and waiting!');

    // If the config.username differs, change it
    if (client.user.username != config.username) {
        client.user.setUsername(config.username);
    }

    // Set 'Playing' in discord
    client.user.setGame(config.playingGame); // broken due to discord API changes
});

/**
 * On receive message
 */
client.on('message', message => {
    if (message.content.indexOf(config.cmdPrefix) !== 0 || message.author.bot) return;
    else {
        var command = message.content.substr(1).toLowerCase();

        // Test Command - !ping
        if (command === 'ping') {
            message.reply('pong');
        }

        // [ADMIN] - clear config.botChannel messages
        else if (command === 'kbclear') {
            if (config.admins.includes(message.author.id) && message.channel.id == config.botChannel) {
                message.channel.send('Clearing Killboard').then(msg => {
                    msg.channel.fetchMessages().then(messages => {
                        message.channel.bulkDelete(messages);
                        console.log("[ADMIN] " + message.author.username + " cleared Killboard");
                    })
                })
            }
        }
    }
});

client.login(config.token);