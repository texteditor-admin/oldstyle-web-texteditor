export declare class PaginationManager {
    private editable;
    private onChange?;
    private maxContentHeightPx;
    private isRepaginating;
    private debounceTimer;
    constructor(editable: HTMLElement, onChange?: (currentPage: number, totalPages: number) => void);
    private measureDimensions;
    private setupListeners;
    scheduleRepaginate(): void;
    /**
     * Sayfa yapısını garanti eder. Tüm içeriklerin .rye-page içinde olmasını sağlar.
     */
    ensurePageStructure(): void;
    /**
     * Sayfanın kullanılabilir içerik yüksekliğini hesaplar
     */
    private getPageContentHeight;
    private isPageOverflowing;
    /**
     * Tüm sayfaları otomatik olarak düzenler, taşanları 2., 3. A4 sayfalarına aktarır
     */
    repaginate(): number;
    private createNewPage;
    private handleBackspace;
    notifyCurrentPage(): void;
    getPageCount(): number;
    /**
     * Tüm sayfalardaki saf HTML içeriğini alır (sayfa numarası rozetlerini temizler ve sayfa sonlarını ekler)
     */
    getData(): string;
    /**
     * İç içe geçmiş .rye-page-break elemanlarını en üst seviyeye çıkarır
     */
    private flattenPageBreaks;
    /**
     * Dışarıdan HTML yükler ve sayfaları baştan dağıtır.
     * İçe aktarılan belgelerdeki sayfa sonlarını (.rye-page-break) ayrı A4 sayfalarına bölerek kusursuz sayfa geçişleri oluşturur.
     */
    setData(html: string): void;
}
