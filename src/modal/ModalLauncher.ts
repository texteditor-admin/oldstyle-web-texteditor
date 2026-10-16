import { ResmiYaziEditor, EditorConfig } from '../core/Editor';
import { PrintManager } from '../utils/PrintManager';

export interface ModalOptions extends EditorConfig {
  trigger?: string | HTMLElement;
  preview?: string | HTMLElement;
  title?: string;
  saveKey?: string;
  onSave?: (html: string) => void;
  onCancel?: () => void;
}

export class ModalLauncher {
  private options: ModalOptions;
  private modalOverlay: HTMLElement;
  private editorTarget!: HTMLElement;
  private editorInstance: ResmiYaziEditor | null = null;
  private previewEl: HTMLElement | null = null;
  private originalData: string = '';

  constructor(options: ModalOptions) {
    this.options = options;

    if (options.preview) {
      this.previewEl = typeof options.preview === 'string'
        ? document.querySelector<HTMLElement>(options.preview)
        : options.preview;
    }

    this.modalOverlay = this.createModalDOM();
    document.body.appendChild(this.modalOverlay);

    if (options.trigger) {
      const triggerEl = typeof options.trigger === 'string'
        ? document.querySelector<HTMLElement>(options.trigger)
        : options.trigger;

      if (triggerEl) {
        triggerEl.addEventListener('click', () => this.open());
      }
    }

    // Load cached content if available
    if (options.saveKey) {
      const saved = localStorage.getItem(options.saveKey);
      if (saved && this.previewEl) {
        this.previewEl.innerHTML = saved;
      }
    }

    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalOverlay.classList.contains('is-active')) {
        this.confirmAndClose();
      }
    });
  }

  private createModalDOM(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'rye-modal-overlay rye-wrapper';

    // Header
    const header = document.createElement('div');
    header.className = 'rye-modal-header';

    const titleEl = document.createElement('h3');
    titleEl.className = 'rye-modal-title';
    titleEl.innerHTML = `📄 ${this.options.title || 'Resmi Belge Düzenleyici'}`;
    header.appendChild(titleEl);

    const actions = document.createElement('div');
    actions.className = 'rye-modal-actions';

    // Import Button
    const importBtn = document.createElement('button');
    importBtn.type = 'button';
    importBtn.className = 'rye-action-btn rye-action-btn-secondary';
    importBtn.innerHTML = `📥 İçe Aktar (.docx, .doc)`;
    importBtn.title = 'Word (.docx, .doc), HTML veya metin dosyası yükle';
    importBtn.addEventListener('click', () => {
      this.editorInstance?.importFile();
    });

    // Word Export Button
    const exportWordBtn = document.createElement('button');
    exportWordBtn.type = 'button';
    exportWordBtn.className = 'rye-action-btn rye-action-btn-secondary';
    exportWordBtn.innerHTML = `📄 Word İndir (.docx)`;
    exportWordBtn.title = 'Resmi yazıyı Word (.docx) belgesi olarak indir';
    exportWordBtn.addEventListener('click', () => {
      this.editorInstance?.exportWord();
    });

    // Print / PDF Button
    const printBtn = document.createElement('button');
    printBtn.type = 'button';
    printBtn.className = 'rye-action-btn rye-action-btn-secondary';
    printBtn.innerHTML = `🖨️ Yazdır / PDF`;
    printBtn.addEventListener('click', () => {
      if (this.editorInstance) {
        this.editorInstance.print();
      } else {
        PrintManager.print(this.editorTarget);
      }
    });

    // Cancel Button
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'rye-action-btn rye-action-btn-secondary';
    cancelBtn.innerHTML = `✖ İptal`;
    cancelBtn.addEventListener('click', () => this.confirmAndClose());

    // Save Button
    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'rye-action-btn rye-action-btn-primary';
    saveBtn.innerHTML = `💾 Kaydet ve Kapat`;
    saveBtn.addEventListener('click', () => this.saveAndClose());

    actions.appendChild(importBtn);
    actions.appendChild(exportWordBtn);
    actions.appendChild(printBtn);
    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    header.appendChild(actions);

    overlay.appendChild(header);

    // Editor target mount point inside modal
    this.editorTarget = document.createElement('div');
    this.editorTarget.style.flex = '1';
    this.editorTarget.style.display = 'flex';
    this.editorTarget.style.flexDirection = 'column';
    this.editorTarget.style.overflow = 'hidden';
    overlay.appendChild(this.editorTarget);

    return overlay;
  }

  async open(): Promise<ResmiYaziEditor> {
    this.modalOverlay.classList.add('is-active');

    if (this.previewEl) {
      this.originalData = this.previewEl.innerHTML;
    } else if (this.options.initialData) {
      this.originalData = this.options.initialData;
    } else {
      this.originalData = '<p>Resmi yazı metnini buraya giriniz...</p>';
    }

    if (this.options.saveKey) {
      const saved = localStorage.getItem(this.options.saveKey);
      if (saved) {
        this.originalData = saved;
      }
    }

    // Create editor instance
    this.editorInstance = await ResmiYaziEditor.create(this.editorTarget, {
      ...this.options,
      initialData: this.originalData
    });

    return this.editorInstance;
  }

  close(): void {
    this.modalOverlay.classList.remove('is-active');
    if (this.editorInstance) {
      this.editorInstance.destroy();
      this.editorInstance = null;
    }
    if (this.options.onCancel) {
      this.options.onCancel();
    }
  }

  private confirmAndClose(): void {
    if (this.editorInstance) {
      const current = this.editorInstance.getData();
      if (current !== this.originalData) {
        if (!confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?')) {
          return;
        }
      }
    }
    this.close();
  }

  private saveAndClose(): void {
    if (!this.editorInstance) return;

    const html = this.editorInstance.getData();

    if (this.previewEl) {
      this.previewEl.innerHTML = html;
    }

    if (this.options.saveKey) {
      localStorage.setItem(this.options.saveKey, html);
    }

    if (this.options.onSave) {
      this.options.onSave(html);
    }

    this.modalOverlay.classList.remove('is-active');
    if (this.editorInstance) {
      this.editorInstance.destroy();
      this.editorInstance = null;
    }
  }

  getEditor(): ResmiYaziEditor | null {
    return this.editorInstance;
  }
}
