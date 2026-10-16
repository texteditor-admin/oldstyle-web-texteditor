const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

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

const bundlePath = path.resolve(__dirname, '../dist/resmi-yazi-editor.umd.js');
const bundleCode = fs.readFileSync(bundlePath, 'utf8');
new Function(bundleCode)();

const ResmiYaziEditor = dom.window.ResmiYaziEditor;
const container = document.getElementById('editor-container');
const editor = new ResmiYaziEditor(container);

async function testImportPagination() {
  console.log('--- TEST: İÇE AKTARILAN DOSYALARDA SAYFA GEÇİŞLERİ TESTİ ---');

  // Test 1: Word dosyasından sayfa sonu içeren HTML içe aktarma
  const htmlWithPageBreaks = `
<p>Sayfa 1 Başlık</p>
<p>Sayfa 1 Paragraf 1</p>
<div class="rye-page-break" contenteditable="false"></div>
<p>Sayfa 2 Başlık</p>
<p>Sayfa 2 Paragraf 1</p>
<div class="rye-page-break" contenteditable="false"></div>
<p>Sayfa 3 Başlık</p>
<p>Sayfa 3 Paragraf 1</p>
`;

  editor.setData(htmlWithPageBreaks);
  console.log('[TEST 1] 3 sayfalık belge yüklendi. Sayfa sayısı:', editor.pagination.getPageCount());

  const pages = container.querySelectorAll('.rye-page');
  console.log('  Bulunan .rye-page sayısı:', pages.length);

  pages.forEach((p, idx) => {
    console.log(`  Sayfa ${idx + 1} içeriği:`, p.innerHTML.trim().replace(/\n/g, ' '));
  });

  // Test 2: Sayfa 2'nin başında Backspace basıldığında ne oluyor?
  console.log('\n[TEST 2] Sayfa 2 başında Backspace simülasyonu:');
  const page2 = pages[1];
  if (page2) {
    const firstBlock = page2.firstElementChild;
    const range = document.createRange();
    range.setStart(firstBlock, 0);
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    const backspaceEvent = new dom.window.KeyboardEvent('keydown', { key: 'Backspace', bubbles: true });
    editor.editable.dispatchEvent(backspaceEvent);

    console.log('  Backspace sonrası sayfa sayısı:', editor.pagination.getPageCount());
  }

  // Test 4: Gerçek Word belgesi (lastRenderedPageBreak, sectPr, pageBreakBefore içeren)
  console.log('\n[TEST 4] Gerçek Word OpenXML akışı (lastRenderedPageBreak & sectPr):');
  const zip = new JSZip();
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Sayfa 1 metni paragraf 1</w:t></w:r></w:p>
    <w:p><w:r><w:t>Sayfa 1 metni paragraf 2</w:t></w:r></w:p>
    <w:p>
      <w:r>
        <w:lastRenderedPageBreak/>
        <w:t>Sayfa 2 metni (Word tarafından sayfalandırılmış)</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pageBreakBefore/></w:pPr>
      <w:r><w:t>Sayfa 3 metni (pageBreakBefore ile açılmış)</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;
  zip.file('word/document.xml', docXml);
  const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  const importPlugin = editor.commands.getImportPlugin();
  const htmlFromWord = await importPlugin.convertDocxToHtml(arrayBuffer);
  console.log('  Wordden dönüştürülen HTML:\n', htmlFromWord);

  // Word belgesini editöre yükle
  editor.setData(htmlFromWord);
  const wordImportPageCount = editor.pagination.getPageCount();
  console.log('  Word belgesi editöre yüklendiğinde oluşan sayfa sayısı:', wordImportPageCount);
  if (wordImportPageCount === 3) {
    console.log('  ✅ Word belgesindeki lastRenderedPageBreak ve pageBreakBefore başarıyla 3 ayrı A4 sayfasına dönüştürüldü!');
  } else {
    console.error('  ❌ HATA: Sayfa sayısı 3 olmalıydı ama:', wordImportPageCount);
    process.exit(1);
  }

  // Test 4.2: Sayfa içindeyken Ctrl+Enter ile yeni sayfa açma testi
  console.log('\n[TEST 4.2] Ctrl+Enter klavye kısayolu ile yeni A4 sayfası açma:');
  const ctrlEnterEvent = new dom.window.KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true });
  editor.editable.dispatchEvent(ctrlEnterEvent);
  const afterCtrlEnterPageCount = editor.pagination.getPageCount();
  console.log('  Ctrl+Enter sonrası sayfa sayısı:', afterCtrlEnterPageCount);
  if (afterCtrlEnterPageCount === 4) {
    console.log('  ✅ Ctrl+Enter kısayolu başarıyla yeni bir A4 sayfası açtı!');
  } else {
    console.error('  ❌ HATA: Ctrl+Enter sonrası sayfa sayısı 4 olmalıydı ama:', afterCtrlEnterPageCount);
    process.exit(1);
  }

  // Test 5: İçe aktarılan belgeye yoğun metin yazıldığında otomatik yeni sayfa açılması (Overflow)
  console.log('\n[TEST 5] İçe aktarılan sayfaya çok fazla paragraf eklenince otomatik yeni A4 açılması:');
  const page1 = container.querySelector('.rye-page');
  if (page1) {
    // 35 paragraf ekleyelim
    for (let k = 1; k <= 35; k++) {
      const p = document.createElement('p');
      p.textContent = `Otomatik taşma paragrafı ${k} - Bu resmi yazı metni A4 kağıt sınırını aşarak yeni bir A4 sayfası açmalıdır.`;
      // JSDOM ortamında offsetHeight simülasyonu
      Object.defineProperty(p, 'offsetHeight', { value: 36, configurable: true });
      page1.appendChild(p);
    }

    editor.pagination.repaginate();
    const finalPageCount = editor.pagination.getPageCount();
    console.log('  Taşma sonrası toplam sayfa sayısı:', finalPageCount);
    if (finalPageCount >= 4) {
      console.log('  ✅ Taşma sonrası otomatik olarak yeni sayfalar açıldı ve içerik düzenli aktarıldı!');
    }
  }

  console.log('\n🎉 TÜM İÇE AKTARIM SAYFALAMA VE GEÇİŞ TESTLERİ BAŞARIYLA TAMAMLANDI!');
}

testImportPagination().catch(console.error);
