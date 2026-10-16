import { ResmiYaziEditor, EditorConfig } from '../core/Editor';
export interface ModalOptions extends EditorConfig {
    trigger?: string | HTMLElement;
    preview?: string | HTMLElement;
    title?: string;
    saveKey?: string;
    onSave?: (html: string) => void;
    onCancel?: () => void;
}
export declare class ModalLauncher {
    private options;
    private modalOverlay;
    private editorTarget;
    private editorInstance;
    private previewEl;
    private originalData;
    constructor(options: ModalOptions);
    private createModalDOM;
    open(): Promise<ResmiYaziEditor>;
    close(): void;
    private confirmAndClose;
    private saveAndClose;
    getEditor(): ResmiYaziEditor | null;
}
