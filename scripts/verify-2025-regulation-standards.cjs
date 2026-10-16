const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const assert = require('assert');

async function runTests() {
  console.log('=== BAŞLANGIÇ: CUMHURBAŞKANLIĞI 2025 RESMÎ YAZIŞMA KILAVUZU VE YÖNETMELİĞİ STANDARTLARI TESTİ ===');

  const bundlePath = path.resolve(__dirname, '../dist/resmi-yazi-editor.umd.js');
  const cssPath = path.resolve(__dirname, '../dist/resmi-yazi-editor.css');

  const bundleCode = fs.readFileSync(bundlePath, 'utf8');
  const cssCode = fs.readFileSync(cssPath, 'utf8');

  // 1. CSS Kuralları ve Değişken Kontrolleri
  console.log('\n[KONTROL 1] CSS Standartları ve Kenar Boşlukları (Yönetmelik 8. Madde):');
  assert(/--rye-page-padding:\s*1\.5cm\s+1\.5cm\s+0?\.5cm\s+1\.5cm/i.test(cssCode), 'Sayfa kenar boşluğu 1.5cm/0.5cm olmalı');
  assert(/--rye-line-height:\s*1\.15/i.test(cssCode), 'Satır aralığı 1.15 olmalı');
  assert(/--rye-para-spacing:\s*0pt/i.test(cssCode), 'Paragraflar arası boşluk 0pt olmalı');
  assert(/--rye-first-line-indent:\s*1\.25cm/i.test(cssCode), 'İlk satır girintisi 1.25cm olmalı');
  assert(cssCode.includes('width:18cm') || cssCode.includes('width: 18cm'), 'Yazı alanı genişliği 18cm olmalı (21cm - 2 * 1.5cm)');
  console.log('  ✅ 1.1 Üst/Sol/Sağ: 1.5cm, Alt: 0.5cm, Satır Aralığı: 1.15, Paragraf Boşluğu: 0pt, İlk Satır: 1.25cm CSS kuralları doğrulandı.');

  const dom = new JSDOM(`<!DOCTYPE html><html><head><style>${cssCode}</style></head><body><div id="editorContainer"></div></body></html>`, {
    runScripts: 'dangerously',
    url: 'http://localhost/'
  });

  const { window } = dom;
  const { document } = window;

  const scriptEl = document.createElement('script');
  scriptEl.textContent = bundleCode;
  document.body.appendChild(scriptEl);

  const { ResmiYaziEditor, ExportPlugin } = window;
  const container = document.getElementById('editorContainer');

  console.log('\n[KONTROL 2] Editör Başlatma ve Varsayılan Standartlar:');
  const editor = await ResmiYaziEditor.create(container);

  assert.strictEqual(editor.container.style.getPropertyValue('--rye-page-padding'), '1.5cm 1.5cm 0.5cm 1.5cm', 'Sayfa padding 1.5cm/0.5cm olmalı');
  assert.strictEqual(editor.container.style.getPropertyValue('--rye-line-height'), '1.15', 'Satır aralığı 1.15 olmalı');
  assert.strictEqual(editor.container.style.getPropertyValue('--rye-para-spacing'), '0pt', 'Paragraf boşluğu 0pt olmalı');
  assert.strictEqual(editor.container.style.getPropertyValue('--rye-first-line-indent'), '1.25cm', 'İlk satır girintisi 1.25cm olmalı');
  console.log('  ✅ 2.1 Editör başlatıldığında resmi yazışma standartları konteynere otomatik uygulandı.');

  console.log('\n[KONTROL 3] Yatay Cetvel (Ruler Bar) 18 cm Yazı Alanı & 1.5 cm Kenar Boşlukları:');
  const rulerMarginLeft = container.querySelector('.rye-ruler-margin-left');
  const rulerBody = container.querySelector('.rye-ruler-body');
  const rulerMarginRight = container.querySelector('.rye-ruler-margin-right');
  const sliderRight = container.querySelector('.rye-slider-right');

  assert(rulerMarginLeft, 'rulerMarginLeft bulunamadı');
  assert(rulerBody, 'rulerBody bulunamadı');
  assert(rulerMarginRight, 'rulerMarginRight bulunamadı');
  assert.strictEqual(rulerMarginLeft.getAttribute('title'), 'Sol Kenar Boşluğu (1.5 cm)', 'Sol kenar boşluğu başlığı 1.5 cm olmalı');
  assert.strictEqual(rulerMarginRight.getAttribute('title'), 'Sağ Kenar Boşluğu (1.5 cm)', 'Sağ kenar boşluğu başlığı 1.5 cm olmalı');
  assert.strictEqual(sliderRight.style.left, '18cm', 'Sağ sürgü başlangıç konumu 18cm olmalı');
  console.log('  ✅ 3.1 Cetvel 1.5 cm sol/sağ boşlukları ve 18 cm gövde genişliği ile tam uyumlu.');

  console.log('\n[KONTROL 4] Sayfa Numaralandırması (Yönetmelik 27. Madde):');
  // Tek sayfada numara gösterilmemeli
  const page1 = editor.editable.querySelector('.rye-page');
  const badge1 = page1.querySelector('.rye-page-footer-badge');
  assert.strictEqual(badge1.textContent, '', 'Tek sayfalı belgede sayfa numarası yazılmamalı');
  console.log('  ✅ 4.1 Tek sayfalı yazıda sayfa numarası kural gereği gizli.');

  // İki sayfaya çıkartalım
  editor.setData('<p>Sayfa 1</p><div class="rye-page-break"></div><p>Sayfa 2</p>');
  const pages = editor.editable.querySelectorAll('.rye-page');
  assert.strictEqual(pages.length, 2, '2 sayfa oluşmalı');
  const badgeP1 = pages[0].querySelector('.rye-page-footer-badge');
  const badgeP2 = pages[1].querySelector('.rye-page-footer-badge');
  assert.strictEqual(badgeP1.textContent, '1/2', 'İlk sayfa numarası 1/2 olmalı');
  assert.strictEqual(badgeP2.textContent, '2/2', 'İkinci sayfa numarası 2/2 olmalı');
  console.log('  ✅ 4.2 Çok sayfalı belgede sayfa numarası sayfa altında ortalı "1/2" ve "2/2" olarak formatlandı.');

  console.log('\n[KONTROL 5] Word OpenXML (.docx) Dışa Aktarımında 1.5 cm / 0.5 cm Kenar Boşlukları:');
  const { docXml } = ExportPlugin.htmlToDocxXml('<p>Test Paragrafı</p>');
  assert(docXml.includes('w:top="851"'), 'Word çıktısında üst kenar 851 twips (1.5cm) olmalı');
  assert(docXml.includes('w:left="851"'), 'Word çıktısında sol kenar 851 twips (1.5cm) olmalı');
  assert(docXml.includes('w:right="851"'), 'Word çıktısında sağ kenar 851 twips (1.5cm) olmalı');
  assert(docXml.includes('w:bottom="284"'), 'Word çıktısında alt kenar 284 twips (0.5cm) olmalı');
  console.log('  ✅ 5.1 Word OpenXML çıktısında w:top="851" w:right="851" w:bottom="284" w:left="851" başarıyla doğrulandı.');

  console.log('\n[KONTROL 6] Resmi Yazı Şablonu (2025 Kılavuzu) Yükleme:');
  editor.execute('insertOfficialTemplate');
  const html = editor.getData();
  assert(html.includes('CUMHURBAŞKANLIĞI'), 'Şablonda Cumhurbaşkanlığı anteti yer almalı');
  assert(html.includes('DAĞITIM YERLERİNE'), 'Şablonda DAĞITIM YERLERİNE muhatabı yer almalı');
  assert(html.includes('E-80979383-010.03-1234936'), 'Şablonda resmi DETSİS-SDP sayı formatı yer almalı');
  assert(html.includes('Adı SOYADI'), 'Şablonda imza formatı yer almalı');
  assert(html.includes('Belge Doğrulama Kodu'), 'Şablonda doğrulama bilgileri yer almalı');
  console.log('  ✅ 6.1 2025 Cumhurbaşkanlığı Resmî Yazışma Kılavuzuna uygun eksiksiz şablon yüklendi.');

  console.log('\n🎉 TEBRİKLER: 2025 CUMHURBAŞKANLIĞI RESMÎ YAZIŞMA KILAVUZU VE YÖNETMELİĞİ STANDARTLARI %100 DOĞRULANDI!');
}

runTests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});
