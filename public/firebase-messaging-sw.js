// firebase-messaging-sw.js
// This service worker is needed by Firebase Cloud Messaging to handle background messages

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: 'AIzaSyAWO9PM6Rqxrbxg6pfW_tgvifxEIiCOuOg',
  authDomain: 'project-1cb22546-1616-4668-af4.firebaseapp.com',
  projectId: 'project-1cb22546-1616-4668-af4',
  storageBucket: 'project-1cb22546-1616-4668-af4.firebasestorage.app',
  messagingSenderId: '908669880664',
  appId: '1:908669880664:web:0d2fac7461117a5362bd2d',
});

// Get messaging service
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Received background message:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'UpNext Notification';
  const notificationId = payload.data?.notificationId || payload.data?.targetId || notificationTitle;
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new notification',
    icon: '/upnext-logo/icon-cropped.png',
    badge: '/upnext-logo/icon-cropped.png',
    tag: notificationId,
    renotify: false,
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw] Notification clicked:', event.notification);

  event.notification.close();

  const data = event.notification.data;
  const targetType = data?.targetType || '';
  const targetId = data?.targetId || '';

  let urlToOpen = '/';

  // Navigate based on notification type
  if (targetType === 'APPLICATION' && targetId) {
    urlToOpen = `/candidate/applications/${targetId}`;
  } else if (targetType === 'JOB_POST' && targetId) {
    urlToOpen = `/jobs/${targetId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab with the target URL
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});
