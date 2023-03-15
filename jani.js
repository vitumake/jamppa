'use strict';

// Enviroment vars
const dotenv = require('dotenv');
dotenv.config();

// Discord.js
const { Client, Events, GatewayIntentBits } = require('discord.js');

// Module containing commands
const play = require('./jani_modules/play');

// Bot token
const conf = require('./config.json');

// Create new client and login
const client = new Client({ intents: [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildMembers,
] });

// Check login
client.once(Events.ClientReady, c=>{
	console.log(`Logged in as ${c.user.tag}`);
});


// Eventlisteners

// Commands
client.on('messageCreate', async msg=>{
	if (msg.author.bot || msg.content.startsWith(conf.bot.cmdPrefix)) {
		const msgVal = msg.content.slice(1);
		if (msgVal.startsWith('ping')) {
			console.log('pong');
		}
	}
});

client.login(conf.bot.token);