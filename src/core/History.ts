export interface HistoryState {
  html: string;
}

export class HistoryManager {
  private stack: HistoryState[] = [];
  private index: number = -1;
  private maxDepth: number = 60;
  private rootElement: HTMLElement;
  private isApplying: boolean = false;
  private debounceTimer: number | null = null;
  private onChangeCallback: (() => void) | null = null;

  constructor(rootElement: HTMLElement, onChange?: () => void) {
    this.rootElement = rootElement;
    this.onChangeCallback = onChange || null;
    // Save initial state
    this.recordInitial();
  }

  private recordInitial(): void {
    const html = this.rootElement.innerHTML;
    this.stack = [{ html }];
    this.index = 0;
  }

  record(force: boolean = false): void {
    if (this.isApplying) return;

    if (!force) {
      if (this.debounceTimer !== null) {
        window.clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = window.setTimeout(() => {
        this.doRecord();
      }, 350);
    } else {
      if (this.debounceTimer !== null) {
        window.clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
      this.doRecord();
    }
  }

  private doRecord(): void {
    const currentHtml = this.rootElement.innerHTML;
    if (this.index >= 0 && this.stack[this.index]?.html === currentHtml) {
      return; // No change
    }

    // Truncate any redo branch
    this.stack = this.stack.slice(0, this.index + 1);

    this.stack.push({ html: currentHtml });
    if (this.stack.length > this.maxDepth) {
      this.stack.shift();
    } else {
      this.index++;
    }

    if (this.onChangeCallback) {
      this.onChangeCallback();
    }
  }

  canUndo(): boolean {
    return this.index > 0;
  }

  canRedo(): boolean {
    return this.index < this.stack.length - 1;
  }

  undo(): boolean {
    if (!this.canUndo()) return false;
    this.index--;
    this.applyState(this.stack[this.index]);
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;
    this.index++;
    this.applyState(this.stack[this.index]);
    return true;
  }

  private applyState(state: HistoryState): void {
    if (!state) return;
    this.isApplying = true;
    this.rootElement.innerHTML = state.html;
    this.isApplying = false;

    if (this.onChangeCallback) {
      this.onChangeCallback();
    }
  }

  clear(): void {
    this.recordInitial();
  }
}
