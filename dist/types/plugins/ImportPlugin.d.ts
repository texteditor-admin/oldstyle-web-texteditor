export declare class ImportPlugin {
    private onHtmlLoaded;
    constructor(onHtmlLoaded: (html: string) => void);
    promptImportFile(): void;
    processFile(file: File): Promise<void>;
    /**
     * Word (.docx) dosyasını doğrudan OpenXML yapısından çözümleyerek hizalamaları (Ortala, Sağa, İki Yana Yasla),
     * girintileri (1.25cm), satır/paragraf boşluklarını, punto, font, renk, vurgu, tablo ve sayfa sonlarını eksiksiz koruyarak HTML'e dönüştürür.
     */
    convertDocxToHtml(arrayBuffer: ArrayBuffer): Promise<string>;
    /**
     * w:sdt (Structured Document Tags / İçerik Denetimleri) içine sarılmış paragrafları ve tabloları özyinelemeli çıkarır
     */
    private collectDocumentBlocks;
    /**
     * w:p (Paragraf) elemanını ayrıştırıp HTML'e dönüştürür.
     * Sayfa sonlarını (w:br type="page", w:lastRenderedPageBreak, w:pageBreakBefore, w:sectPr)
     * tam olarak bulunduğu noktalardan bölerek yeni A4 sayfalarına dağıtır.
     */
    private parseXmlParagraph;
    /**
     * w:r (Run) elemanını biçim özellikleriyle birlikte HTML'e dönüştürür
     */
    private parseXmlRun;
    /**
     * w:tbl (Tablo) elemanını ayrıştırıp HTML'e dönüştürür
     */
    private parseXmlTable;
    setupDropZone(element: HTMLElement): void;
}
