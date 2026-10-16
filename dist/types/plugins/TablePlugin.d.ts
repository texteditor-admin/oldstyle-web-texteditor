import { CommandContext } from '../core/Commands';
export declare class TablePlugin {
    private ctx;
    private tableHandle;
    private activeTable;
    private resizeState;
    constructor(ctx: CommandContext);
    createTablePicker(onSelect: (rows: number, cols: number, borderless?: boolean) => void): HTMLElement;
    private highlightCells;
    /**
     * Saf, başlıksız ve kenarlıksız (veya kenarlıklı) tablo ekler.
     * Hücreler temizdir ("Başlık" veya "Hücre" yazısı içermez).
     */
    insertTable(rows: number, cols: number, borderless?: boolean): void;
    /**
     * Serbest / Özel Tablo Ekleme Modal Penceresi
     */
    promptCustomTable(): void;
    /**
     * Tablo kenarlıklarını açıp kapatır (Kenarlıksız <-> Kenarlıklı)
     */
    toggleBorders(targetTable?: HTMLTableElement): void;
    /**
     * Tablo etkileşimlerini (Tut-Sil kolu, fare ile sütun/satır yeniden boyutlandırma) kurar.
     */
    private setupTableInteractions;
    private handleResizeMove;
    private showTableHandle;
    private hideTableHandle;
    private selectEntireTable;
    private deleteTable;
    private addRowToTable;
    private addColToTable;
}
