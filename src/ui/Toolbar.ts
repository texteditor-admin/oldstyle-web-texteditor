import { Icons } from './Icons';
import { CommandRegistry, FONT_SIZE_STEPS } from '../core/Commands';
import { SelectionManager } from '../core/Selection';
import { Ruler } from './Ruler';

export interface ToolbarConfig {
  items?: string[];
}

export interface ToolbarCallbacks {
  onSourceToggle?: () => void;
  onFindToggle?: () => void;
  onThumbnailsToggle?: () => void;
  onHeaderClick?: () => void;
  onFooterClick?: () => void;
  onZoomChange?: (zoom: string) => void;
}

export class Toolbar {
  private element: HTMLElement;
  private commands: CommandRegistry;
  private selection: SelectionManager;
  private ruler!: Ruler;
  private buttons: Map<string, HTMLElement> = new Map();
  private activeDropdown: HTMLElement | null = null;
  private callbacks?: ToolbarCallbacks;
  private presenceContainer!: HTMLElement;

  private fontFamilyLabelEl!: HTMLElement;
  private fontSizeLabelEl!: HTMLElement;
  private zoomLabelEl!: HTMLElement;

  constructor(
    commands: CommandRegistry,
    selection: SelectionManager,
    items?: string[],
    callbacks?: ToolbarCallbacks
  ) {
    this.commands = commands;
    this.selection = selection;
    this.callbacks = callbacks;
    this.ruler = new Ruler(this.commands, this.selection);
    this.element = this.createToolbar();

    // Dışarı tıklandığında açık menüleri kapat
    document.addEventListener('click', (e) => {
      if (this.activeDropdown && !this.activeDropdown.contains(e.target as Node)) {
        this.closeActiveDropdown();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeDropdown) {
        this.closeActiveDropdown();
      }
    });
  }

  getElement(): HTMLElement {
    return this.element;
  }

  getPresenceContainer(): HTMLElement {
    return this.presenceContainer;
  }

  private closeActiveDropdown(): void {
    if (this.activeDropdown) {
      this.activeDropdown.classList.remove('is-open');
      this.activeDropdown = null;
    }
  }

  private toggleDropdown(dropdown: HTMLElement): void {
    if (this.activeDropdown === dropdown) {
      this.closeActiveDropdown();
    } else {
      this.closeActiveDropdown();
      dropdown.classList.add('is-open');
      this.activeDropdown = dropdown;
    }
  }

