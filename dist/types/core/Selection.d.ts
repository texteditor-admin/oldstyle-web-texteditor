export declare class SelectionManager {
    private savedRange;
    private rootElement;
    constructor(rootElement: HTMLElement);
    save(): void;
    restore(): boolean;
    getRange(): Range | null;
    getSelectedBlocks(): HTMLElement[];
    getCurrentBlock(): HTMLElement | null;
    getCurrentCell(): HTMLTableCellElement | null;
    isCollapsed(): boolean;
}
