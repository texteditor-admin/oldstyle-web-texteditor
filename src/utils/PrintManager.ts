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

export class PrintManager {
  private static isPrinting: boolean = false;
  private static nativeHooksInitialized: boolean = false;

  /**
   * Belirtilen editörün sadece A4 sayfalarını yazdırır.
   * Çevredeki web sitesi veya diğer editörler baskı akışına ASLA dahil edilmez.
   */
  static print(target?: any): void {
    if (typeof window === 'undefined') return;

    // 1. Hedef editörü ve sayfalarını tespit et
    const resolved = PrintManager.resolveTarget(target);
    if (!resolved || !resolved.editable) {
      console.warn('[PrintManager] Yazdırılacak aktif editör bulunamadı.');
      window.print();
      return;
    }

    const { container, editable } = resolved;
    const pages = editable.querySelectorAll('.rye-page');

    if (!pages || pages.length === 0) {
      PrintManager.printViaIframe([editable.cloneNode(true) as HTMLElement], container);
      return;
    }

    // 2. Sayfaları klonla ve editör içi düzenleme öğelerini (rozeti, kolları) temizle
    const clonedPages: HTMLElement[] = [];
    pages.forEach((pageEl) => {
      const clone = pageEl.cloneNode(true) as HTMLElement;
      // UI rozetleri, cetvel sürgüleri, tablo kollarını kaldır
      clone.querySelectorAll(
        '.rye-page-footer-badge, .rye-table-handle, .rye-table-toolbar, .rye-ruler-bar, .rye-find-box'
      ).forEach((el) => el.remove());

      // contenteditable niteliklerini temizle
      clone.removeAttribute('contenteditable');
      clone.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'));

      clonedPages.push(clone);
    });

    // 3. İzole Iframe ile Yazdır
    PrintManager.printViaIframe(clonedPages, container);
  }

  /**
   * Hedef editörü ve DOM elemanlarını çözümler.
   */
  public static resolveTarget(target?: any): { container: HTMLElement; editable: HTMLElement } | null {
    if (!target) {
      // 1. Öncelik: Aktif modal içindeki editör (EBYS / Bootstrap / Metronic / Kendo / RYE modal)
      const activeModalEditor = document.querySelector(
        '.rye-modal-overlay.is-active .rye-container, .modal.in .rye-container, .modal.show .rye-container, .bootbox.in .rye-container, .k-window:not([style*="display: none"]) .rye-container'
      ) as HTMLElement | null;
      if (activeModalEditor) {
        const editable = activeModalEditor.querySelector('.rye-editable') as HTMLElement | null;
        if (editable) return { container: activeModalEditor, editable };
      }

      // 2. Öncelik: Aktif odaklanılan editör
      const activeEl = document.activeElement;
      if (activeEl) {
        const focusedContainer = (activeEl.closest('.rye-container') || document.querySelector('.rye-container.is-focused')) as HTMLElement | null;
        if (focusedContainer) {
          const editable = focusedContainer.querySelector('.rye-editable') as HTMLElement | null;
          if (editable) return { container: focusedContainer, editable };
        }
      }

      // 3. Öncelik: Son etkileşimde bulunulan editör (ResmiYaziEditor.lastActiveInstance)
      const win = typeof window !== 'undefined' ? (window as any) : null;
      const RYE = win?.ResmiYaziEditor;
      if (RYE && RYE.lastActiveInstance && RYE.lastActiveInstance.state !== 'destroyed') {
        return {
          container: RYE.lastActiveInstance.container,
          editable: RYE.lastActiveInstance.editable
        };
      }

      // 4. Öncelik: Görünür durumdaki ilk editör
      const visibleEditor = Array.from(document.querySelectorAll('.rye-container')).find((c) => {
        const el = c as HTMLElement;
        return el.offsetParent !== null && !el.closest('.tab-content:not(.active)');
      }) as HTMLElement | null;

      if (visibleEditor) {
        const editable = visibleEditor.querySelector('.rye-editable') as HTMLElement | null;
        if (editable) return { container: visibleEditor, editable };
      }

      // 5. Öncelik: Sayfadaki herhangi bir ilk editör
      const firstEditor = document.querySelector('.rye-container') as HTMLElement | null;
      if (firstEditor) {
        const editable = firstEditor.querySelector('.rye-editable') as HTMLElement | null;
        if (editable) return { container: firstEditor, editable };
      }

      return null;
    }

    // ResmiYaziEditor nesnesi mi?
    if (target.editable && target.container) {
      return { container: target.container, editable: target.editable };
    }

    // HTMLElement mi?
    if (target instanceof HTMLElement) {
      if (target.classList.contains('rye-editable')) {
        const container = (target.closest('.rye-container') as HTMLElement) || target;
        return { container, editable: target };
      }
      if (target.classList.contains('rye-container')) {
        const editable = (target.querySelector('.rye-editable') as HTMLElement) || target;
        return { container: target, editable };
      }
      const container = (target.closest('.rye-container') as HTMLElement) || target;
      const editable = (container.querySelector('.rye-editable') as HTMLElement) || target;
      return { container, editable };
    }

    return null;
  }

