import JSZip from 'jszip';
import { PrintManager } from '../utils/PrintManager';

export interface ImageExportItem {
  id: string;
  target: string;
  data: string; // base64
  ext: string;
  mime: string;
}

export class ExportPlugin {
  /**
   * Belgeyi standart Microsoft Word OpenXML (.docx) formatında dışa aktarır.
   * A4 kağıt ebadı (210x297mm), 2.5cm kenar boşlukları, Times New Roman yazı tipi,
   * paragraflar, tablolar, girintiler, hizalamalar ve renkleri eksiksiz korur.
   */
  static async exportToDocx(contentHtml: string, filename: string = 'resmi_yazi_belgesi.docx'): Promise<void> {
    const { docXml, mediaFiles } = ExportPlugin.htmlToDocxXml(contentHtml);

    const zip = new JSZip();

    // 1. [Content_Types].xml
    let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="gif" ContentType="image/gif"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
    zip.file('[Content_Types].xml', contentTypesXml);

    // 2. _rels/.rels
    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

    // 3. word/_rels/document.xml.rels
    let docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`;

    mediaFiles.forEach(media => {
      docRelsXml += `\n  <Relationship Id="${media.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${media.target}"/>`;
      zip.file(`word/${media.target}`, media.data, { base64: true });
    });

    docRelsXml += '\n</Relationships>';
    zip.file('word/_rels/document.xml.rels', docRelsXml);

    // 4. word/styles.xml
    zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
        <w:color w:val="000000"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="160" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Normal" w:default="1">
    <w:name w:val="Normal"/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:ind w:left="720"/>
      <w:spacing w:after="80" w:line="240" w:lineRule="auto"/>
    </w:pPr>
  </w:style>
</w:styles>`);

    // 5. word/document.xml
    zip.file('word/document.xml', docXml);

