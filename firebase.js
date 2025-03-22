// firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot,
  getDoc
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
  updateProfile  // Add this missing import
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

export { db, auth, isSignInWithEmailLink };




// === STEP 1: Update firebase.js with restaurant assignments ===

// Add this to your firebase.js file
export const createManagerWithRestaurant = async (email, password, name, restaurantId) => {
  try {
    // Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Add user to employees collection as a manager with restaurant assignment
    await addEmployee({
      name: name,
      email: email,
      jobTitle: 'Manager',
      discount: 40,
      restaurantId: restaurantId, // Add restaurant assignment
      restaurantName: getRestaurantName(restaurantId), // We'll implement this function
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

// Helper function to get restaurant name by ID
export const getRestaurantName = (restaurantId) => {
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
  
  const restaurant = RESTAURANTS.find(r => r.id === restaurantId);
  
  if (restaurant) {
    return restaurant.name;
  }
  
  // For location-specific IDs
  for (const restaurant of RESTAURANTS) {
    if (restaurant.locations) {
      const location = restaurant.locations.find(l => l.id === restaurantId);
      if (location) {
        return `${restaurant.name} - ${location.name}`;
      }
    }
  }
  
  return "Unknown Restaurant";
};

// Modify the sendEmployeeInvite function to include restaurant assignment
export const sendEmployeeInvite = async (email, role = 'Employee', senderUid) => {
  try {
    let restaurantId = null;
    let restaurantName = null;
    
    // Try to get sender's restaurant info
    const employeesRef = collection(db, 'employees');
    const q = query(employeesRef, where("uid", "==", senderUid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const senderData = querySnapshot.docs[0].data();
      restaurantId = senderData.restaurantId || null;
      restaurantName = senderData.restaurantName || null;
    }
    
    // Generate a unique invite code
    const inviteCode = generateUniqueId();
    
    // Create the invite record
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
    
    const inviteRef = await addDoc(invitesCollection, inviteData);
    
    // Generate magic link for email - using the same URL format as manager invites
    const actionCodeSettings = {
      url: `${window.location.origin}/complete-signup?mode=complete&email=${email}&inviteId=${inviteCode}`,
      handleCodeInApp: true
    };
    
    // Send the email invitation
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    
    return { success: true, inviteId: inviteRef.id };
  } catch (error) {
    console.error("Error sending invite:", error);
    throw error;
  }
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

export const addEmployee = async (employeeData) => {
  try {
    const docRef = await addDoc(employeesCollection, employeeData);
    return {
      id: docRef.id,
      ...employeeData
    };
  } catch (error) {
    throw error;
  }
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