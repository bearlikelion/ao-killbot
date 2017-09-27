/*
* @Author: Mark Arneman
* @Date:   2017-08-18 11:12:18
* @Last Modified by:   Mark Arneman
* @Last Modified time: 2017-08-21 12:35:33
*/

// Define static constants
const config = require('./config.json');

// Require modules
const Discord = require('discord.js');
const request = require('request');
const client = new Discord.Client();

var lastRecordedKill = -1;

/**
 * Fetch recent kills from the Gameinfo API
 * @param  {Number} limit  [max kills to get]
 * @param  {Number} offset [offset for first kill]
 * @return {json} [json array of events]
 */
function fetchKills(limit = 51, offset = 0) {
    request({
        uri: 'https://gameinfo.albiononline.com/api/gameinfo/events?limit='+limit+'&offset='+offset,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            parseKills(body);
        } else {
            console.log('Error: ', error); // Log the error
        }
    });
}

/**
 * Parse returned JSON from Gameinfo to
 * find alliance members on the killboard
 * @param  {json} events
 */
function parseKills(events) {
    var count = 0;
    var breaker = lastRecordedKill;

    events.some(function(kill, index) {
        // Save the most recent kill for tracking
        if (index == 0) {
            lastRecordedKill = kill.EventId;
        }

        // Don't process data for the breaker KILL
        if (kill.EventId != breaker)
            // Alliance KILL
            if (kill.Killer.AllianceName.toLowerCase() == config.allianceName.toLowerCase() || kill.Victim.AllianceName.toLowerCase() == config.allianceName.toLowerCase()) {
                postKill(kill);
            } else if (kill.Killer.GuildName.toLowerCase() == config.guildName.toLowerCase() || kill.Victim.GuildName.toLowerCase() == config.guildName.toLowerCase()) {
                postKill(kill);
            } else {
                count++;
            }

        return kill.EventId == breaker;
    });

    // console.log('- Skipped ' + count + ' kills');
}

function postKill(kill, channel = config.botChannel) {
    //quick fix to not post kills with 0 fame (like arena kills after the patch)
    if (kill.TotalVictimKillFame == 0){
         return;
    }

    var victory = false;
    if (kill.Killer.AllianceName.toLowerCase() == config.allianceName.toLowerCase() || kill.Killer.GuildName.toLowerCase() == config.guildName.toLowerCase()) {
        victory = true;
    }

    var assistedBy = "";
    if (kill.numberOfParticipants == 1) {
        var soloKill = [
            'All on their own',
            'Without assitance from anyone',
            'All by himself',
            'SOLO KILL'
        ];
        assistedBy = soloKill[Math.floor(Math.random() * soloKill.length)];
    } else {
        var assists = [];
        kill.Participants.forEach(function(participant) {
            if (participant.Name != kill.Killer.Name) {
                assists.push(participant.Name);
            }
        })
        assistedBy = "Assisted By: " + assists.join(', ');
    }

    itemCount = 0;
    kill.Victim.Inventory.forEach(function(inventory) {
        if (inventory !== null) {
            itemCount++;
        }
    });

    var itemsDestroyedText = "";
    if (itemCount > 0) {
        itemsDestroyedText = " destroying " + itemCount + " items";
    }

    var embed = {
        color: victory ? 0x008000 : 0x800000,
        author: {
            name: kill.Killer.Name + " killed " + kill.Victim.Name,
            icon_url: victory ? 'https://i.imgur.com/CeqX0CY.png' : 'https://albiononline.com/assets/images/killboard/kill__date.png',
            url: 'https://albiononline.com/en/killboard/kill/'+kill.EventId
        },
        title: assistedBy + itemsDestroyedText,
        description: 'Gaining ' + kill.TotalVictimKillFame + ' fame',
        thumbnail: {
            url: (kill.Killer.Equipment.MainHand.Type ? 'https://gameinfo.albiononline.com/api/gameinfo/items/' + kill.Killer.Equipment.MainHand.Type + '.png' : "https://albiononline.com/assets/images/killboard/kill__date.png")
        },
        timestamp: kill.TimeStamp,
        fields: [
            {
                name: "Killer Guild",
                value: (kill.Killer.AllianceName ? "["+kill.Killer.AllianceName+"] " : '') + (kill.Killer.GuildName ? kill.Killer.GuildName : '<none>'),
                inline: true
            },
            {
                name: "Victim Guild",
                value: (kill.Victim.AllianceName ? "["+kill.Victim.AllianceName+"] " : '') + (kill.Victim.GuildName ? kill.Victim.GuildName : '<none>'),
                inline: true
            },
            {
                name: "Killer IP",
                value: kill.Killer.AverageItemPower.toFixed(2),
                inline: true
            },
            {
                name: "Victim IP",
                value: kill.Victim.AverageItemPower.toFixed(2),
                inline: true
            },
        ],
        footer: {
            text: "Kill #" + kill.EventId
        }
    };

    console.log(embed);

    client.channels.get(channel).send({embed: embed});
}

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

    // Set 'Playing Game' in discord
    client.user.setGame(config.playingGame); // broken due to discord API changes

    fetchKills();

    // Fetch kills every 30s
    var timer = setInterval(function() {
        fetchKills();
    }, 30000);
});

/**
 * On receive message
 */
client.on('message', message => {
    if (message.content.indexOf(config.cmdPrefix) !== 0 || message.author.bot) return;
    else { // Execute command!
        var args = message.content.slice(config.cmdPrefix.length).trim().split(/ +/g);
        var command = args.shift().toLowerCase();

        // Test Command - !ping
        if (command === 'ping') {
            message.reply('pong');
        }

        else if (command === 'kbinfo') {
            request({
                json: true,
                uri: 'https://gameinfo.albiononline.com/api/gameinfo/events/' + args[0]
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    postKill(body, message.channel.id);
                } else {
                    console.log('Error: ', error); // Log the error
                }
            });
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
