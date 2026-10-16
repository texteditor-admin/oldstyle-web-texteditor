export const Icons: Record<string, string> = {
  // Pano (Clipboard) İkonları
  paste: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="3.5" y="3" width="9" height="11.5" rx="1.2" fill="#d97706" stroke="#92400e" stroke-width="0.8"/>
    <rect x="5.5" y="1.5" width="5" height="2.5" rx="0.8" fill="#fcd34d" stroke="#b45309" stroke-width="0.7"/>
    <rect x="5" y="4.5" width="8" height="9.5" rx="0.5" fill="#ffffff" stroke="#94a3b8" stroke-width="0.6"/>
    <line x1="6.5" y1="7" x2="11" y2="7" stroke="#64748b" stroke-width="0.8"/>
    <line x1="6.5" y1="9" x2="11" y2="9" stroke="#64748b" stroke-width="0.8"/>
    <line x1="6.5" y1="11" x2="9.5" y2="11" stroke="#64748b" stroke-width="0.8"/>
  </svg>`,

  cut: `<svg viewBox="0 0 16 16" width="16" height="16">
    <circle cx="4" cy="4" r="2" fill="none" stroke="#2563eb" stroke-width="1.3"/>
    <circle cx="4" cy="12" r="2" fill="none" stroke="#2563eb" stroke-width="1.3"/>
    <line x1="5.4" y1="5.4" x2="13.5" y2="13.5" stroke="#475569" stroke-width="1.5"/>
    <line x1="5.4" y1="10.6" x2="13.5" y2="2.5" stroke="#475569" stroke-width="1.5"/>
  </svg>`,

  copy: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="5" y="2" width="9" height="11" rx="1" fill="#ffffff" stroke="#475569" stroke-width="1.2"/>
    <rect x="2" y="5" width="9" height="10" rx="1" fill="#f8fafc" stroke="#2563eb" stroke-width="1.2"/>
    <line x1="4.5" y1="8" x2="8.5" y2="8" stroke="#94a3b8" stroke-width="1.1"/>
    <line x1="4.5" y1="10.5" x2="8.5" y2="10.5" stroke="#94a3b8" stroke-width="1.1"/>
  </svg>`,

  formatPainter: `<svg viewBox="0 0 16 16" width="16" height="16">
    <path d="M3 10l5-5 3 3-5 5H3v-3z" fill="#f59e0b" stroke="#78350f" stroke-width="0.8"/>
    <path d="M8 5l2.5-2.5a1.5 1.5 0 0 1 2.1 2.1L10 7z" fill="#3b82f6"/>
    <path d="M11.5 11.5c0 1.2-.8 2-2 2s-2-.8-2-2 1.5-2.5 2-3c.5.5 2 1.8 2 3z" fill="#2563eb"/>
    <rect x="1.5" y="14" width="13" height="2" fill="#dc2626" rx="0.5"/>
  </svg>`,

  undo: `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 6v4h4"/>
    <path d="M14 13a6 6 0 0 0-6-6 6 6 0 0 0-4.5 2L3 10"/>
  </svg>`,

  redo: `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13 6v4h-4"/>
    <path d="M2 13a6 6 0 0 1 6-6 6 6 0 0 1 4.5 2L13 10"/>
  </svg>`,

  // Dosya ve Standart Araçlar (Görseldeki İkonlar)
  save: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2" y="2" width="12" height="12.5" rx="1.2" fill="#1e3a5f" stroke="#0f172a" stroke-width="0.8"/>
    <rect x="4" y="2" width="7" height="4.5" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.6"/>
    <rect x="5.2" y="3" width="1.5" height="2.5" fill="#0f172a"/>
    <rect x="3.5" y="8" width="9" height="5.5" rx="0.5" fill="#ffffff"/>
    <line x1="5" y1="9.5" x2="11" y2="9.5" stroke="#2563eb" stroke-width="0.8"/>
    <line x1="5" y1="11.5" x2="11" y2="11.5" stroke="#2563eb" stroke-width="0.8"/>
  </svg>`,

  print: `<svg viewBox="0 0 16 16" width="16" height="16">
    <path d="M4 4V1.5h8V4" fill="#ffffff" stroke="#334155" stroke-width="0.8"/>
    <rect x="2" y="4" width="12" height="7" rx="1" fill="#e2e8f0" stroke="#334155" stroke-width="0.8"/>
    <rect x="4.5" y="8" width="7" height="6.5" fill="#ffffff" stroke="#334155" stroke-width="0.8"/>
    <line x1="6" y1="10" x2="10" y2="10" stroke="#64748b" stroke-width="0.7"/>
    <line x1="6" y1="12" x2="10" y2="12" stroke="#64748b" stroke-width="0.7"/>
    <circle cx="11.5" cy="6" r="0.8" fill="#16a34a"/>
  </svg>`,

  find: `<svg viewBox="0 0 16 16" width="16" height="16">
    <ellipse cx="4.5" cy="11.5" rx="2.5" ry="3" fill="#1e293b" stroke="#000000" stroke-width="0.5"/>
    <ellipse cx="11.5" cy="11.5" rx="2.5" ry="3" fill="#1e293b" stroke="#000000" stroke-width="0.5"/>
    <path d="M2.5 11L4 3.5h1.5l1 7.5z" fill="#475569"/>
    <path d="M13.5 11L12 3.5h-1.5l-1 7.5z" fill="#475569"/>
    <rect x="5.5" y="4.5" width="5" height="1.8" rx="0.5" fill="#94a3b8"/>
    <circle cx="4.5" cy="11.5" r="1.3" fill="#38bdf8"/>
    <circle cx="11.5" cy="11.5" r="1.3" fill="#38bdf8"/>
  </svg>`,

  replace: `<svg viewBox="0 0 16 16" width="16" height="16">
    <ellipse cx="3.8" cy="9.5" rx="2" ry="2.4" fill="#1e293b"/>
    <ellipse cx="9.2" cy="9.5" rx="2" ry="2.4" fill="#1e293b"/>
    <circle cx="3.8" cy="9.5" r="1" fill="#38bdf8"/>
    <circle cx="9.2" cy="9.5" r="1" fill="#38bdf8"/>
    <path d="M2.2 9L3.5 3h1.2l0.8 6z" fill="#475569"/>
    <path d="M10.8 9L9.5 3H8.3l-0.8 6z" fill="#475569"/>
    <rect x="4.5" y="4" width="4" height="1.4" fill="#94a3b8"/>
    <text x="11.2" y="14" font-family="Arial, sans-serif" font-size="6.5" font-weight="900" fill="#dc2626">B</text>
    <path d="M11 7l3.5 3.5" stroke="#2563eb" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`,

  link: `<svg viewBox="0 0 16 16" width="16" height="16">
    <circle cx="6.5" cy="7.5" r="4.5" fill="#38bdf8" stroke="#0284c7" stroke-width="0.8"/>
    <ellipse cx="6.5" cy="7.5" rx="2" ry="4.5" fill="none" stroke="#ffffff" stroke-width="0.6"/>
    <line x1="2" y1="7.5" x2="11" y2="7.5" stroke="#ffffff" stroke-width="0.6"/>
    <path d="M9 11l2.5-2.5a1.8 1.8 0 0 1 2.5 2.5L12 13" fill="none" stroke="#d97706" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M11 9l-2.5 2.5a1.8 1.8 0 0 1-2.5-2.5L8 7" fill="none" stroke="#d97706" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`,

  pilcrow: `<svg viewBox="0 0 16 16" width="16" height="16">
    <path d="M10 2H6a3 3 0 0 0 0 6h2v6h1.5V3.5h1V14H12V3.5h1V2h-3z" fill="#1e293b"/>
  </svg>`,

  // Kenarlık İkonları (6 Adet Çerçeve İkonu)
  borderBottom: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="1.5 1.5"/>
    <line x1="2" y1="13.5" x2="14" y2="13.5" stroke="#0f172a" stroke-width="2"/>
  </svg>`,

  borderTop: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="1.5 1.5"/>
    <line x1="2" y1="2.5" x2="14" y2="2.5" stroke="#0f172a" stroke-width="2"/>
  </svg>`,

  borderLeft: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="1.5 1.5"/>
    <line x1="2.5" y1="2" x2="2.5" y2="14" stroke="#0f172a" stroke-width="2"/>
  </svg>`,

  borderRight: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="1.5 1.5"/>
    <line x1="13.5" y1="2" x2="13.5" y2="14" stroke="#0f172a" stroke-width="2"/>
  </svg>`,

  borderNone: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="1.5 1.5"/>
  </svg>`,

  borderAll: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="#0f172a" stroke-width="1.8"/>
    <line x1="2.5" y1="8" x2="13.5" y2="8" stroke="#0f172a" stroke-width="1"/>
    <line x1="8" y1="2.5" x2="8" y2="13.5" stroke="#0f172a" stroke-width="1"/>
  </svg>`,

  // Tablo Yönetim İkonları (Tablo Araçları)
  colLeft: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="6" y="2" width="8" height="12" fill="none" stroke="#475569" stroke-width="1"/>
    <line x1="10" y1="2" x2="10" y2="14" stroke="#475569" stroke-width="0.8"/>
    <path d="M4 8H1M2.5 6L1 8l1.5 2" fill="none" stroke="#2563eb" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`,

  colRight: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2" y="2" width="8" height="12" fill="none" stroke="#475569" stroke-width="1"/>
    <line x1="6" y1="2" x2="6" y2="14" stroke="#475569" stroke-width="0.8"/>
    <path d="M12 8h3M13.5 6L15 8l-1.5 2" fill="none" stroke="#2563eb" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`,

  rowAbove: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2" y="6" width="12" height="8" fill="none" stroke="#475569" stroke-width="1"/>
    <line x1="2" y1="10" x2="14" y2="10" stroke="#475569" stroke-width="0.8"/>
    <path d="M8 4V1M6 2.5L8 1l2 1.5" fill="none" stroke="#2563eb" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`,

  rowBelow: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2" y="2" width="12" height="8" fill="none" stroke="#475569" stroke-width="1"/>
    <line x1="2" y1="6" x2="14" y2="6" stroke="#475569" stroke-width="0.8"/>
    <path d="M8 12v3M6 13.5L8 15l2-1.5" fill="none" stroke="#2563eb" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`,

  deleteCol: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2" y="3" width="12" height="10" fill="none" stroke="#64748b" stroke-width="1"/>
    <line x1="6" y1="3" x2="6" y2="13" stroke="#64748b" stroke-width="0.8"/>
    <line x1="10" y1="3" x2="10" y2="13" stroke="#64748b" stroke-width="0.8"/>
    <path d="M7 6l4 4M11 6l-4 4" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  deleteRow: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="3" y="2" width="10" height="12" fill="none" stroke="#64748b" stroke-width="1"/>
    <line x1="3" y1="6" x2="13" y2="6" stroke="#64748b" stroke-width="0.8"/>
    <line x1="3" y1="10" x2="13" y2="10" stroke="#64748b" stroke-width="0.8"/>
    <path d="M6 7l4 4M10 7l-4 4" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  mergeCells: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2" y="3" width="12" height="10" fill="none" stroke="#475569" stroke-width="1"/>
    <path d="M4 8h3M6 6l1.5 2L6 10" fill="none" stroke="#2563eb" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M12 8H9M10 6l-1.5 2 1.5 2" fill="none" stroke="#2563eb" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`,

  splitCell: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2" y="3" width="12" height="10" fill="none" stroke="#475569" stroke-width="1"/>
    <line x1="8" y1="3" x2="8" y2="13" stroke="#2563eb" stroke-width="1.2" stroke-dasharray="2 1"/>
    <path d="M6 8H4M5 6.5L3.5 8 5 9.5" fill="none" stroke="#2563eb" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M10 8h2M11 6.5l1.5 1.5-1.5 1.5" fill="none" stroke="#2563eb" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`,

  deleteTable: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2" y="2" width="12" height="12" fill="none" stroke="#475569" stroke-width="1.2"/>
    <line x1="2" y1="6" x2="14" y2="6" stroke="#475569" stroke-width="0.8"/>
    <line x1="2" y1="10" x2="14" y2="10" stroke="#475569" stroke-width="0.8"/>
    <line x1="8" y1="2" x2="8" y2="14" stroke="#475569" stroke-width="0.8"/>
    <circle cx="12" cy="12" r="3.5" fill="#ffffff" stroke="#dc2626" stroke-width="1"/>
    <path d="M10.8 10.8l2.4 2.4M13.2 10.8l-2.4 2.4" stroke="#dc2626" stroke-width="1" stroke-linecap="round"/>
  </svg>`,

  tableProperties: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2" y="2" width="12" height="12" fill="none" stroke="#475569" stroke-width="1.2"/>
    <line x1="2" y1="6" x2="14" y2="6" stroke="#475569" stroke-width="0.8"/>
    <line x1="7" y1="2" x2="7" y2="14" stroke="#475569" stroke-width="0.8"/>
    <circle cx="12" cy="12" r="2.8" fill="#f8fafc" stroke="#2563eb" stroke-width="1"/>
  </svg>`,

  // Yazı Tipi İkonları (Word / EBYS Standardı)
  bold: `<svg viewBox="0 0 16 16" width="16" height="16">
    <text x="3.5" y="13" font-family="'Times New Roman', serif" font-size="14.5" font-weight="bold" fill="currentColor">B</text>
  </svg>`,

  italic: `<svg viewBox="0 0 16 16" width="16" height="16">
    <text x="4.5" y="13" font-family="'Times New Roman', serif" font-size="14.5" font-style="italic" font-weight="bold" fill="currentColor">I</text>
  </svg>`,

  underline: `<svg viewBox="0 0 16 16" width="16" height="16">
    <text x="3" y="11.5" font-family="'Times New Roman', serif" font-size="13" font-weight="bold" fill="currentColor">U</text>
    <line x1="2.5" y1="13.5" x2="13.5" y2="13.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,

  strikethrough: `<svg viewBox="0 0 16 16" width="16" height="16">
    <text x="3.5" y="12.5" font-family="'Times New Roman', serif" font-size="13.5" font-weight="bold" fill="currentColor">S</text>
    <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="currentColor" stroke-width="1.8"/>
  </svg>`,

  overline: `<svg viewBox="0 0 16 16" width="16" height="16">
    <line x1="3" y1="2.5" x2="13" y2="2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <text x="3.5" y="13.5" font-family="'Times New Roman', serif" font-size="13" font-weight="bold" fill="currentColor">O</text>
  </svg>`,

  subscript: `<svg viewBox="0 0 16 16" width="16" height="16">
    <text x="1" y="11" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="currentColor">x</text>
    <text x="8.5" y="14.5" font-family="Arial, sans-serif" font-size="8.5" font-weight="bold" fill="currentColor">2</text>
  </svg>`,

  superscript: `<svg viewBox="0 0 16 16" width="16" height="16">
    <text x="1" y="13.5" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="currentColor">x</text>
    <text x="8.5" y="7.5" font-family="Arial, sans-serif" font-size="8.5" font-weight="bold" fill="currentColor">2</text>
  </svg>`,

  caseChange: `<svg viewBox="0 0 16 16" width="16" height="16">
    <text x="1" y="12" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="currentColor">Aa</text>
  </svg>`,

  fontSizeIncrease: `<svg viewBox="0 0 16 16" width="16" height="16">
    <text x="1" y="13.5" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="currentColor">A</text>
    <path d="M10.5 7.5L13 3.5L15.5 7.5h-1.3v3.5h-1.4V7.5H10.5z" fill="#2563eb"/>
  </svg>`,

  fontSizeDecrease: `<svg viewBox="0 0 16 16" width="16" height="16">
    <text x="1" y="13" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="currentColor">A</text>
    <path d="M10.5 6.5L13 10.5L15.5 6.5h-1.3V3h-1.4v3.5H10.5z" fill="#2563eb"/>
  </svg>`,

  removeFormat: `<svg viewBox="0 0 16 16" width="16" height="16">
    <text x="0.5" y="12.5" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="currentColor">A</text>
    <path d="M8 12l2.8-4.2 4.2 2.8-2.8 4.2H8z" fill="#f43f5e" stroke="#881337" stroke-width="0.8"/>
    <path d="M12.2 10.6l-2.8 4.2H8l1.6-2.6 2.6-1.6z" fill="#cbd5e1"/>
  </svg>`,

  highlight: `<svg viewBox="0 0 18 18" width="16" height="16">
    <path d="M4 11l6-6 3 3-6 6H4v-3z" fill="#f59e0b" stroke="#78350f" stroke-width="0.8"/>
    <path d="M9 4l2-2a1.2 1.2 0 0 1 1.7 1.7L11 5.5z" fill="#3b82f6"/>
    <path d="M3.5 12.5l2 2-2 1z" fill="#94a3b8"/>
    <rect x="1.5" y="15" width="15" height="2.5" rx="0.5" fill="#ef4444"/>
  </svg>`,

  fontColor: `<svg viewBox="0 0 18 18" width="16" height="16">
    <text x="3.5" y="12.5" font-family="'Times New Roman', serif" font-size="13.5" font-weight="900" fill="#1e293b">A</text>
    <rect x="2" y="14.5" width="14" height="2.8" rx="0.5" fill="#ef4444"/>
  </svg>`,

  // Paragraf İkonları (Word Standardı)
  bulletList: `<svg viewBox="0 0 16 16" width="16" height="16">
    <circle cx="2.5" cy="4" r="1.4" fill="#2563eb"/>
    <line x1="6" y1="4" x2="15" y2="4" stroke="#334155" stroke-width="1.6"/>
    <circle cx="2.5" cy="8" r="1.4" fill="#2563eb"/>
    <line x1="6" y1="8" x2="15" y2="8" stroke="#334155" stroke-width="1.6"/>
    <circle cx="2.5" cy="12" r="1.4" fill="#2563eb"/>
    <line x1="6" y1="12" x2="15" y2="12" stroke="#334155" stroke-width="1.6"/>
  </svg>`,

  numberedList: `<svg viewBox="0 0 16 16" width="16" height="16">
    <text x="0.8" y="5.5" font-family="Arial, sans-serif" font-size="5.5" font-weight="bold" fill="#2563eb">1.</text>
    <line x1="6.5" y1="4" x2="15" y2="4" stroke="#334155" stroke-width="1.6"/>
    <text x="0.8" y="9.5" font-family="Arial, sans-serif" font-size="5.5" font-weight="bold" fill="#2563eb">2.</text>
    <line x1="6.5" y1="8" x2="15" y2="8" stroke="#334155" stroke-width="1.6"/>
    <text x="0.8" y="13.5" font-family="Arial, sans-serif" font-size="5.5" font-weight="bold" fill="#2563eb">3.</text>
    <line x1="6.5" y1="12" x2="15" y2="12" stroke="#334155" stroke-width="1.6"/>
  </svg>`,

  checkList: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="1" y="2" width="4" height="4" rx="0.5" fill="none" stroke="#2563eb" stroke-width="1.2"/>
    <line x1="7" y1="4" x2="15" y2="4" stroke="#334155" stroke-width="1.5"/>
    <rect x="1" y="7" width="4" height="4" rx="0.5" fill="none" stroke="#2563eb" stroke-width="1.2"/>
    <path d="M1.8 9l1 1 2-2" stroke="#2563eb" stroke-width="1.2" fill="none"/>
    <line x1="7" y1="9" x2="15" y2="9" stroke="#334155" stroke-width="1.5"/>
    <rect x="1" y="12" width="4" height="4" rx="0.5" fill="none" stroke="#2563eb" stroke-width="1.2"/>
    <line x1="7" y1="14" x2="15" y2="14" stroke="#334155" stroke-width="1.5"/>
  </svg>`,

  outdent: `<svg viewBox="0 0 16 16" width="16" height="16">
    <path d="M5.5 8l3-3v2.2h5.5v1.6H8.5V11z" fill="#2563eb"/>
    <line x1="2" y1="3" x2="2" y2="13" stroke="#475569" stroke-width="1.8"/>
    <line x1="5.5" y1="3" x2="14" y2="3" stroke="#64748b" stroke-width="1.4"/>
    <line x1="5.5" y1="13" x2="14" y2="13" stroke="#64748b" stroke-width="1.4"/>
  </svg>`,

  indent: `<svg viewBox="0 0 16 16" width="16" height="16">
    <path d="M11.5 8l-3-3v2.2H3v1.6h5.5V11z" fill="#2563eb"/>
    <line x1="14" y1="3" x2="14" y2="13" stroke="#475569" stroke-width="1.8"/>
    <line x1="2" y1="3" x2="10.5" y2="3" stroke="#64748b" stroke-width="1.4"/>
    <line x1="2" y1="13" x2="10.5" y2="13" stroke="#64748b" stroke-width="1.4"/>
  </svg>`,

  alignLeft: `<svg viewBox="0 0 16 16" width="16" height="16">
    <line x1="2" y1="3.5" x2="14" y2="3.5" stroke="#1e293b" stroke-width="1.8"/>
    <line x1="2" y1="6.8" x2="10" y2="6.8" stroke="#1e293b" stroke-width="1.8"/>
    <line x1="2" y1="10.1" x2="14" y2="10.1" stroke="#1e293b" stroke-width="1.8"/>
    <line x1="2" y1="13.4" x2="8" y2="13.4" stroke="#1e293b" stroke-width="1.8"/>
  </svg>`,

  alignCenter: `<svg viewBox="0 0 16 16" width="16" height="16">
    <line x1="2" y1="3.5" x2="14" y2="3.5" stroke="#1e293b" stroke-width="1.8"/>
    <line x1="4.5" y1="6.8" x2="11.5" y2="6.8" stroke="#1e293b" stroke-width="1.8"/>
    <line x1="2" y1="10.1" x2="14" y2="10.1" stroke="#1e293b" stroke-width="1.8"/>
    <line x1="5.5" y1="13.4" x2="10.5" y2="13.4" stroke="#1e293b" stroke-width="1.8"/>
  </svg>`,

  alignRight: `<svg viewBox="0 0 16 16" width="16" height="16">
    <line x1="2" y1="3.5" x2="14" y2="3.5" stroke="#1e293b" stroke-width="1.8"/>
    <line x1="6" y1="6.8" x2="14" y2="6.8" stroke="#1e293b" stroke-width="1.8"/>
    <line x1="2" y1="10.1" x2="14" y2="10.1" stroke="#1e293b" stroke-width="1.8"/>
    <line x1="8" y1="13.4" x2="14" y2="13.4" stroke="#1e293b" stroke-width="1.8"/>
  </svg>`,

  alignJustify: `<svg viewBox="0 0 16 16" width="16" height="16">
    <line x1="2" y1="3.5" x2="14" y2="3.5" stroke="#1e293b" stroke-width="1.8"/>
    <line x1="2" y1="6.8" x2="14" y2="6.8" stroke="#1e293b" stroke-width="1.8"/>
    <line x1="2" y1="10.1" x2="14" y2="10.1" stroke="#1e293b" stroke-width="1.8"/>
    <line x1="2" y1="13.4" x2="14" y2="13.4" stroke="#1e293b" stroke-width="1.8"/>
  </svg>`,

  lineSpacing: `<svg viewBox="0 0 16 16" width="16" height="16">
    <path d="M2.5 5.5L4.5 3L6.5 5.5h-1.2v5h1.2L4.5 13L2.5 10.5h1.2v-5H2.5z" fill="#2563eb"/>
    <line x1="8" y1="4.5" x2="15" y2="4.5" stroke="#1e293b" stroke-width="1.6"/>
    <line x1="8" y1="8" x2="15" y2="8" stroke="#1e293b" stroke-width="1.6"/>
    <line x1="8" y1="11.5" x2="15" y2="11.5" stroke="#1e293b" stroke-width="1.6"/>
  </svg>`,

  table: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2" y="2" width="12" height="12" fill="#f8fafc" stroke="#1e293b" stroke-width="1.4"/>
    <line x1="2" y1="8" x2="14" y2="8" stroke="#1e293b" stroke-width="1.2"/>
    <line x1="8" y1="2" x2="8" y2="14" stroke="#1e293b" stroke-width="1.2"/>
  </svg>`,

  image: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="1.5" y="2" width="13" height="12" rx="1.5" fill="#f8fafc" stroke="#2563eb" stroke-width="1.2"/>
    <circle cx="5" cy="5.5" r="1.3" fill="#eab308"/>
    <path d="M2 13l4-4 2.5 2.5 3.5-4 2 2.5V13z" fill="#3b82f6"/>
  </svg>`,

  specialChars: `<svg viewBox="0 0 16 16" width="16" height="16">
    <text x="3.5" y="13.5" font-family="'Times New Roman', serif" font-size="16" font-weight="bold" fill="#2563eb">§</text>
  </svg>`,

  pageBreak: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2" y="1.5" width="12" height="5" fill="#e2e8f0" stroke="#64748b" stroke-width="1"/>
    <rect x="2" y="9.5" width="12" height="5" fill="#e2e8f0" stroke="#64748b" stroke-width="1"/>
    <line x1="1" y1="8" x2="15" y2="8" stroke="#2563eb" stroke-dasharray="2 2" stroke-width="1.5"/>
  </svg>`,

  horizontalLine: `<svg viewBox="0 0 16 16" width="16" height="16">
    <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="#2563eb" stroke-width="2"/>
    <line x1="4" y1="4" x2="12" y2="4" stroke="#94a3b8" stroke-width="1"/>
    <line x1="4" y1="12" x2="12" y2="12" stroke="#94a3b8" stroke-width="1"/>
  </svg>`,

  exportDoc: `<svg viewBox="0 0 16 16" width="16" height="16">
    <path d="M2 2h8l4 4v8H2z" fill="#2563eb"/>
    <path d="M10 2v4h4" fill="#60a5fa"/>
    <text x="3.8" y="12" font-family="Arial, sans-serif" font-size="7.5" font-weight="900" fill="#ffffff">W</text>
  </svg>`,

  importDoc: `<svg viewBox="0 0 16 16" width="16" height="16">
    <path d="M2 2h7l4 4v8H2z" fill="#ffffff" stroke="#2563eb" stroke-width="1.2"/>
    <path d="M9 2v4h4" fill="#dbeafe"/>
    <path d="M8 8v4M6 10l2 2 2-2" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`,

  findReplace: `<svg viewBox="0 0 16 16" width="16" height="16">
    <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="#2563eb" stroke-width="1.5"/>
    <line x1="10" y1="10" x2="14.5" y2="14.5" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,

  sourceEditing: `<svg viewBox="0 0 16 16" width="16" height="16">
    <path d="M5 4L2 8l3 4M11 4l3 4-3 4M9 2.5l-2 11" fill="none" stroke="#334155" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`,

  dialogLauncher: `<svg viewBox="0 0 10 10" width="8" height="8" fill="none" stroke="#64748b" stroke-width="1.2">
    <rect x="1" y="1" width="7" height="7" rx="0.5"/>
    <path d="M4 6h2V4"/>
    <path d="M6 6L2.5 2.5"/>
  </svg>`,

  chevronDown: `<svg viewBox="0 0 10 10" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 3.5l3 3 3-3"/>
  </svg>`,

  users: `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M11 14v-1.5a3 3 0 0 0-3-3H4a3 3 0 0 0-3 3V14"/>
    <circle cx="6" cy="4.5" r="2.5"/>
    <path d="M15 14v-1.2a2.5 2.5 0 0 0-2-2.4"/>
    <path d="M11 2.2a2.5 2.5 0 0 1 0 4.6"/>
  </svg>`,

  // Görünüm İkonları (Thumbnails, Üstbilgi, Altbilgi)
  thumbnails: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="1.5" y="2" width="4.5" height="5.5" rx="0.8" fill="#ffffff" stroke="#2563eb" stroke-width="1"/>
    <rect x="1.5" y="8.5" width="4.5" height="5.5" rx="0.8" fill="#ffffff" stroke="#64748b" stroke-width="1"/>
    <rect x="8" y="2" width="6.5" height="12" rx="0.8" fill="#f8fafc" stroke="#334155" stroke-width="1"/>
    <line x1="9.5" y1="4.5" x2="13" y2="4.5" stroke="#94a3b8" stroke-width="0.8"/>
    <line x1="9.5" y1="6.5" x2="13" y2="6.5" stroke="#94a3b8" stroke-width="0.8"/>
    <line x1="9.5" y1="8.5" x2="12" y2="8.5" stroke="#94a3b8" stroke-width="0.8"/>
  </svg>`,

  header: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2" y="2" width="12" height="12" rx="1" fill="#ffffff" stroke="#64748b" stroke-width="1"/>
    <rect x="2" y="2" width="12" height="3.5" fill="#3b82f6" opacity="0.25"/>
    <line x1="2" y1="5.5" x2="14" y2="5.5" stroke="#2563eb" stroke-width="1" stroke-dasharray="2 1"/>
    <line x1="4" y1="3.8" x2="10" y2="3.8" stroke="#1e40af" stroke-width="1"/>
  </svg>`,

  footer: `<svg viewBox="0 0 16 16" width="16" height="16">
    <rect x="2" y="2" width="12" height="12" rx="1" fill="#ffffff" stroke="#64748b" stroke-width="1"/>
    <rect x="2" y="10.5" width="12" height="3.5" fill="#3b82f6" opacity="0.25"/>
    <line x1="2" y1="10.5" x2="14" y2="10.5" stroke="#2563eb" stroke-width="1" stroke-dasharray="2 1"/>
    <line x1="4" y1="12.2" x2="10" y2="12.2" stroke="#1e40af" stroke-width="1"/>
  </svg>`
};
