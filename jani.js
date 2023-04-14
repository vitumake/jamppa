//
//                                                                                                
//   .sSSSSSSSs. .sSSSSs.    .sSSSSs.    .sSSSSs.          SSSSS .sSSSSs.    .sSSSs.  SSSSS SSSSS 
//   S SSS SSSSS S SSSSSSSs. S SSSSSSSs. S SSSSSSSs.       S SSS S SSSSSSSs. S SSS SS SSSSS S SSS 
//   S  SS SSSS' S  SS SSSSS S  SS SSSS' S  SS SSSSS       S  SS S  SS SSSSS S  SS  `sSSSSS S  SS 
//   S..SSsSSSa. S..SS SSSSS S..SSsSSSa. S..SS SSSSS       S..SS S..SSsSSSSS S..SS    SSSSS S..SS 
//   S:::S SSSSS S:::S SSSSS S:::S SSSSS S:::S SSSSS       S:::S S:::S SSSSS S:::S    SSSSS S:::S 
//   S;;;S SSSSS S;;;S SSSSS S;;;S SSSSS S;;;S SSSSS       S;;;S S;;;S SSSSS S;;;S    SSSSS S;;;S 
//   S%%%S SSSSS S%%%S SSSSS S%%%S SSSSS S%%%S SSSSS SSSSS S%%%S S%%%S SSSSS S%%%S    SSSSS S%%%S 
//   SSSSS SSSSS SSSSSsSSSSS SSSSSsSSSS' SSSSSsSSSSS `:;SSsSSSSS SSSSS SSSSS SSSSS    SSSSS SSSSS 
//                                                                                                
//   		author: vitumake                                                 	Ver. 0.1.3                                                                                       



// Enviroment vars
const dotenv = require('dotenv');
dotenv.config();

// Load conf
let conf;
try { conf = require('./config.json'); }
catch { throw new Error('You need to run \'setup.js\' first!'); }

// Discord.js
const { Client, Events, IntentsBitField } = require('discord.js');

// Jani Modules
const { addSong, guilds } = require('./play');

// Create new client and login
const janiInts = new IntentsBitField();

// God I hate this fucking intents shit. It used to be so easy but no
janiInts.add(
	IntentsBitField.Flags.Guilds,
	IntentsBitField.Flags.GuildMessages,
	IntentsBitField.Flags.MessageContent,
	IntentsBitField.Flags.GuildMembers,
	IntentsBitField.Flags.GuildVoiceStates,
);

const client = new Client({ intents: janiInts });

// Check login
client.once(Events.ClientReady, c=>{
	console.log(`Logged in as ${c.user.tag}`);
});


// Listeners

// Chat commands
client.on('messageCreate', async msg=>{
	if (msg.author.bot || msg.content.startsWith(conf.bot.cmdPrefix)) {
		const args = msg.content.split(' ');

		switch (args[0].toLocaleLowerCase()) {

			case '!p', '!play', '!pl': {

				// Abort if there is no channel to join

				// console.log(msg);

				if (!msg.member.voice?.channelId) {
					msg.channel.send('Not in voice channel...');
					break;
				}
					await addSong(msg);

				break;
			}
			
			case '!s': {
				if (guilds.has(msg.guildId)) {
					const gObj = guilds.get(msg.guildId);
					gObj.player.stop();
				}
				break;
			}

			case '!help': {
				msg.channel.send('HIIIIIILJAAA!');
				break;
			} 
		}
	}
});

// Console commands
process.stdin.resume();
process.stdin.setEncoding('utf-8');

process.stdin.on('data', a=>{
	switch (a.trim()) {
		case 'guilds': {
			console.log(guilds);
		}
	}
});

client.login(conf.bot.prod_token);