import { ResmiYaziEditor } from './Editor';
export interface CollaboratorUser {
    id: string;
    name: string;
    color: string;
}
export interface CollaborationConfig {
    roomId?: string;
    user?: CollaboratorUser;
    channel?: 'broadcast' | 'websocket';
    websocketUrl?: string;
}
export declare class CollaborationManager {
    private editor;
    private config;
    private currentUser;
    private channel;
    private socket;
    private activeUsers;
    private isApplyingRemote;
    private presenceBadgeContainer;
    constructor(editor: ResmiYaziEditor, config?: CollaborationConfig);
    setPresenceContainer(container: HTMLElement): void;
    private initBroadcastChannel;
    private initWebSocket;
    private broadcast;
    private listenLocalChanges;
    private handleMessage;
    private renderPresenceBadges;
    getCurrentUser(): CollaboratorUser;
    getActiveUsers(): CollaboratorUser[];
    disconnect(): void;
}
