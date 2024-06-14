const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const { mineflayer: mineflayerViewer } = require("prismarine-viewer");
const GoalFollow = goals.GoalFollow;
const { Vec3 } = require("vec3");

/* Uitproberen op versie van mindgek onder 1.20.5 */
const bot = mineflayer.createBot({
  host: "25.59.45.64",
  port: 25565,
  username: "chip",
  version: "1.20",
});

const mcData = require("minecraft-data")(bot.version);
console.log(bot.version);

bot.loadPlugin(pathfinder);

function followPlayer() {
  const playerCI = bot.players["DarthMasterRa"];

  if (!playerCI) {
    bot.chat("I can't see CI!");
    return;
  }

  const movements = new Movements(bot, mcData);
  movements.scafoldingBlocks = [];
  bot.pathfinder.setMovements(movements);

  const goal = new GoalFollow(playerCI.entity, 1);
  bot.pathfinder.setGoal(goal, true);
}

// Function to find the nearest oak log
function findNearestOakLog() {
  const logBlocks = bot.findBlocks({
    //TODO: Add more trees to this
    matching: (block) =>
      block.name === "oak_log" || block.name === "acacia_log",
    maxDistance: 5,
    count: 1,
  });

  if (logBlocks.length > 0) {
    return logBlocks[0];
  } else {
    console.log("No oak logs found nearby");
    return null;
  }
}

// Function to mine the oak log
function mineOakLog(logBlock) {
  bot.dig(bot.blockAt(new Vec3(logBlock.x, logBlock.y, logBlock.z)), (err) => {
    if (err) {
      console.log("Error mining log:", err);
    } else {
      console.log("Successfully mined an oak log");
    }
  });
}

// Main function to find and mine oak logs
function findAndMineOakLogs() {
  const logBlock = findNearestOakLog();
  if (logBlock) {
    mineOakLog(logBlock);
  }
}

// Function to display the bot's inventory
function displayInventory() {
  const items = bot.inventory.items();
  if (items.length === 0) {
    bot.chat("My Inventory is empty");
  } else {
    bot.chat("Inventory:");
    items.forEach((item) => {
      bot.chat(`- ${item.count}x ${item.displayName}`);
    });
  }
}

function dropAllItems() {
  const items = bot.inventory.items();
  if (items.length === 0) {
    console.log("No items to drop.");
    return;
  }

  const dropNext = () => {
    if (items.length === 0) {
      console.log("All items dropped.");
      return;
    }

    const item = items.shift();
    console.log(`Dropping ${item.count}x ${item.displayName}`);

    bot.tossStack(item, (err) => {
      if (err) {
        console.log(`Error dropping ${item.displayName}:`, err);
      } else {
        console.log(`Dropped ${item.displayName}`);
      }
      dropNext();
    });
  };

  dropNext();
}

// Wait for the bot to spawn
bot.on("spawn", () => {
  const mcData = require("minecraft-data")(bot.version);
  console.log("Bot has spawned in the world");

  //View inventory
  mineflayerViewer(bot, { port: 3007, firstPerson: true });
  console.log(
    "Bot spawned and viewer initialized. Access it at http://localhost:3007"
  );

  // Always follow player
  followPlayer();
});

//chat commands
bot.on("chat", (username, message) => {
  if (message == "mine tree") {
    // Repeatedly find and mine oak logs
    setInterval(findAndMineOakLogs, 5000);
  }
  // Command to display inventory when a specific message is received
  if (message === "show inventory") {
    displayInventory();
  }
  //Let bot drop all his items
  if (message === "drop items") {
    dropAllItems();
  }
});

// Log errors
bot.on("error", (err) => {
  console.log("Error:", err);
});

// Log when the bot disconnects
bot.on("end", () => {
  console.log("Bot has disconnected");
});
