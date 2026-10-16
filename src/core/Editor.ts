import { Emitter } from './Emitter';
import { SelectionManager } from './Selection';
import { HistoryManager } from './History';
import { CommandRegistry } from './Commands';
import { Toolbar } from '../ui/Toolbar';
import { FormatBar } from '../ui/FormatBar';
import { StatusBar } from '../ui/StatusBar';
import { FindReplaceBox } from '../ui/FindReplaceModal';
import { ModalLauncher, ModalOptions } from '../modal/ModalLauncher';
import { CollaborationManager, CollaborationConfig } from './Collaboration';
import { PaginationManager } from './Pagination';
import { PrintManager } from '../utils/PrintManager';

export interface EditorConfig {
  initialData?: string;
  placeholder?: string;
  pageMargin?: string;
  lineHeight?: string;
  paragraphSpacing?: string;
  firstLineIndent?: string;
  fontFamily?: string;
  fontSize?: string;
  readOnly?: boolean;
  toolbar?: string[];
  hideFormatBar?: boolean;
  hideStatusBar?: boolean;
  collaboration?: CollaborationConfig;
}

export class ResmiYaziEditor extends Emitter {
  public static lastActiveInstance: ResmiYaziEditor | null = null;
  public state: 'initializing' | 'ready' | 'destroyed' = 'initializing';
  public isReadOnly: boolean = false;

  public container: HTMLElement;
  public editable: HTMLElement;
  private targetElement: HTMLElement;
  private scrollArea: HTMLElement;
  private sourceTextarea: HTMLTextAreaElement;
  private isSourceMode: boolean = false;

  private mainArea: HTMLElement;
  private thumbnailsPanel: HTMLElement;
  private isThumbnailsOpen: boolean = false;
  private currentZoom: string = 'width';

  private selection: SelectionManager;
  private history: HistoryManager;
  private commands: CommandRegistry;
  private toolbar: Toolbar;
  private formatBar: FormatBar | null = null;
  private statusBar: StatusBar | null = null;
  private findBox: FindReplaceBox;
  private collaboration: CollaborationManager | null = null;
  private pagination!: PaginationManager;

  private config: EditorConfig;