  /**
   * Ana Panel Oluşturucu (Menü Çubuğu + 1. Çubuk + 2. Çubuk + 3. Çubuk + Cetvel)
   */
  private createToolbar(): HTMLElement {
    const root = document.createElement('div');
    root.className = 'rye-toolbar rye-ribbon';

    // Toolbar üzerinde tıklarken seçimin bozulmasını engelle
    root.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    });

    // 0. ÜST MENÜ ÇUBUĞU (Dosya, Düzenle, Yazıtipi, Paragraf, Biçim, Ekle, Tablo)
    root.appendChild(this.createMenubar());

    // 1. STANDART ARAÇ ÇUBUĞU (Kaydet, Yazdır, Bul, Değiştir, Kes, Kopyala, Yapıştır, Geri Al, Yinele, Resim, Tablo, Köprü, ¶, Kenarlıklar, Tablo Araçları)
    root.appendChild(this.createStandardToolbar());

    // 2. BİÇİMLENDİRME ARAÇ ÇUBUĞU (Font, Punto, B, I, U, S, Ō, x₂, x², A^, Av, Renk, Vurgu, Hizalamalar, Listeler, Girintiler, Biçim Boyacısı)
    root.appendChild(this.createFormattingToolbar());

    // 3. GÖRÜNÜM VE DÜZEN ÇUBUĞU (Thumbnails, Sayfa Genişliği, Yazdır, Üstbilgi, Altbilgi)
    root.appendChild(this.createViewToolbar());

    // 4. YATAY CETVEL (Ruler)
    root.appendChild(this.createHorizontalRuler());

    return root;
  }

  // =========================================================================
  // 0. MENÜ ÇUBUĞU (MENUBAR)
  // =========================================================================
  private createMenubar(): HTMLElement {
    const menubar = document.createElement('div');
    menubar.className = 'rye-menubar';

    const menuDefs = [
      {
        title: 'Dosya',
        items: [
          { label: '📄 Yeni Belge', shortcut: 'Ctrl+N', action: () => { if (confirm('Mevcut belge sıfırlansın mı?')) { this.commands.execute('setData', '<p><br></p>'); } } },
          { label: '🏛️ Resmi Yazı Şablonu (2025 Kılavuzu)', action: () => { if (confirm('2025 Resmi Yazışma Kılavuzuna uygun örnek şablon yüklensin mi?')) { this.commands.execute('insertOfficialTemplate'); } } },
          { label: '📂 Belge Aç / İçe Aktar (.docx, .doc, .html, .txt)', shortcut: 'Ctrl+O', action: () => this.commands.execute('importFile') },
          { type: 'separator' },
          { label: '💾 Kaydet (Word .docx İndir)', shortcut: 'Ctrl+S', action: () => this.commands.execute('exportWord') },
          { label: '🖨️ Yazdır / PDF Olarak Kaydet', shortcut: 'Ctrl+P', action: () => this.commands.execute('exportPdf') },
          { type: 'separator' },
          { label: '💻 HTML Kaynak Kodunu Göster/Gizle', action: () => this.callbacks?.onSourceToggle?.() }
        ]
      },
      {
        title: 'Düzenle',
        items: [
          { label: '↩️ Geri Al', shortcut: 'Ctrl+Z', action: () => this.commands.execute('undo') },
          { label: '↪️ Yinele', shortcut: 'Ctrl+Y', action: () => this.commands.execute('redo') },
          { type: 'separator' },
          { label: '✂️ Kes', shortcut: 'Ctrl+X', action: () => this.commands.execute('cut') },
          { label: '📋 Kopyala', shortcut: 'Ctrl+C', action: () => this.commands.execute('copy') },
          { label: '📄 Yapıştır', shortcut: 'Ctrl+V', action: () => this.commands.execute('paste') },
          { type: 'separator' },
          { label: '🔍 Bul...', shortcut: 'Ctrl+F', action: () => this.callbacks?.onFindToggle?.() },
          { label: '🔁 Değiştir...', shortcut: 'Ctrl+H', action: () => this.callbacks?.onFindToggle?.() },
          { type: 'separator' },
          { label: '🔲 Tümünü Seç', shortcut: 'Ctrl+A', action: () => document.execCommand('selectAll') }
        ]
      },
      {
        title: 'Yazıtipi',
        items: [
          { label: 'K Kalın', shortcut: 'Ctrl+B', action: () => this.commands.execute('bold') },
          { label: 'T İtalik', shortcut: 'Ctrl+I', action: () => this.commands.execute('italic') },
          { label: 'A Altı Çizili', shortcut: 'Ctrl+U', action: () => this.commands.execute('underline') },
          { label: 'S Üstü Çizili', action: () => this.commands.execute('strikethrough') },
          { label: 'Ō Üst Çizgili (Overline)', action: () => this.commands.execute('overline') },
          { label: 'x₂ Alt Simge', action: () => this.commands.execute('subscript') },
          { label: 'x² Üst Simge', action: () => this.commands.execute('superscript') },
          { type: 'separator' },
          { label: 'Büyüt (A▲)', action: () => this.commands.execute('fontSizeIncrease') },
          { label: 'Küçült (A▼)', action: () => this.commands.execute('fontSizeDecrease') },
          { type: 'separator' },
          { label: '🧹 Tüm Biçimlendirmeyi Temizle', action: () => this.commands.execute('removeFormat') }
        ]
      },
      {
        title: 'Paragraf',
        items: [
          { label: '⬅️ Sola Hizala', shortcut: 'Ctrl+L', action: () => this.commands.execute('alignment', 'left') },
          { label: '↔️ Ortala', shortcut: 'Ctrl+E', action: () => this.commands.execute('alignment', 'center') },
          { label: '➡️ Sağa Hizala', shortcut: 'Ctrl+R', action: () => this.commands.execute('alignment', 'right') },
          { label: '↔️ İki Yana Yasla', shortcut: 'Ctrl+J', action: () => this.commands.execute('alignment', 'justify') },
          { type: 'separator' },
          { label: '• Madde İşaretleri', action: () => this.commands.execute('bulletedList') },
          { label: '1. Numaralandırma', action: () => this.commands.execute('numberedList') },
          { label: '☑️ Yapılacaklar Listesi', action: () => this.commands.execute('checkList') },
          { type: 'separator' },
          { label: '⇤ Girintiyi Azalt', action: () => this.commands.execute('outdent') },
          { label: '⇥ Girintiyi Artır', action: () => this.commands.execute('indent') },
          { label: '📏 İlk Satır Girintisi (1.25 cm)', action: () => this.commands.execute('firstLineIndent', '1.25cm') },
          { label: '↕️ Satır Aralığı: 1.15 (Resmi Standart)', action: () => this.commands.execute('lineHeight', '1.15') },
          { label: '📏 Paragraf Arası: Boşluksuz (0pt - Resmi Standart)', action: () => this.commands.execute('paragraphSpacing', '0pt') }
        ]
      },
      {
        title: 'Biçim',
        items: [
          { label: '🖌️ Biçim Boyacısı', action: () => this.commands.execute('formatPainter') },
          { label: 'TÜMÜ BÜYÜK', action: () => this.commands.execute('caseChange', 'uppercase') },
          { label: 'tümü küçük', action: () => this.commands.execute('caseChange', 'lowercase') },
          { label: 'Her Sözcüğü Büyük Yap', action: () => this.commands.execute('caseChange', 'capitalize') },
          { type: 'separator' },
          { label: '🧹 Biçimlendirmeyi Sıfırla', action: () => this.commands.execute('removeFormat') }
        ]
      },
      {
        title: 'Ekle',
        items: [
          { label: '🖼️ Resim Ekle...', action: () => this.commands.execute('insertImage', 'file') },
          { label: '📊 Tablo Ekle (3x3)', action: () => this.commands.execute('insertTable', { rows: 3, cols: 3 }) },
          { label: '➕ Serbest Tablo Ekle...', action: () => this.commands.execute('insertCustomTable') },
          { label: '🔗 Köprü / Bağlantı Ekle...', shortcut: 'Ctrl+K', action: () => this.commands.execute('link') },
          { type: 'separator' },
          { label: '📃 Sayfa Sonu Ekle (A4)', shortcut: 'Ctrl+Enter', action: () => this.commands.execute('insertPageBreak') },
          { label: '➖ Yatay Çizgi Ekle', action: () => this.commands.execute('horizontalLine') },
          { label: '§ Özel Simgeler (§, ₺, Para, Matematik)...', action: () => this.commands.execute('specialCharacters') },
          { type: 'separator' },
          { label: '🔝 Üstbilgi...', action: () => this.callbacks?.onHeaderClick?.() },
          { label: '🔚 Altbilgi...', action: () => this.callbacks?.onFooterClick?.() }
        ]
      },
      {
        title: 'Tablo',
        items: [
          { label: '📊 Tablo Ekle (3x3)', action: () => this.commands.execute('insertTable', { rows: 3, cols: 3 }) },
          { label: '➕ Serbest Tablo Ekle (Özel Satır & Sütun)...', action: () => this.commands.execute('insertCustomTable') },
          { label: '⊞ Kenarlık Aç / Kapat (Kenarlıksız & Kenarlıklı)', action: () => this.commands.execute('tableToggleBorders') },
          { type: 'separator' },
          { label: '⬆️ Üste Satır Ekle', action: () => this.commands.execute('tableAddRowAbove') },
          { label: '⬇️ Alta Satır Ekle', action: () => this.commands.execute('tableAddRowBelow') },
          { label: '⬅️ Sola Sütun Ekle', action: () => this.commands.execute('tableAddColLeft') },
          { label: '➡️ Sağa Sütun Ekle', action: () => this.commands.execute('tableAddColRight') },
          { type: 'separator' },
          { label: '❌ Satır Sil', action: () => this.commands.execute('tableDeleteRow') },
          { label: '❌ Sütun Sil', action: () => this.commands.execute('tableDeleteCol') },
          { label: '🗑️ Tabloyu Sil', action: () => this.commands.execute('tableDelete') },
          { type: 'separator' },
          { label: '🔲 Hücreleri Birleştir', action: () => this.commands.execute('tableMergeCells') },
          { label: '➗ Hücreyi Böl', action: () => this.commands.execute('tableSplitCell') }
        ]
      }
    ];

    menuDefs.forEach(def => {
      const menuEl = document.createElement('div');
      menuEl.className = 'rye-menubar-item rye-dropdown';

      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'rye-menubar-trigger';
      trigger.textContent = def.title;
      trigger.addEventListener('mousedown', (e) => e.preventDefault());

      const panel = document.createElement('div');
      panel.className = 'rye-dropdown-panel rye-menubar-panel';

      def.items.forEach(it => {
        if (it.type === 'separator') {
          const sep = document.createElement('div');
          sep.className = 'rye-menubar-sep';
          panel.appendChild(sep);
        } else if (it.label && it.action) {
          const itemEl = document.createElement('div');
          itemEl.className = 'rye-dropdown-item rye-menubar-subitem';
          itemEl.innerHTML = `
            <span>${it.label}</span>
            ${it.shortcut ? `<span class="rye-shortcut">${it.shortcut}</span>` : ''}
          `;
          itemEl.addEventListener('mousedown', (e) => e.preventDefault());
          itemEl.addEventListener('click', (e) => {
            e.stopPropagation();
            it.action();
            this.closeActiveDropdown();
          });
          panel.appendChild(itemEl);
        }
      });

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown(menuEl);
      });

      menuEl.appendChild(trigger);
      menuEl.appendChild(panel);
      menubar.appendChild(menuEl);
    });

    return menubar;
  }

  // =========================================================================
  // 1. STANDART ARAÇ ÇUBUĞU (ROW 1)
  // =========================================================================
  private createStandardToolbar(): HTMLElement {
    const row = document.createElement('div');
    row.className = 'rye-toolbar-row rye-row-standard';

    // 1.1 Dosya & Arama Araçları
    row.appendChild(this.createToolBtn('save', Icons.save, 'Kaydet (Word .docx İndir) (Ctrl+S)', () => this.commands.execute('exportWord')));
    row.appendChild(this.createToolBtn('print', Icons.print, 'Yazdır / PDF Olarak Kaydet (Ctrl+P)', () => this.commands.execute('exportPdf')));
    row.appendChild(this.createToolBtn('find', Icons.find, 'Bul (Ctrl+F)', () => this.callbacks?.onFindToggle?.()));
    row.appendChild(this.createToolBtn('replace', Icons.replace, 'Bul ve Değiştir (Ctrl+H)', () => this.callbacks?.onFindToggle?.()));

    row.appendChild(this.createSeparator());

    // 1.2 Pano Araçları
    row.appendChild(this.createToolBtn('cut', Icons.cut, 'Kes (Ctrl+X)', () => this.commands.execute('cut')));
    row.appendChild(this.createToolBtn('copy', Icons.copy, 'Kopyala (Ctrl+C)', () => this.commands.execute('copy')));
    row.appendChild(this.createToolBtn('paste', Icons.paste, 'Yapıştır (Ctrl+V)', () => this.commands.execute('paste')));

    row.appendChild(this.createSeparator());

    // 1.3 Geri / İleri
    row.appendChild(this.createToolBtn('undo', Icons.undo, 'Geri Al (Ctrl+Z)', () => this.commands.execute('undo')));
    row.appendChild(this.createToolBtn('redo', Icons.redo, 'Yinele (Ctrl+Y)', () => this.commands.execute('redo')));

    row.appendChild(this.createSeparator());

    // 1.4 Ekleme Araçları (Resim, Tablo, Köprü)
    row.appendChild(this.createImageDropdown());
    row.appendChild(this.createTableDropdown());
    row.appendChild(this.createToolBtn('link', Icons.link, 'Köprü / Bağlantı Ekle (Ctrl+K)', () => this.commands.execute('link')));

    row.appendChild(this.createSeparator());

    // 1.5 Paragraf İmleri (¶)
    row.appendChild(this.createToolBtn('pilcrow', Icons.pilcrow, 'Paragraf İmlerini Göster/Gizle (¶)', () => {
      this.commands.execute('pilcrow');
      this.updateState();
    }));

    row.appendChild(this.createSeparator());

    // 1.6 Kenarlık Araçları Kutusu (6 adet noktalı çerçeve ikonu)
    const borderBox = document.createElement('div');
    borderBox.className = 'rye-toolbar-box';
    borderBox.title = 'Kenarlık Seçenekleri';

    borderBox.appendChild(this.createToolBtn('borderBottom', Icons.borderBottom, 'Alt Kenarlık', () => this.commands.execute('borderBottom')));
    borderBox.appendChild(this.createToolBtn('borderTop', Icons.borderTop, 'Üst Kenarlık', () => this.commands.execute('borderTop')));
    borderBox.appendChild(this.createToolBtn('borderLeft', Icons.borderLeft, 'Sol Kenarlık', () => this.commands.execute('borderLeft')));
    borderBox.appendChild(this.createToolBtn('borderRight', Icons.borderRight, 'Sağ Kenarlık', () => this.commands.execute('borderRight')));
    borderBox.appendChild(this.createToolBtn('borderNone', Icons.borderNone, 'Kenarlık Yok', () => this.commands.execute('borderNone')));
    borderBox.appendChild(this.createToolBtn('borderAll', Icons.borderAll, 'Tüm Kenarlıklar / Kutu', () => this.commands.execute('borderAll')));

    row.appendChild(borderBox);

    row.appendChild(this.createSeparator());

    // 1.7 Tablo Yönetim Araçları Kutusu (Tablo sütun/satır ekle/sil, birleştir, böl)
    const tableBox = document.createElement('div');
    tableBox.className = 'rye-toolbar-box';
    tableBox.title = 'Tablo Araçları';

    tableBox.appendChild(this.createToolBtn('colLeft', Icons.colLeft, 'Sola Sütun Ekle', () => this.commands.execute('tableAddColLeft')));
    tableBox.appendChild(this.createToolBtn('colRight', Icons.colRight, 'Sağa Sütun Ekle', () => this.commands.execute('tableAddColRight')));
    tableBox.appendChild(this.createToolBtn('rowAbove', Icons.rowAbove, 'Üste Satır Ekle', () => this.commands.execute('tableAddRowAbove')));
    tableBox.appendChild(this.createToolBtn('rowBelow', Icons.rowBelow, 'Alta Satır Ekle', () => this.commands.execute('tableAddRowBelow')));
    tableBox.appendChild(this.createToolBtn('deleteCol', Icons.deleteCol, 'Sütun Sil', () => this.commands.execute('tableDeleteCol')));
    tableBox.appendChild(this.createToolBtn('deleteRow', Icons.deleteRow, 'Satır Sil', () => this.commands.execute('tableDeleteRow')));
    tableBox.appendChild(this.createToolBtn('mergeCells', Icons.mergeCells, 'Hücreleri Birleştir', () => this.commands.execute('tableMergeCells')));
    tableBox.appendChild(this.createToolBtn('splitCell', Icons.splitCell, 'Hücreyi Böl', () => this.commands.execute('tableSplitCell')));
    tableBox.appendChild(this.createToolBtn('deleteTable', Icons.deleteTable, 'Tabloyu Sil', () => this.commands.execute('tableDelete')));

    row.appendChild(tableBox);

    return row;
  }

  // =========================================================================
  // 2. BİÇİMLENDİRME ARAÇ ÇUBUĞU (ROW 2)
  // =========================================================================
  private createFormattingToolbar(): HTMLElement {
    const row = document.createElement('div');
    row.className = 'rye-toolbar-row rye-row-format';

    // 2.1 Yazı Tipi & Boyutu Açılır Kutuları
    row.appendChild(this.createFontFamilyDropdown());
    row.appendChild(this.createFontSizeDropdown());

    row.appendChild(this.createSeparator());

    // 2.2 Metin Stilleri (B, I, U, S, Ō, x₂, x²)
    row.appendChild(this.createToolBtn('bold', Icons.bold, 'Kalın (Ctrl+B)', () => {
      this.commands.execute('bold');
      this.updateState();
    }));
    row.appendChild(this.createToolBtn('italic', Icons.italic, 'İtalik (Ctrl+I)', () => {
      this.commands.execute('italic');
      this.updateState();
    }));
    row.appendChild(this.createToolBtn('underline', Icons.underline, 'Altı Çizili (Ctrl+U)', () => {
      this.commands.execute('underline');
      this.updateState();
    }));
    row.appendChild(this.createToolBtn('strikethrough', Icons.strikethrough, 'Üstü Çizili (S)', () => {
      this.commands.execute('strikethrough');
      this.updateState();
    }));
    row.appendChild(this.createToolBtn('overline', Icons.overline, 'Üst Çizgili (Ō)', () => {
      this.commands.execute('overline');
      this.updateState();
    }));
    row.appendChild(this.createToolBtn('subscript', Icons.subscript, 'Alt Simge (x₂)', () => {
      this.commands.execute('subscript');
      this.updateState();
    }));
    row.appendChild(this.createToolBtn('superscript', Icons.superscript, 'Üst Simge (x²)', () => {
      this.commands.execute('superscript');
      this.updateState();
    }));

    row.appendChild(this.createSeparator());

    // 2.3 Punto Büyüt / Küçült (A▲ / A▼)
    row.appendChild(this.createToolBtn('fontSizeIncrease', Icons.fontSizeIncrease, 'Yazı Tipini Büyüt (A▲)', () => {
      this.commands.execute('fontSizeIncrease');
      this.updateState();
    }));
    row.appendChild(this.createToolBtn('fontSizeDecrease', Icons.fontSizeDecrease, 'Yazı Tipini Küçült (A▼)', () => {
      this.commands.execute('fontSizeDecrease');
      this.updateState();
    }));

    row.appendChild(this.createSeparator());

    // 2.4 Renk Paletleri (A Yazı Rengi & Vurgu Kalemi)
    row.appendChild(this.createColorDropdown('fontColor', 'Yazı Tipi Rengi', false));
    row.appendChild(this.createColorDropdown('highlight', 'Metin Vurgu Rengi', true));

    row.appendChild(this.createSeparator());

    // 2.5 Hizalama Butonları (Sola, Ortala, Sağa, İki Yana)
    row.appendChild(this.createToolBtn('alignLeft', Icons.alignLeft, 'Sola Hizala (Ctrl+L)', () => {
      this.commands.execute('alignment', 'left');
      this.updateState();
    }));
    row.appendChild(this.createToolBtn('alignCenter', Icons.alignCenter, 'Ortala (Ctrl+E)', () => {
      this.commands.execute('alignment', 'center');
      this.updateState();
    }));
    row.appendChild(this.createToolBtn('alignRight', Icons.alignRight, 'Sağa Hizala (Ctrl+R)', () => {
      this.commands.execute('alignment', 'right');
      this.updateState();
    }));
    row.appendChild(this.createToolBtn('alignJustify', Icons.alignJustify, 'İki Yana Yasla (Ctrl+J)', () => {
      this.commands.execute('alignment', 'justify');
      this.updateState();
    }));

    row.appendChild(this.createSeparator());

    // 2.6 Listeler (Madde İmleri & Numaralandırma)
    row.appendChild(this.createToolBtn('bulletList', Icons.bulletList, 'Madde İşaretleri', () => {
      this.commands.execute('bulletedList');
      this.updateState();
    }));
    row.appendChild(this.createToolBtn('numberedList', Icons.numberedList, 'Numaralandırma', () => {
      this.commands.execute('numberedList');
      this.updateState();
    }));

    row.appendChild(this.createSeparator());

    // 2.7 Girintiler (Azalt & Artır)
    row.appendChild(this.createToolBtn('outdent', Icons.outdent, 'Girintiyi Azalt', () => {
      this.commands.execute('outdent');
      this.updateState();
    }));
    row.appendChild(this.createToolBtn('indent', Icons.indent, 'Girintiyi Artır', () => {
      this.commands.execute('indent');
      this.updateState();
    }));

    row.appendChild(this.createSeparator());

    // 2.8 Biçim Boyacısı
    row.appendChild(this.createToolBtn('formatPainter', Icons.formatPainter, 'Biçim Boyacısı (Biçimi Kopyala & Uygula)', () => {
      this.commands.execute('formatPainter');
      this.updateState();
    }));

    return row;
  }

  // =========================================================================
  // 3. GÖRÜNÜM VE DÜZEN ÇUBUĞU (ROW 3)
  // =========================================================================
  private createViewToolbar(): HTMLElement {
    const row = document.createElement('div');
    row.className = 'rye-toolbar-row rye-row-view';

    // 3.1 Thumbnails (Küçük Resimler Yan Paneli)
    const thumbBtn = document.createElement('button');
    thumbBtn.type = 'button';
    thumbBtn.className = 'rye-btn-text';
    thumbBtn.title = 'Küçük Resimler (Sayfa Gezgini)';
    thumbBtn.innerHTML = `${Icons.thumbnails} <span>Thumbnails</span>`;
    thumbBtn.addEventListener('mousedown', (e) => e.preventDefault());
    thumbBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.callbacks?.onThumbnailsToggle?.();
    });
    row.appendChild(thumbBtn);

    // 3.2 Sayfa Genişliği / Yakınlaştırma (Zoom) Dropdown
    row.appendChild(this.createZoomDropdown());

    // 3.3 Yazdır... Butonu
    const printBtn = document.createElement('button');
    printBtn.type = 'button';
    printBtn.className = 'rye-btn-text';
    printBtn.title = 'Yazdır... (Baskı Önizleme & PDF)';
    printBtn.innerHTML = `<span>Yazdır...</span>`;
    printBtn.addEventListener('mousedown', (e) => e.preventDefault());
    printBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.commands.execute('exportPdf');
    });
    row.appendChild(printBtn);

    row.appendChild(this.createSeparator());

    // 3.4 Üstbilgi... ve Altbilgi... Butonları
    const headerBtn = document.createElement('button');
    headerBtn.type = 'button';
    headerBtn.className = 'rye-btn-text';
    headerBtn.title = 'Sayfa Üstbilgisini Düzenle';
    headerBtn.innerHTML = `${Icons.header} <span>Üstbilgi...</span>`;
    headerBtn.addEventListener('mousedown', (e) => e.preventDefault());
    headerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.callbacks?.onHeaderClick?.();
    });
    row.appendChild(headerBtn);

    const footerBtn = document.createElement('button');
    footerBtn.type = 'button';
    footerBtn.className = 'rye-btn-text';
    footerBtn.title = 'Sayfa Altbilgisini Düzenle';
    footerBtn.innerHTML = `${Icons.footer} <span>Altbilgi...</span>`;
    footerBtn.addEventListener('mousedown', (e) => e.preventDefault());
    footerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.callbacks?.onFooterClick?.();
    });
    row.appendChild(footerBtn);

    row.appendChild(this.createSeparator());

    // 3.5 Hızlı Paragraf Boşluğu ve Girinti Seçicileri (Test uyumluluğu için mevcut)
    row.appendChild(this.createParagraphSpacingDropdown());
    row.appendChild(this.createFirstLineIndentDropdown());
    row.appendChild(this.createLineSpacingDropdown());

    // Boşluk doldurucu
    const spacer = document.createElement('div');
    spacer.style.flex = '1';
    row.appendChild(spacer);

    // Canlı İşbirliği Göstergesi
    this.presenceContainer = document.createElement('div');
    this.presenceContainer.className = 'rye-toolbar-presence';
    row.appendChild(this.presenceContainer);

    return row;
  }

  getRuler(): Ruler {
    return this.ruler;
  }

  // =========================================================================
  // 4. YATAY CETVEL (HORIZONTAL RULER)
  // =========================================================================
  private createHorizontalRuler(): HTMLElement {
    return this.ruler.getElement();
  }

  // =========================================================================
  // YARDIMCI BUTON & AYRAÇ METOTLARI
  // =========================================================================

  private createToolBtn(name: string, iconHtml: string, title: string, onClick: () => void): HTMLElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rye-btn';
    btn.title = title;
    btn.innerHTML = iconHtml;

    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      onClick();
    });

    this.buttons.set(name, btn);
    return btn;
  }

  private createSeparator(): HTMLElement {
    const sep = document.createElement('div');
    sep.className = 'rye-separator';
    return sep;
  }

  // =========================================================================
  // DROPDOWNLAR (Font, Punto, Zoom, Renk, Satır, Paragraf, Tablo, Resim)
  // =========================================================================

  private createFontFamilyDropdown(): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'rye-dropdown rye-combobox rye-font-combobox';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'rye-combobox-trigger';
    trigger.title = 'Yazı Tipi';
    trigger.innerHTML = `<span class="rye-label">Times New Roman</span> <span class="rye-arrow">${Icons.chevronDown}</span>`;
    this.fontFamilyLabelEl = trigger.querySelector('.rye-label') as HTMLElement;

    trigger.addEventListener('mousedown', (e) => e.preventDefault());

    const panel = document.createElement('div');
    panel.className = 'rye-dropdown-panel rye-scroll-panel';

    const fonts = [
      { name: 'Times New Roman', font: 'Times New Roman, Times, serif' },
      { name: 'Arial', font: 'Arial, Helvetica, sans-serif' },
      { name: 'Calibri', font: 'Calibri, Candara, Segoe, sans-serif' },
      { name: 'Aptos (Gövde)', font: 'Aptos, "Segoe UI", sans-serif' },
      { name: 'Georgia', font: 'Georgia, serif' },
      { name: 'Garamond', font: 'Garamond, serif' },
      { name: 'Courier New', font: '"Courier New", Courier, monospace' },
      { name: 'Verdana', font: 'Verdana, Geneva, sans-serif' }
    ];

    fonts.forEach(f => {
      const itemEl = document.createElement('div');
      itemEl.className = 'rye-dropdown-item';
      itemEl.style.fontFamily = f.font;
      itemEl.innerText = f.name;
      itemEl.setAttribute('data-value', f.font);
      itemEl.addEventListener('mousedown', (e) => e.preventDefault());
      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.commands.execute('fontFamily', f.font);
        if (this.fontFamilyLabelEl) this.fontFamilyLabelEl.textContent = f.name;
        this.closeActiveDropdown();
      });
      panel.appendChild(itemEl);
    });

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(dropdown);
    });

    dropdown.appendChild(trigger);
    dropdown.appendChild(panel);
    return dropdown;
  }

  private createFontSizeDropdown(): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'rye-dropdown rye-combobox rye-size-combobox';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'rye-combobox-trigger';
    trigger.title = 'Yazı Boyutu (Punto)';
    trigger.innerHTML = `<span class="rye-label">12</span> <span class="rye-arrow">${Icons.chevronDown}</span>`;
    this.fontSizeLabelEl = trigger.querySelector('.rye-label') as HTMLElement;

    trigger.addEventListener('mousedown', (e) => e.preventDefault());

    const panel = document.createElement('div');
    panel.className = 'rye-dropdown-panel rye-scroll-panel';
    panel.style.minWidth = '70px';

    FONT_SIZE_STEPS.forEach(pt => {
      const cleanPt = pt.replace('pt', '');
      const itemEl = document.createElement('div');
      itemEl.className = 'rye-dropdown-item';
      itemEl.innerText = cleanPt;
      itemEl.setAttribute('data-value', pt);
      itemEl.addEventListener('mousedown', (e) => e.preventDefault());
      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.commands.execute('fontSize', pt);
        if (this.fontSizeLabelEl) this.fontSizeLabelEl.textContent = cleanPt;
        this.closeActiveDropdown();
      });
      panel.appendChild(itemEl);
    });

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(dropdown);
    });

    dropdown.appendChild(trigger);
    dropdown.appendChild(panel);
    return dropdown;
  }

  private createZoomDropdown(): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'rye-dropdown rye-combobox rye-zoom-combobox';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'rye-combobox-trigger';
    trigger.title = 'Görünüm Boyutu / Yakınlaştırma';
    trigger.innerHTML = `<span class="rye-label">Sayfa Genişliği</span> <span class="rye-arrow">${Icons.chevronDown}</span>`;
    this.zoomLabelEl = trigger.querySelector('.rye-label') as HTMLElement;

    trigger.addEventListener('mousedown', (e) => e.preventDefault());

    const panel = document.createElement('div');
    panel.className = 'rye-dropdown-panel';
    panel.style.minWidth = '140px';

    const zoomOptions = [
      { label: 'Sayfa Genişliği', val: 'width' },
      { label: 'Tam Sayfa (%100)', val: '100%' },
      { label: '%50', val: '50%' },
      { label: '%75', val: '75%' },
      { label: '%100', val: '100%' },
      { label: '%125', val: '125%' },
      { label: '%150', val: '150%' },
      { label: '%200', val: '200%' }
    ];

    zoomOptions.forEach(opt => {
      const itemEl = document.createElement('div');
      itemEl.className = 'rye-dropdown-item';
      itemEl.innerText = opt.label;
      itemEl.addEventListener('mousedown', (e) => e.preventDefault());
      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.zoomLabelEl) this.zoomLabelEl.textContent = opt.label;
        this.callbacks?.onZoomChange?.(opt.val);
        this.closeActiveDropdown();
      });
      panel.appendChild(itemEl);
    });

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(dropdown);
    });

    dropdown.appendChild(trigger);
    dropdown.appendChild(panel);
    return dropdown;
  }

  private createColorDropdown(type: 'fontColor' | 'highlight', title: string, isHighlight: boolean): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'rye-dropdown';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'rye-btn';
    trigger.title = title;
    trigger.innerHTML = isHighlight ? Icons.highlight : Icons.fontColor;

    trigger.addEventListener('mousedown', (e) => e.preventDefault());

    const panel = document.createElement('div');
    panel.className = 'rye-dropdown-panel rye-color-panel';

    const titleEl = document.createElement('div');
    titleEl.style.fontSize = '11px';
    titleEl.style.color = '#64748b';
    titleEl.style.marginBottom = '6px';
    titleEl.style.fontWeight = '600';
    titleEl.innerText = title;
    panel.appendChild(titleEl);

    const palette = document.createElement('div');
    palette.className = 'rye-color-palette';

    const colors = [
      '#000000', '#475569', '#dc2626', '#ea580c', '#ca8a04',
      '#16a34a', '#0284c7', '#2563eb', '#7c3aed', '#db2777',
      '#ffffff', '#cbd5e1', '#fca5a5', '#fed7aa', '#fef08a',
      '#bbf7d0', '#bae6fd', '#bfdbfe', '#ddd6fe', '#fbcfe8'
    ];

    colors.forEach(c => {
      const swatch = document.createElement('div');
      swatch.className = 'rye-color-swatch';
      swatch.style.backgroundColor = c;
      swatch.title = c;
      swatch.addEventListener('mousedown', (e) => e.preventDefault());
      swatch.addEventListener('click', () => {
        if (isHighlight) {
          this.commands.execute('fontBackgroundColor', c);
        } else {
          this.commands.execute('fontColor', c);
        }
        this.closeActiveDropdown();
      });
      palette.appendChild(swatch);
    });

    const reset = document.createElement('div');
    reset.className = 'rye-dropdown-item';
    reset.style.marginTop = '4px';
    reset.innerText = isHighlight ? 'Vurguyu Kaldır' : 'Otomatik (Siyah)';
    reset.addEventListener('mousedown', (e) => e.preventDefault());
    reset.addEventListener('click', () => {
      if (isHighlight) {
        this.commands.execute('fontBackgroundColor', '');
      } else {
        this.commands.execute('fontColor', '');
      }
      this.closeActiveDropdown();
    });

    panel.appendChild(palette);
    panel.appendChild(reset);

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(dropdown);
    });

    dropdown.appendChild(trigger);
    dropdown.appendChild(panel);
    return dropdown;
  }

  private createLineSpacingDropdown(): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'rye-dropdown rye-combobox';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'rye-btn';
    trigger.title = 'Satır Aralığı (1.0, 1.15, 1.5, 2.0)';
    trigger.innerHTML = `${Icons.lineSpacing}<span class="rye-micro-arrow">${Icons.chevronDown}</span>`;

    trigger.addEventListener('mousedown', (e) => e.preventDefault());

    const panel = document.createElement('div');
    panel.className = 'rye-dropdown-panel';
    panel.style.minWidth = '160px';

    const options = [
      { label: 'Tekli (1.0)', val: '1' },
      { label: '1.15 (Resmi Standart)', val: '1.15' },
      { label: '1.5', val: '1.5' },
      { label: 'Çift (2.0)', val: '2' },
      { label: '2.5', val: '2.5' }
    ];

    options.forEach(opt => {
      const el = document.createElement('div');
      el.className = 'rye-dropdown-item';
      el.innerText = opt.label;
      el.addEventListener('mousedown', (e) => e.preventDefault());
      el.addEventListener('click', () => {
        this.commands.execute('lineHeight', opt.val);
        this.closeActiveDropdown();
      });
      panel.appendChild(el);
    });

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(dropdown);
    });

    dropdown.appendChild(trigger);
    dropdown.appendChild(panel);
    return dropdown;
  }

  private createParagraphSpacingDropdown(): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'rye-dropdown rye-combobox';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'rye-combobox-trigger';
    trigger.title = 'Paragraf Sonrası Boşluk';
    trigger.innerHTML = `<span class="rye-label">0pt Boşluk</span> <span class="rye-arrow">${Icons.chevronDown}</span>`;

    trigger.addEventListener('mousedown', (e) => e.preventDefault());

    const panel = document.createElement('div');
    panel.className = 'rye-dropdown-panel';
    panel.style.minWidth = '150px';

    const options = [
      { label: 'Boşluk Yok (0pt - Resmi Standart)', val: '0pt' },
      { label: 'Az (6pt)', val: '6pt' },
      { label: 'Standart (12pt)', val: '12pt' },
      { label: 'Fazla (18pt)', val: '18pt' }
    ];

    options.forEach(opt => {
      const el = document.createElement('div');
      el.className = 'rye-dropdown-item';
      el.innerText = opt.label;
      el.addEventListener('mousedown', (e) => e.preventDefault());
      el.addEventListener('click', () => {
        this.commands.execute('paragraphSpacing', opt.val);
        const lbl = trigger.querySelector('.rye-label');
        if (lbl) lbl.textContent = opt.label;
        this.closeActiveDropdown();
      });
      panel.appendChild(el);
    });

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(dropdown);
    });

    dropdown.appendChild(trigger);
    dropdown.appendChild(panel);
    return dropdown;
  }

  private createFirstLineIndentDropdown(): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'rye-dropdown rye-combobox';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'rye-combobox-trigger';
    trigger.title = 'İlk Satır Girintisi';
    trigger.innerHTML = `<span class="rye-label">1.25cm Girinti</span> <span class="rye-arrow">${Icons.chevronDown}</span>`;

    trigger.addEventListener('mousedown', (e) => e.preventDefault());

    const panel = document.createElement('div');
    panel.className = 'rye-dropdown-panel';
    panel.style.minWidth = '170px';

    const options = [
      { label: 'Girinti Yok (0cm)', val: '0cm' },
      { label: '1.25 cm (Resmi Standart)', val: '1.25cm' },
      { label: '1.5 cm', val: '1.5cm' },
      { label: '2.0 cm', val: '2cm' }
    ];

    options.forEach(opt => {
      const el = document.createElement('div');
      el.className = 'rye-dropdown-item';
      el.innerText = opt.label;
      el.addEventListener('mousedown', (e) => e.preventDefault());
      el.addEventListener('click', () => {
        this.commands.execute('firstLineIndent', opt.val);
        const lbl = trigger.querySelector('.rye-label');
        if (lbl) lbl.textContent = opt.label;
        this.closeActiveDropdown();
      });
      panel.appendChild(el);
    });

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(dropdown);
    });

    dropdown.appendChild(trigger);
    dropdown.appendChild(panel);
    return dropdown;
  }

  private createTableDropdown(): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'rye-dropdown';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'rye-btn';
    trigger.title = 'Tablo Ekle';
    trigger.innerHTML = Icons.table;

    trigger.addEventListener('mousedown', (e) => e.preventDefault());

    const panel = document.createElement('div');
    panel.className = 'rye-dropdown-panel rye-table-panel';

    const label = document.createElement('div');
    label.className = 'rye-table-picker-label';
    label.innerText = 'Tablo Boyutu Seçin (1x1)';
    panel.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'rye-table-grid';

    const rows = 8;
    const cols = 8;
    const cells: HTMLElement[][] = [];

    for (let r = 0; r < rows; r++) {
      cells[r] = [];
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'rye-table-cell';
        cell.dataset.row = String(r + 1);
        cell.dataset.col = String(c + 1);

        cell.addEventListener('mouseover', () => {
          label.innerText = `${r + 1} x ${c + 1} Tablo`;
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
              if (i <= r && j <= c) {
                cells[i][j].classList.add('is-highlighted');
              } else {
                cells[i][j].classList.remove('is-highlighted');
              }
            }
          }
        });

        cell.addEventListener('mousedown', (e) => e.preventDefault());
        cell.addEventListener('click', () => {
          this.commands.execute('insertTable', { rows: r + 1, cols: c + 1 });
          this.closeActiveDropdown();
        });

        grid.appendChild(cell);
        cells[r][c] = cell;
      }
    }

    panel.appendChild(grid);

    // Serbest / Özel Tablo Ekleme Bölümü
    const customSection = document.createElement('div');
    customSection.className = 'rye-custom-table-picker-section';
    customSection.style.marginTop = '10px';
    customSection.style.paddingTop = '8px';
    customSection.style.borderTop = '1px solid #e2e8f0';

    customSection.innerHTML = `
      <div style="font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">
        Serbest Tablo Ekle
      </div>
      <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 8px;">
        <label style="font-size: 11px; color: #334155; display: flex; align-items: center; gap: 2px;">
          Satır: <input type="number" class="rye-custom-rows" value="3" min="1" max="100" style="width: 44px; padding: 2px 4px; font-size: 11px; border: 1px solid #cbd5e1; border-radius: 4px;">
        </label>
        <label style="font-size: 11px; color: #334155; display: flex; align-items: center; gap: 2px;">
          Sütun: <input type="number" class="rye-custom-cols" value="3" min="1" max="50" style="width: 44px; padding: 2px 4px; font-size: 11px; border: 1px solid #cbd5e1; border-radius: 4px;">
        </label>
      </div>
      <div style="margin-bottom: 8px;">
        <label style="font-size: 11px; color: #334155; display: flex; align-items: center; gap: 4px; cursor: pointer;">
          <input type="checkbox" class="rye-custom-borderless" checked>
          <span>Kenarlıksız (Resmi Yazı)</span>
        </label>
      </div>
      <button type="button" class="rye-btn-insert-custom" style="width: 100%; padding: 5px; background: #2563eb; color: #ffffff; border: none; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;">
        ➕ Özel Tablo Ekle
      </button>
    `;

    const insertCustomBtn = customSection.querySelector('.rye-btn-insert-custom') as HTMLButtonElement;
    const rowsInput = customSection.querySelector('.rye-custom-rows') as HTMLInputElement;
    const colsInput = customSection.querySelector('.rye-custom-cols') as HTMLInputElement;
    const borderlessInput = customSection.querySelector('.rye-custom-borderless') as HTMLInputElement;

    insertCustomBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const r = Math.max(1, parseInt(rowsInput.value, 10) || 3);
      const c = Math.max(1, parseInt(colsInput.value, 10) || 3);
      const isBorderless = borderlessInput.checked;
      this.commands.execute('insertTable', { rows: r, cols: c, borderless: isBorderless });
      this.closeActiveDropdown();
    });

    panel.appendChild(customSection);

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(dropdown);
    });

    dropdown.appendChild(trigger);
    dropdown.appendChild(panel);
    return dropdown;
  }

  private createImageDropdown(): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'rye-dropdown';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'rye-btn';
    trigger.title = 'Resim Ekle';
    trigger.innerHTML = Icons.image;

    trigger.addEventListener('mousedown', (e) => e.preventDefault());

    const panel = document.createElement('div');
    panel.className = 'rye-dropdown-panel';
    panel.style.minWidth = '180px';

    const items = [
      {
        label: '📁 Bilgisayardan Yükle',
        action: () => this.commands.execute('insertImage', 'file')
      },
      {
        label: '🔗 URL ile Ekle',
        action: () => this.commands.execute('insertImage', 'url')
      }
    ];

    items.forEach(it => {
      const itemEl = document.createElement('div');
      itemEl.className = 'rye-dropdown-item';
      itemEl.innerText = it.label;
      itemEl.addEventListener('mousedown', (e) => e.preventDefault());
      itemEl.addEventListener('click', () => {
        it.action();
        this.closeActiveDropdown();
      });
      panel.appendChild(itemEl);
    });

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(dropdown);
    });

    dropdown.appendChild(trigger);
    dropdown.appendChild(panel);
    return dropdown;
  }

  // =========================================================================
  // GÜNCELLEME VE AKTİF DURUM YÖNETİMİ
  // =========================================================================

  updateState(): void {
    // 1. Standart biçim butonları
    ['bold', 'italic', 'underline', 'strikethrough', 'overline', 'subscript', 'superscript', 'formatPainter', 'pilcrow'].forEach(cmd => {
      const btn = this.buttons.get(cmd);
      if (btn) {
        if (this.commands.queryCommandState(cmd)) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      }
    });

    // 2. Hizalama butonları
    const align = this.commands.queryBlockValue('textAlign') || 'left';
    const alignMap: Record<string, string> = {
      left: 'alignLeft',
      center: 'alignCenter',
      right: 'alignRight',
      justify: 'alignJustify'
    };

    ['alignLeft', 'alignCenter', 'alignRight', 'alignJustify'].forEach(btnName => {
      const btn = this.buttons.get(btnName);
      if (btn) {
        if (alignMap[align] === btnName) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      }
    });

    // 3. Yazı Boyutu etiketi & Listbox seçimi
    const currentSize = this.commands.getCurrentInlineStyle('fontSize');
    const sizeNum = currentSize ? currentSize.replace('pt', '').trim() : '12';
    if (this.fontSizeLabelEl) {
      this.fontSizeLabelEl.textContent = sizeNum;
    }
    const sizePanel = this.element.querySelector('.rye-size-combobox .rye-dropdown-panel');
    if (sizePanel) {
      sizePanel.querySelectorAll('.rye-dropdown-item').forEach(el => {
        if (el.textContent?.trim() === sizeNum) {
          el.classList.add('is-selected');
        } else {
          el.classList.remove('is-selected');
        }
      });
    }

    // 4. Yazı Tipi etiketi & Listbox seçimi
    const currentFont = this.commands.getCurrentInlineStyle('fontFamily');
    const fontName = currentFont ? currentFont.replace(/['"]/g, '').split(',')[0].trim() : 'Times New Roman';
    if (this.fontFamilyLabelEl) {
      this.fontFamilyLabelEl.textContent = fontName;
    }
    const fontPanel = this.element.querySelector('.rye-font-combobox .rye-dropdown-panel');
    if (fontPanel) {
      fontPanel.querySelectorAll('.rye-dropdown-item').forEach(el => {
        const itemVal = (el as HTMLElement).style.fontFamily || el.textContent?.trim() || '';
        if (itemVal.toLowerCase().includes(fontName.toLowerCase()) || el.textContent?.trim() === fontName) {
          el.classList.add('is-selected');
        } else {
          el.classList.remove('is-selected');
        }
      });
    }

    // 5. Yatay Cetvel senkronizasyonu
    this.ruler?.updateFromSelection();
  }
}
