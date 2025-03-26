import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, limit, onSnapshot } from 'firebase/firestore';

// Collection name for restaurant visits
const VISITS_COLLECTION = 'restaurantVisits';

// Record a new restaurant visit and set a 15-minute cooldown
export const recordRestaurantVisit = async (userId, employeeRestaurant, selectedRestaurant) => {
  try {
    // Calculate cooldown time (15 minutes from now)
    const cooldownUntil = new Date(Date.now() + 15 * 60 * 1000);
    
    await addDoc(collection(db, VISITS_COLLECTION), {
      userId,
      employeeRestaurant, // Where the employee works
      visitedRestaurant: selectedRestaurant, // Where they're dining
      timestamp: Timestamp.now(),
      // Track the 15-minute cooldown period
      cooldownUntil: Timestamp.fromDate(cooldownUntil)
    });
    
    return true;
  } catch (error) {
    console.error("Error recording restaurant visit:", error);
    throw error;
  }
};

// Check if user is in cooldown period - this function now uses realtime updates
export const subscribeToUserCooldown = (userId, callback) => {
  try {
    const visitsRef = collection(db, VISITS_COLLECTION);
    const q = query(
      visitsRef,
      where("userId", "==", userId),
      orderBy("cooldownUntil", "desc"),
      limit(1)
    );
    
    // Use onSnapshot to listen for changes in realtime
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback({ inCooldown: false });
        return;
      }
      
      const data = snapshot.docs[0].data();
      const cooldownUntil = data.cooldownUntil.toDate();
      const now = new Date();
      
      // Check if the cooldown period is still active
      const inCooldown = cooldownUntil > now;
      
      callback({ 
        inCooldown, 
        cooldownUntil: data.cooldownUntil.toDate(),
        visitedRestaurant: data.visitedRestaurant
      });
    });
  } catch (error) {
    console.error("Error checking cooldown period:", error);
    throw error;
  }
};

// For backward compatibility, maintain the original function but update it
// to check the most recent cooldown period
export const checkCooldownPeriod = async (userId) => {
  try {
    const visitsRef = collection(db, VISITS_COLLECTION);
    const q = query(
      visitsRef,
      where("userId", "==", userId),
      orderBy("cooldownUntil", "desc"),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { inCooldown: false };
    }
    
    const data = snapshot.docs[0].data();
    const cooldownUntil = data.cooldownUntil.toDate();
    const now = new Date();
    
    // Check if the cooldown period is still active
    const inCooldown = cooldownUntil > now;
    
    return { 
      inCooldown, 
      cooldownUntil: cooldownUntil,
      visitedRestaurant: data.visitedRestaurant
    };
  } catch (error) {
    console.error("Error checking cooldown period:", error);
    throw error;
  }
};

// Get total visits per restaurant
export const getRestaurantVisitCounts = async (startDate = null, endDate = null) => {
  try {
    let q;
    const visitsRef = collection(db, VISITS_COLLECTION);
    
    if (startDate && endDate) {
      q = query(
        visitsRef,
        where("timestamp", ">=", Timestamp.fromDate(startDate)),
        where("timestamp", "<=", Timestamp.fromDate(endDate))
      );
    } else {
      q = query(visitsRef);
    }
    
    const snapshot = await getDocs(q);
    
    // Count visits per restaurant
    const visitCounts = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      const restaurant = data.visitedRestaurant;
      
      if (!visitCounts[restaurant]) {
        visitCounts[restaurant] = 0;
      }
      
      visitCounts[restaurant]++;
    });
    
    return visitCounts;
  } catch (error) {
    console.error("Error getting restaurant visit counts:", error);
    throw error;
  }
};

// Get traffic flow between restaurants
export const getRestaurantTrafficFlow = async (startDate = null, endDate = null) => {
  try {
    let q;
    const visitsRef = collection(db, VISITS_COLLECTION);
    
    if (startDate && endDate) {
      q = query(
        visitsRef,
        where("timestamp", ">=", Timestamp.fromDate(startDate)),
        where("timestamp", "<=", Timestamp.fromDate(endDate))
      );
    } else {
      q = query(visitsRef);
    }
    
    const snapshot = await getDocs(q);
    
    // Track traffic from employee's restaurant to visited restaurant
    const trafficFlow = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const from = data.employeeRestaurant;
      const to = data.visitedRestaurant;
      
      // Skip if they're dining at their own restaurant
      if (from === to) return;
      
      const key = `${from}→${to}`;
      
      if (!trafficFlow[key]) {
        trafficFlow[key] = {
          from,
          to,
          count: 0
        };
      }
      
      trafficFlow[key].count++;
    });
    
    return Object.values(trafficFlow).sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error("Error getting restaurant traffic flow:", error);
    throw error;
  }
};