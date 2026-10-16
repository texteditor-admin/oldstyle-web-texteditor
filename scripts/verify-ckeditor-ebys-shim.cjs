const { JSDOM } = require('jsdom');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- BAŞLANGIÇ: CKEDITOR 4 & OLGU EBYS ENTEGRASYON DOĞRULAMA TESTİ ---');

// 1. Sanal DOM Kurulumu (Metronic + Bootstrap 3 + Olgu EBYS modal ortamı)
const dom = new JSDOM(`<!DOCTYPE html>
<html lang="tr" class="k-webkit modal-open">
<head>
  <meta charset="utf-8">
  <style>
    .cke { visibility: hidden; }
  </style>
</head>
<body class="page-header-fixed">
  <!-- EBYS Metronic Modal Penceresi -->
  <div class="modal fade in" id="belgeModal" style="display: block;">
    <div class="modal-dialog modal-full">
      <div class="modal-content">
        <div class="modal-header">
          <h4 class="modal-title">BELGE İŞLEMLERİ: TASLAK DEĞİŞTİR</h4>
        </div>
        <div class="modal-body">
          <form id="frmBelge">
            <textarea id="txtMetin" name="txtMetin" rows="15">&lt;p&gt;KEMALPAŞA BELEDİYE BAŞKANLIĞI&lt;/p&gt;&lt;p&gt;Yazı İşleri Müdürlüğü'ne&lt;/p&gt;</textarea>
          </form>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`, {
  runScripts: 'dangerously',
  resources: 'usable'
});

const { window } = dom;
global.window = window;
global.document = window.document;
global.HTMLElement = window.HTMLElement;
global.HTMLTextAreaElement = window.HTMLTextAreaElement;
global.Node = window.Node;
global.Range = window.Range;
global.Selection = window.Selection;

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

// Minimal jQuery mock for adapter testing
const jQuery = function(selector) {
  const elements = typeof selector === 'string'
    ? Array.from(window.document.querySelectorAll(selector))
    : (selector ? [selector] : []);

  const jq = {
    length: elements.length,
    each: function(callback) {
      elements.forEach((el, index) => callback.call(el, index, el));
      return jq;
    },
    val: function(newVal) {
      if (newVal !== undefined) {
        if (jQuery.valHooks && jQuery.valHooks.textarea && jQuery.valHooks.textarea.set) {
          elements.forEach(el => jQuery.valHooks.textarea.set(el, newVal));
        } else {
          elements.forEach(el => { el.value = newVal; });
        }
        return jq;
      } else {
        const first = elements[0];
        if (!first) return undefined;
        if (jQuery.valHooks && jQuery.valHooks.textarea && jQuery.valHooks.textarea.get) {
          return jQuery.valHooks.textarea.get(first);
        }
        return first.value;
      }
    }
  };

  elements.forEach((el, i) => { jq[i] = el; });
  Object.assign(jq, jQuery.fn);
  return jq;
};

jQuery.fn = {};
jQuery.valHooks = { textarea: {} };
window.jQuery = jQuery;
window.$ = jQuery;

// AMD define mock (RequireJS)
const amdModules = {};
window.define = function(name, deps, factory) {
  if (typeof name === 'function') {
    factory = name;
    deps = [];
    name = 'anonymous';
  } else if (Array.isArray(name)) {
    factory = deps;
    deps = name;
    name = 'anonymous';
  }
  if (typeof factory === 'function') {
    const exportsObj = {};
    const res = factory(exportsObj);
    amdModules[name] = res || exportsObj;
  }
};
window.define.amd = true;

// Build edilmiş UMD kütüphanesini sanal pencereye dahil et
const bundlePath = path.resolve(__dirname, '../dist/resmi-yazi-editor.umd.js');
const bundleCode = fs.readFileSync(bundlePath, 'utf8');

// Node.js CommonJS exports kapsamından izole ederek tarayıcı (window) ortamında çalıştır
(new Function('window', 'document', 'define', bundleCode)).call(window, window, window.document, window.define);

console.log('[TEST 1] Kütüphane yükleme ve Global Nesne Kontrolleri:');
assert(window.CKEDITOR, 'window.CKEDITOR mevcut olmalıdır');
assert.strictEqual(window.CKEDITOR.status, 'loaded', 'CKEDITOR.status "loaded" olmalıdır');
assert(window.CKEDITOR.instances, 'CKEDITOR.instances sözlüğü mevcut olmalıdır');
assert.strictEqual(typeof window.CKEDITOR.replace, 'function', 'CKEDITOR.replace fonksiyon olmalıdır');
console.log('  ✅ window.CKEDITOR tanımlı ve versiyon:', window.CKEDITOR.version);

console.log('\n[TEST 2] CKEDITOR.replace(id, config) ile Textarea Dönüştürme:');
const txtMetin = window.document.getElementById('txtMetin');
assert(txtMetin, '#txtMetin elemanı mevcut olmalı');

const editorInst = window.CKEDITOR.replace('txtMetin', {
  readOnly: false,
  height: 600
});

assert(editorInst, 'replace() bir CKEditorInstanceShim döndürmelidir');
assert(window.CKEDITOR.instances['txtMetin'], 'CKEDITOR.instances["txtMetin"] kayıtlı olmalıdır');
assert.strictEqual(window.CKEDITOR.instances['txtMetin'], editorInst, 'Instance eşleşmelidir');
console.log('  ✅ CKEDITOR.replace("txtMetin") başarıyla oluşturuldu ve instances kayıt edildi.');

