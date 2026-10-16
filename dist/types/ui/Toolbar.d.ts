import { CommandRegistry } from '../core/Commands';
import { SelectionManager } from '../core/Selection';
import { Ruler } from './Ruler';
export interface ToolbarConfig {
    items?: string[];
}
export interface ToolbarCallbacks {
    onSourceToggle?: () => void;
    onFindToggle?: () => void;
    onThumbnailsToggle?: () => void;
    onHeaderClick?: () => void;
    onFooterClick?: () => void;
    onZoomChange?: (zoom: string) => void;
}
export declare class Toolbar {
    private element;
    private commands;
    private selection;
    private ruler;
    private buttons;
    private activeDropdown;
    private callbacks?;
    private presenceContainer;
    private fontFamilyLabelEl;
    private fontSizeLabelEl;
    private zoomLabelEl;
    constructor(commands: CommandRegistry, selection: SelectionManager, items?: string[], callbacks?: ToolbarCallbacks);
    getElement(): HTMLElement;
    getPresenceContainer(): HTMLElement;
    private closeActiveDropdown;
    private toggleDropdown;
    /**
     * Ana Panel Oluşturucu (Menü Çubuğu + 1. Çubuk + 2. Çubuk + 3. Çubuk + Cetvel)
     */
    private createToolbar;
    private createMenubar;
    private createStandardToolbar;
    private createFormattingToolbar;
    private createViewToolbar;
    getRuler(): Ruler;
    private createHorizontalRuler;
    private createToolBtn;
    private createSeparator;
    private createFontFamilyDropdown;
    private createFontSizeDropdown;
    private createZoomDropdown;
    private createColorDropdown;
    private createLineSpacingDropdown;
    private createParagraphSpacingDropdown;
    private createFirstLineIndentDropdown;
    private createTableDropdown;
    private createImageDropdown;
    updateState(): void;
}
