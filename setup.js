// Needed to run for play-dl to get spotify token
// Also creates bot config and lists other dependencies

const { generateDependencyReport } = require('@discordjs/voice');

console.log(generateDependencyReport());

const play = require('play-dl');

play.authorization();