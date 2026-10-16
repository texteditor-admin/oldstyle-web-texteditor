import { CommandRegistry } from '../core/Commands';
export declare class FormatBar {
    private element;
    private commands;
    constructor(commands: CommandRegistry);
    getElement(): HTMLElement;
    private createBar;
    private createGroup;
}
