import React, { useState, useEffect } from 'react';
import { Store, ChevronDown } from 'lucide-react';

const RestaurantSelector = ({ currentUser, restaurants, onSelectRestaurant }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  // Add this function to handle restaurant selection
  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    onSelectRestaurant(restaurant);
    setShowDropdown(false);
  };

  // Initialize with current restaurant or first managed restaurant - only on first load
  useEffect(() => {
    if (!initialLoadDone && currentUser) {
      if (currentUser.jobTitle === 'General Manager' && currentUser.managedRestaurants?.length > 0) {
        // For general managers, start with the first managed restaurant
        const firstRestaurantId = currentUser.managedRestaurants[0];
        const restaurant = restaurants.find(r => r.id === firstRestaurantId) || 
                          { id: firstRestaurantId, name: "Unknown Restaurant" };
        
        setSelectedRestaurant(restaurant);
        onSelectRestaurant(restaurant);
      } else if (currentUser.restaurantId) {
        // For regular managers, use their assigned restaurant
        const restaurant = restaurants.find(r => r.id === currentUser.restaurantId) || 
                          { id: currentUser.restaurantId, name: currentUser.restaurantName || "Your Restaurant" };
        
        setSelectedRestaurant(restaurant);
        onSelectRestaurant(restaurant);
      }
      
      setInitialLoadDone(true);
    }
  }, [currentUser, restaurants, onSelectRestaurant, initialLoadDone]);
  
// Modify in RestaurantSelector.jsx
// Update the getAvailableRestaurants function:

const getAvailableRestaurants = () => {
  if (!currentUser) return [];
  
  // Get all restaurant data including nested locations
  const getAllRestaurantsWithLocations = () => {
    let result = [];
    
    restaurants.forEach(restaurant => {
      // Add the main restaurant
      result.push({ ...restaurant });
      
      // Add individual locations as separate entries if they exist
      if (restaurant.locations && restaurant.locations.length > 0) {
        restaurant.locations.forEach(location => {
          result.push({
            id: location.id,
            name: `${restaurant.name} - ${location.name}`,
            parentId: restaurant.id,
            isLocation: true
          });
        });
      }
    });
    
    return result;
  };
  
  const allRestaurantsWithLocations = getAllRestaurantsWithLocations();
  
  if (currentUser.jobTitle === 'Admin') {
    // Admins can see all restaurants and locations
    return allRestaurantsWithLocations;
  } else if (currentUser.jobTitle === 'General Manager' && currentUser.managedRestaurants) {
    // General managers can only see their assigned restaurants and locations
    return allRestaurantsWithLocations.filter(r => {
      const idToCheck = r.isLocation ? r.id : r.id;
      return currentUser.managedRestaurants.includes(idToCheck);
    });
  } else if (currentUser.restaurantId) {
    // Regular managers only see their one restaurant/location
    return allRestaurantsWithLocations.filter(r => 
      r.id === currentUser.restaurantId || 
      (r.parentId && r.parentId === currentUser.restaurantId)
    );
  }
  
  return [];
};

// Also update the initialization useEffect to handle location selection better:
useEffect(() => {
  if (!initialLoadDone && currentUser) {
    if (currentUser.jobTitle === 'General Manager' && currentUser.managedRestaurants?.length > 0) {
      // For general managers, start with the first managed restaurant
      const firstRestaurantId = currentUser.managedRestaurants[0];
      
      // Look for this ID in the restaurants array, including locations
      let selectedRestaurant = null;
      
      // First check main restaurants
      selectedRestaurant = restaurants.find(r => r.id === firstRestaurantId);
      
      // If not found, check locations
      if (!selectedRestaurant) {
        for (const restaurant of restaurants) {
          if (restaurant.locations) {
            const location = restaurant.locations.find(l => l.id === firstRestaurantId);
            if (location) {
              selectedRestaurant = {
                id: location.id,
                name: `${restaurant.name} - ${location.name}`
              };
              break;
            }
          }
        }
      }
      
      // If still not found, create a placeholder
      if (!selectedRestaurant) {
        selectedRestaurant = { id: firstRestaurantId, name: "Unknown Restaurant" };
      }
      
      setSelectedRestaurant(selectedRestaurant);
      onSelectRestaurant(selectedRestaurant);
    } else if (currentUser.restaurantId) {
      // For regular managers, use their assigned restaurant
      let selectedRestaurant = null;
      
      // First check main restaurants
      selectedRestaurant = restaurants.find(r => r.id === currentUser.restaurantId);
      
      // If not found, check locations
      if (!selectedRestaurant) {
        for (const restaurant of restaurants) {
          if (restaurant.locations) {
            const location = restaurant.locations.find(l => l.id === currentUser.restaurantId);
            if (location) {
              selectedRestaurant = {
                id: location.id,
                name: `${restaurant.name} - ${location.name}`
              };
              break;
            }
          }
        }
      }
      
      // If still not found, create a placeholder using the restaurant name from user data
      if (!selectedRestaurant) {
        selectedRestaurant = { 
          id: currentUser.restaurantId, 
          name: currentUser.restaurantName || "Your Restaurant" 
        };
      }
      
      setSelectedRestaurant(selectedRestaurant);
      onSelectRestaurant(selectedRestaurant);
    }
    
    setInitialLoadDone(true);
  }
}, [currentUser, restaurants, onSelectRestaurant, initialLoadDone]);
  
  
  // If user only has one restaurant, don't show selector
  if (currentUser?.jobTitle === 'Manager' || getAvailableRestaurants().length <= 1) {
    return null;
  }
  
  return (
    <div className="relative mb-4">
      <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Store size={20} className="text-indigo-600 mr-2" />
            <span className="font-medium text-gray-700">Current Restaurant:</span>
          </div>
          
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            {selectedRestaurant?.name || "Select Restaurant"}
            <ChevronDown size={16} className="ml-2" />
          </button>
        </div>
        
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="py-1">
              {getAvailableRestaurants().map((restaurant) => (
                <button
                  key={restaurant.id}
                  onClick={() => handleSelectRestaurant(restaurant)}
                  className={`w-full text-left px-4 py-2 hover:bg-indigo-50 ${
                    selectedRestaurant?.id === restaurant.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  {restaurant.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantSelector;