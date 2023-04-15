'ur mom is strict'; // :)))) 8====D

// Module for searching and playing music
const pl = require('play-dl'); // Everything

// Import guild data
const { guilds, client, Events } = require('./jani');

// filesystem
const fs = require('fs');

// All that discord.js voice jazz
const { 
    joinVoiceChannel,
    createAudioResource,
    AudioPlayerStatus,
    createAudioPlayer, 
    NoSubscriberBehavior,
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

// Generate objects for all guilds
const initGOBjs = new Promise(resp=>{
    // Get list of guilds
    client.once(Events.ClientReady, c=>{
        resp(c.guilds.cache.map(g=>[g.id, g.name]));
    });
});

initGOBjs.then(gids=>{
    gids.forEach(g=>{
    console.log(g[1]);
        guilds.set(g[0], {
            title: g[1],
            queue: [],
            player: null,
            conn: null,
        });
    });
    
    // Create player and add listeners to every guild
    guilds.forEach(gObj=>{

        // Current song
        const queue = gObj.queue;

        gObj.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play, // Can't remember what it does. Something important I guess
            },
        });

        // On idle find next song or stop
        gObj.player.on(AudioPlayerStatus.Idle, async ()=>{
            queue.pop();
            if (queue.length > 0) {
                const res = await getAudioRes(queue[0].track);
                gObj.player.play(res);
            }
            else {
                gObj.conn.destroy();
                gObj.conn = null;
            }
        });

        // When player starts 
        gObj.player.on(AudioPlayerStatus.Playing, ()=>{
            console.log(`Player playing in ${gObj.title}`);
            queue[0].channel.send(`Now playing: ${queue[0].info} ${queue[0].track.durationRaw}`);
        });
        
        // Error handling
        gObj.player.on('error', error=>{
            queue[0].channel.send('Voi muna');
            console.error(error);
            gObj.conn.destroy();
        });
    });
    console.log(guilds);
});

// Get audio resource
async function getAudioRes(track) {
    
    const strm = await pl.stream(track.url, {
        quality: 1,
    }); // Get stream
    
    return createAudioResource(strm.stream, {
        inputType: strm.type,
    });
}

// Initializing all shit needed to play music
async function initConn(msg) {

    
    // Jani guild object
    const gObj = guilds.get(msg.guildId);

    // Debugging
    console.log(`Joining ${gObj.title}`);
    
    // Voice connection
    gObj.conn = joinVoiceChannel({
        channelId: msg.member.voice.channelId,
        guildId: msg.guildId,
        adapterCreator: msg.guild.voiceAdapterCreator,
        selfDeaf: false, // this just looks stupid
        selfMute: false, // this may also be needed
    });

    // Start playing
    gObj.player.play(await getAudioRes(gObj.queue[0].track));
    // console.log(await getAudioRes(msg));
    
    // Subscribe the connection to the player
    gObj.conn.subscribe(gObj.player);
    
}

// Adding song to que
async function addSong(msg) {
    
    const arg = msg.content.split(' ').slice(1).join(' ');
    const type = await pl.validate(arg);
    const gObj = guilds.get(msg.guildId);
    
    // Log to console the type for debugging

    console.log(`Search type: "${type}"`);
    console.log(`Search value: "${arg}"`);
    
    // Dont bother with logic if type is not found
    if (!type) {
        console.log('Play-dl failed to find type for search'); 
        msg.channel.send('Ei pyge!');
    }
    
    // yt video object
    let track, info;
    
    // Get the yt url from different links
    switch (type) {
        
        case 'sp_track':
            if (pl.is_expired()) {
                await pl.refreshToken(); // This will check if access token has expired or not. If yes, then refresh the token.
            }
            const spData = await pl.spotify(arg);
            const artists = spData.artists.map(a=>[a.name]);
            track = await pl.search(`${spData.name} ${artists[0].join(' ')}`);
            info = `${spData.name} - ${artists.join(' ')}`;
            break;
        
        case 'yt_video':
        case 'search':
            track = await pl.search(arg, { limit: 1 });
            info = `${track.name}`;
            break;

        default:
            msg.channel.send('Un-supported platform!');
            return;
    }

    // Song object for queue
    const song = {
        user: msg.author.username, // Discord user obj, // Discord channel obj
        info: info,
        channel: msg.channel,
        track: track[0], // Play-dl video obj (either Youtube or Soundcloud)
    };
    // Add song to que.
    gObj.queue.unshift(song);

    // If there is no connection run init.
    if (gObj.conn == null) {
        initConn(msg);
    } 
    else {
        guilds.set(msg.guildId, gObj);
        msg.channel.send(`${msg.author.username} added ${song.info} to queue!`);
    }

    // Debug and legacy logic
    // return `Added to que: ${track[0].title} requested by ${msg.author.username}`;
    // if (!que.has(msg.guildId)) que.set(msg.guildId, []);

}

// Other commands

module.exports = { addSong };