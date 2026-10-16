/**
 * ============================================================================
 * PRINT MANAGER - TAM İZOLE BASKI VE YAZDIRMA MOTORU
 * ============================================================================
 * Bu sınıf; gerek modal içinde, gerek sayfa içinde gömülü, gerekse Kemalpaşa
 * Belediyesi EBYS gibi karmaşık kurumsal portal arayüzlerinde çalışan editörün
 * çevresindeki (header, menü, modal çerçevesi, butonlar, diğer sekmeler vb.)
 * hiçbir harici öğeyi baskıya KATMADAN, yalnızca ve yalnızca ilgili editörün
 * A4 belge sayfalarını (.rye-page) sıfır boşlukla yazdırmasını sağlar.
 */
export declare class PrintManager {
    private static isPrinting;
    private static nativeHooksInitialized;
    /**
     * Belirtilen editörün sadece A4 sayfalarını yazdırır.
     * Çevredeki web sitesi veya diğer editörler baskı akışına ASLA dahil edilmez.
     */
    static print(target?: any): void;
    /**
     * Hedef editörü ve DOM elemanlarını çözümler.
     */
    static resolveTarget(target?: any): {
        container: HTMLElement;
        editable: HTMLElement;
    } | null;
    /**
     * Arka planda gizli bir iframe oluşturur ve yalnızca ilgili sayfaları
     * bu iframe içerisine yükleyip yazdırır. Bu sayede ana sayfadaki
     * hiçbir yabancı eleman (header, sidebar, modal çerçevesi vb.) baskıya girmez.
     */
    private static printViaIframe;
    /**
     * Iframe kullanılamıyorsa veya doğrudan tarayıcı menüsünden / Ctrl+P ile
     * window.print() tetiklendiyse ana sayfayı izole eden fallback.
     */
    static fallbackPrint(container?: HTMLElement): void;
    /**
     * Tarayıcının kendi Ctrl+P veya Dosya -> Yazdır menüsü tetiklendiğinde
     * sayfadaki aktif editör haricindeki tüm alanların dışlanmasını sağlar.
     */
    static initGlobalPrintHooks(): void;
}
