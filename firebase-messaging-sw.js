// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCC9Bzela9Mhs2raQ0cQCSWJdm-GjnJvGg",
  authDomain: "law-loyalty.firebaseapp.com",
  projectId: "law-loyalty",
  storageBucket: "law-loyalty.firebasestorage.app",
  messagingSenderId: "18898180139",
  appId: "1:18898180139:web:115ada8b7ab0d8a9edb26e",
  measurementId: "G-XTKBQK7L33"
});

const messaging = firebase.messaging();

// This is critical for handling background notifications
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/logo.jpg', 
    tag: payload.notification.tag || 'maintenance-notification',
    data: payload.data
  };
  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(clients.matchAll({
    type: "window"
  }).then(function(clientList) {
    for (var i = 0; i < clientList.length; i++) {
      var client = clientList[i];
      if (client.url.includes('/') && 'focus' in client)
        return client.focus();
    }
    if (clients.openWindow)
      return clients.openWindow('/');
  }));
});