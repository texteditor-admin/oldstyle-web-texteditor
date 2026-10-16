const { JSDOM } = require('jsdom');
const fs = require('fs');

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="editor"><p>Test</p></div></body></html>`, {
  runScripts: 'dangerously'
});

const script = fs.readFileSync('dist/resmi-yazi-editor.umd.js', 'utf8');
dom.window.eval(script);

const ResmiYaziEditor = dom.window.ResmiYaziEditor;
console.log('ResmiYaziEditor objesi mevcut:', !!ResmiYaziEditor);
console.log('create metodu mevcut:', typeof ResmiYaziEditor.create === 'function');
console.log('createModal metodu mevcut:', typeof ResmiYaziEditor.createModal === 'function');

ResmiYaziEditor.create('#editor').then(editor => {
  console.log('Editör başarıyla başlatıldı!');
  console.log('HTML Data:', editor.getData());
  const ribbon = dom.window.document.querySelector('.rye-ribbon');
  console.log('Ribbon DOM elementi oluşturuldu:', !!ribbon);
  const groups = dom.window.document.querySelectorAll('.rye-ribbon-group');
  console.log('Ribbon grup sayısı:', groups.length);
  groups.forEach((g, i) => {
    const title = g.querySelector('.rye-ribbon-title')?.textContent;
    console.log(`  Grup ${i + 1}: ${title}`);
  });
  process.exit(0);
}).catch(err => {
  console.error('HATA:', err);
  process.exit(1);
});
