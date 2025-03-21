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

// Configure actionCodeSettings for the email link
const actionCodeSettings = {
  // URL you want to redirect to after email verification
  url: window.location.origin + '/complete-signup',
  handleCodeInApp: true,
  // Additional settings to make the email look more professional
  iOS: {
    bundleId: 'com.restaurantgroup.loyalty'
  },
  android: {
    packageName: 'com.restaurantgroup.loyalty',
    installApp: true
  },
  dynamicLinkDomain: 'restaurantloyalty.page.link'
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

// Send invite with email link - updated to create a simpler welcome email
export const sendEmployeeInvite = async (email, role = 'Employee', senderUid) => {
  try {
    // Create the invite record first
    const inviteData = {
      email: email,
      role: role, // 'Employee' or 'Manager'
      status: 'pending',
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
      senderUid: senderUid
    };
    
    const inviteRef = await addDoc(invitesCollection, inviteData);
    const inviteId = inviteRef.id;
    
    // Save the email to localStorage to be retrieved when the link is clicked
    // In a real implementation, this would be saved server-side or handled in the email verification flow
    localStorage.setItem('emailForSignIn', email);
    
    // Save the invite ID in the URL
    const finalUrl = actionCodeSettings.url + `?inviteId=${inviteId}`;
    const customActionCodeSettings = {
      ...actionCodeSettings,
      url: finalUrl
    };
    
    // Send the email - Firebase will handle this with a default template
    // We use sendSignInLinkToEmail which creates a passwordless sign-in link
    await sendSignInLinkToEmail(auth, email, customActionCodeSettings);
    
    // In a full implementation, you'd use Firebase Functions or a backend server
    // to send fully customized HTML emails with your branding
    
    return { success: true, inviteId };
  } catch (error) {
    throw error;
  }
};

// Complete registration with email link
export const completeRegistration = async (name, password, inviteId) => {
  try {
    // Check if the link is a sign-in with email link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      // Get the email from localStorage
      let email = localStorage.getItem('emailForSignIn');
      
      // If email not found in localStorage, prompt user for it
      if (!email) {
        // This would be handled by your UI
        throw new Error('Email not found. Please reopen the invite link from your email.');
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

export { db, auth };