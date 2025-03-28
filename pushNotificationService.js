import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db } from './firebase'; // Import your Firebase config
import { doc, setDoc } from 'firebase/firestore';

const firebaseMessaging = getMessaging();

// Function to get FCM token
export const requestForToken = async (userId) => {
  try {
    // Request permission first (required for Safari and iOS)
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Get token
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