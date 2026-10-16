import { SelectionManager } from './Selection';
import { HistoryManager } from './History';
import { ImagePlugin } from '../plugins/ImagePlugin';
import { SpecialCharsPlugin } from '../plugins/SpecialCharsPlugin';
import { TablePlugin } from '../plugins/TablePlugin';
import { ExportPlugin } from '../plugins/ExportPlugin';
import { ImportPlugin } from '../plugins/ImportPlugin';
import { PrintManager } from '../utils/PrintManager';

export interface CommandContext {
  editable: HTMLElement;
  selection: SelectionManager;
  history: HistoryManager;
  container: HTMLElement;
  getData?: () => string;
  onHtmlLoaded?: (html: string) => void;
  onStateChange?: () => void;
}

export interface StoredFormat {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  fontSize?: string;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
}

export const FONT_SIZE_STEPS = [
  '8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '20pt', '22pt', '24pt', '28pt', '32pt', '36pt', '48pt', '72pt'
];

export class CommandRegistry {
  private ctx: CommandContext;
  private imagePlugin: ImagePlugin;
  private specialCharsPlugin: SpecialCharsPlugin;
  private tablePlugin: TablePlugin;
  private importPlugin: ImportPlugin;

  constructor(ctx: CommandContext) {
    this.ctx = ctx;
    this.imagePlugin = new ImagePlugin(ctx);
    this.specialCharsPlugin = new SpecialCharsPlugin(ctx);
    this.tablePlugin = new TablePlugin(ctx);
    this.importPlugin = new ImportPlugin((html) => {
      if (ctx.onHtmlLoaded) {
        ctx.onHtmlLoaded(html);
      } else {
        ctx.editable.innerHTML = html;
        ctx.history.record(true);
      }
    });

    this.importPlugin.setupDropZone(ctx.editable);
  }

  getImagePlugin(): ImagePlugin {
    return this.imagePlugin;
  }

  getSpecialCharsPlugin(): SpecialCharsPlugin {
    return this.specialCharsPlugin;
  }

  getTablePlugin(): TablePlugin {
    return this.tablePlugin;
  }

  getImportPlugin(): ImportPlugin {
    return this.importPlugin;
  }

  execute(command: string, value?: any): void {
    if (command !== 'formatPainter' && this.isFormatPainterActive) {
      this.deactivateFormatPainter();
    }
    this.ctx.editable.focus();
    this.ctx.selection.restore();

    switch (command) {
      case 'undo':
        this.ctx.history.undo();
        break;
      case 'redo':
        this.ctx.history.redo();
        break;

      case 'cut':
        document.execCommand('cut');
        this.ctx.history.record(true);
        break;
      case 'copy':
        document.execCommand('copy');
        break;
      case 'paste':
        if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard.readText().then(text => {
            if (text) {
              document.execCommand('insertText', false, text);
              this.ctx.history.record(true);
            }
          }).catch(() => {
            document.execCommand('paste');
            this.ctx.history.record(true);
          });
        } else {
          document.execCommand('paste');
          this.ctx.history.record(true);
        }
        break;

      case 'formatPainter':
        this.toggleFormatPainter();
        break;
      case 'caseChange':
        this.applyCaseChange(value || 'uppercase');
        break;

      case 'bold':
        this.toggleInlineFormat('bold');
        break;

      case 'italic':
        this.toggleInlineFormat('italic');
        break;

      case 'underline':
        this.toggleInlineFormat('underline');
        break;

      case 'strikethrough':
        this.toggleInlineFormat('strikethrough');
        break;

      case 'subscript':
        if (typeof document.execCommand === 'function') {
          try { document.execCommand('subscript', false); } catch {}
        }
        this.ctx.history.record(true);
        break;

      case 'superscript':
        if (typeof document.execCommand === 'function') {
          try { document.execCommand('superscript', false); } catch {}
        }
        this.ctx.history.record(true);
        break;

      case 'heading':
        this.applyHeading(value || 'p');
        break;

      case 'fontSize':
        this.applyInlineStyle('fontSize', value);
        break;
      case 'fontSizeIncrease':
        this.stepFontSize(true);
        break;
      case 'fontSizeDecrease':
        this.stepFontSize(false);
        break;

      case 'fontFamily':
        this.applyInlineStyle('fontFamily', value);
        break;
      case 'fontColor':
        this.applyInlineStyle('color', value);
        break;
      case 'fontBackgroundColor':
        this.applyInlineStyle('backgroundColor', value);
        break;

      case 'alignment':
        this.applyBlockStyle('textAlign', value);
        break;
      case 'lineHeight':
        this.applyBlockStyle('lineHeight', value);
        break;
      case 'paragraphSpacing':
        this.applyBlockStyle('marginBottom', value);
        break;
      case 'firstLineIndent':
        this.applyBlockStyle('textIndent', value);
        break;
      case 'pageMargin':
        this.applyPageMargin(value);
        break;

      case 'bulletedList':
        document.execCommand('insertUnorderedList', false);
        this.ctx.history.record(true);
        break;
      case 'numberedList':
        document.execCommand('insertOrderedList', false);
        this.ctx.history.record(true);
        break;
      case 'checkList':
        this.insertCheckList();
        break;

      case 'indent':
        this.applyIndent(true);
        break;
      case 'outdent':
        this.applyIndent(false);
        break;

      case 'insertImage':
        if (value === 'url') {
          this.imagePlugin.insertImageFromUrl();
        } else {
          this.imagePlugin.insertImageFromFile();
        }
        break;

      case 'specialCharacters':
        this.specialCharsPlugin.openDialog();
        break;

      case 'exportWord':
        const wordHtml = this.ctx.getData ? this.ctx.getData() : this.ctx.editable.innerHTML;
        ExportPlugin.exportToWord(wordHtml, value || 'resmi_yazi_belgesi.docx');
        break;

      case 'exportPdf':
        PrintManager.print(this.ctx.container || this.ctx.editable);
        break;

      case 'importFile':
        this.importPlugin.promptImportFile();
        break;

      case 'insertOfficialTemplate':
        this.insertOfficialTemplate();
        break;

      case 'insertTable':
        this.tablePlugin.insertTable(value?.rows || 3, value?.cols || 3, value?.borderless !== false);
        break;
      case 'insertCustomTable':
        this.tablePlugin.promptCustomTable();
        break;
      case 'tableToggleBorders':
        this.tablePlugin.toggleBorders();
        break;
      case 'tableAddRowAbove':
        this.tableAddRow(true);
        break;
      case 'tableAddRowBelow':
        this.tableAddRow(false);
        break;
      case 'tableAddColLeft':
        this.tableAddCol(true);
        break;
      case 'tableAddColRight':
        this.tableAddCol(false);
        break;
      case 'tableDeleteRow':
        this.tableDeleteRow();
        break;
      case 'tableDeleteCol':
        this.tableDeleteCol();
        break;
      case 'tableDelete':
        this.tableDelete();
        break;

      case 'insertPageBreak':
        this.insertPageBreak();
        break;
      case 'horizontalLine':
        document.execCommand('insertHorizontalRule', false);
        this.ctx.history.record(true);
        break;

      case 'removeFormat':
        document.execCommand('removeFormat', false);
        const blocks = this.ctx.selection.getSelectedBlocks();
        blocks.forEach(b => {
          b.removeAttribute('style');
        });
        this.ctx.history.record(true);
        break;

      case 'save':
        this.execute('exportWord');
        break;
      case 'print':
        this.execute('exportPdf');
        break;

      case 'link':
      case 'createLink': {
        const url = prompt('Bağlantı adresi (URL) girin:', 'https://');
        if (url && url.trim() && url !== 'https://') {
          document.execCommand('createLink', false, url.trim());
          this.ctx.history.record(true);
        }
        break;
      }

      case 'pilcrow': {
        this.ctx.container.classList.toggle('rye-show-invisibles');
        this.ctx.onStateChange?.();
        break;
      }

      case 'overline':
        this.toggleInlineFormat('overline');
        break;

      case 'borderBottom':
        this.applyBorder({ borderBottom: '1.5px solid #000000' });
        break;
      case 'borderTop':
        this.applyBorder({ borderTop: '1.5px solid #000000' });
        break;
      case 'borderLeft':
        this.applyBorder({ borderLeft: '1.5px solid #000000' });
        break;
      case 'borderRight':
        this.applyBorder({ borderRight: '1.5px solid #000000' });
        break;
      case 'borderNone':
        this.applyBorder({ border: 'none' });
        break;
      case 'borderAll':
        this.applyBorder({ border: '1.5px solid #000000' });
        break;

      case 'tableMergeCells':
        this.tableMergeCells();
        break;
      case 'tableSplitCell':
        this.tableSplitCell();
        break;

      case 'insertHtml': {
        if (value) {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = value;
            const frag = document.createDocumentFragment();
            let node;
            while ((node = tempDiv.firstChild)) {
              frag.appendChild(node);
            }
            range.insertNode(frag);
          } else {
            const activePage = this.ctx.editable.querySelector('.rye-page') || this.ctx.editable;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = value;
            while (tempDiv.firstChild) {
              activePage.appendChild(tempDiv.firstChild);
            }
          }
          this.ctx.history.record(true);
        }
        break;
      }

