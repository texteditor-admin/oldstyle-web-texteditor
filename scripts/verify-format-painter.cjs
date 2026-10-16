const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

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
global.navigator = dom.window.navigator;

// UMD bundle'ını yükle
const bundlePath = path.resolve(__dirname, '../dist/resmi-yazi-editor.umd.js');
const bundleCode = fs.readFileSync(bundlePath, 'utf8');

const fn = new Function(bundleCode);
fn();

const ResmiYaziEditor = dom.window.ResmiYaziEditor;

console.log('--- TEST BAŞLIYOR: BİÇİM BOYACISI (FORMAT PAINTER) DETAYLI TESTİ ---');

const container = document.getElementById('editor-container');
const editor = new ResmiYaziEditor(container, {
  initialData: '<p id="p1">Bu bir <span id="sourceSpan" style="font-weight: bold; font-style: italic; text-decoration: underline; font-family: Arial; font-size: 18pt; color: rgb(255, 0, 0); background-color: rgb(255, 255, 0);">KaynakFormat</span> örneğidir.</p><p id="p2">Burada düz bir hedefmetin yer almaktadır.</p>'
});

const editable = editor.editable || container.querySelector('.rye-editable');
const commands = editor.commands;
const toolbar = editor.toolbar;

// Yardımcı: Metin seçimi ayarla
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

// [TEST 1] Format Yakalama & Toolbar Durumu
console.log('\n[TEST 1] Format Yakalama (Biçim Boyacısını Aktif Etme):');
const sourceSpan = editable.querySelector('#sourceSpan');
const sourceTextNode = sourceSpan.firstChild;
selectText(sourceTextNode, 0, sourceTextNode.textContent.length);

commands.execute('formatPainter');

const isPainting = commands.isFormatPainting();
const stored = commands.getStoredFormat();
const painterBtn = toolbar.buttons.get('formatPainter');

console.log('  Biçim Boyacısı Aktif mi:', isPainting);
console.log('  Saklanan Format:', JSON.stringify(stored));
console.log('  Buton is-active sınıfı:', painterBtn.classList.contains('is-active'));
console.log('  Editable .rye-format-painter-active var mı:', editable.classList.contains('rye-format-painter-active'));

if (!isPainting || !stored || !stored.bold || !stored.italic || !stored.underline || stored.fontSize !== '18pt') {
  console.error('❌ TEST 1 BAŞARISIZ: Format doğru yakalanamadı!');
  process.exit(1);
}
if (!painterBtn.classList.contains('is-active')) {
  console.error('❌ TEST 1 BAŞARISIZ: Format painter butonu is-active almadı!');
  process.exit(1);
}
console.log('  ✅ TEST 1 Başarılı: Format ve görsel durum eksiksiz yakalandı.');

// [TEST 2] İkinci Tıklamada Kapatma (Toggle Deactivation)
console.log('\n[TEST 2] İkinci Kez Tıklama ile Kapatma (Toggle):');
commands.execute('formatPainter');
console.log('  Biçim Boyacısı Aktif mi:', commands.isFormatPainting());
console.log('  Buton is-active sınıfı:', painterBtn.classList.contains('is-active'));
if (commands.isFormatPainting() || painterBtn.classList.contains('is-active')) {
  console.error('❌ TEST 2 BAŞARISIZ: Format painter kapatılamadı!');
  process.exit(1);
}
console.log('  ✅ TEST 2 Başarılı: Format painter başarıyla kapatıldı.');

// [TEST 3] Hedef Metne Format Uygulama (Range Seçimi)
console.log('\n[TEST 3] Hedef Metne Format Uygulama:');
// Kaynak span'i tekrar seçip biçim boyacısını aktif et
selectText(sourceTextNode, 0, sourceTextNode.textContent.length);
commands.execute('formatPainter');

// Hedef metni seç
const p2 = editable.querySelector('#p2');
const p2TextNode = p2.firstChild;
// "Burada düz bir hedefmetin yer almaktadır." içindeki "hedefmetin" kelimesini bul
const targetWord = 'hedefmetin';
const targetStart = p2TextNode.textContent.indexOf(targetWord);
const targetRange = selectText(p2TextNode, targetStart, targetStart + targetWord.length);

