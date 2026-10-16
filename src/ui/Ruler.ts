import { CommandRegistry } from '../core/Commands';
import { SelectionManager } from '../core/Selection';

export interface LineAlignmentInfo {
  lineNumber: number;
  indentCm: number;
  leadingSpaces: number;
  isActive: boolean;
  isFirstLine: boolean;
}

export class Ruler {
  private commands: CommandRegistry;
  private selection: SelectionManager;
  private element: HTMLElement;
  private rulerBody!: HTMLElement;
  private sliderFirstLine!: HTMLElement;
  private sliderCurrentLine!: HTMLElement;
  private sliderLeft!: HTMLElement;
  private sliderRight!: HTMLElement;
  private guideLine!: HTMLElement;
  private lineTicksContainer!: HTMLElement;
  private lineBadge!: HTMLElement;

  // Sürgü değerleri (santimetre cinsinden)
  private firstLineCm: number = 1.25;
  private currentLineCm: number = 1.25;
  private activeLineNumber: number = 1;
  private leftIndentCm: number = 0;
  private rightIndentCm: number = 18;

  // Aktif sürükleme durumu
  private isDragging: boolean = false;
  private activeSlider: 'firstline' | 'currentline' | 'left' | 'right' | null = null;
  private dragStartX: number = 0;
  private initialSliderVal: number = 0;
  private activeTargetBlock: HTMLElement | null = null;

  // 1 cm kaç piksel (standart 96 DPI / 2.54 = ~37.795px)
  private pxPerCm: number = 37.79527559;

  constructor(commands: CommandRegistry, selection: SelectionManager) {
    this.commands = commands;
    this.selection = selection;
    this.element = this.createRulerElement();
    this.attachEventListeners();
  }

  getElement(): HTMLElement {
    return this.element;
  }

  getCurrentLineCm(): number {
    return this.currentLineCm;
  }

  getActiveLineNumber(): number {
    return this.activeLineNumber;
  }

  getSliderCurrentLine(): HTMLElement {
    return this.sliderCurrentLine;
  }

  getLineBadge(): HTMLElement {
    return this.lineBadge;
  }

