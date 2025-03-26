// In MaintenanceFirebase.js
// Change:
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
  
  // And modify the createMaintenanceRequest function to:
  export const createMaintenanceRequest = async (requestData, imageFiles = []) => {
    try {
      // For testing, just store image URLs as strings or skip them
      const imageUrls = [];
      
      // Create request document
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
      // Ensure dates are proper Firestore timestamps
      const startTimestamp = serverTimestamp(); // This ensures we use the server time
      
      // Create the event
      const eventRef = await addDoc(maintenanceEventsCollection, {
        ...eventData,
        requestId,
        start: startTimestamp, // Use server timestamp for "now"
        end: new Date(new Date().getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        createdAt: serverTimestamp()
      });
      
      // Update the request status
      const requestRef = doc(db, 'maintenanceRequests', requestId);
      await updateDoc(requestRef, { 
        status: 'scheduled',
        scheduledDate: startTimestamp, // Use same timestamp
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