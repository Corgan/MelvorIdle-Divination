export async function setup({ characterStorage, gameData, patch, loadTemplates, loadModule, onModsLoaded, onInterfaceAvailable, onCharacterLoaded }) {
    console.log("Loading Divination Templates");
    await loadTemplates("templates.html"); // Add templates
  
    console.log("Loading Divination Module");
    const { Divination } = await loadModule('src/divination.mjs');

    game.divination = game.registerSkill(game.registeredNamespaces.getNamespace('divination'), Divination); // Register skill

    console.log("Registering Divination Data");
    await gameData.addPackage('data/data.json'); // Add skill data (page + sidebar, skillData)

    if(cloudManager.hasAoDEntitlementAndIsEnabled)
        await gameData.addPackage('data/data-aod.json');

    console.log('Registered Divination Data.');

    onModsLoaded(async () => {
        if(cloudManager.hasAoDEntitlementAndIsEnabled) {
            const levelCapIncreases = ['divination:Pre99Dungeons', 'divination:ImpendingDarknessSet100'];

            if(cloudManager.hasTotHEntitlementAndIsEnabled) {
                levelCapIncreases.push(...['divination:Post99Dungeons', 'divination:ThroneOfTheHeraldSet120']);
            }

            const gamemodes = game.gamemodes.filter(gamemode => gamemode.defaultInitialLevelCap !== undefined && gamemode.levelCapIncreases.length > 0 && gamemode.useDefaultSkillUnlockRequirements === true && gamemode.allowSkillUnlock === false);

            await gameData.addPackage({
                $schema: '',
                namespace: 'divination',
                modifications: {
                    gamemodes: gamemodes.map(gamemode => ({
                        id: gamemode.id,
                        levelCapIncreases: {
                            add: levelCapIncreases
                        },
                        startingSkills: {
                            add: ['divination:Divination']
                        },
                        skillUnlockRequirements: [
                            {
                                skillID: 'divination:Divination',
                                requirements: [
                                    {
                                        type: 'SkillLevel',
                                        skillID: 'melvorD:Attack',
                                        level: 1
                                    }
                                ]
                            }
                        ]
                    }))
                }
            });
        }
    
        patch(EventManager, 'loadEvents').after(() => {
            if(game.currentGamemode.startingSkills !== undefined && game.currentGamemode.startingSkills.has(game.divination)) {
                game.divination.setUnlock(true);
            }
        });
    });

    onInterfaceAvailable(async () => {
        game.divination.onInterfaceAvailable();
    });
}