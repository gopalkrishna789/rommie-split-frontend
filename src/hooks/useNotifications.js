import { useState, useCallback } from 'react';
import { notificationsApi } from '../utils/api';

/**
 * Hook to manage Web Push and FCM notification subscriptions.
 * Gracefully degrades when VAPID keys are not configured on the server.
 */
export function useNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [subscribed, setSubscribed] = useState(false);
  // Track whether we already checked VAPID so we don't spam the console
  const [vapidChecked, setVapidChecked] = useState(false);
  const [vapidAvailable, setVapidAvailable] = useState(null); // null = unknown

  const subscribe = useCallback(async () => {
    if (!('Notification' in window)) return false;

    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== 'granted') return false;

    try {
      // Only fetch VAPID key once
      if (!vapidChecked) {
        const vapidRes = await notificationsApi.getVapidKey();
        const vapidKey = vapidRes.data.vapidPublicKey;
        setVapidChecked(true);

        if (!vapidKey) {
          // VAPID not configured — silently skip, no console spam
          setVapidAvailable(false);
          return false;
        }
        setVapidAvailable(true);
      }

      if (vapidAvailable === false) return false;

      const vapidRes = await notificationsApi.getVapidKey();
      const vapidKey = vapidRes.data.vapidPublicKey;
      if (!vapidKey) return false;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await notificationsApi.subscribe(subscription.toJSON());
      setSubscribed(true);
      return true;
    } catch (err) {
      // Only log unexpected errors, not missing config
      if (!err.message?.includes('VAPID')) {
        console.error('Push subscription failed:', err);
      }
      return false;
    }
  }, [vapidChecked, vapidAvailable]);

  const saveFcmToken = useCallback(async (token) => {
    try {
      await notificationsApi.saveFcmToken(token);
    } catch {
      // Silently ignore — FCM is optional
    }
  }, []);

  return { permission, subscribed, subscribe, saveFcmToken, vapidAvailable };
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
