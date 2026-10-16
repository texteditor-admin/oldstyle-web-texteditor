import { ResmiYaziEditor, EditorConfig } from '../core/Editor';

/**
 * ============================================================================
 * CKEDITOR 4 & OLGU EBYS (KEMALPAŞA BELEDİYESİ) UYUMLULUK ADAPTÖRÜ (SHIM)
 * ============================================================================
 * Bu adaptör; Olgu EBYS (Single Page Application - RequireJS + Metronic + Kendo UI)
 * ve tüm CKEditor 4 entegrasyonlu kurumsal sistemlerde CKEditor 4.x API'sini
 * birebir taklit ederek ResmiYaziEditor'ü sıfır kod değişikliğiyle (drop-in)
 * çalıştırır.
 */

export interface CKEditorEventData {
  editor: CKEditorInstanceShim;
  data?: any;
  name?: string;
}

export class CKEditorInstanceShim {
  public id: string;
  public name: string;
  public element: HTMLElement;
  public container!: HTMLElement;
  public editor: ResmiYaziEditor;
  public status: 'unloaded' | 'loaded' | 'ready' | 'destroyed' = 'loaded';
  public readOnly: boolean = false;
  public document: Document;
  public window: Window;
  public config: any;

  private listeners: Map<string, Set<Function>> = new Map();
  private initialData: string = '';
  private isDirtyFlag: boolean = false;

  constructor(element: HTMLElement, name: string, userConfig: any = {}) {
    this.element = element;
    this.name = name;
    this.id = name;
    this.config = userConfig || {};
    this.document = element.ownerDocument || document;
    this.window = this.document.defaultView || window;

    // Hedef elemandaki başlangıç içeriğini al
    let initialContent = '';
    if (this.config.initialData !== undefined) {
      initialContent = this.config.initialData;
    } else if (element instanceof HTMLTextAreaElement) {
      initialContent = element.value;
    } else {
      initialContent = element.innerHTML;
    }
    this.initialData = initialContent;

    // ResmiYaziEditor konfigürasyonuna dönüştür
    const editorConfig: EditorConfig = {
      initialData: initialContent,
      readOnly: Boolean(userConfig.readOnly),
      fontFamily: userConfig.fontFamily || userConfig.font_default || 'Times New Roman',
      fontSize: userConfig.fontSize || '12pt',
      lineHeight: userConfig.lineHeight || '1.15',
      pageMargin: userConfig.pageMargin || '1.5cm 1.5cm 0.5cm 1.5cm',
      paragraphSpacing: userConfig.paragraphSpacing || '0pt',
      firstLineIndent: userConfig.firstLineIndent || '1.25cm'
    };

    // Editör nesnesini oluştur
    this.editor = new ResmiYaziEditor(element, editorConfig);
    this.container = (this.editor as any).container || element.nextElementSibling as HTMLElement;

    // Özel yükseklik tanımlıysa uygula
    if (userConfig.height && this.container) {
      this.container.style.height = typeof userConfig.height === 'number'
        ? `${userConfig.height}px`
        : String(userConfig.height);
    }
    if (userConfig.width && this.container) {
      this.container.style.width = typeof userConfig.width === 'number'
        ? `${userConfig.width}px`
        : String(userConfig.width);
    }

    // Değişiklik dinleyicisi
    this.editor.on('change', () => {
      this.isDirtyFlag = true;
      this.updateElement();
      this.fire('change');
    });

    // Hazır olma durumu
    this.status = 'ready';
    if (userConfig.startupFocus) {
      setTimeout(() => this.focus(), 50);
    }
  }

  /**
   * CKEditor 4: getData()
   * Editörün güncel HTML içeriğini döndürür.
   */
  getData(): string {
    return this.editor ? this.editor.getData() : '';
  }

  /**
   * CKEditor 4: setData(html, callback)
   * İçeriği günceller ve varsa callback'i tetikler.
   */
  setData(html: string, callback?: Function): void {
    if (this.editor) {
      this.editor.setData(html || '');
      this.initialData = html || '';
      this.isDirtyFlag = false;
      this.updateElement();
      this.fire('dataReady');
      if (typeof callback === 'function') {
        setTimeout(() => callback.call(this), 0);
      }
    }
  }

  /**
   * CKEditor 4: insertHtml(html)
   * İmleç konumuna veya aktif sayfaya HTML ekler.
   */
  insertHtml(html: string): void {
    if (this.editor) {
      this.editor.execute('insertHtml', html);
      this.updateElement();
    }
  }

