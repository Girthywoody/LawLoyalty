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
  updatePassword
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
    // Get the sender's restaurant assignment
    const employeesRef = collection(db, 'employees');
    const q = query(employeesRef, where("uid", "==", senderUid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Sender not found in employees database');
    }
    
    const senderData = querySnapshot.docs[0].data();
    const restaurantId = senderData.restaurantId || null;
    const restaurantName = senderData.restaurantName || null;
    
    // Create the invite record with restaurant info
    const inviteData = {
      email: email,
      role: role,
      status: 'pending',
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
      senderUid: senderUid,
      restaurantId: restaurantId,
      restaurantName: restaurantName
    };
    
    const inviteRef = await addDoc(invitesCollection, inviteData);
    const inviteId = inviteRef.id;
    
    // Get the dynamic URL for the sign-in page
    const origin = window.location.origin;
    const completeUrl = `${origin}/complete-signup?inviteId=${inviteId}&email=${encodeURIComponent(email)}`;
    
    // Action code settings
    const actionCodeSettings = {
      url: completeUrl,
      handleCodeInApp: true,
    };
    
    // Send the email with the link
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    
    return { success: true, inviteId };
  } catch (error) {
    console.error("Error sending invite:", error);
    throw error;
  }
};

// Modify the completeRegistration function to include restaurant info
export const completeRegistration = async (name, password, inviteId) => {
  try {
    // Check if the link is a sign-in with email link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      // Get the email from localStorage
      let email = localStorage.getItem('emailForSignIn');
      
      // If email not found in localStorage, try to get it from URL
      if (!email) {
        const urlParams = new URLSearchParams(window.location.search);
        email = urlParams.get('email');
        
        if (!email) {
          throw new Error('Email not found. Please reopen the invite link from your email.');
        }
        
        // Save it to localStorage for the authentication process
        localStorage.setItem('emailForSignIn', email);
      }
      
      // Sign in with email link
      const userCredential = await signInWithEmailLink(auth, email, window.location.href);
      const user = userCredential.user;
      
      // Update the user's password
      await updatePassword(user, password);
      
      // Get the invite details
      const inviteDoc = doc(db, 'invites', inviteId);
      const inviteSnap = await getDoc(inviteDoc);
      
      if (!inviteSnap.exists()) {
        throw new Error('Invite not found');
      }
      
      const invite = inviteSnap.data();
      
      // Add the user to the employees collection
      await addEmployee({
        name: name,
        email: email,
        jobTitle: invite.role,
        discount: invite.role === 'Manager' ? 40 : 20,
        restaurantId: invite.restaurantId, // Include restaurant ID
        restaurantName: invite.restaurantName, // Include restaurant name
        createdAt: new Date(),
        updatedAt: new Date(),
        uid: user.uid
      });
      
      // Update the invite status
      await updateDoc(inviteDoc, {
        status: 'accepted',
        acceptedAt: new Date()
      });
      
      // Clear email from localStorage
      localStorage.removeItem('emailForSignIn');
      
      return user;
    } else {
      throw new Error('Invalid sign-in link');
    }
  } catch (error) {
    console.error("Complete registration error:", error);
    throw error;
  }
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

