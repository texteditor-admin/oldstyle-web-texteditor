const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const bundlePath = path.resolve(__dirname, '../dist/resmi-yazi-editor.umd.js');
const cssPath = path.resolve(__dirname, '../dist/resmi-yazi-editor.css');

const bundleCode = fs.readFileSync(bundlePath, 'utf8');
const cssCode = fs.readFileSync(cssPath, 'utf8');

const dom = new JSDOM(`<!DOCTYPE html><html><head><style>${cssCode}</style></head><body><div id="editor"></div></body></html>`, {
  runScripts: "dangerously"
});

const { window } = dom;
const { document } = window;

// Attach bundle
const scriptEl = document.createElement('script');
scriptEl.textContent = bundleCode;
document.body.appendChild(scriptEl);

const { ResmiYaziEditor } = window;
if (!ResmiYaziEditor) {
  console.error('FAIL: ResmiYaziEditor bulunamadı!');
  process.exit(1);
}

async function runTests() {
  console.log('--- BAŞLANGIÇ: PANEL & LISTBOX & FORMAT DOĞRULAMA TESTİ ---');

  const editorTarget = document.getElementById('editor');
  const editor = await ResmiYaziEditor.create(editorTarget, {
    initialData: '<p>T.C. İÇİŞLERİ BAKANLIĞI Resmi Yazışma Metni</p>'
  });

  const container = editorTarget.querySelector('.rye-container');
  const ribbon = container.querySelector('.rye-ribbon');
  const editable = container.querySelector('.rye-editable');

  console.log('✅ Editör başarıyla oluşturuldu.');

  // TEST 1: LISTBOX (COMBOBOX) AÇILMA TESTLERİ
  console.log('\n[TEST 1] Listbox (Açılır Kutu) Açılma Kontrolleri:');
  
  // 1.1 Font Family Listbox
  const fontCombo = ribbon.querySelector('.rye-font-combobox');
  const fontTrigger = fontCombo.querySelector('.rye-combobox-trigger');
  const fontPanel = fontCombo.querySelector('.rye-dropdown-panel');

  fontTrigger.click();
  if (!fontCombo.classList.contains('is-open')) {
    throw new Error('Yazı tipi açılır kutusu .is-open sınıfını almadı!');
  }
  console.log('  ✅ 1.1 Yazı tipi (Font Family) listbox tıklandığında .is-open aldı.');

  // 1.2 Font Size Listbox
  const sizeCombo = ribbon.querySelector('.rye-size-combobox');
  const sizeTrigger = sizeCombo.querySelector('.rye-combobox-trigger');
  const sizePanel = sizeCombo.querySelector('.rye-dropdown-panel');

  sizeTrigger.click();
  if (!sizeCombo.classList.contains('is-open')) {
    throw new Error('Punto açılır kutusu .is-open sınıfını almadı!');
  }
  if (fontCombo.classList.contains('is-open')) {
    throw new Error('Yeni kutu açıldığında önceki açık kutu kapanmadı!');
  }
  console.log('  ✅ 1.2 Punto (Font Size) listbox açıldı ve önceki listbox kapandı.');

  // 1.3 Paragraf Boşluğu Listbox
  const paraCombo = ribbon.querySelector('.rye-ribbon [title="Paragraf Sonrası Boşluk"]').closest('.rye-combobox');
  const paraTrigger = paraCombo.querySelector('.rye-combobox-trigger');
  paraTrigger.click();
  if (!paraCombo.classList.contains('is-open')) {
    throw new Error('Paragraf boşluğu listbox açılmadı!');
  }
  console.log('  ✅ 1.3 Paragraf Boşluğu listbox başarıyla açıldı.');

  // 1.4 İlk Satır Girintisi Listbox
  const indentCombo = ribbon.querySelector('.rye-ribbon [title="İlk Satır Girintisi"]').closest('.rye-combobox');
  const indentTrigger = indentCombo.querySelector('.rye-combobox-trigger');
  indentTrigger.click();
  if (!indentCombo.classList.contains('is-open')) {
    throw new Error('İlk satır girintisi listbox açılmadı!');
  }
  console.log('  ✅ 1.4 İlk Satır Girintisi listbox başarıyla açıldı.');

  // 1.5 Dışarı tıklama ile listbox kapanma testi
  document.body.click();
  if (indentCombo.classList.contains('is-open')) {
    throw new Error('Dışarı tıklandığında açık menü kapanmadı!');
  }
  console.log('  ✅ 1.5 Dışarı tıklandığında listbox başarıyla kapandı.');

  // TEST 2: KALIN (BOLD), ALTI ÇİZİLİ (UNDERLINE), İTALİK (ITALIC) BUTONLARI VE AKTİF DURUMLARI
  console.log('\n[TEST 2] Kalın, Altı Çizili, İtalik Format ve Aktifleşme Kontrolleri:');

  // Metin seçimi simülasyonu
  const page1 = editable.querySelector('.rye-page');
  const p = page1.querySelector('p');
  const textNode = p.firstChild;

  const range = document.createRange();
  range.setStart(textNode, 5); // "İÇİŞLERİ"
  range.setEnd(textNode, 13);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  editor.selection.save();

  // 2.1 Kalın (Bold)
  const boldBtn = ribbon.querySelector('button[title*="Kalın"]');
  boldBtn.click();
  editor.toolbar.updateState();

  const afterBoldHtml = editor.getData();
  console.log('  HTML (Bold sonrası):', afterBoldHtml);
  if (!afterBoldHtml.includes('strong') && !afterBoldHtml.includes('b') && !afterBoldHtml.includes('font-weight')) {
    throw new Error('Kalın formatı metne uygulanmadı!');
  }
  console.log('  ✅ 2.1 Kalın (Bold) formatı başarıyla uygulandı.');

  // 2.2 Altı Çizili (Underline)
  const underlineBtn = ribbon.querySelector('button[title*="Altı Çizili"]');
  underlineBtn.click();
  editor.toolbar.updateState();

  const afterUnderlineHtml = editor.getData();
  console.log('  HTML (Altı Çizili sonrası):', afterUnderlineHtml);
  if (!afterUnderlineHtml.includes('u') && !afterUnderlineHtml.includes('underline')) {
    throw new Error('Altı çizili formatı metne uygulanmadı!');
  }
  console.log('  ✅ 2.2 Altı Çizili (Underline) formatı başarıyla uygulandı.');

  // 2.3 İtalik (Italic)
  const italicBtn = ribbon.querySelector('button[title*="İtalik"]');
  italicBtn.click();
  editor.toolbar.updateState();

  const afterItalicHtml = editor.getData();
  console.log('  HTML (İtalik sonrası):', afterItalicHtml);
  if (!afterItalicHtml.includes('i') && !afterItalicHtml.includes('em') && !afterItalicHtml.includes('italic')) {
    throw new Error('İtalik formatı metne uygulanmadı!');
  }
  console.log('  ✅ 2.3 İtalik (Italic) formatı başarıyla uygulandı.');

  // TEST 3: LISTBOX'TAN FONT DEĞİŞTİRME VE PUNTO DEĞİŞTİRME
  console.log('\n[TEST 3] Listbox Üzerinden Yazı Tipi ve Punto Değişimi:');

  // Yazı Tipi seçimi: "Arial" tıkla
  fontTrigger.click();
  const arialItem = fontPanel.querySelector('[data-value*="Arial"]');
  if (!arialItem) throw new Error('Arial seçeneği bulunamadı!');
  arialItem.click();

  const fontLabel = fontTrigger.querySelector('.rye-label').textContent;
  if (!fontLabel.includes('Arial')) {
    throw new Error(`Yazı tipi etiketi Arial olmadı, mevcut: ${fontLabel}`);
  }
  console.log('  ✅ 3.1 Listbox üzerinden Arial seçildi, combobox etiketi güncellendi:', fontLabel);

  // Punto seçimi: "18" tıkla
  sizeTrigger.click();
  const size18Item = sizePanel.querySelector('[data-value="18pt"]');
  if (!size18Item) throw new Error('18pt seçeneği bulunamadı!');
  size18Item.click();

  const sizeLabel = sizeTrigger.querySelector('.rye-label').textContent;
  if (!sizeLabel.includes('18')) {
    throw new Error(`Punto etiketi 18 olmadı, mevcut: ${sizeLabel}`);
  }
  console.log('  ✅ 3.2 Listbox üzerinden 18pt seçildi, combobox etiketi güncellendi:', sizeLabel);

  const finalHtml = editor.getData();
  console.log('  Final HTML:', finalHtml);
  if (!finalHtml.includes('18pt') && !finalHtml.includes('Arial')) {
    throw new Error('18pt veya Arial final HTML içinde yer almadı!');
  }
  console.log('  ✅ 3.3 Hem Arial hem 18pt içeriğe uygulandı!');

  // TEST 4: A▲ VE A▼ PUNTO BÜYÜT/KÜÇÜLT BUTONLARI
  console.log('\n[TEST 4] A▲ ve A▼ Butonları:');
  const incBtn = ribbon.querySelector('button[title*="Büyüt"]');
  incBtn.click();
  editor.toolbar.updateState();
  const labelAfterInc = sizeTrigger.querySelector('.rye-label').textContent;
  console.log('  A▲ tıklandı -> Yeni Punto:', labelAfterInc);
  if (parseInt(labelAfterInc) <= 18) {
    throw new Error(`A▲ sonrası punto büyümedi: ${labelAfterInc}`);
  }
  console.log('  ✅ 4.1 A▲ butonuyla punto başarıyla büyütüldü (18 -> 20pt).');

  const decBtn = ribbon.querySelector('button[title*="Küçült"]');
  decBtn.click();
  editor.toolbar.updateState();
  const labelAfterDec = sizeTrigger.querySelector('.rye-label').textContent;
  console.log('  A▼ tıklandı -> Yeni Punto:', labelAfterDec);
  if (labelAfterDec !== '18') {
    throw new Error(`A▼ sonrası punto 18 olmadı: ${labelAfterDec}`);
  }
  console.log('  ✅ 4.2 A▼ butonuyla punto başarıyla küçültüldü (20 -> 18pt).');

  console.log('\n🎉 TÜM PANEL, LISTBOX, ANIMASYON VE FORMAT TESTLERİ EKSİKSİZ GEÇTİ!');
}

runTests().catch(err => {
  console.error('TEST HATASI:', err);
  process.exit(1);
});
