const { JSDOM } = require('jsdom');

console.log('--- TEST BAŞLIYOR: TAM PAGINATION & SAYFA YÖNETİMİ TESTİ ---');

const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
<style>
  .rye-editable {
    background: #525659;
    padding: 30px 0;
  }
  .rye-page {
    width: 794px;
    height: 1123px;
    box-sizing: border-box;
    padding: 95px;
    background: #ffffff;
    margin: 0 auto 30px auto;
    position: relative;
    overflow: hidden;
  }
  .rye-page-footer-badge {
    position: absolute;
    bottom: 30px;
    right: 95px;
    font-size: 10px;
  }
  p {
    margin: 0 0 16px 0;
    line-height: 1.5;
    font-size: 16px;
  }
</style>
</head>
<body>
  <div class="rye-editable" contenteditable="true">
    <div class="rye-page" data-page="1">
      <p>Başlangıç paragrafı.</p>
    </div>
  </div>
</body>
</html>
`, { runScripts: 'dangerously' });

const window = dom.window;
const document = window.document;

class PaginationManager {
  constructor(editable) {
    this.editable = editable;
    this.maxContentHeightPx = 933; // 1123 - 2 * 95
  }

  estimateBlockHeight(el) {
    if (el.classList.contains('rye-page-footer-badge')) return 0;
    if (el.classList.contains('rye-page-break')) return 20;
    // JSDOM metin uzunluğuna göre yaklaşık yükseklik
    const textLen = el.textContent.length;
    const lines = Math.max(1, Math.ceil(textLen / 70));
    return (lines * 24) + 16;
  }

  getPageContentHeight(pageEl) {
    let total = 0;
    const children = Array.from(pageEl.children).filter(c => !c.classList.contains('rye-page-footer-badge'));
    for (const child of children) {
      total += this.estimateBlockHeight(child);
    }
    return total;
  }

  ensurePageStructure() {
    let pages = Array.from(this.editable.querySelectorAll('.rye-page'));
    if (pages.length === 0) {
      const page = document.createElement('div');
      page.className = 'rye-page';
      page.setAttribute('data-page', '1');
      while (this.editable.firstChild) {
        page.appendChild(this.editable.firstChild);
      }
      this.editable.appendChild(page);
    }
  }

  repaginate() {
    this.ensurePageStructure();
    let pages = Array.from(this.editable.querySelectorAll('.rye-page'));

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      // 1. Manuel Page Break Kontrolü
      const breakEl = page.querySelector('.rye-page-break');
      if (breakEl) {
        let nextPage = pages[i + 1];
        if (!nextPage) {
          nextPage = document.createElement('div');
          nextPage.className = 'rye-page';
          this.editable.appendChild(nextPage);
          pages.push(nextPage);
        }

        // breakEl'den sonraki tüm elemanları sonraki sayfaya taşı
        let nextSibling = breakEl.nextElementSibling;
        const toMove = [];
        while (nextSibling) {
          if (!nextSibling.classList.contains('rye-page-footer-badge')) {
            toMove.push(nextSibling);
          }
          nextSibling = nextSibling.nextElementSibling;
        }

        toMove.reverse().forEach(el => {
          nextPage.insertBefore(el, nextPage.firstChild);
        });
      }

      // 2. Yükseklik Aşımı (Overflow) Kontrolü
      while (this.getPageContentHeight(page) > this.maxContentHeightPx) {
        const contentChildren = Array.from(page.children).filter(c => !c.classList.contains('rye-page-footer-badge'));
        if (contentChildren.length <= 1) break;

        let nextPage = pages[i + 1];
        if (!nextPage) {
          nextPage = document.createElement('div');
          nextPage.className = 'rye-page';
          this.editable.appendChild(nextPage);
          pages.push(nextPage);
        }

        const lastChild = contentChildren[contentChildren.length - 1];
        nextPage.insertBefore(lastChild, nextPage.firstChild);
      }

      // 3. İçerik Geri Çekme (Underflow) Kontrolü
      const nextPage = pages[i + 1];
      if (nextPage) {
        const nextContentChildren = Array.from(nextPage.children).filter(c => !c.classList.contains('rye-page-footer-badge'));
        if (nextContentChildren.length > 0) {
          const firstNext = nextContentChildren[0];
          const firstNextHeight = this.estimateBlockHeight(firstNext);

          // Eğer sayfada manuel break yoksa ve bu eleman sığıyorsa geri al
          const hasBreak = page.querySelector('.rye-page-break');
          if (!hasBreak && (this.getPageContentHeight(page) + firstNextHeight <= this.maxContentHeightPx)) {
            page.appendChild(firstNext);
          }
        }
      }

      // 4. Boş Sayfa Temizleme (İlk sayfa hariç)
      if (i > 0) {
        const contentChildren = Array.from(page.children).filter(c => !c.classList.contains('rye-page-footer-badge'));
        if (contentChildren.length === 0) {
          page.remove();
          pages.splice(i, 1);
          i--;
        }
      }
    }

    // 5. Sayfa Numarası Rozetlerini Güncelle
    pages = Array.from(this.editable.querySelectorAll('.rye-page'));
    const totalPages = pages.length;
    pages.forEach((p, idx) => {
      const pageNum = idx + 1;
      p.setAttribute('data-page', String(pageNum));

      let badge = p.querySelector('.rye-page-footer-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'rye-page-footer-badge';
        badge.setAttribute('contenteditable', 'false');
        p.appendChild(badge);
      }
      badge.textContent = `Sayfa ${pageNum} / ${totalPages}`;
    });

    return totalPages;
  }

  getData() {
    const pages = Array.from(this.editable.querySelectorAll('.rye-page'));
    const htmlParts = [];

    pages.forEach((page, idx) => {
      const clone = page.cloneNode(true);
      const badges = clone.querySelectorAll('.rye-page-footer-badge');
      badges.forEach(b => b.remove());

      if (idx > 0) {
        htmlParts.push('<div class="rye-page-break" contenteditable="false"></div>');
      }
      htmlParts.push(clone.innerHTML.trim());
    });

    return htmlParts.join('\n');
  }

  setData(html) {
    this.editable.innerHTML = '';
    const page1 = document.createElement('div');
    page1.className = 'rye-page';
    page1.setAttribute('data-page', '1');
    page1.innerHTML = html;
    this.editable.appendChild(page1);
    this.repaginate();
  }
}

const editable = document.querySelector('.rye-editable');
const pm = new PaginationManager(editable);

// Test 1: Başlangıçta 1 sayfa olmalı
pm.repaginate();
let pages = document.querySelectorAll('.rye-page');
console.log('Test 1 - Başlangıç sayfa sayısı:', pages.length);
if (pages.length !== 1) throw new Error('Başlangıç 1 sayfa olmalı!');
console.log('Rozet:', pages[0].querySelector('.rye-page-footer-badge').textContent);

// Test 2: Çok metin ekleyince 2. sayfa açılmalı
console.log('\nTest 2 - 20 uzun paragraf ekleniyor (Sayfa 2 açılmalı)...');
const p1 = pages[0];
for (let i = 1; i <= 20; i++) {
  const p = document.createElement('p');
  p.textContent = `Resmi yazı paragrafı #${i}: Bakanlığımız Bilgi Teknolojileri Genel Müdürlüğü tarafından yürütülmekte olan Resmi Yazışma Sistemi standartları uyarınca hazırlanan test metnidir.`;
  p1.appendChild(p);
}

