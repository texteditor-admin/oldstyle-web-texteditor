const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// JSDOM ortamını ayarla
const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="editor-container"></div></body></html>`, {
  url: 'http://localhost/'
});

global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.NodeFilter = dom.window.NodeFilter;
global.Range = dom.window.Range;
global.Selection = dom.window.Selection;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLTableCellElement = dom.window.HTMLTableCellElement;
global.HTMLTableRowElement = dom.window.HTMLTableRowElement;
global.HTMLTableElement = dom.window.HTMLTableElement;
global.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.Event = dom.window.Event;
global.CSSStyleDeclaration = dom.window.CSSStyleDeclaration;
global.DOMParser = dom.window.DOMParser;
global.navigator = dom.window.navigator;

// UMD bundle'ını yükle
const bundlePath = path.resolve(__dirname, '../dist/resmi-yazi-editor.umd.js');
const bundleCode = fs.readFileSync(bundlePath, 'utf8');
const fn = new Function(bundleCode);
fn();

const ResmiYaziEditor = dom.window.ResmiYaziEditor;
const ExportPlugin = dom.window.ExportPlugin;

console.log('--- TEST BAŞLIYOR: RESMİ YAZIŞMA FORMATLARI İÇE & DIŞA AKTARIM (ROUND-TRIP) TESTİ ---');

const container = document.getElementById('editor-container');
const editor = new ResmiYaziEditor(container);
const commands = editor.commands;
const importPlugin = commands.getImportPlugin();

async function runFidelityTest() {
  // 1. Zengin resmi yazışma belgesi HTML içeriği hazırla
  const originalHtml = `
<p style="text-align: center;"><span style="font-family: Arial; font-size: 14pt; font-weight: bold;">T.C. İÇİŞLERİ BAKANLIĞI</span></p>
<p style="text-align: right; margin-bottom: 0pt;"><span style="font-size: 11pt;">15.10.2024</span></p>
<p style="text-align: justify; text-indent: 1.25cm; line-height: 1.5; margin-bottom: 12pt;">
  Bu resmi yazı metninde <strong>kalın</strong>, <em>italik</em>, <u>altı çizili</u>, <s>üstü çizili</s>,
  <sub>alt simge</sub> ve <sup>üst simge</sup> biçimleri bulunmaktadır.
  Ayrıca <span style="color: rgb(220, 38, 38);">kırmızı metin</span> ve
  <span style="background-color: rgb(254, 240, 138);">sarı vurgulu metin</span> ile
  <span style="font-size: 16pt;">16 punto büyük</span> ve <span style="font-family: Calibri;">Calibri fontlu</span> kısımlar mevcuttur.
</p>
<ul>
  <li>Maddeli liste birinci satır</li>
  <li>Maddeli liste ikinci satır</li>
</ul>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 12pt;">
  <thead>
    <tr>
      <th style="background-color: #f2f2f2; text-align: center; border: 1px solid #000; padding: 6px;">Sıra No</th>
      <th style="background-color: #f2f2f2; text-align: left; border: 1px solid #000; padding: 6px;">Konu Başlığı</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align: center; border: 1px solid #000; padding: 6px;">1</td>
      <td style="text-align: left; border: 1px solid #000; padding: 6px;">Resmi Yazışma Usul ve Esasları Yönetmeliği</td>
    </tr>
  </tbody>
