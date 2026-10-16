const { JSDOM } = require('jsdom');

function testNewAlgorithm() {
  const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="editable" contenteditable="true"><p>Resmi Yazisma Belgesi</p></div></body></html>`);
  const window = dom.window;
  const document = window.document;
  const editable = document.getElementById('editable');
  const p = editable.querySelector('p');

  function toKebabCase(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  function applyInlineStyle(property, value) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    const kebabProp = toKebabCase(property);

    // 1. If collapsed, try to expand to current word
    if (range.collapsed) {
      const node = range.startContainer;
      if (node.nodeType === 3) { // Text node
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
      // Still collapsed: insert placeholder span for typing
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

    // 2. Check if selection is entirely within an existing span that already has this property
    let ancestor = range.commonAncestorContainer;
    if (ancestor.nodeType === 3) {
      ancestor = ancestor.parentElement;
    }

    const styledAncestor = ancestor.closest ? ancestor.closest(`span[style*="${kebabProp}"]`) : null;

    if (styledAncestor && styledAncestor !== editable) {
      const ancestorRange = document.createRange();
      ancestorRange.selectNodeContents(styledAncestor);

      // If selection covers the ENTIRE ancestor span:
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

    // 3. General case: Extract contents, strip conflicting nested styles from extracted fragment, and wrap
    const contents = range.extractContents();

    // Clean any element inside the extracted fragment that already has this property
    const innerElements = contents.querySelectorAll ? Array.from(contents.querySelectorAll('*')) : [];
    innerElements.forEach(el => {
      if (el instanceof window.HTMLElement) {
        el.style.removeProperty(kebabProp);
        // Clean empty spans
        if (el.tagName === 'SPAN' && el.style.length === 0 && (!el.className || el.className === '')) {
          el.replaceWith(...Array.from(el.childNodes));
        }
      }
    });

    // Check if the extracted content was just an existing single span
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

    // Wrap in new span if value is provided
    if (value) {
      const span = document.createElement('span');
      span.style.setProperty(kebabProp, value);
      span.appendChild(contents);
      range.insertNode(span);
      range.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      // If resetting, just re-insert cleaned contents
      range.insertNode(contents);
    }

    // Normalize
    if (range.commonAncestorContainer.normalize) {
      range.commonAncestorContainer.normalize();
    }
  }

  console.log('--- TEST 1: 24pt yap ---');
  let textNode = p.firstChild;
  let range = document.createRange();
  range.setStart(textNode, 6);
  range.setEnd(textNode, 13);
  let sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  applyInlineStyle('fontSize', '24pt');
  console.log('24pt Sonucu:', editable.innerHTML);

  console.log('\n--- TEST 2: Tekrar seç ve 12pt\'ye KÜÇÜLT ---');
  const span = editable.querySelector('span');
  range = document.createRange();
  range.selectNode(span); // Kullanıcı span'i seçti
  sel.removeAllRanges();
  sel.addRange(range);

  applyInlineStyle('fontSize', '12pt');
  console.log('12pt Küçültme Sonucu:', editable.innerHTML);

  console.log('\n--- TEST 3: Tekrar seç ve 10pt\'ye daha da KÜÇÜLT ---');
  const span2 = editable.querySelector('span');
  range = document.createRange();
  range.selectNodeContents(span2); // İçeriği seçti
  sel.removeAllRanges();
  sel.addRange(range);

  applyInlineStyle('fontSize', '10pt');
  console.log('10pt Küçültme Sonucu:', editable.innerHTML);

  console.log('\n--- TEST 4: Tekrar seç ve 36pt\'ye BÜYÜT ---');
  range = document.createRange();
  range.selectNode(editable.querySelector('span'));
  sel.removeAllRanges();
  sel.addRange(range);

  applyInlineStyle('fontSize', '36pt');
  console.log('36pt Büyütme Sonucu:', editable.innerHTML);

  console.log('\n--- TEST 5: Tekrar seç ve 12pt\'ye GERİ KÜÇÜLT ---');
  range = document.createRange();
  range.selectNode(editable.querySelector('span'));
  sel.removeAllRanges();
  sel.addRange(range);

  applyInlineStyle('fontSize', '12pt');
  console.log('12pt Geri Küçültme Sonucu:', editable.innerHTML);

  const spans = editable.querySelectorAll('span');
  console.log('\n--- DOĞRULAMA ---');
  console.log('Toplam span sayısı:', spans.length);
  if (spans.length === 1 && spans[0].style.fontSize === '12pt') {
    console.log('✅ TEST BAŞARILI! Hiçbir iç içe span kalmadı, font boyutu sorunsuz büyüyor ve küçülüyor!');
  } else {
    console.log('❌ Hata devam ediyor!');
  }
}

testNewAlgorithm();
