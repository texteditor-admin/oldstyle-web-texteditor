const { JSDOM } = require('jsdom');

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="editor"></div></body></html>`, {
  runScripts: "dangerously"
});
const window = dom.window;
const document = window.document;

// Load the compiled UMD bundle
const fs = require('fs');
const path = require('path');
const bundleCode = fs.readFileSync(path.join(__dirname, '../dist/resmi-yazi-editor.umd.js'), 'utf-8');

// Execute bundle inside window
window.eval(bundleCode);

const ResmiYaziEditor = window.ResmiYaziEditor;

console.log('--- TEST BAŞLIYOR: TÜM PUNTO VE FORMAT DETAYLARI SİMÜLASYONU ---');

async function runTests() {
  const editorEl = document.getElementById('editor');
  const editor = await ResmiYaziEditor.create(editorEl, {
    initialData: '<p id="p1">Resmi Yazışma Sistemi Test Belgesi</p>'
  });

  const editable = editorEl.querySelector('.rye-editable');
  console.log('Başlangıç HTML:\n', editor.getData());

  const p = editable.querySelector('#p1');
  const textNode = p.firstChild;

  // 1. "Yazışma" sözcüğünü seç (offset 6 - 13)
  let range = document.createRange();
  range.setStart(textNode, 6);
  range.setEnd(textNode, 13);
  let sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  console.log('\n[ADIM 1] "Yazışma" 24pt yapılıyor...');
  editor.execute('fontSize', '24pt');
  console.log('HTML:', editor.getData());
  let span = editable.querySelector('span');
  if (!span || span.style.fontSize !== '24pt') {
    throw new Error('Adım 1 başarısız: 24pt uygulanamadı!');
  }
  console.log('✅ Adım 1 Başarılı: Yazışma 24pt yapıldı.');

  // 2. Şimdi "Yazışma"yı tekrar seç ve 12pt'ye KÜÇÜLT
  console.log('\n[ADIM 2] "Yazışma" tekrar seçilip 12pt\'ye KÜÇÜLTÜLÜYOR...');
  range = document.createRange();
  range.selectNode(span);
  sel.removeAllRanges();
  sel.addRange(range);

  editor.execute('fontSize', '12pt');
  console.log('HTML:', editor.getData());
  span = editable.querySelector('span');
  if (!span || span.style.fontSize !== '12pt') {
    throw new Error('Adım 2 başarısız: 12pt\'ye küçültülemedi!');
  }
  let innerSpans = span.querySelectorAll('span');
  if (innerSpans.length > 0) {
    throw new Error('Adım 2 başarısız: İç içe span oluştu!');
  }
  console.log('✅ Adım 2 Başarılı: Yazışma 12pt\'ye küçültüldü ve iç içe span YOK!');

  // 3. Şimdi "Yazışma"yı 10pt'ye daha da KÜÇÜLT
  console.log('\n[ADIM 3] "Yazışma" 10pt\'ye daha da küçültülüyor...');
  range = document.createRange();
  range.selectNode(span);
  sel.removeAllRanges();
  sel.addRange(range);

  editor.execute('fontSize', '10pt');
  console.log('HTML:', editor.getData());
  span = editable.querySelector('span');
  if (!span || span.style.fontSize !== '10pt') {
    throw new Error('Adım 3 başarısız: 10pt uygulanamadı!');
  }
  console.log('✅ Adım 3 Başarılı: 10pt oldu.');

  // 4. Şimdi Punto Büyüt (A+) komutu ile kademeli artır
  console.log('\n[ADIM 4] Punto Büyüt (A+) çalıştırılıyor...');
  range = document.createRange();
  range.selectNode(span);
  sel.removeAllRanges();
  sel.addRange(range);

  editor.execute('fontSizeIncrease'); // 10pt -> 11pt
  span = editable.querySelector('span');
  console.log('10pt -> A+ Sonucu:', span.style.fontSize);

  editor.execute('fontSizeIncrease'); // 11pt -> 12pt
  span = editable.querySelector('span');
  console.log('11pt -> A+ Sonucu:', span.style.fontSize);

  editor.execute('fontSizeIncrease'); // 12pt -> 14pt
  span = editable.querySelector('span');
  console.log('12pt -> A+ Sonucu:', span.style.fontSize);

  if (span.style.fontSize !== '14pt') {
    throw new Error('Adım 4 başarısız: fontSizeIncrease doğru çalışmadı!');
  }
  console.log('✅ Adım 4 Başarılı: A+ butonuyla 10pt -> 11pt -> 12pt -> 14pt büyütüldü.');

  // 5. Şimdi Punto Küçült (A-) komutu ile kademeli küçült
  console.log('\n[ADIM 5] Punto Küçült (A-) çalıştırılıyor...');
  editor.execute('fontSizeDecrease'); // 14pt -> 12pt
  span = editable.querySelector('span');
  console.log('14pt -> A- Sonucu:', span.style.fontSize);

  editor.execute('fontSizeDecrease'); // 12pt -> 11pt
  span = editable.querySelector('span');
  console.log('12pt -> A- Sonucu:', span.style.fontSize);

  if (span.style.fontSize !== '11pt') {
    throw new Error('Adım 5 başarısız: fontSizeDecrease doğru çalışmadı!');
  }
  console.log('✅ Adım 5 Başarılı: A- butonuyla 14pt -> 12pt -> 11pt küçültüldü.');

  // 6. Font Ailesi Değiştirme ve Geri Alma Testi
  console.log('\n[ADIM 6] Font Ailesi değiştiriliyor (Arial -> Calibri -> Times New Roman)...');
  editor.execute('fontFamily', 'Arial');
  span = editable.querySelector('span');
  console.log('Arial Sonucu:', span.style.fontFamily);
  if (!span.style.fontFamily.includes('Arial')) {
    throw new Error('Adım 6 başarısız: Arial uygulanamadı!');
  }

  editor.execute('fontFamily', 'Calibri');
  span = editable.querySelector('span');
  console.log('Calibri Sonucu:', span.style.fontFamily);
  if (!span.style.fontFamily.includes('Calibri')) {
    throw new Error('Adım 6 başarısız: Calibri uygulanamadı!');
  }

  editor.execute('fontFamily', 'Times New Roman');
  span = editable.querySelector('span');
  console.log('Times New Roman Sonucu:', span.style.fontFamily);
  if (!span.style.fontFamily.includes('Times New Roman')) {
    throw new Error('Adım 6 başarısız: Times New Roman uygulanamadı!');
  }
  console.log('✅ Adım 6 Başarılı: Font aileleri temiz bir şekilde değişti.');

  console.log('\n--- TÜM TESTLER BAŞARIYLA TAMAMLANDI! ---');
  console.log('Final HTML:\n', editor.getData());
}

runTests().catch(err => {
  console.error('❌ TEST BAŞARISIZ OLDU:', err);
  process.exit(1);
});
