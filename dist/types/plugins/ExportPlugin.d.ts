export interface ImageExportItem {
    id: string;
    target: string;
    data: string;
    ext: string;
    mime: string;
}
export declare class ExportPlugin {
    /**
     * Belgeyi standart Microsoft Word OpenXML (.docx) formatında dışa aktarır.
     * A4 kağıt ebadı (210x297mm), 2.5cm kenar boşlukları, Times New Roman yazı tipi,
     * paragraflar, tablolar, girintiler, hizalamalar ve renkleri eksiksiz korur.
     */
    static exportToDocx(contentHtml: string, filename?: string): Promise<void>;
    /**
     * HTML içeriğini OpenXML WordprocessingML yapısına dönüştürür
     */
    static htmlToDocxXml(html: string): {
        docXml: string;
        mediaFiles: ImageExportItem[];
    };
    /**
     * Varsayılan Word dışa aktarımı (.docx olarak kaydeder)
     */
    static exportToWord(contentHtml: string, filename?: string): void;
    /**
     * İsteğe bağlı .doc formatında kaydetme seçeneği
     */
    static exportToDoc(contentHtml: string, filename?: string): void;
    static exportToPdf(target?: any): void;
    private static downloadBlob;
}
