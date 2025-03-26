// MaintenanceFirebase.js
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

import { db } from './firebase';
  // Collection references
  const maintenanceRequestsCollection = collection(db, 'maintenanceRequests');
  const maintenanceEventsCollection = collection(db, 'maintenanceEvents');
  
  // Create a new maintenance request
  export const createMaintenanceRequest = async (requestData, imageFiles = []) => {
    try {
      // Upload images if any
      const imageUrls = [];
      for (const file of imageFiles) {
        if (file instanceof File) {
          const storageRef = ref(storage, `maintenance/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const downloadUrl = await getDownloadURL(snapshot.ref);
          imageUrls.push(downloadUrl);
        }
      }
      
      // Create request document
      const docRef = await addDoc(maintenanceRequestsCollection, {
        ...requestData,
        images: imageUrls,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { id: docRef.id, ...requestData, images: imageUrls };
    } catch (error) {
      console.error("Error creating maintenance request:", error);
      throw error;
    }
  };
  
  // Get all maintenance requests
  export const subscribeToMaintenanceRequests = (callback) => {
    const q = query(maintenanceRequestsCollection, orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      callback(requests);
    });
  };
  
  // Schedule maintenance
  export const scheduleMaintenanceEvent = async (requestId, eventData) => {
    try {
      // Create the event
      const eventRef = await addDoc(maintenanceEventsCollection, {
        ...eventData,
        requestId,
        createdAt: serverTimestamp()
      });
      
      // Update the request status
      const requestRef = doc(db, 'maintenanceRequests', requestId);
      await updateDoc(requestRef, { 
        status: 'scheduled',
        scheduledDate: eventData.start,
        updatedAt: serverTimestamp() 
      });
      
      return { id: eventRef.id, ...eventData };
    } catch (error) {
      console.error("Error scheduling maintenance:", error);
      throw error;
    }
  };
  
  // Get maintenance events
  export const subscribeToMaintenanceEvents = (callback) => {
    const q = query(maintenanceEventsCollection, orderBy("start", "asc"));
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        start: doc.data().start?.toDate() || new Date(),
        end: doc.data().end?.toDate() || new Date()
      }));
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