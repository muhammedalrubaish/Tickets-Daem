export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export const sendPushNotification = async (
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<Response> => {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    throw new Error('VAPID public key is not configured');
  }

  return fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `key=${process.env.FCM_SERVER_KEY}`
    },
    body: JSON.stringify({
      notification: {
        title: payload.title,
        body: payload.body,
        icon: '/شعار بلدي الرسمي.png',
        badge: '/شعار بلدي الرسمي.png',
        dir: 'rtl',
        lang: 'ar',
        tag: payload.tag || 'open-tickets'
      },
      data: {
        url: payload.url || '/open-tickets'
      }
    })
  });
};

export const showNotification = (
  title: string,
  options?: NotificationOptions
) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          ...options,
          dir: 'rtl',
          lang: 'ar',
          icon: '/شعار بلدي الرسمي.png',
          badge: '/شعار بلدي الرسمي.png'
        });
      });
    } else {
      new Notification(title, options);
    }
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  return false;
};

// Local storage utilities for tracking tickets
export const getStoredTicketIds = (): string[] => {
  try {
    const stored = localStorage.getItem('open_tickets_seen');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading stored ticket IDs:', error);
    return [];
  }
};

export const saveTicketIds = (ticketIds: string[]): void => {
  try {
    localStorage.setItem('open_tickets_seen', JSON.stringify(ticketIds));
  } catch (error) {
    console.error('Error saving ticket IDs:', error);
  }
};

export const getNewTicketIds = (
  currentIds: string[],
  previousIds: string[]
): string[] => {
  return currentIds.filter((id) => !previousIds.includes(id));
};

// Notification frequency limiter
export const checkNotificationFrequency = (key: string, minInterval: number = 60000): boolean => {
  try {
    const lastNotification = localStorage.getItem(`notification_${key}`);
    const now = Date.now();

    if (!lastNotification) {
      localStorage.setItem(`notification_${key}`, now.toString());
      return true;
    }

    const lastTime = parseInt(lastNotification);
    if (now - lastTime > minInterval) {
      localStorage.setItem(`notification_${key}`, now.toString());
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking notification frequency:', error);
    return true;
  }
};