  private createRulerElement(): HTMLElement {
    const rulerBar = document.createElement('div');
    rulerBar.className = 'rye-ruler-bar';

    const container = document.createElement('div');
    container.className = 'rye-ruler-container';

    // Sol Kenar Boşluğu (1.5 cm koyu alan - Yönetmelik 8. Madde)
    const marginLeft = document.createElement('div');
    marginLeft.className = 'rye-ruler-margin-left';
    marginLeft.title = 'Sol Kenar Boşluğu (1.5 cm)';
    marginLeft.innerHTML = `
      <span class="rye-ruler-num" style="right: 1cm;">1</span>
      <span class="rye-ruler-num" style="right: 0.1cm;">.</span>
    `;

    // Beyaz Çalışma Alanı (18 cm yazılabilir alan: 21cm - 1.5cm - 1.5cm)
    this.rulerBody = document.createElement('div');
    this.rulerBody.className = 'rye-ruler-body';

    // Ticks & Labels (1 - 18)
    for (let num = 1; num <= 18; num++) {
      const cmEl = document.createElement('div');
      cmEl.className = 'rye-ruler-cm';
      cmEl.style.left = `${num}cm`;
      cmEl.innerHTML = `
        <span class="rye-ruler-tick"></span>
        <span class="rye-ruler-label">${num}</span>
      `;
      this.rulerBody.appendChild(cmEl);
    }

    // Sürgü 1: İlk Satır Girintisi (Üst Üçgen ▽ - varsayılan 1.25 cm)
    this.sliderFirstLine = document.createElement('div');
    this.sliderFirstLine.className = 'rye-ruler-slider rye-slider-firstline';
    this.sliderFirstLine.style.left = `${this.firstLineCm}cm`;
    this.sliderFirstLine.title = `1. Satır Girintisi (${this.firstLineCm.toFixed(2)} cm)`;
    this.sliderFirstLine.innerHTML = `<div class="rye-slider-marker-down"></div>`;

    // Sürgü 1.5: Aktif Satır Hizası (Bulunulan Satırın İbresi ▼)
    this.sliderCurrentLine = document.createElement('div');
    this.sliderCurrentLine.className = 'rye-ruler-slider rye-slider-currentline';
    this.sliderCurrentLine.style.left = `${this.currentLineCm}cm`;
    this.sliderCurrentLine.title = `Aktif Satır (1. Satır): ${this.currentLineCm.toFixed(2)} cm`;
    this.sliderCurrentLine.innerHTML = `<div class="rye-slider-marker-active-down"></div>`;

    // Her satırın hizasını gösteren çentikler konteyneri
    this.lineTicksContainer = document.createElement('div');
    this.lineTicksContainer.className = 'rye-ruler-line-ticks';

    // Sürgü 2: Sol Kenar Girintisi (Alt Üçgen △ + Kutu □ - varsayılan 0 cm)
    this.sliderLeft = document.createElement('div');
    this.sliderLeft.className = 'rye-ruler-slider rye-slider-left';
    this.sliderLeft.style.left = `${this.leftIndentCm}cm`;
    this.sliderLeft.title = `Sol Kenar Girintisi (${this.leftIndentCm.toFixed(2)} cm)`;
    this.sliderLeft.innerHTML = `
      <div class="rye-slider-marker-up"></div>
      <div class="rye-slider-marker-box"></div>
    `;

    // Sürgü 3: Sağ Kenar Girintisi (Sağ Üçgen △ - varsayılan 18 cm)
    this.sliderRight = document.createElement('div');
    this.sliderRight.className = 'rye-ruler-slider rye-slider-right';
    this.sliderRight.style.left = `${this.rightIndentCm}cm`;
    this.sliderRight.title = `Sağ Kenar Girintisi (${this.rightIndentCm.toFixed(2)} cm)`;
    this.sliderRight.innerHTML = `<div class="rye-slider-marker-up"></div>`;

    // Kılavuz Çizgisi (Sürükleme anında cetvelden metne inen dikey çizgi)
    this.guideLine = document.createElement('div');
    this.guideLine.className = 'rye-ruler-guide-line';
    this.guideLine.style.display = 'none';

    this.rulerBody.appendChild(this.sliderFirstLine);
    this.rulerBody.appendChild(this.sliderCurrentLine);
    this.rulerBody.appendChild(this.sliderLeft);
    this.rulerBody.appendChild(this.sliderRight);
    this.rulerBody.appendChild(this.guideLine);
    this.rulerBody.appendChild(this.lineTicksContainer);

    // Sağ Kenar Boşluğu (1.5 cm koyu alan)
    const marginRight = document.createElement('div');
    marginRight.className = 'rye-ruler-margin-right';
    marginRight.title = 'Sağ Kenar Boşluğu (1.5 cm)';

    container.appendChild(marginLeft);
    container.appendChild(this.rulerBody);
    container.appendChild(marginRight);
    rulerBar.appendChild(container);

    // Aktif Satır Bilgi Rozeti (Satır 1: 1.25 cm)
    this.lineBadge = document.createElement('div');
    this.lineBadge.className = 'rye-ruler-line-badge';
    this.lineBadge.title = 'Aktif imleç satır hizası';
    this.lineBadge.innerHTML = `<span class="rye-ruler-badge-dot"></span><span class="rye-ruler-badge-text">Satır 1: 1.25 cm</span>`;
    rulerBar.appendChild(this.lineBadge);

    return rulerBar;
  }

