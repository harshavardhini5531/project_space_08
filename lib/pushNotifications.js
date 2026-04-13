// lib/pushNotifications.js

export async function registerPushNotifications(userEmail, userType = 'student') {
  try {
    // Check browser support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Push permission denied');
      return false;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Get VAPID public key
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.error('VAPID public key not set');
      return false;
    }

    // Convert VAPID key
    const urlBase64ToUint8Array = (base64String) => {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
      return outputArray;
    };

    // Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    // Send subscription to server
    const response = await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'subscribe',
        subscription: subscription.toJSON(),
        userEmail,
        userType,
      }),
    });

    const data = await response.json();
    console.log('Push subscription saved:', data);
    return true;

  } catch (err) {
    console.error('Push registration failed:', err);
    return false;
  }
}

// Send push notification via API
export async function sendPushNotification({ recipientEmail, recipientType, title, body, url, type, teamNumber, stageNumber }) {
  try {
    const response = await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        recipientEmail,
        recipientType,
        title,
        body,
        url,
        type,
        teamNumber,
        stageNumber,
      }),
    });
    return await response.json();
  } catch (err) {
    console.error('Send push failed:', err);
    return { success: false };
  }
}