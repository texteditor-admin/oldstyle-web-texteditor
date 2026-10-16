export class SelectionManager {
  private savedRange: Range | null = null;
  private rootElement: HTMLElement;

  constructor(rootElement: HTMLElement) {
    this.rootElement = rootElement;
  }

  save(): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      this.savedRange = null;
      return;
    }
    const range = sel.getRangeAt(0);
    // Only save if inside our root element
    if (this.rootElement.contains(range.commonAncestorContainer)) {
      this.savedRange = range.cloneRange();
    }
  }

  restore(): boolean {
    if (!this.savedRange) return false;
    const sel = window.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    sel.addRange(this.savedRange.cloneRange());
    return true;
  }

  getRange(): Range | null {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (!this.rootElement.contains(range.commonAncestorContainer)) {
      return null;
    }
    return range;
  }

  getSelectedBlocks(): HTMLElement[] {
    const range = this.getRange() || this.savedRange;
    if (!range) return [];

    const blocks: HTMLElement[] = [];
    const blockTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'LI', 'TD', 'TH', 'DIV'];

    // Find closest block to start
    let startEl: HTMLElement | null = range.startContainer instanceof HTMLElement 
      ? range.startContainer 
      : range.startContainer.parentElement;

    while (startEl && startEl !== this.rootElement) {
      if (blockTags.includes(startEl.tagName) && !startEl.classList.contains('rye-page')) {
        break;
      }
      startEl = startEl.parentElement;
    }

    if (range.collapsed) {
      if (startEl && startEl !== this.rootElement && !startEl.classList.contains('rye-page')) {
        return [startEl];
      }
      // If root element directly contains text, wrap or return
      return [];
    }

    // Multi-block selection
    const walker = document.createTreeWalker(
      range.commonAncestorContainer === this.rootElement 
        ? this.rootElement 
        : (range.commonAncestorContainer.parentElement || this.rootElement),
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node: Node) => {
          const el = node as HTMLElement;
          if (blockTags.includes(el.tagName) && el !== this.rootElement && !el.classList.contains('rye-page')) {
            if (range.intersectsNode(el)) {
              return NodeFilter.FILTER_ACCEPT;
            }
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
      blocks.push(currentNode as HTMLElement);
      currentNode = walker.nextNode();
    }

    if (blocks.length === 0 && startEl && startEl !== this.rootElement) {
      blocks.push(startEl);
    }

    return blocks;
  }

  getCurrentBlock(): HTMLElement | null {
    const blocks = this.getSelectedBlocks();
    return blocks.length > 0 ? blocks[0] : null;
  }

  getCurrentCell(): HTMLTableCellElement | null {
    const range = this.getRange() || this.savedRange;
    if (!range) return null;
    let node: Node | null = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }
    while (node && node !== this.rootElement) {
      if (node.nodeName === 'TD' || node.nodeName === 'TH') {
        return node as HTMLTableCellElement;
      }
      node = node.parentElement;
    }
    return null;
  }

  isCollapsed(): boolean {
    const range = this.getRange();
    return !range || range.collapsed;
  }
}
