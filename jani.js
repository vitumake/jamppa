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
//   		author: vitumake                                                 	Ver. 0.1.7                                                                                       



// Enviroment vars
const dotenv = require('dotenv');
dotenv.config();

// Load conf
let conf;
try { conf = require('./config.json'); }
catch { throw new Error('You need to run \'setup.js\' first!'); }

// This is so that I can develop the code and run the bot on another client at the same time.
const dev = true;
const janiToken = dev ? conf.bot.dev_token : conf.bot.prod_token;

// Discord.js
const { Client, Events, IntentsBitField } = require('discord.js');

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

// Guild queues and other data
const guilds = new Map();

// print login to console (mainly to see which client is running)
client.once(Events.ClientReady, c=>{
	console.log(`Logged in as ${c.user.tag} in:`);
});
 
// Generate objects for all guilds
// Needed for modules to store data in the guild objects
const initGOBjs = new Promise(resp=>{
    // returns list of ids and names
    client.once(Events.ClientReady, c=>{
        const gData = c.guilds.cache.map(g=>[g.id, g.name]);
		gData.forEach(g=>{
			guilds.set({
				id: g[0],
				title: g[1],
			});
		});
    });
	resp();
});

// Export guild objects
module.exports = { guilds, client, initGOBjs };

// Console commands
require('./console');

// Chat commands
client.on('messageCreate', msg=>{
	if (msg.author.bot || msg.content.startsWith(conf.bot.cmdPrefix)) {
		const args = msg.content.split(' ');
		const guild = guilds.get(msg.guildId);

		switch (args[0].toLocaleLowerCase()) {

			case '!p': {

				// Abort if there is no channel to join

				// console.log(msg);

				if (!msg.member.voice?.channelId) {
					msg.channel.send('Not in voice channel...');
					break;
				}
					
				guild.player.addSong(arg);
				break;
			}
			
			case '!s': {
				guilds.get(msg.guildId).player.stop();
				break;
			}

			case '!help': {
				msg.channel.send('HIIIIIILJAAA!');
				break;
			} 
		}
	}
});

client.login(janiToken);