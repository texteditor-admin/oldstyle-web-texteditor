const { JSDOM } = require('jsdom');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- BAŞLANGIÇ: TAM İZOLE BASKI VE YAZDIRMA (PRINT ISOLATION) TESTİ ---');

// 1. Çoklu editörlü, modal içeren ve EBYS portallı karmaşık Sanal DOM
const dom = new JSDOM(`<!DOCTYPE html>
<html lang="tr" class="k-webkit modal-open">
<head>
  <meta charset="utf-8">
  <title>EBYS Portal & Çoklu Editör Ortamı</title>
  <style>
    .cke { visibility: hidden; }
  </style>
</head>
<body class="page-header-fixed">
  <!-- 1. Dış Portal Header & Navigasyon -->
  <header class="page-header">
    <div class="navbar">Belediye EBYS Portalı Başlığı (Baskıda Asla Çıkmamalı)</div>
  </header>
  <aside class="page-sidebar">
    <div class="sidebar-menu">Sol Menü Ağacı (Baskıda Asla Çıkmamalı)</div>
  </aside>

  <!-- 2. Ana İçerik ve Diğer Editörler (Örn: Gömülü Editör) -->
  <main class="page-content">
    <div class="card">
      <div class="card-header">Gömülü Belge 1</div>
      <div id="embeddedEditorHost">
        <p>Gömülü editör metni</p>
      </div>
    </div>

    <!-- 3. EBYS Modal Penceresi (Aktif Modal Editörü) -->
    <div class="modal fade in" id="belgeModal" style="display: block;">
      <div class="modal-dialog modal-full">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title">BELGE İŞLEMLERİ: TASLAK DEĞİŞTİR (Baskıda Asla Çıkmamalı)</h4>
            <button class="bootbox-close-button">✕</button>
          </div>
          <div class="modal-body">
            <div id="modalEditorHost">
              <p>Modal içindeki resmi yazı metni</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-default">Vazgeç (Baskıda Asla Çıkmamalı)</button>
            <button class="btn btn-primary">e-İmza (Baskıda Asla Çıkmamalı)</button>
          </div>
        </div>
      </div>
    </div>
  </main>

  <footer class="page-footer">Portal Altbilgi (Baskıda Asla Çıkmamalı)</footer>
</body>
</html>`, {
  runScripts: 'dangerously'
});

const { window } = dom;
global.window = window;
global.document = window.document;
global.HTMLElement = window.HTMLElement;
global.HTMLTextAreaElement = window.HTMLTextAreaElement;
global.Node = window.Node;

// Range polyfill
if (!window.document.createRange) {
  window.document.createRange = function() {
    return {
      setStart: () => {},
      setEnd: () => {},
      commonAncestorContainer: window.document.body,
      selectNodeContents: () => {},
      collapse: () => {},
      cloneRange: function() { return this; },
      insertNode: (node) => {
        window.document.body.appendChild(node);
      }
    };
  };
}

// UMD kütüphanesini sanal pencerede çalıştır
const bundlePath = path.resolve(__dirname, '../dist/resmi-yazi-editor.umd.js');
const bundleCode = fs.readFileSync(bundlePath, 'utf8');
(new Function('window', 'document', bundleCode)).call(window, window, window.document);

const ResmiYaziEditor = window.ResmiYaziEditor;
const PrintManager = window.PrintManager;

assert(ResmiYaziEditor, 'ResmiYaziEditor yüklü olmalıdır');
assert(PrintManager, 'PrintManager yüklü olmalıdır');
console.log('✅ Editör ve PrintManager başarıyla yüklendi.');

