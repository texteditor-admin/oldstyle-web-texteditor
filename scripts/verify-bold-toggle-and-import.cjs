const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// JSDOM ortamını hazırla
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

console.log('--- TEST BAŞLIYOR: BİÇİMLENDİRME GERİ ALMA, SEÇİM KORUMA VE WORD IMPORT TESTİ ---');

const container = document.getElementById('editor-container');
const editor = new ResmiYaziEditor(container, {
  initialData: '<p id="p1">Resmi Yazışma Sistemi Test Belgesi</p>'
});

const editable = editor.editable || container.querySelector('.rye-editable');
const commands = editor.commands;
const toolbar = editor.toolbar;

function selectText(node, start, end) {
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  editor.selection.save();
  return range;
}

// =========================================================================
// [TEST 1] KALIN, İTALİK, ALTI ÇİZİLİ AÇMA / KAPATMA (TOGGLE) VE GERİ ALMA
// =========================================================================
console.log('\n[TEST 1] Kalın, İtalik, Altı Çizili Açma / Kapatma ve Geri Alma (Toggle):');
const p1 = editable.querySelector('#p1');
const p1Text = p1.firstChild;
// "Yazışma" kelimesini seç
const startIdx = p1Text.textContent.indexOf('Yazışma');
const endIdx = startIdx + 'Yazışma'.length;
selectText(p1Text, startIdx, endIdx);

// 1.1 Kalın Aç
commands.execute('bold');
console.log('  1.1 Kalın Yapıldı: isBold =', commands.queryCommandState('bold'));
if (!commands.queryCommandState('bold')) {
  console.error('❌ TEST 1.1 BAŞARISIZ: Kalın yapılamadı!');
  process.exit(1);
}

// 1.2 Kalın Kapat (Geri Al / Toggle Off)
commands.execute('bold');
console.log('  1.2 Kalın Kapatıldı: isBold =', commands.queryCommandState('bold'));
if (commands.queryCommandState('bold')) {
  console.error('❌ TEST 1.2 BAŞARISIZ: Kalın kapatılamadı (hala bold)!');
  process.exit(1);
}
console.log('  ✅ 1.2 Başarılı: Kalın yapılıp hemen ardından sorunsuz kapatıldı.');

// 1.3 İtalik Aç & Kapat
commands.execute('italic');
console.log('  1.3 İtalik Yapıldı: isItalic =', commands.queryCommandState('italic'));
if (!commands.queryCommandState('italic')) {
  console.error('❌ TEST 1.3 BAŞARISIZ: İtalik yapılamadı!');
  process.exit(1);
}
commands.execute('italic');
console.log('  1.4 İtalik Kapatıldı: isItalic =', commands.queryCommandState('italic'));
if (commands.queryCommandState('italic')) {
  console.error('❌ TEST 1.4 BAŞARISIZ: İtalik kapatılamadı!');
  process.exit(1);
}
console.log('  ✅ 1.4 Başarılı: İtalik yapılıp hemen ardından sorunsuz kapatıldı.');

// 1.5 Altı Çizili Aç & Kapat
commands.execute('underline');
console.log('  1.5 Altı Çizili Yapıldı: isUnderline =', commands.queryCommandState('underline'));
if (!commands.queryCommandState('underline')) {
  console.error('❌ TEST 1.5 BAŞARISIZ: Altı çizili yapılamadı!');
  process.exit(1);
}
commands.execute('underline');
console.log('  1.6 Altı Çizili Kapatıldı: isUnderline =', commands.queryCommandState('underline'));
if (commands.queryCommandState('underline')) {
  console.error('❌ TEST 1.6 BAŞARISIZ: Altı çizili kapatılamadı!');
  process.exit(1);
}
console.log('  ✅ 1.6 Başarılı: Altı çizili yapılıp hemen ardından sorunsuz kapatıldı.');

// =========================================================================
// [TEST 2] FONKSİYON KULLANILINCA SEÇİMİN KORUNMASI (SEÇİM KALKMIYOR)
// =========================================================================
console.log('\n[TEST 2] Fonksiyon Kullanılınca Seçimin Korunması (Seçim Kaybı Kontrolü):');
// "Sistemi" kelimesini seç
let targetNode = null;
const walker = document.createTreeWalker(p1, dom.window.NodeFilter.SHOW_TEXT);
while (walker.nextNode()) {
  if (walker.currentNode.textContent.includes('Sistemi')) {
    targetNode = walker.currentNode;
    break;
  }
}

const sStart = targetNode.textContent.indexOf('Sistemi');
const sEnd = sStart + 'Sistemi'.length;
selectText(targetNode, sStart, sEnd);

const selBefore = window.getSelection();
console.log('  İşlem öncesi seçim metni:', selBefore.toString());

// Bold çalıştır
commands.execute('bold');