  constructor(target: HTMLElement, config: EditorConfig = {}) {
    super();
    this.targetElement = target;
    this.config = config;

    // Build the editor DOM structure
    this.container = document.createElement('div');
    this.container.className = 'rye-container rye-wrapper';

    // Main content area for thumbnails sidebar and scroll area
    this.mainArea = document.createElement('div');
    this.mainArea.className = 'rye-main-area';

    // Thumbnails yan paneli
    this.thumbnailsPanel = document.createElement('div');
    this.thumbnailsPanel.className = 'rye-thumbnails-panel';
    this.mainArea.appendChild(this.thumbnailsPanel);

    // Scroll Area & Çok Sayfalı A4 Düzenleyici
    this.scrollArea = document.createElement('div');
    this.scrollArea.className = 'rye-scroll-area';

    this.editable = document.createElement('div');
    this.editable.className = 'rye-editable';
    this.editable.contentEditable = config.readOnly ? 'false' : 'true';
    this.editable.setAttribute('role', 'textbox');
    this.editable.setAttribute('aria-multiline', 'true');

    if (config.placeholder) {
      this.editable.setAttribute('data-placeholder', config.placeholder);
    }

    // Cumhurbaşkanlığı 2025 Resmî Yazışma Kılavuzu Standartları (Yönetmelik 7, 8, 16. Maddeler)
    const defaultPageMargin = config.pageMargin || '1.5cm 1.5cm 0.5cm 1.5cm';
    this.container.style.setProperty('--rye-page-padding', defaultPageMargin);

    const defaultLineHeight = config.lineHeight || '1.15';
    this.container.style.setProperty('--rye-line-height', defaultLineHeight);

    const defaultParaSpacing = config.paragraphSpacing || '0pt';
    this.container.style.setProperty('--rye-para-spacing', defaultParaSpacing);

    const defaultFirstLineIndent = config.firstLineIndent || '1.25cm';
    this.container.style.setProperty('--rye-first-line-indent', defaultFirstLineIndent);

    const defaultFontFamily = config.fontFamily || '"Times New Roman", Times, serif';
    this.container.style.setProperty('--rye-font-default', defaultFontFamily);

    const defaultFontSize = config.fontSize || '12pt';
    this.container.style.setProperty('--rye-font-size', defaultFontSize);

    this.scrollArea.appendChild(this.editable);
    this.mainArea.appendChild(this.scrollArea);

    // Otomatik Çok Sayfalı (Multi-Page A4) Sayfalama Yöneticisi
    this.pagination = new PaginationManager(this.editable, (current, total) => {
      this.statusBar?.setPageInfo(current, total);
      if (this.isThumbnailsOpen) {
        this.updateThumbnails();
      }
    });

    // Source Editor textarea
    this.sourceTextarea = document.createElement('textarea');
    this.sourceTextarea.className = 'rye-source-editor';

    // Core Managers
    this.selection = new SelectionManager(this.editable);
    this.history = new HistoryManager(this.editable, () => {
      this.onContentChange();
      if (this.isThumbnailsOpen) {
        this.updateThumbnails();
      }
    });
    this.commands = new CommandRegistry({
      editable: this.editable,
      selection: this.selection,
      history: this.history,
      container: this.container,
      getData: () => this.getData(),
      onHtmlLoaded: (html: string) => {
        this.setData(html);
      },
      onStateChange: () => {
        this.toolbar?.updateState();
        this.statusBar?.update();
      }
    });

    // Format Bar (Word Şeridine dahil edildiği için varsayılan olarak kapalıdır)
    if (config.hideFormatBar === false) {
      this.formatBar = new FormatBar(this.commands);
      this.container.appendChild(this.formatBar.getElement());
    }

    // Toolbar
    this.toolbar = new Toolbar(
      this.commands,
      this.selection,
      config.toolbar,
      {
        onSourceToggle: () => this.toggleSourceMode(),
        onFindToggle: () => this.findBox.toggle(),
        onThumbnailsToggle: () => this.toggleThumbnails(),
        onHeaderClick: () => this.focusHeader(),
        onFooterClick: () => this.focusFooter(),
        onZoomChange: (zoom: string) => this.setZoom(zoom)
      }
    );
    this.container.appendChild(this.toolbar.getElement());

    // Add main area & source editor to container
    this.container.appendChild(this.mainArea);
    this.container.appendChild(this.sourceTextarea);

    // Find and Replace Box (Ana çalışma alanına monte edilerek menünün altında kalması önlenir)
    this.findBox = new FindReplaceBox(this.editable, () => this.onContentChange());
    this.mainArea.appendChild(this.findBox.getElement());

    // Status Bar
    if (!config.hideStatusBar) {
      this.statusBar = new StatusBar(this.editable);
      this.container.appendChild(this.statusBar.getElement());
    }

    // Initialize Content
    const initialHtml = config.initialData !== undefined
      ? config.initialData
      : (target instanceof HTMLTextAreaElement ? target.value : target.innerHTML);

    this.setData(initialHtml || '<p>Resmi yazı metnini buraya giriniz...</p>');

    // Replace or attach to target
    this.mount(target);

    // Setup event listeners
    this.setupListeners();

    // Collaboration setup if provided
    if (config.collaboration) {
      this.enableCollaboration(config.collaboration);
    }

    this.state = 'ready';
    ResmiYaziEditor.lastActiveInstance = this;
    this.fire('ready', this);
  }

  private mount(target: HTMLElement): void {
    if (target instanceof HTMLTextAreaElement) {
      target.style.display = 'none';
      target.parentElement?.insertBefore(this.container, target.nextSibling);
    } else {
      target.innerHTML = '';
      target.appendChild(this.container);
    }
  }

