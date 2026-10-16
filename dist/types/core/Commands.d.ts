import { SelectionManager } from './Selection';
import { HistoryManager } from './History';
import { ImagePlugin } from '../plugins/ImagePlugin';
import { SpecialCharsPlugin } from '../plugins/SpecialCharsPlugin';
import { TablePlugin } from '../plugins/TablePlugin';
import { ImportPlugin } from '../plugins/ImportPlugin';
export interface CommandContext {
    editable: HTMLElement;
    selection: SelectionManager;
    history: HistoryManager;
    container: HTMLElement;
    getData?: () => string;
    onHtmlLoaded?: (html: string) => void;
    onStateChange?: () => void;
}
export interface StoredFormat {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    fontSize?: string;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
}
export declare const FONT_SIZE_STEPS: string[];
export declare class CommandRegistry {
    private ctx;
    private imagePlugin;
    private specialCharsPlugin;
    private tablePlugin;
    private importPlugin;
    constructor(ctx: CommandContext);
    getImagePlugin(): ImagePlugin;
    getSpecialCharsPlugin(): SpecialCharsPlugin;
    getTablePlugin(): TablePlugin;
    getImportPlugin(): ImportPlugin;
    execute(command: string, value?: any): void;
    private applyBorder;
    private tableMergeCells;
    private tableSplitCell;
    queryCommandState(command: string): boolean;
    queryBlockValue(property: string): string;
    getCurrentInlineStyle(property: string): string;
    private stepFontSize;
    private toKebabCase;
    private applyHeading;
    private applyBlockStyle;
    private applyIndent;
    /**
     * İmleçten hemen önceki boşlukları (en fazla maxCount adet) siler.
     */
    removeSpacesBeforeCursor(maxCount?: number): boolean;
    private parseDimensionToCm;
    private toggleInlineFormat;
    private stripInlineFormatFromRange;
    /**
     * Tam hatasız, iç içe span çakışmalarını temizleyen inline stil motoru.
     * Yazı boyutunu büyütme, küçültme, sıfırlama veya font ailesini değiştirme
     * işlemlerinin geriye dönük her zaman doğru çalışmasını garanti eder.
     */
    private applyInlineStyle;
    private applyPageMargin;
    private insertCheckList;
    private insertOfficialTemplate;
    private findClosestCell;
    private tableAddRow;
    private tableAddCol;
    private tableDeleteRow;
    private tableDeleteCol;
    private tableDelete;
    private insertPageBreak;
    private storedFormat;
    private isFormatPainterActive;
    private formatPainterCleanup;
    toggleFormatPainter(): void;
    deactivateFormatPainter(): void;
    isFormatPainting(): boolean;
    getStoredFormat(): StoredFormat | null;
    private cleanExtractedFormatting;
    private isNodeBold;
    private isNodeItalic;
    private isNodeUnderline;
    private createStyledSpan;
    applyStoredFormatToRange(range: Range, format: StoredFormat): void;
    private applyCaseChange;
}
