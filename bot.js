const Discord = require('discord.js');
const logger = require('winston');
const config = require("./config.json");

var usersNotified = [];

logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
  colorize: true
});
logger.level = 'debug';

const bot = new Discord.Client();

bot.once('ready', () => {
  logger.info('Connected');
  logger.info('Logged in as: ' + bot.user);
});

roll = function(dice) {
  logger.debug("Rolling for: " + dice);

  const diceSplit = dice.split("d");

  if (diceSplit.length != 2) {
    logger.error("Wrong dice format");

    return;
  }

  var numberOfDice = parseInt(diceSplit[0]);

  if (isNaN(numberOfDice)) {
    numberOfDice = 1;
  }

  logger.debug("Number of dice to roll: " + numberOfDice);

  const diceType = parseInt(diceSplit[1]);

  logger.debug("Dice type: " + diceType);

  var result = 0;

  for (i = 0; i < numberOfDice; i++) {
    const rollResult = Math.floor(Math.random() * diceType) + 1;
    logger.debug("Dice roll " + (i + 1) + ": " + rollResult);
    result += rollResult;
  }

  logger.debug("Roll results: " + result);

  return result;
}

bot.on('presenceUpdate', (oldPresence, newPresence) => {
  if (newPresence.status === "online" && usersNotified.findIndex((item) => item === newPresence.userID) === -1) {
    const infoMessage = "Hi! I am dice roll bot. You can use me in following ways:\n" +
    "- you can just type \"!roll\" to roll d100\n" +
    "- you can also extend this with dice you want to roll, e.g. \"!roll d20\", \"!roll 2d10\", etc.\n" +
    "- if you want to know if you roll was succesful, you can also add target value, e.g. \"!roll target 30\", \"!roll d6 target 4\"\n" +
    "\n" + 
    "You can write directly to me or on any channel. Have fun!"

    newPresence.user.send(infoMessage);

    usersNotified.push(newPresence.userID);
  }
})

bot.on('message', (message) => {
  
  if (!message.content.startsWith(config.prefix) || message.author.bot) return;

  logger.debug("Received message: " + message.content);
  const args = message.content.slice(config.prefix.length).split(/ +/);
  const cmd = args.shift().toLowerCase();
  
  switch(cmd) {
    case 'roll':
      var dice = args[1];

      if (dice !== undefined && !dice.match("^[0-9]*d[0-9]+$")) {
        dice = undefined;
      }

      var targetIndex = 2;

      if (dice === undefined) {
        dice = "d100";
        targetIndex = 1;
      }

      const target = args[targetIndex] === "target" ? parseInt(args[targetIndex + 1]) : undefined;

      const rollResult = roll(dice);

      var returnMessage = message.author.username + " rolled " + dice + ", result: " + rollResult;

      if (target !== undefined) {
        const isRollSuccessful = rollResult <= target;
        
        returnMessage += ", target: " + target + ", roll " + (isRollSuccessful ? "successful" : "not successful");
      }

      message.channel.send(returnMessage);
    break;
  }
});

bot.login(process.env.BOT_TOKEN);