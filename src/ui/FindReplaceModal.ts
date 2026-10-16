export class FindReplaceBox {
  private element: HTMLElement;
  private editable: HTMLElement;
  private onChange?: () => void;
  private findInput!: HTMLInputElement;
  private replaceInput!: HTMLInputElement;
  private isOpen: boolean = false;

  constructor(editable: HTMLElement, onChange?: () => void) {
    this.editable = editable;
    this.onChange = onChange;
    this.element = this.createBox();
  }

  getElement(): HTMLElement {
    return this.element;
  }

  private createBox(): HTMLElement {
    const box = document.createElement('div');
    box.className = 'rye-find-box';

    // Header
    const header = document.createElement('div');
    header.className = 'rye-find-header';
    header.innerHTML = `
      <div class="rye-find-title">🔍 Bul ve Değiştir</div>
      <button type="button" class="rye-find-close-btn" title="Kapat (Esc)">✕</button>
    `;
    const closeBtn = header.querySelector('.rye-find-close-btn') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => this.toggle(false));
    box.appendChild(header);

    // Row 1: Find
    const row1 = document.createElement('div');
    row1.className = 'rye-find-row';
    this.findInput = document.createElement('input');
    this.findInput.className = 'rye-find-input';
    this.findInput.placeholder = 'Aranacak metin...';
    this.findInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.findNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.toggle(false);
      }
    });

    const findNextBtn = document.createElement('button');
    findNextBtn.type = 'button';
    findNextBtn.className = 'rye-find-btn';
    findNextBtn.textContent = 'Sonraki';
    findNextBtn.addEventListener('click', () => this.findNext());

    row1.appendChild(this.findInput);
    row1.appendChild(findNextBtn);

    // Row 2: Replace
    const row2 = document.createElement('div');
    row2.className = 'rye-find-row';
    this.replaceInput = document.createElement('input');
    this.replaceInput.className = 'rye-find-input';
    this.replaceInput.placeholder = 'Yeni metin...';
    this.replaceInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.replaceCurrent();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.toggle(false);
      }
    });

    const replaceBtn = document.createElement('button');
    replaceBtn.type = 'button';
    replaceBtn.className = 'rye-find-btn';
    replaceBtn.textContent = 'Değiştir';
    replaceBtn.addEventListener('click', () => this.replaceCurrent());

    const replaceAllBtn = document.createElement('button');
    replaceAllBtn.type = 'button';
    replaceAllBtn.className = 'rye-find-btn';
    replaceAllBtn.textContent = 'Tümünü Değiştir';
    replaceAllBtn.addEventListener('click', () => this.replaceAll());

    row2.appendChild(this.replaceInput);
    row2.appendChild(replaceBtn);
    row2.appendChild(replaceAllBtn);

    box.appendChild(row1);
    box.appendChild(row2);

    return box;
  }

  toggle(show?: boolean): void {
    this.isOpen = show !== undefined ? show : !this.isOpen;
    if (this.isOpen) {
      this.element.classList.add('is-open');
      this.findInput.focus();
      this.findInput.select();
    } else {
      this.element.classList.remove('is-open');
    }
  }

  private findNext(): boolean {
    const text = this.findInput.value;
    if (!text) return false;
    if (typeof (window as any).find === 'function') {
      return (window as any).find(text, false, false, true, false, false, false);
    }
    return false;
  }

  private replaceCurrent(): void {
    const findText = this.findInput.value;
    const replaceText = this.replaceInput.value;
    if (!findText) return;

    const sel = window.getSelection();
    if (sel && sel.toString().toLowerCase() === findText.toLowerCase()) {
      document.execCommand('insertText', false, replaceText);
      this.onChange?.();
    }
    this.findNext();
  }

  private replaceAll(): void {
    const findText = this.findInput.value;
    const replaceText = this.replaceInput.value;
    if (!findText) return;

    const currentHtml = this.editable.innerHTML;
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    this.editable.innerHTML = currentHtml.replace(regex, replaceText);
    this.onChange?.();
    this.toggle(false);
  }
}
