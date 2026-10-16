import { CommandContext } from '../core/Commands';

export class SpecialCharsPlugin {
  private ctx: CommandContext;
  private modal: HTMLElement | null = null;

  constructor(ctx: CommandContext) {
    this.ctx = ctx;
  }

  openDialog(): void {
    if (this.modal) {
      this.modal.remove();
    }
    this.modal = this.createModal();
    document.body.appendChild(this.modal);
  }

  private createModal(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'rye-special-chars-overlay';

    const card = document.createElement('div');
    card.className = 'rye-special-chars-card';

    const header = document.createElement('div');
    header.className = 'rye-special-chars-header';
    header.innerHTML = `<h4>Özel Karakter / Simge Ekle</h4>`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'rye-btn';
    closeBtn.innerText = '✕';
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);

    const charCategories = [
      {
        name: 'Resmi Yazışma & Para',
        chars: ['§', '¶', '₺', '€', '$', '£', '¥', '№', '©', '®', '™']
      },
      {
        name: 'Noktalama & Tipografi',
        chars: ['«', '»', '“', '”', '‘', '’', '—', '–', '…', '•', '‣', '※']
      },
      {
        name: 'Matematik & Mantık',
        chars: ['°', '±', '≠', '≤', '≥', '÷', '×', '½', '¼', '¾', '∞', '√', 'π', 'µ', '∑', '∆', '≈']
      },
      {
        name: 'Oklar & Semboller',
        chars: ['→', '←', '↑', '↓', '↔', '⇒', '⇐', '✓', '✗', '★', '☆', '▲', '▼']
      }
    ];

    const body = document.createElement('div');
    body.className = 'rye-special-chars-body';

    charCategories.forEach(cat => {
      const catTitle = document.createElement('div');
      catTitle.className = 'rye-chars-cat-title';
      catTitle.innerText = cat.name;
      body.appendChild(catTitle);

      const grid = document.createElement('div');
      grid.className = 'rye-chars-grid';

      cat.chars.forEach(char => {
        const charBtn = document.createElement('button');
        charBtn.className = 'rye-char-btn';
        charBtn.innerText = char;
        charBtn.title = `Ekle: ${char}`;
        charBtn.onclick = () => {
          this.insertChar(char);
          overlay.remove();
        };
        grid.appendChild(charBtn);
      });

      body.appendChild(grid);
    });

    card.appendChild(header);
    card.appendChild(body);
    overlay.appendChild(card);

    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };

    return overlay;
  }

  private insertChar(char: string): void {
    this.ctx.editable.focus();
    this.ctx.selection.restore();
    document.execCommand('insertText', false, char);
    this.ctx.history.record(true);
  }
}
