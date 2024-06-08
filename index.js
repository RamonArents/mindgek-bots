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
    matching: (block) => block.name === "oak_log" || block.name === "acacia_log",
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

function findShulkerBox() {
  const movements = new Movements(bot, mcData)
  bot.pathfinder.setMovements(movements)

  // Find a shulker box within a 32-block radius
  const shulkerBox = bot.findBlock({
    matching: block => {
      const blockName = mcData.blocks[block.type].name
      return blockName.endsWith("shulker_box")
    }, 
    maxDistance: 5
  })

  if (shulkerBox) {
    bot.chat('Shulker box found.')
    // Move to the shulker box
    bot.pathfinder.setGoal(new goals.GoalNear(shulkerBox.position.x, shulkerBox.position.y, shulkerBox.position.z, 1))
    bot.once('goal_reached', () => {
      // Open the shulker box and transfer items
      openShulkerBox(shulkerBox)
    })
  } else {
    bot.chat('No shulker box found nearby.')
  }
}

function openShulkerBox(shulkerBox) {
  bot.openContainer(shulkerBox).then(container => {
    bot.chat('Shulker box opened.')
    // Transfer items from the bot's inventory to the shulker box
    transferItems(container)
  }).catch(err => {
    console.log('Error opening shulker box:', err)
  })
}

function findFirstEmptySlot(container) {
  for (let i = 0; i < container.slots.length; i++) {
    if (!container.slots[i]) {
      return i
    }
  }
  return -1
}

function transferItems(container) {
  const itemsToTransfer = bot.inventory.items()
  .filter(item => {
    const itemName = mcData.items[item.type].name
    return !itemName.endsWith('shulker_box')
  })

  if (itemsToTransfer.length === 0) {
    bot.chat('No items to transfer.')
    container.close()
    return
  }

  // Transfer items to the shulker box
  let transferPromises = itemsToTransfer.map(item => {
    const emptySlot = findFirstEmptySlot(container)

    if (emptySlot === -1) {
      bot.chat('No empty slots in shulker box.')
      return Promise.resolve()
    }

    console.log(item)

    return bot.transfer({
      window: container,
      itemType: item.type,
      metadata: item.metadata,
      sourceStart: bot.inventory.findInventoryItem(item.type).slot,
      destStart: emptySlot,
      count: item.count
    })
  })

  Promise.all(transferPromises)
    .then(() => {
      bot.chat("All items transfered to shulker box.");
      container.close();
    })
    .catch(err => {
      console.log("Error transfering items", err);
      container.close();
    })
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

// Command to display inventory when a specific message is received
bot.on("chat", (username, message) => {
  if(message == "mine tree"){
    // Repeatedly find and mine oak logs
    setInterval(findAndMineOakLogs, 5000)
  }
  if (message === "show inventory") {
    displayInventory();
  }
  if (message === "shulkeren") {
    findShulkerBox();
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
