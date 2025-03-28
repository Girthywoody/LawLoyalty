// firebase.js
import { deleteUser as firebaseDeleteUser } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { setPersistence, browserLocalPersistence } from 'firebase/auth';


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
  sendPasswordResetEmail,
  sendEmailVerification

} from 'firebase/auth';


const firebaseConfig = {
    apiKey: "AIzaSyCC9Bzela9Mhs2raQ0cQCSWJdm-GjnJvGg",
    authDomain: "law-loyalty.firebaseapp.com",
    projectId: "law-loyalty",
    storageBucket: "law-loyalty.firebasestorage.app",
    messagingSenderId: "18898180139",
    appId: "1:18898180139:web:115ada8b7ab0d8a9edb26e",
    measurementId: "G-XTKBQK7L33"
};


// After initializing the Firebase app


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);




// Collection references
const employeesCollection = collection(db, 'employees');
const restaurantsCollection = collection(db, 'restaurants');
const invitesCollection = collection(db, 'invites');


export { db, auth, storage, isSignInWithEmailLink, sendPasswordResetEmail, sendEmailVerification, browserLocalPersistence};

setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });
  

export const addEmployee = async (employeeData) => {
  try {
    // Create a copy with normalized email
    const normalizedData = {
      ...employeeData,
      email: employeeData.email.toLowerCase()
    };
    
    // Create a meaningful ID based on name and restaurant (if available)
    const nameSlug = normalizedData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let customId = `employee-${nameSlug}`;
    
    if (normalizedData.restaurantId) {
      customId = `${normalizedData.restaurantId}-${nameSlug}`;
    }
    
    // Check if a document with this ID already exists
    const docRef = doc(db, 'employees', customId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Append a timestamp if the ID already exists
      customId += `-${Date.now()}`;
    }
    
    // Remove discount field from employee data
    const { discount, ...employeeDataWithoutDiscount } = normalizedData;
    
    // Use setDoc with a custom ID instead of addDoc
    await setDoc(doc(db, 'employees', customId), {
      ...employeeDataWithoutDiscount,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return {
      id: customId,
      ...employeeDataWithoutDiscount
    };
  } catch (error) {
    console.error("Error adding employee:", error);
    throw error;
  }
};

export const deleteEmployee = async (id) => {
  try {
    // First, get the employee data to retrieve the uid
    const employeeDoc = doc(db, 'employees', id);
    const employeeSnapshot = await getDoc(employeeDoc);
    
    if (!employeeSnapshot.exists()) {
      throw new Error('Employee not found');
    }
    
    const employeeData = employeeSnapshot.data();
    
    // If the employee has a uid, delete from Authentication
    if (employeeData.uid) {
      try {
        // Get the user reference
        // Note: This can only delete the currently signed-in user, so for admin functions
        // you'd need a Firebase Admin SDK server-side implementation for complete deletion
        // This is a limitation of the client-side Firebase SDK
        
        // However, we can mark the account for deletion in the database
        await updateDoc(employeeDoc, {
          status: 'deleted',
          deletedAt: new Date(),
          active: false
        });
      } catch (authError) {
        console.error("Error deleting user from Authentication:", authError);
        // Continue with Firestore deletion even if Auth deletion fails
      }
    }
    
    // Delete from Firestore
    await deleteDoc(employeeDoc);
    
    return id;
  } catch (error) {
    console.error("Error deleting employee:", error);
    throw error;
  }
};

// Add a new function to handle declining applications
export const declineEmployeeApplication = async (id) => {
  try {
    // First, get the employee data to retrieve the uid
    const employeeDoc = doc(db, 'employees', id);
    const employeeSnapshot = await getDoc(employeeDoc);
    
    if (!employeeSnapshot.exists()) {
      throw new Error('Employee application not found');
    }
    
    const employeeData = employeeSnapshot.data();
    
    // Update the status to rejected
    await updateDoc(employeeDoc, {
      status: 'rejected',
      updatedAt: new Date()
    });
    
    // Since we can't delete the Authentication account directly from client-side code,
    // you would need a Firebase Admin SDK server implementation to fully delete the auth account
    // As a workaround, you can mark the account as rejected in the database
    
    return id;
  } catch (error) {
    console.error("Error declining employee application:", error);
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

export const sendEmployeeInvite = async (email, role = 'Employee', senderUid, restaurantId = null) => {
  try {
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();
    
    // Rest of the function remains the same but uses normalizedEmail instead of email
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
    const emailSlug = normalizedEmail.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let customId = `invite-${emailSlug}`;
    
    if (restaurantId) {
      customId = `invite-${restaurantId}-${emailSlug}`;
    }
    
    // Create the invite record with a custom ID
    const inviteData = {
      email: normalizedEmail,
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
      url: `${window.location.origin}/complete-signup?mode=complete&email=${normalizedEmail}&inviteId=${inviteCode}`,
      handleCodeInApp: true
    };
    
    // Send the email invitation
    await sendSignInLinkToEmail(auth, normalizedEmail, actionCodeSettings);
    
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
    { id: "montanas-sudbury", name: "Montana's Sudbury"},
    { id: "montanas-orillia", name: "Montana's Orillia"},
    { id: "kelseys-sudbury", name: "Kelsey's Sudbury"},
    { id: "kelseys-orillia", name: "Kelsey's Orillia"},
    { id: "east-side-marios-orillia", name: "East Side Mario's Orillia"},
    { id: "coras", name: "Cora's Breakfast"},
    { id: "js-roadhouse", name: "J's Roadhouse"},
    { id: "swiss-chalet", name: "Swiss Chalet"},
    { id: "poke-bar", name: "Poke Bar"},
    { id: "lot88-sudbury", name: "Lot88 Sudbury"},
    { id: "lot88-timmins", name: "Lot88 Timmins"},
    { id: "lot88-orillia", name: "Lot88 Orillia"},
    { id: "lot88-north-bay", name: "Lot88 North Bay"},
    { id: "lot88-thunder-bay", name: "Lot88 Thunder Bay"},
    { id: "lot88-burlington", name: "Lot88 Burlington"},
    { id: "overtime-sudbury", name: "Overtime Sudbury"},
    { id: "overtime-val-caron", name: "Overtime Val Caron"},
    { id: "overtime-chelmsford", name: "Overtime Chelmsford"},
    { id: "happy-life-kingsway", name: "Happy Life Kingsway"},
    { id: "happy-life-val-caron", name: "Happy Life Val Caron"},
    { id: "happy-life-chelmsford", name: "Happy Life Chelmsford"},
    { id: "happy-life-timmins", name: "Happy Life Timmins"},
    { id: "happy-life-lakeshore", name: "Happy Life Lakeshore"},
    { id: "happy-life-alqonquin", name: "Happy Life Alqonquin"},
    { id: "happy-life-espanola", name: "Happy Life Espanola"},
    { id: "jlaw-workers", name: "JLaw Workers"}
  ]
  
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


export const loginWithEmailAndPassword = async (email, password) => {
  try {
    // Convert email to lowercase before authentication
    const normalizedEmail = email.toLowerCase();
    
    // First try exact match with provided email
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      // If that fails, try with normalized email
      userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    }
    
    // Query Firestore to get the user's role information
    const employeesRef = collection(db, 'employees');
    
    // Try both original and lowercase email in the query
    const q1 = query(employeesRef, where("email", "==", email));
    const q2 = query(employeesRef, where("email", "==", normalizedEmail));
    
    let querySnapshot = await getDocs(q1);
    
    // If no results with original email, try lowercase
    if (querySnapshot.empty) {
      querySnapshot = await getDocs(q2);
    }
    
    if (querySnapshot.empty) {
      throw new Error('User not found in employees database');
    }
    
    // Get the employee data
    const employeeData = querySnapshot.docs[0].data();
    
    // Also update the email in the employee record to be lowercase for future logins
    if (email !== normalizedEmail && email === employeeData.email) {
      const employeeDoc = doc(db, 'employees', querySnapshot.docs[0].id);
      await updateDoc(employeeDoc, {
        email: normalizedEmail,
        updatedAt: new Date()
      });
    }
    
    // Rest of your function remains the same
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
    // Convert email to lowercase during account creation
    const normalizedEmail = email.toLowerCase();
    const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
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


// Assign a restaurant to a manager
export const assignRestaurantToManager = async (managerId, restaurantId, adminId) => {
  try {
    const employeeDoc = doc(db, 'employees', managerId);
    
    // Get current employee data
    const employeeSnap = await getDoc(employeeDoc);
    if (!employeeSnap.exists()) {
      throw new Error('Manager not found');
    }
    
    const employeeData = employeeSnap.data();
    
    // Create or update the managedRestaurants array
    const managedRestaurants = employeeData.managedRestaurants || [];
    
    // Only add if not already assigned
    if (!managedRestaurants.includes(restaurantId)) {
      managedRestaurants.push(restaurantId);
    }
    
    // Update the employee document
    await updateDoc(employeeDoc, {
      managedRestaurants: managedRestaurants,
      jobTitle: 'General Manager', // Upgrade to General Manager
      updatedAt: new Date(),
      updatedBy: adminId
    });
    
    return true;
  } catch (error) {
    console.error("Error assigning restaurant to manager:", error);
    throw error;
  }
};

// Remove a restaurant from a manager
export const removeRestaurantFromManager = async (managerId, restaurantId) => {
  try {
    const employeeDoc = doc(db, 'employees', managerId);
    
    // Get current employee data
    const employeeSnap = await getDoc(employeeDoc);
    if (!employeeSnap.exists()) {
      throw new Error('Manager not found');
    }
    
    const employeeData = employeeSnap.data();
    
    // Remove restaurant from the managedRestaurants array
    const managedRestaurants = employeeData.managedRestaurants || [];
    const updatedRestaurants = managedRestaurants.filter(id => id !== restaurantId);
    
    const updateData = {
      managedRestaurants: updatedRestaurants,
      updatedAt: new Date()
    };
    
    // If no restaurants left, downgrade to regular Manager
    if (updatedRestaurants.length === 0) {
      updateData.jobTitle = 'Manager';
    }
    
    // Update the employee document
    await updateDoc(employeeDoc, updateData);
    
    return true;
  } catch (error) {
    console.error("Error removing restaurant from manager:", error);
    throw error;
  }
};

// Add this function to let General Managers fetch employees from all their assigned restaurants
export const getEmployeesForGeneralManager = async (managedRestaurantIds) => {
  try {
    // Create an array to hold all employees
    let allEmployees = [];
    
    // For each managed restaurant, fetch its employees
    for (const restaurantId of managedRestaurantIds) {
      const q = query(collection(db, 'employees'), where("restaurantId", "==", restaurantId));
      const querySnapshot = await getDocs(q);
      
      const restaurantEmployees = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      allEmployees = [...allEmployees, ...restaurantEmployees];
    }
    
    return allEmployees;
  } catch (error) {
    console.error("Error fetching employees for general manager:", error);
    throw error;
  }
};