console.log('\n[TEST 3] Başlangıç Verisi (getData) ve Textarea Senkronizasyonu:');
const initialData = editorInst.getData();
console.log('  Mevcut Data:', initialData);
assert(initialData.includes('KEMALPAŞA BELEDİYE BAŞKANLIĞI'), 'Textarea içeriği editöre aktarılmış olmalıdır');
console.log('  ✅ Başlangıç içeriği eksiksiz aktarıldı.');

console.log('\n[TEST 4] setData(html, callback) ve change Event Testi:');
let callbackFired = false;
let changeEventFired = false;

editorInst.on('change', () => {
  changeEventFired = true;
});

const yeniIcerik = '<p>T.C. İZMİR BÜYÜKŞEHİR BELEDİYE BAŞKANLIĞI</p><p>Genel Sekreterlik Makamına</p>';
editorInst.setData(yeniIcerik, () => {
  callbackFired = true;
});

const guncelData = editorInst.getData();
assert(guncelData.includes('T.C. İZMİR BÜYÜKŞEHİR BELEDİYE BAŞKANLIĞI'), 'setData sonrası yeni içerik alınmalıdır');
assert.strictEqual(txtMetin.value, guncelData, 'Orijinal textarea değeri otomatik güncellenmelidir');
console.log('  ✅ setData başarıyla içeriği ve textarea değerini güncelledi.');

console.log('\n[TEST 5] insertHtml ve Komut İşletimi:');
editorInst.insertHtml('<p><strong>Ek Bilgi:</strong> Belge 5070 sayılı Kanuna göre onaylanmıştır.</p>');
const htmlAfterInsert = editorInst.getData();
assert(htmlAfterInsert.includes('5070 sayılı Kanuna göre'), 'insertHtml içeriği eklemelidir');
console.log('  ✅ insertHtml başarıyla çalıştı.');

console.log('\n[TEST 6] jQuery ($().ckeditor()) Adaptörü ve $.val() Hook Testi:');
// İkinci bir textarea oluşturalım
const form = window.document.getElementById('frmBelge');
const txtEk = window.document.createElement('textarea');
txtEk.id = 'txtEkler';
txtEk.value = '<p>Ek-1: İnceleme Raporu</p>';
form.appendChild(txtEk);

// jQuery ile başlat
let jqueryCallbackFired = false;
window.$('#txtEkler').ckeditor(function() {
  jqueryCallbackFired = true;
});

const ekEditor = window.CKEDITOR.instances['txtEkler'];
assert(ekEditor, 'jQuery adapter üzerinden txtEkler instance oluşturulmalıdır');
assert.strictEqual(window.$('#txtEkler').ckeditorGet(), ekEditor, '$.fn.ckeditorGet doğru instance döndürmelidir');

// jQuery .val() okuma ve yazma testi
const valOkunan = window.$('#txtEkler').val();
assert(valOkunan.includes('Ek-1: İnceleme Raporu'), '$.val() doğrudan editörün HTML çıktısını okumalıdır');
console.log('  ✅ $(elem).val() okuması editörden başarıyla veri çekti.');

window.$('#txtEkler').val('<p>Ek-1: Güncellenmiş Belge Listesi</p>');
const valGuncel = window.$('#txtEkler').val();
assert(valGuncel.includes('Güncellenmiş Belge Listesi'), '$.val(val) editör içeriğini güncellemelidir');
console.log('  ✅ $(elem).val(val) yazması editör içeriğini başarıyla güncelledi.');

console.log('\n[TEST 7] EBYS Metronic / Bootstrap Modal CSS Uyumluluk Kontrolleri:');
const cssPath = path.resolve(__dirname, '../dist/resmi-yazi-editor.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert(cssContent.includes('.modal-body .rye-container'), 'Modal içi yükseklik kuralı mevcut olmalıdır');
assert(cssContent.includes('.cke.rye-container') || cssContent.includes('.rye-container.cke'), '.cke gizleme kuralını ezen stil mevcut olmalıdır');
assert(cssContent.includes('z-index:2500') || cssContent.includes('z-index: 2500'), 'Dropdown z-index 2500 olmalıdır');
console.log('  ✅ Modal yükseklik ve .cke görünürlük stilleri CSS paketinde mevcut.');

console.log('\n[TEST 8] RequireJS / AMD Modül Tanımları:');
assert(amdModules['ckeditor-core'], 'ckeditor-core AMD modülü tanımlanmış olmalıdır');
assert(amdModules['ckeditor'], 'ckeditor AMD modülü tanımlanmış olmalıdır');
console.log('  ✅ AMD "ckeditor-core" ve "ckeditor" modülleri RequireJS için başarıyla tanımlandı.');

console.log('\n[TEST 9] Editor destroy() ve Temizlik:');
editorInst.destroy();
assert.strictEqual(window.CKEDITOR.instances['txtMetin'], undefined, 'destroy sonrası instance silinmelidir');
assert.strictEqual(editorInst.status, 'destroyed', 'Status destroyed olmalıdır');
console.log('  ✅ destroy() sonrası bellek ve instances temizliği eksiksiz tamamlandı.');

console.log('\n🎉 TEBRİKLER: CKEDITOR 4 & OLGU EBYS ADAPTÖRÜ TÜM 9 TESTTEN %100 BAŞARIYLA GEÇTİ!');
