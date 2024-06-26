const { loadModule } = mod.getContext(import.meta);

const { DivinationPageUIComponent } = await loadModule('src/components/divination.mjs');

class DivinationWispMenu {
    constructor(wisp, divination) {
        this.wisp = wisp;
        this.divination = divination;
        this.container = createElement('div', {
            classList: ['col-6', 'col-md-4', 'col-lg-4', 'col-xl-3', 'd-none']
        });
        this.button = createElement('a', {
            classList: ['block', 'block-rounded', 'block-link-pop', 'border-top', 'border-divination', 'border-4x', 'pointer-enabled', ],
            parent: this.container,
        });
        this.button.onclick = ()=>this.divination.selectWisp(wisp);
        const topBlock = createElement('div', {
            classList: ['block-content', 'block-content-full', 'pb-0'],
            parent: this.button,
        });
        const nameDiv = createElement('div', {
            classList: ['font-size-sm', 'font-w600', 'text-center', 'text-muted'],
            parent: topBlock,
        });
        this.harvestText = createElement('small');
        this.wispName = createElement('span');
        const rates = createElement('small');
        this.xpText = createElement('span');
        this.intervalText = createElement('span');
        rates.append(this.xpText, document.createTextNode(' / '), createElement('i', {
            classList: ['far', 'fa-clock', 'mr-1']
        }), this.intervalText);
        nameDiv.append(this.harvestText, createElement('br'), this.wispName, createElement('br'), rates);
        topBlock.appendChild(createElement('div', {
            classList: ['text-center']
        })).appendChild(createElement('img', {
            classList: ['mining-ore-img'],
            attributes: [['src', wisp.media]]
        }));
        this.progressBar = topBlock.appendChild(createElement('div', {
            classList: ['progress', 'active']
        })).appendChild(createElement('progress-bar'));
        const masteryContainer = createElement('div', {
            classList: ['block-content'],
            parent: this.button
        });
        //this.mastery = new MasteryDisplay();
        //this.mastery.classList.add('mastery-8');
        //masteryContainer.appendChild(this.mastery);
        //this.mastery.setMastery(this.divination, wisp);
        document.getElementById('divination-wisps-container').append(this.container);
    }
    show() {
        showElement(this.container);
    }
    hide() {
        hideElement(this.container);
    }
    invisible() {
        this.container.classList.add('invisible');
    }
    visible() {
        this.container.classList.remove('invisible');
    }
    localize() {
        this.harvestText.textContent = 'Harvest';
        this.wispName.textContent = this.wisp.name;
        this.updateRates();
    }
    updateRates() {
        this.xpText.textContent = templateLangString('MENU_TEXT_XP_AMOUNT', {
            xp: `${this.wisp.baseExperience}`
        });
        const cutInterval = this.divination.getWispInterval(this.wisp) / 1000;
        this.intervalText.textContent = templateLangString('MENU_TEXT_SECONDS', {
            seconds: `${numberWithCommas(cutInterval)}`,
        });
    }
    setActive() {
        this.progressBar.style.width = '100%';
    }
    setInactive() {
        this.progressBar.style.width = '0%';
    }
}

class DivinationWispsMenu {
    constructor(divination, parent) {
        this.divination = divination;
        this.parent = parent;
        this.wispMenus = new Map();
        this.divination.wisps.forEach((wisp)=>{
            this.wispMenus.set(wisp, new DivinationWispMenu(wisp, this.divination, this.parent));
        });
    }
    localize() {
        this.wispMenus.forEach((menu)=>menu.localize());
    }
    updateWispRates() {
        this.wispMenus.forEach((menu)=>menu.updateRates());
    }
    updateWispUnlocks() {
        const lowestLevelLocked = this.divination.wisps.forEach((wisp)=>{
            const wispMenu = this.wispMenus.get(wisp);
            if (wispMenu === undefined)
                throw new Error(`Error updating wisp unlocks, menu does not exist for wisp: ${wisp.id}`);
            if (wisp.level <= this.divination.level)
                wispMenu.show();
            else {
                wispMenu.hide();
            }
        });
    }
}


class DivinationWisp extends NamespacedObject {
    constructor(namespace, data, manager, game) {
        super(namespace, data.id);
        this.manager = manager;
        this.game = game;

        this.name = data.name;
        this._media = data.media;
        this.level = data.level;
        this.baseExperience = data.baseExperience;
        if(data.enriched_media !== undefined)
            this._enriched_media = data.enriched_media;
        this.energy = game.items.getObjectByID(data.energyID);
        this.memory = game.items.getObjectByID(data.memoryID);
        if(data.enrichedID !== undefined)
            this.enriched = game.items.getObjectByID(data.enrichedID);
        this.fragment = game.items.getObjectByID(data.fragmentID);

        this.isEnriched = false;
    }

