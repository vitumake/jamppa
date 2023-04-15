// Console commands

// jani guild objects

const { guilds } = require('./jani');

process.stdin.resume();
process.stdin.setEncoding('utf-8');

process.stdin.on('data', a=>{
	switch (a.trim()) {

		case 'guilds': {

			guilds.forEach(g=>{
                console.log(`${g.title}\n${g.queue.map(b=>b.info)}`);
            });
            break;

		}

	}
});
