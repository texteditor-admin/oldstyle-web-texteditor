export type EventHandler = (...args: any[]) => void;

export class Emitter {
  private events: Map<string, EventHandler[]> = new Map();

  on(event: string, handler: EventHandler): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event);
    if (!handlers) return;
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
    if (handlers.length === 0) {
      this.events.delete(event);
    }
  }

  once(event: string, handler: EventHandler): void {
    const wrapped: EventHandler = (...args: any[]) => {
      this.off(event, wrapped);
      handler(...args);
    };
    this.on(event, wrapped);
  }

  fire(event: string, ...args: any[]): void {
    const handlers = this.events.get(event);
    if (!handlers) return;
    // Copy array to avoid issues if a handler unregisters during loop
    [...handlers].forEach(handler => {
      try {
        handler(...args);
      } catch (err) {
        console.error(`Error in event listener for "${event}":`, err);
      }
    });
  }

  removeAllListeners(): void {
    this.events.clear();
  }
}
