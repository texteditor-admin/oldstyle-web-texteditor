export type EventHandler = (...args: any[]) => void;
export declare class Emitter {
    private events;
    on(event: string, handler: EventHandler): () => void;
    off(event: string, handler: EventHandler): void;
    once(event: string, handler: EventHandler): void;
    fire(event: string, ...args: any[]): void;
    removeAllListeners(): void;
}
