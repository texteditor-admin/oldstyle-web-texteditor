import { CommandContext } from '../core/Commands';
export declare class SpecialCharsPlugin {
    private ctx;
    private modal;
    constructor(ctx: CommandContext);
    openDialog(): void;
    private createModal;
    private insertChar;
}
