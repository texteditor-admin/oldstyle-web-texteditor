import { ResmiYaziEditor } from '../core/Editor';
/**
 * ============================================================================
 * CKEDITOR 4 & OLGU EBYS (KEMALPAŞA BELEDİYESİ) UYUMLULUK ADAPTÖRÜ (SHIM)
 * ============================================================================
 * Bu adaptör; Olgu EBYS (Single Page Application - RequireJS + Metronic + Kendo UI)
 * ve tüm CKEditor 4 entegrasyonlu kurumsal sistemlerde CKEditor 4.x API'sini
 * birebir taklit ederek ResmiYaziEditor'ü sıfır kod değişikliğiyle (drop-in)
 * çalıştırır.
 */
export interface CKEditorEventData {
    editor: CKEditorInstanceShim;
    data?: any;
    name?: string;
}
export declare class CKEditorInstanceShim {
    id: string;
    name: string;
    element: HTMLElement;
    container: HTMLElement;
    editor: ResmiYaziEditor;
    status: 'unloaded' | 'loaded' | 'ready' | 'destroyed';
    readOnly: boolean;
    document: Document;
    window: Window;
    config: any;
    private listeners;
    private initialData;
    private isDirtyFlag;
    constructor(element: HTMLElement, name: string, userConfig?: any);
    /**
     * CKEditor 4: getData()
     * Editörün güncel HTML içeriğini döndürür.
     */
    getData(): string;
    /**
     * CKEditor 4: setData(html, callback)
     * İçeriği günceller ve varsa callback'i tetikler.
     */
    setData(html: string, callback?: Function): void;
    /**
     * CKEditor 4: insertHtml(html)
     * İmleç konumuna veya aktif sayfaya HTML ekler.
     */
    insertHtml(html: string): void;
    /**
     * CKEditor 4: insertText(text)
     * İmleç konumuna düz metin ekler.
     */
    insertText(text: string): void;
    /**
     * CKEditor 4: updateElement()
     * Orijinal textarea'nın değerini günceller (Form submit / e-İmza akışı için kritik).
     */
    updateElement(): void;
    /**
     * CKEditor 4: focus()
     */
    focus(): void;
    /**
     * CKEditor 4: destroy(noUpdate)
     */
    destroy(noUpdate?: boolean): void;
    /**
     * CKEditor 4: checkDirty()
     */
    checkDirty(): boolean;
    /**
     * CKEditor 4: resetDirty()
     */
    resetDirty(): void;
    /**
     * CKEditor 4: setReadOnly(isReadOnly)
     */
    setReadOnly(isReadOnly?: boolean): void;
    /**
     * CKEditor 4: getSnapshot()
     */
    getSnapshot(): string;
    /**
     * CKEditor 4: loadSnapshot(snapshot)
     */
    loadSnapshot(snapshot: string): void;
    /**
     * CKEditor 4: on(eventName, listener, priority)
     */
    on(eventName: string, listener: Function, _priority?: number): {
        removeListener: () => void;
    };
    /**
     * CKEditor 4: once(eventName, listener)
     */
    once(eventName: string, listener: Function): void;
    /**
     * CKEditor 4: removeListener(eventName, listener)
     */
    removeListener(eventName: string, listener: Function): void;
    /**
     * CKEditor 4: fire(eventName, data)
     */
    fire(eventName: string, data?: any): boolean;
    /**
     * CKEditor 4: execCommand(cmd, data)
     */
    execCommand(cmd: string, data?: any): boolean;
    getCommand(name: string): any;
    addCommand(_name: string, _def: any): void;
    getSelection(): any;
    ui: {
        addButton: () => void;
        add: () => void;
    };
}
export declare const CKEDITOR_SHIM: any;
/**
 * ============================================================================
 * JQUERY ADAPTÖRÜ (adapters/jquery.js yerine)
 * ============================================================================
 */
export declare function registerJQueryAdapter($: any): void;
/**
 * ============================================================================
 * GLOBAL TANIMLAR VE AMD / REQUIREJS ENTEGRASYONU
 * ============================================================================
 */
export declare function initCKEditorShim(): void;
