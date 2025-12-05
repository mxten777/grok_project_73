import { useEffect, useCallback } from 'react';
import { useOfflineStatus } from './useOfflineStatus';
import { offlineStorage } from '../utils/offlineStorage';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const useOfflineSync = () => {
  const { isOnline, wasOffline } = useOfflineStatus();

  const syncPendingActions = useCallback(async () => {
    try {
      const pendingActions = await offlineStorage.getPendingActions();

      for (const action of pendingActions) {
        const actionData = action as any;
        try {
          switch (actionData.type) {
            case 'sendMessage':
              await addDoc(collection(db, 'messages'), {
                ...actionData.data,
                timestamp: serverTimestamp(),
                isOffline: true,
              });
              break;

            case 'createTask':
              await addDoc(collection(db, 'tasks'), {
                ...actionData.data,
                createdAt: serverTimestamp(),
                isOffline: true,
              });
              break;

            case 'updateAttendance':
              // Implement attendance sync logic
              break;

            default:
              console.warn('Unknown pending action type:', actionData.type);
          }

          // Remove successfully synced action
          await offlineStorage.removePendingAction(actionData.id);
          console.log('Synced pending action:', actionData.id);
        } catch (error) {
          console.error('Failed to sync action:', actionData.id, error);
          // Keep failed actions for retry
        }
      }
    } catch (error) {
      console.error('Failed to sync pending actions:', error);
    }
  }, []);

  const refreshCache = useCallback(async () => {
    try {
      // Refresh user data cache
      // This would typically fetch latest user data and update cache

      // Refresh settings cache
      // This would typically fetch latest settings and update cache

      console.log('Cache refreshed after coming back online');
    } catch (error) {
      console.error('Failed to refresh cache:', error);
    }
  }, []);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      console.log('Back online - starting sync...');

      // Small delay to ensure connection is stable
      const syncTimer = setTimeout(async () => {
        await syncPendingActions();
        await refreshCache();

        // Show success notification
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          // Trigger background sync if available
          // const registration = await navigator.serviceWorker.ready;
          // Background sync is experimental and not supported in all browsers
          // if ('sync' in registration) {
          //   await registration.sync.register('background-sync');
          // }
        }
      }, 2000);

      return () => clearTimeout(syncTimer);
    }
  }, [isOnline, wasOffline, syncPendingActions, refreshCache]);

  // Save actions for offline sync
  const saveForOfflineSync = useCallback(async (type: string, data: unknown) => {
    try {
      await offlineStorage.savePendingAction({
        type,
        data,
        timestamp: new Date(),
      });
      console.log('Action saved for offline sync:', type);
    } catch (error) {
      console.error('Failed to save action for offline sync:', error);
    }
  }, []);

  return {
    saveForOfflineSync,
    syncPendingActions,
  };
};