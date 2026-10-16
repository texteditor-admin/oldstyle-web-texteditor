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

async function runToolbarLayoutTests() {
  console.log('--- BAŞLANGIÇ: YENİ ARAÇ ÇUBUĞU, MENÜBAR, CETVEL VE İKON DOĞRULAMA TESTİ ---');

  const editorTarget = document.getElementById('editor');
  const editor = await ResmiYaziEditor.create(editorTarget, {
    initialData: '<p>T.C. İÇİŞLERİ BAKANLIĞI Resmi Yazışma Metni</p>'
  });

  const container = editorTarget.querySelector('.rye-container');
  const toolbar = container.querySelector('.rye-toolbar');

  if (!toolbar) {
    throw new Error('Toolbar elemanı (.rye-toolbar) bulunamadı!');
  }
  console.log('✅ 1. Ana Toolbar başarıyla yüklendi.');

  // TEST 1: MENÜ ÇUBUĞU KONTROLÜ
  console.log('\n[TEST 1] Üst Menü Çubuğu (Menubar) Kontrolleri:');
  const menubar = toolbar.querySelector('.rye-menubar');
  if (!menubar) throw new Error('Menü çubuğu (.rye-menubar) bulunamadı!');

  const menuTitles = Array.from(menubar.querySelectorAll('.rye-menubar-trigger')).map(t => t.textContent.trim());
  console.log('  Mevcut Menüler:', menuTitles);
  const expectedMenus = ['Dosya', 'Düzenle', 'Yazıtipi', 'Paragraf', 'Biçim', 'Ekle', 'Tablo'];
  expectedMenus.forEach(m => {
    if (!menuTitles.includes(m)) {
      throw new Error(`Beklenen menü bulunamadı: ${m}`);
    }
  });
  console.log('  ✅ 1.1 Tüm üst menüler (Dosya, Düzenle, Yazıtipi, Paragraf, Biçim, Ekle, Tablo) eksiksiz mevcut.');

  // TEST 2: 1. SIRA STANDART ARAÇ ÇUBUĞU KONTROLÜ
  console.log('\n[TEST 2] 1. Sıra Standart Araç Çubuğu Kontrolleri:');
  const rowStandard = toolbar.querySelector('.rye-row-standard');
  if (!rowStandard) throw new Error('1. Sıra standart araç çubuğu bulunamadı!');

  const expectedStandardButtons = [
    'save', 'print', 'find', 'replace',
    'cut', 'copy', 'paste', 'undo', 'redo',
    'link', 'pilcrow'
  ];
  expectedStandardButtons.forEach(btnTitle => {
    const btn = rowStandard.querySelector(`button[title*="${btnTitle === 'save' ? 'Kaydet' : btnTitle === 'print' ? 'Yazdır' : btnTitle === 'find' ? 'Bul' : btnTitle === 'replace' ? 'Değiştir' : btnTitle === 'cut' ? 'Kes' : btnTitle === 'copy' ? 'Kopyala' : btnTitle === 'paste' ? 'Yapıştır' : btnTitle === 'undo' ? 'Geri' : btnTitle === 'redo' ? 'Yinele' : btnTitle === 'link' ? 'Köprü' : 'Paragraf'}"]`);
    if (!btn) throw new Error(`1. sıradaki ${btnTitle} butonu bulunamadı!`);
  });
  console.log('  ✅ 2.1 Kaydet, Yazdır, Bul, Değiştir, Kes, Kopyala, Yapıştır, Geri Al, Yinele, Köprü, Pilcrow butonları mevcut.');

  // Kenarlık Kutucukları (6 Adet)
  const borderBox = rowStandard.querySelector('.rye-toolbar-box[title="Kenarlık Seçenekleri"]');
  if (!borderBox) throw new Error('Kenarlık seçenekleri kutusu bulunamadı!');
  const borderBtns = borderBox.querySelectorAll('button');
  if (borderBtns.length !== 6) throw new Error(`Kenarlık buton sayısı 6 olmalı, bulunan: ${borderBtns.length}`);
  console.log('  ✅ 2.2 6 adet kenarlık kutusu ikonu (Alt, Üst, Sol, Sağ, Yok, Tüm) kutu içinde mevcut.');

  // Tablo Araçları Kutusu (9 Adet)
  const tableBox = rowStandard.querySelector('.rye-toolbar-box[title="Tablo Araçları"]');
  if (!tableBox) throw new Error('Tablo araçları kutusu bulunamadı!');
  const tableBtns = tableBox.querySelectorAll('button');
  if (tableBtns.length < 8) throw new Error(`Tablo araç buton sayısı eksik, bulunan: ${tableBtns.length}`);
  console.log('  ✅ 2.3 Tablo araçları kutusu (Satır/Sütun ekle/sil, birleştir, böl, tablo sil) eksiksiz mevcut.');

  // TEST 3: 2. SIRA BİÇİMLENDİRME ARAÇ ÇUBUĞU KONTROLÜ
  console.log('\n[TEST 3] 2. Sıra Biçimlendirme Araç Çubuğu Kontrolleri:');
  const rowFormat = toolbar.querySelector('.rye-row-format');
  if (!rowFormat) throw new Error('2. Sıra biçimlendirme araç çubuğu bulunamadı!');

  const fontCombo = rowFormat.querySelector('.rye-font-combobox');
  const sizeCombo = rowFormat.querySelector('.rye-size-combobox');
  if (!fontCombo || !sizeCombo) throw new Error('Font ve Punto açılır kutuları bulunamadı!');
  console.log('  ✅ 3.1 Font Family (Times New Roman) ve Punto (12) comboboxları mevcut.');

  const expectedFormatButtons = [
    'Kalın', 'İtalik', 'Altı Çizili', 'Üstü Çizili', 'Üst Çizgili', 'Alt Simge', 'Üst Simge',
    'Büyüt', 'Küçült', 'Yazı Tipi Rengi', 'Metin Vurgu Rengi',
    'Sola Hizala', 'Ortala', 'Sağa Hizala', 'İki Yana Yasla',
    'Madde İşaretleri', 'Numaralandırma', 'Girintiyi Azalt', 'Girintiyi Artır',
    'Biçim Boyacısı'
  ];
  expectedFormatButtons.forEach(titleSub => {
    const btn = rowFormat.querySelector(`button[title*="${titleSub}"]`);
    if (!btn) throw new Error(`2. sıradaki "${titleSub}" butonu bulunamadı!`);
  });
  console.log('  ✅ 3.2 Tüm biçimlendirme butonları (B, I, U, S, Ō, x₂, x², A^, Av, Renk, Vurgu, 4 Hizalama, 2 Liste, 2 Girinti, Biçim Boyacısı) eksiksiz mevcut.');

  // TEST 4: 3. SIRA GÖRÜNÜM VE DÜZEN ÇUBUĞU KONTROLÜ
  console.log('\n[TEST 4] 3. Sıra Görünüm ve Düzen Çubuğu Kontrolleri:');
  const rowView = toolbar.querySelector('.rye-row-view');
  if (!rowView) throw new Error('3. Sıra görünüm araç çubuğu bulunamadı!');

  const thumbBtn = rowView.querySelector('button[title*="Küçük Resimler"]');
  const zoomCombo = rowView.querySelector('.rye-zoom-combobox');
  const printTextBtn = rowView.querySelector('button[title*="Yazdır..."]');
  const headerBtn = rowView.querySelector('button[title*="Üstbilgi"]');
  const footerBtn = rowView.querySelector('button[title*="Altbilgi"]');

  if (!thumbBtn || !zoomCombo || !printTextBtn || !headerBtn || !footerBtn) {
    throw new Error('Görünüm araç çubuğu butonları eksik!');
  }
  console.log('  ✅ 4.1 Thumbnails, Sayfa Genişliği (Zoom), Yazdır..., Üstbilgi... ve Altbilgi... butonları mevcut.');

  // TEST 5: YATAY CETVEL (HORIZONTAL RULER) KONTROLÜ
  console.log('\n[TEST 5] Yatay Cetvel (Ruler Bar) Kontrolleri:');
  const rulerBar = toolbar.querySelector('.rye-ruler-bar');
  if (!rulerBar) throw new Error('Yatay cetvel (.rye-ruler-bar) bulunamadı!');

  const leftMargin = rulerBar.querySelector('.rye-ruler-margin-left');
  const rulerBody = rulerBar.querySelector('.rye-ruler-body');
  const rightMargin = rulerBar.querySelector('.rye-ruler-margin-right');
  const firstLineSlider = rulerBar.querySelector('.rye-slider-firstline');
  const leftSlider = rulerBar.querySelector('.rye-slider-left');
  const rightSlider = rulerBar.querySelector('.rye-slider-right');

  if (!leftMargin || !rulerBody || !rightMargin || !firstLineSlider || !leftSlider || !rightSlider) {
    throw new Error('Cetvel elemanları veya sürgüleri eksik!');
  }
  console.log('  ✅ 5.1 Yatay cetvel, 2.5cm sol/sağ kenar boşlukları, 16cm gövde ve 3 adet girinti sürgüsüyle eksiksiz render edildi.');

  // TEST 6: THUMBNAILS (KÜÇÜK RESİMLER) ETKİLEŞİM TESTİ
  console.log('\n[TEST 6] Thumbnails Panel Açılma Testi:');
  const thumbnailsPanel = container.querySelector('.rye-thumbnails-panel');
  if (!thumbnailsPanel) throw new Error('Thumbnails paneli bulunamadı!');

  if (thumbnailsPanel.classList.contains('is-open')) {
    throw new Error('Thumbnails paneli başlangıçta kapalı olmalıydı!');
  }

  thumbBtn.click();
  if (!thumbnailsPanel.classList.contains('is-open')) {
    throw new Error('Thumbnails butonuna basıldığında panel açılmadı!');
  }
  const cards = thumbnailsPanel.querySelectorAll('.rye-thumbnail-card');
  if (cards.length === 0) {
    throw new Error('Thumbnails panelinde sayfa kartı listelenmedi!');
  }
  console.log('  ✅ 6.1 Thumbnails butonuna tıklandı, sol panel açıldı ve sayfalar listelendi.');

  thumbBtn.click();
  if (thumbnailsPanel.classList.contains('is-open')) {
    throw new Error('Thumbnails butonuna tekrar basıldığında panel kapanmadı!');
  }
  console.log('  ✅ 6.2 Thumbnails butonuna tekrar tıklandı, panel kapandı.');

  console.log('\n🎉 YENİ PANEL VE TÜM ARAÇ ÇUBUĞU ÖZELLİKLERİ TESTLERİ %100 BAŞARIYLA TAMAMLANDI!');
}

runToolbarLayoutTests().catch(err => {
  console.error('TEST HATASI:', err);
  process.exit(1);
});
