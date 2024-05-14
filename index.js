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
let logsFound = false;
let blockCategory  = "log";

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

function locateTrees(blockCategory) {

  const tree = bot.findBlock({
    matching: block => block.name.includes(blockCategory),
    maxDistance: 32,
  });

  if(tree){
    bot.chat("I have found a tree. Going to mine it.");

    const goal = new GoalBlock(tree.position.x, tree.position.y, tree.position.z);
    bot.pathfinder.setGoal(goal);
    bot.targetDigBlock = tree;
  
  }
}

function mineBlock(){
  if(bot.targetDigBlock){
    bot.dig(bot.targetDigBlock, onDiggingCompleted);
  } else {
    console.log("No block targeted for mining");
  }

}

function onDiggingCompleted(err) {
  if (err) {
    console.log('Error while mining:', err);
    return;
  }

  isFollowing = true;
  followPlayer();
}

function handleTimeout(){
  if (logsFound) {
    logsFound = false;
    setTimeout(() => {
      isFollowing = true;
      followPlayer();
    }, 5000);
  }
}

//once runs only one time
bot.once("spawn", () =>{
  //TODO: Let bot follow player again when it has mined the tree. That is currently not working.
  bot.mcData = require("minecraft-data")(bot.version);
  isFollowing = true;
  followPlayer();

  bot.on("blockUpdate", (oldBlock, newBlock) => {
    if (newBlock.name.includes(blockCategory)) {
      logsFound = true;
      if (isFollowing) {
        isFollowing = false;
        locateTrees(blockCategory);
      }
    }
  });

  bot.on("goal_reached", () => {
    if(logsFound){
      isFollowing = false;
      mineBlock();
    }else{
      handleTimeout();
    }
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
