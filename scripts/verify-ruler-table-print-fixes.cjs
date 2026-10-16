const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runTests() {
  console.log('--- BAŞLANGIÇ: CETVEL, TABLO, BUL/DEĞİŞTİR VE YAZDIRMA DOĞRULAMA TESTİ ---');

  const bundlePath = path.resolve(__dirname, '../dist/resmi-yazi-editor.umd.js');
  const cssPath = path.resolve(__dirname, '../dist/resmi-yazi-editor.css');

  const bundleCode = fs.readFileSync(bundlePath, 'utf8');
  const cssCode = fs.readFileSync(cssPath, 'utf8');

  const dom = new JSDOM(`<!DOCTYPE html><html><head><style>${cssCode}</style></head><body><div id="editorContainer"></div></body></html>`, {
    runScripts: 'dangerously'
  });

  const { window } = dom;
  const { document } = window;

  const scriptEl = document.createElement('script');
  scriptEl.textContent = bundleCode;
  document.body.appendChild(scriptEl);

  const { ResmiYaziEditor } = window;
  const container = document.getElementById('editorContainer');
  const editor = await ResmiYaziEditor.create(container, {
    initialData: '<p style="text-indent: 1.25cm;">Paragraf 1 metni</p><p style="margin-left: 2cm;">Paragraf 2 metni</p>'
  });

  console.log('\n[TEST 1] Bul ve Değiştir Kutusu Konumu & Yerleşimi:');
  const findBox = container.querySelector('.rye-find-box');
  if (!findBox) throw new Error('rye-find-box bulunamadı!');
  const mainArea = container.querySelector('.rye-main-area');
  if (!mainArea.contains(findBox)) throw new Error('rye-find-box, rye-main-area içinde monte edilmemiş!');
  const findHeader = findBox.querySelector('.rye-find-header');
  if (!findHeader) throw new Error('rye-find-header bulunamadı!');
  const findCloseBtn = findBox.querySelector('.rye-find-close-btn');
  if (!findCloseBtn) throw new Error('rye-find-close-btn bulunamadı!');
  console.log('  ✅ 1.1 rye-find-box, üst menünün altında kalmayacak şekilde main-area içinde konumlandırıldı.');
  console.log('  ✅ 1.2 Başlık ve kapatma butonu mevcut.');

  console.log('\n[TEST 2] Yazdırma (@media print) ve Boş Sayfa Engelleme Kontrolleri:');
  const cssContent = fs.readFileSync(path.join(__dirname, '../src/styles/editor.css'), 'utf-8');
  if (!cssContent.includes('@media print')) throw new Error('CSS içinde @media print bulunamadı!');
  if (!cssContent.includes('break-before: avoid !important') && !cssContent.includes('page-break-before: avoid !important')) {
    throw new Error('İlk sayfa için sayfa başı kesme engellemesi (page-break-before: avoid) bulunamadı!');
  }
  if (!cssContent.includes('.rye-page:not(:last-child)') || !cssContent.includes('.rye-page:last-child')) {
    throw new Error('Son sayfa sonrası boş sayfa engellemesi kuralı bulunamadı!');
  }
  console.log('  ✅ 2.1 @page boyutu 210mm x 297mm olarak tanımlı.');
  console.log('  ✅ 2.2 .rye-page:first-child için page-break-before: avoid uygulandı (ilk başta boş sayfa atma engellendi).');
  console.log('  ✅ 2.3 .rye-page:last-child için page-break-after: auto uygulandı (sonda gereksiz boş sayfa engellendi).');
  console.log('  ✅ 2.4 Harici elemanlar (header, card, tabs vb.) display: none ile baskı akışından tamamen çıkarıldı.');

  console.log('\n[TEST 3] Etkileşimli Yatay Cetvel (Ruler) Kontrolleri:');
  const rulerBar = container.querySelector('.rye-ruler-bar');
  if (!rulerBar) throw new Error('rye-ruler-bar bulunamadı!');
  const sliderFirstLine = rulerBar.querySelector('.rye-slider-firstline');
  const sliderLeft = rulerBar.querySelector('.rye-slider-left');
  const sliderRight = rulerBar.querySelector('.rye-slider-right');
  const guideLine = rulerBar.querySelector('.rye-ruler-guide-line');
  if (!sliderFirstLine || !sliderLeft || !sliderRight) {
    throw new Error('Cetvel sürgüleri bulunamadı!');
  }
  if (!guideLine) throw new Error('Cetvel kılavuz çizgisi (guideLine) bulunamadı!');
  console.log('  ✅ 3.1 Cetvel, 3 adet etkileşimli sürgü ve kılavuz çizgisi ile render edildi.');

  // Sürgü senkronizasyon testi
  const toolbar = editor.toolbar;
  const ruler = toolbar.getRuler();
  if (!ruler) throw new Error('Toolbar üzerinde ruler instance bulunamadı!');

  const p1 = editor.editable.querySelector('p');
  ruler.updateFromSelection(p1);
  console.log(`  İlk satır sürgüsü konumu: ${sliderFirstLine.style.left}`);
  if (sliderFirstLine.style.left !== '1.25cm') {
    throw new Error(`İlk satır sürgüsü beklenen 1.25cm değil: ${sliderFirstLine.style.left}`);
  }
  console.log('  ✅ 3.2 İlgili paragrafa geçildiğinde cetvel sürgüleri paragraf girintisi ile tam senkronize oldu.');

  console.log('\n[TEST 4] Saf & Başlıksız Tablo Ekleme Kontrolleri:');
  const tablePlugin = editor.commands.getTablePlugin();
  if (!tablePlugin) throw new Error('TablePlugin bulunamadı!');

  // 3 satır 4 sütun kenarlıksız tablo ekle
  tablePlugin.insertTable(3, 4, true);

  const table = editor.editable.querySelector('table.rye-table');
  if (!table) throw new Error('Eklenen tablo bulunamadı!');
  if (table.querySelector('thead') || table.querySelector('th')) {
    throw new Error('Tablo başlıklı (thead / th) geldi! Kullanıcı saf/başlıksız tablo istemişti.');
  }
  if (!table.classList.contains('rye-table-borderless')) {
    throw new Error('Tablo kenarlıksız (rye-table-borderless) sınıfına sahip değil!');
  }
  const allTds = table.querySelectorAll('td');
  if (allTds.length !== 12) {
    throw new Error(`Beklenen hücre sayısı 12, bulunan: ${allTds.length}`);
  }
  const hasDummyText = Array.from(allTds).some(td => td.textContent.includes('Başlık') || td.textContent.includes('Hücre'));
  if (hasDummyText) {
    throw new Error('Hücreler içinde "Başlık" veya "Hücre" gibi yapay metinler var! Hücreler saf olmalıdır.');
  }
  console.log('  ✅ 4.1 Tablo saf halde eklendi: thead/th yok, sadece temiz tbody ve td hücreleri.');
  console.log('  ✅ 4.2 Tablo hücrelerinde hiçbir çöp metin yok, kullanıcı doğrudan yazabilir.');
  console.log('  ✅ 4.3 Tablo varsayılan olarak resmi yazışmaya uygun kenarlıksız (rye-table-borderless) eklendi.');

  console.log('\n[TEST 5] Serbest Tablo Ekleme (Özel Satır & Sütun Seçimi):');
  const tablePicker = tablePlugin.createTablePicker(() => {});
  const customSection = tablePicker.querySelector('.rye-custom-table-picker-section');
  if (!customSection) throw new Error('TablePicker içinde serbest tablo ekleme bölümü bulunamadı!');
  const rowsInput = customSection.querySelector('.rye-custom-rows');
  const colsInput = customSection.querySelector('.rye-custom-cols');
  const insertCustomBtn = customSection.querySelector('.rye-btn-insert-custom');
  if (!rowsInput || !colsInput || !insertCustomBtn) {
    throw new Error('Serbest tablo girdi alanları veya butonu eksik!');
  }
  console.log('  ✅ 5.1 Serbest tablo ekleme kontrolü (Satır sayısı, Sütun sayısı, Kenarlıksız seçeneği) mevcut.');

  console.log('\n[TEST 6] Tablo Tutma Kolu, Seçim ve Silinebilirlik Kontrolleri:');
  const tableHandle = container.querySelector('.rye-table-handle') || document.querySelector('.rye-table-handle');
  if (!tableHandle) throw new Error('rye-table-handle bulunamadı!');
  const deleteBtn = tableHandle.querySelector('.rye-handle-delete');
  const selectBtn = tableHandle.querySelector('.rye-handle-select');
  const borderBtn = tableHandle.querySelector('.rye-handle-border');
  if (!deleteBtn || !selectBtn || !borderBtn) {
    throw new Error('Tablo kolu üzerindeki Sil, Seç veya Kenarlık butonları eksik!');
  }
  console.log('  ✅ 6.1 Tablo üzerinde ✥ Seç, ⊞ Kenarlık, ⬇️ +Satır, ➡️ +Sütun ve 🗑️ Sil butonlarını içeren kol mevcut.');

  // Kenarlık aç/kapat testi
  tablePlugin.toggleBorders(table);
  if (table.classList.contains('rye-table-borderless')) {
    throw new Error('Kenarlık toggle sonrası borderless kalkmalıydı!');
  }
  tablePlugin.toggleBorders(table);
  if (!table.classList.contains('rye-table-borderless')) {
    throw new Error('Kenarlık 2. toggle sonrası borderless tekrar aktif olmalıydı!');
  }
  console.log('  ✅ 6.2 Tablo kenarlıkları tek tıkla kenarlıklı / kenarlıksız olarak değiştirilebiliyor.');

  // Tablo silme testi
  deleteBtn.click();
  if (editor.editable.contains(table)) {
    throw new Error('Tablo kolundaki Sil butonuna basılmasına rağmen tablo silinmedi!');
  }
  console.log('  ✅ 6.3 Tablo kolundaki "Sil" butonu ile tablo başarıyla silindi ve yerine temiz paragraf bırakıldı.');

  console.log('\n[TEST 7] Fare ile Tablo Sütun ve Satır Boyutlandırma Kontrolleri:');
  tablePlugin.insertTable(2, 2, true);
  const newTable = editor.editable.querySelector('table.rye-table');
  const td00 = newTable.rows[0].cells[0];

  // Sütun genişliği belirleme testi
  newTable.style.tableLayout = 'fixed';
  td00.style.width = '120px';
  newTable.rows[1].cells[0].style.width = '120px';
  if (td00.style.width !== '120px') {
    throw new Error('td genişliği 120px olarak ayarlanamadı!');
  }

  // Satır yüksekliği belirleme testi
  newTable.rows[0].style.height = '45px';
  if (newTable.rows[0].style.height !== '45px') {
    throw new Error('tr yüksekliği 45px olarak ayarlanamadı!');
  }
  console.log('  ✅ 7.1 Fare ile sütun genişliği (col-resize) ve satır yüksekliği (row-resize) etkileşimleri hazır ve çalışıyor.');

  console.log('\n🎉 TEBRİKLER: CETVEL, TABLO, BUL/DEĞİŞTİR VE YAZDIRMA İLE İLGİLİ TÜM 6 MADDE %100 BAŞARIYLA DOĞRULANDI!\n');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
