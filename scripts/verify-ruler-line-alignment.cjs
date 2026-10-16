const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const assert = require('assert');

async function runTests() {
  console.log('=== BAŞLANGIÇ: CETVEL ÜZERİNDE HER SATIRIN HİZASININ AYRI AYRI GÖRÜNMESİ TESTİ ===');

  const bundlePath = path.resolve(__dirname, '../dist/resmi-yazi-editor.umd.js');
  const cssPath = path.resolve(__dirname, '../dist/resmi-yazi-editor.css');

  const bundleCode = fs.readFileSync(bundlePath, 'utf8');
  const cssCode = fs.readFileSync(cssPath, 'utf8');

  const dom = new JSDOM(`<!DOCTYPE html><html><head><style>${cssCode}</style></head><body><div id="editorContainer"></div></body></html>`, {
    runScripts: 'dangerously',
    url: 'http://localhost/'
  });

  const { window } = dom;
  const { document } = window;

  const scriptEl = document.createElement('script');
  scriptEl.textContent = bundleCode;
  document.body.appendChild(scriptEl);

  const { ResmiYaziEditor } = window;
  const container = document.getElementById('editorContainer');

  const editor = await ResmiYaziEditor.create(container, {
    initialData: '<p id="testP" style="text-indent: 1.25cm;">Bu birinci satırdır.<br id="br1">Bu ikinci satırdır.<br id="br2">&nbsp;&nbsp;&nbsp;&nbsp;Bu üçüncü satırdır.</p>'
  });

  const toolbar = editor.toolbar;
  const ruler = toolbar.getRuler();
  assert(ruler, 'Toolbar üzerinde ruler nesnesi bulunamadı');

  const rulerBar = container.querySelector('.rye-ruler-bar');
  assert(rulerBar, 'rye-ruler-bar bulunamadı');

  const sliderFirstLine = rulerBar.querySelector('.rye-slider-firstline');
  const sliderCurrentLine = rulerBar.querySelector('.rye-slider-currentline');
  const lineBadge = rulerBar.querySelector('.rye-ruler-line-badge');
  const lineTicksContainer = rulerBar.querySelector('.rye-ruler-line-ticks');

  assert(sliderFirstLine, 'sliderFirstLine (1. satır sürgüsü) bulunamadı');
  assert(sliderCurrentLine, 'sliderCurrentLine (Aktif satır ibresi) bulunamadı');
  assert(lineBadge, 'lineBadge (Cetvel satır rozeti) bulunamadı');
  assert(lineTicksContainer, 'lineTicksContainer (Her satırın cetvel çentikleri) bulunamadı');

  console.log('\n[KONTROL 1] 1. Satırda İken Cetvel Senkronizasyonu:');
  const p = editor.editable.querySelector('#testP');
  const br1 = editor.editable.querySelector('#br1');
  const br2 = editor.editable.querySelector('#br2');

  // İmleci 1. satırın metin düğümüne yerleştirelim
  const text1 = p.firstChild;
  const range1 = document.createRange();
  range1.setStart(text1, 2);
  range1.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range1);

  ruler.updateFromSelection(p);

  assert.strictEqual(ruler.getActiveLineNumber(), 1, '1. satırda iken aktif satır 1 olmalı');
  assert.strictEqual(ruler.getCurrentLineCm(), 1.25, '1. satırın hizası 1.25 cm olmalı');
  assert.strictEqual(sliderFirstLine.style.left, '1.25cm', '1. satır sürgüsü 1.25cm olmalı');
  assert.strictEqual(sliderCurrentLine.style.left, '1.25cm', 'Aktif satır ibresi 1.25cm olmalı');
  assert(lineBadge.textContent.includes('Satır 1: 1.25 cm'), 'Rozette Satır 1: 1.25 cm yazmalı');
  console.log('  ✅ 1.1 İmleç 1. satırdayken cetvel 1.25 cm hizasını gösterdi, rozet "Satır 1: 1.25 cm" olarak güncellendi.');

  console.log('\n[KONTROL 2] 2. Satıra Geçildiğinde Cetvelin O Satırın Hizasına (0.00 cm) Otomatik Geçmesi:');
  // İmleci br1 sonrasına, 2. satır metin düğümüne yerleştirelim
  const text2 = br1.nextSibling;
  const range2 = document.createRange();
  range2.setStart(text2, 2);
  range2.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range2);

  ruler.updateFromSelection(p);

  assert.strictEqual(ruler.getActiveLineNumber(), 2, '2. satıra geçildiğinde aktif satır 2 olmalı');
  assert.strictEqual(ruler.getCurrentLineCm(), 0, '2. satırın girintisi 0 cm olmalı (CSS text-indent 2. satıra geçmez)');
  assert.strictEqual(sliderCurrentLine.style.left, '0cm', 'Aktif satır ibresi 2. satır için 0cm konumuna gelmeli');
  assert(lineBadge.textContent.includes('Satır 2: 0.00 cm'), 'Rozette Satır 2: 0.00 cm yazmalı');
  console.log('  ✅ 2.1 İmleç 2. satıra geçtiğinde cetvel ayrı olarak 0.00 cm hizasını gösterdi, rozet "Satır 2: 0.00 cm" oldu.');

  console.log('\n[KONTROL 3] 3. Satıra (4 Boşluklu Satır) Geçildiğinde Cetvelin O Satırın Hizasına (1.25 cm) Geçmesi:');
  // İmleci br2 sonrasına, 3. satır metin düğümüne yerleştirelim
  const text3 = br2.nextSibling;
  const range3 = document.createRange();
  range3.setStart(text3, 6);
  range3.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range3);

  ruler.updateFromSelection(p);

  assert.strictEqual(ruler.getActiveLineNumber(), 3, '3. satıra geçildiğinde aktif satır 3 olmalı');
  assert.strictEqual(ruler.getCurrentLineCm(), 1.25, '3. satır 4 boşluk içerdiği için cetvel hizası 1.25 cm olmalı');
  assert.strictEqual(sliderCurrentLine.style.left, '1.25cm', 'Aktif satır ibresi 1.25cm konumuna gelmeli');
  assert(lineBadge.textContent.includes('Satır 3: 1.25 cm'), 'Rozette Satır 3: 1.25 cm yazmalı');
  console.log('  ✅ 3.1 İmleç 3. satıra geçtiğinde cetvel o satırın serbest boşluk hizasını (1.25 cm) gösterdi.');

  console.log('\n[KONTROL 4] Her Satırın Cetvel Hizalarının Ayrı Ayrı Çentiklerle Görünmesi:');
  const ticks = lineTicksContainer.querySelectorAll('.rye-ruler-line-tick');
  assert.strictEqual(ticks.length, 3, 'Paragraftaki 3 satır için cetvel üzerinde 3 ayrı çentik bulunmalı');
  assert(ticks[0].textContent.includes('S1'), '1. satır çentiği S1 etiketli olmalı');
  assert(ticks[1].textContent.includes('S2'), '2. satır çentiği S2 etiketli olmalı');
  assert(ticks[2].textContent.includes('S3'), '3. satır çentiği S3 etiketli olmalı');
  assert.strictEqual(ticks[0].style.left, '1.25cm', 'S1 çentiği 1.25cm konumunda olmalı');
  assert.strictEqual(ticks[1].style.left, '0cm', 'S2 çentiği 0cm konumunda olmalı');
  assert.strictEqual(ticks[2].style.left, '1.25cm', 'S3 çentiği 1.25cm konumunda olmalı');
  assert(ticks[2].classList.contains('is-active'), 'Aktif olan 3. satır çentiği is-active sınıfına sahip olmalı');
  console.log('  ✅ 4.1 Cetvel üzerinde her satırın hizası S1 (1.25cm), S2 (0cm), S3 (1.25cm) olarak ayrı ayrı görüntülendi!');

  console.log('\n>>> TÜM CETVEL SATIR HİZASI TESTLERİ %100 BAŞARIYLA TAMAMLANDI! <<<');
}

runTests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});
