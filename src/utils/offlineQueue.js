/**
 * Offline Queue — stores failed API calls in IndexedDB and replays them
 * when the network comes back.
 *
 * Usage:
 *   import { enqueueOffline, processQueue } from './offlineQueue';
 *
 *   // When adding an expense fails due to network:
 *   await enqueueOffline({ type: 'ADD_EXPENSE', payload: expenseData });
 *
 *   // On reconnect (called by useOfflineQueue hook):
 *   await processQueue(handlers);
 */

const DB_NAME    = 'roomie-offline';
const STORE_NAME = 'queue';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

export async function enqueueOffline(item) {
  const db    = await openDB();
  const tx    = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.add({ ...item, queuedAt: Date.now() });
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror    = (e) => reject(e.target.error);
  });
}

export async function getQueue() {
  const db    = await openDB();
  const tx    = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

export async function removeFromQueue(id) {
  const db    = await openDB();
  const tx    = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror    = (e) => reject(e.target.error);
  });
}

export async function clearQueue() {
  const db    = await openDB();
  const tx    = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror    = (e) => reject(e.target.error);
  });
}

/**
 * Process all queued items.
 * @param {Object} handlers - map of type → async function(payload)
 * @returns {{ succeeded: number, failed: number }}
 */
export async function processQueue(handlers) {
  const items = await getQueue();
  let succeeded = 0;
  let failed    = 0;

  for (const item of items) {
    const handler = handlers[item.type];
    if (!handler) {
      // Unknown type — remove it so it doesn't block forever
      await removeFromQueue(item.id);
      continue;
    }
    try {
      await handler(item.payload);
      await removeFromQueue(item.id);
      succeeded++;
    } catch (err) {
      // Keep in queue — will retry next time
      failed++;
      console.warn(`[OfflineQueue] Failed to replay ${item.type}:`, err.message);
    }
  }

  return { succeeded, failed };
}
