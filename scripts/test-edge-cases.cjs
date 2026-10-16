const { JSDOM } = require('jsdom');

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="editable" contenteditable="true"></div></body></html>`);
const window = dom.window;
const document = window.document;
const editable = document.getElementById('editable');

function toKebabCase(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

function applyInlineStyle(property, value) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);

  const kebabProp = toKebabCase(property);

  // If collapsed, expand to word
  if (range.collapsed) {
    const node = range.startContainer;
    if (node.nodeType === 3) {
      const text = node.nodeValue || '';
      const offset = range.startOffset;
      let start = offset;
      let end = offset;
      while (start > 0 && /\S/.test(text[start - 1])) start--;
      while (end < text.length && /\S/.test(text[end])) end++;
      if (start < end) {
        range.setStart(node, start);
        range.setEnd(node, end);
      }
    }
  }

  if (range.collapsed) {
    const span = document.createElement('span');
    span.style.setProperty(kebabProp, value);
    span.textContent = '\uFEFF';
    range.insertNode(span);
    range.selectNodeContents(span);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    return;
  }

  // Check if ancestor span contains the entire selection
  let ancestor = range.commonAncestorContainer;
  if (ancestor.nodeType === 3) {
    ancestor = ancestor.parentElement;
  }

  const styledAncestor = ancestor.closest ? ancestor.closest(`span[style*="${kebabProp}"]`) : null;

  if (styledAncestor && styledAncestor !== editable) {
    const ancestorRange = document.createRange();
    ancestorRange.selectNodeContents(styledAncestor);

    if (
      range.compareBoundaryPoints(window.Range.START_TO_START, ancestorRange) <= 0 &&
      range.compareBoundaryPoints(window.Range.END_TO_END, ancestorRange) >= 0
    ) {
      if (value) {
        styledAncestor.style.setProperty(kebabProp, value);
      } else {
        styledAncestor.style.removeProperty(kebabProp);
        if (styledAncestor.style.length === 0) {
          styledAncestor.replaceWith(...Array.from(styledAncestor.childNodes));
        }
      }
      return;
    }
  }

  // General extraction
  const contents = range.extractContents();

  // Strip conflicting nested properties
  const innerElements = contents.querySelectorAll ? Array.from(contents.querySelectorAll('*')) : [];
  innerElements.forEach(el => {
    if (el instanceof window.HTMLElement) {
      el.style.removeProperty(kebabProp);
      if (el.tagName === 'SPAN' && el.style.length === 0 && (!el.className || el.className === '')) {
        el.replaceWith(...Array.from(el.childNodes));
      }
    }
  });

  // If single span
  if (
    contents.childNodes.length === 1 &&
    contents.firstChild.nodeType === 1 &&
    contents.firstChild.tagName === 'SPAN'
  ) {
    const singleSpan = contents.firstChild;
    if (value) {
      singleSpan.style.setProperty(kebabProp, value);
    } else {
      singleSpan.style.removeProperty(kebabProp);
    }
    range.insertNode(singleSpan);
    range.selectNodeContents(singleSpan);
    sel.removeAllRanges();
    sel.addRange(range);
    return;
  }

  if (value) {
    const span = document.createElement('span');
    span.style.setProperty(kebabProp, value);
    span.appendChild(contents);
    range.insertNode(span);
    range.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    range.insertNode(contents);
  }

  if (range.commonAncestorContainer.normalize) {
    range.commonAncestorContainer.normalize();
  }
}

// TEST A: Kısmi seçim (Partial selection inside 24pt span)
editable.innerHTML = `<p><span style="font-size: 24pt;">Resmi Yazisma</span></p>`;
let span = editable.querySelector('span');
let textNode = span.firstChild;

// Select "Yazisma" (offsets 6 to 13)
let range = document.createRange();
range.setStart(textNode, 6);
range.setEnd(textNode, 13);
let sel = window.getSelection();
sel.removeAllRanges();
sel.addRange(range);

applyInlineStyle('fontSize', '12pt');
console.log('TEST A1 (12pt yapildi):\n', editable.innerHTML);

// Şimdi TEST A'daki 12pt olan Yazisma'yı seçip 16pt ve sonra 8pt yapalım:
let innerSpan = editable.querySelector('span > span');
range = document.createRange();
range.selectNode(innerSpan);
sel.removeAllRanges();
sel.addRange(range);

applyInlineStyle('fontSize', '16pt');
console.log('TEST A2 (16pt yapildi):\n', editable.innerHTML);

innerSpan = editable.querySelector('span > span');
range = document.createRange();
range.selectNode(innerSpan);
sel.removeAllRanges();
sel.addRange(range);

applyInlineStyle('fontSize', '8pt');
console.log('TEST A3 (8pt yapildi):\n', editable.innerHTML);

const nestedSpans = editable.querySelectorAll('span');
console.log('TEST A toplam span sayisi:', nestedSpans.length);
nestedSpans.forEach((s, idx) => console.log(`Span ${idx} style:`, s.getAttribute('style'), 'text:', s.textContent));