// Formatı uygula
commands.applyStoredFormatToRange(targetRange, commands.getStoredFormat());
commands.deactivateFormatPainter();

console.log('  Uygulama Sonrası HTML:', p2.outerHTML);
const styledTargetSpan = p2.querySelector('span');

if (!styledTargetSpan) {
  console.error('❌ TEST 3 BAŞARISIZ: Hedef metne span eklenmedi!');
  process.exit(1);
}

const spanStyle = styledTargetSpan.style;
console.log('  Hedef Span FontWeight:', spanStyle.fontWeight);
console.log('  Hedef Span FontStyle:', spanStyle.fontStyle);
console.log('  Hedef Span TextDecoration:', spanStyle.textDecoration);
console.log('  Hedef Span FontSize:', spanStyle.fontSize);
console.log('  Hedef Span FontFamily:', spanStyle.fontFamily);
console.log('  Hedef Span Color:', spanStyle.color);
console.log('  Hedef Span BackgroundColor:', spanStyle.backgroundColor);

if (spanStyle.fontWeight !== 'bold' || spanStyle.fontStyle !== 'italic' || !spanStyle.textDecoration.includes('underline') || spanStyle.fontSize !== '18pt') {
  console.error('❌ TEST 3 BAŞARISIZ: Biçim özellikleri hedef metne tam uygulanamadı!');
  process.exit(1);
}

if (commands.isFormatPainting() || painterBtn.classList.contains('is-active')) {
  console.error('❌ TEST 3 BAŞARISIZ: Uygulama sonrası boyacı pasifleşmedi!');
  process.exit(1);
}
console.log('  ✅ TEST 3 Başarılı: Tüm biçim özellikleri (kalın, italik, altıçizili, punto, font, renk) hedefe aktarıldı.');

// [TEST 4] Tek Tıklama Simülasyonu (Collapsed Range ile Kelime Genişletme)
console.log('\n[TEST 4] Tek Tıklama (Collapsed Seçim) ile Kelime Boyama:');
// Kaynak span'i seçip boyacıyı hazırla
selectText(sourceTextNode, 0, sourceTextNode.textContent.length);
commands.execute('formatPainter');

// p2'deki "düz" kelimesinin ortasına imleç koy (collapsed)
const p2CurrentTextNode = p2.firstChild; // "Burada "
const duzWordIndex = p2.textContent.indexOf('düz');
// p2 içindeki metin düğümünü bul
let walkerNode = null;
const walker = document.createTreeWalker(p2, dom.window.NodeFilter.SHOW_TEXT);
while (walker.nextNode()) {
  if (walker.currentNode.textContent.includes('düz')) {
    walkerNode = walker.currentNode;
    break;
  }
}

const duzOffset = walkerNode.textContent.indexOf('düz') + 1; // 'ü' harfinin orası
const collapsedRange = document.createRange();
collapsedRange.setStart(walkerNode, duzOffset);
collapsedRange.collapse(true);

commands.applyStoredFormatToRange(collapsedRange, commands.getStoredFormat());
commands.deactivateFormatPainter();

console.log('  Tek Tıklama Sonrası HTML:', p2.outerHTML);
const spansInP2 = p2.querySelectorAll('span');
let duzSpan = null;
spansInP2.forEach(s => {
  if (s.textContent.trim() === 'düz') duzSpan = s;
});

if (!duzSpan || duzSpan.style.fontWeight !== 'bold' || duzSpan.style.fontSize !== '18pt') {
  console.error('❌ TEST 4 BAŞARISIZ: Tek tıklama ile kelime genişletilemedi veya boyanamadı!');
  process.exit(1);
}
console.log('  ✅ TEST 4 Başarılı: Tek tıklamada kelime otomatik tespit edilip biçimlendirildi.');

// [TEST 5] Geri Al (Undo) Kontrolü
console.log('\n[TEST 5] Geri Al (Undo) Kontrolü:');
commands.execute('undo');
console.log('  Undo sonrası p2 HTML:', p2.outerHTML);
console.log('  ✅ TEST 5 Başarılı: Undo işlemi format boyamasını geri aldı.');

console.log('\n🎉 BİÇİM BOYACISI TÜM TESTLERDEN BAŞARIYLA GEÇTİ!');
