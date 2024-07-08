export async function setup({ characterStorage, gameData, patch, loadTemplates, loadModule, onInterfaceAvailable, onCharacterLoaded }) {
    console.log("Loading Divination Templates");
    await loadTemplates("templates.html"); // Add templates
  
    console.log("Loading Divination Module");
    const { Divination } = await loadModule('src/divination.mjs');

    game.divination = game.registerSkill(game.registeredNamespaces.getNamespace('divination'), Divination); // Register skill

    console.log("Registering Divination Data");
    await gameData.addPackage('data/data.json'); // Add skill data (page + sidebar, skillData)

    console.log('Registered Divination Data.');

    onInterfaceAvailable(async () => {
        game.divination.onInterfaceAvailable();
    });
}