  private setupListeners(): void {
    // Focus & Activity Tracking
    this.editable.addEventListener('focus', () => {
      ResmiYaziEditor.lastActiveInstance = this;
      this.container.classList.add('is-focused');
    });
    this.editable.addEventListener('blur', () => {
      this.container.classList.remove('is-focused');
    });
    this.editable.addEventListener('mousedown', () => {
      ResmiYaziEditor.lastActiveInstance = this;
    });

    // Input & Typing
    this.editable.addEventListener('input', () => {
      this.history.record();
      this.onContentChange();
    });

    // Selection changes
    this.editable.addEventListener('keyup', () => {
      this.selection.save();
      this.toolbar.updateState();
      this.statusBar?.update();
    });

    this.editable.addEventListener('mouseup', () => {
      this.selection.save();
      this.toolbar.updateState();
      this.statusBar?.update();
    });

    document.addEventListener('selectionchange', () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      if (this.editable.contains(sel.anchorNode)) {
        this.selection.save();
        this.toolbar.updateState();
        this.statusBar?.update();
      }
    });

    // Keyboard Shortcuts
    this.editable.addEventListener('keydown', (e: KeyboardEvent) => {
      // Space tuşu: Satır başlarında, <br> sonrasında veya ardışık boşluklarda
      // tarayıcının boşluğu yutmasını (collapsing) engellemek için &nbsp; (\u00A0) ekle
      if (e.key === ' ' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
          const range = sel.getRangeAt(0);
          let shouldInsertNbsp = false;

          const node = range.startContainer;
          const offset = range.startOffset;

          if (node.nodeType === Node.TEXT_NODE) {
            if (offset === 0) {
              shouldInsertNbsp = true;
            } else {
              const text = node.textContent || '';
              const prevChar = text[offset - 1];
              if (prevChar === ' ' || prevChar === '\u00A0' || prevChar === '\t') {
                shouldInsertNbsp = true;
              }
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (offset === 0) {
              shouldInsertNbsp = true;
            } else {
              const prevNode = node.childNodes[offset - 1];
              if (prevNode && (prevNode.nodeName === 'BR' || prevNode.nodeName === 'P')) {
                shouldInsertNbsp = true;
              } else if (prevNode && prevNode.nodeType === Node.TEXT_NODE) {
                const prevText = prevNode.textContent || '';
                if (prevText.endsWith(' ') || prevText.endsWith('\u00A0')) {
                  shouldInsertNbsp = true;
                }
              }
            }
          }

          if (shouldInsertNbsp) {
            e.preventDefault();
            document.execCommand('insertText', false, '\u00A0');
            this.history.record(false);
            this.onContentChange();
            return;
          }
        }
      }

      // Tab / Shift+Tab Klavye Davranışı:
      // Tablo hücresinde değilse:
      // - Eğer imleç tek bir noktadaysa (collapsed caret):
      //   Tab -> 4 adet bölünemez boşluk (\u00A0\u00A0\u00A0\u00A0) ekler. Paragrafın bütününü sağa kaydırmaz!
      //   Shift+Tab -> İmlecin önündeki 4 boşluğu siler; boşluk yoksa ve blok girintisi varsa girintiyi azaltır.
      // - Eğer bir veya birden fazla blok seçilmişse (seçim alanı varsa):
      //   Word / VS Code standart blok girinti artırma/azaltma (indent/outdent) çalışır.
      if (e.key === 'Tab') {
        const currentCell = this.selection.getCurrentCell();
        if (!currentCell) {
          e.preventDefault();
          const sel = window.getSelection();
          const isCollapsed = !sel || sel.rangeCount === 0 || sel.isCollapsed;

          if (isCollapsed) {
            if (e.shiftKey) {
              if (!this.commands.removeSpacesBeforeCursor(4)) {
                this.execute('outdent');
              }
            } else {
              document.execCommand('insertText', false, '\u00A0\u00A0\u00A0\u00A0');
              this.history.record(true);
              this.onContentChange();
            }
          } else {
            if (e.shiftKey) {
              this.execute('outdent');
            } else {
              this.execute('indent');
            }
          }
          return;
        }
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (isCtrlOrMeta) {
        const key = e.key.toLowerCase();
        if (key === 'b') {
          e.preventDefault();
          this.execute('bold');
        } else if (key === 'i') {
          e.preventDefault();
          this.execute('italic');
        } else if (key === 'u') {
          e.preventDefault();
          this.execute('underline');
        } else if (key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            this.execute('redo');
          } else {
            this.execute('undo');
          }
        } else if (key === 'y') {
          e.preventDefault();
          this.execute('redo');
        } else if (key === 'f') {
          e.preventDefault();
          this.findBox.toggle(true);
        } else if (key === 's') {
          e.preventDefault();
          this.fire('save', { html: this.getData() });
        } else if (key === 'p') {
          e.preventDefault();
          this.print();
        } else if (key === 'enter') {
          e.preventDefault();
          this.execute('insertPageBreak');
        }
      }
    });

