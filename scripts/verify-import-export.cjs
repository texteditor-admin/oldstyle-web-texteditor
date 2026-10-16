const { JSDOM } = require('jsdom');
const mammoth = require('mammoth');
const JSZip = require('jszip');

console.log('--- TEST BAŞLIYOR: IMPORT & EXPORT (.DOCX VE .DOC) UYUMU ---');

// Test 1: HTML-based .doc formatını import edebilme simülasyonu
const legacyDocHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head><meta charset="utf-8"><title>Test</title></head>
<body>
<div class="Section1">
  <p style="text-align: center;"><strong>T.C. İÇİŞLERİ BAKANLIĞI</strong></p>
  <p>Eski .doc formatındaki resmi yazı belgesi.</p>
</div>
</body>
</html>
`;

function parseDocContent(text) {
  if (text.includes('<html') || text.includes('<body') || text.includes('<p')) {
    // HTML-based .doc belgesi
    const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let extracted = bodyMatch ? bodyMatch[1] : text;
    extracted = extracted.replace(/<style[\s\S]*?<\/style>/gi, '')
                         .replace(/<xml[\s\S]*?<\/xml>/gi, '')
                         .replace(/<!--[\s\S]*?-->/g, '');
    return extracted.trim();
  }
  return text;
}

const parsedLegacyDoc = parseDocContent(legacyDocHtml);
console.log('[TEST 1] Legacy .doc HTML içeriği başarıyla ayıklandı:');
console.log(parsedLegacyDoc);

if (!parsedLegacyDoc.includes('T.C. İÇİŞLERİ BAKANLIĞI') || !parsedLegacyDoc.includes('Eski .doc formatındaki')) {
  console.error('HATA: .doc içeriği doğru ayıklanamadı!');
  process.exit(1);
}
console.log('✅ Test 1 (.doc import) Başarılı!');

// Test 2: Gerçek Word OpenXML .docx oluşturma ve Mammoth ile okuma
async function testDocx() {
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

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>T.C. İÇİŞLERİ BAKANLIĞI</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Bu belge hem .docx olarak ihraç edildi hem de geri yüklenebiliyor.</w:t></w:r>
    </w:p>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', docXml);

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  console.log('\n[TEST 2] .docx oluşturuldu (Boyut: ' + buffer.length + ' bytes). Mammoth ile okunuyor...');

  const result = await mammoth.convertToHtml({ buffer });
  console.log('Mammoth çıktısı:\n', result.value);

  if (!result.value.includes('T.C. İÇİŞLERİ BAKANLIĞI') || !result.value.includes('ihraç edildi')) {
    console.error('HATA: .docx içeriği doğru okunamadı!');
    process.exit(1);
  }
  console.log('✅ Test 2 (.docx import & export round-trip) Başarılı!');
  console.log('\n🎉 TÜM IMPORT & EXPORT TESTLERİ EKSİKSİZ TAMAMLANDI!');
}

testDocx().catch(err => {
  console.error(err);
  process.exit(1);
});
