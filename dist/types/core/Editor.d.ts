import { Emitter } from './Emitter';
import { ModalLauncher, ModalOptions } from '../modal/ModalLauncher';
import { CollaborationManager, CollaborationConfig } from './Collaboration';
import { PaginationManager } from './Pagination';
export interface EditorConfig {
    initialData?: string;
    placeholder?: string;
    pageMargin?: string;
    lineHeight?: string;
    paragraphSpacing?: string;
    firstLineIndent?: string;
    fontFamily?: string;
    fontSize?: string;
    readOnly?: boolean;
    toolbar?: string[];
    hideFormatBar?: boolean;
    hideStatusBar?: boolean;
    collaboration?: CollaborationConfig;
}
export declare class ResmiYaziEditor extends Emitter {
    static lastActiveInstance: ResmiYaziEditor | null;
    state: 'initializing' | 'ready' | 'destroyed';
    isReadOnly: boolean;
    container: HTMLElement;
    editable: HTMLElement;
    private targetElement;
    private scrollArea;
    private sourceTextarea;
    private isSourceMode;
    private mainArea;
    private thumbnailsPanel;
    private isThumbnailsOpen;
    private currentZoom;
    private selection;
    private history;
    private commands;
    private toolbar;
    private formatBar;
    private statusBar;
    private findBox;
    private collaboration;
    private pagination;
    private config;
    constructor(target: HTMLElement, config?: EditorConfig);
    private mount;
    private setupListeners;
    private onContentChange;
    private toggleSourceMode;
    static create(target: string | HTMLElement, options?: EditorConfig): Promise<ResmiYaziEditor>;
    static createModal(options: ModalOptions): ModalLauncher;
    getData(): string;
    setData(html: string): void;
    getPagination(): PaginationManager;
    execute(command: string, value?: any): void;
    focus(): void;
    enableReadOnlyMode(): void;
    disableReadOnlyMode(): void;
    /**
     * Gerçek zamanlı işbirliğini (Real-time collaboration) etkinleştirir.
     */
    enableCollaboration(config?: CollaborationConfig): CollaborationManager;
    getCollaboration(): CollaborationManager | null;
    /**
     * Word (.docx) olarak dışa aktarır.
     */
    exportWord(filename?: string): void;
    /**
     * PDF olarak dışa aktarır / yazdırır.
     */
    exportPdf(): void;
    /**
     * .docx, .doc, .html veya .txt dosyası seçtirerek editöre aktarır.
     */
    importFile(): void;
    destroy(): void;
    /**
     * Sayfa önizlemeleri (Thumbnails) yan panelini açar/kapatır.
     */
    toggleThumbnails(): void;
    private updateThumbnails;
    private focusHeader;
    private focusFooter;
    private setZoom;
    print(): void;
}
