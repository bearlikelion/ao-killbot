# AO-Killboard

A discord bot for Albion Online's killboard

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

![Screenshot](https://i.imgur.com/gLnvJpX.png)

### Usage
* !ping - replies with @user pong
* !kbclear - delets all messages in the config.botChannel
* !kbinfo <eventId> - displays the killboard post for a specific kill to the current channel

### Prerequisites

* [NodeJS](https://nodejs.org/)

### Installing

```
npm install
cp config.json.example config.json
-- Edit config.json in a text editor of your choice --
node ao-killbot.js
```

### Built With

* [Discord.js](https://github.com/hydrabolt/discord.js/) - Discordapp library for Node.js and browsers.
* [Request](https://github.com/request/request) - Simplified HTTP client

## Authors

* **Mark Arneman** *Marn#8945* - [Arneman.me](http://arneman.me)