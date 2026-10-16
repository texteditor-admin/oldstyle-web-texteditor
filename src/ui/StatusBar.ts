export class StatusBar {
  private element: HTMLElement;
  private editable: HTMLElement;
  private wordCountEl!: HTMLElement;
  private charCountEl!: HTMLElement;
  private pageCountEl!: HTMLElement;

  constructor(editable: HTMLElement) {
    this.editable = editable;
    this.element = this.createStatusBar();
    this.update();
  }

  getElement(): HTMLElement {
    return this.element;
  }

  private createStatusBar(): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'rye-status-bar';

    const left = document.createElement('div');
    left.className = 'rye-status-item';

    this.pageCountEl = document.createElement('span');
    this.pageCountEl.textContent = 'Sayfa: 1';

    this.wordCountEl = document.createElement('span');
    this.wordCountEl.textContent = 'Sözcük: 0';

    this.charCountEl = document.createElement('span');
    this.charCountEl.textContent = 'Karakter: 0';

    left.appendChild(this.pageCountEl);
    left.appendChild(this.wordCountEl);
    left.appendChild(this.charCountEl);

    const right = document.createElement('div');
    right.className = 'rye-status-item';
    right.innerHTML = `<span>A4 (210 x 297 mm)</span> <span>%100</span>`;

    bar.appendChild(left);
    bar.appendChild(right);
    return bar;
  }

  setPageInfo(currentPage: number, totalPages: number): void {
    this.pageCountEl.textContent = `Sayfa: ${currentPage} / ${totalPages}`;
  }

  update(): void {
    const text = this.editable.innerText || this.editable.textContent || '';
    const trimmed = text.trim();

    // Word count
    const words = trimmed.length > 0 ? trimmed.split(/\s+/).length : 0;
    this.wordCountEl.textContent = `Sözcük: ${words}`;

    // Char count
    this.charCountEl.textContent = `Karakter: ${text.length}`;

    // Gerçek A4 sayfa sayısı ve mevcut sayfa
    const pages = this.editable.querySelectorAll('.rye-page');
    const totalPages = Math.max(1, pages.length);
    let currentPage = 1;

    const sel = window.getSelection();
    if (sel && sel.anchorNode) {
      const el = sel.anchorNode.nodeType === Node.ELEMENT_NODE
        ? (sel.anchorNode as HTMLElement)
        : sel.anchorNode.parentElement;
      const pageEl = el?.closest('.rye-page');
      if (pageEl) {
        currentPage = parseInt(pageEl.getAttribute('data-page') || '1', 10);
      }
    }

    this.pageCountEl.textContent = `Sayfa: ${currentPage} / ${totalPages}`;
  }
}
