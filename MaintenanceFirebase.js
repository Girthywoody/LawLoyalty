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

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// In MaintenanceFirebase.js
import { db, storage } from './firebase';
export { doc, updateDoc, serverTimestamp, db }; // Add db to the exports

// Collection references
const maintenanceRequestsCollection = collection(db, 'maintenanceRequests');
const maintenanceEventsCollection = collection(db, 'maintenanceEvents');

/**
 * Creates a maintenance request with optional image uploads
 * @param {Object} requestData - The request data object
 * @param {Array} imageFiles - Array of image files to upload
 * @returns {Promise<Object>} - Created maintenance request data
 */


export const createMaintenanceRequest = async (requestData, imageFiles = []) => {
  try {
    // Array to store image download URLs
    const imageUrls = [];
    const imageRefs = [];
    
    // Only attempt to upload images if there are any
    if (imageFiles && imageFiles.length > 0) {
      try {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const timestamp = Date.now();
          // Sanitize filename to avoid issues with special characters
          const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
          const fileName = `maintenance/${timestamp}_${safeFileName}`;
          const storageRef = ref(storage, fileName);
          
          try {
            // Upload the file with proper content type
            const metadata = {
              contentType: file.type
            };
            
            // Upload the file
            const snapshot = await uploadBytes(storageRef, file, metadata);
            
            // Get the download URL
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            // Store both the URL and reference path for potential deletion later
            imageUrls.push(downloadURL);
            imageRefs.push(fileName);
            
          } catch (uploadError) {
            console.error("Error uploading file:", uploadError);
            // Continue with next file instead of failing completely
          }
        }
      } catch (imageError) {
        console.error("Error processing images:", imageError);
        // Continue without images rather than failing the whole request
      }
    }
    
    // Store the creator's ID for filtering
    const createdByUid = requestData.currentUser?.id || null;
    
    // Create request document with image URLs and reference paths
    const docRef = await addDoc(maintenanceRequestsCollection, {
      ...requestData,
      createdByUid, // Add the creator's ID
      images: imageUrls,
      imageRefs: imageRefs, // Store references for deletion capability
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      comments: [] // Add empty comments array by default
    });
    
    return { 
      id: docRef.id, 
      ...requestData, 
      createdByUid,
      images: imageUrls,
      imageRefs: imageRefs,
      createdAt: new Date(),
      comments: []
    };
  } catch (error) {
    console.error("Error creating maintenance request:", error);
    throw error;
  }
};

export const deleteImageFromRequest = async (requestId, imageUrl) => {
  try {
    // Get current request data
    const requestRef = doc(db, 'maintenanceRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Request not found');
    }
    
    const requestData = requestDoc.data();
    const currentImages = requestData.images || [];
    const currentImageRefs = requestData.imageRefs || [];
    
    // Find the index of the image to delete
    const imageIndex = currentImages.findIndex(url => url === imageUrl);
    
    if (imageIndex === -1) {
      throw new Error('Image not found in request');
    }
    
    // Get the storage reference for this image
    const imageRef = currentImageRefs[imageIndex];
    
    // Delete from storage if we have a reference
    if (imageRef) {
      try {
        const storageRef = ref(storage, imageRef);
        await deleteObject(storageRef);
      } catch (storageError) {
        console.error("Error deleting image from storage:", storageError);
        // Continue with Firestore update even if storage deletion fails
      }
    }
    
    // Remove from arrays
    const updatedImages = [...currentImages];
    updatedImages.splice(imageIndex, 1);
    
    const updatedImageRefs = [...currentImageRefs];
    updatedImageRefs.splice(imageIndex, 1);
    
    // Update request with updated image arrays
    await updateDoc(requestRef, {
      images: updatedImages,
      imageRefs: updatedImageRefs,
      updatedAt: serverTimestamp()
    });
    
    return { 
      images: updatedImages,
      imageRefs: updatedImageRefs
    };
  } catch (error) {
    console.error("Error deleting image from request:", error);
    throw error;
  }
};

/**
 * Deletes a maintenance request and its associated images
 * @param {string} requestId - The request ID to delete
 * @returns {Promise<Object>} - Success status
 */
