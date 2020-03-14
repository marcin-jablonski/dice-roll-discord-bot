var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');

logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
  colorize: true
});
logger.level = 'debug';

var bot = new Discord.Client({
  token: process.env.BOT_TOKEN,
  autorun: true
});

bot.on('ready', function (evt) {
  logger.info('Connected');
  logger.info('Logged in as: ');
  logger.info(bot.username + ' - (' + bot.id + ')');
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

bot.on('message', function (user, userID, channelID, message, evt) {
  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with `!`
  if (message.substring(0, 1) == '!') {
    logger.debug("Received message: " + message);
    var args = message.substring(1).split(' ');
    var cmd = args[0];
    
    switch(cmd) {
      case 'roll':
        var dice = args[1];

        if (dice !== undefined && !dice.match("^d[0-9]+$")) {
          dice = undefined;
        }

        var targetIndex = 2;

        if (dice === undefined) {
          dice = "d100";
          targetIndex = 1;
        }

        var target = args[targetIndex] === "target" ? args[targetIndex + 1] : undefined;

        var rollResult = roll(dice);

        var returnMessage = user + " rolled " + dice + ", result: " + rollResult;

        if (target !== undefined) {
          var isRollSuccessful = rollResult <= target;
          
          returnMessage += ", target: " + target + ", roll " + (isRollSuccessful ? "successful" : "not successful");
        }

        bot.sendMessage({
          to: channelID,
          message: returnMessage
        });
      break;
    }
  }
});