const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const { mineflayer: mineflayerViewer } = require("prismarine-viewer");
const GoalFollow = goals.GoalFollow;
const { Vec3 } = require("vec3");
require('dotenv').config();

/* Works now only on versions beneath minecraft 1.20.5 */
const bot = mineflayer.createBot({
  //hide host and port values in .env file
  host: process.env.HOST,     
  port: process.env.PORT,    
  username: "chip",
  version: "1.20",
});

//Requirements to make the bot work
const mcData = require("minecraft-data")(bot.version);
console.log(bot.version);

bot.loadPlugin(pathfinder);

//Function to follow the player. This function runs always
function followPlayer() {
  //Find player by username
  const playerCI = bot.players["DarthMasterRa"];
  //Message if player not found
  if (!playerCI) {
    bot.chat("I can't see CI!");
    return;
  }
  //Follow the player by setting the GoalFollow
  const goal = new GoalFollow(playerCI.entity, 1);
  bot.pathfinder.setGoal(goal, true);
}

/**
 * @brief Finds logs of trees. At the moment only oak and accia logs. It is possible to extend this function to mine more logs
 * 
 * @version findNearestLog_1.0
 * @author Ramon Arents
 * 
 * @returns LogBlocks if they are nearby. Else null
 */
function findNearestLog() {
  //Find logs
  const logBlocks = bot.findBlocks({
    //Match logs by item name. It is possible to add more logs here
    matching: (block) =>
      block.name === "oak_log" || block.name === "acacia_log",
      maxDistance: 5, //the tree has to be in a 5 block radius
      count: 1,
  });

  //Check if log blocks are nearby
  if (logBlocks.length > 0) {
    return logBlocks[0];
  } else {
    console.log("No logs found nearby");
    return null;
  }
}

/**
 * @brief This function digs the logs of a tree
 * 
 * @version mineLog_1.0
 * @author Ramon Arents
 * 
 * @param {*} logBlock - The log to mine
 */
function mineLog(logBlock) {
  // Dig the tree. Gives error on failure
  bot.dig(bot.blockAt(new Vec3(logBlock.x, logBlock.y, logBlock.z)), (err) => {
    if (err) {
      console.log("Error mining log:", err);
    } else {
      console.log("Successfully mined an oak log");
    }
  });
}

/**
 * @brief This functions finds and mines logs per block. That way it can mine an entire tree
 * 
 * @version findAndMineLogs_1.0
 * @author Ramon Arents
 */
function findAndMineLogs() {
  const logBlock = findNearestLog();
  if (logBlock) {
    mineLog(logBlock);
  }
}

/**
 * @brief This function displays the bot's inventory
 * 
 * @version displayInventory_1.0
 * @author Ramon Arents
 */
function displayInventory() {
  //check inventory items
  const items = bot.inventory.items();
  //check if inventory is empty. Else show the items in the chat
  if (items.length === 0) {
    bot.chat("My Inventory is empty");
  } else {
    bot.chat("Inventory:");
    items.forEach((item) => {
      bot.chat(`- ${item.count}x ${item.displayName}`);
    });
  }
}

/**
 * @brief Checks if bot has an item in his inventory and drops then that item. If the item is not found it will show a message in the chat
 * 
 * @version dropItem_1.0
 * @author Ramon Arents
 * 
 * @param {*} message - Message from chat to let the bot drop the item that the player commanded
 */
function dropItem(message) {
  //The message wil be drop ${itemName}. To get only the item name we remove the drop
  let itemName = message.replace("drop ", "");
  //Check if the bot has the item in his inventory
  if (hasItem(itemName)) {
    tossItem(itemName);
  } else {
    //Display message if the item is not in the bot's inventory
    bot.chat(`Sorry, I don't have ${itemName}'s in my inventory.`);
  }
}

/**
 * @brief This function checks if the bot has a specific item in his inventory
 * 
 * @version hasItem_1.0
 * @author Ramon Arents
 * 
 * @param {*} itemName - The item displayName that needs to be in the inventory of the bot
 * @returns true if item found in inventory of bot. Else false
 */
function hasItem(itemName) {
  const items = bot.inventory.items();

  for (let item of items) {
    if (item.displayName === itemName) {
      return true;
    }
  }
  return false;
}

/**
 * @brief Function to toss a specific item
 * 
 * @version tossItem_1.0
 * @author Ramon Arents
 * 
 * @param {*} itemName - The item displayName of the item to drop
 */
function tossItem(itemName) {
  const item = bot.inventory
    .items()
    .find((item) => item.displayName === itemName);
  //Drop item if it is found, else show a message that the item is not in the bots inventory
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

/**
 * @brief Chat bot function to show funny messages at random
 * 
 * @version chatBot_1.0
 * @author Ramon Arents
 */
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
  //Console message to log that the bot has spawned
  console.log("Bot has spawned in the world");

  //Look from the bot's point of view in a webbrowser
  mineflayerViewer(bot, { port: 3007, firstPerson: true });
  console.log(
    "Bot spawned and viewer initialized. Access it at http://localhost:3007"
  );

  // Always follow player
  followPlayer();
});

//chat commands
bot.on("chat", (username, message) => {
  //Array of all items in minecraft
  const allItems = bot.registry.itemsArray;

  if (message == "mine tree") {
    // Repeatedly find and mine logs with an interval of 5 sec
    setInterval(findAndMineLogs, 5000);
  }
  // Command to display inventory when a specific message is received
  if (message === "show inventory") {
    displayInventory();
  }
  //Let bot drop a specific item
  allItems.forEach((item) => {
    if (message === "drop " + item.displayName) {
      dropItem(message);
    }
  });
  //Chat function
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