  private attachEventListeners(): void {
    // Sürgü 1: İlk Satır Girintisi Mousedown
    this.sliderFirstLine.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.startDrag('firstline', e.clientX, this.firstLineCm);
    });

    // Sürgü 1.5: Aktif Satır Hizası Mousedown
    this.sliderCurrentLine.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.startDrag('currentline', e.clientX, this.currentLineCm);
    });

    // Sürgü 2: Sol Kenar Girintisi Mousedown
    this.sliderLeft.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.startDrag('left', e.clientX, this.leftIndentCm);
    });

    // Sürgü 3: Sağ Kenar Girintisi Mousedown
    this.sliderRight.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.startDrag('right', e.clientX, this.rightIndentCm);
    });

    // Cetvel Gövdesine Tıklanarak Hızlı Konumlandırma
    this.rulerBody.addEventListener('mousedown', (e) => {
      if (e.target !== this.rulerBody && !((e.target as HTMLElement).classList?.contains('rye-ruler-line-ticks'))) return;
      const rect = this.rulerBody.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickCm = Math.max(0, Math.min(16, clickX / this.getActualPxPerCm()));
      const roundedCm = parseFloat(clickCm.toFixed(2));

      // Üst yarıya tıklandıysa aktif satırın girintisini ayarla, alt yarıya tıklandıysa sol girintiyi ayarla
      const clickY = e.clientY - rect.top;
      if (clickY < rect.height / 2) {
        this.currentLineCm = roundedCm;
        if (this.sliderCurrentLine) {
          this.sliderCurrentLine.style.left = `${this.currentLineCm}cm`;
        }
        this.applyIndentToActiveLine(roundedCm);
      } else {
        this.leftIndentCm = roundedCm;
        this.sliderLeft.style.left = `${this.leftIndentCm}cm`;
        this.sliderLeft.title = `Sol Kenar Girintisi (${this.leftIndentCm.toFixed(2)} cm)`;
        this.applyIndentToActiveBlock('marginLeft', `${this.leftIndentCm}cm`);
      }
      this.updateFromSelection();
    });

    // Global Mousemove ve Mouseup
    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.handleDrag(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.stopDrag();
      }
    });
  }

  private getActualPxPerCm(): number {
    if (this.rulerBody && this.rulerBody.offsetWidth > 0) {
      return this.rulerBody.offsetWidth / 16;
    }
    return this.pxPerCm;
  }

  private getTargetBlock(): HTMLElement | null {
    const blocks = this.selection.getSelectedBlocks();
    if (blocks.length > 0) return blocks[0];

    const range = this.selection.getRange();
    if (range) {
      const node = range.startContainer instanceof HTMLElement
        ? range.startContainer
        : range.startContainer.parentElement;
      return node?.closest('p, h1, h2, h3, h4, div, li, td, th') as HTMLElement || null;
    }
    return null;
  }

  private startDrag(slider: 'firstline' | 'currentline' | 'left' | 'right', clientX: number, initialVal: number): void {
    this.isDragging = true;
    this.activeSlider = slider;
    this.dragStartX = clientX;
    this.initialSliderVal = initialVal;
    this.activeTargetBlock = this.getTargetBlock();

    // Kılavuz çizgisini göster
    this.guideLine.style.display = 'block';
    this.updateGuideLinePosition();
  }

  private handleDrag(clientX: number): void {
    if (!this.isDragging || !this.activeSlider) return;

    const pxPerCm = this.getActualPxPerCm();
    const deltaCm = (clientX - this.dragStartX) / pxPerCm;
    let newVal = this.initialSliderVal + deltaCm;

    // 0.05 cm hassasiyetinde adımla
    newVal = Math.round(newVal * 20) / 20;

    if (this.activeSlider === 'firstline') {
      newVal = Math.max(0, Math.min(18, newVal));
      this.firstLineCm = newVal;
      this.sliderFirstLine.style.left = `${newVal}cm`;
      this.sliderFirstLine.title = `1. Satır Girintisi (${newVal.toFixed(2)} cm)`;
      this.applyIndentToActiveBlock('textIndent', `${newVal}cm`);
    } else if (this.activeSlider === 'currentline') {
      newVal = Math.max(0, Math.min(18, newVal));
      this.currentLineCm = newVal;
      this.sliderCurrentLine.style.left = `${newVal}cm`;
      this.sliderCurrentLine.title = `Aktif Satır (${this.activeLineNumber}. Satır): ${newVal.toFixed(2)} cm`;
      if (this.lineBadge) {
        const badgeText = this.lineBadge.querySelector('.rye-ruler-badge-text');
        if (badgeText) badgeText.textContent = `Satır ${this.activeLineNumber}: ${newVal.toFixed(2)} cm`;
      }
      this.applyIndentToActiveLine(newVal);
    } else if (this.activeSlider === 'left') {
      newVal = Math.max(0, Math.min(17, newVal));
      this.leftIndentCm = newVal;
      this.sliderLeft.style.left = `${newVal}cm`;
      this.sliderLeft.title = `Sol Kenar Girintisi (${newVal.toFixed(2)} cm)`;
      this.applyIndentToActiveBlock('marginLeft', `${newVal}cm`);
    } else if (this.activeSlider === 'right') {
      newVal = Math.max(1, Math.min(18, newVal));
      this.rightIndentCm = newVal;
      this.sliderRight.style.left = `${newVal}cm`;
      this.sliderRight.title = `Sağ Kenar Girintisi (${newVal.toFixed(2)} cm)`;
      const rightMarginCm = (18 - newVal).toFixed(2);
      this.applyIndentToActiveBlock('marginRight', `${rightMarginCm}cm`);
    }

    this.updateGuideLinePosition();
  }

  private stopDrag(): void {
    this.isDragging = false;
    this.activeSlider = null;
    this.activeTargetBlock = null;
    this.guideLine.style.display = 'none';

    try {
      (this.commands as any).ctx?.history?.record(true);
    } catch {}
  }

  private updateGuideLinePosition(): void {
    if (!this.isDragging || !this.activeSlider) return;
    let cmPos = 0;
    if (this.activeSlider === 'firstline') cmPos = this.firstLineCm;
    else if (this.activeSlider === 'currentline') cmPos = this.currentLineCm;
    else if (this.activeSlider === 'left') cmPos = this.leftIndentCm;
    else if (this.activeSlider === 'right') cmPos = this.rightIndentCm;

    this.guideLine.style.left = `${cmPos}cm`;
  }

  private applyIndentToActiveBlock(prop: 'textIndent' | 'marginLeft' | 'marginRight', value: string): void {
    const block = this.activeTargetBlock || this.getTargetBlock();
    if (!block) return;

    if (prop === 'textIndent') {
      block.style.textIndent = value;
    } else if (prop === 'marginLeft') {
      block.style.marginLeft = value;
    } else if (prop === 'marginRight') {
      block.style.marginRight = value;
    }
  }

  private applyIndentToActiveLine(cm: number): void {
    const block = this.activeTargetBlock || this.getTargetBlock();
    if (!block) return;

    if (this.activeLineNumber === 1) {
      this.firstLineCm = cm;
      this.sliderFirstLine.style.left = `${cm}cm`;
      this.sliderFirstLine.title = `1. Satır Girintisi (${cm.toFixed(2)} cm)`;
      this.applyIndentToActiveBlock('textIndent', `${cm}cm`);
      return;
    }

    // Satır 2 veya sonrası: Bulunulan satırın başındaki boşlukları güncelle
    const neededSpaces = Math.max(0, Math.round((cm / 1.25) * 4));
    const newSpacesStr = '\u00A0'.repeat(neededSpaces);

    const brList = Array.from(block.querySelectorAll('br'));
    if (brList.length >= this.activeLineNumber - 1) {
      const prevBr = brList[this.activeLineNumber - 2];
      if (prevBr) {
        let textNode = prevBr.nextSibling;
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          const oldText = textNode.textContent || '';
          const trimmed = oldText.replace(/^[\s\u00A0]+/, '');
          textNode.textContent = newSpacesStr + trimmed;
        } else {
          const newText = document.createTextNode(newSpacesStr);
          prevBr.after(newText);
        }
      }
    }
  }

  /**
   * Hedef bloğun içindeki satırları analiz eder ve her satırın hizasını hesaplar.
   */
  public analyzeLines(target: HTMLElement): { lines: LineAlignmentInfo[]; activeLineNumber: number } {
    const range = this.selection.getRange();
    let activeLineNumber = 1;

    const brList = Array.from(target.querySelectorAll('br'));

    if (range) {
      const cursorNode = range.startContainer;
      const cursorOffset = range.startOffset;

      let brBeforeCursor = 0;
      if (cursorNode === target) {
        for (let i = 0; i < cursorOffset && i < target.childNodes.length; i++) {
          if (target.childNodes[i].nodeName === 'BR') {
            brBeforeCursor++;
          }
        }
      } else {
        for (const br of brList) {
          const pos = br.compareDocumentPosition(cursorNode);
          if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
            brBeforeCursor++;
          } else if (br === cursorNode && cursorOffset > 0) {
            brBeforeCursor++;
          }
        }
      }
      activeLineNumber = brBeforeCursor + 1;
    }

    const textIndentRaw = target.style.textIndent || (typeof window !== 'undefined' ? window.getComputedStyle(target).textIndent : '');
    const blockTextIndentCm = this.parseDimensionToCm(textIndentRaw);

    const marginLeftRaw = target.style.marginLeft || (typeof window !== 'undefined' ? window.getComputedStyle(target).marginLeft : '');
    const blockMarginLeftCm = this.parseDimensionToCm(marginLeftRaw);

    const lines: LineAlignmentInfo[] = [];

    if (brList.length === 0) {
      const text = target.textContent || '';
      let spaces = 0;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === ' ' || ch === '\u00A0' || ch === '\t') spaces++;
        else break;
      }

      let isFirst = true;
      if (typeof window !== 'undefined' && range && target.getBoundingClientRect) {
        try {
          const rRect = range.getBoundingClientRect();
          const tRect = target.getBoundingClientRect();
          if (rRect.height > 0 && tRect.height > 0) {
            const cs = window.getComputedStyle(target);
            const lh = parseFloat(cs.lineHeight) || 20;
            const visualLine = Math.max(1, Math.floor((rRect.top - tRect.top + 4) / lh) + 1);
            if (visualLine > 1) {
              activeLineNumber = visualLine;
              isFirst = false;
            }
          }
        } catch {}
      }

      const indentCm = isFirst
        ? blockTextIndentCm + (spaces / 4) * 1.25
        : blockMarginLeftCm + (spaces / 4) * 1.25;

      lines.push({
        lineNumber: 1,
        indentCm: Math.round(indentCm * 100) / 100,
        leadingSpaces: spaces,
        isActive: activeLineNumber === 1,
        isFirstLine: true
      });

      if (activeLineNumber > 1) {
        lines.push({
          lineNumber: activeLineNumber,
          indentCm: Math.round(blockMarginLeftCm * 100) / 100,
          leadingSpaces: 0,
          isActive: true,
          isFirstLine: false
        });
      }
    } else {
      const lineNodes: Node[][] = [];
      let currentLineNodes: Node[] = [];

      const walk = (node: Node) => {
        if (node.nodeName === 'BR') {
          lineNodes.push(currentLineNodes);
          currentLineNodes = [];
        } else if (node.nodeType === Node.TEXT_NODE) {
          currentLineNodes.push(node);
        } else if (node.hasChildNodes()) {
          node.childNodes.forEach(child => walk(child));
        }
      };

      walk(target);
      lineNodes.push(currentLineNodes);

      lineNodes.forEach((nodes, idx) => {
        const lineNum = idx + 1;
        const lineText = nodes.map(n => n.textContent || '').join('');
        let spaces = 0;
        for (let i = 0; i < lineText.length; i++) {
          const ch = lineText[i];
          if (ch === ' ' || ch === '\u00A0' || ch === '\t') spaces++;
          else break;
        }

        const isFirst = (lineNum === 1);
        const indentCm = isFirst
          ? blockTextIndentCm + (spaces / 4) * 1.25
          : blockMarginLeftCm + (spaces / 4) * 1.25;

        lines.push({
          lineNumber: lineNum,
          indentCm: Math.round(indentCm * 100) / 100,
          leadingSpaces: spaces,
          isActive: (lineNum === activeLineNumber),
          isFirstLine: isFirst
        });
      });
    }

    return { lines, activeLineNumber };
  }

  /**
   * Editörde imlecin bulunduğu paragrafa ve aktif satıra göre cetvel sürgülerini senkronize eder.
   */
  updateFromSelection(block?: HTMLElement | null): void {
    if (this.isDragging) return;

    const target = block || this.getTargetBlock();
    if (!target) return;

    // 1. Blok seviyesi İlk Satır Girintisi (text-indent)
    const textIndentRaw = target.style.textIndent || (typeof window !== 'undefined' ? window.getComputedStyle(target).textIndent : '');
    const textIndentCm = this.parseDimensionToCm(textIndentRaw);
    if (!isNaN(textIndentCm)) {
      this.firstLineCm = Math.max(0, Math.min(16, textIndentCm));
      this.sliderFirstLine.style.left = `${this.firstLineCm}cm`;
      this.sliderFirstLine.title = `1. Satır Girintisi (${this.firstLineCm.toFixed(2)} cm)`;
    }

    // 2. Sol Girinti (margin-left)
    const marginLeftRaw = target.style.marginLeft || (typeof window !== 'undefined' ? window.getComputedStyle(target).marginLeft : '');
    const marginLeftCm = this.parseDimensionToCm(marginLeftRaw);
    if (!isNaN(marginLeftCm)) {
      this.leftIndentCm = Math.max(0, Math.min(17, marginLeftCm));
      this.sliderLeft.style.left = `${this.leftIndentCm}cm`;
      this.sliderLeft.title = `Sol Kenar Girintisi (${this.leftIndentCm.toFixed(2)} cm)`;
    }

    // 3. Sağ Girinti (margin-right)
    const marginRightRaw = target.style.marginRight || (typeof window !== 'undefined' ? window.getComputedStyle(target).marginRight : '');
    const marginRightCm = this.parseDimensionToCm(marginRightRaw);
    if (!isNaN(marginRightCm)) {
      this.rightIndentCm = Math.max(1, Math.min(18, 18 - marginRightCm));
      this.sliderRight.style.left = `${this.rightIndentCm}cm`;
      this.sliderRight.title = `Sağ Kenar Girintisi (${this.rightIndentCm.toFixed(2)} cm)`;
    }

    // 4. SATIR BAZINDA CETVEL HİZALAMA ANALİZİ (HER SATIRIN HİZASI AYRI AYRI)
    const { lines, activeLineNumber } = this.analyzeLines(target);
    this.activeLineNumber = activeLineNumber;

    const activeLine = lines.find(l => l.isActive) || lines[0];
    this.currentLineCm = activeLine ? activeLine.indentCm : this.firstLineCm;

    // Aktif satır sürgüsünü güncelle
    if (this.sliderCurrentLine) {
      this.sliderCurrentLine.style.left = `${this.currentLineCm}cm`;
      this.sliderCurrentLine.title = `Aktif Satır (${activeLineNumber}. Satır): ${this.currentLineCm.toFixed(2)} cm`;
    }

    // Cetvel Satır Bilgi Rozetini güncelle
    if (this.lineBadge) {
      const badgeText = this.lineBadge.querySelector('.rye-ruler-badge-text');
      if (badgeText) {
        badgeText.textContent = `Satır ${activeLineNumber}: ${this.currentLineCm.toFixed(2)} cm`;
      } else {
        this.lineBadge.textContent = `Satır ${activeLineNumber}: ${this.currentLineCm.toFixed(2)} cm`;
      }
    }

    // Her satırın hizasını cetvel üzerinde ayrı ayrı çentikler (markers) halinde göster
    if (this.lineTicksContainer) {
      this.lineTicksContainer.innerHTML = '';
      if (lines.length > 1) {
        lines.forEach(line => {
          const tickEl = document.createElement('div');
          tickEl.className = `rye-ruler-line-tick ${line.isActive ? 'is-active' : ''}`;
          tickEl.style.left = `${line.indentCm}cm`;
          tickEl.title = `${line.lineNumber}. Satır Hizası: ${line.indentCm.toFixed(2)} cm`;
          tickEl.innerHTML = `<span class="rye-ruler-line-label">S${line.lineNumber}</span>`;
          this.lineTicksContainer.appendChild(tickEl);
        });
      }
    }
  }

  private parseDimensionToCm(val: string): number {
    if (!val || val === 'normal') return 0;
    val = val.trim();
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
      return parseFloat(val) / this.getActualPxPerCm();
    }
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num / this.getActualPxPerCm();
  }
}

