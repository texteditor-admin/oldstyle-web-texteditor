import { CommandRegistry } from '../core/Commands';
import { SelectionManager } from '../core/Selection';
export interface LineAlignmentInfo {
    lineNumber: number;
    indentCm: number;
    leadingSpaces: number;
    isActive: boolean;
    isFirstLine: boolean;
}
export declare class Ruler {
    private commands;
    private selection;
    private element;
    private rulerBody;
    private sliderFirstLine;
    private sliderCurrentLine;
    private sliderLeft;
    private sliderRight;
    private guideLine;
    private lineTicksContainer;
    private lineBadge;
    private firstLineCm;
    private currentLineCm;
    private activeLineNumber;
    private leftIndentCm;
    private rightIndentCm;
    private isDragging;
    private activeSlider;
    private dragStartX;
    private initialSliderVal;
    private activeTargetBlock;
    private pxPerCm;
    constructor(commands: CommandRegistry, selection: SelectionManager);
    getElement(): HTMLElement;
    getCurrentLineCm(): number;
    getActiveLineNumber(): number;
    getSliderCurrentLine(): HTMLElement;
    getLineBadge(): HTMLElement;
    private createRulerElement;
    private attachEventListeners;
    private getActualPxPerCm;
    private getTargetBlock;
    private startDrag;
    private handleDrag;
    private stopDrag;
    private updateGuideLinePosition;
    private applyIndentToActiveBlock;
    private applyIndentToActiveLine;
    /**
     * Hedef bloğun içindeki satırları analiz eder ve her satırın hizasını hesaplar.
     */
    analyzeLines(target: HTMLElement): {
        lines: LineAlignmentInfo[];
        activeLineNumber: number;
    };
    /**
     * Editörde imlecin bulunduğu paragrafa ve aktif satıra göre cetvel sürgülerini senkronize eder.
     */
    updateFromSelection(block?: HTMLElement | null): void;
    private parseDimensionToCm;
}
