const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="container"></div></body></html>`, { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.DOMParser = dom.window.DOMParser;
global.HTMLElement = dom.window.HTMLElement;

// UMD bundle'ını yükle
const bundlePath = path.resolve(__dirname, '../dist/resmi-yazi-editor.umd.js');
const bundleCode = fs.readFileSync(bundlePath, 'utf8');
const fn = new Function(bundleCode);
fn();

const ExportPlugin = dom.window.ExportPlugin;

console.log('--- TEST BAŞLIYOR: WORD (.DOCX) DIŞA AKTARIM (EXPORT) SADAKAT TESTİ ---');

const sampleHtml = `
<p style="text-align: center; font-weight: bold; margin-bottom: 20pt;">
  T.C.<br>
  <span style="color: rgb(220, 38, 38);">İÇİŞLERİ BAKANLI</span>ĞI<br>
  <span style="color: rgb(37, 99, 235);">Bilgi</span> Teknolojileri Genel Müdürlüğü
</p>
<p style="margin-bottom: 16pt;"><strong>Sayı :</strong> E-12345678-700-001<br>
<strong>Konu :</strong> Resmi Yazışma Sistemi Entegrasyonu</p>
<p style="text-align: center; font-weight: bold; margin: 16pt 0;">DAĞITIM YERLERİNE</p>
<p>Cumhurbaşkanlığı Resmi Yazışmalarda Uygulanacak Usul ve Esaslar Hakkında Yönetmelik hükümlerine uygun olarak hazırlanan bu sistem, harici hiçbir kütüphaneye ihtiyaç duymaksızın doğrudan web sayfalarına entegre edilebilmektedir.</p>
<p>Word (.docx ve .doc) belgeleri doğrudan editöre aktarılabilmekte, Word (.docx) ve PDF formatlarında standartlara uygun şekilde dışa aktarılabilmektedir.</p>
<p>Gereğini ve bilgilerinizi arz/rica ederim.</p>
`;

const { docXml } = ExportPlugin.htmlToDocxXml(sampleHtml);

// 1. XML içinde unprintable kontrol karakteri (\n, \r) olmamalı
const wtRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
let match;
let hasInvalidNewlines = false;
while ((match = wtRegex.exec(docXml)) !== null) {
  if (match[1].includes('\n') || match[1].includes('\r')) {
    hasInvalidNewlines = true;
    break;
  }
}
console.log('[KONTROL 1] w:t etiketleri içinde unprintable \\r/\\n var mı:', hasInvalidNewlines ? 'HATA VAR' : 'TEMİZ (YOK)');
if (hasInvalidNewlines) throw new Error('w:t içinde unprintable kontrol karakterleri tespit edildi!');

// 2. Renklerin korunması
const hasRed = docXml.includes('w:color w:val="DC2626"');
const hasBlue = docXml.includes('w:color w:val="2563EB"');
console.log('[KONTROL 2] Kırmızı (#DC2626) renk var mı:', hasRed);
console.log('[KONTROL 2] Mavi (#2563EB) renk var mı:', hasBlue);
if (!hasRed || !hasBlue) throw new Error('Yazı renkleri XML içinde bulunamadı!');

// 3. DAĞITIM YERLERİNE ortalama ve boşluklar
const hasDagitimCenter = docXml.includes('<w:jc w:val="center"/>') && docXml.includes('DAĞITIM YERLERİNE');
const hasDagitimSpacing = docXml.includes('w:before="320"') && docXml.includes('w:after="320"');
console.log('[KONTROL 3] DAĞITIM YERLERİNE ortalama var mı:', hasDagitimCenter);
console.log('[KONTROL 3] DAĞITIM YERLERİNE 16pt (320 twips) önce/sonra boşluk var mı:', hasDagitimSpacing);
if (!hasDagitimCenter || !hasDagitimSpacing) throw new Error('DAĞITIM YERLERİNE boşluk veya hizalaması hatalı!');

// 4. Gövde paragraflarında 1.25cm (709 twips) ilk satır girintisi
const hasBodyIndent = docXml.includes('w:firstLine="709"');
console.log('[KONTROL 4] Gövde paragraflarında 1.25 cm ilk satır girintisi var mı:', hasBodyIndent);
if (!hasBodyIndent) throw new Error('Gövde paragraflarında 1.25 cm ilk satır girintisi eksik!');

// 5. Başlıkta T.C. için 20pt (400 twips) alt boşluk
const hasTcSpacing = docXml.includes('w:after="400"');
console.log('[KONTROL 5] T.C. başlığında 20pt (400 twips) alt boşluk var mı:', hasTcSpacing);
if (!hasTcSpacing) throw new Error('T.C. başlığında 20pt alt boşluk eksik!');

console.log('🎉 WORD (.DOCX) DIŞA AKTARIM SADAKAT TESTİ BAŞARIYLA TAMAMLANDI!');
