const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const { mineflayer: mineflayerViewer } = require('prismarine-viewer')
const GoalFollow = goals.GoalFollow;
const { Vec3 } = require('vec3')

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

// Function to display the bot's inventory
function displayInventory() {
  const items = bot.inventory.items()
  if (items.length === 0) {
    bot.chat('My Inventory is empty')
  } else {
    bot.chat('Inventory:')
    items.forEach(item => {
      bot.chat(`- ${item.count}x ${item.displayName}`)
    })
  }
}

// Wait for the bot to spawn
bot.on('spawn', () => {
  console.log('Bot has spawned in the world')

  followPlayer();

  //View inventory
  mineflayerViewer(bot, { port: 3007, firstPerson: true})
  console.log('Bot spawned and viewer initialized. Access it at http://localhost:3007')

  // Function to find the nearest oak log
  function findNearestOakLog() {
    const logBlocks = bot.findBlocks({
      matching: (block) => block.name === 'oak_log',
      maxDistance: 5,
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

  // Repeatedly find and mine oak logs
  setInterval(findAndMineOakLogs, 5000) // Adjust interval as needed
})

// Command to display inventory when a specific message is received
bot.on('chat', (username, message) => {
  if (message === 'show inventory') {
    displayInventory()
  }
})

// Log errors
bot.on('error', (err) => {
  console.log('Error:', err)
})

// Log when the bot disconnects
bot.on('end', () => {
  console.log('Bot has disconnected')
})