  /**
   * CKEditor 4: insertText(text)
   * İmleç konumuna düz metin ekler.
   */
  insertText(text: string): void {
    if (this.editor) {
      this.editor.execute('insertText', text);
      this.updateElement();
    }
  }

  /**
   * CKEditor 4: updateElement()
   * Orijinal textarea'nın değerini günceller (Form submit / e-İmza akışı için kritik).
   */
  updateElement(): void {
    if (this.element instanceof HTMLTextAreaElement) {
      this.element.value = this.getData();
    }
  }

  /**
   * CKEditor 4: focus()
   */
  focus(): void {
    this.editor?.focus();
    this.fire('focus');
  }

  /**
   * CKEditor 4: destroy(noUpdate)
   */
  destroy(noUpdate: boolean = false): void {
    if (this.status === 'destroyed') return;
    if (!noUpdate) {
      this.updateElement();
    }
    this.editor?.destroy();
    this.status = 'destroyed';
    this.fire('destroy');
    this.listeners.clear();

    // Global instances listesinden sil
    const win = window as any;
    if (win.CKEDITOR && win.CKEDITOR.instances) {
      delete win.CKEDITOR.instances[this.name];
      if (win.CKEDITOR.currentInstance === this) {
        win.CKEDITOR.currentInstance = null;
      }
    }
  }

  /**
   * CKEditor 4: checkDirty()
   */
  checkDirty(): boolean {
    return this.isDirtyFlag || this.getData() !== this.initialData;
  }

  /**
   * CKEditor 4: resetDirty()
   */
  resetDirty(): void {
    this.initialData = this.getData();
    this.isDirtyFlag = false;
  }

  /**
   * CKEditor 4: setReadOnly(isReadOnly)
   */
  setReadOnly(isReadOnly: boolean = true): void {
    this.readOnly = isReadOnly;
    if (isReadOnly) {
      this.editor.enableReadOnlyMode();
    } else {
      this.editor.disableReadOnlyMode();
    }
  }

  /**
   * CKEditor 4: getSnapshot()
   */
  getSnapshot(): string {
    return this.getData();
  }

  /**
   * CKEditor 4: loadSnapshot(snapshot)
   */
  loadSnapshot(snapshot: string): void {
    this.setData(snapshot);
  }

  /**
   * CKEditor 4: on(eventName, listener, priority)
   */
  on(eventName: string, listener: Function, _priority?: number): { removeListener: () => void } {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(listener);

    return {
      removeListener: () => this.removeListener(eventName, listener)
    };
  }

  /**
   * CKEditor 4: once(eventName, listener)
   */
  once(eventName: string, listener: Function): void {
    const wrapper = (...args: any[]) => {
      this.removeListener(eventName, wrapper);
      listener.apply(this, args);
    };
    this.on(eventName, wrapper);
  }

  /**
   * CKEditor 4: removeListener(eventName, listener)
   */
  removeListener(eventName: string, listener: Function): void {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName)!.delete(listener);
    }
  }

  /**
   * CKEditor 4: fire(eventName, data)
   */
  fire(eventName: string, data?: any): boolean {
    const list = this.listeners.get(eventName);
    if (list) {
      const evtData: CKEditorEventData = {
        editor: this,
        name: eventName,
        data: data
      };
      list.forEach((cb) => {
        try {
          cb.call(this, evtData);
        } catch (err) {
          console.error(`[CKEditorShim] Error in event '${eventName}':`, err);
        }
      });
    }
    return true;
  }

  /**
   * CKEditor 4: execCommand(cmd, data)
   */
  execCommand(cmd: string, data?: any): boolean {
    const cmdMap: Record<string, string> = {
      bold: 'bold',
      italic: 'italic',
      underline: 'underline',
      strike: 'strikethrough',
      subscript: 'subscript',
      superscript: 'superscript',
      justifyleft: 'justifyLeft',
      justifycenter: 'justifyCenter',
      justifyright: 'justifyRight',
      justifyblock: 'justifyFull',
      undo: 'undo',
      redo: 'redo',
      print: 'print',
      table: 'insertTable',
      indent: 'indent',
      outdent: 'outdent',
      save: 'save'
    };

    const targetCmd = cmdMap[cmd.toLowerCase()] || cmd;
    this.editor.execute(targetCmd, data);
    return true;
  }

  getCommand(name: string): any {
    return {
      state: 1,
      exec: (data?: any) => this.execCommand(name, data)
    };
  }

  addCommand(_name: string, _def: any): void {}

  getSelection(): any {
    return (this.editor as any).selection;
  }

  ui = {
    addButton: () => {},
    add: () => {}
  };
}

