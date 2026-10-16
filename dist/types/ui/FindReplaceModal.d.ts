export declare class FindReplaceBox {
    private element;
    private editable;
    private onChange?;
    private findInput;
    private replaceInput;
    private isOpen;
    constructor(editable: HTMLElement, onChange?: () => void);
    getElement(): HTMLElement;
    private createBox;
    toggle(show?: boolean): void;
    private findNext;
    private replaceCurrent;
    private replaceAll;
}
