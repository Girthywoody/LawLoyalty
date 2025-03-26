import React, { useState, useEffect } from 'react';
import { Building } from 'lucide-react';
import EnhancedRestaurantDropdown from './EnhancedRestaurantDropdown';

const EmployeeRestaurantSelector = ({ 
  restaurants, 
  currentUser, 
  selectedRestaurant,
  onSelectRestaurant,
  cooldownInfo
}) => {
  const [isDisabled, setIsDisabled] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState('');

  // Check for cooldown restrictions
  useEffect(() => {
    if (cooldownInfo && cooldownInfo.inCooldown) {
      const cooldownEnds = new Date(cooldownInfo.cooldownUntil);
      const hoursLeft = Math.ceil((cooldownEnds - new Date()) / (1000 * 60 * 60));
      const minutesLeft = Math.ceil((cooldownEnds - new Date()) / (1000 * 60)) % 60;
      
      setCooldownMessage(`You already selected ${cooldownInfo.visitedRestaurant}. Please wait ${hoursLeft}h ${minutesLeft}m before selecting another restaurant.`);
      setIsDisabled(true);
    } else {
      setIsDisabled(false);
      setCooldownMessage('');
    }
  }, [cooldownInfo]);

  // Filter restaurants based on user permissions
  const filteredRestaurants = () => {
    // Employee sees all restaurants
    return restaurants;
  };

  // Handle restaurant selection with confirmation
  const handleRestaurantSelect = (restaurant) => {
    // Check if in cooldown before selection
    if (cooldownInfo && cooldownInfo.inCooldown) {
      return; // Don't allow selection during cooldown
    }
    
    // Call parent handler for verification popup
    onSelectRestaurant(restaurant);
  };

  return (
    <div className="space-y-4">
      <label htmlFor="restaurant" className="flex items-center text-sm font-medium text-gray-700">
        <Building size={16} className="mr-1.5 text-gray-500" />
        Select Restaurant Location
      </label>
      
      <EnhancedRestaurantDropdown
        restaurants={filteredRestaurants()}
        selectedRestaurant={selectedRestaurant}
        onSelectRestaurant={handleRestaurantSelect}
        isDisabled={isDisabled}
        placeholder="Select a restaurant to use your discount"
      />
      
      {cooldownMessage && (
        <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          {cooldownMessage}
        </div>
      )}
    </div>
  );
};

export default EmployeeRestaurantSelector;