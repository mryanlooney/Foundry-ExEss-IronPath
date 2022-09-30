// Import Modules
import { EXALTEDESSENCE } from "./config.js";

import { ExaltedessenceActor } from "./actor/actor.js";
import { ExaltedessenceActorSheet } from "./actor/actor-sheet.js";
import { ExaltedessenceItem } from "./item/item.js";
import { ExaltedessenceItemSheet } from "./item/item-sheet.js";

import TraitSelector from "./apps/trait-selector.js";
import { registerSettings } from "./settings.js";
import { RollForm } from "./apps/dice-roller.js";
import ItemSearch from "./apps/item-search.js";

Hooks.once('init', async function () {

  registerSettings();

  game.exaltedessence = {
    applications: {
      TraitSelector,
      ItemSearch,
    },
    entities: {
      ExaltedessenceActor,
      ExaltedessenceItem,
    },
    config: EXALTEDESSENCE,
    rollItemMacro: rollItemMacro
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  Combatant.prototype._getInitiativeFormula = function () {
    const actor = this.actor;
    var initDice = 0;
    if (this.actor.type != 'npc') {
      initDice = actor.data.data.attributes.finesse.value + Math.max(actor.data.data.abilities.ranged.value, actor.data.data.abilities.close.value) + 2;
    }
    else {
      initDice = actor.data.data.pools.primary.value;
    }
    let roll = new Roll(`${initDice}d10cs>=7`).evaluate({ async: false });
    let diceRoll = roll.total;
    let bonus = 0;
    for (let dice of roll.dice[0].results) {
      if (dice.result >= 10) {
        bonus++;
      }
    }
    return `${diceRoll + bonus}`;
  }

  // Define custom Entity classes
  CONFIG.EXALTEDESSENCE = EXALTEDESSENCE;
  CONFIG.statusEffects = EXALTEDESSENCE.statusEffects;
  CONFIG.Actor.documentClass = ExaltedessenceActor;
  CONFIG.Item.documentClass = ExaltedessenceItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("exaltedessence", ExaltedessenceActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("exaltedessence", ExaltedessenceItemSheet, { makeDefault: true });

  // Pre-load templates
  loadTemplates([
    "systems/exaltedessence-ironpath/templates/dialogues/ability-base.html",
    "systems/exaltedessence-ironpath/templates/actor/active-effects.html",
    "systems/exaltedessence-ironpath/templates/actor/equipment-list.html",
    "systems/exaltedessence-ironpath/templates/actor/charm-list.html",
    "systems/exaltedessence-ironpath/templates/actor/intimacies-list.html",
    "systems/exaltedessence-ironpath/templates/dialogues/accuracy-roll.html",
    "systems/exaltedessence-ironpath/templates/dialogues/damage-roll.html",
  ]);

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function () {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
  });

  Handlebars.registerHelper('numLoop', function (num, options) {
    let ret = ''

    for (let i = 0, j = num; i < j; i++) {
      ret = ret + options.fn(i)
    }

    return ret
  })
});

Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

$(document).ready(() => {
  const diceIconSelector = '#chat-controls .chat-control-icon .fa-dice-d20';

  $(document).on('click', diceIconSelector, ev => {
    ev.preventDefault();
    new RollForm(null, {}, {}, {rollType: 'base'}).render(true);;
  });
});

Hooks.on('updateCombat', (async (combat, update) => {
  // Handle non-gm users.

  if (combat.current === undefined) {
    combat = game.combat;
  }
/*
  if (update && update.round) {
    for(var combatant of combat.data.combatants) {
      const actorData = duplicate(combatant.actor)
      if(actorData.system.motes.value < (actorData.system.motes.total - actorData.system.motes.commited)) {
        actorData.system.motes.value++;
      }
	  actorData.system.guard.value -= actorData.system.guard.committed;
	  actorData.system.guard.committed = 0;
	  
		//reset elevation (committed guard)
	  //const actorToken = duplicate(combatant.actor.getActiveTokens()[0]);
	  //actorData.data.guard.value -= actorToken.data.elevation;	  
	  //actorToken.data.elevation = 0;
	  //combatant.actor.getActiveTokens()[0].update(actorToken);
	  
      combatant.actor.update(actorData);
    }
	

  }
  */
}));

Hooks.on('updateCombatant', (async (LancerCombatant) => {
	if (LancerCombatant){
      const actorData = duplicate(LancerCombatant.actor)
	  let token = LancerCombatant.token;
	  //let actorData = LancerCombatant.actor;
		  if(actorData.system.motes.value < (actorData.system.motes.total - actorData.system.motes.commited)) {
			actorData.system.motes.value++;	  
		  }
	  //actorData.system.guard.value -= actorData.system.committed_guard.value;
	  actorData.system.guard.value -= token.elevation;

	  //actorData.system.committed_guard.value = 0;
	  
	  

	  token.elevation = 0;
	  //const tokens = [token];
	  //const updates = tokens.map((token) => ({
		//  _id: token.id,
		//  elevation: 0,	  
	  //}));
	  LancerCombatant.actor.update(actorData);
	  await canvas.scene.updateEmbeddedDocuments("Token", [token]);
	  // Force token HUD to re-render, to make its elevation input show the new height
	  if (canvas.hud.token.rendered) {
		canvas.hud.token.render();
  }
	  
	}
}));

Hooks.on('createCombatant', (async (LancerCombatant) => {
	if (LancerCombatant){
		let actorData = LancerCombatant.actor;
		if (actorData){
			actorData.system.power.value = 0;
			actorData.system.guard.value = actorData.system.toughness.value;
		}
	}
}));

Hooks.on('updateToken', (async (TokenDocument) => {
	if (TokenDocument){
		const actorData = TokenDocument.getActor();//actor;
		if (actorData){
			if ((TokenDocument.elevation <= actorData.system.guard.value) && (TokenDocument.elevation >= 0)){
				actorData.system.committed_guard.value = TokenDocument.elevation;
			}
			else
			{
				//return committed guard + elevation ui to 0
				TokenDocument.elevation = 0;
			}
		}
	}
}));

Hooks.once("ready", async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createExaltedessenceMacro(data, slot));

  $("#chat-log").on("click", " .item-row", ev => {
    const li = $(ev.currentTarget).next();
    li.toggle("fast");
  });

});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createExaltedessenceMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.exaltedessence.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "exaltedessence.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}