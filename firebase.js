// firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  setDoc,
  deleteDoc, 
  doc, 
  getDoc,
  updateDoc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updatePassword,
  updateProfile,
  sendPasswordResetEmail

} from 'firebase/auth';

// Replace this with your Firebase configuration
// You can find this in your Firebase project settings
const firebaseConfig = {
    apiKey: "AIzaSyCC9Bzela9Mhs2raQ0cQCSWJdm-GjnJvGg",
    authDomain: "law-loyalty.firebaseapp.com",
    projectId: "law-loyalty",
    storageBucket: "law-loyalty.firebasestorage.app",
    messagingSenderId: "18898180139",
    appId: "1:18898180139:web:115ada8b7ab0d8a9edb26e",
    measurementId: "G-XTKBQK7L33"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// Collection references
const employeesCollection = collection(db, 'employees');
const restaurantsCollection = collection(db, 'restaurants');
const invitesCollection = collection(db, 'invites');

export { db, auth, isSignInWithEmailLink, sendPasswordResetEmail};




// For employees, use a combination of name and restaurant
export const addEmployee = async (employeeData) => {
  try {
    // Create a meaningful ID based on name and restaurant (if available)
    const nameSlug = employeeData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let customId = `employee-${nameSlug}`;
    
    if (employeeData.restaurantId) {
      customId = `${employeeData.restaurantId}-${nameSlug}`;
    }
    
    // Check if a document with this ID already exists
    const docRef = doc(db, 'employees', customId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Append a timestamp if the ID already exists
      customId += `-${Date.now()}`;
    }
    
    // Use setDoc with a custom ID instead of addDoc
    await setDoc(doc(db, 'employees', customId), {
      ...employeeData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return {
      id: customId,
      ...employeeData
    };
  } catch (error) {
    console.error("Error adding employee:", error);
    throw error;
  }
};

// For restaurant managers
export const createManagerWithRestaurant = async (email, password, name, restaurantId) => {
  try {
    // Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Generate a meaningful ID for this manager
    const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const customId = `manager-${restaurantId}-${nameSlug}`;
    
    // Add user to employees collection with custom ID
    await setDoc(doc(db, 'employees', customId), {
      name: name,
      email: email,
      jobTitle: 'Manager',
      discount: 40,
      restaurantId: restaurantId,
      restaurantName: getRestaurantName(restaurantId),
      createdAt: new Date(),
      updatedAt: new Date(),
      uid: user.uid
    });
    
    return user;
  } catch (error) {
    console.error("Error creating manager:", error);
    throw error;
  }
};

// For invites
export const sendEmployeeInvite = async (email, role = 'Employee', senderUid, restaurantId = null) => {
  try {
    let restaurantName = null;
    
    // If a restaurant ID is provided, get its name
    if (restaurantId) {
      restaurantName = getRestaurantName(restaurantId);
    } else {
      // Try to get sender's restaurant info
      const employeesRef = collection(db, 'employees');
      const q = query(employeesRef, where("uid", "==", senderUid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const senderData = querySnapshot.docs[0].data();
        restaurantId = senderData.restaurantId || null;
        restaurantName = senderData.restaurantName || null;
      }
    }
    
    // Generate a unique invite code
    const inviteCode = generateUniqueId();
    
    // Create a meaningful ID for this invite
    const emailSlug = email.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let customId = `invite-${emailSlug}`;
    
    if (restaurantId) {
      customId = `invite-${restaurantId}-${emailSlug}`;
    }
    
    // Create the invite record with a custom ID
    const inviteData = {
      email: email,
      role: role,
      status: 'pending',
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      senderUid: senderUid,
      restaurantId: restaurantId,
      restaurantName: restaurantName,
      code: inviteCode
    };
    
    await setDoc(doc(db, 'invites', customId), inviteData);
    
    // Generate magic link for email
    const actionCodeSettings = {
      url: `${window.location.origin}/complete-signup?mode=complete&email=${email}&inviteId=${inviteCode}`,
      handleCodeInApp: true
    };
    
    // Send the email invitation
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    
    return { success: true, inviteId: customId };
  } catch (error) {
    console.error("Error sending invite:", error);
    throw error;
  }
};

// Add this function to your firebase.js file
export const completeRegistration = async (name, password, inviteCode) => {
  try {
    // Get the email from localStorage
    const email = localStorage.getItem('emailForSignIn');
    if (!email) {
      throw new Error('No email found. Please restart the invitation process.');
    }
    
    // Find the invitation by code
    const invitesRef = collection(db, 'invites');
    const q = query(invitesRef, where("code", "==", inviteCode), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Invalid invitation code or email mismatch.');
    }
    
    const inviteData = querySnapshot.docs[0].data();
    const inviteId = querySnapshot.docs[0].id;
    
    // Create the user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with display name
    await updateProfile(user, {
      displayName: name
    });
    
    // Add user to employees collection with appropriate role and restaurant
    await addDoc(collection(db, 'employees'), {
      name,
      email,
      jobTitle: inviteData.role,
      restaurantId: inviteData.restaurantId,
      restaurantName: getRestaurantName(inviteData.restaurantId), // Make sure this function is accessible
      discount: inviteData.role === 'Manager' ? 40 : 20, // Default discounts
      createdAt: new Date(),
      updatedAt: new Date(),
      uid: user.uid
    });
    
    // Update invitation status
    await updateDoc(doc(db, 'invites', inviteId), {
      status: 'completed',
      completedAt: new Date()
    });
    
    // Clear localStorage
    localStorage.removeItem('emailForSignIn');
    
    return user;
  } catch (error) {
    console.error("Error completing registration:", error);
    throw error;
  }
};

// Modify the sendManagerInvite function to direct to the signup page
export const sendManagerInvite = async (email, role, senderUid, restaurantId) => {
  try {
    // Generate a unique invite code
    const inviteCode = generateUniqueId();
    
    // Store the invitation in Firestore without checking for sender in employees database
    const inviteRef = await addDoc(collection(db, 'invites'), {
      email,
      role,
      senderUid, // Keep this for tracking, but don't validate against employees
      restaurantId,
      status: 'pending',
      createdAt: new Date(),
      code: inviteCode
    });
    
    // Generate magic link for email - notice the updated URL format
    const actionCodeSettings = {
      url: `${window.location.origin}/complete-signup?mode=complete&email=${email}&inviteId=${inviteCode}`,
      handleCodeInApp: true
    };
    
    // Send the email invitation
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    
    return inviteRef.id;
  } catch (error) {
    console.error("Error sending manager invite:", error);
    throw error;
  }
};

// Enhanced getRestaurantName function
export const getRestaurantName = (restaurantId) => {
  if (!restaurantId) return "No Restaurant Assigned";
  
  const RESTAURANTS = [
    { id: "montanas", name: "Montana's" },
    { id: "kelseys", name: "Kelsey's" },
    { id: "coras", name: "Cora's Breakfast" },
    { id: "js-roadhouse", name: "J's Roadhouse" },
    { id: "swiss-chalet", name: "Swiss Chalet" },
    {
      id: "overtime-bar",
      name: "Overtime Bar",
      locations: [
        { id: "overtime-sudbury", name: "Sudbury" },
        { id: "overtime-val-caron", name: "Val Caron" },
        { id: "overtime-chelmsford", name: "Chelmsford" }
      ]
    },
    { id: "lot-88", name: "Lot 88 Steakhouse" },
    { id: "poke-bar", name: "Poke Bar" },
    {
      id: "happy-life",
      name: "Happy Life",
      locations: [
        { id: "happy-life-kingsway", name: "Kingsway" },
        { id: "happy-life-val-caron", name: "Val Caron" },
        { id: "happy-life-chelmsford", name: "Chelmsford" }
      ]
    }
  ];
  
  // First check if it's a direct restaurant match
  const restaurant = RESTAURANTS.find(r => r.id === restaurantId);
  if (restaurant) {
    return restaurant.name;
  }
  
  // Then check for a location within a restaurant
  for (const r of RESTAURANTS) {
    if (r.locations) {
      const location = r.locations.find(l => l.id === restaurantId);
      if (location) {
        return `${r.name} - ${location.name}`;
      }
    }
  }
  
  return "Unknown Restaurant";
};


// Helper function to generate a unique ID for invites
export const generateUniqueId = () => {
  // Generate a random string of characters
  const randomPart = Math.random().toString(36).substring(2, 15);
  // Add a timestamp to ensure uniqueness
  const timestampPart = Date.now().toString(36);
  
  return `${randomPart}${timestampPart}`;
};


// Add a function to get employees by restaurant
export const getEmployeesByRestaurant = async (restaurantId) => {
  const q = query(employeesCollection, where("restaurantId", "==", restaurantId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Add a subscribe function for restaurant-specific employees
export const subscribeToRestaurantEmployees = (callback, restaurantId) => {
  const q = query(employeesCollection, where("restaurantId", "==", restaurantId));
  return onSnapshot(q, (snapshot) => {
    const employeesData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(employeesData);
  });
};



// Auth functions
export const loginWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    throw error;
  }
};

export const createUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Employee CRUD operations
export const getEmployees = async () => {
  const snapshot = await getDocs(employeesCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};


export const updateEmployee = async (id, updatedData) => {
  try {
    const employeeDoc = doc(db, 'employees', id);
    await updateDoc(employeeDoc, updatedData);
    return { id, ...updatedData };
  } catch (error) {
    throw error;
  }
};

export const deleteEmployee = async (id) => {
  try {
    const employeeDoc = doc(db, 'employees', id);
    await deleteDoc(employeeDoc);
    return id;
  } catch (error) {
    throw error;
  }
};

// Watch for real-time changes to employees collection
export const subscribeToEmployees = (callback) => {
  return onSnapshot(employeesCollection, (snapshot) => {
    const employeesData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(employeesData);
  });
};

// Invite management
export const getInvites = async (status = null) => {
  let invitesQuery = invitesCollection;
  
  if (status) {
    invitesQuery = query(invitesCollection, where("status", "==", status));
  }
  
  const snapshot = await getDocs(invitesQuery);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const subscribeToInvites = (callback, status = null) => {
  let invitesQuery = invitesCollection;
  
  if (status) {
    invitesQuery = query(invitesCollection, where("status", "==", status));
  }
  
  return onSnapshot(invitesQuery, (snapshot) => {
    const invitesData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(invitesData);
  });
};

// Restaurant functions
export const getRestaurants = async () => {
  const snapshot = await getDocs(restaurantsCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const subscribeToRestaurants = (callback) => {
  return onSnapshot(restaurantsCollection, (snapshot) => {
    const restaurantsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(restaurantsData);
  });
};

// Add these functions to firebase.js

// Get a list of restaurants managed by a user
export const getRestaurantsByManager = async (userId) => {
  try {
    // Direct restaurant management (regular managers)
    const employeesRef = collection(db, 'employees');
    const employeeSnapshot = await getDoc(doc(employeesRef, userId));
    
    if (!employeeSnapshot.exists()) {
      throw new Error('User not found');
    }
    
    const userData = employeeSnapshot.data();
    
    // For General Managers, return the array of managed restaurants
    if (userData.jobTitle === 'General Manager' && userData.managedRestaurants) {
      return userData.managedRestaurants;
    }
    
    // For regular managers, return their single restaurant
    if (userData.restaurantId) {
      return [userData.restaurantId];
    }
    
    // For admins or if no restaurants are assigned
    return [];
  } catch (error) {
    console.error("Error fetching managed restaurants:", error);
    throw error;
  }
};

// Assign a restaurant to a General Manager
export const assignRestaurantToManager = async (managerId, restaurantId, adminUserId) => {
  try {
    // Get the manager's document
    const managerRef = doc(db, 'employees', managerId);
    const managerSnapshot = await getDoc(managerRef);
    
    if (!managerSnapshot.exists()) {
      throw new Error('Manager not found');
    }
    
    const managerData = managerSnapshot.data();
    
    // If not already a General Manager, update the role
    if (managerData.jobTitle !== 'General Manager') {
      await updateDoc(managerRef, {
        jobTitle: 'General Manager',
        updatedAt: new Date()
      });
    }
    
    // Add the restaurant to the managedRestaurants array if not already present
    const managedRestaurants = managerData.managedRestaurants || [];
    if (!managedRestaurants.includes(restaurantId)) {
      await updateDoc(managerRef, {
        managedRestaurants: [...managedRestaurants, restaurantId],
        updatedAt: new Date()
      });
    }
    
    // Add a record to the restaurantAccess collection
    const accessRef = collection(db, 'restaurantAccess');
    await addDoc(accessRef, {
      userId: managerId,
      restaurantId: restaurantId,
      accessLevel: 'general_manager',
      grantedBy: adminUserId,
      grantedAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error("Error assigning restaurant to manager:", error);
    throw error;
  }
};

// Remove a restaurant assignment from a General Manager
export const removeRestaurantFromManager = async (managerId, restaurantId) => {
  try {
    // Get the manager's document
    const managerRef = doc(db, 'employees', managerId);
    const managerSnapshot = await getDoc(managerRef);
    
    if (!managerSnapshot.exists()) {
      throw new Error('Manager not found');
    }
    
    const managerData = managerSnapshot.data();
    
    // Remove the restaurant from the managedRestaurants array
    const managedRestaurants = managerData.managedRestaurants || [];
    const updatedRestaurants = managedRestaurants.filter(id => id !== restaurantId);
    
    await updateDoc(managerRef, {
      managedRestaurants: updatedRestaurants,
      updatedAt: new Date()
    });
    
    // If they no longer manage any restaurants, downgrade to regular manager
    if (updatedRestaurants.length === 0) {
      await updateDoc(managerRef, {
        jobTitle: 'Manager',
        updatedAt: new Date()
      });
    }
    
    // Delete the record from the restaurantAccess collection
    const accessRef = collection(db, 'restaurantAccess');
    const q = query(accessRef, 
      where("userId", "==", managerId),
      where("restaurantId", "==", restaurantId)
    );
    
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
    
    return true;
  } catch (error) {
    console.error("Error removing restaurant from manager:", error);
    throw error;
  }
};

// Subscribe to all restaurants a user can manage
export const subscribeToManagerRestaurants = (callback, userId) => {
  // First, get the user document to check their role
  const userRef = doc(db, 'employees', userId);
  
  return onSnapshot(userRef, (userDoc) => {
    if (!userDoc.exists()) {
      callback([]);
      return;
    }
    
    const userData = userDoc.data();
    
    // If they're an admin, subscribe to all restaurants
    if (userData.jobTitle === 'Admin') {
      const restaurantsRef = collection(db, 'restaurants');
      onSnapshot(restaurantsRef, (snapshot) => {
        const restaurantsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(restaurantsData);
      });
      return;
    }
    
    // If they're a General Manager, get their managed restaurants
    if (userData.jobTitle === 'General Manager' && userData.managedRestaurants && userData.managedRestaurants.length > 0) {
      callback(userData.managedRestaurants);
      return;
    }
    
    // For regular managers, return their single restaurant
    if (userData.restaurantId) {
      callback([userData.restaurantId]);
      return;
    }
    
    // Default case - no managed restaurants
    callback([]);
  });
};

// Modified sendManagerInvite function to support multiple restaurants
export const sendMultiRestaurantManagerInvite = async (email, role, senderUid, restaurantIds) => {
  try {
    // Generate a unique invite code
    const inviteCode = generateUniqueId();
    
    // Store the invitation in Firestore
    const inviteRef = await addDoc(collection(db, 'invites'), {
      email,
      role,
      senderUid,
      restaurantIds, // Array of restaurant IDs
      status: 'pending',
      createdAt: new Date(),
      code: inviteCode
    });
    
    // Generate magic link for email
    const actionCodeSettings = {
      url: `${window.location.origin}/complete-signup?mode=complete&email=${email}&inviteId=${inviteCode}`,
      handleCodeInApp: true
    };
    
    // Send the email invitation
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    
    return inviteRef.id;
  } catch (error) {
    console.error("Error sending multi-restaurant manager invite:", error);
    throw error;
  }
};

// Modified completeRegistration to handle multi-restaurant invites
// Add this logic to the completeRegistration function
// This would be part of the existing function, not a separate one

  // Check if it's a multi-restaurant invite
  if (inviteData.restaurantIds && inviteData.restaurantIds.length > 0) {
    // For General Manager role, add to managedRestaurants
    if (inviteData.role === 'General Manager') {
      await addDoc(collection(db, 'employees'), {
        name,
        email,
        jobTitle: 'General Manager',
        managedRestaurants: inviteData.restaurantIds,
        discount: 40,
        createdAt: new Date(),
        updatedAt: new Date(),
        uid: user.uid
      });
      
      // Also add individual access records
      for (const restaurantId of inviteData.restaurantIds) {
        await addDoc(collection(db, 'restaurantAccess'), {
          userId: user.uid,
          restaurantId: restaurantId,
          accessLevel: 'general_manager',
          grantedBy: inviteData.senderUid,
          grantedAt: new Date()
        });
      }
    } else {
      // Regular manager with just one restaurant
      await addDoc(collection(db, 'employees'), {
        name,
        email,
        jobTitle: inviteData.role,
        restaurantId: inviteData.restaurantIds[0],
        restaurantName: getRestaurantName(inviteData.restaurantIds[0]),
        discount: inviteData.role === 'Manager' ? 40 : 20,
        createdAt: new Date(),
        updatedAt: new Date(),
        uid: user.uid
      });
    }
  }
