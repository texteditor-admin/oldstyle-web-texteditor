import JSZip from 'jszip';
import mammoth from 'mammoth';

function getLocalName(node: Node): string {
  return ((node as Element).localName || (node as Element).nodeName?.split(':').pop() || '').toLowerCase();
}

function findXmlDescendants(container: Element, localName: string): Element[] {
  const target = localName.toLowerCase();
  const result: Element[] = [];
  const all = container.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    if (getLocalName(el) === target) {
      result.push(el);
    }
  }
  return result;
}

function findXmlDirectChild(container: Element, localName: string): Element | null {
  const target = localName.toLowerCase();
  for (let i = 0; i < container.childNodes.length; i++) {
    const node = container.childNodes[i];
    if (node.nodeType === Node.ELEMENT_NODE && getLocalName(node) === target) {
      return node as Element;
    }
  }
  return null;
}

function getXmlAttr(el: Element | null | undefined, attrName: string): string | null {
  if (!el || !el.attributes) return null;
  const target = attrName.toLowerCase();
  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes[i];
    const aLocal = (a.localName || a.name.split(':').pop() || '').toLowerCase();
    if (aLocal === target || a.name.toLowerCase() === target) {
      return a.value;
    }
  }
  return el.getAttribute(attrName) || el.getAttribute(`w:${attrName}`) || null;
}

export class ImportPlugin {
  private onHtmlLoaded: (html: string) => void;

  constructor(onHtmlLoaded: (html: string) => void) {
    this.onHtmlLoaded = onHtmlLoaded;
  }

  promptImportFile(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.docx,.doc,.html,.htm,.txt';
    input.style.display = 'none';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      await this.processFile(file);
    };

