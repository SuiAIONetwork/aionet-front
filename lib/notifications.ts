/**
 * Utility functions for handling browser notifications
 */

/**
 * Check if browser notifications are supported
 */
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Check if notification permission has been granted
 */
export const hasNotificationPermission = (): boolean => {
  return isNotificationSupported() && Notification.permission === 'granted';
};

/**
 * Request permission to show notifications
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  
  try {
    return await Notification.requestPermission();
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Send a browser notification
 */
export const sendNotification = (
  title: string, 
  options?: NotificationOptions
): Notification | null => {
  if (!hasNotificationPermission()) {
    return null;
  }
  
  try {
    return new Notification(title, {
      icon: '/images/logo-icon.png',
      ...options
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
};

/**
 * Send a trade notification
 */
export const sendTradeNotification = (
  tradeType: 'open' | 'close',
  symbol: string,
  profit?: number
): Notification | null => {
  const title = tradeType === 'open' 
    ? `New Trade Opened: ${symbol}`
    : `Trade Closed: ${symbol}`;
    
  const body = tradeType === 'open'
    ? `A new trade has been opened for ${symbol}`
    : `Your trade for ${symbol} has been closed${profit !== undefined ? ` with ${profit >= 0 ? 'profit' : 'loss'} of ${profit.toFixed(2)}` : ''}`;
    
  return sendNotification(title, {
    body,
    badge: '/images/trade-badge.png',
    icon: tradeType === 'open' 
      ? '/images/trade-open.png' 
      : profit && profit >= 0 
        ? '/images/trade-profit.png' 
        : '/images/trade-loss.png',
  });
};

/**
 * Send a system notification
 */
export const sendSystemNotification = (
  title: string,
  message: string
): Notification | null => {
  return sendNotification(title, {
    body: message,
    icon: '/images/system-notification.png'
  });
};
