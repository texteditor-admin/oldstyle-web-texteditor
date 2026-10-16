import { CommandContext } from '../core/Commands';

export class ImagePlugin {
  private ctx: CommandContext;

  constructor(ctx: CommandContext) {
    this.ctx = ctx;
    this.setupDragAndDrop();
    this.setupClickHandlers();
  }

  insertImageFromFile(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (src) {
          this.insertImageElement(src, file.name);
        }
      };
      reader.readAsDataURL(file);
    };

    document.body.appendChild(input);
    input.click();
    input.remove();
  }

  insertImageFromUrl(): void {
    const url = prompt('Görsel URL adresini giriniz:');
    if (url && url.trim()) {
      this.insertImageElement(url.trim(), 'Görsel');
    }
  }

  insertImageElement(src: string, alt: string = 'Görsel'): void {
    this.ctx.editable.focus();
    this.ctx.selection.restore();

    const figure = document.createElement('figure');
    figure.className = 'rye-image-widget';
    figure.style.margin = '16pt auto';
    figure.style.textAlign = 'center';
    figure.style.maxWidth = '100%';

    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.borderRadius = '4px';
    img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';

    const caption = document.createElement('figcaption');
    caption.contentEditable = 'true';
    caption.style.fontSize = '10pt';
    caption.style.color = '#64748b';
    caption.style.marginTop = '4pt';
    caption.style.fontStyle = 'italic';
    caption.innerText = alt || 'Görsel açıklaması';

    figure.appendChild(img);
    figure.appendChild(caption);

    const nextP = document.createElement('p');
    nextP.innerHTML = '<br>';

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(figure);
      figure.after(nextP);
    } else {
      this.ctx.editable.appendChild(figure);
      this.ctx.editable.appendChild(nextP);
    }

    this.ctx.history.record(true);
  }

  private setupDragAndDrop(): void {
    this.ctx.editable.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
    });

    this.ctx.editable.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const src = event.target?.result as string;
          if (src) {
            this.insertImageElement(src, file.name);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  private setupClickHandlers(): void {
    this.ctx.editable.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'IMG') {
        const figure = target.closest('figure.rye-image-widget') as HTMLElement;
        if (!figure) return;

        // Contextual image resizing prompt or cycle
        const currentWidth = target.style.width;
        if (!currentWidth || currentWidth === '100%') {
          target.style.width = '50%';
        } else if (currentWidth === '50%') {
          target.style.width = '75%';
        } else if (currentWidth === '75%') {
          target.style.width = '25%';
        } else {
          target.style.width = '100%';
        }
        this.ctx.history.record(true);
      }
    });
  }
}