      case 'insertText': {
        if (value) {
          if (typeof document.execCommand === 'function') {
            try {
              document.execCommand('insertText', false, value);
            } catch {
              const textNode = document.createTextNode(value);
              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0) {
                sel.getRangeAt(0).insertNode(textNode);
              } else {
                this.ctx.editable.appendChild(textNode);
              }
            }
          }
          this.ctx.history.record(true);
        }
        break;
      }

      default:
        console.warn(`[ResmiYaziEditor] Bilinmeyen komut: ${command}`);
    }
  }

  private applyBorder(borderStyles: Partial<CSSStyleDeclaration>): void {
    const currentCell = this.ctx.selection.getCurrentCell();
    if (currentCell) {
      Object.assign(currentCell.style, borderStyles);
      this.ctx.history.record(true);
      return;
    }
    const blocks = this.ctx.selection.getSelectedBlocks();
    if (blocks.length > 0) {
      blocks.forEach(b => Object.assign(b.style, borderStyles));
      this.ctx.history.record(true);
    } else {
      const currBlock = this.ctx.selection.getCurrentBlock();
      if (currBlock) {
        Object.assign(currBlock.style, borderStyles);
        this.ctx.history.record(true);
      }
    }
  }

  private tableMergeCells(): void {
    const cell = this.ctx.selection.getCurrentCell();
    if (!cell) return;
    const nextCell = cell.nextElementSibling as HTMLTableCellElement | null;
    if (nextCell) {
      const currentSpan = parseInt(cell.getAttribute('colspan') || '1', 10);
      const nextSpan = parseInt(nextCell.getAttribute('colspan') || '1', 10);
      cell.setAttribute('colspan', String(currentSpan + nextSpan));
      cell.innerHTML += ' ' + nextCell.innerHTML;
      nextCell.remove();
      this.ctx.history.record(true);
    }
  }

  private tableSplitCell(): void {
    const cell = this.ctx.selection.getCurrentCell();
    if (!cell) return;
    const currentSpan = parseInt(cell.getAttribute('colspan') || '1', 10);
    if (currentSpan > 1) {
      cell.setAttribute('colspan', String(currentSpan - 1));
      const newCell = document.createElement('td');
      newCell.style.border = cell.style.border || '1px solid #000';
      newCell.style.padding = cell.style.padding || '6px 10px';
      newCell.innerHTML = '<p><br></p>';
      cell.parentNode?.insertBefore(newCell, cell.nextSibling);
    } else {
      const newCell = document.createElement('td');
      newCell.style.border = cell.style.border || '1px solid #000';
      newCell.style.padding = cell.style.padding || '6px 10px';
      newCell.innerHTML = '<p><br></p>';
      cell.parentNode?.insertBefore(newCell, cell.nextSibling);
    }
    this.ctx.history.record(true);
  }

  queryCommandState(command: string): boolean {
    try {
      switch (command) {
        case 'bold':
        case 'italic':
        case 'underline':
        case 'strikethrough':
        case 'subscript':
        case 'superscript':
          if (document.queryCommandState(command)) return true;
          break;
        case 'formatPainter':
          return this.isFormatPainting();
        case 'bulletedList':
          return document.queryCommandState('insertUnorderedList');
        case 'numberedList':
          return document.queryCommandState('insertOrderedList');
        default:
          return false;
      }
    } catch {
      // Devam et ve DOM hiyerarşisini kontrol et
    }

    try {
      const range = this.ctx.selection.getRange();
      if (!range) return false;
      let node: Node | null = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;

      while (node && node !== this.ctx.editable) {
        if (node instanceof HTMLElement) {
          const tag = node.tagName.toUpperCase();
          const style = node.style;
          if (command === 'bold') {
            if (style.fontWeight === 'normal') return false;
            if (tag === 'B' || tag === 'STRONG' || style.fontWeight === 'bold' || parseInt(style.fontWeight, 10) >= 600) return true;
          } else if (command === 'italic') {
            if (style.fontStyle === 'normal') return false;
            if (tag === 'I' || tag === 'EM' || style.fontStyle === 'italic') return true;
          } else if (command === 'underline') {
            if (style.textDecoration === 'none') return false;
            if (tag === 'U' || style.textDecoration?.includes('underline')) return true;
          } else if (command === 'strikethrough') {
            if (style.textDecoration === 'none') return false;
            if (tag === 'S' || tag === 'STRIKE' || style.textDecoration?.includes('line-through')) return true;
          } else if (command === 'overline') {
            if (style.textDecoration === 'none') return false;
            if (style.textDecoration?.includes('overline')) return true;
          } else if (command === 'subscript') {
            if (tag === 'SUB') return true;
          } else if (command === 'superscript') {
            if (tag === 'SUP') return true;
          }
        }
        node = node.parentElement;
      }
    } catch {
      return false;
    }

    return false;
  }

  queryBlockValue(property: string): string {
    const block = this.ctx.selection.getCurrentBlock();
    if (!block) return '';
    return block.style[property as any] || '';
  }

  getCurrentInlineStyle(property: string): string {
    let sel = window.getSelection();
    let range: Range | null = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : null;
    if (!range || !this.ctx.editable.contains(range.commonAncestorContainer)) {
      range = this.ctx.selection.getRange();
    }
    if (!range) return '';

    let node: Node | null = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    } else if (node instanceof HTMLElement && range.startOffset < node.childNodes.length) {
      const child = node.childNodes[range.startOffset];
      if (child instanceof HTMLElement) {
        node = child;
      }
    }

    const kebab = this.toKebabCase(property);

    while (node && node !== this.ctx.editable) {
      if (node instanceof HTMLElement) {
        const val = node.style.getPropertyValue(kebab);
        if (val) return val.trim();
      }
      node = node.parentElement;
    }

    return '';
  }

  private stepFontSize(increase: boolean): void {
    const current = this.getCurrentInlineStyle('fontSize') || '12pt';
    const cleanCurrent = current.toLowerCase().trim();

    let currentIndex = FONT_SIZE_STEPS.findIndex(s => s === cleanCurrent);
    if (currentIndex === -1) {
      const numCurrent = parseFloat(cleanCurrent);
      currentIndex = FONT_SIZE_STEPS.findIndex(s => parseFloat(s) >= numCurrent);
      if (currentIndex === -1) currentIndex = 4; // default to 12pt
    }

    let nextIndex = increase ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex >= FONT_SIZE_STEPS.length) nextIndex = FONT_SIZE_STEPS.length - 1;

    const nextSize = FONT_SIZE_STEPS[nextIndex];
    this.applyInlineStyle('fontSize', nextSize);
  }

  private toKebabCase(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  private applyHeading(tag: string): void {
    const blocks = this.ctx.selection.getSelectedBlocks();
    if (blocks.length === 0) {
      document.execCommand('formatBlock', false, tag);
      this.ctx.history.record(true);
      return;
    }

    blocks.forEach(block => {
      if (block.tagName.toLowerCase() === tag.toLowerCase()) return;
      const newEl = document.createElement(tag);
      newEl.innerHTML = block.innerHTML;
      if (block.getAttribute('style')) {
        newEl.setAttribute('style', block.getAttribute('style') || '');
      }
      block.parentNode?.replaceChild(newEl, block);
    });

    this.ctx.history.record(true);
  }

  private applyBlockStyle(property: string, value: string): void {
    let blocks = this.ctx.selection.getSelectedBlocks();
    if (blocks.length === 0) {
      const currentBlock = this.ctx.selection.getCurrentBlock();
      if (currentBlock) {
        blocks = [currentBlock];
      }
    }

    if (blocks.length === 0) {
      document.execCommand('formatBlock', false, 'p');
      blocks = this.ctx.selection.getSelectedBlocks();
    }

    blocks.forEach(block => {
      if (value) {
        (block.style as any)[property] = value;
      } else {
        (block.style as any)[property] = '';
      }
    });

    this.ctx.history.record(true);
  }

  private applyIndent(increase: boolean): void {
    let blocks = this.ctx.selection.getSelectedBlocks();
    if (blocks.length === 0) {
      const currentBlock = this.ctx.selection.getCurrentBlock();
      if (currentBlock) {
        blocks = [currentBlock];
      }
    }

    if (blocks.length === 0) {
      document.execCommand('formatBlock', false, 'p');
      blocks = this.ctx.selection.getSelectedBlocks();
    }

    if (blocks.length === 0) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.getRangeAt(0).startContainer;
        while (node && node !== this.ctx.editable && node.nodeType !== Node.ELEMENT_NODE) {
          node = node.parentNode;
        }
        if (node && node instanceof HTMLElement && node !== this.ctx.editable) {
          blocks = [node];
        }
      }
    }

    // 0. Eğer blok bir liste elemanıysa (li / ul / ol), standart liste seviye girintisini kullan
    const hasList = blocks.some(b => b.tagName === 'LI' || b.closest('li') !== null);
    if (hasList) {
      document.execCommand(increase ? 'indent' : 'outdent', false);
      this.ctx.history.record(true);
      this.ctx.onStateChange?.();
      return;
    }

    const savedRange = this.ctx.selection.getRange();

    // 0. Eğer imleç tek bir noktadaysa (seçim alanı yoksa / collapsed):
    // Satır başında veya imleç konumunda serbest girinti uygula (böylece tüm paragraf toptan sağa kaymaz!)
    if (savedRange && savedRange.collapsed) {
      if (increase) {
        document.execCommand('insertText', false, '\u00A0\u00A0\u00A0\u00A0');
        this.ctx.history.record(true);
        this.ctx.onStateChange?.();
        return;
      } else {
        if (this.removeSpacesBeforeCursor(4)) {
          this.ctx.history.record(true);
          this.ctx.onStateChange?.();
          return;
        }
        // Önünde boşluk yoksa blok bazlı azaltmaya devam et
      }
    }

    const stepCm = 1.25;

    blocks.forEach(block => {
      let targetEl = block;

      // 1. Hücre içindeyse (TD/TH), doğrudan hücreye değil hücre içindeki p'ye uygula
      if (targetEl.tagName === 'TD' || targetEl.tagName === 'TH') {
        let p = targetEl.querySelector('p');
        if (!p) {
          const newP = document.createElement('p');
          while (targetEl.firstChild) {
            newP.appendChild(targetEl.firstChild);
          }
          targetEl.appendChild(newP);
          p = newP;
        }
        targetEl = p;
      }

      // 2. Eğer eleman BLOCKQUOTE ise veya parent'ı BLOCKQUOTE ise p'ye dönüştür / unwrap et
      if (targetEl.tagName === 'BLOCKQUOTE') {
        const p = document.createElement('p');
        p.innerHTML = targetEl.innerHTML;
        if (targetEl.style.marginLeft) p.style.marginLeft = targetEl.style.marginLeft;
        targetEl.parentElement?.replaceChild(p, targetEl);
        targetEl = p;
      } else if (targetEl.parentElement && targetEl.parentElement.tagName === 'BLOCKQUOTE') {
        const bq = targetEl.parentElement;
        bq.parentElement?.insertBefore(targetEl, bq);
        if (!bq.hasChildNodes() || bq.innerText.trim() === '') {
          bq.remove();
        }
      }

      // 3. Mevcut sol girintiyi (margin-left) oku
      const rawMargin = targetEl.style.marginLeft || '';
      const currentCm = this.parseDimensionToCm(rawMargin);

      let nextCm = 0;
      if (increase) {
        // En fazla 8.75 cm (A4 yazı alanının güvenli sınırı)
        nextCm = Math.min(8.75, Math.round((currentCm + stepCm) * 100) / 100);
      } else {
        // En az 0 cm
        nextCm = Math.max(0, Math.round((currentCm - stepCm) * 100) / 100);
      }

      // 4. Stili güvenle uygula (sağ kenara asla dokunulmaz!)
      if (nextCm <= 0.05) {
        targetEl.style.marginLeft = '';
        if (!increase && targetEl.style.textIndent) {
          targetEl.style.textIndent = '';
        }
      } else {
        targetEl.style.marginLeft = `${nextCm}cm`;
      }

      // Tarayıcı blockquote kalıntısı margin-right varsa temizle
      if (targetEl.style.marginRight) {
        targetEl.style.marginRight = '';
      }
    });

    if (savedRange) {
      try {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(savedRange);
        }
      } catch {
        // Range DOM node değişikliklerinde geçersiz kaldıysa sessizce geç
      }
    }

    this.ctx.history.record(true);
    this.ctx.onStateChange?.();
  }

  /**
   * İmleçten hemen önceki boşlukları (en fazla maxCount adet) siler.
   */
  public removeSpacesBeforeCursor(maxCount: number = 4): boolean {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return false;

    const node = range.startContainer;
    const offset = range.startOffset;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      let spacesFound = 0;
      let i = offset - 1;
      while (i >= 0 && spacesFound < maxCount) {
        const ch = text[i];
        if (ch === ' ' || ch === '\u00A0' || ch === '\t') {
          spacesFound++;
          i--;
        } else {
          break;
        }
      }

      if (spacesFound > 0) {
        const deleteRange = document.createRange();
        deleteRange.setStart(node, offset - spacesFound);
        deleteRange.setEnd(node, offset);
        deleteRange.deleteContents();
        return true;
      }

      // Eğer bu metin düğümünün başındaysak (offset === 0), önceki metin düğümüne bak
      if (offset === 0 && node.previousSibling && node.previousSibling.nodeType === Node.TEXT_NODE) {
        const prevText = node.previousSibling.textContent || '';
        let prevSpaces = 0;
        let pIdx = prevText.length - 1;
        while (pIdx >= 0 && prevSpaces < maxCount) {
          const ch = prevText[pIdx];
          if (ch === ' ' || ch === '\u00A0' || ch === '\t') {
            prevSpaces++;
            pIdx--;
          } else {
            break;
          }
        }
        if (prevSpaces > 0) {
          const deleteRange = document.createRange();
          deleteRange.setStart(node.previousSibling, prevText.length - prevSpaces);
          deleteRange.setEnd(node.previousSibling, prevText.length);
          deleteRange.deleteContents();
          return true;
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (offset > 0) {
        const prevChild = node.childNodes[offset - 1];
        if (prevChild && prevChild.nodeType === Node.TEXT_NODE) {
          const text = prevChild.textContent || '';
          let spacesFound = 0;
          let i = text.length - 1;
          while (i >= 0 && spacesFound < maxCount) {
            const ch = text[i];
            if (ch === ' ' || ch === '\u00A0' || ch === '\t') {
              spacesFound++;
              i--;
            } else {
              break;
            }
          }
          if (spacesFound > 0) {
            const deleteRange = document.createRange();
            deleteRange.setStart(prevChild, text.length - spacesFound);
            deleteRange.setEnd(prevChild, text.length);
            deleteRange.deleteContents();
            return true;
          }
        }
      }
    }

    return false;
  }

  private parseDimensionToCm(val: string): number {
    if (!val || val === 'normal') return 0;
    val = val.trim().toLowerCase();
    if (val.endsWith('cm')) {
      return parseFloat(val);
    }
    if (val.endsWith('mm')) {
      return parseFloat(val) / 10;
    }
    if (val.endsWith('in')) {
      return parseFloat(val) * 2.54;
    }
    if (val.endsWith('pt')) {
      return (parseFloat(val) / 72) * 2.54;
    }
    if (val.endsWith('px')) {
      return parseFloat(val) / 37.795;
    }
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num / 37.795;
  }

  private toggleInlineFormat(command: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'overline'): void {
    let sel = window.getSelection();
    let range: Range | null = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : null;

    if (!range || !this.ctx.editable.contains(range.commonAncestorContainer)) {
      this.ctx.selection.restore();
      sel = window.getSelection();
      range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : null;
    }

    if (!sel || !range || !this.ctx.editable.contains(range.commonAncestorContainer)) return;

    // Expand collapsed range to word if clicked within a word
    if (range.collapsed) {
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue || '';
        let start = range.startOffset;
        let end = range.startOffset;
        const isWordChar = (ch: string) => /[^\s.,!?;:()\[\]{}"'«»“”‘’]/.test(ch);
        while (start > 0 && isWordChar(text[start - 1])) start--;
        while (end < text.length && isWordChar(text[end])) end++;
        if (start < end) {
          range.setStart(node, start);
          range.setEnd(node, end);
          sel.removeAllRanges();
          sel.addRange(range);
          this.ctx.selection.save();
        }
      }
    }

    const isCurrentlyActive = this.queryCommandState(command);

    if (isCurrentlyActive) {
      // === KAPATMA (TOGGLE OFF) ===
      this.stripInlineFormatFromRange(range, command);
    } else {
      // === AÇMA (TOGGLE ON) ===
      const propMap: Record<string, [string, string]> = {
        bold: ['fontWeight', 'bold'],
        italic: ['fontStyle', 'italic'],
        underline: ['textDecoration', 'underline'],
        strikethrough: ['textDecoration', 'line-through'],
        overline: ['textDecoration', 'overline']
      };
      const [prop, val] = propMap[command];
      this.applyInlineStyle(prop, val);
    }

    this.ctx.selection.save();
    this.ctx.history.record(true);
    this.ctx.onStateChange?.();
  }

  private stripInlineFormatFromRange(range: Range, command: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'overline'): void {
    const tagMap: Record<string, string[]> = {
      bold: ['B', 'STRONG'],
      italic: ['I', 'EM'],
      underline: ['U'],
      strikethrough: ['S', 'STRIKE', 'DEL'],
      overline: []
    };
    const stylePropMap: Record<string, string> = {
      bold: 'font-weight',
      italic: 'font-style',
      underline: 'text-decoration',
      strikethrough: 'text-decoration',
      overline: 'text-decoration'
    };

    const targetTags = tagMap[command];
    const targetProp = stylePropMap[command];

    let ancestor: Node | null = range.commonAncestorContainer;
    if (ancestor.nodeType === Node.TEXT_NODE) ancestor = ancestor.parentElement;

    const ancestorEl = ancestor instanceof HTMLElement ? ancestor : null;
    const matchingAncestorTag = ancestorEl?.closest(targetTags.map(t => t.toLowerCase()).join(','));
    const matchingAncestorSpan = ancestorEl?.closest('span:not(.rye-page-break):not(.rye-checklist-item)');

    if (matchingAncestorTag && matchingAncestorTag !== this.ctx.editable && matchingAncestorTag instanceof HTMLElement) {
      const tagRange = document.createRange();
      tagRange.selectNodeContents(matchingAncestorTag);
      if (
        range.compareBoundaryPoints(Range.START_TO_START, tagRange) <= 0 &&
        range.compareBoundaryPoints(Range.END_TO_END, tagRange) >= 0
      ) {
        const frag = document.createDocumentFragment();
        while (matchingAncestorTag.firstChild) {
          frag.appendChild(matchingAncestorTag.firstChild);
        }
        const first = frag.firstChild;
        const last = frag.lastChild;
        matchingAncestorTag.replaceWith(frag);

        const sel = window.getSelection();
        if (sel && first && last) {
          const newRange = document.createRange();
          newRange.setStartBefore(first);
          newRange.setEndAfter(last);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
        return;
      }
    }

    if (matchingAncestorSpan && matchingAncestorSpan !== this.ctx.editable && matchingAncestorSpan instanceof HTMLElement) {
      const spanRange = document.createRange();
      spanRange.selectNodeContents(matchingAncestorSpan);
      if (
        range.compareBoundaryPoints(Range.START_TO_START, spanRange) <= 0 &&
        range.compareBoundaryPoints(Range.END_TO_END, spanRange) >= 0
      ) {
        matchingAncestorSpan.style.removeProperty(targetProp);
        if (matchingAncestorSpan.style.length === 0 && !matchingAncestorSpan.className) {
          const frag = document.createDocumentFragment();
          while (matchingAncestorSpan.firstChild) {
            frag.appendChild(matchingAncestorSpan.firstChild);
          }
          const first = frag.firstChild;
          const last = frag.lastChild;
          matchingAncestorSpan.replaceWith(frag);

          const sel = window.getSelection();
          if (sel && first && last) {
            const newRange = document.createRange();
            newRange.setStartBefore(first);
            newRange.setEndAfter(last);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
        }
        return;
      }
    }

    const contents = range.extractContents();

    targetTags.forEach(t => {
      const els = Array.from(contents.querySelectorAll(t.toLowerCase()));
      els.forEach(el => el.replaceWith(...Array.from(el.childNodes)));
    });

    const spans = Array.from(contents.querySelectorAll('span'));
    spans.forEach(s => {
      if (s.classList.contains('rye-page-break') || s.classList.contains('rye-checklist-item')) return;
      s.style.removeProperty(targetProp);
      if ((!s.getAttribute('style') || s.getAttribute('style')?.trim() === '') && !s.className) {
        s.replaceWith(...Array.from(s.childNodes));
      }
    });

    let outerTag = range.startContainer instanceof HTMLElement ? range.startContainer : range.startContainer.parentElement;
    const stillInsideOuterTag = outerTag?.closest(targetTags.map(t => t.toLowerCase()).join(','));

    let nodeToInsert: Node = contents;
    if (stillInsideOuterTag && stillInsideOuterTag !== this.ctx.editable) {
      const span = document.createElement('span');
      if (command === 'bold') span.style.fontWeight = 'normal';
      else if (command === 'italic') span.style.fontStyle = 'normal';
      else if (command === 'underline' || command === 'strikethrough') span.style.textDecoration = 'none';
      span.appendChild(contents);
      nodeToInsert = span;
    }

    const firstNode = nodeToInsert.firstChild || nodeToInsert;
    const lastNode = nodeToInsert.lastChild || nodeToInsert;

    range.insertNode(nodeToInsert);

    const sel = window.getSelection();
    if (sel && firstNode && lastNode) {
      const newRange = document.createRange();
      newRange.setStartBefore(firstNode);
      newRange.setEndAfter(lastNode);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  }

  /**
   * Tam hatasız, iç içe span çakışmalarını temizleyen inline stil motoru.
   * Yazı boyutunu büyütme, küçültme, sıfırlama veya font ailesini değiştirme
   * işlemlerinin geriye dönük her zaman doğru çalışmasını garanti eder.
   */
  private applyInlineStyle(property: string, value: string): void {
    let sel = window.getSelection();
    let range: Range | null = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : null;

    if (!range || !this.ctx.editable.contains(range.commonAncestorContainer)) {
      this.ctx.selection.restore();
      sel = window.getSelection();
      range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : null;
    }

    if (!sel || !range || !this.ctx.editable.contains(range.commonAncestorContainer)) return;

    const kebabProp = this.toKebabCase(property);

    // 1. Seçim collapsed ise (imleç bir kelime içindeyse) kelime sınırına genişlet
    if (range.collapsed) {
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue || '';
        const offset = range.startOffset;
        let start = offset;
        let end = offset;
        while (start > 0 && /\S/.test(text[start - 1])) start--;
        while (end < text.length && /\S/.test(text[end])) end++;
        if (start < end) {
          range.setStart(node, start);
          range.setEnd(node, end);
        }
      }
    }

    if (range.collapsed) {
      // Kelime üzerinde değilse, yeni yazılacak karakterler için boş stil span'i oluştur
      const span = document.createElement('span');
      if (value) {
        span.style.setProperty(kebabProp, value);
      }
      span.textContent = '\uFEFF';
      range.insertNode(span);
      range.selectNodeContents(span);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      this.ctx.history.record(true);
      return;
    }

    // 2. Seçim mevcut bir stil span'inin tamamını kapsıyorsa doğrudan span'in stilini güncelle
    let ancestor = range.commonAncestorContainer;
    if (ancestor.nodeType === Node.TEXT_NODE) {
      ancestor = ancestor.parentElement || this.ctx.editable;
    }

    const ancestorSpan = (ancestor instanceof HTMLElement)
      ? ancestor.closest('span:not(.rye-page-break):not(.rye-checklist-item)')
      : null;

    if (ancestorSpan && ancestorSpan !== this.ctx.editable && ancestorSpan instanceof HTMLElement) {
      const ancestorRange = document.createRange();
      ancestorRange.selectNodeContents(ancestorSpan);

      if (
        range.compareBoundaryPoints(Range.START_TO_START, ancestorRange) <= 0 &&
        range.compareBoundaryPoints(Range.END_TO_END, ancestorRange) >= 0
      ) {
        if (value) {
          ancestorSpan.style.setProperty(kebabProp, value);
        } else {
          ancestorSpan.style.removeProperty(kebabProp);
          if (ancestorSpan.style.length === 0 && (!ancestorSpan.className || ancestorSpan.className === '')) {
            ancestorSpan.replaceWith(...Array.from(ancestorSpan.childNodes));
          }
        }
        const newSelRange = document.createRange();
        newSelRange.selectNodeContents(ancestorSpan);
        sel.removeAllRanges();
        sel.addRange(newSelRange);
        this.ctx.selection.save();

        this.ctx.history.record(true);
        return;
      }
    }

    // 3. Genel Durum: İçeriği çıkar, çıkarılan içerikteki çakışan stilleri temizle ve yeni span ile sar
    const contents = range.extractContents();

    // Çıkarılan içerik içindeki tüm alt elemanlardan bu özelliği temizle (iç içe hapsolmayı önler)
    const innerElements = contents.querySelectorAll ? Array.from(contents.querySelectorAll('*')) : [];
    innerElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.removeProperty(kebabProp);
        // İçi boşalan gereksiz span'leri aç
        if (el.tagName === 'SPAN' && el.style.length === 0 && (!el.className || el.className === '')) {
          el.replaceWith(...Array.from(el.childNodes));
        }
      }
    });

    // Çıkarılan içerik tek bir span ise ve başka stili yoksa doğrudan güncelle
    if (
      contents.childNodes.length === 1 &&
      contents.firstChild?.nodeType === Node.ELEMENT_NODE &&
      (contents.firstChild as HTMLElement).tagName === 'SPAN'
    ) {
      const singleSpan = contents.firstChild as HTMLElement;
      if (value) {
        singleSpan.style.setProperty(kebabProp, value);
      } else {
        singleSpan.style.removeProperty(kebabProp);
      }
      range.insertNode(singleSpan);
      range.selectNodeContents(singleSpan);
      sel.removeAllRanges();
      sel.addRange(range);
      this.ctx.selection.save();
      this.ctx.history.record(true);
      return;
    }

    // Yeni span oluştur ve yerleştir
    if (value) {
      const span = document.createElement('span');
      span.style.setProperty(kebabProp, value);
      span.appendChild(contents);
      range.insertNode(span);
      range.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(range);
      this.ctx.selection.save();
    } else {
      const firstNode = contents.firstChild;
      const lastNode = contents.lastChild;
      range.insertNode(contents);
      if (firstNode && lastNode) {
        range.setStartBefore(firstNode);
        range.setEndAfter(lastNode);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      this.ctx.selection.save();
    }

    // DOM'u normalize et
    if (range.commonAncestorContainer.normalize) {
      range.commonAncestorContainer.normalize();
    }

    this.ctx.history.record(true);
  }

  private applyPageMargin(margin: string): void {
    this.ctx.container.style.setProperty('--rye-page-padding', margin);
    const pages = this.ctx.container.querySelectorAll('.rye-page');
    pages.forEach(p => (p as HTMLElement).style.setProperty('--rye-page-padding', margin));
  }

  private insertCheckList(): void {
    const p = document.createElement('p');
    p.className = 'rye-checklist-item';
    p.style.display = 'flex';
    p.style.alignItems = 'center';
    p.style.gap = '8px';
    p.style.textIndent = '0';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.style.cursor = 'pointer';

    const span = document.createElement('span');
    span.innerHTML = 'Yapılacak madde...';

    p.appendChild(checkbox);
    p.appendChild(span);

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(p);
    } else {
      this.ctx.editable.appendChild(p);
    }

    this.ctx.history.record(true);
  }

  private insertOfficialTemplate(): void {
    const templateHtml = `
<p style="text-align: center; font-weight: bold; line-height: 1.15; margin-bottom: 0;">
  T.C.<br>
  CUMHURBAŞKANLIĞI<br>
  Diyanet İşleri Başkanlığı
</p>
<table class="rye-table rye-table-borderless" style="width: 100%; border: none; margin: 16pt 0 0 0;">
  <tbody>
    <tr>
      <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
        <strong>Sayı :</strong> E-80979383-010.03-1234936<br>
        <strong>Konu :</strong> Görev ve Çalışma Yönetmeliği Taslağı
      </td>
      <td style="border: none; padding: 0; text-align: right; vertical-align: top; width: 140px;">
        16.10.2025
      </td>
    </tr>
  </tbody>
</table>
<p style="text-align: center; font-weight: bold; margin: 24pt 0 24pt 0; text-indent: 0;">DAĞITIM YERLERİNE</p>
<p style="margin: 0 0 12pt 0; text-indent: 0;"><strong>İlgi :</strong> 12.10.2025 tarihli ve E-80979383-010.03-2844112 sayılı yazımız.</p>
<p style="text-indent: 1.25cm; text-align: justify; margin: 0; line-height: 1.15;">
  Cumhurbaşkanlığı Resmî Yazışmalarda Uygulanacak Usul ve Esaslar Hakkında Yönetmelik ve Kılavuzu hükümlerine uygun olarak hazırlanan belge standartları uygulamaya alınmıştır.
</p>
<p style="text-indent: 1.25cm; text-align: justify; margin: 0; line-height: 1.15;">
  Bilgilerini ve gereğini arz ve rica ederim.
</p>
<table class="rye-table rye-table-borderless" style="width: 100%; border: none; margin: 28pt 0 16pt 0;">
  <tbody>
    <tr>
      <td style="border: none; width: 55%;"></td>
      <td style="border: none; width: 45%; text-align: center;">
        <p style="margin: 0; font-weight: bold; text-indent: 0;">Adı SOYADI</p>
        <p style="margin: 0; text-indent: 0;">Başkan</p>
      </td>
    </tr>
  </tbody>
</table>
<div style="margin-top: 16pt; font-size: 11pt;">
  <p style="margin: 0; font-weight: bold; text-indent: 0;">Ek:</p>
  <p style="margin: 0; text-indent: 0;">1- Dağıtım Listesi (10 Muhatap)</p>
  <p style="margin: 0; text-indent: 0;">2- Yönetmelik Taslağı (12 Sayfa)</p>
</div>
<div class="rye-footer-contact" style="border-top: 1px solid #000000; margin-top: 24pt; padding-top: 4pt; font-size: 8pt; line-height: 1.2; display: flex; justify-content: space-between; align-items: flex-end;">
  <div style="flex: 1;">
    <span style="font-size: 7.5pt; color: #dc2626;">Bu belge, güvenli elektronik imza ile imzalanmıştır.</span><br>
    Belge Doğrulama Kodu: GHFZE-COPSG-XOTDZ-GYKQX &nbsp;&nbsp;&nbsp;&nbsp; Belge Takip Adresi: https://www.turkiye.gov.tr/ebys<br>
    Adres: Üniversiteler Mah. Dumlupınar Bulv. No:1 Çankaya/ANKARA &nbsp;&nbsp;&nbsp;&nbsp; Bilgi için: Adı SOYADI (Uzman)<br>
    Telefon: (0312) 123 45 67 &nbsp;&nbsp; Faks: (0312) 123 45 68 &nbsp;&nbsp; İnternet: www.mevzuat.gov.tr &nbsp;&nbsp; KEP: kurum@hs01.kep.tr
  </div>
</div>
`;
    if (this.ctx.onHtmlLoaded) {
      this.ctx.onHtmlLoaded(templateHtml);
    } else {
      this.ctx.editable.innerHTML = templateHtml;
    }
    this.ctx.history.record(true);
    this.ctx.onStateChange?.();
  }

  private findClosestCell(): HTMLTableCellElement | null {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== this.ctx.editable) {
      if (node.nodeName === 'TD' || node.nodeName === 'TH') {
        return node as HTMLTableCellElement;
      }
      node = node.parentNode;
    }
    return null;
  }

  private tableAddRow(above: boolean): void {
    const cell = this.findClosestCell();
    if (!cell) return;
    const row = cell.parentElement as HTMLTableRowElement;
    if (!row) return;

    const newRow = document.createElement('tr');
    const colsCount = row.cells.length;
    for (let i = 0; i < colsCount; i++) {
      const newCell = document.createElement('td');
      newCell.innerHTML = '<p><br></p>';
      newRow.appendChild(newCell);
    }

    if (above) {
      row.parentElement?.insertBefore(newRow, row);
    } else {
      row.parentElement?.insertBefore(newRow, row.nextSibling);
    }
    this.ctx.history.record(true);
  }

  private tableAddCol(left: boolean): void {
    const cell = this.findClosestCell();
    if (!cell) return;
    const colIndex = cell.cellIndex;
    const table = cell.closest('table');
    if (!table) return;

    Array.from(table.rows).forEach(row => {
      const isHeader = row.parentElement?.tagName === 'THEAD';
      const newCell = document.createElement(isHeader ? 'th' : 'td');
      newCell.innerHTML = '<p><br></p>';
      const targetCell = row.cells[colIndex];
      if (left) {
        row.insertBefore(newCell, targetCell);
      } else {
        row.insertBefore(newCell, targetCell.nextSibling);
      }
    });
    this.ctx.history.record(true);
  }

  private tableDeleteRow(): void {
    const cell = this.findClosestCell();
    if (!cell) return;
    const row = cell.parentElement as HTMLTableRowElement;
    row?.remove();
    this.ctx.history.record(true);
  }

  private tableDeleteCol(): void {
    const cell = this.findClosestCell();
    if (!cell) return;
    const colIndex = cell.cellIndex;
    const table = cell.closest('table');
    if (!table) return;

    Array.from(table.rows).forEach(row => {
      if (row.cells[colIndex]) {
        row.cells[colIndex].remove();
      }
    });
    this.ctx.history.record(true);
  }

  private tableDelete(): void {
    const cell = this.findClosestCell();
    if (!cell) return;
    const table = cell.closest('table');
    table?.remove();
    this.ctx.history.record(true);
  }

  private insertPageBreak(): void {
    const breakEl = document.createElement('div');
    breakEl.className = 'rye-page-break';
    breakEl.setAttribute('contenteditable', 'false');

    const nextP = document.createElement('p');
    nextP.innerHTML = '<br>';

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && this.ctx.editable.contains(sel.anchorNode)) {
      let anchor: Node | null = sel.anchorNode;
      if (!anchor) return;
      if (anchor.nodeType === Node.TEXT_NODE) anchor = anchor.parentElement;
      if (!anchor) return;
      const range = sel.getRangeAt(0);

      // Mevcut .rye-page ve doğrudan alt elemanı olan bloğu bul
      const pageEl = (anchor as HTMLElement).closest('.rye-page') as HTMLElement;
      if (pageEl) {
        let topBlock: HTMLElement = anchor as HTMLElement;
        while (topBlock && topBlock.parentElement !== pageEl && topBlock.parentElement !== this.ctx.editable) {
          topBlock = topBlock.parentElement as HTMLElement;
        }

        if (topBlock && topBlock.parentElement === pageEl) {
          // Bloğu imleç noktasından ikiye böl
          try {
            const afterRange = document.createRange();
            afterRange.setStart(range.endContainer, range.endOffset);
            afterRange.setEndAfter(topBlock.lastChild || topBlock);
            const afterFragment = afterRange.extractContents();

            if (afterFragment.textContent?.trim() || afterFragment.querySelector('img, table')) {
              const splitP = document.createElement(topBlock.tagName.toLowerCase());
              if (topBlock.getAttribute('style')) splitP.setAttribute('style', topBlock.getAttribute('style')!);
              splitP.appendChild(afterFragment);
              topBlock.after(breakEl);
              breakEl.after(splitP);

              const newRange = document.createRange();
              newRange.setStart(splitP, 0);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
            } else {
              topBlock.after(breakEl);
              breakEl.after(nextP);

              const newRange = document.createRange();
              newRange.setStart(nextP, 0);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
            }
          } catch {
            topBlock.after(breakEl);
            breakEl.after(nextP);
            const newRange = document.createRange();
            newRange.setStart(nextP, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
        } else {
          pageEl.appendChild(breakEl);
          pageEl.appendChild(nextP);
        }
      } else {
        this.ctx.editable.appendChild(breakEl);
        this.ctx.editable.appendChild(nextP);
      }
    } else {
      this.ctx.editable.appendChild(breakEl);
      this.ctx.editable.appendChild(nextP);
    }

    this.ctx.history.record(true);
    if (this.ctx.onStateChange) this.ctx.onStateChange();
  }

  private storedFormat: StoredFormat | null = null;
  private isFormatPainterActive = false;
  private formatPainterCleanup: (() => void) | null = null;

  toggleFormatPainter(): void {
    if (this.isFormatPainterActive) {
      this.deactivateFormatPainter();
      return;
    }

    let sel = window.getSelection();
    let range: Range | null = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : null;
    if (!range || !this.ctx.editable.contains(range.commonAncestorContainer)) {
      range = this.ctx.selection.getRange();
    }

    if (!range || !this.ctx.editable.contains(range.commonAncestorContainer)) {
      return;
    }

    let node: Node | null = range.startContainer;
    let anchorEl: HTMLElement | null = null;
    if (node.nodeType === Node.TEXT_NODE) {
      anchorEl = node.parentElement;
    } else if (node instanceof HTMLElement) {
      anchorEl = node;
    }

    let computed: CSSStyleDeclaration | null = null;
    if (anchorEl) {
      try {
        computed = window.getComputedStyle(anchorEl);
      } catch {}
    }

    const bold = this.queryCommandState('bold') || (computed ? (computed.fontWeight === 'bold' || parseInt(computed.fontWeight || '400', 10) >= 600) : false);
    const italic = this.queryCommandState('italic') || (computed ? computed.fontStyle === 'italic' : false);
    const underline = this.queryCommandState('underline') || (computed ? (computed.textDecoration?.includes('underline') || (computed as any).textDecorationLine?.includes('underline')) : false);
    const strikethrough = this.queryCommandState('strikethrough') || (computed ? (computed.textDecoration?.includes('line-through') || (computed as any).textDecorationLine?.includes('line-through')) : false);

    const fontSize = this.getCurrentInlineStyle('fontSize') || (anchorEl?.style.fontSize) || '';
    const fontFamily = this.getCurrentInlineStyle('fontFamily') || (anchorEl?.style.fontFamily) || '';
    const color = this.getCurrentInlineStyle('color') || (anchorEl?.style.color) || '';
    const backgroundColor = this.getCurrentInlineStyle('backgroundColor') || (anchorEl?.style.backgroundColor) || '';

    this.storedFormat = {
      bold,
      italic,
      underline,
      strikethrough,
      fontSize: fontSize || undefined,
      fontFamily: fontFamily || undefined,
      color: (color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') ? color : undefined,
      backgroundColor: (backgroundColor && backgroundColor !== 'transparent' && backgroundColor !== 'rgba(0, 0, 0, 0)') ? backgroundColor : undefined
    };

    this.isFormatPainterActive = true;
    this.ctx.editable.classList.add('rye-format-painter-active');

    const onMouseUp = (e: MouseEvent) => {
      if (!this.ctx.editable.contains(e.target as Node)) {
        return;
      }

      setTimeout(() => {
        if (!this.isFormatPainterActive || !this.storedFormat) {
          this.deactivateFormatPainter();
          return;
        }

        let currentSel = window.getSelection();
        let currentRange: Range | null = (currentSel && currentSel.rangeCount > 0) ? currentSel.getRangeAt(0) : null;
        if (!currentRange || !this.ctx.editable.contains(currentRange.commonAncestorContainer)) {
          currentRange = this.ctx.selection.getRange();
        }

        if (currentRange && this.ctx.editable.contains(currentRange.commonAncestorContainer)) {
          this.applyStoredFormatToRange(currentRange, this.storedFormat);
        }

        this.deactivateFormatPainter();
      }, 15);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.deactivateFormatPainter();
      }
    };

    this.ctx.editable.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', onKeyDown);

    this.formatPainterCleanup = () => {
      this.ctx.editable.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('keydown', onKeyDown);
    };

    this.ctx.onStateChange?.();
  }

  deactivateFormatPainter(): void {
    if (this.formatPainterCleanup) {
      this.formatPainterCleanup();
      this.formatPainterCleanup = null;
    }
    this.isFormatPainterActive = false;
    this.storedFormat = null;
    this.ctx.editable.classList.remove('rye-format-painter-active');
    this.ctx.onStateChange?.();
  }

  isFormatPainting(): boolean {
    return this.isFormatPainterActive;
  }

  getStoredFormat(): StoredFormat | null {
    return this.storedFormat ? { ...this.storedFormat } : null;
  }

  private cleanExtractedFormatting(fragment: DocumentFragment): void {
    const formattingTags = ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del'];
    formattingTags.forEach(tag => {
      const els = Array.from(fragment.querySelectorAll(tag));
      els.forEach(el => {
        el.replaceWith(...Array.from(el.childNodes));
      });
    });

    const spans = Array.from(fragment.querySelectorAll('span'));
    spans.forEach(span => {
      if (span.classList.contains('rye-page-break') || span.classList.contains('rye-checklist-item')) {
        return;
      }
      span.style.removeProperty('font-weight');
      span.style.removeProperty('font-style');
      span.style.removeProperty('text-decoration');
      span.style.removeProperty('font-size');
      span.style.removeProperty('font-family');
      span.style.removeProperty('color');
      span.style.removeProperty('background-color');
      if ((!span.getAttribute('style') || span.getAttribute('style')?.trim() === '') && !span.className) {
        span.replaceWith(...Array.from(span.childNodes));
      }
    });
  }

  private isNodeBold(node: Node | null): boolean {
    let curr: HTMLElement | null = (node?.nodeType === Node.TEXT_NODE ? node.parentElement : node) as HTMLElement | null;
    while (curr && curr !== this.ctx.editable) {
      const tag = curr.tagName ? curr.tagName.toUpperCase() : '';
      if (tag === 'B' || tag === 'STRONG') return true;
      if (curr.style?.fontWeight === 'bold' || parseInt(curr.style?.fontWeight || '0', 10) >= 600) return true;
      curr = curr.parentElement;
    }
    return false;
  }

  private isNodeItalic(node: Node | null): boolean {
    let curr: HTMLElement | null = (node?.nodeType === Node.TEXT_NODE ? node.parentElement : node) as HTMLElement | null;
    while (curr && curr !== this.ctx.editable) {
      const tag = curr.tagName ? curr.tagName.toUpperCase() : '';
      if (tag === 'I' || tag === 'EM') return true;
      if (curr.style?.fontStyle === 'italic') return true;
      curr = curr.parentElement;
    }
    return false;
  }

  private isNodeUnderline(node: Node | null): boolean {
    let curr: HTMLElement | null = (node?.nodeType === Node.TEXT_NODE ? node.parentElement : node) as HTMLElement | null;
    while (curr && curr !== this.ctx.editable) {
      const tag = curr.tagName ? curr.tagName.toUpperCase() : '';
      if (tag === 'U') return true;
      if (curr.style?.textDecoration?.includes('underline')) return true;
      curr = curr.parentElement;
    }
    return false;
  }

  private createStyledSpan(format: StoredFormat, content: Node | DocumentFragment, contextNode?: Node): HTMLElement {
    const span = document.createElement('span');

    const targetIsBold = contextNode ? this.isNodeBold(contextNode) : false;
    if (format.bold) {
      span.style.fontWeight = 'bold';
    } else if (targetIsBold) {
      span.style.fontWeight = 'normal';
    }

    const targetIsItalic = contextNode ? this.isNodeItalic(contextNode) : false;
    if (format.italic) {
      span.style.fontStyle = 'italic';
    } else if (targetIsItalic) {
      span.style.fontStyle = 'normal';
    }

    const decs: string[] = [];
    if (format.underline) decs.push('underline');
    if (format.strikethrough) decs.push('line-through');
    const targetIsUnderline = contextNode ? this.isNodeUnderline(contextNode) : false;
    if (decs.length > 0) {
      span.style.textDecoration = decs.join(' ');
    } else if (targetIsUnderline) {
      span.style.textDecoration = 'none';
    }

    if (format.fontSize) {
      span.style.fontSize = format.fontSize;
    }
    if (format.fontFamily) {
      span.style.fontFamily = format.fontFamily;
    }
    if (format.color) {
      span.style.color = format.color;
    }
    if (format.backgroundColor) {
      span.style.backgroundColor = format.backgroundColor;
    }

    span.appendChild(content);
    return span;
  }

  applyStoredFormatToRange(range: Range, format: StoredFormat): void {
    if (range.collapsed) {
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue || '';
        let start = range.startOffset;
        let end = range.startOffset;
        const isWordChar = (ch: string) => /[^\s.,!?;:()\[\]{}"'«»“”‘’]/.test(ch);
        while (start > 0 && isWordChar(text[start - 1])) start--;
        while (end < text.length && isWordChar(text[end])) end++;
        if (start < end) {
          range.setStart(node, start);
          range.setEnd(node, end);
        }
      }
    }

    if (range.collapsed) return;

    const contents = range.extractContents();
    this.cleanExtractedFormatting(contents);

    let parentNode: Node | null = range.startContainer;
    let parentEl: HTMLElement | null = parentNode.nodeType === Node.TEXT_NODE ? parentNode.parentElement : (parentNode instanceof HTMLElement ? parentNode : null);
    while (parentEl && parentEl !== this.ctx.editable && parentEl.nodeName === 'SPAN') {
      const nextParent: HTMLElement | null = parentEl.parentElement;
      if (!parentEl.textContent || parentEl.textContent.trim() === '') {
        const rangePoint = document.createRange();
        rangePoint.setStartBefore(parentEl);
        rangePoint.collapse(true);
        parentEl.remove();
        range = rangePoint;
        parentEl = nextParent;
      } else {
        break;
      }
    }

    const blocks = contents.querySelectorAll ? Array.from(contents.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li, blockquote, td, th')) : [];
    let insertedNode: Node;

    if (blocks.length > 0) {
      blocks.forEach(block => {
        if (block.childNodes.length > 0) {
          const frag = document.createDocumentFragment();
          while (block.firstChild) {
            frag.appendChild(block.firstChild);
          }
          const span = this.createStyledSpan(format, frag, block);
          block.appendChild(span);
        }
      });
      range.insertNode(contents);
      insertedNode = contents;
    } else {
      const span = this.createStyledSpan(format, contents, range.commonAncestorContainer);
      range.insertNode(span);
      insertedNode = span;
    }

    const sel = window.getSelection();
    if (sel && insertedNode) {
      const newRange = document.createRange();
      if (insertedNode instanceof HTMLElement) {
        newRange.selectNodeContents(insertedNode);
      } else if (insertedNode.firstChild && insertedNode.lastChild) {
        newRange.setStartBefore(insertedNode.firstChild);
        newRange.setEndAfter(insertedNode.lastChild);
      }
      sel.removeAllRanges();
      sel.addRange(newRange);
      this.ctx.selection.save();
    }

    if (range.commonAncestorContainer.normalize) {
      range.commonAncestorContainer.normalize();
    }

    this.ctx.history.record(true);
  }

  private applyCaseChange(type: 'uppercase' | 'lowercase' | 'capitalize'): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const text = sel.toString();
    let newText = text;
    if (type === 'uppercase') {
      newText = text.toLocaleUpperCase('tr-TR');
    } else if (type === 'lowercase') {
      newText = text.toLocaleLowerCase('tr-TR');
    } else if (type === 'capitalize') {
      newText = text.replace(/(^|\s)\S/g, l => l.toLocaleUpperCase('tr-TR'));
    }
    document.execCommand('insertText', false, newText);
    this.ctx.history.record(true);
  }
}
