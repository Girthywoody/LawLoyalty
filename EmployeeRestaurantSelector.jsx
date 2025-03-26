import React, { useState, useEffect } from 'react';
import { Building, Clock } from 'lucide-react';
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
  const [timeLeft, setTimeLeft] = useState('');

  // Set an interval to update the countdown timer
  useEffect(() => {
    let intervalId = null;
    
    if (cooldownInfo && cooldownInfo.inCooldown) {
      setIsDisabled(true);
      
      // Update immediately
      updateCooldownMessage();
      
      // Then update every second
      intervalId = setInterval(() => {
        updateCooldownMessage();
      }, 1000);
    } else {
      setIsDisabled(false);
      setCooldownMessage('');
      setTimeLeft('');
    }
    
    function updateCooldownMessage() {
      const now = new Date();
      const cooldownEnds = new Date(cooldownInfo.cooldownUntil);
      
      if (cooldownEnds <= now) {
        // Cooldown has expired
        setIsDisabled(false);
        setCooldownMessage('');
        clearInterval(intervalId);
        return;
      }
      
      // Calculate minutes and seconds left
      const diffMs = cooldownEnds - now;
      const minutes = Math.floor(diffMs / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      // Format time left
      const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      setTimeLeft(formattedTime);
      setCooldownMessage(`You selected ${cooldownInfo.visitedRestaurant}. Please wait ${formattedTime} before selecting another restaurant.`);
    }
    
    // Clean up interval
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
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
        <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm flex items-center">
          <Clock size={16} className="mr-2 flex-shrink-0" />
          <span>{cooldownMessage}</span>
        </div>
      )}
    </div>
  );
};

export default EmployeeRestaurantSelector;