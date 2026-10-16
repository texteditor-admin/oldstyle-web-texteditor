import './styles/editor.css';
import { ResmiYaziEditor, EditorConfig } from './core/Editor';
import { ModalLauncher, ModalOptions } from './modal/ModalLauncher';
import { CollaborationManager, CollaboratorUser, CollaborationConfig } from './core/Collaboration';
import { ExportPlugin } from './plugins/ExportPlugin';
import { ImportPlugin } from './plugins/ImportPlugin';
import { ImagePlugin } from './plugins/ImagePlugin';
import { SpecialCharsPlugin } from './plugins/SpecialCharsPlugin';
import { TablePlugin } from './plugins/TablePlugin';
import { Ruler } from './ui/Ruler';

import { CKEDITOR_SHIM, CKEditorInstanceShim, initCKEditorShim, registerJQueryAdapter } from './adapters/CKEditorShim';
import { PrintManager } from './utils/PrintManager';

// Brand aliases
const OldStyleWebTextEditor = ResmiYaziEditor;
const OldStyleEditor = ResmiYaziEditor;

export {
  OldStyleWebTextEditor,
  OldStyleEditor,
  ResmiYaziEditor,
  ModalLauncher,
  CollaborationManager,
  ExportPlugin,
  ImportPlugin,
  ImagePlugin,
  SpecialCharsPlugin,
  TablePlugin,
  Ruler,
  PrintManager,
  CKEDITOR_SHIM as CKEDITOR,
  CKEditorInstanceShim,
  initCKEditorShim,
  registerJQueryAdapter
};

export type {
  EditorConfig,
  ModalOptions,
  CollaboratorUser,
  CollaborationConfig
};

// Attach to window for drop-in script tag inclusion (CKEditor & OldStyle drop-in)
if (typeof window !== 'undefined') {
  (window as any).OldStyleWebTextEditor = OldStyleWebTextEditor;
  (window as any).OldStyleEditor = OldStyleEditor;
  (window as any).ResmiYaziEditor = ResmiYaziEditor;
  (window as any).WordEditor = ResmiYaziEditor;
  (window as any).ExportPlugin = ExportPlugin;
  (window as any).ImportPlugin = ImportPlugin;
  (window as any).PrintManager = PrintManager;
  (window as any).CKEDITOR = CKEDITOR_SHIM;
  initCKEditorShim();
}

export default OldStyleWebTextEditor;
