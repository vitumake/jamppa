'ur mom is strict'; // :)))) 8====D

// Module for searching and playing music
const pl = require('play-dl'); // Everything

// Import guild data
const { guilds, initGOBjs } = require('./jani');

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

// Player class that main script uses to play audio
class janiPlayer {
    constructor(gldObj) {

        // Guild obj
        this.guild = gldObj;

        // Song queue
        this.queue = [];

        // Voice connection
        this.conn = null; // Null to begin with

        // Audio player
        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play, // Can't remember what it does. Something important I guess
            },
        });

        // Player listeners
        // On idle find next song or stop
        this.player.on(AudioPlayerStatus.Idle, ()=>{
            this.queue.pop();
            if (this.queue.length > 0) {
                getAudioRes(this.queue[0].track)
                .then(res=>{
                    this.player.play(res);
                });
            }
            else {
                this.conn.destroy();
                this.conn = null;
            }
        });

        // When player starts 
        this.player.on(AudioPlayerStatus.Playing, ()=>{
            console.log(`Player playing in ${this.guild.title}`);
            this.queue[0].channel.send(`Now playing: ${this.queue[0].info} ${this.queue[0].track.durationRaw}`);
        });
        
        // Error handling
        this.player.on('error', error=>{
            this.queue[0].channel.send('Voi muna');
            console.error(error);
            this.conn.destroy();
        });

    }

    addSong(msg) {
        // Get song
        getSongObj(msg)
        .then(song=>{

            // Add song to que.
            this.queue.unshift(song);
            
            // If there is no connection run init.
            // Because there is no active connection dont send duplicate messages
            if (this.conn == null) {
                this.initConn(msg);
            } 
            // If there is an active connection send message to channel
            else {
                msg.channel.send(`${msg.author.username} added ${song.info} to queue!`);
            }
        });
    }

    initConn(msg) {
        // Debugging
        console.log(`Joining ${this.guild.title}`);
        
        // Voice connection
        this.conn = joinVoiceChannel({
            channelId: msg.member.voice.channelId,
            guildId: this.guild.id,
            adapterCreator: msg.guild.voiceAdapterCreator,
            selfDeaf: false, // this just looks stupid
            selfMute: false, // this may also be needed
        });

        // Start playing
        getAudioRes(this.queue[0].track)
        .then(res=>{
            this.player.play(res);
        });
        // Subscribe the connection to the player
        this.conn.subscribe(this.player);
    }


}

// Init play class on every guild
initGOBjs.then(()=>{
    guilds.forEach(guild=>{
    console.log(guild);
        guild.play = janiPlayer(guild);
    });
});

// Get audio resource
function getAudioRes(track) {
    return new Promise(reslv=>{
        const strm = pl.stream(track.url, {
            quality: 1,
        });
        reslv(createAudioResource(strm.stream, {
                inputType: strm.type,
        }));
    });
}

// Get song object
function getSongObj(msg) {
    
    return new Promise((res, rej)=>{
        const arg = msg.content.split(' ').slice(1).join(' ');
        const type = pl.validate(arg);
        
        // Log to console the type for debugging

        console.log(`Search type: "${type}"`);
        console.log(`Search value: "${arg}"`);
        
        // Dont bother with logic if type is not found
        if (!type) {
            console.log('Play-dl failed to find type for search'); 
            msg.channel.send('Ei pyge!');
            rej('Invalid track type');
        }
        
        // Get play-dl video object
        getTrack(type, arg)
        .then(video=>{
            // Song object for queue
            res({
                user: msg.author.username, // Discord user obj, // Discord channel obj
                info: video.info,
                channel: msg.channel,
                track: video.track[0], // Play-dl video obj (either Youtube or Soundcloud)
            });
        });
        .
    });
}

// Get play-dl video object
function getTrack(type, arg) {
    return new Promise((res, rej)=>{
        switch (type) {
            
            // This will check if access token has expired or not. If yes, then refresh the token.
            case 'sp_track':
                if (pl.is_expired()) {
                    pl.refreshToken();
                }
                const spData = pl.spotify(arg);
                const artists = spData.artists.map(a=>[a.name]);
                res({
                track: pl.search(`${spData.name} ${artists[0].join(' ')}`),
                info: `${spData.name} - ${artists.join(' ')}`,
                });
                break;
            
            case 'yt_video':
            case 'search':
                res({
                    track: pl.search(arg, { limit: 1 }),
                    info: `${this.track.name}`,
                });
                break;

            default:
                rej('Un-supported platform!');
        }
    });
}

module.exports = { janiPlayer };