const { JSDOM } = require('jsdom');

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="editable" contenteditable="true"><p>Resmi <span style="font-size: 24pt;">Yazisma</span> Belgesi</p></div></body></html>`);
const window = dom.window;
const document = window.document;
const editable = document.getElementById('editable');
const p = editable.querySelector('p');

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

// User selects the whole word with its span:
let range = document.createRange();
range.setStart(p, 1); // before the span
range.setEnd(p, 2);   // after the span
let sel = window.getSelection();
sel.removeAllRanges();
sel.addRange(range);

console.log('Seçilen içerik:', range.cloneContents().childNodes[0].outerHTML);
oldApplyInlineStyle('fontSize', '12pt');
console.log('Sonuç HTML:', editable.innerHTML);
