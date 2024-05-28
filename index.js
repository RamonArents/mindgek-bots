const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const GoalFollow = goals.GoalFollow;
const GoalBlock = goals.GoalBlock;

/* Uitproberen op versie van mindgek onder 1.20.5 */
const bot = mineflayer.createBot({
  host: "25.59.45.64",
  port: 25565,
  username: "chip",
});

bot.loadPlugin(pathfinder);

let isFollowing = false;
let emeraldBlockFound = false;

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

  const emeraldBlock = bot.findBlock({
    matching: mcData.blocksByName.oak_log.id,
    maxDistance: 32,
    count: 1
  });

  if (!emeraldBlock) {
    bot.chat("I can't see emerald block. Going to follow player.");
  } else {
    bot.chat("Found oak_log. Digging it now.");
  }

  const x = emeraldBlock.position.x;
  const y = emeraldBlock.position.y + 1;
  const z = emeraldBlock.position.z;

  const goal = new GoalBlock(x, y, z);
  bot.pathfinder.setGoal(goal);

  bot.targetDigBlock = emeraldBlock;
  bot.dig(bot.targetDigBlock);
  
}

function handleTimeout(){
  if (emeraldBlockFound) {
    emeraldBlockFound = false;
    setTimeout(() => {
      isFollowing = true;
      followPlayer();
    }, 5000);
  }
}

//once runs only one time
bot.once("spawn", () =>{
  //TODO: Change code so it can dig wood
  //This code follows the player until an (placed) emerald block is found. After that it will stay 5 sec on the emerald block. After that he will follow the player again.
  isFollowing = true;
  followPlayer();

  bot.on('blockUpdate', (oldBlock, newBlock) => {
    if (newBlock.name === 'oak_log') {
      emeraldBlockFound = true;
      if (isFollowing) {
        isFollowing = false;
        locateEmeraldBlocks();
      }
    }
  });

  bot.on('goal_reached', () => {
    handleTimeout();
  });
});

//Error handlling
//on runs always
bot.on("error", (err) => {
  console.error("Error: ", err);
});

bot.on("end", () => {
  console.log("Bot disconnected.");
});
