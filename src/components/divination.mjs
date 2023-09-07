const { loadModule } = mod.getContext(import.meta);

const { UIComponent } = await loadModule('src/components/ui-component.mjs');

export class DivinationPageUIComponent extends UIComponent {
    constructor() {
        super('divination-page-component');

        //this.page = getElementFromFragment(this.$fragment, 'page', 'div');
    }
}