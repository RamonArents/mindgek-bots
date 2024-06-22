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

function dropItem(message) {

  let itemName = message.replace("drop ", "");

  if (hasItem(itemName)) {
    tossItem(itemName);
  } else {
    bot.chat("Sorry, I don't have that item in my inventory.");
  }
}

function hasItem(itemName) {
  const items = bot.inventory.items();

  for (let item of items) {
    if (item.displayName === itemName) {
      return true;
    }
  }
  return false;
}

function tossItem(itemName) {
  const item = bot.inventory.items().find((item) => item.displayName === itemName);
  if (item) {
    bot.toss(item.type, null, item.count, (err) => {
      if (err) {
        console.log(`Error dropping ${itemName}:`, err);
      } else {
        console.log(`Dropped ${itemName}`);
      }
    });
  } else {
    console.log(`Item ${itemName} not found in inventory`);
  }
}

//Warning: Don't take this function serious
function chatBot() {
  const chatArray = [
    "Ik ben 13",
    "Hebben jullie het al over het slangetje en het gaatje gehad?",
    "Let's go a rally......Yahoo",
    "Ok, here we go",
    "Haaaaaaaaaaaaallllllllllllllllllllllloooooooooooooooo",
    "Wat denk jij dan?",
    "No, I don't think I will",
  ];

  const pickAChat = Math.floor(Math.random() * chatArray.length);

  bot.chat(chatArray[pickAChat]);
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
  const allItems = bot.registry.itemsArray;

  if (message == "mine tree") {
    // Repeatedly find and mine oak logs
    setInterval(findAndMineOakLogs, 5000);
  }
  // Command to display inventory when a specific message is received
  if (message === "show inventory") {
    displayInventory();
  }
  //Let bot drop all his items
  allItems.forEach((item) => {
    if (message === "drop " + item.displayName) {
      dropItem(message);
    }
  });
  //Chat function to joke around
  if (message === "hey chip") {
    chatBot();
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