const selAfter = window.getSelection();
console.log('  Bold sonrası seçim metni:', selAfter.toString());
console.log('  Bold sonrası seçim çöktü mü (collapsed):', selAfter.isCollapsed);

if (selAfter.isCollapsed || selAfter.toString().trim() !== 'Sistemi') {
  console.error('❌ TEST 2.1 BAŞARISIZ: Kalın yapınca seçim kalktı!');
  process.exit(1);
}
console.log('  ✅ 2.1 Başarılı: Kalın yapılınca seçim kalkmadı, metin seçili kaldı.');

// Punto değiştir
commands.execute('fontSize', '18pt');
const selAfterSize = window.getSelection();
console.log('  Punto (18pt) sonrası seçim metni:', selAfterSize.toString());
if (selAfterSize.isCollapsed || selAfterSize.toString().trim() !== 'Sistemi') {
  console.error('❌ TEST 2.2 BAŞARISIZ: Punto değişince seçim kalktı!');
  process.exit(1);
}
console.log('  ✅ 2.2 Başarılı: Punto değiştirilince seçim kalkmadı.');

// Hizalama değiştir
commands.execute('alignment', 'center');
const selAfterAlign = window.getSelection();
console.log('  Hizalama (Ortala) sonrası seçim metni:', selAfterAlign.toString());
if (selAfterAlign.isCollapsed || selAfterAlign.toString().trim() !== 'Sistemi') {
  console.error('❌ TEST 2.3 BAŞARISIZ: Hizalama yapılınca seçim kalktı!');
  process.exit(1);
}
console.log('  ✅ 2.3 Başarılı: Paragraf ortalanınca seçim kalkmadı.');

// =========================================================================
// [TEST 3] WORD (.DOCX) IMPORT HİZALAMALAR VE FORMATLARIN KORUNMASI
// =========================================================================
console.log('\n[TEST 3] Word (.docx) Import Hizalamalar ve Formatların Korunması:');

async function testWordImport() {
  const zip = new JSZip();

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="28"/>
          <w:rFonts w:ascii="Arial"/>
        </w:rPr>
        <w:t>T.C. İÇİŞLERİ BAKANLIĞI</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="right"/>
      </w:pPr>
      <w:r>
        <w:t>15.10.2024</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="both"/>
        <w:ind w:firstLine="709"/>
      </w:pPr>
      <w:r>
        <w:t>Bu resmi yazı metni iki yana yaslı ve 1.25cm girintilidir.</w:t>
      </w:r>
    </w:p>
    <w:tbl>
      <w:tr>
        <w:tc>
          <w:p>
            <w:r><w:t>Tablo Başlığı</w:t></w:r>
          </w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', docXml);

  const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  const importPlugin = commands.getImportPlugin();

  const convertedHtml = await importPlugin.convertDocxToHtml(arrayBuffer);
  console.log('  İçe Aktarılan HTML:\n', convertedHtml);

  // Doğrulamalar:
  const hasCenter = convertedHtml.includes('text-align: center');
  const hasRight = convertedHtml.includes('text-align: right');
  const hasJustify = convertedHtml.includes('text-align: justify');
  const hasIndent = convertedHtml.includes('text-indent: 1.25cm');
  const hasBold = convertedHtml.includes('<strong>') || convertedHtml.includes('font-weight: bold');
  const has14pt = convertedHtml.includes('14pt');
  const hasArial = convertedHtml.includes('Arial');
  const hasTable = convertedHtml.includes('<table');

  console.log('  Ortalama (center) korundu mu:', hasCenter);
  console.log('  Sağa Hizalama (right) korundu mu:', hasRight);
  console.log('  İki Yana Yaslama (justify) korundu mu:', hasJustify);
  console.log('  İlk Satır Girintisi (1.25cm) korundu mu:', hasIndent);
  console.log('  Kalınlık (bold) korundu mu:', hasBold);
  console.log('  Punto (14pt) korundu mu:', has14pt);
  console.log('  Font (Arial) korundu mu:', hasArial);
  console.log('  Tablo korundu mu:', hasTable);

  if (!hasCenter || !hasRight || !hasJustify || !hasIndent || !hasBold || !has14pt || !hasArial || !hasTable) {
    console.error('❌ TEST 3 BAŞARISIZ: Word içe aktarımında hizalamalar veya formatlar kayboldu!');
    process.exit(1);
  }

  console.log('  ✅ TEST 3 Başarılı: Word (.docx) dosyasındaki ortalama, sağa yaslama, iki yana yaslama, girinti, punto, font ve tablolar eksiksiz korundu!');
  console.log('\n🎉 TÜM TESTLER EKSİKSİZ VE BAŞARIYLA TAMAMLANDI!');
}

testWordImport().catch(err => {
  console.error('Hata:', err);
  process.exit(1);
});