</table>
<div class="rye-page-break" contenteditable="false"></div>
<p style="text-align: justify; text-indent: 1.25cm;">Bu paragraf 2. sayfada yer almaktadır.</p>
`.trim();

  console.log('[ADIM 1] Orijinal HTML Word OpenXML (.docx) formatına ihraç ediliyor...');
  const { docXml, mediaFiles } = ExportPlugin.htmlToDocxXml(originalHtml);

  // XML kontrolleri
  console.log('  DocXml üretildi (Karakter sayısı: ' + docXml.length + ')');
  const hasXmlCenter = docXml.includes('<w:jc w:val="center"/>');
  const hasXmlRight = docXml.includes('<w:jc w:val="right"/>');
  const hasXmlBoth = docXml.includes('<w:jc w:val="both"/>');
  const hasXmlIndent = docXml.includes('<w:ind w:firstLine="709"/>');
  const hasXmlSpacing = docXml.includes('w:line="360"');
  const hasXmlRedColor = docXml.includes('<w:color w:val="DC2626"/>');
  const hasXmlYellowBg = docXml.includes('<w:shd w:val="clear" w:color="auto" w:fill="FEF08A"/>');
  const hasXmlPageBreak = docXml.includes('<w:br w:type="page"/>');
  const hasXmlTable = docXml.includes('<w:tbl>');

  console.log('  XML - Ortala (center) var mı:', hasXmlCenter);
  console.log('  XML - Sağa Yasla (right) var mı:', hasXmlRight);
  console.log('  XML - İki Yana Yasla (both) var mı:', hasXmlBoth);
  console.log('  XML - 1.25cm Girinti (709 twips) var mı:', hasXmlIndent);
  console.log('  XML - 1.5 Satır Aralığı (360 twips) var mı:', hasXmlSpacing);
  console.log('  XML - Kırmızı Renk (#DC2626) var mı:', hasXmlRedColor);
  console.log('  XML - Sarı Vurgu (#FEF08A) var mı:', hasXmlYellowBg);
  console.log('  XML - Sayfa Sonu (<w:br w:type="page"/>) var mı:', hasXmlPageBreak);
  console.log('  XML - Tablo (<w:tbl>) var mı:', hasXmlTable);

  if (!hasXmlCenter || !hasXmlRight || !hasXmlBoth || !hasXmlIndent || !hasXmlRedColor || !hasXmlYellowBg || !hasXmlPageBreak || !hasXmlTable) {
    console.error('❌ ADIM 1 BAŞARISIZ: Dışa aktarılan Word XML yapısında kritik formatlar eksik!');
    process.exit(1);
  }
  console.log('✅ ADIM 1 BAŞARILI: Word XML tüm resmi yazı formatlarını eksiksiz içeriyor.');

  console.log('\n[ADIM 2] .docx paketi oluşturulup ImportPlugin ile geri içe aktarılıyor...');
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
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman"/><w:sz w:val="24"/></w:rPr></w:rPrDefault>
  </w:docDefaults>
</w:styles>`);

  zip.file('word/document.xml', docXml);

  const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  const importedHtml = await importPlugin.convertDocxToHtml(arrayBuffer);

  console.log('\n[ADIM 3] İçe Aktarılan HTML Biçim Analizi:');
  console.log(importedHtml);

  // Kapsamlı Doğrulamalar:
  const checks = [
    { name: 'Ortalama (text-align: center)', pass: importedHtml.includes('text-align: center') },
    { name: 'Sağa Yaslama (text-align: right)', pass: importedHtml.includes('text-align: right') },
    { name: 'İki Yana Yaslama (text-align: justify)', pass: importedHtml.includes('text-align: justify') },
    { name: 'İlk Satır Girintisi (text-indent: 1.25cm)', pass: importedHtml.includes('text-indent: 1.25cm') },
    { name: 'Satır Aralığı (line-height: 1.5)', pass: importedHtml.includes('line-height: 1.5') },
    { name: 'Paragraf Boşluğu (margin-bottom: 12pt)', pass: importedHtml.includes('margin-bottom: 12pt') },
    { name: 'Kalınlık (strong)', pass: importedHtml.includes('<strong>') || importedHtml.includes('font-weight: bold') },
    { name: 'İtalik (em)', pass: importedHtml.includes('<em>') || importedHtml.includes('font-style: italic') },
    { name: 'Altı Çizili (u)', pass: importedHtml.includes('<u>') },
    { name: 'Üstü Çizili (s)', pass: importedHtml.includes('<s>') },
    { name: 'Alt Simge (sub)', pass: importedHtml.includes('<sub>') },
    { name: 'Üst Simge (sup)', pass: importedHtml.includes('<sup>') },
    { name: 'Yazı Rengi (#DC2626)', pass: importedHtml.includes('#DC2626') || importedHtml.includes('rgb(220, 38, 38)') },
    { name: 'Vurgu / Arka Plan Rengi (#FEF08A)', pass: importedHtml.includes('#FEF08A') || importedHtml.includes('rgb(254, 240, 138)') },
    { name: 'Punto (14pt ve 16pt)', pass: importedHtml.includes('14pt') && importedHtml.includes('16pt') },
    { name: 'Font Ailesi (Arial ve Calibri)', pass: importedHtml.includes('Arial') && importedHtml.includes('Calibri') },
    { name: 'Tablo ve Hücreleri (table & td)', pass: importedHtml.includes('<table') && importedHtml.includes('<td') },
    { name: 'Tablo Başlık Arka Planı (#F2F2F2)', pass: importedHtml.includes('#F2F2F2') || importedHtml.includes('rgb(242, 242, 242)') },
    { name: 'Sayfa Sonu (.rye-page-break)', pass: importedHtml.includes('rye-page-break') }
  ];

  let failedCount = 0;
  checks.forEach(c => {
    if (c.pass) {
      console.log(`  ✅ ${c.name}: Başarılı`);
    } else {
      console.error(`  ❌ ${c.name}: BAŞARISIZ!`);
      failedCount++;
    }
  });

  if (failedCount > 0) {
    console.error(`\n❌ TOPLAM ${failedCount} BİÇİM TESTİ BAŞARISIZ OLDU!`);
    process.exit(1);
  }

  console.log('\n[ADIM 4] İçe aktarılan HTML editöre yükleniyor (editor.setData)...');
  editor.setData(importedHtml);

  const pageCount = editor.pagination ? editor.pagination.getPageCount() : 1;
  console.log('  Oluşan Sayfa Sayısı:', pageCount);
  if (pageCount < 2) {
    console.error('❌ ADIM 4 BAŞARISIZ: Sayfa sonu (.rye-page-break) 2. sayfayı açmadı!');
    process.exit(1);
  }
  console.log('  ✅ 2. sayfa başarıyla açıldı!');

  const editorData = editor.getData();
  if (!editorData.includes('T.C. İÇİŞLERİ BAKANLIĞI') || !editorData.includes('2. sayfada yer almaktadır')) {
    console.error('❌ ADIM 4 BAŞARISIZ: Editör verisinde içerik kayboldu!');
    process.exit(1);
  }
  console.log('  ✅ Editör tüm içeriği ve sayfaları eksiksiz korudu!');

  console.log('\n🎉 TEBRİKLER: TÜM İÇE & DIŞA AKTARIM VE SAYFALAMA TESTLERİ %100 BAŞARIYLA TAMAMLANDI!');
}

runFidelityTest().catch(err => {
  console.error('Test sırasında beklenmeyen hata:', err);
  process.exit(1);
});