    document.body.appendChild(input);
    input.click();
    input.remove();
  }

  async processFile(file: File): Promise<void> {
    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const html = await this.convertDocxToHtml(arrayBuffer);
        if (html) {
          this.onHtmlLoaded(html);
        } else {
          alert('Word belgesinden metin okunamadı.');
        }
      } else if (ext === 'doc') {
        const arrayBuffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);

        // 1. Eğer dosya aslında PK (ZIP / DOCX) formatındaysa doğrudan OpenXML ayrıştır
        if (uint8[0] === 0x50 && uint8[1] === 0x4B) {
          const html = await this.convertDocxToHtml(arrayBuffer);
          if (html) {
            this.onHtmlLoaded(html);
            return;
          }
        }

        const text = await file.text();

        // 2. Eğer dosya HTML/XML tabanlı bir .doc ise doğrudan HTML parse et
        if (
          text.includes('<html') ||
          text.includes('<body') ||
          text.includes('xmlns:w') ||
          text.includes('class="Section1"') ||
          text.includes('<w:WordDocument')
        ) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          const content = doc.querySelector('.Section1')?.innerHTML || doc.body.innerHTML || text;
          this.onHtmlLoaded(content);
          return;
        }

        // 3. Mammoth dene
        try {
          const result = await mammoth.convertToHtml({ arrayBuffer });
          if (result && result.value) {
            this.onHtmlLoaded(result.value);
            return;
          }
        } catch {
          // Devam et
        }

        // 4. İkili (Binary) .doc dosyalarından metin ayıklama
        const cleanedText = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
        const paragraphs = cleanedText
          .split(/\r?\n\r?\n/)
          .filter(p => p.trim().length > 3)
          .map(p => `<p>${p.trim()}</p>`)
          .join('');

        if (paragraphs) {
          this.onHtmlLoaded(paragraphs);
        } else {
          alert('Eski ikili .doc dosyasından metin ayrıştırılamadı. Lütfen modern .docx veya .html formatında yükleyiniz.');
        }
      } else if (ext === 'html' || ext === 'htm') {
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const content = doc.body.innerHTML || text;
        this.onHtmlLoaded(content);
      } else if (ext === 'txt') {
        const text = await file.text();
        const paragraphs = text
          .split(/\r?\n\r?\n/)
          .filter(p => p.trim())
          .map(p => `<p>${p.replace(/\r?\n/g, '<br>')}</p>`)
          .join('');
        this.onHtmlLoaded(paragraphs || `<p>${text}</p>`);
      } else {
        alert('Desteklenmeyen dosya türü. Lütfen .docx, .doc, .html veya .txt dosyası seçiniz.');
      }
    } catch (err) {
      console.error('Dosya içe aktarılırken hata oluştu:', err);
      alert('Dosya içe aktarılırken bir hata oluştu: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  /**
   * Word (.docx) dosyasını doğrudan OpenXML yapısından çözümleyerek hizalamaları (Ortala, Sağa, İki Yana Yasla),
   * girintileri (1.25cm), satır/paragraf boşluklarını, punto, font, renk, vurgu, tablo ve sayfa sonlarını eksiksiz koruyarak HTML'e dönüştürür.
   */
  async convertDocxToHtml(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const docXmlFile = zip.file('word/document.xml');
      if (!docXmlFile) {
        throw new Error('word/document.xml bulunamadı');
      }

      const xmlText = await docXmlFile.async('text');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

      // 1. İlişkileri (Rels / Images) Çözümle
      const relsMap: Record<string, string> = {};
      try {
        const relsFile = zip.file('word/_rels/document.xml.rels');
        if (relsFile) {
          const relsXmlText = await relsFile.async('text');
          const relsDoc = parser.parseFromString(relsXmlText, 'application/xml');
          const relEls = Array.from(relsDoc.querySelectorAll('Relationship'));
          relEls.forEach(rel => {
            const id = rel.getAttribute('Id');
            const target = rel.getAttribute('Target');
            if (id && target) {
              const cleanTarget = target.startsWith('media/') ? target : `media/${target.split('/').pop()}`;
              relsMap[id] = cleanTarget;
            }
          });
        }
      } catch {}

      // 2. Resimleri Base64 Olarak Yükle
      const imageMap: Record<string, string> = {};
      for (const [id, target] of Object.entries(relsMap)) {
        try {
          const file = zip.file(`word/${target}`) || zip.file(target);
          if (file) {
            const base64 = await file.async('base64');
            const ext = target.split('.').pop()?.toLowerCase() || 'png';
            const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'gif' ? 'image/gif' : ext === 'svg' ? 'image/svg+xml' : 'image/png';
            imageMap[id] = `data:${mime};base64,${base64}`;
          }
        } catch {}
      }

      // 3. XML Elemanlarını HTML'e Dönüştür (w:sdt / İçerik Denetimlerini özyinelemeli aç)
      const root = xmlDoc.documentElement;
      const body = findXmlDescendants(root, 'body')[0] || root;
      let html = '';

      const blocks = this.collectDocumentBlocks(body);
      for (const block of blocks) {
        const local = getLocalName(block);

        if (local === 'p') {
          html += this.parseXmlParagraph(block, imageMap);
        } else if (local === 'tbl') {
          html += this.parseXmlTable(block, imageMap);
        }
      }

      return html || '<p><br></p>';
    } catch (err) {
      console.warn('[ImportPlugin] OpenXML doğrudan ayrıştırma başarısız oldu, Mammoth deneniyor:', err);
      const result = await mammoth.convertToHtml({ arrayBuffer });
      return result?.value || '<p><br></p>';
    }
  }

  /**
   * w:sdt (Structured Document Tags / İçerik Denetimleri) içine sarılmış paragrafları ve tabloları özyinelemeli çıkarır
   */
  private collectDocumentBlocks(container: Element): Element[] {
    const blocks: Element[] = [];
    const children = Array.from(container.childNodes).filter(
      n => n.nodeType === Node.ELEMENT_NODE
    ) as Element[];

    for (const child of children) {
      const local = getLocalName(child);
      if (local === 'p' || local === 'tbl') {
        blocks.push(child);
      } else if (local === 'sdt') {
        const contentEl = findXmlDescendants(child, 'sdtContent')[0];
        if (contentEl) {
          blocks.push(...this.collectDocumentBlocks(contentEl));
        }
      } else if (local === 'customxml') {
        blocks.push(...this.collectDocumentBlocks(child));
      }
    }

    return blocks;
  }

  /**
   * w:p (Paragraf) elemanını ayrıştırıp HTML'e dönüştürür.
   * Sayfa sonlarını (w:br type="page", w:lastRenderedPageBreak, w:pageBreakBefore, w:sectPr)
   * tam olarak bulunduğu noktalardan bölerek yeni A4 sayfalarına dağıtır.
   */
  private parseXmlParagraph(pEl: Element, imageMap: Record<string, string>): string {
    const pPr = findXmlDirectChild(pEl, 'pPr') || findXmlDescendants(pEl, 'pPr')[0];
    const pStyles: string[] = [];
    let tag = 'p';
    let hasPageBreakBefore = false;

    // Paragraf düzeyi varsayılan run stilleri (w:pPr > w:rPr)
    const defaultRunProps: any = {};

    if (pPr) {
      // 0. Sayfa Sonu Kontrolü (w:pageBreakBefore)
      if (findXmlDescendants(pPr, 'pageBreakBefore').length > 0) {
        hasPageBreakBefore = true;
      }

      // 1. Hizalama (w:jc)
      const jcEl = findXmlDescendants(pPr, 'jc')[0];
      if (jcEl) {
        const jcVal = (getXmlAttr(jcEl, 'val') || '').toLowerCase();
        if (jcVal === 'center') pStyles.push('text-align: center');
        else if (jcVal === 'right' || jcVal === 'end') pStyles.push('text-align: right');
        else if (jcVal === 'both' || jcVal === 'justify' || jcVal === 'distribute') pStyles.push('text-align: justify');
        else if (jcVal === 'left' || jcVal === 'start') pStyles.push('text-align: left');
      }

      // 2. İlk Satır ve Sol Girintiler (w:ind)
      const indEl = findXmlDescendants(pPr, 'ind')[0];
      if (indEl) {
        const firstLine = getXmlAttr(indEl, 'firstLine');
        if (firstLine) {
          const flVal = parseInt(firstLine, 10);
          if (flVal > 0) {
            const cm = (flVal >= 700 && flVal <= 715) ? '1.25' : (flVal / 567).toFixed(2);
            pStyles.push(`text-indent: ${cm}cm`);
          }
        }

        const left = getXmlAttr(indEl, 'left');
        if (left) {
          const leftVal = parseInt(left, 10);
          if (leftVal > 0) {
            const cm = (leftVal / 567).toFixed(2);
            pStyles.push(`margin-left: ${cm}cm`);
          }
        }

        const hanging = getXmlAttr(indEl, 'hanging');
        if (hanging) {
          const hangingVal = parseInt(hanging, 10);
          if (hangingVal > 0) {
            const cm = (hangingVal / 567).toFixed(2);
            pStyles.push(`text-indent: -${cm}cm`);
          }
        }
      }

      // 3. Satır Aralığı ve Paragraf Boşlukları (w:spacing)
      const spacingEl = findXmlDescendants(pPr, 'spacing')[0];
      if (spacingEl) {
        const after = getXmlAttr(spacingEl, 'after');
        if (after !== null) {
          const afterVal = parseInt(after, 10);
          if (!isNaN(afterVal)) {
            const pt = Math.round(afterVal / 20);
            pStyles.push(`margin-bottom: ${pt}pt`);
          }
        }

        const before = getXmlAttr(spacingEl, 'before');
        if (before !== null) {
          const beforeVal = parseInt(before, 10);
          if (!isNaN(beforeVal) && beforeVal > 0) {
            const pt = Math.round(beforeVal / 20);
            pStyles.push(`margin-top: ${pt}pt`);
          }
        }

        const line = getXmlAttr(spacingEl, 'line');
        const lineRule = (getXmlAttr(spacingEl, 'lineRule') || 'auto').toLowerCase();
        if (line !== null) {
          const lineVal = parseInt(line, 10);
          if (!isNaN(lineVal)) {
            if (lineRule === 'exact' || lineRule === 'atleast') {
              const pt = Math.round(lineVal / 20);
              pStyles.push(`line-height: ${pt}pt`);
            } else {
              const multiplier = (lineVal / 240).toFixed(2).replace(/\.00$/, '').replace(/0$/, '');
              pStyles.push(`line-height: ${multiplier}`);
            }
          }
        }
      }

      // 4. Paragraf Düzeyi Varsayılan Run Özellikleri (w:pPr > w:rPr)
      const prPrEl = findXmlDescendants(pPr, 'rPr')[0];
      if (prPrEl) {
        const b = findXmlDescendants(prPrEl, 'b')[0] || findXmlDescendants(prPrEl, 'bCs')[0];
        if (b) {
          const val = (getXmlAttr(b, 'val') || 'true').toLowerCase();
          if (val !== '0' && val !== 'false') defaultRunProps.bold = true;
        }

        const sz = findXmlDescendants(prPrEl, 'sz')[0] || findXmlDescendants(prPrEl, 'szCs')[0];
        if (sz) {
          const val = getXmlAttr(sz, 'val');
          if (val) defaultRunProps.fontSize = `${Math.round(parseFloat(val) / 2)}pt`;
        }

        const fonts = findXmlDescendants(prPrEl, 'rFonts')[0];
        if (fonts) {
          const fName = getXmlAttr(fonts, 'ascii') || getXmlAttr(fonts, 'hAnsi');
          if (fName) defaultRunProps.fontFamily = fName;
        }

        const col = findXmlDescendants(prPrEl, 'color')[0];
        if (col) {
          const hex = getXmlAttr(col, 'val');
          if (hex && hex !== 'auto') defaultRunProps.color = `#${hex.toUpperCase()}`;
        }
      }

      // 5. Başlık Stilleri (w:pStyle)
      const pStyleEl = findXmlDescendants(pPr, 'pStyle')[0];
      if (pStyleEl) {
        const sVal = (getXmlAttr(pStyleEl, 'val') || '').toLowerCase();
        if (sVal.includes('heading1') || sVal.includes('baslik1')) tag = 'h1';
        else if (sVal.includes('heading2') || sVal.includes('baslik2')) tag = 'h2';
        else if (sVal.includes('heading3') || sVal.includes('baslik3')) tag = 'h3';
      }

      // 6. Liste Kontrolü (w:numPr)
      const numPr = findXmlDescendants(pPr, 'numPr')[0];
      if (numPr && !pStyles.some(s => s.startsWith('margin-left'))) {
        pStyles.push('margin-left: 1.25cm');
      }
    }

    // Paragraf içindeki düğümleri (runs, hyperlinks, sdt) topla
    const runsList: Element[] = [];
    const collectRuns = (node: Element) => {
      const children = Array.from(node.childNodes).filter(n => n.nodeType === Node.ELEMENT_NODE) as Element[];
      for (const child of children) {
        const local = getLocalName(child);
        if (local === 'r' || local === 'hyperlink') {
          runsList.push(child);
        } else if (local === 'sdt') {
          const content = findXmlDescendants(child, 'sdtContent')[0];
          if (content) collectRuns(content);
        }
      }
    };
    collectRuns(pEl);

    // Run'ları sayfa sonlarına göre segmentlere ayır
    const segments: string[][] = [[]];

    for (const r of runsList) {
      const local = getLocalName(r);

      // Sayfa sonu kontrolleri (w:br type="page", w:lastRenderedPageBreak)
      const brs = findXmlDescendants(r, 'br');
      const hasPageBr = brs.some(b => (getXmlAttr(b, 'type') || '').toLowerCase() === 'page');
      const hasLastRendered = findXmlDescendants(r, 'lastRenderedPageBreak').length > 0;

      if (hasPageBr || hasLastRendered) {
        // Yeni bir sayfa segmenti başlat
        segments.push([]);
      }

      let runHtml = '';
      if (local === 'r') {
        runHtml = this.parseXmlRun(r, imageMap, defaultRunProps);
      } else if (local === 'hyperlink') {
        const subRuns = findXmlDescendants(r, 'r');
        let linkContent = '';
        subRuns.forEach(sub => {
          linkContent += this.parseXmlRun(sub, imageMap, defaultRunProps);
        });
        runHtml = `<a href="#">${linkContent || 'Link'}</a>`;
      }

      if (runHtml) {
        segments[segments.length - 1].push(runHtml);
      }
    }

    const styleAttr = pStyles.length > 0 ? ` style="${pStyles.join('; ')};"` : '';
    const parts: string[] = [];

    if (hasPageBreakBefore) {
      parts.push('<div class="rye-page-break" contenteditable="false"></div>');
    }

    segments.forEach((seg, idx) => {
      if (idx > 0) {
        parts.push('<div class="rye-page-break" contenteditable="false"></div>');
      }
      const segHtml = seg.join('');
      if (segHtml && segHtml.trim()) {
        parts.push(`<${tag}${styleAttr}>${segHtml}</${tag}>`);
      } else if (segments.length === 1 && !hasPageBreakBefore) {
        parts.push(`<${tag}${styleAttr}><br></${tag}>`);
      }
    });

    // Bölüm sonu (w:sectPr) kontrolü
    if (pPr) {
      const sectPr = findXmlDescendants(pPr, 'sectPr')[0];
      if (sectPr) {
        const typeEl = findXmlDescendants(sectPr, 'type')[0];
        const typeVal = (getXmlAttr(typeEl || sectPr, 'val') || '').toLowerCase();
        if (typeVal !== 'continuous') {
          parts.push('<div class="rye-page-break" contenteditable="false"></div>');
        }
      }
    }

    return parts.join('\n');
  }

  /**
   * w:r (Run) elemanını biçim özellikleriyle birlikte HTML'e dönüştürür
   */
  private parseXmlRun(rEl: Element, imageMap: Record<string, string>, defaultProps: any = {}): string {
    const rPr = findXmlDirectChild(rEl, 'rPr') || findXmlDescendants(rEl, 'rPr')[0];
    let isBold = defaultProps.bold || false;
    let isItalic = defaultProps.italic || false;
    let isUnderline = false;
    let isStrike = false;
    let isSub = false;
    let isSup = false;
    const runStyles: string[] = [];

    let fontSize = defaultProps.fontSize || null;
    let fontFamily = defaultProps.fontFamily || null;
    let fontColor = defaultProps.color || null;
    let bgColor: string | null = null;

    if (rPr) {
      // Kalınlık
      const bEl = findXmlDescendants(rPr, 'b')[0] || findXmlDescendants(rPr, 'bCs')[0];
      if (bEl) {
        const val = (getXmlAttr(bEl, 'val') || 'true').toLowerCase();
        isBold = val !== '0' && val !== 'false';
      }

      // İtalik
      const iEl = findXmlDescendants(rPr, 'i')[0] || findXmlDescendants(rPr, 'iCs')[0];
      if (iEl) {
        const val = (getXmlAttr(iEl, 'val') || 'true').toLowerCase();
        isItalic = val !== '0' && val !== 'false';
      }

      // Altı Çizili
      const uEl = findXmlDescendants(rPr, 'u')[0];
      if (uEl) {
        const val = (getXmlAttr(uEl, 'val') || 'single').toLowerCase();
        if (val !== 'none') isUnderline = true;
      }

      // Üstü Çizili
      const strikeEl = findXmlDescendants(rPr, 'strike')[0] || findXmlDescendants(rPr, 'dstrike')[0];
      if (strikeEl) {
        const val = (getXmlAttr(strikeEl, 'val') || 'true').toLowerCase();
        if (val !== '0' && val !== 'false') isStrike = true;
      }

      // Alt Simge / Üst Simge (Subscript / Superscript)
      const vertAlignEl = findXmlDescendants(rPr, 'vertAlign')[0];
      if (vertAlignEl) {
        const val = (getXmlAttr(vertAlignEl, 'val') || '').toLowerCase();
        if (val === 'subscript') isSub = true;
        else if (val === 'superscript') isSup = true;
      }

      // Font Boyutu (w:sz, w:szCs) -> Yarım punto cinsindendir (örn: 28 = 14pt)
      const szEl = findXmlDescendants(rPr, 'sz')[0] || findXmlDescendants(rPr, 'szCs')[0];
      if (szEl) {
        const val = getXmlAttr(szEl, 'val');
        if (val) {
          const pt = Math.round(parseFloat(val) / 2);
          fontSize = `${pt}pt`;
        }
      }

      // Font Ailesi (w:rFonts)
      const fontEl = findXmlDescendants(rPr, 'rFonts')[0];
      if (fontEl) {
        const fontName = getXmlAttr(fontEl, 'ascii') || getXmlAttr(fontEl, 'hAnsi');
        if (fontName) {
          fontFamily = fontName;
        }
      }

      // Yazı Rengi (w:color)
      const colorEl = findXmlDescendants(rPr, 'color')[0];
      if (colorEl) {
        const hex = getXmlAttr(colorEl, 'val');
        if (hex && hex !== 'auto') {
          fontColor = `#${hex.toUpperCase()}`;
        }
      }

      // Vurgu / Arka Plan Rengi (w:highlight / w:shd)
      const shdEl = findXmlDescendants(rPr, 'shd')[0];
      if (shdEl) {
        const fill = getXmlAttr(shdEl, 'fill');
        if (fill && fill !== 'auto' && fill !== 'none' && fill !== '00000000') {
          bgColor = `#${fill.toUpperCase()}`;
        }
      }

      const hlEl = findXmlDescendants(rPr, 'highlight')[0];
      if (hlEl) {
        const hlVal = (getXmlAttr(hlEl, 'val') || '').toLowerCase();
        if (hlVal && hlVal !== 'none') {
          const hlColorMap: Record<string, string> = {
            yellow: '#FFFF00',
            green: '#00FF00',
            cyan: '#00FFFF',
            magenta: '#FF00FF',
            blue: '#0000FF',
            red: '#FF0000',
            darkblue: '#000080',
            darkcyan: '#008080',
            darkgreen: '#008000',
            darkmagenta: '#800080',
            darkred: '#800000',
            darkyellow: '#808000',
            darkgray: '#808080',
            lightgray: '#D3D3D3',
            black: '#000000'
          };
          bgColor = hlColorMap[hlVal] || hlVal;
        }
      }
    }

    if (fontSize) runStyles.push(`font-size: ${fontSize}`);
    if (fontFamily) runStyles.push(`font-family: ${fontFamily}`);
    if (fontColor) runStyles.push(`color: ${fontColor}`);
    if (bgColor) runStyles.push(`background-color: ${bgColor}`);

    let textContent = '';
    const childNodes = Array.from(rEl.childNodes);

    for (const child of childNodes) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const childEl = child as Element;
      const local = getLocalName(childEl);

      if (local === 't') {
        const txt = childEl.textContent || '';
        textContent += txt
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      } else if (local === 'br') {
        const brType = getXmlAttr(childEl, 'type');
        if (brType !== 'page') {
          textContent += '<br>';
        }
      } else if (local === 'drawing') {
        const blip = findXmlDescendants(childEl, 'blip')[0];
        if (blip) {
          const embedId = getXmlAttr(blip, 'embed') || getXmlAttr(blip, 'id') || '';
          if (embedId && imageMap[embedId]) {
            textContent += `<img src="${imageMap[embedId]}" style="max-width: 100%; height: auto;" />`;
          }
        }
      }
    }

    if (!textContent) return '';

    let res = textContent;
    if (isBold) res = `<strong>${res}</strong>`;
    if (isItalic) res = `<em>${res}</em>`;
    if (isUnderline) res = `<u>${res}</u>`;
    if (isStrike) res = `<s>${res}</s>`;
    if (isSub) res = `<sub>${res}</sub>`;
    if (isSup) res = `<sup>${res}</sup>`;

    if (runStyles.length > 0) {
      res = `<span style="${runStyles.join('; ')};">${res}</span>`;
    }

    return res;
  }

  /**
   * w:tbl (Tablo) elemanını ayrıştırıp HTML'e dönüştürür
   */
  private parseXmlTable(tblEl: Element, imageMap: Record<string, string>): string {
    let tblStyles = 'width: 100%; border-collapse: collapse; margin-bottom: 12pt;';

    // Tablo Hizalaması (w:tblPr > w:jc)
    const tblPr = findXmlDirectChild(tblEl, 'tblPr') || findXmlDescendants(tblEl, 'tblPr')[0];
    if (tblPr) {
      const jcEl = findXmlDescendants(tblPr, 'jc')[0];
      if (jcEl) {
        const jcVal = (getXmlAttr(jcEl, 'val') || '').toLowerCase();
        if (jcVal === 'center') tblStyles += ' margin-left: auto; margin-right: auto;';
        else if (jcVal === 'right') tblStyles += ' margin-left: auto; margin-right: 0;';
      }
    }

    let tblHtml = `<table style="${tblStyles}">`;

    const rows = findXmlDescendants(tblEl, 'tr');
    rows.forEach((tr, rIdx) => {
      tblHtml += '<tr>';
      const cells = findXmlDescendants(tr, 'tc');
      cells.forEach(tc => {
        const tcPr = findXmlDirectChild(tc, 'tcPr') || findXmlDescendants(tc, 'tcPr')[0];
        const cellStyles: string[] = [
          'border: 1px solid #000',
          'padding: 6px 10px',
          'vertical-align: top'
        ];
        let colSpanAttr = '';

        if (tcPr) {
          // Hücre Arka Planı
          const shd = findXmlDescendants(tcPr, 'shd')[0];
          if (shd) {
            const fill = getXmlAttr(shd, 'fill');
            if (fill && fill !== 'auto' && fill !== 'none' && fill !== '00000000') {
              cellStyles.push(`background-color: #${fill.toUpperCase()}`);
            }
          }

          // Hücre Genişliği
          const tcW = findXmlDescendants(tcPr, 'tcW')[0];
          if (tcW) {
            const wVal = getXmlAttr(tcW, 'w');
            const wType = getXmlAttr(tcW, 'type');
            if (wVal && wType === 'dxa') {
              const pt = Math.round(parseInt(wVal, 10) / 20);
              cellStyles.push(`width: ${pt}pt`);
            }
          }

          // Colspan
          const gridSpan = findXmlDescendants(tcPr, 'gridSpan')[0];
          if (gridSpan) {
            const spanVal = getXmlAttr(gridSpan, 'val');
            if (spanVal && parseInt(spanVal, 10) > 1) {
              colSpanAttr = ` colspan="${spanVal}"`;
            }
          }

          // Dikey Hizalama
          const vAlign = findXmlDescendants(tcPr, 'vAlign')[0];
          if (vAlign) {
            const vVal = (getXmlAttr(vAlign, 'val') || '').toLowerCase();
            if (vVal === 'center') cellStyles[2] = 'vertical-align: middle';
            else if (vVal === 'bottom') cellStyles[2] = 'vertical-align: bottom';
          }
        }

        let cellContent = '';
        const pEls = findXmlDescendants(tc, 'p');
        pEls.forEach(p => {
          cellContent += this.parseXmlParagraph(p, imageMap);
        });

        const cellTag = (rIdx === 0 && findXmlDescendants(tr, 'tblHeader').length > 0) ? 'th' : 'td';
        tblHtml += `<${cellTag} style="${cellStyles.join('; ')};"${colSpanAttr}>${cellContent || '<p><br></p>'}</${cellTag}>`;
      });
      tblHtml += '</tr>';
    });

    tblHtml += '</table>';
    return tblHtml;
  }

  setupDropZone(element: HTMLElement): void {
    element.addEventListener('dragover', (e) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    });

    element.addEventListener('drop', async (e) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['docx', 'doc', 'html', 'htm', 'txt'].includes(ext || '')) {
        e.preventDefault();
        await this.processFile(file);
      }
    });
  }
}
