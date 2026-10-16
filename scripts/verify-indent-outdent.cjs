const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const assert = require('assert');

async function runTests() {
  console.log('--- BAŞLANGIÇ: GİRİNTİYİ ARTIR / AZALT (INDENT/OUTDENT) DOĞRULAMA TESTİ ---');

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

  const { ResmiYaziEditor, ExportPlugin } = window;
  const container = document.getElementById('editorContainer');

  console.log('\n[TEST 1] Temel Paragraf Girintisi (Indent) ve Geri Alma (Outdent):');
  const editor = await ResmiYaziEditor.create(container, {
    initialData: '<p id="p1">Birinci paragraf metni</p><p id="p2">İkinci paragraf metni</p>'
  });

  const p1 = editor.editable.querySelector('#p1');
  assert(p1, 'p1 bulunamadı');

  // p1'i seçelim
  const range = document.createRange();
  range.selectNodeContents(p1);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  editor.selection.save();

  // 1. Girintiyi Artır (1.25 cm)
  editor.execute('indent');
  assert.strictEqual(p1.style.marginLeft, '1.25cm', 'İlk girinti 1.25cm olmalı');
  assert.strictEqual(p1.style.marginRight, '', 'margin-right kesinlikle boş kalmalı (sağ kenar sıkışmamalı)');
  assert.strictEqual(editor.editable.querySelectorAll('blockquote').length, 0, 'Asla blockquote etiketi oluşturulmamalı');
  console.log('  ✅ 1.1 Sol girinti başarıyla 1.25 cm yapıldı, blockquote kullanılmadı, sağ kenar boşluğu bozulmadı.');

  // 2. Bir kez daha Girintiyi Artır (2.5 cm)
  editor.execute('indent');
  assert.strictEqual(p1.style.marginLeft, '2.5cm', 'İkinci girinti 2.5cm olmalı');
  console.log('  ✅ 1.2 İkinci girinti adımı 2.5 cm olarak başarıyla artırıldı.');

  // 3. Girintiyi Azalt (1.25 cm'ye dönmeli)
  editor.execute('outdent');
  assert.strictEqual(p1.style.marginLeft, '1.25cm', 'Girinti azaltılınca 1.25cm olmalı');
  console.log('  ✅ 1.3 Girintiyi azaltınca temiz biçimde 1.25 cm seviyesine indi.');

  // 4. Bir kez daha Girintiyi Azalt (0 cm, yani tamamen temizlenmeli)
  editor.execute('outdent');
  assert.strictEqual(p1.style.marginLeft, '', 'Girinti tamamen sıfırlanınca marginLeft boş olmalı');
  console.log('  ✅ 1.4 Girinti sıfırlandığında marginLeft stili temizlendi, sayfa hizası korundu.');

  console.log('\n[TEST 2] Eski veya Dışarıdan Gelen Blockquote Dönüştürme/Temizleme:');
  editor.setData('<blockquote><p id="bq-p">Alıntı veya dışarıdan aktarılan paragraf</p></blockquote>');
  const bqP = editor.editable.querySelector('#bq-p');
  
  const range2 = document.createRange();
  range2.selectNodeContents(bqP);
  sel.removeAllRanges();
  sel.addRange(range2);
  editor.selection.save();

  editor.execute('indent');
  assert.strictEqual(editor.editable.querySelectorAll('blockquote').length, 0, 'Blockquote çözülüp temizlenmeli');
  const newP = editor.editable.querySelector('p');
  assert.strictEqual(newP.style.marginLeft, '1.25cm', 'Çözülen p elemanına 1.25cm girinti uygulanmalı');
  console.log('  ✅ 2.1 Blockquote etiketi temizlenerek düzgün p paragrafına dönüştürüldü ve 1.25cm uygulandı.');

  console.log('\n[TEST 3] Word Export (OpenXML) w:left ve w:firstLine Uyumu:');
  const wordHtml = '<p style="margin-left: 1.25cm; text-indent: 1.25cm;">Girintili resmi yazı paragrafı</p>';
  const { docXml } = ExportPlugin.htmlToDocxXml(wordHtml);
  
  assert(docXml.includes('w:left="709"'), 'Word XML içerisinde w:left="709" bulunmalı (1.25cm = 709 twips)');
  assert(docXml.includes('w:firstLine="709"'), 'Word XML içerisinde w:firstLine="709" bulunmalı');
  console.log('  ✅ 3.1 Word dışa aktarımında w:left="709" ve w:firstLine="709" kusursuz OpenXML olarak üretildi.');

  console.log('\n[TEST 4] Tab ve Shift+Tab Klavye Kısayolu:');
  editor.setData('<p id="tab-p">Klavye kısayol testi metni</p>');
  const tabP = editor.editable.querySelector('#tab-p');
  const range3 = document.createRange();
  range3.selectNodeContents(tabP);
  sel.removeAllRanges();
  sel.addRange(range3);
  editor.selection.save();

  // Tab tuşu
  const tabEvt = new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  editor.editable.dispatchEvent(tabEvt);
  assert.strictEqual(tabP.style.marginLeft, '1.25cm', 'Tab tuşu girintiyi 1.25cm yapmalı');
  console.log('  ✅ 4.1 Tab tuşu ile 1.25 cm girinti uygulandı.');

  // Shift+Tab tuşu
  const shiftTabEvt = new window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
  editor.editable.dispatchEvent(shiftTabEvt);
  assert.strictEqual(tabP.style.marginLeft, '', 'Shift+Tab tuşu girintiyi sıfırlamalı');
  console.log('  ✅ 4.2 Shift+Tab tuşu ile girinti başarıyla geri alındı.');

  console.log('\n>>> TÜM GİRİNTİ TESTLERİ BAŞARIYLA TAMAMLANDI! <<<');
}

runTests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});
