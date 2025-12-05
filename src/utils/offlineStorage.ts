// IndexedDB utilities for offline data storage
import type { Message } from '../types';

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'GroupwareOfflineDB';
  private readonly version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('IndexedDB initialization failed');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(db);
      };
    });
  }

  private createObjectStores(db: IDBDatabase): void {
    // Messages store
    if (!db.objectStoreNames.contains('messages')) {
      const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
      messagesStore.createIndex('chatId', 'chatId', { unique: false });
      messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
    }

    // Pending actions store (for sync when back online)
    if (!db.objectStoreNames.contains('pendingActions')) {
      const pendingStore = db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
      pendingStore.createIndex('type', 'type', { unique: false });
      pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
    }

    // User data cache
    if (!db.objectStoreNames.contains('userCache')) {
      db.createObjectStore('userCache', { keyPath: 'key' });
    }

    // App settings cache
    if (!db.objectStoreNames.contains('settingsCache')) {
      db.createObjectStore('settingsCache', { keyPath: 'key' });
    }
  }

  // Generic store operations
  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.init();
    }

    const transaction = this.db!.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Messages operations
  async saveMessage(message: Message): Promise<void> {
    try {
      const store = await this.getStore('messages', 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = store.put(message);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to save message:', error);
      throw error;
    }
  }

  async getMessages(chatId: string, limit: number = 50): Promise<Message[]> {
    try {
      const store = await this.getStore('messages');
      const index = store.index('chatId');
      const request = index.openCursor(IDBKeyRange.only(chatId), 'prev');

      return new Promise<Message[]>((resolve, reject) => {
        const messages: Message[] = [];
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor && messages.length < limit) {
            messages.push(cursor.value);
            cursor.continue();
          } else {
            resolve(messages.reverse());
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  // Pending actions operations
  async savePendingAction(action: {
    type: string;
    data: unknown;
    timestamp: Date;
  }): Promise<number> {
    try {
      const store = await this.getStore('pendingActions', 'readwrite');
      return new Promise<number>((resolve, reject) => {
        const request = store.add(action);
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to save pending action:', error);
      throw error;
    }
  }

  async getPendingActions(): Promise<unknown[]> {
    try {
      const store = await this.getStore('pendingActions');
      return new Promise<unknown[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get pending actions:', error);
      return [];
    }
  }

  async removePendingAction(id: number): Promise<void> {
    try {
      const store = await this.getStore('pendingActions', 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to remove pending action:', error);
      throw error;
    }
  }

  // Cache operations
  async setCache(key: string, data: unknown, storeName: string = 'userCache'): Promise<void> {
    try {
      const store = await this.getStore(storeName, 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = store.put({ key, data, timestamp: new Date() });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to set cache:', error);
      throw error;
    }
  }

  async getCache(key: string, storeName: string = 'userCache'): Promise<unknown | null> {
    try {
      const store = await this.getStore(storeName);
      return new Promise<unknown>((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  }

  // Clear all data
  async clearAll(): Promise<void> {
    try {
      if (!this.db) return;

      const storeNames = Array.from(this.db.objectStoreNames);
      const transaction = this.db.transaction(storeNames, 'readwrite');

      await Promise.all(
        storeNames.map(storeName => {
          return new Promise<void>((resolve, reject) => {
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        })
      );

      console.log('All offline data cleared');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }

  // Get storage usage
  async getStorageUsage(): Promise<{ used: number; available: number }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0,
        };
      }
      return { used: 0, available: 0 };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return { used: 0, available: 0 };
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();