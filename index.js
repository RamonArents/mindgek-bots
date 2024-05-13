const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const GoalFollow = goals.GoalFollow;

/* Uitproberen op versie van mindgek onder 1.20.5 */
const bot = mineflayer.createBot({
  host: "25.59.45.64",
  port: 25565,
  username: "chip",
});

bot.loadPlugin(pathfinder);

function followPlayer() {
  const playerCI = bot.players["DarthMasterRa"];

  if (!playerCI) {
    bot.chat("I can't see CI!");
    return;
  }

  const mcData = require("minecraft-data")(bot.version);
  const movements = new Movements(bot, mcData);
  movements.scafoldingBlocks = [];
  bot.pathfinder.setMovements(movements);

  const goal = new GoalFollow(playerCI.entity, 1);
  bot.pathfinder.setGoal(goal, true);

}

function locateEmeraldBlocks() {
  const mcData = require("minecraft-data")(bot.version);

  const movements = new Movements(bot, mcData);
  movements.scafoldingBlocks = [];
  
  bot.pathfinder.setMovements(movements);

}

//Looks at nearest player. Not in use now.
// function lookAtNearesPlayer() {
//   const playerFilter = (entity) => entity.type === "player";
//   const playerEntity = bot.nearestEntity(playerFilter);

//   if (!playerEntity) return;

//   const pos = playerEntity.position.offset(0, playerEntity.height, 0);
//   bot.lookAt(pos);
// }

//once runs only one time
bot.once("spawn", followPlayer);

//Error handlling
//on runs always
bot.on("error", (err) => {
  console.error("Error: ", err);
});

bot.on("end", () => {
  console.log("Bot disconnected.");
});

//Bot stays looking at you
//bot.on('physicTick', lookAtNearesPlayer);