export const deleteMaintenanceRequest = async (requestId) => {
  try {
    // First get the request to access the image references
    const requestRef = doc(db, 'maintenanceRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (requestDoc.exists()) {
      const requestData = requestDoc.data();
      
      // Delete all associated images from storage
      if (requestData.imageRefs && requestData.imageRefs.length > 0) {
        for (const imagePath of requestData.imageRefs) {
          try {
            const imageRef = ref(storage, imagePath);
            await deleteObject(imageRef);
          } catch (deleteError) {
            console.error(`Error deleting image ${imagePath}:`, deleteError);
            // Continue deleting other images
          }
        }
      }
      
      // Delete the request document
      await deleteDoc(requestRef);
      
      return { success: true, id: requestId };
    } else {
      throw new Error('Request not found');
    }
  } catch (error) {
    console.error("Error deleting maintenance request:", error);
    throw error;
  }
};

/**
 * Adds images to an existing maintenance request
 * @param {string} requestId - The request ID
 * @param {Array} imageFiles - Array of image files to upload
 * @returns {Promise<Object>} - Updated image URLs
 */
export const addImagesToRequest = async (requestId, imageFiles = []) => {
  try {
    // Get current request data
    const requestRef = doc(db, 'maintenanceRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Request not found');
    }
    
    const requestData = requestDoc.data();
    const currentImages = requestData.images || [];
    const currentImageRefs = requestData.imageRefs || [];
    
    // Array to store new image download URLs
    const newImageUrls = [];
    const newImageRefs = [];
    
    // Only attempt to upload images if there are any
    if (imageFiles && imageFiles.length > 0) {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const timestamp = Date.now();
        // Sanitize filename to avoid issues with special characters
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `maintenance/${requestId}/${timestamp}_${safeFileName}`;
        const storageRef = ref(storage, fileName);
        
        try {
          // Upload the file with proper content type
          const metadata = {
            contentType: file.type
          };
          
          // Upload the file
          const snapshot = await uploadBytes(storageRef, file, metadata);
          
          // Get the download URL
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          // Store both the URL and reference path
          newImageUrls.push(downloadURL);
          newImageRefs.push(fileName);
          
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError);
          // Continue with next file instead of failing completely
        }
      }
    }
    
    // Update request with combined image URLs and refs
    await updateDoc(requestRef, {
      images: [...currentImages, ...newImageUrls],
      imageRefs: [...currentImageRefs, ...newImageRefs],
      updatedAt: serverTimestamp()
    });
    
    return { 
      images: [...currentImages, ...newImageUrls],
      imageRefs: [...currentImageRefs, ...newImageRefs]
    };
  } catch (error) {
    console.error("Error adding images to request:", error);
    throw error;
  }
};

// Update the scheduleMaintenanceEvent function to better handle start/end times
export const scheduleMaintenanceEvent = async (requestId, eventData) => {
  try {
    // Use the provided date if available, otherwise use current date
    const startDate = eventData.start || new Date();
    const endDate = eventData.end || null; // Don't set end date until completed
    
    // Create the event with the provided dates
    const eventRef = await addDoc(maintenanceEventsCollection, {
      ...eventData,
      requestId,
      start: startDate, // Use exact provided date
      end: endDate,
      createdAt: serverTimestamp()
    });
    
    // Update the request status to in progress
    const requestRef = doc(db, 'maintenanceRequests', requestId);
    await updateDoc(requestRef, { 
      status: 'in progress',
      scheduledDate: startDate,
      maintenanceStartTime: startDate, // Add this to track when maintenance started
      updatedAt: serverTimestamp() 
    });
    
    return { 
      id: eventRef.id, 
      ...eventData,
      requestId,
      start: startDate,
      end: endDate
    };
  } catch (error) {
    console.error("Error scheduling maintenance:", error);
    throw error;
  }
};

// Update the completeMaintenanceRequest function to include completion time and duration
export const completeMaintenanceRequest = async (requestId, completionTime = null, duration = null) => {
  try {
    const endTime = completionTime || new Date();
    
    const requestRef = doc(db, 'maintenanceRequests', requestId);
    await updateDoc(requestRef, {
      status: 'completed',
      completedDate: endTime,
      maintenanceEndTime: endTime,
      maintenanceDuration: duration,
      updatedAt: serverTimestamp()
    });
    
    return { 
      success: true, 
      id: requestId,
      completedDate: endTime,
      duration: duration
    };
  } catch (error) {
    console.error("Error completing request:", error);
    throw error;
  }
};

// Get maintenance events
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