/**
 * ============================================================================
 * CKEDITOR GLOBAL NESNESİ
 * ============================================================================
 */
let instanceCounter = 0;
const globalListeners: Map<string, Set<Function>> = new Map();

export const CKEDITOR_SHIM: any = {
  instances: {} as Record<string, CKEditorInstanceShim>,
  currentInstance: null as CKEditorInstanceShim | null,
  status: 'loaded',
  version: '4.22.1',
  revision: '1',
  basePath: '/',
  timestamp: 'N5UC',

  env: {
    isCompatible: true,
    ie: false,
    gecko: false,
    webkit: true,
    mac: false,
    chrome: true,
    version: 120
  },

  ENTER_P: 1,
  ENTER_BR: 2,
  ENTER_DIV: 3,

  config: {
    language: 'tr',
    skin: 'moono-lisa',
    toolbar: 'Full',
    font_defaultLabel: 'Times New Roman',
    fontSize_defaultLabel: '12'
  },

  plugins: {
    add: () => {},
    get: () => null,
    load: () => {}
  },

  stylesSet: {
    add: () => {},
    get: () => []
  },

  dtd: {},
  tools: {
    htmlEncode: (str: string) => str,
    htmlDecode: (str: string) => str
  },
  dom: {},

  getUrl: (resource: string) => resource,

  /**
   * CKEDITOR.replace(elementOrId, config)
   */
  replace: (elementOrId: string | HTMLElement, config?: any): CKEditorInstanceShim => {
    let el: HTMLElement | null = null;
    if (typeof elementOrId === 'string') {
      el = document.getElementById(elementOrId) || document.querySelector<HTMLElement>(elementOrId);
    } else {
      el = elementOrId;
    }

    if (!el) {
      throw new Error(`[CKEDITOR.replace] Eleman bulunamadı: ${elementOrId}`);
    }

    const name = el.id || el.getAttribute('name') || `editor_${++instanceCounter}`;

    // Eğer bu isimle önceden bir instance varsa, önce onu yok et
    if (CKEDITOR_SHIM.instances[name]) {
      try {
        CKEDITOR_SHIM.instances[name].destroy(true);
      } catch (e) {}
    }

    const shim = new CKEditorInstanceShim(el, name, config);
    CKEDITOR_SHIM.instances[name] = shim;
    CKEDITOR_SHIM.currentInstance = shim;

    // Global event: instanceCreated
    CKEDITOR_SHIM.fire('instanceCreated', { editor: shim });

    // Instance event ve global instanceReady event tetikle
    setTimeout(() => {
      shim.fire('instanceReady', { editor: shim });
      CKEDITOR_SHIM.fire('instanceReady', { editor: shim });
    }, 0);

    return shim;
  },

  /**
   * CKEDITOR.appendTo(target, config, data)
   */
  appendTo: (target: string | HTMLElement, config?: any, data?: string): CKEditorInstanceShim => {
    let parent: HTMLElement | null = null;
    if (typeof target === 'string') {
      parent = document.getElementById(target) || document.querySelector<HTMLElement>(target);
    } else {
      parent = target;
    }

    if (!parent) {
      throw new Error(`[CKEDITOR.appendTo] Hedef kapsayıcı bulunamadı: ${target}`);
    }

    const holder = document.createElement('div');
    parent.appendChild(holder);

    const mergedConfig = Object.assign({}, config, data !== undefined ? { initialData: data } : {});
    return CKEDITOR_SHIM.replace(holder, mergedConfig);
  },

  /**
   * CKEDITOR.inline(elementOrId, config)
   */
  inline: (elementOrId: string | HTMLElement, config?: any): CKEditorInstanceShim => {
    return CKEDITOR_SHIM.replace(elementOrId, config);
  },

  /**
   * CKEDITOR.remove(instance)
   */
  remove: (instance: CKEditorInstanceShim | string): void => {
    const name = typeof instance === 'string' ? instance : instance.name;
    const inst = CKEDITOR_SHIM.instances[name];
    if (inst) {
      inst.destroy();
      delete CKEDITOR_SHIM.instances[name];
    }
  },

  /**
   * CKEDITOR.get(name)
   */
  get: (name: string): CKEditorInstanceShim | undefined => {
    return CKEDITOR_SHIM.instances[name];
  },

  /**
   * CKEDITOR.on(eventName, listener)
   */
  on: (eventName: string, listener: Function): { removeListener: () => void } => {
    if (!globalListeners.has(eventName)) {
      globalListeners.set(eventName, new Set());
    }
    globalListeners.get(eventName)!.add(listener);

    return {
      removeListener: () => CKEDITOR_SHIM.removeListener(eventName, listener)
    };
  },

  /**
   * CKEDITOR.removeListener(eventName, listener)
   */
  removeListener: (eventName: string, listener: Function): void => {
    if (globalListeners.has(eventName)) {
      globalListeners.get(eventName)!.delete(listener);
    }
  },

  /**
   * CKEDITOR.fire(eventName, data)
   */
  fire: (eventName: string, data?: any): boolean => {
    const list = globalListeners.get(eventName);
    if (list) {
      const evtData = { name: eventName, data: data };
      list.forEach((cb) => {
        try {
          cb(evtData);
        } catch (err) {
          console.error(`[CKEDITOR.fire] Error in global event '${eventName}':`, err);
        }
      });
    }
    return true;
  }
};

