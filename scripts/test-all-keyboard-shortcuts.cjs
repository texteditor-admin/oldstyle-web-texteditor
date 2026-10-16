const { JSDOM } = require('jsdom');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="editor"></div></body></html>`, {
  runScripts: 'dangerously',
  resources: 'usable'
});

const { window } = dom;
global.window = window;
global.document = window.document;
global.HTMLElement = window.HTMLElement;
global.HTMLTextAreaElement = window.HTMLTextAreaElement;
global.HTMLInputElement = window.HTMLInputElement;
global.Node = window.Node;
global.Range = window.Range;
global.Selection = window.Selection;

if (!window.document.createRange) {
  window.document.createRange = function() {
    return {
      setStart: () => {},
      setEnd: () => {},
      commonAncestorContainer: window.document.body,
      selectNodeContents: () => {},
      collapse: () => {},
      cloneRange: function() { return this; },
      insertNode: (node) => { window.document.body.appendChild(node); }
    };
  };
}

const bundlePath = path.resolve(__dirname, '../dist/oldstyle-web-texteditor.umd.js');
const bundleCode = fs.readFileSync(bundlePath, 'utf8');
(new Function('window', 'document', bundleCode)).call(window, window, window.document);

const Editor = window.OldStyleWebTextEditor || window.ResmiYaziEditor;
console.log('Editor class found:', typeof Editor);

const editorEl = window.document.getElementById('editor');
const editor = new Editor(editorEl, {
  initialData: '<p>Merhaba dunya, resmi yazi metni burada yer almaktadir.</p>'
});

console.log('Editor initialized. Editable element exists:', Boolean(editor.editable));

// Helper to fire keydown
function fireKey(key, options = {}) {
  const evt = new window.KeyboardEvent('keydown', {
    key: key,
    code: options.code || (key.length === 1 ? 'Key' + key.toUpperCase() : key),
    ctrlKey: Boolean(options.ctrlKey),
    metaKey: Boolean(options.metaKey),
    shiftKey: Boolean(options.shiftKey),
    altKey: Boolean(options.altKey),
    bubbles: true,
    cancelable: true
  });
  const target = options.target || editor.editable;
  return target.dispatchEvent(evt);
}

// 1. Test Ctrl + B
console.log('\n--- 1. Testing Ctrl + B ---');
let boldExecuted = false;
const origExecute = editor.execute.bind(editor);
editor.execute = function(cmd, val) {
  if (cmd === 'bold') boldExecuted = true;
  return origExecute(cmd, val);
};
fireKey('b', { ctrlKey: true });
console.log('Ctrl+B dispatched. boldExecuted:', boldExecuted);

// 2. Test Ctrl + I
console.log('\n--- 2. Testing Ctrl + I ---');
let italicExecuted = false;
editor.execute = function(cmd, val) {
  if (cmd === 'italic') italicExecuted = true;
  return origExecute(cmd, val);
};
fireKey('i', { ctrlKey: true });
console.log('Ctrl+I dispatched. italicExecuted:', italicExecuted);

// 3. Test Ctrl + U
console.log('\n--- 3. Testing Ctrl + U ---');
let underlineExecuted = false;
editor.execute = function(cmd, val) {
  if (cmd === 'underline') underlineExecuted = true;
  return origExecute(cmd, val);
};
fireKey('u', { ctrlKey: true });
console.log('Ctrl+U dispatched. underlineExecuted:', underlineExecuted);

// 4. Test Ctrl + Z
console.log('\n--- 4. Testing Ctrl + Z ---');
let undoExecuted = false;
editor.execute = function(cmd, val) {
  if (cmd === 'undo') undoExecuted = true;
  return origExecute(cmd, val);
};
fireKey('z', { ctrlKey: true });
console.log('Ctrl+Z dispatched. undoExecuted:', undoExecuted);

// 5. Test Ctrl + Y
console.log('\n--- 5. Testing Ctrl + Y ---');
let redoExecuted = false;
editor.execute = function(cmd, val) {
  if (cmd === 'redo') redoExecuted = true;
  return origExecute(cmd, val);
};
fireKey('y', { ctrlKey: true });
console.log('Ctrl+Y dispatched. redoExecuted:', redoExecuted);

// 6. Test Ctrl + F
console.log('\n--- 6. Testing Ctrl + F ---');
const findBox = editor.findBox;
console.log('Before Ctrl+F, findBox isOpen:', findBox.isOpen);
fireKey('f', { ctrlKey: true });
console.log('After Ctrl+F, findBox isOpen:', findBox.isOpen);

// 7. Test Ctrl + P
console.log('\n--- 7. Testing Ctrl + P ---');
let printExecuted = false;
editor.print = function() {
  printExecuted = true;
};
fireKey('p', { ctrlKey: true });
console.log('Ctrl+P dispatched. printExecuted:', printExecuted);

// 8. Test Ctrl + S
console.log('\n--- 8. Testing Ctrl + S ---');
let saveFired = false;
editor.on('save', () => {
  saveFired = true;
});
fireKey('s', { ctrlKey: true });
console.log('Ctrl+S dispatched. saveFired:', saveFired);

// 9. Test Ctrl + Enter
console.log('\n--- 9. Testing Ctrl + Enter ---');
let pageBreakExecuted = false;
editor.execute = function(cmd, val) {
  if (cmd === 'insertPageBreak') pageBreakExecuted = true;
  return origExecute(cmd, val);
};
fireKey('Enter', { ctrlKey: true });
console.log('Ctrl+Enter dispatched. pageBreakExecuted:', pageBreakExecuted);

// 10. Test Tab
console.log('\n--- 10. Testing Tab ---');
let defaultPrevented = !fireKey('Tab', {});
console.log('Tab dispatched. Default prevented:', defaultPrevented);

// 11. Test Shift + Tab
console.log('\n--- 11. Testing Shift + Tab ---');
let shiftTabPrevented = !fireKey('Tab', { shiftKey: true });
console.log('Shift+Tab dispatched. Default prevented:', shiftTabPrevented);
