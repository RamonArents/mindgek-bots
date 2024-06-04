const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const GoalFollow = goals.GoalFollow;
const GoalBlock = goals.GoalBlock;
const { Vec3 } = require('vec3')

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

// Wait for the bot to spawn
bot.on('spawn', () => {
  console.log('Bot has spawned in the world')

  followPlayer();

  // Function to find the nearest oak log
  function findNearestOakLog() {
    const logBlocks = bot.findBlocks({
      matching: (block) => block.name === 'oak_log',
      maxDistance: 64,
      count: 1
    })

    if (logBlocks.length > 0) {
      return logBlocks[0]
    } else {
      console.log('No oak logs found nearby')
      return null
    }
  }

  // Function to mine the oak log
  function mineOakLog(logBlock) {
    bot.dig(bot.blockAt(new Vec3(logBlock.x, logBlock.y, logBlock.z)), (err) => {
      if (err) {
        console.log('Error mining log:', err)
      } else {
        console.log('Successfully mined an oak log')
      }
    })
  }

  // Main function to find and mine oak logs
  function findAndMineOakLogs() {
    const logBlock = findNearestOakLog()
    if (logBlock) {
      mineOakLog(logBlock)
    } 
  }

  // Start mining oak logs
  findAndMineOakLogs()

  // Repeatedly find and mine oak logs
  setInterval(findAndMineOakLogs, 5000) // Adjust interval as needed
})

// Log errors
bot.on('error', (err) => {
  console.log('Error:', err)
})

// Log when the bot disconnects
bot.on('end', () => {
  console.log('Bot has disconnected')
})