/**
 * ============================================================================
 * JQUERY ADAPTÖRÜ (adapters/jquery.js yerine)
 * ============================================================================
 */
export function registerJQueryAdapter($: any): void {
  if (!$ || !$.fn) return;

  // $.fn.ckeditor
  $.fn.ckeditor = function (callbackOrConfig?: any, config?: any) {
    let callback: Function | undefined;
    let options: any = {};

    if (typeof callbackOrConfig === 'function') {
      callback = callbackOrConfig;
      options = config || {};
    } else if (typeof callbackOrConfig === 'object') {
      options = callbackOrConfig || {};
      if (typeof config === 'function') {
        callback = config;
      }
    }

    return this.each(function (this: HTMLElement) {
      const editor = CKEDITOR_SHIM.replace(this, options);
      if (callback) {
        if (editor.status === 'ready') {
          callback.call(editor, this);
        } else {
          editor.on('instanceReady', () => {
            callback!.call(editor, this);
          });
        }
      }
    });
  };

  // $.fn.ckeditorGet
  $.fn.ckeditorGet = function () {
    const el = this[0];
    if (!el) return undefined;
    const id = el.id || el.getAttribute('name');
    return id ? CKEDITOR_SHIM.instances[id] : undefined;
  };

  // $.valHooks for textarea (Metronic / EBYS form val() erişimi için)
  if ($.valHooks) {
    const origTextareaHook = $.valHooks.textarea;
    $.valHooks.textarea = {
      get: function (elem: HTMLElement) {
        const id = elem.id || elem.getAttribute('name');
        const editor = id ? CKEDITOR_SHIM.instances[id] : null;
        if (editor && editor.status !== 'destroyed') {
          return editor.getData();
        }
        return origTextareaHook?.get ? origTextareaHook.get(elem) : (elem as HTMLTextAreaElement).value;
      },
      set: function (elem: HTMLElement, value: any) {
        const id = elem.id || elem.getAttribute('name');
        const editor = id ? CKEDITOR_SHIM.instances[id] : null;
        if (editor && editor.status !== 'destroyed') {
          editor.setData(value != null ? String(value) : '');
        }
        if (origTextareaHook?.set) {
          return origTextareaHook.set(elem, value);
        } else {
          (elem as HTMLTextAreaElement).value = value != null ? String(value) : '';
          return value;
        }
      }
    };
  }
}

/**
 * ============================================================================
 * GLOBAL TANIMLAR VE AMD / REQUIREJS ENTEGRASYONU
 * ============================================================================
 */
export function initCKEditorShim(): void {
  if (typeof window === 'undefined') return;

  // window.CKEDITOR olarak tanımla
  (window as any).CKEDITOR = CKEDITOR_SHIM;

  // jQuery varsa adaptörü bağla
  if ((window as any).jQuery) {
    registerJQueryAdapter((window as any).jQuery);
  }
  if ((window as any).$ && (window as any).$ !== (window as any).jQuery) {
    registerJQueryAdapter((window as any).$);
  }

  // Olgu EBYS (RequireJS) AMD Entegrasyonu:
  // require(['ckeditor-core']) ve require(['ckeditor']) çağrılarını karşıla
  const def = (window as any).define;
  if (typeof def === 'function' && def.amd) {
    try {
      def('ckeditor-core', [], () => CKEDITOR_SHIM);
    } catch (e) {}

    try {
      def('ckeditor', ['jquery'], ($: any) => {
        const jq = $ || (window as any).jQuery || (window as any).$;
        if (jq) registerJQueryAdapter(jq);
        return jq;
      });
    } catch (e) {}
  }
}

// Otomatik başlat
if (typeof window !== 'undefined') {
  initCKEditorShim();
}