    const blob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    const cleanFilename = filename.endsWith('.docx') ? filename : `${filename.replace(/\.doc$/i, '')}.docx`;
    ExportPlugin.downloadBlob(blob, cleanFilename);
  }

  /**
   * HTML içeriğini OpenXML WordprocessingML yapısına dönüştürür
   */
  public static htmlToDocxXml(html: string): { docXml: string; mediaFiles: ImageExportItem[] } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const rootContainer = doc.body.firstElementChild || doc.body;

    const mediaFiles: ImageExportItem[] = [];
    let imageCounter = 0;

    // Helper: Renk metnini 6 haneli Hex'e çevir (RGB, RGBA, Hex, İsimli renkler)
    function parseColorToHex(input: string | null | undefined): string | null {
      if (!input) return null;
      const s = input.trim().toLowerCase();
      if (['transparent', 'none', 'inherit', 'initial', 'auto', 'currentColor'].includes(s)) return null;

      // Hex format (#fff veya #ffffff)
      if (s.startsWith('#')) {
        const raw = s.replace('#', '');
        if (raw.length === 3) {
          return (raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2]).toUpperCase();
        }
        if (raw.length === 6) {
          return raw.toUpperCase();
        }
      }

      // RGB / RGBA format
      const rgbMatch = s.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
      if (rgbMatch) {
        const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10)));
        const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10)));
        const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10)));
        return (
          r.toString(16).padStart(2, '0') +
          g.toString(16).padStart(2, '0') +
          b.toString(16).padStart(2, '0')
        ).toUpperCase();
      }

      // Standart Renk İsimleri
      const namedColors: Record<string, string> = {
        black: '000000',
        white: 'FFFFFF',
        red: 'FF0000',
        green: '008000',
        blue: '0000FF',
        yellow: 'FFFF00',
        orange: 'FFA500',
        purple: '800080',
        gray: '808080',
        grey: '808080',
        darkgray: 'A9A9A9',
        darkgrey: 'A9A9A9',
        lightgray: 'D3D3D3',
        lightgrey: 'D3D3D3',
        navy: '000080',
        maroon: '800000',
        teal: '008080',
        olive: '808000',
        lime: '00FF00',
        aqua: '00FFFF',
        cyan: '00FFFF',
        magenta: 'FF00FF',
        fuchsia: 'FF00FF'
      };

      if (namedColors[s]) {
        return namedColors[s];
      }

      return null;
    }

    // Helper: Punto / Piksel değerini Word Half-Points (yarım punto) cinsine çevir (12pt = 24 half-pt)
    function parseFontSizeToHalfPt(input: string | null | undefined): number | null {
      if (!input) return null;
      const s = input.trim().toLowerCase();
      const ptMatch = s.match(/^([0-9.]+)\s*pt$/);
      if (ptMatch) {
        return Math.round(parseFloat(ptMatch[1]) * 2);
      }
      const pxMatch = s.match(/^([0-9.]+)\s*px$/);
      if (pxMatch) {
        // 1px = 0.75pt -> halfPt = px * 0.75 * 2 = px * 1.5
        return Math.round(parseFloat(pxMatch[1]) * 1.5);
      }
      const remMatch = s.match(/^([0-9.]+)\s*r?em$/);
      if (remMatch) {
        return Math.round(parseFloat(remMatch[1]) * 12 * 2);
      }
      const num = parseFloat(s);
      if (!isNaN(num) && num > 0) {
        return num <= 40 ? Math.round(num * 2) : Math.round(num * 1.5);
      }
      return null;
    }

    // Helper: Uzunluk değerini Word Twips (1/20 pt, 1cm ≈ 567 twips) birimine çevir
    function parseLengthToTwips(input: string | null | undefined): number | null {
      if (!input) return null;
      const s = input.trim().toLowerCase();
      if (s === '0' || s === '0px' || s === '0cm' || s === '0pt') return 0;

      const cmMatch = s.match(/^([0-9.]+)\s*cm$/);
      if (cmMatch) return Math.round(parseFloat(cmMatch[1]) * 567);

      const mmMatch = s.match(/^([0-9.]+)\s*mm$/);
      if (mmMatch) return Math.round(parseFloat(mmMatch[1]) * 56.7);

      const inMatch = s.match(/^([0-9.]+)\s*in$/);
      if (inMatch) return Math.round(parseFloat(inMatch[1]) * 1440);

      const ptMatch = s.match(/^([0-9.]+)\s*pt$/);
      if (ptMatch) return Math.round(parseFloat(ptMatch[1]) * 20);

      const pxMatch = s.match(/^([0-9.]+)\s*px$/);
      if (pxMatch) return Math.round(parseFloat(pxMatch[1]) * 15);

      const num = parseFloat(s);
      if (!isNaN(num)) return Math.round(num * 20);

      return null;
    }

    // Helper: Shorthand ve açık kenar boşluklarını (margin) Word Twips cinsine çevir
    function parseMargins(style: string): { top: number | null; bottom: number | null; left: number | null; right: number | null } {
      let top: number | null = null;
      let bottom: number | null = null;
      let left: number | null = null;
      let right: number | null = null;

      const mMatch = style.match(/(?:^|;)\s*margin:\s*([^;]+)/i);
      if (mMatch) {
        const parts = mMatch[1].trim().split(/\s+/).filter(Boolean);
        if (parts.length === 1) {
          top = bottom = left = right = parseLengthToTwips(parts[0]);
        } else if (parts.length === 2) {
          top = bottom = parseLengthToTwips(parts[0]);
          left = right = parseLengthToTwips(parts[1]);
        } else if (parts.length === 3) {
          top = parseLengthToTwips(parts[0]);
          left = right = parseLengthToTwips(parts[1]);
          bottom = parseLengthToTwips(parts[2]);
        } else if (parts.length >= 4) {
          top = parseLengthToTwips(parts[0]);
          right = parseLengthToTwips(parts[1]);
          bottom = parseLengthToTwips(parts[2]);
          left = parseLengthToTwips(parts[3]);
        }
      }

      const mtMatch = style.match(/(?:^|;)\s*margin-top:\s*([^;]+)/i);
      if (mtMatch) top = parseLengthToTwips(mtMatch[1]);
      const mbMatch = style.match(/(?:^|;)\s*margin-bottom:\s*([^;]+)/i);
      if (mbMatch) bottom = parseLengthToTwips(mbMatch[1]);
      const mlMatch = style.match(/(?:^|;)\s*margin-left:\s*([^;]+)/i);
      if (mlMatch) left = parseLengthToTwips(mlMatch[1]);
      const mrMatch = style.match(/(?:^|;)\s*margin-right:\s*([^;]+)/i);
      if (mrMatch) right = parseLengthToTwips(mrMatch[1]);

      return { top, bottom, left, right };
    }

    // Helper: Satır aralığını Word Twips birimine çevir (1.0 = 240, 1.15 = 276, 1.5 = 360, 2.0 = 480)
    function parseLineHeightToTwips(input: string | null | undefined): number | null {
      if (!input) return null;
      const s = input.trim().toLowerCase();
      if (s === 'normal') return 240;

      const num = parseFloat(s);
      if (isNaN(num)) return null;

      if (s.endsWith('%')) {
        return Math.round((num / 100) * 240);
      }
      if (s.endsWith('pt')) {
        return Math.round(num * 20);
      }
      if (s.endsWith('px')) {
        return Math.round(num * 15);
      }
      // Çarpan katsayısı (1, 1.15, 1.5, 2 vb.)
      return Math.round(num * 240);
    }

    // Helper: Hizalama değerini ayıkla (left, center, right, both/justify)
    function parseAlignment(el: HTMLElement): 'left' | 'center' | 'right' | 'both' | null {
      const style = el.getAttribute('style') || '';
      const alignAttr = (el.getAttribute('align') || '').toLowerCase();

      if (/text-align:\s*center/i.test(style) || alignAttr === 'center') return 'center';
      if (/text-align:\s*right/i.test(style) || alignAttr === 'right') return 'right';
      if (/text-align:\s*justify/i.test(style) || alignAttr === 'justify') return 'both';
      if (/text-align:\s*left/i.test(style) || alignAttr === 'left') return 'left';

      return null;
    }

    // Helper: XML kaçış karakterleri
    function escapeXml(text: string): string {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }

    // Helper: Base64 görseli yakala ve OpenXML Drawing üret
    function processImageNode(imgEl: HTMLImageElement): string {
      const src = imgEl.getAttribute('src') || '';
      if (!src) return '';

      let base64Data = '';
      let ext = 'png';
      let mime = 'image/png';

      if (src.startsWith('data:image/')) {
        const parts = src.split(',');
        base64Data = parts[1] || '';
        const mimeMatch = parts[0].match(/:(image\/[a-z0-9.+_-]+);/i);
        if (mimeMatch) {
          mime = mimeMatch[1];
          if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpeg';
          else if (mime.includes('gif')) ext = 'gif';
          else if (mime.includes('png')) ext = 'png';
        }
      }

      if (!base64Data) return '';

      imageCounter++;
      const id = `rIdImg${imageCounter}`;
      const target = `media/image${imageCounter}.${ext}`;
      mediaFiles.push({ id, target, data: base64Data, ext, mime });

      // Boyutlar (Varsayılan 400x260 veya belirtilen piksel)
      let widthPx = parseInt(imgEl.getAttribute('width') || '', 10);
      let heightPx = parseInt(imgEl.getAttribute('height') || '', 10);

      const style = imgEl.getAttribute('style') || '';
      const styleW = style.match(/width:\s*([0-9.]+)px/i);
      const styleH = style.match(/height:\s*([0-9.]+)px/i);
      if (styleW) widthPx = parseInt(styleW[1], 10);
      if (styleH) heightPx = parseInt(styleH[1], 10);

      if (!widthPx || isNaN(widthPx)) widthPx = 360;
      if (!heightPx || isNaN(heightPx)) heightPx = 240;

      // 1 px ≈ 9525 EMU (English Metric Units)
      const cx = widthPx * 9525;
      const cy = heightPx * 9525;

      return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${imageCounter}" name="Resim ${imageCounter}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${imageCounter}" name="Resim ${imageCounter}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
    }

    // İÇ SATIR (INLINE) ELEMANLARI DÖNÜŞTÜR
    let isStartOfLine = true;

    function processInlineNode(node: Node, inheritedProps: any = {}): string {
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.nodeValue || '';
        // OpenXML Word <w:t> içinde asla \r, \n veya \t olmamalıdır (Word'de | dikey çizgi glif hatasına yol açar)
        text = text.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');

        if (isStartOfLine) {
          text = text.replace(/^\s+/, '');
        }
        if (!text) return '';

        isStartOfLine = false;

        let rPrXml = '';
        if (inheritedProps.bold) rPrXml += '<w:b/><w:bCs/>';
        if (inheritedProps.italic) rPrXml += '<w:i/><w:iCs/>';
        if (inheritedProps.underline) rPrXml += '<w:u w:val="single"/>';
        if (inheritedProps.strike) rPrXml += '<w:strike/>';
        if (inheritedProps.subscript) rPrXml += '<w:vertAlign w:val="subscript"/>';
        if (inheritedProps.superscript) rPrXml += '<w:vertAlign w:val="superscript"/>';

        if (inheritedProps.fontSize) {
          rPrXml += `<w:sz w:val="${inheritedProps.fontSize}"/><w:szCs w:val="${inheritedProps.fontSize}"/>`;
        }
        if (inheritedProps.fontFamily) {
          const font = inheritedProps.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
          rPrXml += `<w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>`;
        }
        if (inheritedProps.color) {
          rPrXml += `<w:color w:val="${inheritedProps.color}"/>`;
        }
        if (inheritedProps.backgroundColor) {
          rPrXml += `<w:shd w:val="clear" w:color="auto" w:fill="${inheritedProps.backgroundColor}"/>`;
        }

        const escaped = escapeXml(text);
        return `<w:r>${rPrXml ? `<w:rPr>${rPrXml}</w:rPr>` : ''}<w:t xml:space="preserve">${escaped}</w:t></w:r>`;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toUpperCase();

        if (tagName === 'BR') {
          isStartOfLine = true;
          return '<w:r><w:br/></w:r>';
        }

        if (tagName === 'IMG') {
          isStartOfLine = false;
          return processImageNode(el as HTMLImageElement);
        }

        const currentProps = { ...inheritedProps };

        if (tagName === 'B' || tagName === 'STRONG') currentProps.bold = true;
        if (tagName === 'I' || tagName === 'EM') currentProps.italic = true;
        if (tagName === 'U') currentProps.underline = true;
        if (tagName === 'S' || tagName === 'STRIKE' || tagName === 'DEL') currentProps.strike = true;
        if (tagName === 'SUB') currentProps.subscript = true;
        if (tagName === 'SUP') currentProps.superscript = true;
        if (tagName === 'MARK') currentProps.backgroundColor = 'FFFF00';

        const style = el.getAttribute('style') || '';
        if (/font-weight:\s*(bold|[6-9]00)/i.test(style)) currentProps.bold = true;
        if (/font-weight:\s*normal/i.test(style)) currentProps.bold = false;
        if (/font-style:\s*italic/i.test(style)) currentProps.italic = true;
        if (/font-style:\s*normal/i.test(style)) currentProps.italic = false;
        if (/text-decoration:\s*underline/i.test(style)) currentProps.underline = true;
        if (/text-decoration:\s*line-through/i.test(style)) currentProps.strike = true;
        if (/vertical-align:\s*sub/i.test(style)) currentProps.subscript = true;
        if (/vertical-align:\s*super/i.test(style)) currentProps.superscript = true;

        const sizeMatch = style.match(/font-size:\s*([^;]+)/i);
        if (sizeMatch) {
          const halfPt = parseFontSizeToHalfPt(sizeMatch[1]);
          if (halfPt) currentProps.fontSize = halfPt;
        }

        const fontMatch = style.match(/font-family:\s*([^;]+)/i);
        if (fontMatch) {
          currentProps.fontFamily = fontMatch[1];
        }

        const colorMatch = style.match(/(?:^|;)\s*color:\s*([^;]+)/i);
        if (colorMatch) {
          const hex = parseColorToHex(colorMatch[1]);
          if (hex) currentProps.color = hex;
        }

        const bgMatch = style.match(/background(?:-color)?:\s*([^;]+)/i);
        if (bgMatch) {
          const bgHex = parseColorToHex(bgMatch[1]);
          if (bgHex) currentProps.backgroundColor = bgHex;
        }

        let runsXml = '';
        for (let i = 0; i < el.childNodes.length; i++) {
          runsXml += processInlineNode(el.childNodes[i], currentProps);
        }
        return runsXml;
      }

      return '';
    }

    // BLOK ELEMANLARI (PARAGRAF, TABLO, LİSTE, SAYFA SONU) DÖNÜŞTÜR
    function processBlockElement(el: HTMLElement, parentProps: any = {}): string {
      const tagName = el.tagName.toUpperCase();

      // 1. Sayfa Sonu (Page Break)
      if (
        el.classList.contains('rye-page-break') ||
        el.style.pageBreakBefore === 'always' ||
        el.style.pageBreakAfter === 'always'
      ) {
        return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      }

      // 2. Yatay Çizgi (HR)
      if (tagName === 'HR') {
        return '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="auto"/></w:pBdr></w:pPr></w:p>';
      }

      // 3. Görsel Widget (<figure class="rye-image-widget">)
      if (tagName === 'FIGURE' && el.classList.contains('rye-image-widget')) {
        const img = el.querySelector('img');
        const caption = el.querySelector('figcaption');
        let figXml = '';
        if (img) {
          const drawing = processImageNode(img as HTMLImageElement);
          figXml += `<w:p><w:pPr><w:jc w:val="center"/></w:pPr>${drawing}</w:p>`;
        }
        if (caption && caption.textContent?.trim()) {
          figXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="160"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="20"/><w:szCs w:val="20"/><w:color w:val="666666"/></w:rPr><w:t xml:space="preserve">${escapeXml(caption.textContent.trim())}</w:t></w:r></w:p>`;
        }
        return figXml;
      }

      // 4. Tablo (TABLE)
      if (tagName === 'TABLE') {
        const isBorderless = el.classList.contains('rye-table-borderless') || (el.style.border === 'none') || (el.getAttribute('border') === '0');
        const bordersXml = isBorderless
          ? '<w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/>'
          : '<w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>';

        let tblXml = `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${bordersXml}</w:tblBorders><w:tblCellMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="160" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tblCellMar></w:tblPr>`;

        const rows = Array.from(el.querySelectorAll('tr'));
        rows.forEach((tr, rIdx) => {
          const isHeader = rIdx === 0 && (tr.querySelector('th') !== null || tr.closest('thead') !== null);
          tblXml += `<w:tr><w:trPr><w:cantSplit/>${isHeader ? '<w:tblHeader/>' : ''}</w:trPr>`;

          const cells = Array.from(tr.querySelectorAll('th, td')) as HTMLElement[];
          cells.forEach(td => {
            const widthMatch = td.getAttribute('style')?.match(/width:\s*(\d+)px/i);
            let tcPrXml = widthMatch 
              ? `<w:tcW w:w="${Math.round(parseInt(widthMatch[1], 10) * 15)}" w:type="dxa"/>` 
              : '<w:tcW w:w="0" w:type="auto"/>';

            if (isBorderless) {
              tcPrXml += '<w:tcBorders><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/></w:tcBorders>';
            }

            // Hücre Arka Planı
            const tdStyle = td.getAttribute('style') || '';
            const bgMatch = tdStyle.match(/background(?:-color)?:\s*([^;]+)/i);
            const isTh = td.tagName.toUpperCase() === 'TH';
            if (bgMatch) {
              const hex = parseColorToHex(bgMatch[1]);
              if (hex) tcPrXml += `<w:shd w:val="clear" w:color="auto" w:fill="${hex}"/>`;
            } else if (isTh) {
              tcPrXml += '<w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>';
            }

            // Hücre Genişliği
            const wMatch = tdStyle.match(/width:\s*([^;]+)/i);
            if (wMatch) {
              const tw = parseLengthToTwips(wMatch[1]);
              if (tw) tcPrXml += `<w:tcW w:w="${tw}" w:type="dxa"/>`;
            }

            // Dikey Hizalama
            if (/vertical-align:\s*middle/i.test(tdStyle)) tcPrXml += '<w:vAlign w:val="center"/>';
            else if (/vertical-align:\s*bottom/i.test(tdStyle)) tcPrXml += '<w:vAlign w:val="bottom"/>';
            else tcPrXml += '<w:vAlign w:val="top"/>';

            // Colspan
            const colSpan = td.getAttribute('colspan');
            if (colSpan && parseInt(colSpan, 10) > 1) {
              tcPrXml += `<w:gridSpan w:val="${parseInt(colSpan, 10)}"/>`;
            }

            // Hücre İçi Paragraf Hizalaması ve İçerik
            const cellAlign = parseAlignment(td);
            let cellPPr = '';
            if (cellAlign) {
              cellPPr = `<w:jc w:val="${cellAlign}"/>`;
            } else if (isTh) {
              cellPPr = '<w:jc w:val="center"/>';
            }

            const cellProps: any = {};
            if (isTh) cellProps.bold = true;

            // Hücre içindeki blok veya satır içi düğümleri işle
            let cellBody = '';
            const childBlocks = Array.from(td.childNodes).filter(
              n => n.nodeType === Node.ELEMENT_NODE && ['P', 'DIV', 'H1', 'H2', 'H3', 'UL', 'OL', 'TABLE'].includes((n as HTMLElement).tagName.toUpperCase())
            ) as HTMLElement[];

            if (childBlocks.length > 0) {
              childBlocks.forEach(b => {
                cellBody += processBlockElement(b, { ...parentProps, ...cellProps });
              });
            } else {
              let cellRuns = '';
              for (let i = 0; i < td.childNodes.length; i++) {
                cellRuns += processInlineNode(td.childNodes[i], cellProps);
              }
              if (!cellRuns) cellRuns = '<w:r><w:t></w:t></w:r>';
              cellBody = `<w:p>${cellPPr ? `<w:pPr>${cellPPr}</w:pPr>` : ''}${cellRuns}</w:p>`;
            }

            tblXml += `<w:tc><w:tcPr>${tcPrXml}</w:tcPr>${cellBody}</w:tc>`;
          });

          tblXml += '</w:tr>';
        });

        tblXml += '</w:tbl>';
        return tblXml;
      }

      // 5. Sırasız ve Sıralı Listeler (UL / OL)
      if (tagName === 'UL' || tagName === 'OL') {
        let listXml = '';
        const items = Array.from(el.querySelectorAll(':scope > li')) as HTMLElement[];
        const isOl = tagName === 'OL';

        items.forEach((li, idx) => {
          const bullet = isOl ? `${idx + 1}.\u00A0` : '•\u00A0';
          let runsXml = `<w:r><w:t xml:space="preserve">${bullet}</w:t></w:r>`;

          for (let i = 0; i < li.childNodes.length; i++) {
            runsXml += processInlineNode(li.childNodes[i], parentProps);
          }

          const liAlign = parseAlignment(li) || parseAlignment(el);
          let pPr = '<w:pStyle w:val="ListParagraph"/><w:ind w:left="720"/><w:spacing w:after="80" w:line="240" w:lineRule="auto"/>';
          if (liAlign) pPr += `<w:jc w:val="${liAlign}"/>`;

          listXml += `<w:p><w:pPr>${pPr}</w:pPr>${runsXml}</w:p>`;
        });

        return listXml;
      }

      // 6. Kapsayıcı Düğümler (Container DIV, SECTION, ARTICLE, .rye-page)
      // Eğer bu div alt bloklar (p, table vb.) içeriyorsa bunları düzleştirerek işle
      const hasBlockChildren = Array.from(el.childNodes).some(
        n => n.nodeType === Node.ELEMENT_NODE && ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TABLE', 'UL', 'OL', 'FIGURE', 'HR'].includes((n as HTMLElement).tagName.toUpperCase())
      );

      if (hasBlockChildren && (tagName === 'DIV' || tagName === 'SECTION' || tagName === 'ARTICLE' || tagName === 'BLOCKQUOTE')) {
        let subXml = '';
        // Eğer rye-page ise ve 1. sayfa değilse sayfa sonu ekle
        if (el.classList.contains('rye-page')) {
          const pageNum = parseInt(el.getAttribute('data-page') || '1', 10);
          if (pageNum > 1) {
            subXml += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
          }
        }

        for (let i = 0; i < el.childNodes.length; i++) {
          const childNode = el.childNodes[i];
          if (childNode.nodeType === Node.ELEMENT_NODE) {
            const childEl = childNode as HTMLElement;
            if (childEl.classList.contains('rye-page-footer-badge')) continue;
            subXml += processBlockElement(childEl, parentProps);
          } else if (childNode.nodeType === Node.TEXT_NODE && childNode.nodeValue?.trim()) {
            const cleanT = childNode.nodeValue.replace(/[\r\n\t]+/g, ' ').trim();
            if (cleanT) {
              subXml += `<w:p><w:pPr><w:spacing w:line="276" w:lineRule="auto" w:after="160"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(cleanT)}</w:t></w:r></w:p>`;
            }
          }
        }
        return subXml;
      }

      // 7. Paragraf (P, H1-H6, BLOCKQUOTE veya saf metin DIV)
      let pPrXml = '';
      const style = el.getAttribute('style') || '';
      const margins = parseMargins(style);

      // Hizalama
      const align = parseAlignment(el);
      if (align) {
        pPrXml += `<w:jc w:val="${align}"/>`;
      }

      // İlk Satır Girintisi (text-indent)
      const indentMatch = style.match(/text-indent:\s*([^;]+)/i);
      let firstLineTwips: number | null = null;
      if (indentMatch) {
        firstLineTwips = parseLengthToTwips(indentMatch[1]);
      }

      // Resmi Yazışma Standardı:
      // Gövde paragrafları (ortalanmamış, sağa yaslanmamış, T.C., Sayı, Konu veya DAĞITIM YERLERİNE olmayanlar)
      // standart olarak 1.25 cm (709 twips) ilk satır girintisine sahip olmalıdır.
      const textContent = (el.textContent || '').trim();
      const isSpecialNonIndented =
        align === 'center' ||
        align === 'right' ||
        textContent.startsWith('T.C.') ||
        textContent.startsWith('Sayı') ||
        textContent.startsWith('Konu') ||
        textContent === 'DAĞITIM YERLERİNE' ||
        ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName);

      if (firstLineTwips === null && !isSpecialNonIndented && tagName === 'P') {
        firstLineTwips = 709; // 1.25 cm
      }

      // Sol Girinti (margin-left)
      let leftTwips: number | null = margins.left;

      if ((firstLineTwips !== null && firstLineTwips > 0 && align !== 'center' && align !== 'right') || (leftTwips !== null && leftTwips > 0)) {
        let indAttrs = '';
        if (firstLineTwips !== null && firstLineTwips > 0 && align !== 'center' && align !== 'right') {
          indAttrs += ` w:firstLine="${firstLineTwips}"`;
        }
        if (leftTwips !== null && leftTwips > 0) {
          indAttrs += ` w:left="${leftTwips}"`;
        }
        if (indAttrs) {
          pPrXml += `<w:ind${indAttrs}/>`;
        }
      }

      // Satır Aralığı ve Paragraf Boşlukları
      const lhMatch = style.match(/line-height:\s*([^;]+)/i);
      let lineTwips: number | null = lhMatch ? parseLineHeightToTwips(lhMatch[1]) : 276; // Varsayılan 1.15 satır aralığı
      let afterTwips: number | null = margins.bottom;
      let beforeTwips: number | null = margins.top;

      // Başlık ve Özel Blok Stilleri
      const blockProps: any = { ...parentProps };
      if (tagName === 'H1') {
        blockProps.bold = true;
        blockProps.fontSize = 36; // 18pt
        if (beforeTwips === null) beforeTwips = 360;
        if (afterTwips === null) afterTwips = 160;
      } else if (tagName === 'H2') {
        blockProps.bold = true;
        blockProps.fontSize = 32; // 16pt
        if (beforeTwips === null) beforeTwips = 320;
        if (afterTwips === null) afterTwips = 160;
      } else if (tagName === 'H3') {
        blockProps.bold = true;
        blockProps.fontSize = 28; // 14pt
        if (beforeTwips === null) beforeTwips = 280;
        if (afterTwips === null) afterTwips = 120;
      } else if (textContent === 'DAĞITIM YERLERİNE') {
        blockProps.bold = true;
        if (beforeTwips === null) beforeTwips = 320; // 16pt
        if (afterTwips === null) afterTwips = 320; // 16pt
      } else if (textContent.startsWith('T.C.')) {
        blockProps.bold = true;
        if (afterTwips === null) afterTwips = 400; // 20pt
      } else if (textContent.startsWith('Sayı') || textContent.startsWith('Konu')) {
        if (afterTwips === null) afterTwips = 240; // 12pt
      } else {
        // Varsayılan gövde paragrafı boşluğu (8pt = 160 twips)
        if (afterTwips === null) afterTwips = 160;
      }

      // Boşluk XML oluştur
      let spacingAttrs = '';
      if (lineTwips !== null) spacingAttrs += ` w:line="${lineTwips}" w:lineRule="auto"`;
      if (afterTwips !== null && afterTwips > 0) spacingAttrs += ` w:after="${afterTwips}"`;
      if (beforeTwips !== null && beforeTwips > 0) spacingAttrs += ` w:before="${beforeTwips}"`;
      if (spacingAttrs) {
        pPrXml += `<w:spacing${spacingAttrs}/>`;
      }

      // Paragraf İçi Satır Düğümleri
      isStartOfLine = true;
      let runsXml = '';
      for (let i = 0; i < el.childNodes.length; i++) {
        runsXml += processInlineNode(el.childNodes[i], blockProps);
      }

      if (!runsXml) {
        runsXml = '<w:r><w:t></w:t></w:r>';
      }

      return `<w:p>${pPrXml ? `<w:pPr>${pPrXml}</w:pPr>` : ''}${runsXml}</w:p>`;
    }

    // Belge Gövdesi Bloklarını Dolaş
    let bodyXml = '';
    const childNodes = Array.from(rootContainer.childNodes);

    for (const node of childNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.classList.contains('rye-page-footer-badge')) continue;
        bodyXml += processBlockElement(el);
      } else if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()) {
        const cleanT = node.nodeValue.replace(/[\r\n\t]+/g, ' ').trim();
        if (cleanT) {
          bodyXml += `<w:p><w:pPr><w:spacing w:line="276" w:lineRule="auto" w:after="160"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(cleanT)}</w:t></w:r></w:p>`;
        }
      }
    }

    if (!bodyXml) {
      bodyXml = '<w:p><w:r><w:t></w:t></w:r></w:p>';
    }

    // Standart A4 (11906 x 16838 twips) & Cumhurbaşkanlığı 2025 Kılavuzu (Üst: 1.5cm, Sağ: 1.5cm, Alt: 0.5cm, Sol: 1.5cm)
    // 1.5cm = 851 twips, 0.5cm = 284 twips
    const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="851" w:right="851" w:bottom="284" w:left="851"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    return { docXml, mediaFiles };
  }

  /**
   * Varsayılan Word dışa aktarımı (.docx olarak kaydeder)
   */
  static exportToWord(contentHtml: string, filename: string = 'resmi_yazi_belgesi.docx'): void {
    if (filename.toLowerCase().endsWith('.doc')) {
      ExportPlugin.exportToDoc(contentHtml, filename);
    } else {
      ExportPlugin.exportToDocx(contentHtml, filename);
    }
  }

  /**
   * İsteğe bağlı .doc formatında kaydetme seçeneği
   */
  static exportToDoc(contentHtml: string, filename: string = 'resmi_yazi_belgesi.doc'): void {
    let processedHtml = contentHtml.replace(
      /<div class="rye-page-break"[^>]*>[\s\S]*?<\/div>/gi,
      '<br clear="all" style="mso-special-character:line-break;page-break-before:always">'
    );

    const docTemplate = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Resmi Yazışma Belgesi</title>
        <style>
          @page Section1 {
            size: 210mm 297mm;
            margin: 1.5cm 1.5cm 0.5cm 1.5cm;
          }
          div.Section1 { page: Section1; }
          p { margin: 0; text-indent: 1.25cm; line-height: 1.15; text-align: justify; }
          p[align="center"], p.center, p[style*="text-align: center"], p[style*="text-align:center"] { text-indent: 0 !important; }
          p[align="right"], p.right, p[style*="text-align: right"], p[style*="text-align:right"] { text-indent: 0 !important; }
          table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
          th, td { border: 1px solid #000000; padding: 6pt 10pt; text-align: left; vertical-align: top; font-family: "Times New Roman", Times, serif; font-size: 11pt; }
          th { background-color: #f2f2f2; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${processedHtml}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', docTemplate], {
      type: 'application/msword;charset=utf-8'
    });

    const cleanFilename = filename.endsWith('.doc') ? filename : `${filename}.doc`;
    ExportPlugin.downloadBlob(blob, cleanFilename);
  }

  static exportToPdf(target?: any): void {
    PrintManager.print(target);
  }

  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
