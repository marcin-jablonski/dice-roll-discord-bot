const Discord = require("discord.js");
const logger = require("winston");
const config = require("./config.json");

require("dotenv").config();

Object.filter = function (obj, predicate) {
  let result = {},
    key;

  for (key in obj) {
    if (obj.hasOwnProperty(key) && predicate(obj[key])) {
      result[key] = obj[key];
    }
  }

  return result;
};

const token = process.env.BOT_TOKEN;

var readycheckStatus = {};

if (token === "" || token === null || token === undefined) {
  throw new Error("Discord bot token not provided.");
}

logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console(), {
  colorize: true
});
logger.level = "debug";

const bot = new Discord.Client();

bot.once("ready", () => {
  logger.info("Connected");
  logger.info("Logged in as: " + bot.user);
});

roll = function (dice) {
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
};

bot.on("message", (message) => {
  if (!message.content.startsWith(config.prefix) || message.author.bot) return;

  logger.debug("Received message: " + message.content);
  const args = message.content.slice(config.prefix.length).split(/ +/);
  const cmd = args.shift().toLowerCase();

  switch (cmd) {
    case "help":
      const infoMessage =
        "Hi! I am dice roll bot. You can use me in following ways:\n" +
        '- you can just type "!roll" to roll d100\n' +
        '- you can also extend this with dice you want to roll, e.g. "!roll d20", "!roll 2d10", etc.\n' +
        '- if you want to know if you roll was succesful, you can also add target value, e.g. "!roll target 30", "!roll d6 target 4"\n' +
        "\n" +
        'Also, if you need a short reminder for combat rules, type "!combat".\n' +
        "You can write directly to me or on any channel. Have fun!";

      message.channel.send(infoMessage);
      break;
    case "roll":
      var dice = args[0];

      if (dice !== undefined && !dice.match("^[0-9]*d[0-9]+$")) {
        dice = undefined;
      }

      var targetIndex = 1;

      if (dice === undefined) {
        dice = "d100";
        targetIndex = 0;
      }

      const target =
        args[targetIndex] === "target"
          ? parseInt(args[targetIndex + 1])
          : undefined;

      const rollResult = roll(dice);

      var returnMessage =
        message.author.username + " rolled " + dice + ", result: " + rollResult;

      if (target !== undefined) {
        const isRollSuccessful = rollResult <= target;

        returnMessage +=
          ", target: " +
          target +
          ", roll " +
          (isRollSuccessful ? "successful" : "not successful");
      }

      message.channel.send(returnMessage);
      break;
    case "readycheck":
      const playerRole = message.guild.roles.cache.find(
        (role) => role.name == "player"
      );

      const players = message.channel.members.filter((member) =>
        member.roles.cache.has(playerRole.id)
      );

      if (players.array().length === 0) {
        message.channel.send("There are no players in this channel.");
        break;
      }

      players.forEach((player) => {
        readycheckStatus[player.id] = false;
      });

      message.channel.send(
        "Readycheck in progress for: " +
          players.map((player) => player.user).join(", ") +
          ".\n" +
          "Please type !ready when ready!"
      );

      break;
    case "ready":
      if (Object.keys(readycheckStatus).length === 0) {
        message.channel.send("No readycheck in progress.");
        break;
      }

      if (!Object.keys(readycheckStatus).includes(message.author.id)) {
        message.channel.send(
          "You're not part of readycheck, " +
            message.author.toString() +
            " :) (Sorry?)"
        );
        break;
      }

      readycheckStatus[message.author.id] = true;

      const progress = Object.filter(readycheckStatus, (keyValue) => keyValue);

      if (
        Object.keys(progress).length == Object.keys(readycheckStatus).length
      ) {
        readycheckStatus = {};
        message.channel.send("Everyone ready!");
      } else {
        message.channel.send(
          "Readycheck progress: " +
            Object.keys(progress).length +
            "/" +
            Object.keys(readycheckStatus).length
        );
      }

      break;
    case "combat":
      const combatInfo =
        "How to: combat\n" +
        "\n" +
        "When combat begins everyone rolls d10 and adds roll results to their Initiative value - this is your initiative for this fight. " +
        "You will perform actions according to initiative order, where player (or NPC) with highest value begins.\n" +
        "\n" +
        'In your turn you are allowed to do 2 "mechanical" things: 1 Action and 1 Move. Move is anything that can be described as purely moving - walking, running etc. ' +
        "Action is anything that you need to roll for. " +
        "The best course of action is to describe whatever you want your character to do and wait for GM to interrupt you and ask for roll - that's when your turn will end.\n" +
        "\n" +
        'If your Action actually ends with you trying to hit something - good for you! But the road from "trying" to actaully hitting something is a bit longer... Here\'s why:\n' +
        "\n" +
        "1. First, you must actually hit the thing. To check if you managed to do so, you must roll d100 and check results against appropriate skill. " +
        'That skill depends on the weapon you fight with, and it will be called "Melee/Ranged (weapon type)". ' +
        "(If you don't have such skill: if it is melee weapon you can roll for \"Melee\" skill - everyone has it. Weapon is ranged? Tough luck, you can't use it)\n" +
        "\n" +
        "If that roll is a success - good job, you managed to hit something!*\n" +
        "\n" +
        "2. Assuming you hit that thing, you have to know where you hit it. " +
        "Hit location is determined by reversing you hit roll (so, if you rolled 42 for hit, hit location is 24 - you can check what body part it is on your character sheet).\n" +
        "\n" +
        "3. Now when you know where did you hit, let's calculate how HARD did you hit. Firts of all, take Success Levels from your hit roll. " +
        "Then check your weapon damage and add that. Finally, if the weapon is melee, add your Strength Bonus. This is how much damage you caused.\n" +
        "\n" +
        "4. Tell all those things to GM :)";

      message.channel.send(combatInfo);
      break;
  }
});

bot.login(token);
