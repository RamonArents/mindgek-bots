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

  const movements = new Movements(bot, bot.mcData);
  movements.scafoldingBlocks = [];
  bot.pathfinder.setMovements(movements);

  const goal = new GoalFollow(playerCI.entity, 1);
  bot.pathfinder.setGoal(goal, true);
}

function locateEmeraldBlocks() {

  const movements = new Movements(bot, bot.mcData);
  movements.scafoldingBlocks = [];

  bot.pathfinder.setMovements(movements);

  const emeraldBlock = bot.findBlock({
    matching: mcData.blocksByName.emerald_block.id,
    maxDistance: 32,
  });

  if (!emeraldBlock) {
    bot.chat("I can't see emerald block. Going to follow player.");

  }

  const x = emeraldBlock.position.x;
  const y = emeraldBlock.position.y + 1;
  const z = emeraldBlock.position.z;
  const goal = new GoalBlock(x, y, z);
  bot.pathfinder.setGoal(goal);
  
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

//Looks at nearest player. Not in use now.
// function lookAtNearesPlayer() {
//   const playerFilter = (entity) => entity.type === "player";
//   const playerEntity = bot.nearestEntity(playerFilter);

//   if (!playerEntity) return;

//   const pos = playerEntity.position.offset(0, playerEntity.height, 0);
//   bot.lookAt(pos);
// }

//once runs only one time
bot.once("spawn", () =>{
  bot.mcData = require("minecraft-data")(bot.version);
  //This code follows the player until an (placed) emerald block is found. After that it will stay 5 sec on the emerald block. After that he will follow the player again.
  isFollowing = true;
  followPlayer();

  bot.on("blockUpdate", (oldBlock, newBlock) => {
    if (newBlock.name === "emerald_block") {
      emeraldBlockFound = true;
      if (isFollowing) {
        isFollowing = false;
        locateEmeraldBlocks();
      }
    }
  });

  bot.on("goal_reached", () => {
    handleTimeout();
  });
});

//Bot on chat (this can be used to pass commands to the bot)
bot.on("chat", (username, message) => {
  const args = message.split(" ");

  // //Finds the item id of an item by typing item_id <name_of_item> in the chat
  // if (args[0] === "item_id"){
  //   const itemName = args[1];
  //   const id = bot.mcData.itemsByName[itemName].id;
  //   bot.chat(`The item id for ${args[1]} is ${id}`);
  // }

  // //Finds the position of grass blocks by typing find in the chat
  // if(args[0] === "find"){
  //   const id = bot.mcData.blocksByName["grass_block"].id;
  //   const block = bot.findBlock({
  //     matching: id
  //   });
    
  //   bot.chat(`The block is at ${block.position}`);
  // }

  // //list of all types (this does not work)
  // if (args[0] === "type_list"){
  //   bot.chat(bot.mcData.blocks.map(b => b.name).join(", "));
  // }
  
})

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
