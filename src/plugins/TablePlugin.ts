import { CommandContext } from '../core/Commands';

export class TablePlugin {
  private ctx: CommandContext;
  private tableHandle: HTMLElement | null = null;
  private activeTable: HTMLTableElement | null = null;
  private resizeState: {
    mode: 'col' | 'row' | null;
    table: HTMLTableElement | null;
    cell: HTMLTableCellElement | null;
    row: HTMLTableRowElement | null;
    colIndex: number;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null = null;

  constructor(ctx: CommandContext) {
    this.ctx = ctx;
    this.setupTableInteractions();
  }

  createTablePicker(onSelect: (rows: number, cols: number, borderless?: boolean) => void): HTMLElement {
    const container = document.createElement('div');
    container.className = 'rye-table-picker';
    container.style.padding = '8px';
    container.style.userSelect = 'none';

    const infoLabel = document.createElement('div');
    infoLabel.className = 'rye-table-picker-label';
    infoLabel.style.fontSize = '12px';
    infoLabel.style.fontWeight = '600';
    infoLabel.style.color = '#1e293b';
    infoLabel.style.marginBottom = '6px';
    infoLabel.style.textAlign = 'center';
    infoLabel.innerText = 'Tablo Boyutu Seçin (1 x 1)';
    container.appendChild(infoLabel);

    const grid = document.createElement('div');
    grid.className = 'rye-table-grid';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(8, 18px)';
    grid.style.gridTemplateRows = 'repeat(8, 18px)';
    grid.style.gap = '3px';

    const cells: HTMLElement[][] = [];

    for (let r = 0; r < 8; r++) {
      cells[r] = [];
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('div');
        cell.className = 'rye-grid-cell';
        cell.style.width = '18px';
        cell.style.height = '18px';
        cell.style.border = '1px solid #cbd5e1';
        cell.style.borderRadius = '2px';
        cell.style.backgroundColor = '#ffffff';
        cell.style.cursor = 'pointer';

        cell.onmouseenter = () => {
          this.highlightCells(cells, r + 1, c + 1);
          infoLabel.innerText = `${r + 1} x ${c + 1} Tablo`;
        };

        cell.onclick = () => {
          // Varsayılan olarak resmi yazışmaya uygun kenarlıksız saf tablo
          onSelect(r + 1, c + 1, true);
        };

        cells[r][c] = cell;
        grid.appendChild(cell);
      }
    }

    container.appendChild(grid);

    // Serbest / Özel Tablo Ekleme Bölümü
    const customSection = document.createElement('div');
    customSection.className = 'rye-custom-table-picker-section';
    customSection.style.marginTop = '10px';
    customSection.style.paddingTop = '8px';
    customSection.style.borderTop = '1px solid #e2e8f0';

    customSection.innerHTML = `
      <div style="font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">
        Serbest Tablo Ekle
      </div>
      <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 8px;">
        <label style="font-size: 11px; color: #334155; display: flex; align-items: center; gap: 2px;">
          Satır: <input type="number" class="rye-custom-rows" value="3" min="1" max="100" style="width: 44px; padding: 2px 4px; font-size: 11px; border: 1px solid #cbd5e1; border-radius: 4px;">
        </label>
        <label style="font-size: 11px; color: #334155; display: flex; align-items: center; gap: 2px;">
          Sütun: <input type="number" class="rye-custom-cols" value="3" min="1" max="50" style="width: 44px; padding: 2px 4px; font-size: 11px; border: 1px solid #cbd5e1; border-radius: 4px;">
        </label>
      </div>
      <div style="margin-bottom: 8px;">
        <label style="font-size: 11px; color: #334155; display: flex; align-items: center; gap: 4px; cursor: pointer;">
          <input type="checkbox" class="rye-custom-borderless" checked>
          <span>Kenarlıksız (Resmi Yazı)</span>
        </label>
      </div>
      <button type="button" class="rye-btn-insert-custom" style="width: 100%; padding: 5px; background: #2563eb; color: #ffffff; border: none; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;">
        ➕ Özel Tablo Ekle
      </button>
    `;

    const insertCustomBtn = customSection.querySelector('.rye-btn-insert-custom') as HTMLButtonElement;
    const rowsInput = customSection.querySelector('.rye-custom-rows') as HTMLInputElement;
    const colsInput = customSection.querySelector('.rye-custom-cols') as HTMLInputElement;
    const borderlessInput = customSection.querySelector('.rye-custom-borderless') as HTMLInputElement;

    insertCustomBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const r = Math.max(1, parseInt(rowsInput.value, 10) || 3);
      const c = Math.max(1, parseInt(colsInput.value, 10) || 3);
      const isBorderless = borderlessInput.checked;
      onSelect(r, c, isBorderless);
    });

    container.appendChild(customSection);
    return container;
  }

  private highlightCells(cells: HTMLElement[][], rows: number, cols: number): void {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = cells[r][c];
        if (r < rows && c < cols) {
          cell.style.backgroundColor = '#bfdbfe';
          cell.style.borderColor = '#2563eb';
        } else {
          cell.style.backgroundColor = '#ffffff';
          cell.style.borderColor = '#cbd5e1';
        }
      }
    }
  }

  /**
   * Saf, başlıksız ve kenarlıksız (veya kenarlıklı) tablo ekler.
   * Hücreler temizdir ("Başlık" veya "Hücre" yazısı içermez).
   */
  insertTable(rows: number, cols: number, borderless: boolean = true): void {
    this.ctx.editable.focus();
    this.ctx.selection.restore();

    const table = document.createElement('table');
    table.className = borderless ? 'rye-table rye-table-borderless' : 'rye-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    // Başlık (thead / th) OLMADAN, saf tbody ile ekle
    const tbody = document.createElement('tbody');
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < cols; c++) {
        const td = document.createElement('td');
        // Temiz boş hücre - kullanıcı doğrudan yazmaya başlayabilir
        td.innerHTML = '<p><br></p>';
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    const nextP = document.createElement('p');
    nextP.innerHTML = '<br>';

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(table);
      table.after(nextP);
    } else {
      this.ctx.editable.appendChild(table);
      this.ctx.editable.appendChild(nextP);
    }

    // İlk hücreye odaklan
    const firstTd = table.querySelector('td');
    if (firstTd) {
      const range = document.createRange();
      range.selectNodeContents(firstTd);
      range.collapse(true);
      const s = window.getSelection();
      s?.removeAllRanges();
      s?.addRange(range);
    }

    this.ctx.history.record(true);
  }

  /**
   * Serbest / Özel Tablo Ekleme Modal Penceresi
   */
  promptCustomTable(): void {
    const overlay = document.createElement('div');
    overlay.className = 'rye-modal-overlay rye-custom-table-modal';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.45)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '10000';

    const dialog = document.createElement('div');
    dialog.className = 'rye-modal-dialog';
    dialog.style.background = '#ffffff';
    dialog.style.borderRadius = '8px';
    dialog.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)';
    dialog.style.padding = '20px 24px';
    dialog.style.width = '320px';

    dialog.innerHTML = `
      <h3 style="margin: 0 0 14px 0; font-size: 16px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
        <span>📊</span> Serbest Tablo Ekle
      </h3>
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 13px; font-weight: 500; color: #475569; margin-bottom: 4px;">
          Satır Sayısı:
        </label>
        <input type="number" id="ryeModalTableRows" min="1" max="100" value="4" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
      </div>
      <div style="margin-bottom: 14px;">
        <label style="display: block; font-size: 13px; font-weight: 500; color: #475569; margin-bottom: 4px;">
          Sütun Sayısı:
        </label>
        <input type="number" id="ryeModalTableCols" min="1" max="50" value="3" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #334155; cursor: pointer;">
          <input type="checkbox" id="ryeModalTableBorderless" checked>
          <span>Kenarlıksız (Resmi Yazı Formatı)</span>
        </label>
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <button type="button" id="ryeModalTableCancel" style="padding: 7px 14px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; font-size: 13px; cursor: pointer;">
          İptal
        </button>
        <button type="button" id="ryeModalTableSubmit" style="padding: 7px 14px; border: none; background: #2563eb; color: #ffffff; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">
          Tablo Ekle
        </button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const rowsInput = dialog.querySelector('#ryeModalTableRows') as HTMLInputElement;
    const colsInput = dialog.querySelector('#ryeModalTableCols') as HTMLInputElement;
    const borderlessInput = dialog.querySelector('#ryeModalTableBorderless') as HTMLInputElement;
    const cancelBtn = dialog.querySelector('#ryeModalTableCancel') as HTMLButtonElement;
    const submitBtn = dialog.querySelector('#ryeModalTableSubmit') as HTMLButtonElement;

    rowsInput.focus();

    const closeModal = () => {
      overlay.remove();
    };

    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    submitBtn.addEventListener('click', () => {
      const rows = Math.max(1, parseInt(rowsInput.value, 10) || 3);
      const cols = Math.max(1, parseInt(colsInput.value, 10) || 3);
      const isBorderless = borderlessInput.checked;
      closeModal();
      this.insertTable(rows, cols, isBorderless);
    });
  }

  /**
   * Tablo kenarlıklarını açıp kapatır (Kenarlıksız <-> Kenarlıklı)
   */
  toggleBorders(targetTable?: HTMLTableElement): void {
    const table = targetTable || this.activeTable || this.ctx.editable.querySelector('table.is-selected') as HTMLTableElement;
    if (!table) return;

    if (table.classList.contains('rye-table-borderless')) {
      table.classList.remove('rye-table-borderless');
    } else {
      table.classList.add('rye-table-borderless');
    }
    this.ctx.history.record(true);
  }

  /**
   * Tablo etkileşimlerini (Tut-Sil kolu, fare ile sütun/satır yeniden boyutlandırma) kurar.
   */
  private setupTableInteractions(): void {
    const editable = this.ctx.editable;

    // 1. Tablo Seçim & Silme Kolu (Floating Handle)
    this.tableHandle = document.createElement('div');
    this.tableHandle.className = 'rye-table-handle';
    this.tableHandle.style.position = 'absolute';
    this.tableHandle.style.display = 'none';
    this.tableHandle.style.zIndex = '150';
    this.tableHandle.style.background = '#ffffff';
    this.tableHandle.style.border = '1px solid #94a3b8';
    this.tableHandle.style.borderRadius = '6px';
    this.tableHandle.style.boxShadow = '0 3px 10px rgba(0,0,0,0.18)';
    this.tableHandle.style.padding = '3px 5px';
    this.tableHandle.style.gap = '4px';
    this.tableHandle.style.alignItems = 'center';
    this.tableHandle.style.userSelect = 'none';

    this.tableHandle.innerHTML = `
      <button type="button" class="rye-handle-btn rye-handle-select" title="Tabloyu Seç (Tutup Silmek İçin)" style="cursor: move; padding: 2px 4px; border: none; background: #eff6ff; color: #1e40af; border-radius: 4px; font-size: 11px; font-weight: bold;">
        ✥ Seç
      </button>
      <button type="button" class="rye-handle-btn rye-handle-border" title="Kenarlık Aç / Kapat (Kenarlıksız & Kenarlıklı)" style="cursor: pointer; padding: 2px 4px; border: 1px solid #cbd5e1; background: #ffffff; border-radius: 4px; font-size: 11px;">
        ⊞ Kenarlık
      </button>
      <button type="button" class="rye-handle-btn rye-handle-add-row" title="Alta Satır Ekle" style="cursor: pointer; padding: 2px 4px; border: 1px solid #cbd5e1; background: #ffffff; border-radius: 4px; font-size: 11px;">
        ⬇️ +Satır
      </button>
      <button type="button" class="rye-handle-btn rye-handle-add-col" title="Sağa Sütun Ekle" style="cursor: pointer; padding: 2px 4px; border: 1px solid #cbd5e1; background: #ffffff; border-radius: 4px; font-size: 11px;">
        ➡️ +Sütun
      </button>
      <button type="button" class="rye-handle-btn rye-handle-delete" title="Tabloyu Sil (Delete / Backspace)" style="cursor: pointer; padding: 2px 5px; border: none; background: #fee2e2; color: #dc2626; border-radius: 4px; font-size: 11px; font-weight: 600;">
        🗑️ Sil
      </button>
    `;

    editable.parentElement?.appendChild(this.tableHandle);

    const selectBtn = this.tableHandle.querySelector('.rye-handle-select') as HTMLButtonElement;
    const borderBtn = this.tableHandle.querySelector('.rye-handle-border') as HTMLButtonElement;
    const addRowBtn = this.tableHandle.querySelector('.rye-handle-add-row') as HTMLButtonElement;
    const addColBtn = this.tableHandle.querySelector('.rye-handle-add-col') as HTMLButtonElement;
    const deleteBtn = this.tableHandle.querySelector('.rye-handle-delete') as HTMLButtonElement;

    // Tabloyu Seç
    selectBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = this.activeTable || this.ctx.editable.querySelector('table.rye-table.is-selected') || this.ctx.editable.querySelector('table.rye-table');
      if (target) {
        this.selectEntireTable(target as HTMLTableElement);
      }
    });

    // Kenarlık Aç / Kapat
    borderBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = this.activeTable || this.ctx.editable.querySelector('table.rye-table.is-selected') || this.ctx.editable.querySelector('table.rye-table');
      if (target) {
        this.toggleBorders(target as HTMLTableElement);
      }
    });

    // Satır Ekle
    addRowBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = this.activeTable || this.ctx.editable.querySelector('table.rye-table.is-selected') || this.ctx.editable.querySelector('table.rye-table');
      if (target) {
        this.addRowToTable(target as HTMLTableElement);
      }
    });

    // Sütun Ekle
    addColBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = this.activeTable || this.ctx.editable.querySelector('table.rye-table.is-selected') || this.ctx.editable.querySelector('table.rye-table');
      if (target) {
        this.addColToTable(target as HTMLTableElement);
      }
    });

    // Tabloyu Sil
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = this.activeTable || this.ctx.editable.querySelector('table.rye-table.is-selected') || this.ctx.editable.querySelector('table.rye-table');
      if (target) {
        this.deleteTable(target as HTMLTableElement);
      }
    });

    // Fare Tablo Üzerine Geldiğinde Kolu Konumlandır
    editable.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      const table = target.closest('table.rye-table') as HTMLTableElement | null;
      if (table) {
        this.showTableHandle(table);
      }
    });

    editable.addEventListener('mouseleave', () => {
      // Tablodan tamamen çıkıldığında kolu gizle (handle üzerine gelinmediyse)
      setTimeout(() => {
        if (!this.tableHandle?.matches(':hover') && !editable.querySelector('table.rye-table:hover')) {
          this.hideTableHandle();
        }
      }, 300);
    });

    // 2. Klavyeden Delete / Backspace ile Seçili Tabloyu Silme
    editable.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedTable = editable.querySelector('table.rye-table.is-selected') as HTMLTableElement | null;
        if (selectedTable) {
          e.preventDefault();
          this.deleteTable(selectedTable);
        }
      }
    });

    // 3. FARE İLE SÜTUN GENİŞLİĞİ VE SATIR YÜKSEKLİĞİ AYARLAMA (RESIZE)
    editable.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.resizeState) {
        this.handleResizeMove(e);
        return;
      }

      const target = e.target as HTMLElement;
      const cell = target.closest('td, th') as HTMLTableCellElement | null;
      if (!cell || !cell.closest('table.rye-table')) {
        editable.style.cursor = '';
        return;
      }

      const rect = cell.getBoundingClientRect();
      const isRightEdge = Math.abs(e.clientX - rect.right) <= 6;
      const isBottomEdge = Math.abs(e.clientY - rect.bottom) <= 6;

      if (isRightEdge) {
        editable.style.cursor = 'col-resize';
      } else if (isBottomEdge) {
        editable.style.cursor = 'row-resize';
      } else {
        editable.style.cursor = '';
      }
    });

    editable.addEventListener('mousedown', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cell = target.closest('td, th') as HTMLTableCellElement | null;
      if (!cell || !cell.closest('table.rye-table')) return;

      const rect = cell.getBoundingClientRect();
      const isRightEdge = Math.abs(e.clientX - rect.right) <= 6;
      const isBottomEdge = Math.abs(e.clientY - rect.bottom) <= 6;

      if (isRightEdge) {
        e.preventDefault();
        const table = cell.closest('table') as HTMLTableElement;
        this.resizeState = {
          mode: 'col',
          table,
          cell,
          row: cell.parentElement as HTMLTableRowElement,
          colIndex: cell.cellIndex,
          startX: e.clientX,
          startY: e.clientY,
          startWidth: cell.offsetWidth,
          startHeight: cell.offsetHeight
        };
        table.style.tableLayout = 'fixed';
      } else if (isBottomEdge) {
        e.preventDefault();
        const table = cell.closest('table') as HTMLTableElement;
        const row = cell.parentElement as HTMLTableRowElement;
        this.resizeState = {
          mode: 'row',
          table,
          cell,
          row,
          colIndex: cell.cellIndex,
          startX: e.clientX,
          startY: e.clientY,
          startWidth: cell.offsetWidth,
          startHeight: row.offsetHeight
        };
      }
    });

    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.resizeState) {
        this.handleResizeMove(e);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.resizeState) {
        this.resizeState = null;
        editable.style.cursor = '';
        this.ctx.history.record(true);
      }
    });
  }

  private handleResizeMove(e: MouseEvent): void {
    if (!this.resizeState) return;

    if (this.resizeState.mode === 'col') {
      const deltaX = e.clientX - this.resizeState.startX;
      const newWidth = Math.max(30, this.resizeState.startWidth + deltaX);
      const colIndex = this.resizeState.colIndex;
      const table = this.resizeState.table;

      if (table) {
        Array.from(table.rows).forEach(row => {
          if (row.cells[colIndex]) {
            row.cells[colIndex].style.width = `${newWidth}px`;
          }
        });
      }
    } else if (this.resizeState.mode === 'row') {
      const deltaY = e.clientY - this.resizeState.startY;
      const newHeight = Math.max(20, this.resizeState.startHeight + deltaY);
      const row = this.resizeState.row;

      if (row) {
        row.style.height = `${newHeight}px`;
        Array.from(row.cells).forEach(c => {
          c.style.height = `${newHeight}px`;
        });
      }
    }
  }

  private showTableHandle(table: HTMLTableElement): void {
    this.activeTable = table;
    if (!this.tableHandle) return;

    const parent = this.ctx.editable.parentElement;
    if (!parent) return;

    const tableRect = table.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    const top = tableRect.top - parentRect.top - 28 + parent.scrollTop;
    const left = tableRect.left - parentRect.left + parent.scrollLeft;

    this.tableHandle.style.top = `${Math.max(4, top)}px`;
    this.tableHandle.style.left = `${Math.max(4, left)}px`;
    this.tableHandle.style.display = 'flex';
  }

  private hideTableHandle(): void {
    if (this.tableHandle) {
      this.tableHandle.style.display = 'none';
    }
  }

  private selectEntireTable(table: HTMLTableElement): void {
    // Tüm diğer seçimleri temizle
    this.ctx.editable.querySelectorAll('table.rye-table.is-selected').forEach(t => {
      t.classList.remove('is-selected');
    });

    table.classList.add('is-selected');

    // Kol butonunu güncelle
    const selectBtn = this.tableHandle?.querySelector('.rye-handle-select') as HTMLButtonElement;
    if (selectBtn) {
      selectBtn.style.background = '#2563eb';
      selectBtn.style.color = '#ffffff';
    }
  }

  private deleteTable(table: HTMLTableElement): void {
    const parent = table.parentElement;
    this.hideTableHandle();

    // Tablonun yerine imleç için boş paragraf bırak
    const nextP = document.createElement('p');
    nextP.innerHTML = '<br>';
    table.after(nextP);

    table.remove();

    // İmleci yeni paragrafa konumlandır
    const range = document.createRange();
    range.selectNodeContents(nextP);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    this.ctx.history.record(true);
  }

  private addRowToTable(table: HTMLTableElement): void {
    const colsCount = table.rows[0]?.cells.length || 3;
    const newRow = document.createElement('tr');
    for (let c = 0; c < colsCount; c++) {
      const td = document.createElement('td');
      td.innerHTML = '<p><br></p>';
      newRow.appendChild(td);
    }
    table.querySelector('tbody')?.appendChild(newRow) || table.appendChild(newRow);
    this.ctx.history.record(true);
  }

  private addColToTable(table: HTMLTableElement): void {
    Array.from(table.rows).forEach(row => {
      const td = document.createElement('td');
      td.innerHTML = '<p><br></p>';
      row.appendChild(td);
    });
    this.ctx.history.record(true);
  }
}
