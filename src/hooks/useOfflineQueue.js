/**
 * useOfflineQueue — React hook that:
 *  1. Detects online/offline status
 *  2. Replays queued expenses when coming back online
 *  3. Exposes queue count so UI can show a badge
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { getQueue, processQueue, enqueueOffline } from '../utils/offlineQueue';
import { expensesApi } from '../utils/api';

export function useOfflineQueue({ onSynced } = {}) {
  const [isOnline, setIsOnline]       = useState(navigator.onLine);
  const [queueCount, setQueueCount]   = useState(0);
  const [syncing, setSyncing]         = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const syncedRef = useRef(false);

  // Refresh queue count
  const refreshCount = useCallback(async () => {
    const items = await getQueue();
    setQueueCount(items.length);
  }, []);

  // Replay queue against the real API
  const sync = useCallback(async () => {
    if (syncing) return;
    const items = await getQueue();
    if (items.length === 0) return;

    setSyncing(true);
    try {
      const result = await processQueue({
        ADD_EXPENSE: async (payload) => {
          await expensesApi.add(payload);
        },
      });
      setLastSyncResult(result);
      await refreshCount();
      if (result.succeeded > 0 && onSynced) {
        onSynced(result);
      }
    } finally {
      setSyncing(false);
    }
  }, [syncing, refreshCount, onSynced]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline  = () => { setIsOnline(true);  };
    const handleOffline = () => { setIsOnline(false); };

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    refreshCount();

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && !syncedRef.current) {
      syncedRef.current = true;
      sync();
    }
    if (!isOnline) {
      syncedRef.current = false;
    }
  }, [isOnline, sync]);

  /**
   * Try to add an expense. If offline, queue it for later.
   * Returns { queued: true } if offline, or the API response if online.
   */
  const addExpenseWithFallback = useCallback(async (payload) => {
    if (!navigator.onLine) {
      await enqueueOffline({ type: 'ADD_EXPENSE', payload });
      await refreshCount();
      return { queued: true };
    }
    try {
      const res = await expensesApi.add(payload);
      return res;
    } catch (err) {
      // Network error even though navigator.onLine was true (flaky connection)
      if (!err.response) {
        await enqueueOffline({ type: 'ADD_EXPENSE', payload });
        await refreshCount();
        return { queued: true };
      }
      throw err;
    }
  }, [refreshCount]);

  return {
    isOnline,
    queueCount,
    syncing,
    lastSyncResult,
    sync,
    addExpenseWithFallback,
    refreshCount,
  };
}