  /**
   * Arka planda gizli bir iframe oluşturur ve yalnızca ilgili sayfaları
   * bu iframe içerisine yükleyip yazdırır. Bu sayede ana sayfadaki
   * hiçbir yabancı eleman (header, sidebar, modal çerçevesi vb.) baskıya girmez.
   */
  private static printViaIframe(pages: HTMLElement[], container?: HTMLElement): void {
    if (PrintManager.isPrinting) return;
    PrintManager.isPrinting = true;

    try {
      const iframe = document.createElement('iframe');
      iframe.className = 'rye-print-isolation-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!frameDoc) {
        iframe.remove();
        PrintManager.fallbackPrint(container);
        return;
      }

      // Ana sayfadaki stilleri (link ve style etiketleri) topla
      let stylesHtml = '';
      document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
        stylesHtml += link.outerHTML + '\n';
      });
      document.querySelectorAll('style').forEach((style) => {
        // İzolasyon frame'i içerisine ana sayfanın stillerini al
        stylesHtml += style.outerHTML + '\n';
      });

      // Özel sayfa ayarlarını container'dan al
      const pagePadding = container?.style.getPropertyValue('--rye-page-padding') || '1.5cm 1.5cm 0.5cm 1.5cm';
      const fontFamily = container?.style.getPropertyValue('--rye-font-default') || '"Times New Roman", Times, serif';
      const fontSize = container?.style.getPropertyValue('--rye-font-size') || '12pt';
      const lineHeight = container?.style.getPropertyValue('--rye-line-height') || '1.15';

      let pagesHtml = '';
      pages.forEach((p) => {
        pagesHtml += p.outerHTML + '\n';
      });

      const fullHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Resmi Yazı Belgesi</title>
  ${stylesHtml}
  <style>
    @page {
      size: 210mm 297mm;
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      width: 210mm !important;
      font-family: ${fontFamily} !important;
      font-size: ${fontSize} !important;
      line-height: ${lineHeight} !important;
      color: #000000 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .rye-print-wrapper {
      width: 210mm !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
    .rye-page {
      width: 210mm !important;
      min-height: 297mm !important;
      height: 297mm !important;
      box-sizing: border-box !important;
      padding: ${pagePadding} !important;
      margin: 0 auto !important;
      position: relative !important;
      background: #ffffff !important;
      border: none !important;
      box-shadow: none !important;
      overflow: hidden !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      font-family: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
      color: #000000 !important;
    }
    .rye-page:first-child {
      break-before: avoid !important;
      page-break-before: avoid !important;
      margin-top: 0 !important;
    }
    .rye-page:not(:last-child) {
      break-after: page !important;
      page-break-after: always !important;
    }
    .rye-page:last-child {
      break-after: auto !important;
      page-break-after: auto !important;
    }
    .rye-page-footer-badge,
    .rye-table-handle,
    .rye-table-toolbar,
    .rye-ruler-bar,
    .rye-toolbar,
    .rye-menubar,
    .rye-format-bar,
    .rye-status-bar,
    .rye-thumbnails-panel {
      display: none !important;
    }
    /* Kenarlıksız tablolar baskıda tamamen kenarlıksız basılmalıdır */
    table.rye-table.rye-table-borderless th,
    table.rye-table.rye-table-borderless td {
      border: none !important;
    }
    table.rye-table:not(.rye-table-borderless) th,
    table.rye-table:not(.rye-table-borderless) td {
      border: 1px solid #000000 !important;
    }
    table.rye-table {
      width: 100% !important;
      border-collapse: collapse !important;
    }
    .rye-page-break {
      border-top: none !important;
      margin: 0 !important;
      break-before: page !important;
      page-break-before: always !important;
    }
  </style>
</head>
<body class="rye-print-standalone">
  <div class="rye-print-wrapper">
    ${pagesHtml}
  </div>
</body>
</html>`;

      frameDoc.open();
      frameDoc.write(fullHtml);
      frameDoc.close();

      const finishAndPrint = () => {
        try {
          const win = iframe.contentWindow;
          if (win) {
            win.focus();
            win.print();
          }
        } catch (err) {
          console.warn('[PrintManager] Iframe baskı tetikleme hatası, fallback uygulanıyor:', err);
          PrintManager.fallbackPrint(container);
        } finally {
          setTimeout(() => {
            try {
              iframe.remove();
            } catch (e) {}
            PrintManager.isPrinting = false;
          }, 1500);
        }
      };

      // Görseller varsa yüklenmelerini bekle
      const images = Array.from(frameDoc.images || []);
      if (images.length > 0) {
        let loaded = 0;
        const onDone = () => {
          loaded++;
          if (loaded >= images.length) finishAndPrint();
        };
        images.forEach((img) => {
          if (img.complete) {
            onDone();
          } else {
            img.onload = onDone;
            img.onerror = onDone;
          }
        });
        setTimeout(finishAndPrint, 500);
      } else {
        setTimeout(finishAndPrint, 150);
      }
    } catch (err) {
      PrintManager.isPrinting = false;
      console.warn('[PrintManager] Hata:', err);
      PrintManager.fallbackPrint(container);
    }
  }

  /**
   * Iframe kullanılamıyorsa veya doğrudan tarayıcı menüsünden / Ctrl+P ile
   * window.print() tetiklendiyse ana sayfayı izole eden fallback.
   */
  public static fallbackPrint(container?: HTMLElement): void {
    const resolved = PrintManager.resolveTarget(container);
    const targetContainer = resolved ? resolved.container : null;

    if (!targetContainer) {
      window.print();
      return;
    }

    document.body.classList.add('rye-body-isolated-print');
    document.querySelectorAll('.rye-container').forEach((c) => c.classList.remove('rye-print-active-target'));
    targetContainer.classList.add('rye-print-active-target');

    // Modal içindeyse modalı da işaretle
    const modal = targetContainer.closest('.rye-modal-overlay');
    if (modal) {
      modal.classList.add('rye-modal-print-active');
    }

    window.print();

    // Baskı diyaloğu kapandıktan sonra sınıfları temizle
    setTimeout(() => {
      document.body.classList.remove('rye-body-isolated-print');
      targetContainer.classList.remove('rye-print-active-target');
      if (modal) {
        modal.classList.remove('rye-modal-print-active');
      }
      PrintManager.isPrinting = false;
    }, 1000);
  }

  /**
   * Tarayıcının kendi Ctrl+P veya Dosya -> Yazdır menüsü tetiklendiğinde
   * sayfadaki aktif editör haricindeki tüm alanların dışlanmasını sağlar.
   */
  static initGlobalPrintHooks(): void {
    if (typeof window === 'undefined' || PrintManager.nativeHooksInitialized) return;
    PrintManager.nativeHooksInitialized = true;

    window.addEventListener('beforeprint', () => {
      if (PrintManager.isPrinting) return; // İframe üzerinden yazdırılıyorsa karışma

      const resolved = PrintManager.resolveTarget();
      if (resolved) {
        document.body.classList.add('rye-body-isolated-print');
        document.querySelectorAll('.rye-container').forEach((c) => c.classList.remove('rye-print-active-target'));
        resolved.container.classList.add('rye-print-active-target');
        const modal = resolved.container.closest('.rye-modal-overlay');
        if (modal) modal.classList.add('rye-modal-print-active');
      }
    });

    window.addEventListener('afterprint', () => {
      document.body.classList.remove('rye-body-isolated-print');
      document.querySelectorAll('.rye-print-active-target').forEach((c) => c.classList.remove('rye-print-active-target'));
      document.querySelectorAll('.rye-modal-print-active').forEach((m) => m.classList.remove('rye-modal-print-active'));
      PrintManager.isPrinting = false;
    });
  }
}

// Otomatik başlat
if (typeof window !== 'undefined') {
  PrintManager.initGlobalPrintHooks();
}
