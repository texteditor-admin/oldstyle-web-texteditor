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

export class CollaborationManager {
  private editor: ResmiYaziEditor;
  private config: CollaborationConfig;
  private currentUser: CollaboratorUser;
  private channel: BroadcastChannel | null = null;
  private socket: WebSocket | null = null;
  private activeUsers: Map<string, CollaboratorUser> = new Map();
  private isApplyingRemote: boolean = false;
  private presenceBadgeContainer: HTMLElement | null = null;

  constructor(editor: ResmiYaziEditor, config: CollaborationConfig = {}) {
    this.editor = editor;
    this.config = config;

    const randomColors = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2'];
    const randomColor = randomColors[Math.floor(Math.random() * randomColors.length)];

    this.currentUser = config.user || {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: 'Kullanıcı ' + Math.floor(Math.random() * 900 + 100),
      color: randomColor
    };

    this.activeUsers.set(this.currentUser.id, this.currentUser);

    if (config.channel === 'websocket' && config.websocketUrl) {
      this.initWebSocket(config.websocketUrl);
    } else {
      // Default to BroadcastChannel for immediate zero-config multi-tab collaboration
      this.initBroadcastChannel(config.roomId || 'resmi-yazi-room');
    }

    this.listenLocalChanges();
  }

  setPresenceContainer(container: HTMLElement): void {
    this.presenceBadgeContainer = container;
    this.renderPresenceBadges();
  }

  private initBroadcastChannel(roomName: string): void {
    try {
      this.channel = new BroadcastChannel(`rye-collab-${roomName}`);
      this.channel.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      // Announce presence
      this.broadcast({
        type: 'presence:join',
        user: this.currentUser
      });

      // Periodic presence announce
      window.setInterval(() => {
        this.broadcast({
          type: 'presence:ping',
          user: this.currentUser
        });
      }, 5000);

      window.addEventListener('beforeunload', () => {
        this.broadcast({
          type: 'presence:leave',
          user: this.currentUser
        });
      });
    } catch (err) {
      console.warn('[ResmiYaziEditor Collab] BroadcastChannel desteklenmiyor:', err);
    }
  }

  private initWebSocket(url: string): void {
    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.socket?.send(JSON.stringify({
          type: 'presence:join',
          user: this.currentUser,
          roomId: this.config.roomId
        }));
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch {
          // ignore
        }
      };
    } catch (err) {
      console.error('[ResmiYaziEditor Collab] WebSocket bağlantı hatası:', err);
    }
  }

  private broadcast(message: any): void {
    const payload = { ...message, senderId: this.currentUser.id };
    if (this.channel) {
      this.channel.postMessage(payload);
    }
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  private listenLocalChanges(): void {
    this.editor.on('change:data', (html: string) => {
      if (this.isApplyingRemote) return;

      this.broadcast({
        type: 'content:update',
        user: this.currentUser,
        html: html,
        timestamp: Date.now()
      });
    });
  }

  private handleMessage(data: any): void {
    if (!data || data.senderId === this.currentUser.id) return;

    switch (data.type) {
      case 'presence:join':
      case 'presence:ping':
        if (data.user) {
          this.activeUsers.set(data.user.id, data.user);
          this.renderPresenceBadges();
        }
        break;

      case 'presence:leave':
        if (data.user) {
          this.activeUsers.delete(data.user.id);
          this.renderPresenceBadges();
        }
        break;

      case 'content:update':
        if (data.html !== undefined) {
          this.isApplyingRemote = true;
          // Apply remote content without triggering local change broadcast
          const current = this.editor.getData();
          if (current !== data.html) {
            this.editor.setData(data.html);
          }
          this.isApplyingRemote = false;
        }
        break;
    }
  }

  private renderPresenceBadges(): void {
    if (!this.presenceBadgeContainer) return;
    this.presenceBadgeContainer.innerHTML = '';

    const list = document.createElement('div');
    list.className = 'rye-collab-users';
    list.style.display = 'inline-flex';
    list.style.alignItems = 'center';
    list.style.gap = '6px';

    this.activeUsers.forEach(user => {
      const badge = document.createElement('span');
      badge.className = 'rye-collab-badge';
      badge.style.display = 'inline-flex';
      badge.style.alignItems = 'center';
      badge.style.gap = '4px';
      badge.style.padding = '2px 8px';
      badge.style.borderRadius = '12px';
      badge.style.fontSize = '11px';
      badge.style.fontWeight = '600';
      badge.style.backgroundColor = `${user.color}20`;
      badge.style.color = user.color;
      badge.style.border = `1px solid ${user.color}50`;
      badge.title = user.name + (user.id === this.currentUser.id ? ' (Siz)' : '');

      const dot = document.createElement('span');
      dot.style.width = '6px';
      dot.style.height = '6px';
      dot.style.borderRadius = '50%';
      dot.style.backgroundColor = user.color;

      badge.appendChild(dot);
      badge.appendChild(document.createTextNode(user.name.split(' ')[0]));
      list.appendChild(badge);
    });

    this.presenceBadgeContainer.appendChild(list);
  }

  getCurrentUser(): CollaboratorUser {
    return this.currentUser;
  }

  getActiveUsers(): CollaboratorUser[] {
    return Array.from(this.activeUsers.values());
  }

  disconnect(): void {
    this.broadcast({
      type: 'presence:leave',
      user: this.currentUser
    });
    this.channel?.close();
    this.socket?.close();
  }
}
