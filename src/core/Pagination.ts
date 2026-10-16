export class PaginationManager {
  private editable: HTMLElement;
  private onChange?: (currentPage: number, totalPages: number) => void;
  private maxContentHeightPx: number = 1047; // 297mm - 1.5cm üst - 0.5cm alt ≈ 1047px (96 DPI)
  private isRepaginating: boolean = false;
  private debounceTimer: any = null;

  constructor(editable: HTMLElement, onChange?: (currentPage: number, totalPages: number) => void) {
    this.editable = editable;
    this.onChange = onChange;
    this.measureDimensions();
    this.setupListeners();
  }

  private measureDimensions(): void {
    if (typeof window === 'undefined') return;
    try {
      const probe = document.createElement('div');
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      probe.style.width = '210mm';
      probe.style.height = '297mm';
      probe.style.padding = '1.5cm 1.5cm 0.5cm 1.5cm';
      probe.style.boxSizing = 'border-box';
      document.body.appendChild(probe);

      const heightPx = probe.getBoundingClientRect().height;
      const computed = window.getComputedStyle(probe);
      const paddingTop = parseFloat(computed.paddingTop) || 56.7;
      const paddingBottom = parseFloat(computed.paddingBottom) || 18.9;
      this.maxContentHeightPx = Math.max(700, heightPx - paddingTop - paddingBottom);
      probe.remove();
    } catch {
      this.maxContentHeightPx = 1047;
    }
  }

  private setupListeners(): void {
    // İçerik değiştikçe sayfaları yeniden düzenle
    this.editable.addEventListener('input', () => {
      this.scheduleRepaginate();
    });

    // Sayfalar arası Backspace (silme) geçişi
    this.editable.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        this.handleBackspace(e);
      }
    });

    // İmleç hareket ettikçe mevcut sayfa numarasını bildir
    this.editable.addEventListener('keyup', () => {
      this.notifyCurrentPage();
    });

    this.editable.addEventListener('mouseup', () => {
      this.notifyCurrentPage();
    });
  }

  scheduleRepaginate(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.repaginate();
    }, 40);
  }

  /**
   * Sayfa yapısını garanti eder. Tüm içeriklerin .rye-page içinde olmasını sağlar.
   */
  ensurePageStructure(): void {
    let pages = Array.from(this.editable.querySelectorAll<HTMLElement>(':scope > .rye-page'));

    if (pages.length === 0) {
      // Hiç sayfa yoksa tüm içeriği 1. sayfaya topla
      const page1 = this.createNewPage(1);

      while (this.editable.firstChild) {
        page1.appendChild(this.editable.firstChild);
      }

      if (page1.children.length === 0) {
        page1.innerHTML = '<p><br></p>';
      }

      this.editable.appendChild(page1);
      return;
    }

    // Sayfa dışında (doğrudan rye-editable içinde) kalmış sahipsiz düğümleri son sayfaya taşı
    const directChildren = Array.from(this.editable.childNodes);
    const lastPage = pages[pages.length - 1];

    directChildren.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (!el.classList.contains('rye-page')) {
          lastPage.appendChild(el);
        }
      } else if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()) {
        const p = document.createElement('p');
        p.textContent = node.nodeValue;
        lastPage.appendChild(p);
        node.remove();
      }
    });
  }

  /**
   * Sayfanın kullanılabilir içerik yüksekliğini hesaplar
   */
  private getPageContentHeight(pageEl: HTMLElement): number {
    const children = Array.from(pageEl.children).filter(
      c => !c.classList.contains('rye-page-footer-badge') && !c.classList.contains('rye-page-break')
    ) as HTMLElement[];

    if (children.length === 0) return 0;

    let total = 0;
    children.forEach(c => {
      let margin = 0;
      try {
        const computed = window.getComputedStyle(c);
        const mb = parseFloat(computed.marginBottom) || 0;
        const mt = parseFloat(computed.marginTop) || 0;
        margin = Math.max(mb, mt);
      } catch {}
      total += (c.offsetHeight || 0) + margin;
    });

    return total;
  }

  private isPageOverflowing(pageEl: HTMLElement): boolean {
    const children = Array.from(pageEl.children).filter(
      c => !c.classList.contains('rye-page-footer-badge') && !c.classList.contains('rye-page-break')
    ) as HTMLElement[];

    if (children.length === 0) return false;

    // 1. Tarayıcıda gerçek geometri (BoundingClientRect) ile alt kenar boşluğu kontrolü
    if (typeof pageEl.getBoundingClientRect === 'function') {
      try {
        const pageRect = pageEl.getBoundingClientRect();
        if (pageRect.height > 0) {
          const comp = window.getComputedStyle(pageEl);
          const paddingBottom = parseFloat(comp.paddingBottom) || 94.5;
          const printableBottom = pageRect.bottom - paddingBottom;

          const lastChild = children[children.length - 1];
          const lastRect = lastChild.getBoundingClientRect();

          if (lastRect.bottom > printableBottom + 1) {
            return true;
          }
        }
      } catch {}
    }

    // 2. scrollHeight kontrolü
    if (pageEl.scrollHeight > pageEl.clientHeight + 4) {
      return true;
    }

    // 3. İçerik toplam yüksekliği (JSDOM / headless test ortamı ve yedek kontrol)
    const contentH = this.getPageContentHeight(pageEl);
    if (contentH > 0 && contentH > this.maxContentHeightPx) {
      return true;
    }

    return false;
  }

  /**
   * Tüm sayfaları otomatik olarak düzenler, taşanları 2., 3. A4 sayfalarına aktarır
   */
  repaginate(): number {
    if (this.isRepaginating) return this.getPageCount();
    this.isRepaginating = true;

    try {
      this.ensurePageStructure();

      // İmleç veya seçim aralığını korumak için referans al (Seçim kaybını önler)
      const sel = window.getSelection();
      let savedRangeData: {
        startContainer: Node;
        startOffset: number;
        endContainer: Node;
        endOffset: number;
        collapsed: boolean;
      } | null = null;

      if (sel && sel.rangeCount > 0 && this.editable.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        const r = sel.getRangeAt(0);
        savedRangeData = {
          startContainer: r.startContainer,
          startOffset: r.startOffset,
          endContainer: r.endContainer,
          endOffset: r.endOffset,
          collapsed: r.collapsed
        };
      }

      let pages = Array.from(this.editable.querySelectorAll<HTMLElement>(':scope > .rye-page'));

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        // 1. Manuel Sayfa Sonu (.rye-page-break) Kontrolü
        const breakEl = page.querySelector<HTMLElement>('.rye-page-break');
        if (breakEl) {
          page.setAttribute('data-manual-break', 'true');
          let nextPage = pages[i + 1];
          if (!nextPage) {
            nextPage = this.createNewPage(i + 2);
            this.editable.appendChild(nextPage);
            pages.push(nextPage);
          }

          // breakEl eğer bir bloğun içindeyse (örneğin p içinde), o bloğu ve sonraki blokları aktar
          let topBlock: HTMLElement = breakEl;
          while (topBlock.parentElement && topBlock.parentElement !== page && topBlock.parentElement !== this.editable) {
            topBlock = topBlock.parentElement as HTMLElement;
          }

          // breakEl'den sonra gelen kardeş elemanları sonraki sayfaya aktar
          let nextSibling: Node | null = topBlock === breakEl ? breakEl.nextElementSibling : topBlock.nextElementSibling;
          const toMove: HTMLElement[] = [];
          while (nextSibling) {
            if (nextSibling.nodeType === Node.ELEMENT_NODE && !(nextSibling as HTMLElement).classList.contains('rye-page-footer-badge')) {
              toMove.push(nextSibling as HTMLElement);
            }
            nextSibling = nextSibling.nextSibling;
          }

          toMove.forEach(el => {
            nextPage.appendChild(el);
          });

          // breakEl'i DOM'dan kaldır
          breakEl.remove();
        }

        // 2. Yükseklik Aşımı (Overflow) -> Sonraki sayfaya aktarma
        let safetyCounter = 0;
        let movedDueToOverflow = false;
        while (this.isPageOverflowing(page) && safetyCounter < 100) {
          safetyCounter++;
          const contentChildren = Array.from(page.children).filter(
            c => !c.classList.contains('rye-page-footer-badge') && !c.classList.contains('rye-page-break')
          ) as HTMLElement[];

          if (contentChildren.length <= 1) break;

          let nextPage = pages[i + 1];
          if (!nextPage) {
            nextPage = this.createNewPage(i + 2);
            this.editable.appendChild(nextPage);
            pages.push(nextPage);
          }

          const lastChild = contentChildren[contentChildren.length - 1];
          nextPage.insertBefore(lastChild, nextPage.firstChild);
          movedDueToOverflow = true;
        }

        // 3. İçerik Geri Çekme (Underflow) -> Önceki sayfaya sığarsa geri alma
        // ÖNEMLİ: Taşma nedeniyle eleman sonraya aktarıldıysa veya sayfada manuel sayfa sonu varsa geri çekme yapılmaz!
        const nextPage = pages[i + 1];
        if (!movedDueToOverflow && nextPage) {
          const nextContentChildren = Array.from(nextPage.children).filter(
            c => !c.classList.contains('rye-page-footer-badge')
          ) as HTMLElement[];

          if (nextContentChildren.length > 0) {
            const firstNext = nextContentChildren[0];
            const hasManualBreak = page.getAttribute('data-manual-break') === 'true';
            const isUserEditingFirstNext = sel && sel.anchorNode && firstNext.contains(sel.anchorNode);

            if (!hasManualBreak && !isUserEditingFirstNext) {
              const prevHeight = this.getPageContentHeight(page);
              let candidateHeight = 30;
              try {
                const computed = window.getComputedStyle(firstNext);
                const margin = (parseFloat(computed.marginTop) || 0) + (parseFloat(computed.marginBottom) || 0);
                candidateHeight = (firstNext.offsetHeight || 30) + margin;
              } catch {}

              if (prevHeight + candidateHeight <= this.maxContentHeightPx - 50) {
                page.appendChild(firstNext);
                // Eğer ekledikten sonra taşma oluştuysa geri koy
                if (this.isPageOverflowing(page)) {
                  nextPage.insertBefore(firstNext, nextPage.firstChild);
                }
              }
            }
          }
        }

        // 4. Boş Sayfaları Temizleme (İlk sayfa asla silinmez)
        if (i > 0) {
          const contentChildren = Array.from(page.children).filter(
            c => !c.classList.contains('rye-page-footer-badge')
          );
          const isUserOnThisPage = sel && sel.anchorNode && page.contains(sel.anchorNode);
          if (contentChildren.length === 0 && !isUserOnThisPage) {
            page.remove();
            pages.splice(i, 1);
            i--;
          }
        }
      }

      // 5. Sayfa Numarası Rozetlerini ve Niteliklerini Güncelle
      pages = Array.from(this.editable.querySelectorAll<HTMLElement>(':scope > .rye-page'));
      const totalPages = pages.length;

      pages.forEach((p, idx) => {
        const pageNum = idx + 1;
        p.setAttribute('data-page', String(pageNum));

        let badge = p.querySelector<HTMLElement>('.rye-page-footer-badge');
        if (!badge) {
          badge = document.createElement('div');
          badge.className = 'rye-page-footer-badge';
          badge.setAttribute('contenteditable', 'false');
          p.appendChild(badge);
        }
        // Yönetmelik 27. Madde: Çok sayfalı belgelerde sayfanın ortasında '1/11' şeklinde belirtilir
        badge.textContent = totalPages > 1 ? `${pageNum}/${totalPages}` : '';
      });

      // Seçimi veya imleci tekrar odakla (Seçim kaybını önler)
      if (savedRangeData && savedRangeData.startContainer.isConnected && savedRangeData.endContainer.isConnected && sel) {
        try {
          const range = document.createRange();
          const maxStart = savedRangeData.startContainer.nodeType === Node.TEXT_NODE
            ? (savedRangeData.startContainer.textContent?.length || 0)
            : savedRangeData.startContainer.childNodes.length;
          const maxEnd = savedRangeData.endContainer.nodeType === Node.TEXT_NODE
            ? (savedRangeData.endContainer.textContent?.length || 0)
            : savedRangeData.endContainer.childNodes.length;

          range.setStart(savedRangeData.startContainer, Math.min(savedRangeData.startOffset, maxStart));
          range.setEnd(savedRangeData.endContainer, Math.min(savedRangeData.endOffset, maxEnd));

          if (savedRangeData.collapsed) {
            range.collapse(true);
          }

          sel.removeAllRanges();
          sel.addRange(range);
        } catch {
          // Konum korunamadıysa sessizce geç
        }
      }

      this.notifyCurrentPage();
      return totalPages;
    } finally {
      this.isRepaginating = false;
    }
  }

  private createNewPage(pageNum: number): HTMLElement {
    const page = document.createElement('div');
    page.className = 'rye-page';
    page.setAttribute('data-page', String(pageNum));
    return page;
  }

  private handleBackspace(e: KeyboardEvent): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return;

    const anchor = sel.anchorNode;
    if (!anchor) return;

    const currentBlock = anchor.nodeType === Node.ELEMENT_NODE
      ? (anchor as HTMLElement)
      : anchor.parentElement;

    if (!currentBlock) return;

    const currentPage = currentBlock.closest('.rye-page') as HTMLElement;
    if (!currentPage) return;

    const pageNum = parseInt(currentPage.getAttribute('data-page') || '1', 10);
    if (pageNum <= 1) return; // İlk sayfadaysa normal silme çalışır

    let topBlock: HTMLElement | null = currentBlock;
    while (topBlock && topBlock.parentElement !== currentPage && topBlock.parentElement !== this.editable) {
      topBlock = topBlock.parentElement;
    }

    if (!topBlock || topBlock.parentElement !== currentPage) return;

    // İkinci veya sonraki sayfanın ilk elemanının en başındaysa
    const firstContentBlock = Array.from(currentPage.children).find(
      c => !c.classList.contains('rye-page-footer-badge')
    );

    if (topBlock === firstContentBlock && sel.anchorOffset === 0) {
      const prevPage = currentPage.previousElementSibling as HTMLElement;
      if (prevPage && prevPage.classList.contains('rye-page')) {
        e.preventDefault();

        // Manuel sayfa sonu işaretini kaldır (sayfaların sorunsuz birleşmesini sağlar)
        prevPage.removeAttribute('data-manual-break');

        // Önceki sayfanın son elemanını bul ve imleci oraya taşı
        const prevContentChildren = Array.from(prevPage.children).filter(
          c => !c.classList.contains('rye-page-footer-badge')
        );
        const lastBlockPrev = prevContentChildren[prevContentChildren.length - 1] as HTMLElement;

        if (lastBlockPrev) {
          // İçeriği birleştir veya taşı
          if (topBlock.textContent?.trim() === '') {
            topBlock.remove();
          } else {
            prevPage.appendChild(topBlock);
          }

          // İmleci önceki bloğun sonuna koy
          const range = document.createRange();
          range.selectNodeContents(lastBlockPrev);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);

          this.repaginate();
        }
      }
    }
  }

  notifyCurrentPage(): void {
    if (!this.onChange) return;

    const sel = window.getSelection();
    let currentNum = 1;

    if (sel && sel.anchorNode) {
      const el = sel.anchorNode.nodeType === Node.ELEMENT_NODE
        ? (sel.anchorNode as HTMLElement)
        : sel.anchorNode.parentElement;
      const pageEl = el?.closest('.rye-page');
      if (pageEl) {
        currentNum = parseInt(pageEl.getAttribute('data-page') || '1', 10);
      }
    }

    const totalPages = this.getPageCount();
    this.onChange(currentNum, totalPages);
  }

  getPageCount(): number {
    return this.editable.querySelectorAll(':scope > .rye-page').length || 1;
  }

  /**
   * Tüm sayfalardaki saf HTML içeriğini alır (sayfa numarası rozetlerini temizler ve sayfa sonlarını ekler)
   */
  getData(): string {
    const pages = Array.from(this.editable.querySelectorAll<HTMLElement>(':scope > .rye-page'));
    if (pages.length === 0) {
      return this.editable.innerHTML;
    }

    const parts: string[] = [];
    pages.forEach((page, idx) => {
      const clone = page.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.rye-page-footer-badge').forEach(b => b.remove());
      clone.querySelectorAll('.rye-page-break').forEach(b => b.remove());

      if (idx > 0) {
        parts.push('<div class="rye-page-break" contenteditable="false"></div>');
      }
      parts.push(clone.innerHTML.trim());
    });

    return parts.join('\n');
  }

  /**
   * İç içe geçmiş .rye-page-break elemanlarını en üst seviyeye çıkarır
   */
  private flattenPageBreaks(container: HTMLElement): void {
    const breaks = Array.from(container.querySelectorAll<HTMLElement>('.rye-page-break'));
    breaks.forEach(br => {
      let parent = br.parentElement;
      while (parent && parent !== container) {
        const nextSiblings: Node[] = [];
        let sib = br.nextSibling;
        while (sib) {
          nextSiblings.push(sib);
          sib = sib.nextSibling;
        }

        const clone = parent.cloneNode(false) as HTMLElement;
        nextSiblings.forEach(n => clone.appendChild(n));

        parent.after(br);
        if (clone.childNodes.length > 0) {
          br.after(clone);
        }
        parent = br.parentElement;
      }
    });
  }

  /**
   * Dışarıdan HTML yükler ve sayfaları baştan dağıtır.
   * İçe aktarılan belgelerdeki sayfa sonlarını (.rye-page-break) ayrı A4 sayfalarına bölerek kusursuz sayfa geçişleri oluşturur.
   */
  setData(html: string): void {
    this.editable.innerHTML = '';
    const cleanHtml = (html && html.trim()) ? html : '<p><br></p>';

    // 1. Eğer HTML zaten hazır .rye-page sayfaları içeriyorsa doğrudan yükle
    if (cleanHtml.includes('class="rye-page"')) {
      this.editable.innerHTML = cleanHtml;
      this.ensurePageStructure();
      this.repaginate();
      return;
    }

    // 2. Eğer HTML sayfa sonları (.rye-page-break) içeriyorsa, her bölümü ayrı A4 sayfasına yerleştir
    if (cleanHtml.includes('rye-page-break')) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = cleanHtml;

      this.flattenPageBreaks(tempDiv);

      const pageSegments: Node[][] = [[]];
      let currentSegmentIdx = 0;

      Array.from(tempDiv.childNodes).forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).classList.contains('rye-page-break')) {
          currentSegmentIdx++;
          pageSegments[currentSegmentIdx] = [];
        } else {
          pageSegments[currentSegmentIdx].push(node);
        }
      });

      pageSegments.forEach((segmentNodes, idx) => {
        const page = this.createNewPage(idx + 1);
        if (idx < pageSegments.length - 1) {
          page.setAttribute('data-manual-break', 'true');
        }
        if (segmentNodes.length === 0) {
          page.innerHTML = '<p><br></p>';
        } else {
          segmentNodes.forEach(n => page.appendChild(n));
        }
        this.editable.appendChild(page);
      });

      this.repaginate();
      return;
    }

    // 3. Tek parça HTML (sayfa sonu içermeyen standart metin)
    const page1 = this.createNewPage(1);
    page1.innerHTML = cleanHtml;
    this.editable.appendChild(page1);
    this.repaginate();
  }
}