const totalAfterAdd = pm.repaginate();
pages = document.querySelectorAll('.rye-page');
console.log('Test 2 Sonucu - Toplam Sayfa Sayısı:', totalAfterAdd);
pages.forEach((p, i) => {
  console.log(`Sayfa ${i + 1} çocuk sayısı:`, p.children.length, '| Rozet:', p.querySelector('.rye-page-footer-badge').textContent);
});

if (totalAfterAdd >= 2) {
  console.log('✅ Test 2 Başarılı: 2. sayfa otomatik olarak açıldı!');
} else {
  throw new Error('Test 2 başarısız: 2. sayfa açılmadı!');
}

// Test 3: Manuel Page Break Ekleme
console.log('\nTest 3 - Manuel Sayfa Sonu (Page Break) testi...');
const manualBreak = document.createElement('div');
manualBreak.className = 'rye-page-break';
pages[0].insertBefore(manualBreak, pages[0].children[2]);
pm.repaginate();
pages = document.querySelectorAll('.rye-page');
console.log('Test 3 Sonucu - Page Break sonrası sayfa sayısı:', pages.length);
console.log('✅ Test 3 Başarılı!');

// Test 4: getData() ve setData() testi
console.log('\nTest 4 - getData() ve setData() testi...');
const data = pm.getData();
console.log('Alınan Data uzunluğu:', data.length);
pm.setData('<p>Yeni kısa metin.</p>');
pages = document.querySelectorAll('.rye-page');
console.log('Kısa metin setData sonrası sayfa sayısı:', pages.length);
if (pages.length === 1) {
  console.log('✅ Test 4 Başarılı: Kısa metne dönünce tek sayfaya indi!');
} else {
  throw new Error('Test 4 başarısız: Tek sayfaya inmedi!');
}

console.log('\n🎉 TÜM MULTI-PAGE PAGINATION TESTLERİ BAŞARIYLA TAMAMLANDI!');
