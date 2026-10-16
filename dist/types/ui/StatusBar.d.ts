export declare class StatusBar {
    private element;
    private editable;
    private wordCountEl;
    private charCountEl;
    private pageCountEl;
    constructor(editable: HTMLElement);
    getElement(): HTMLElement;
    private createStatusBar;
    setPageInfo(currentPage: number, totalPages: number): void;
    update(): void;
}
