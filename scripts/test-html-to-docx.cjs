const { JSDOM } = require('jsdom');
const JSZip = require('jszip');
const mammoth = require('mammoth');

const dom = new JSDOM();
const document = dom.window.document;
const DOMParser = dom.window.DOMParser;

function htmlToDocxXml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const container = doc.body.firstElementChild || doc.body;

  let bodyXml = '';

  function ptToHalfPt(ptStr) {
    const num = parseFloat(ptStr);
    return isNaN(num) ? 24 : Math.round(num * 2);
  }

  function processInlineNode(node, inheritedProps = {}) {
    let runsXml = '';

    if (node.nodeType === 3) { // Text node
      const text = node.nodeValue || '';
      if (!text) return '';

      let rPrXml = '';
      if (inheritedProps.bold) rPrXml += '<w:b/>';
      if (inheritedProps.italic) rPrXml += '<w:i/>';
      if (inheritedProps.underline) rPrXml += '<w:u w:val="single"/>';
      if (inheritedProps.strike) rPrXml += '<w:strike/>';
      if (inheritedProps.fontSize) {
        const val = ptToHalfPt(inheritedProps.fontSize);
        rPrXml += `<w:sz w:val="${val}"/><w:szCs w:val="${val}"/>`;
      }
      if (inheritedProps.fontFamily) {
        const font = inheritedProps.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
        rPrXml += `<w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>`;
      }
      if (inheritedProps.color) {
        const hex = inheritedProps.color.replace('#', '').toUpperCase();
        if (/^[0-9A-F]{6}$/i.test(hex)) {
          rPrXml += `<w:color w:val="${hex}"/>`;
        }
      }

      // Escape XML special chars
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      return `<w:r>${rPrXml ? `<w:rPr>${rPrXml}</w:rPr>` : ''}<w:t xml:space="preserve">${escaped}</w:t></w:r>`;
    }

    if (node.nodeType === 1) { // Element node
      const el = node;
      const tagName = el.tagName.toUpperCase();

      if (tagName === 'BR') {
        return '<w:r><w:br/></w:r>';
      }

      const currentProps = { ...inheritedProps };

      if (tagName === 'B' || tagName === 'STRONG') currentProps.bold = true;
      if (tagName === 'I' || tagName === 'EM') currentProps.italic = true;
      if (tagName === 'U') currentProps.underline = true;
      if (tagName === 'S' || tagName === 'STRIKE') currentProps.strike = true;

      const style = el.getAttribute('style') || '';
      if (/font-weight:\s*bold/i.test(style)) currentProps.bold = true;
      if (/font-style:\s*italic/i.test(style)) currentProps.italic = true;
      if (/text-decoration:\s*underline/i.test(style)) currentProps.underline = true;
      if (/text-decoration:\s*line-through/i.test(style)) currentProps.strike = true;

      const sizeMatch = style.match(/font-size:\s*([0-9.]+pt)/i);
      if (sizeMatch) currentProps.fontSize = sizeMatch[1];

      const fontMatch = style.match(/font-family:\s*([^;]+)/i);
      if (fontMatch) currentProps.fontFamily = fontMatch[1];

      const colorMatch = style.match(/color:\s*(#[0-9a-f]{3,6})/i);
      if (colorMatch) currentProps.color = colorMatch[1];

      for (let i = 0; i < el.childNodes.length; i++) {
        runsXml += processInlineNode(el.childNodes[i], currentProps);
      }
    }

    return runsXml;
  }

  function processBlockNode(node) {
    if (node.nodeType === 3) {
      const text = node.nodeValue?.trim();
      if (!text) return '';
      return `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`;
    }

    if (node.nodeType !== 1) return '';
    const el = node;
    const tagName = el.tagName.toUpperCase();

    // Page Break
    if (el.classList.contains('rye-page-break')) {
      return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    }

    // Horizontal Rule
    if (tagName === 'HR') {
      return '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="auto"/></w:pBdr></w:pPr></w:p>';
    }

    // Table
    if (tagName === 'TABLE') {
      let tblXml = '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tblBorders></w:tblPr>';

      const rows = el.querySelectorAll('tr');
      rows.forEach(tr => {
        tblXml += '<w:tr>';
        const cells = tr.querySelectorAll('th, td');
        cells.forEach(td => {
          tblXml += '<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>';
          let cellContent = '';
          for (let i = 0; i < td.childNodes.length; i++) {
            cellContent += processInlineNode(td.childNodes[i]);
          }
          tblXml += `<w:p>${cellContent || '<w:r><w:t></w:t></w:r>'}</w:p></w:tc>`;
        });
        tblXml += '</w:tr>';
      });

      tblXml += '</w:tbl>';
      return tblXml;
    }

    // Paragraph or Heading
    let pPrXml = '';
    const style = el.getAttribute('style') || '';

    // Alignment
    if (/text-align:\s*center/i.test(style)) pPrXml += '<w:jc w:val="center"/>';
    else if (/text-align:\s*right/i.test(style)) pPrXml += '<w:jc w:val="right"/>';
    else if (/text-align:\s*justify/i.test(style)) pPrXml += '<w:jc w:val="both"/>';

    // Indent (1.25cm = 709 twips)
    if (/text-indent:\s*([0-9.]+cm)/i.test(style)) {
      pPrXml += '<w:ind w:firstLine="709"/>';
    }

    // Heading overrides
    let extraRuns = '';
    const blockProps = {};
    if (tagName === 'H1') {
      blockProps.bold = true;
      blockProps.fontSize = '18pt';
      pPrXml += '<w:spacing w:before="360" w:after="160"/>';
    } else if (tagName === 'H2') {
      blockProps.bold = true;
      blockProps.fontSize = '16pt';
      pPrXml += '<w:spacing w:before="320" w:after="160"/>';
    } else if (tagName === 'H3') {
      blockProps.bold = true;
      blockProps.fontSize = '14pt';
      pPrXml += '<w:spacing w:before="280" w:after="120"/>';
    } else {
      pPrXml += '<w:spacing w:after="240" w:line="360" w:lineRule="auto"/>'; // 12pt after, 1.5 line
    }

    let runsXml = '';
    for (let i = 0; i < el.childNodes.length; i++) {
      runsXml += processInlineNode(el.childNodes[i], blockProps);
    }

    if (!runsXml) {
      runsXml = '<w:r><w:t></w:t></w:r>';
    }

    return `<w:p>${pPrXml ? `<w:pPr>${pPrXml}</w:pPr>` : ''}${runsXml}</w:p>`;
  }

  for (let i = 0; i < container.childNodes.length; i++) {
    bodyXml += processBlockNode(container.childNodes[i]);
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

async function runTest() {
  const html = `
    <p style="text-align: center;"><strong>T.C. İÇİŞLERİ BAKANLIĞI</strong></p>
    <p style="text-indent: 1.25cm;">Bu bir resmi yazıdır. İçinde <span style="font-size: 16pt; color: #dc2626;">kırmızı ve 16pt metin</span> ve <em>italik kelimeler</em> bulunmaktadır.</p>
    <div class="rye-page-break"></div>
    <h1>2. BÖLÜM: TABLOLAR</h1>
    <table class="rye-table">
      <tr><th>Başlık 1</th><th>Başlık 2</th></tr>
      <tr><td>Veri A</td><td>Veri B</td></tr>
    </table>
  `;

  const docXml = htmlToDocxXml(html);

  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`);

  zip.file('word/document.xml', docXml);

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  console.log('DOCX başarıyla oluşturuldu! Boyut:', buffer.length, 'bytes');

  // Şimdi aynı dosyayı Mammoth ile geri okuyalım (Round-trip doğrulaması):
  const parsed = await mammoth.convertToHtml({ buffer });
  console.log('\nMammoth ile geri okunan HTML:\n', parsed.value);
}

runTest().catch(console.error);
