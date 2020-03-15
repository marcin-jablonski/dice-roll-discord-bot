var Discord = require('discord.js');
var logger = require('winston');

var usersNotified = [];

logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
  colorize: true
});
logger.level = 'debug';

var bot = new Discord.Client();

bot.once('ready', () => {
  logger.info('Connected');
  logger.info('Logged in as: ' + bot.user);
});

roll = function(dice) {
  logger.debug("Rolling for: " + dice);

  var diceSplit = dice.split("d");

  if (diceSplit.length != 2) {
    logger.error("Wrong dice format");

    return;
  }

  var numberOfDice = diceSplit[0];

  if (numberOfDice === "") {
    numberOfDice = 1;
  }

  logger.debug("Number of dice to roll: " + numberOfDice);

  var diceType = diceSplit[1];

  logger.debug("Dice type: " + diceType);

  var result = 0;

  for (i = 0; i < numberOfDice; i++) {
    var rollResult = Math.floor(Math.random() * diceType) + 1;
    logger.debug("Dice roll " + (i + 1) + ": " + rollResult);
    result += rollResult;
  }

  logger.debug("Roll results: " + result);

  return result;
}

bot.on('presenceUpdate', (oldPresence, newPresence) => {
  if (newPresence.status === "online" && usersNotified.findIndex((item) => item === newPresence.userID) === -1) {
    let infoMessage = "Hi! I am dice roll bot. You can use me in following ways:\n" +
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
  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with `!`
  if (message.content.substring(0, 1) == '!') {
    logger.debug("Received message: " + message.content);
    var args = message.content.substring(1).split(' ');
    var cmd = args[0];
    
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

        var target = args[targetIndex] === "target" ? args[targetIndex + 1] : undefined;

        var rollResult = roll(dice);

        var returnMessage = message.author.username + " rolled " + dice + ", result: " + rollResult;

        if (target !== undefined) {
          var isRollSuccessful = rollResult <= target;
          
          returnMessage += ", target: " + target + ", roll " + (isRollSuccessful ? "successful" : "not successful");
        }

        message.channel.send(returnMessage);
      break;
    }
  }
});

bot.login(process.env.BOT_TOKEN);