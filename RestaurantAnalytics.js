import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, limit } from 'firebase/firestore';

// Collection name for restaurant visits
const VISITS_COLLECTION = 'restaurantVisits';

// Record a new restaurant visit
export const recordRestaurantVisit = async (userId, employeeRestaurant, selectedRestaurant) => {
  try {
    await addDoc(collection(db, VISITS_COLLECTION), {
      userId,
      employeeRestaurant, // Where the employee works
      visitedRestaurant: selectedRestaurant, // Where they're dining
      timestamp: Timestamp.now(),
      // Track the 3-hour cooldown period
      cooldownUntil: Timestamp.fromDate(new Date(Date.now() + 3 * 60 * 60 * 1000))
    });
    
    return true;
  } catch (error) {
    console.error("Error recording restaurant visit:", error);
    throw error;
  }
};

// Check if user is in cooldown period
export const checkCooldownPeriod = async (userId) => {
  try {
    const visitsRef = collection(db, VISITS_COLLECTION);
    const q = query(
      visitsRef,
      where("userId", "==", userId),
      where("cooldownUntil", ">", Timestamp.now()),
      orderBy("cooldownUntil", "desc"),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { inCooldown: false };
    }
    
    const data = snapshot.docs[0].data();
    return { 
      inCooldown: true, 
      cooldownUntil: data.cooldownUntil.toDate(),
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