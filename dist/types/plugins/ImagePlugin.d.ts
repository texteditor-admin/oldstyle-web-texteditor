import { CommandContext } from '../core/Commands';
export declare class ImagePlugin {
    private ctx;
    constructor(ctx: CommandContext);
    insertImageFromFile(): void;
    insertImageFromUrl(): void;
    insertImageElement(src: string, alt?: string): void;
    private setupDragAndDrop;
    private setupClickHandlers;
}