    // Source textarea sync
    this.sourceTextarea.addEventListener('input', () => {
      this.setData(this.sourceTextarea.value);
    });
  }

  private onContentChange(): void {
    if (this.pagination) {
      this.pagination.repaginate();
    }

    const text = this.editable.innerText || this.editable.textContent || '';
    if (text.trim() === '') {
      this.editable.classList.add('is-empty');
    } else {
      this.editable.classList.remove('is-empty');
    }

    if (this.targetElement instanceof HTMLTextAreaElement) {
      this.targetElement.value = this.getData();
    }

    this.statusBar?.update();
    this.fire('change', this);
    this.fire('change:data', this.getData());
  }

  private toggleSourceMode(): void {
    this.isSourceMode = !this.isSourceMode;
    if (this.isSourceMode) {
      this.sourceTextarea.value = this.getData();
      this.container.classList.add('is-source-mode');
      this.sourceTextarea.focus();
    } else {
      this.setData(this.sourceTextarea.value);
      this.container.classList.remove('is-source-mode');
      this.editable.focus();
    }
  }

  // =========================================================================
  // CKEDITOR-COMPATIBLE PUBLIC API
  // =========================================================================

  static async create(target: string | HTMLElement, options: EditorConfig = {}): Promise<ResmiYaziEditor> {
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (!el) {
      throw new Error(`[ResmiYaziEditor] Element bulunamadı: ${target}`);
    }
    const editor = new ResmiYaziEditor(el, options);
    return Promise.resolve(editor);
  }

  static createModal(options: ModalOptions): ModalLauncher {
    return new ModalLauncher(options);
  }

  getData(): string {
    return this.pagination ? this.pagination.getData() : this.editable.innerHTML;
  }

  setData(html: string): void {
    if (this.pagination) {
      this.pagination.setData(html);
    } else {
      this.editable.innerHTML = html;
    }
    this.history.clear();
    this.onContentChange();
  }

  getPagination(): PaginationManager {
    return this.pagination;
  }

  execute(command: string, value?: any): void {
    this.commands.execute(command, value);
    this.toolbar.updateState();
    this.onContentChange();
  }

  focus(): void {
    this.editable.focus();
  }

  enableReadOnlyMode(): void {
    this.isReadOnly = true;
    this.editable.contentEditable = 'false';
  }

  disableReadOnlyMode(): void {
    this.isReadOnly = false;
    this.editable.contentEditable = 'true';
  }

  /**
   * Gerçek zamanlı işbirliğini (Real-time collaboration) etkinleştirir.
   */
  enableCollaboration(config: CollaborationConfig = {}): CollaborationManager {
    if (!this.collaboration) {
      this.collaboration = new CollaborationManager(this, config);
      this.collaboration.setPresenceContainer(this.toolbar.getPresenceContainer());
    }
    return this.collaboration;
  }

  getCollaboration(): CollaborationManager | null {
    return this.collaboration;
  }

  /**
   * Word (.docx) olarak dışa aktarır.
   */
  exportWord(filename: string = 'resmi_yazi_belgesi.docx'): void {
    this.execute('exportWord', filename);
  }

  /**
   * PDF olarak dışa aktarır / yazdırır.
   */
  exportPdf(): void {
    this.execute('exportPdf');
  }

  /**
   * .docx, .doc, .html veya .txt dosyası seçtirerek editöre aktarır.
   */
  importFile(): void {
    this.execute('importFile');
  }

  destroy(): void {
    this.collaboration?.disconnect();
    this.removeAllListeners();
    if (this.targetElement instanceof HTMLTextAreaElement) {
      this.targetElement.style.display = '';
    }
    if (ResmiYaziEditor.lastActiveInstance === this) {
      ResmiYaziEditor.lastActiveInstance = null;
    }
    this.container.remove();
    this.state = 'destroyed';
    this.fire('destroy');
  }

  /**
   * Sayfa önizlemeleri (Thumbnails) yan panelini açar/kapatır.
   */
  toggleThumbnails(): void {
    this.isThumbnailsOpen = !this.isThumbnailsOpen;
    if (this.isThumbnailsOpen) {
      this.thumbnailsPanel.classList.add('is-open');
      this.updateThumbnails();
    } else {
      this.thumbnailsPanel.classList.remove('is-open');
    }
  }

  private updateThumbnails(): void {
    if (!this.thumbnailsPanel || !this.isThumbnailsOpen) return;
    this.thumbnailsPanel.innerHTML = '<div class="rye-thumbnails-header">Küçük Resimler</div>';
    const pages = this.editable.querySelectorAll<HTMLElement>('.rye-page');
    pages.forEach((page, index) => {
      const card = document.createElement('div');
      card.className = 'rye-thumbnail-card';
      const rawText = page.innerText || page.textContent || '';
      const textPreview = rawText.trim().substring(0, 50) || `Sayfa ${index + 1}`;
      card.innerHTML = `
        <div class="rye-thumb-page-num">Sayfa ${index + 1}</div>
        <div class="rye-thumb-preview">${textPreview}</div>
      `;
      card.addEventListener('click', () => {
        page.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.thumbnailsPanel.querySelectorAll('.rye-thumbnail-card').forEach(c => c.classList.remove('is-active'));
        card.classList.add('is-active');
      });
      this.thumbnailsPanel.appendChild(card);
    });
  }

  private focusHeader(): void {
    const page = this.editable.querySelector<HTMLElement>('.rye-page');
    if (!page) return;
    let headerEl = page.querySelector<HTMLElement>('.rye-page-header');
    if (!headerEl) {
      headerEl = document.createElement('div');
      headerEl.className = 'rye-page-header';
      headerEl.contentEditable = 'true';
      headerEl.setAttribute('data-placeholder', 'Üstbilgi buraya girilebilir...');
      page.insertBefore(headerEl, page.firstChild);
    }
    headerEl.focus();
    page.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private focusFooter(): void {
    const pages = this.editable.querySelectorAll<HTMLElement>('.rye-page');
    const page = pages[pages.length - 1];
    if (!page) return;
    let footerEl = page.querySelector<HTMLElement>('.rye-page-footer');
    if (!footerEl) {
      footerEl = document.createElement('div');
      footerEl.className = 'rye-page-footer';
      footerEl.contentEditable = 'true';
      footerEl.setAttribute('data-placeholder', 'Altbilgi buraya girilebilir...');
      page.appendChild(footerEl);
    }
    footerEl.focus();
    page.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  private setZoom(zoom: string): void {
    this.currentZoom = zoom;
    if (zoom === 'width' || zoom === '100%') {
      this.editable.style.transform = 'scale(1)';
      this.editable.style.transformOrigin = 'top center';
    } else if (zoom === 'page') {
      this.editable.style.transform = 'scale(0.85)';
      this.editable.style.transformOrigin = 'top center';
    } else {
      const num = parseFloat(zoom.replace('%', '')) / 100;
      if (!isNaN(num)) {
        this.editable.style.transform = `scale(${num})`;
        this.editable.style.transformOrigin = 'top center';
      }
    }
  }

  print(): void {
    PrintManager.print(this);
  }
}
