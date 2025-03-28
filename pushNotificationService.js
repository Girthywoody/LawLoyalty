
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db } from './firebase'; 
import { doc, setDoc, addDoc, collection } from 'firebase/firestore'; // Add these imports


const firebaseMessaging = getMessaging();

export const requestForToken = async (userId) => {
  try {
    console.log('Requesting notification permission...');
    
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.error('Service workers are not supported in this browser');
      return null;
    }
    
    // Check if FCM is supported
    if (!firebaseMessaging) {
      console.error('Firebase messaging is not initialized');
      return null;
    }
    
    // Request permission with clear error logging
    const permission = await Notification.requestPermission();
    console.log('Notification permission status:', permission);
    
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }
    
    // Get the token with improved error handling
    console.log('Getting FCM token...');
    const token = await getToken(firebaseMessaging, {
      vapidKey: 'BNoGljytf8dipq_SHHXwKnY7E0yRXV7SkbBqhpLvZHXnWWD-WaO0MtjKdJM8ZOc3oJtXEhF_46LgngzLsGpIe_c'
    });
    
    if (!token) {
      console.error('Failed to get FCM token');
      return null;
    }
    
    console.log('FCM token received:', token);
    
    // Store token in Firestore
    if (userId) {
      await setDoc(doc(db, 'fcmTokens', userId), {
        token,
        createdAt: new Date(),
        deviceType: detectDeviceType(),
        userId
      });
      console.log('Token saved to Firestore for user:', userId);
    }
    
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    console.log('Error details:', error.code, error.message);
    return null;
  }
};

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