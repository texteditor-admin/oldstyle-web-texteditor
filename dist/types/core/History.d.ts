export interface HistoryState {
    html: string;
}
export declare class HistoryManager {
    private stack;
    private index;
    private maxDepth;
    private rootElement;
    private isApplying;
    private debounceTimer;
    private onChangeCallback;
    constructor(rootElement: HTMLElement, onChange?: () => void);
    private recordInitial;
    record(force?: boolean): void;
    private doRecord;
    canUndo(): boolean;
    canRedo(): boolean;
    undo(): boolean;
    redo(): boolean;
    private applyState;
    clear(): void;
}
