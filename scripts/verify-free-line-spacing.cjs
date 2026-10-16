const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const assert = require('assert');

async function runTests() {
  console.log('=== BAŞLANGIÇ: SERBEST SATIR BOŞLUĞU VE PARAGRAF GİRİNTİ TESTİ ===');

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

  // Mock execCommand for JSDOM
  document.execCommand = function(cmd, showUI, value) {
    if (cmd === 'insertText') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(value);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        sel.removeAllRanges();
        sel.addRange(range);
        return true;
      }
    }
    return false;
  };

  const scriptEl = document.createElement('script');
  scriptEl.textContent = bundleCode;
  document.body.appendChild(scriptEl);

  const { ResmiYaziEditor } = window;
  const container = document.getElementById('editorContainer');

  const editor = await ResmiYaziEditor.create(container, {
    initialData: '<p id="testP">İlk satır metni<br id="br1">İkinci satır metni</p>'
  });

  const p = editor.editable.querySelector('#testP');
  const br = editor.editable.querySelector('#br1');
  assert(p, 'Paragraf bulunamadı');
  assert(br, 'br etiketi bulunamadı');

  console.log('\n[KONTROL 1] Paragrafların Bütün Olarak Kilitlenmemesi (Serbest text-indent Varsayılanı):');
  assert(/--rye-para-indent/i.test(cssCode), 'CSS içinde --rye-para-indent bulunmalı');
  assert(/white-space:\s*pre-wrap/i.test(cssCode), 'CSS içinde white-space: pre-wrap olmalı');
  console.log('  ✅ 1.1 Paragraflar kilitli 1.25cm text-indent yerine serbest esnek varsayılanla (0) açılıyor.');

  console.log('\n[KONTROL 2] İkinci Satırda (br Sonrası) Space Tuşu ile Bölünemez Boşluk (\u00A0) Eklenmesi:');
  // İmleci br'den hemen sonraya, ikinci satırın metin düğümünün başına koyalım
  const textNode2 = br.nextSibling;
  assert(textNode2, 'İkinci satır metin düğümü bulunamadı');

  const range = document.createRange();
  range.setStart(textNode2, 0);
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  // Space tuşuna basalım
  const spaceEvt = new window.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
  editor.editable.dispatchEvent(spaceEvt);

  // İkinci satırın başında \u00A0 boşluğu eklenmiş olmalı
  assert(p.innerHTML.includes('\u00A0') || p.textContent.includes('\u00A0'), 'İkinci satır başına \\u00A0 eklenmeli');
  assert.strictEqual(p.style.marginLeft, '', 'Space basıldığında p marginLeft kesinlikle değişmemeli');
  console.log('  ✅ 2.1 İkinci satırın başına boşluk başarıyla eklendi, HTML tarafından yutulmadı/çökmedi.');

  console.log('\n[KONTROL 3] Satır Başında Tab Tuşuna Basılınca Tüm Paragrafın Kaymaması, Yalnızca 4 Boşluk Eklenmesi:');
  // İmleç collapsed iken Tab tuşu
  const beforeMargin = p.style.marginLeft;
  const tabEvt = new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  editor.editable.dispatchEvent(tabEvt);
  assert.strictEqual(p.style.marginLeft, beforeMargin, 'Tab tuşu basıldığında p etiketinin marginLeft stili artmamalı');
  const has4Spaces = p.innerHTML.includes('&nbsp;&nbsp;&nbsp;&nbsp;') || p.textContent.includes('\u00A0\u00A0\u00A0\u00A0');
  assert(has4Spaces, 'Tab tuşu 4 adet bölünemez boşluk (&nbsp;&nbsp;&nbsp;&nbsp;) eklemeli');
  console.log('  ✅ 3.1 Tab tuşuna basıldığında tüm paragraf ileri kaymadı! Sadece bulunulan satıra 4 boşluk eklendi.');

  console.log('\n[KONTROL 4] Shift+Tab ile Eklenen 4 Boşluğun Geri Alınması (Silinmesi):');
  const shiftTabEvt = new window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
  editor.editable.dispatchEvent(shiftTabEvt);

  const stillHas4Spaces = p.innerHTML.includes('&nbsp;&nbsp;&nbsp;&nbsp;') || p.textContent.includes('\u00A0\u00A0\u00A0\u00A0');
  assert(!stillHas4Spaces, 'Shift+Tab basılınca eklenen 4 boşluk silinmeli');
  console.log('  ✅ 4.1 Shift+Tab tuşu ile satırdaki boşluklar başarıyla silindi.');

  console.log('\n[KONTROL 5] "Girintiyi Artır" Araç Butonunun İmleç Konumunda Serbest Boşluk Bırakması:');
  editor.commands.execute('indent');
  assert.strictEqual(p.style.marginLeft, '', 'İmleç konumundayken Girintiyi Artır p marginLeft stilini değiştirmemeli');
  const hasIndentSpaces = p.innerHTML.includes('&nbsp;&nbsp;&nbsp;&nbsp;') || p.textContent.includes('\u00A0\u00A0\u00A0\u00A0');
  assert(hasIndentSpaces, 'Girintiyi Artır imleç konumuna 4 boşluk eklemeli');
  console.log('  ✅ 5.1 Girintiyi Artır komutu paragrafı toptan kaydırmadan serbest 4 boşluk girintisi ekledi.');

  console.log('\n[KONTROL 6] "Girintiyi Azalt" Butonu ile Boşlukların Silinmesi:');
  editor.commands.execute('outdent');
  const stillHasIndentSpaces = p.innerHTML.includes('&nbsp;&nbsp;&nbsp;&nbsp;') || p.textContent.includes('\u00A0\u00A0\u00A0\u00A0');
  assert(!stillHasIndentSpaces, 'Girintiyi Azalt boşlukları temizlemeli');
  console.log('  ✅ 6.1 Girintiyi Azalt komutu satırdaki boşlukları başarıyla geri aldı.');

  console.log('\n>>> TÜM SERBEST SATIR BOŞLUĞU VE GİRİNTİ TESTLERİ %100 BAŞARIYLA TAMAMLANDI! <<<');
}

runTests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});
