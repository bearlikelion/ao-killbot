/**
 * Discord bot for the APEX Albion Alliance
 * @author: Mark Arneman <mark@arneman.me>
 */

var lastRecordedKill = 0;

var wait = require('wait.for');
const request = require('request');
const Discord = require('discord.io');
const config = require("./config.json");

// Channel IDs
// 8-bit: 348106067319980034
// APEX:  347871354076528641

var client = new Discord.Client({
    autorun: true,
    token: config.token
});

function getKills(limit = 51, offset = 0) {
    console.log('Get kills');
    request('https://gameinfo.albiononline.com/api/gameinfo/events?limit='+limit+'&offset='+offset, function(error, response, body) {
        // If request was successful status:(200)
        if (!error && response.statusCode == 200) {
            var events = JSON.parse(body);
            parseKills(events);
        } else {
            console.log('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        }
    });
};

function parseKills(events) {
    console.log('  Parse kills');
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
            if (kill.Killer.AllianceName == config.allianceName) {
                console.log('Alliance Kill');
                client.sendMessage({
                    to: config.botChannel,
                    message: "[VICTORY] " + kill.Killer.Name + " killed " + kill.Victim.Name + "\nKillboard: https://albiononline.com/en/killboard/kill/" + kill.EventId
                });
            }
            // Alliance DEATH
            else if (kill.Victim.AllianceName == config.allianceName) {
                console.log('Alliance Death');
                client.sendMessage({
                    to: config.botChannel,
                    message: "[DEFEAT] " + kill.Victim.Name + " was killed by " + kill.Killer.Name + "\nKillboard: https://albiononline.com/en/killboard/kill/" + kill.EventId
                });
            }
            else {
                count++;
            }

        return kill.EventId == breaker;
    });

    console.log('  Skipped ' + count + ' kills');
};

/**
 * Wait until discord authorizes the
 * bot login before we process data
 */
client.on('ready', function() {
    client.setPresence({
        game: {
            name: "Made by @Marn"
        }
    });

    console.log('['+Date.now()+'] Logged in as %s \n', client.username);
    // getKills();

    // var timer = setInterval(function() {
    //     getKills();
    // }, 30000);
});

/**
 * Read the content of a messages
 * @param  {message}
 * @return {void}
 */
client.on('message', function(user, userID, channelID, message, event) {
    if (message.toLowerCase() == 'ping') {
        console.log('Ping request from ' + user)
        client.sendMessage({
            to: channelID,
            message: 'pong'
        });
    }
});