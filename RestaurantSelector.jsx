import React, { useState, useEffect } from 'react';
import { Store, ChevronDown } from 'lucide-react';

const RestaurantSelector = ({ currentUser, restaurants, onSelectRestaurant }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
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
  
  const getAvailableRestaurants = () => {
    if (!currentUser) return [];
    
    if (currentUser.jobTitle === 'Admin') {
      // Admins can see all restaurants
      return restaurants;
    } else if (currentUser.jobTitle === 'General Manager' && currentUser.managedRestaurants) {
      // General managers can only see their assigned restaurants (removing duplicates)
      const uniqueRestaurantIds = [...new Set(currentUser.managedRestaurants)];
      return uniqueRestaurantIds.map(id => {
        const restaurant = restaurants.find(r => r.id === id);
        return restaurant || { id, name: id }; // Fallback if restaurant not found
      });
    } else if (currentUser.restaurantId) {
      // Regular managers only see their one restaurant
      return restaurants.filter(restaurant => 
        restaurant.id === currentUser.restaurantId
      );
    }
    
    return [];
  };
  
// In App.jsx, replace the handleSelectRestaurant function in the employee view
const handleSelectRestaurant = (restaurant) => {
    // Check if the restaurant has locations
    const restaurantObj = RESTAURANTS.find(r => r.id === restaurant.id);
    
    if (restaurantObj && restaurantObj.locations) {
      // If the restaurant has locations, just set the selectedRestaurant but don't select a location yet
      setSelectedRestaurant(restaurantObj);
      // Expand the dropdown to show locations
      setShowRestaurantDropdown(true);
    } else {
      // If no locations, proceed as normal
      setSelectedRestaurant(restaurant);
      setSelectedLocation(restaurant.name);
      setShowRestaurantDropdown(false);
    }
  };
  
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