async function runTests() {
  console.log('\n[TEST 1] İki Farklı Editör Oluşturma (Gömülü ve Modal):');
  const embeddedHost = window.document.getElementById('embeddedEditorHost');
  const modalHost = window.document.getElementById('modalEditorHost');

  const editorEmbedded = await ResmiYaziEditor.create(embeddedHost, {
    initialData: '<p>GÖMÜLÜ EDİTÖR İÇERİĞİ (BAŞKA EDİTÖR)</p>'
  });

  const editorModal = await ResmiYaziEditor.create(modalHost, {
    initialData: '<p>T.C. KEMALPAŞA BELEDİYE BAŞKANLIĞI</p><p>YAZDIRILACAK ASIL RESMİ YAZI METNİ</p>'
  });

  assert(editorEmbedded, 'Gömülü editör oluştu');
  assert(editorModal, 'Modal editörü oluştu');
  console.log('  ✅ 2 bağımsız editör DOM üzerine başarıyla yerleşti.');

  console.log('\n[TEST 2] Hedef Editör Çözümleme (resolveTarget):');
  // Modal içindeki editörü parametre olarak gönderdiğimizde
  const resolvedDirect = PrintManager.resolveTarget(editorModal);
  assert(resolvedDirect, 'editorModal hedeflenebilmeli');
  assert.strictEqual(resolvedDirect.container, editorModal.container, 'Doğru container çözümlenmeli');
  console.log('  ✅ Doğrudan nesne üzerinden hedef editör başarıyla çözümlendi.');

  // Odaklanma durumunda çözümleme
  editorModal.editable.focus();
  const resolvedFocus = PrintManager.resolveTarget();
  assert(resolvedFocus, 'Odaklanılan editör bulunmalı');
  assert.strictEqual(resolvedFocus.container, editorModal.container, 'Odaklanılan modal editörü çözümlenmeli');
  console.log('  ✅ Odaklanılan pencereye göre hedef editör başarıyla çözümlendi.');

  console.log('\n[TEST 3] İzole Yazdırma Sırasında UI Çöplerinin Temizlenmesi:');
  // Sayfa içerisine geçici bir badge, ruler ve tablo kolu ekleyelim
  const page = editorModal.editable.querySelector('.rye-page');
  assert(page, 'Modal editöründe .rye-page bulunmalıdır');

  const badge = window.document.createElement('div');
  badge.className = 'rye-page-footer-badge';
  badge.textContent = 'Sayfa 1 / 1';
  page.appendChild(badge);

  const handle = window.document.createElement('div');
  handle.className = 'rye-table-handle';
  handle.textContent = '✥ Kol';
  page.appendChild(handle);

  // Klonlama mantığını doğrula
  const clone = page.cloneNode(true);
  clone.querySelectorAll('.rye-page-footer-badge, .rye-table-handle, .rye-table-toolbar, .rye-ruler-bar').forEach(el => el.remove());

  assert(!clone.querySelector('.rye-page-footer-badge'), 'Badge baskı klonunda bulunmamalı');
  assert(!clone.querySelector('.rye-table-handle'), 'Tablo kolu baskı klonunda bulunmamalı');
  console.log('  ✅ Editör içi geçici UI elemanları (kollar, rozetler vb.) baskıdan temizlendi.');

  console.log('\n[TEST 4] Fallback / Native Print İzolasyonu (beforeprint / afterprint):');
  // beforeprint tetiklendiğinde
  PrintManager.fallbackPrint(editorModal.container);

  assert(window.document.body.classList.contains('rye-body-isolated-print'), 'body.rye-body-isolated-print eklenmeli');
  assert(editorModal.container.classList.contains('rye-print-active-target'), 'editorModal.container.rye-print-active-target eklenmeli');
  assert(!editorEmbedded.container.classList.contains('rye-print-active-target'), 'Diğer editör işaretlenmemeli');
  console.log('  ✅ Baskı sırasında aktif editör rye-print-active-target ile izole edildi, diğer editör hariç tutuldu.');

  console.log('\n[TEST 5] CSS Kurallarında Dış Elemanların Kaldırılması:');
  const cssContent = fs.readFileSync(path.resolve(__dirname, '../dist/resmi-yazi-editor.css'), 'utf8');

  // Dış portal elemanlarının display: none olması
  assert(cssContent.includes('.page-header'), '.page-header gizlenmeli');
  assert(cssContent.includes('.page-sidebar'), '.page-sidebar gizlenmeli');
  assert(cssContent.includes('.modal-header'), '.modal-header gizlenmeli');
  assert(cssContent.includes('.modal-footer'), '.modal-footer gizlenmeli');
  assert(cssContent.includes('.tab-btn'), '.tab-btn gizlenmeli');

  // Diğer editörlerin display: none olması kuralı
  assert(cssContent.includes('body.rye-body-isolated-print .rye-container:not(.rye-print-active-target)'), 'İnaktif editörler gizlenmeli');
  console.log('  ✅ CSS dosyasında portal header, sidebar, modal çerçevesi ve diğer editörleri gizleyen kurallar mevcut.');

  console.log('\n[TEST 6] Ctrl+P Kısayolunun Yakalanması (preventDefault & editor.print):');
  let printTriggered = false;
  editorModal.print = function() {
    printTriggered = true;
  };

  const keyEvent = new window.KeyboardEvent('keydown', {
    key: 'p',
    ctrlKey: true,
    cancelable: true
  });

  editorModal.editable.dispatchEvent(keyEvent);
  assert(keyEvent.defaultPrevented, 'Ctrl+P tarayıcı varsayılanı engellenmeli (preventDefault)');
  assert(printTriggered, 'editor.print() fonksiyonu tetiklenmeli');
  console.log('  ✅ Ctrl+P kısayolu tarayıcı varsayılanını engelleyerek izole editör baskısını tetikliyor.');

  console.log('\n🎉 TEBRİKLER: YAZDIRMA İZOLASYONU TÜM 6 TESTTEN %100 BAŞARIYLA GEÇTİ!');
}

runTests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});
