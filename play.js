'ur mom is strict'; // :)))) 8====D

// Module for searching and playing music
const pl = require('play-dl'); // Everything

// filesystem
const fs = require('fs');

// All that discord.js voice jazz
const { 
    joinVoiceChannel,
    createAudioPlayer, 
    NoSubscriberBehavior,
    createAudioResource,
    AudioPlayerStatus,
} = require('@discordjs/voice');

// Check if datafile exists
// If not then ask to run setup first
fs.access('./.data/spotify.data', fs.F_OK, async e=>{
    
    if (e) throw new Error('You need to run \'setup.js\' first!');
    const raw = fs.readFileSync('./.data/spotify.data');
    const data = JSON.parse(raw);

    // Play-dl tokens
    await pl.setToken({
        spotify : {
            client_id: data.client_id,
            client_secret: data.client_secret,
            refresh_token: data.refresh_token,
            market: data.market,
           },
    });

});

// Globul vars :)))
const guilds = new Map();

// Get audio resource
async function getAudioRes(msg) {
    
    const gObj = guilds.get(msg.guildId); // Get jani guild object
    const strm = await pl.stream(gObj.queue[0].track.url, {
        quality: 1,
    }); // Get stream
    
    return createAudioResource(strm.stream, {
        inputType: strm.type,
    });
}

// Initializing all shit needed to play music
async function initPlay(msg) {

    // Debugging
    console.log(`Joining ${msg.guild.name}`);
    
    // Voice connection
    const conn = joinVoiceChannel({
        channelId: msg.member.voice.channelId,
        guildId: msg.guildId,
        adapterCreator: msg.guild.voiceAdapterCreator,
        selfDeaf: false, // this just looks stupid
        selfMute: false, // this may also be needed
    });

    // Audio player
    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Play, // Can't remember what it does. Something important I guess
        },
    });

    // Add connection and player to guild map
    const gObj = guilds.get(msg.guildId);
    gObj.player = player;
    gObj.conn = conn;
    guilds.set(msg.guildId, gObj);

    // Start playing
    player.play(await getAudioRes(msg));
    // console.log(await getAudioRes(msg));
    
    // Subscribe the connection to the player
    conn.subscribe(player);
    
    // Damn I love these event listeners
    // When player is idling find new song or stop
    player.on(AudioPlayerStatus.Idle, async ()=>{

        console.log(`Player idle in ${msg.guildId}`);
        gObj.queue.pop();
        console.log(gObj.queue.length);
        if (gObj.queue.length > 0) {
            const res = await getAudioRes(msg);
            player.play(res);
        }
        else {
            gObj.player.stop();
            gObj.conn.destroy();
            guilds.delete(msg.guildId);
            console.log(`Destroyed player in ${gObj.title}`);
        }
    });
    
    // When player starts playing send message to channel
    player.on(AudioPlayerStatus.Playing, ()=>{
        
        console.log(`Player playing in ${msg.guild.name}`);
        msg.channel.send(`Now playing: ${gObj.queue[0].track.title} ${gObj.queue[0].track.durationRaw}`);

    });

    // Error handling
    player.on('error', error=>{
        msg.channel.send('Voi muna');
        console.error(error);
        conn.destroy();
    });
}

// Adding song to que
async function addSong(msg) {
    
    const arg = msg.content.split(' ').slice(1).join(' ');
    const type = await pl.validate(arg);
    
    // Log to console the type for debugging

    console.log(`Search type: "${type}"`);
    console.log(`Search value: "${arg}"`);
    
    // Dont bother with logic if type is not found
    if (!type) {
        console.log('Play-dl failed to find type for search'); 
        msg.channel.send('Ei pyge!');
    }
    
    // yt video object
    let track;
    
    // Get the yt url from different links
    switch (type) {
        
        case 'sp_track': {

            if (pl.is_expired()) {
                await pl.refreshToken(); // This will check if access token has expired or not. If yes, then refresh the token.
            }

            const spData = await pl.spotify(arg);
            track = await pl.search(`${spData.name}`);
            break;
        }
        
        case 'search', 'yt_video': {
            track = await pl.search(arg, { limit: 1 });
            break;
        }
        default:
            msg.channel.send('Un-supported platform!');
    }

    
    // Song object for queue
    const song = {
        user: msg.author.username, // Discord user obj, // Discord channel obj
        track: track[0], // Play-dl video obj (either Youtube or Soundcloud)
    };

    // Add song to que if it exists.
    // If not then create a queue and init the player.
    if (!guilds.has(msg.guildId)) {
        guilds.set(msg.guildId, {
            title: msg.guild.name,
            queue: [song],
            player: null,
            conn: null,
        });
        initPlay(msg);
    } 
    else {
        const gObj = guilds.get(msg.guildId);
        gObj.queue.unshift(song);
        guilds.set(msg.guildId, gObj);
        msg.channel.send(`${msg.author.username} added ${song.track.title} ${song.track.durationRaw} to queue!`);
    }

    // Debug and legacy logic
    // return `Added to que: ${track[0].title} requested by ${msg.author.username}`;
    // if (!que.has(msg.guildId)) que.set(msg.guildId, []);

}

// Other commands

module.exports = { addSong, guilds };