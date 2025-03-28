import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db } from './firebase'; // Import your Firebase config
import { doc, setDoc } from 'firebase/firestore';

const firebaseMessaging = getMessaging();

// Function to get FCM token
export const requestForToken = async (userId) => {
  try {
    console.log('Requesting permission...');
    const permission = await Notification.requestPermission();
    console.log('Permission result:', permission);
    
    if (permission === 'granted') {
      console.log('Permission granted, getting token...');
      const token = await getToken(firebaseMessaging, {
        vapidKey: 'BNoGljytf8dipq_SHHXwKnY7E0yRXV7SkbBqhpLvZHXnWWD-WaO0MtjKdJM8ZOc3oJtXEhF_46LgngzLsGpIe_c' // Replace with your actual VAPID key from Firebase console
      });
      
      console.log('FCM token:', token);
      
      // Store token in Firestore for this user
      if (userId && token) {
        await setDoc(doc(db, 'fcmTokens', userId), {
          token,
          createdAt: new Date(),
          deviceType: detectDeviceType(),
          userId
        });
      }
      
      return token;
    } else {
      console.log('User denied notification permission');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Add this function to pushNotificationService.js
export const sendNotification = async (title, body, userId) => {
  try {
    // Create a notification in the notifications collection
    await addDoc(collection(db, 'notifications'), {
      title: title,
      body: body,
      userId: userId,
      createdAt: new Date(),
      read: false,
      type: 'maintenance'
    });
    console.log('Notification stored in database');
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};



// Listen for FCM messages when app is in foreground
export const onMessageListener = () => {
  return new Promise((resolve) => {
    onMessage(firebaseMessaging, (payload) => {
      console.log('Message received:', payload);
      resolve(payload);
    });
  });
};

// Helper to detect device type
const detectDeviceType = () => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) {
    return 'android';
  } else if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  return 'web';
};