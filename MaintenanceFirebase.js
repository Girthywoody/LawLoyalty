import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  onSnapshot,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
export { doc, updateDoc, serverTimestamp };

// Collection references
const maintenanceRequestsCollection = collection(db, 'maintenanceRequests');
const maintenanceEventsCollection = collection(db, 'maintenanceEvents');

// Updated createMaintenanceRequest function to handle image uploads
export const createMaintenanceRequest = async (requestData, imageFiles = []) => {
  try {
    // Array to store image download URLs
    const imageUrls = [];
    
    // Upload each image to Firebase storage and get download URLs
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const timestamp = Date.now();
      const fileName = `maintenance/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      imageUrls.push(downloadURL);
    }
    
    // Create request document with image URLs
    const docRef = await addDoc(maintenanceRequestsCollection, {
      ...requestData,
      images: imageUrls,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      comments: [] // Add empty comments array by default
    });
    
    return { 
      id: docRef.id, 
      ...requestData, 
      images: imageUrls,
      createdAt: new Date(),
      comments: []
    };
  } catch (error) {
    console.error("Error creating maintenance request:", error);
    throw error;
  }
};

export const scheduleMaintenanceEvent = async (requestId, eventData) => {
  try {
    // Use the provided date if available, otherwise use current date
    const startDate = eventData.start || new Date();
    const endDate = eventData.end || new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours from start
    
    // Create the event with the provided dates
    const eventRef = await addDoc(maintenanceEventsCollection, {
      ...eventData,
      requestId,
      start: startDate, // Use provided date or current date
      end: endDate,
      createdAt: serverTimestamp()
    });
    
    // Update the request status
    const requestRef = doc(db, 'maintenanceRequests', requestId);
    await updateDoc(requestRef, { 
      status: 'scheduled',
      scheduledDate: startDate, // Use provided date
      updatedAt: serverTimestamp() 
    });
    
    return { 
      id: eventRef.id, 
      ...eventData,
      start: startDate,
      end: endDate
    };
  } catch (error) {
    console.error("Error scheduling maintenance:", error);
    throw error;
  }
};

// Get maintenance events
// In subscribeToMaintenanceRequests
export const subscribeToMaintenanceRequests = (callback) => {
  const q = query(maintenanceRequestsCollection, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => {
      const data = doc.data();
      // Handle all possible date fields
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        scheduledDate: data.scheduledDate?.toDate ? data.scheduledDate.toDate() : 
                      data.scheduledDate instanceof Date ? data.scheduledDate : 
                      new Date(),
        completedDate: data.completedDate?.toDate ? data.completedDate.toDate() : 
                      data.completedDate instanceof Date ? data.completedDate : 
                      null
      };
    });
    callback(requests);
  });
};

// Similarly for subscribeToMaintenanceEvents
export const subscribeToMaintenanceEvents = (callback) => {
  const q = query(maintenanceEventsCollection, orderBy("start", "asc"));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        start: data.start?.toDate ? data.start.toDate() : 
              data.start instanceof Date ? data.start : 
              new Date(),
        end: data.end?.toDate ? data.end.toDate() : 
            data.end instanceof Date ? data.end : 
            new Date(new Date().getTime() + 2 * 60 * 60 * 1000)
      };
    });
    callback(events);
  });
};

// Add comment to a request
export const addCommentToRequest = async (requestId, commentData) => {
  try {
    const requestRef = doc(db, 'maintenanceRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Request not found');
    }
    
    const currentComments = requestDoc.data().comments || [];
    const newComment = {
      id: `c${Date.now()}`,
      ...commentData,
      createdAt: new Date()
    };
    
    await updateDoc(requestRef, {
      comments: [...currentComments, newComment],
      updatedAt: serverTimestamp()
    });
    
    return newComment;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

// Mark request as completed
export const completeMaintenanceRequest = async (requestId) => {
  try {
    const requestRef = doc(db, 'maintenanceRequests', requestId);
    await updateDoc(requestRef, {
      status: 'completed',
      completedDate: new Date(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: requestId };
  } catch (error) {
    console.error("Error completing request:", error);
    throw error;
  }
};