    get media() {
        if(this.isEnriched && this._enriched_media !== undefined)
            return this.getMediaURL(this._enriched_media);
        return this.getMediaURL(this._media);
    }
}

class DivinationRenderQueue extends MasterySkillRenderQueue {
    constructor() {
        super();
        this.wispUnlocks = false;
    }
}

export class Divination extends SkillWithMastery {
    constructor(namespace, game) {
        super(namespace, 'Divination', game);
        this.version = 1;
        this.saveVersion = -1;
        this._media = 'assets/divination.png';
        this.isActive = false;
        this.baseInterval = 1800;

        this.wisps = new NamespaceRegistry(this.game.registeredNamespaces);

        this.renderQueue = new DivinationRenderQueue();

        this.component = new DivinationPageUIComponent();
        
    }

    onInterfaceAvailable() {
        this.component.mount(document.getElementById('main-container'));
        this.wispsMenu = new DivinationWispsMenu(this, document.getElementById('divination-wisps-container'));
    }

    onLoad() {
        super.onLoad();
        this.wispsMenu.localize();
        this.renderQueue.wispUnlocks = true;
        this.actions.forEach((action)=>{
            this.renderQueue.actionMastery.add(action);
        });
        this.render();
    }
    onLevelUp(oldLevel, newLevel) {
        super.onLevelUp(oldLevel, newLevel);
        this.renderQueue.wispUnlocks = true;
    }

    get name() { return "Divination"; }
    get isCombat() { return false; }
    get hasMinibar() { return true; }

    get activeSkills() {
        if (!this.isActive)
            return [];
        else
            return [this];
    }

    get canStop() {
        return this.isActive && !this.game.isGolbinRaid;
    }

    get canStart() {
        return !this.game.idleChecker(this);
    }

    getWispInterval(wisp) {
        return this.modifyInterval(this.baseInterval, wisp);
    }

    getWispMultiplier(wisp) {
        return 1;
    }

    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action);
    }

    start() {
        if (!this.canStart)
            return false;
        
        this.isActive = true;
        this.game.renderQueue.activeSkills = true;
        this.game.activeAction = this;

        this.game.scheduleSave();
        return true;
    }

    stop() {
        if(!this.canStop)
            return false;
            
        this.isActive = false;
        this.game.renderQueue.activeSkills = true;
        this.game.clearActiveAction(false);

        this.game.scheduleSave();
        return true;
    }

    getErrorLog() {
        return `Is Active: ${this.isActive}\n`;
    }
    
    getTotalUnlockedMasteryActions() {
        return this.actions.reduce(levelUnlockSum(this), 0);
    }

    activeTick() {
    }

    registerData(namespace, data) {
        super.registerData(namespace, data); // pets, rareDrops, minibar, customMilestones


        console.log(`Registering ${data.wisps.length} Wisps`);
        data.wisps.forEach(data => {
            let wisp = new DivinationWisp(namespace, data, this, this.game);
            this.wisps.registerObject(wisp);
            this.actions.registerObject(wisp);
        });
    }

    postDataRegistration() {
        this.sortedMasteryActions = this.actions.allObjects.sort((a,b)=>a.level - b.level);
        this.milestones.push(...this.actions.allObjects);
        this.sortMilestones();
    }

    render() {
        super.render();
        this.renderWispUnlock();
    }
    renderWispUnlock() {
        if (!this.renderQueue.wispUnlocks)
            return;
        this.wispsMenu.updateWispUnlocks();
        this.renderQueue.wispUnlocks = false;
    }

    encode(writer) {
        let start = writer.byteOffset;
        super.encode(writer); // Encode default skill data
        let end = writer.byteOffset;
        console.log(`Wrote ${end-start} bytes for Divination save`);
        return writer;
    }

    decode(reader, version) {
        console.log("Divination save decoding");
        let start = reader.byteOffset;
        reader.byteOffset -= Uint32Array.BYTES_PER_ELEMENT; // Let's back up a minute and get the size of our skill data
        let skillDataSize = reader.getUint32();

        try {
            super.decode(reader, version);
        } catch(e) { // Something's fucky, dump all progress and skip past the trash save data
            console.log(e);
            reader.byteOffset = start;
            reader.getFixedLengthBuffer(skillDataSize);
        }

        let end = reader.byteOffset;
        console.log(`Read ${end-start} bytes for Divination save`);
    }
}

