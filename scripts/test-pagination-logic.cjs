const { JSDOM } = require('jsdom');

console.log('--- TEST BAŞLIYOR: MULTI-PAGE A4 PAGINATION ALGORİTMASI ---');

const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
<style>
  .rye-page {
    width: 794px;
    height: 1123px; /* A4 297mm */
    box-sizing: border-box;
    padding: 95px; /* 2.5cm */
    overflow: hidden;
  }
  p {
    margin: 0 0 16px 0;
    line-height: 1.5;
    font-size: 16px;
  }
</style>
</head>
<body>
  <div id="editable">
    <div class="rye-page" data-page="1">
    </div>
  </div>
</body>
</html>
`, { runScripts: 'dangerously' });

const window = dom.window;
const document = window.document;

const page1 = document.querySelector('.rye-page');

// Sayfa yüksekliği ve içerik alanı
console.log('Page 1 oluşturuldu.');

// Simüle edelim: 1 paragraf ~40px yüksekliğinde olsun.
// 1123px - 190px (padding) = 933px kullanılabilir alan.
// 933px / 40px = ~23 paragraf 1 sayfaya sığar. 24. paragraf 2. sayfaya taşmalı.

class MockPagination {
  constructor(editable) {
    this.editable = editable;
    this.a4Height = 1123;
    this.contentMaxHeight = 933; // 1123 - 2 * 95
  }

  // JSDOM offsetHeight simülasyonu
  getBlockHeight(block) {
    // Paragraf içindeki metin uzunluğuna göre yaklaşık yükseklik
    const textLen = block.textContent.length;
    const lines = Math.max(1, Math.ceil(textLen / 70));
    const margin = 16;
    return (lines * 24) + margin;
  }

  getPageContentHeight(pageEl) {
    let total = 0;
    const blocks = Array.from(pageEl.children).filter(c => !c.classList.contains('rye-page-footer'));
    for (const b of blocks) {
      total += this.getBlockHeight(b);
    }
    return total;
  }

  repaginate() {
    let pages = Array.from(this.editable.querySelectorAll('.rye-page'));
    if (pages.length === 0) return;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      // Overflow kontrolü
      while (this.getPageContentHeight(page) > this.contentMaxHeight && page.children.length > 1) {
        let nextPage = pages[i + 1];
        if (!nextPage) {
          nextPage = document.createElement('div');
          nextPage.className = 'rye-page';
          nextPage.setAttribute('data-page', String(i + 2));
          this.editable.appendChild(nextPage);
          pages.push(nextPage);
        }

        const lastChild = page.lastElementChild;
        nextPage.insertBefore(lastChild, nextPage.firstChild);
      }

      // Underflow kontrolü (sonraki sayfadan içerik geri alma)
      const nextPage = pages[i + 1];
      if (nextPage && nextPage.children.length > 0) {
        const firstChildNext = nextPage.firstElementChild;
        const candidateHeight = this.getBlockHeight(firstChildNext);

        if (this.getPageContentHeight(page) + candidateHeight <= this.contentMaxHeight) {
          page.appendChild(firstChildNext);
        }
      }

      // Boş sayfaları temizleme (ilk sayfa hariç)
      if (i > 0 && page.children.length === 0) {
        page.remove();
        pages.splice(i, 1);
        i--;
      }
    }

    // Sayfa numaralarını güncelle
    pages = Array.from(this.editable.querySelectorAll('.rye-page'));
    pages.forEach((p, idx) => {
      p.setAttribute('data-page', String(idx + 1));
    });

    return pages.length;
  }
}

const pagination = new MockPagination(document.getElementById('editable'));

// 30 paragraf ekleyelim
for (let i = 1; i <= 30; i++) {
  const p = document.createElement('p');
  p.textContent = `Paragraf ${i}: Cumhurbaşkanlığı Resmi Yazışmalarda Uygulanacak Usul ve Esaslar Hakkında Yönetmelik resmi belge metni satırı deneme metni.`;
  page1.appendChild(p);
}

console.log('Başlangıçta Page 1 çocuk sayısı:', page1.children.length);

const pageCount = pagination.repaginate();
console.log('Repaginate sonrası toplam sayfa sayısı:', pageCount);

const allPages = document.querySelectorAll('.rye-page');
allPages.forEach((p, idx) => {
  console.log(`Sayfa ${idx + 1} paragraf sayısı:`, p.children.length);
});

if (pageCount >= 2) {
  console.log('✅ TEST BAŞARILI: 30 paragraf 2 sayfaya bölündü!');
} else {
  console.error('❌ TEST BAŞARISIZ: 2. sayfa açılmadı!');
  process.exit(1);
}
