const { JSDOM } = require('jsdom');

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="editable" contenteditable="true"><p>Resmi Yazisma Belgesi</p></div></body></html>`);
const window = dom.window;
const document = window.document;

const editable = document.getElementById('editable');
const p = editable.querySelector('p');
const textNode = p.firstChild; // "Resmi Yazisma Belgesi"

console.log('--- BAŞLANGIÇ ---');
console.log(editable.innerHTML);

// 1. "Yazisma" seç (offset 6 ile 13)
let range = document.createRange();
range.setStart(textNode, 6);
range.setEnd(textNode, 13);
let sel = window.getSelection();
sel.removeAllRanges();
sel.addRange(range);

console.log('\n--- 1. ADIM: "Yazisma" 24pt yap (ESKİ KOD MANTIĞI) ---');
// Eski kod mantığı:
function oldApplyInlineStyle(property, value) {
  const s = window.getSelection();
  const r = s.getRangeAt(0);
  const span = document.createElement('span');
  span.style[property] = value;
  const contents = r.extractContents();
  span.appendChild(contents);
  r.insertNode(span);
  s.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(span);
  s.addRange(newRange);
}

oldApplyInlineStyle('fontSize', '24pt');
console.log('24pt yapıldıktan sonra HTML:', editable.innerHTML);

// Şimdi kullanıcı "Yazisma"yı tekrar seçiyor ve 12pt'ye küçültmek istiyor:
console.log('\n--- 2. ADIM: "Yazisma" tekrar seçildi ve 12pt yapılmak isteniyor ---');
// Span içindeki text'i seç:
const spanEl = editable.querySelector('span');
range = document.createRange();
range.selectNodeContents(spanEl);
sel.removeAllRanges();
sel.addRange(range);

oldApplyInlineStyle('fontSize', '12pt');
console.log('12pt yapıldıktan sonra HTML:\n', editable.innerHTML);

const computedOuter = editable.querySelector('span');
const computedInner = computedOuter.querySelector('span');
console.log('\n--- SONUÇ ANALİZİ ---');
console.log('Dış span style:', computedOuter ? computedOuter.getAttribute('style') : 'yok');
console.log('İç span style:', computedInner ? computedInner.getAttribute('style') : 'yok');
if (computedInner && computedInner.style.fontSize === '24pt') {
  console.log('❌ HATA TESPİT EDİLDİ: Metin hâlâ içteki 24pt span içinde hapsolmuş! 12pt dışta kaldı, bu yüzden yazı KÜÇÜLEMEDİ!');
}
