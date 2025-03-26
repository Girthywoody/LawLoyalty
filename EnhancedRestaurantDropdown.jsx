import React, { useState, useEffect, useRef } from 'react';
import { Store, MapPin, Search, ChevronDown, X } from 'lucide-react';

const EnhancedRestaurantDropdown = ({ 
  restaurants, 
  selectedRestaurant, 
  onSelectRestaurant,
  isDisabled = false, 
  placeholder = "Select a restaurant" 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSelections, setRecentSelections] = useState([]);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showDropdown && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showDropdown]);

  // Store recent selections in localStorage
  useEffect(() => {
    const storedRecents = localStorage.getItem('recentRestaurants');
    if (storedRecents) {
      setRecentSelections(JSON.parse(storedRecents));
    }
  }, []);

  const updateRecentSelections = (restaurant) => {
    const updatedRecents = [restaurant, ...recentSelections.filter(r => r.id !== restaurant.id)].slice(0, 3);
    setRecentSelections(updatedRecents);
    localStorage.setItem('recentRestaurants', JSON.stringify(updatedRecents));
  };

  const handleSelectRestaurant = (restaurant, locationName = null) => {
    let selection;
    
    if (locationName) {
      selection = {
        ...restaurant,
        name: `${restaurant.name} - ${locationName}`,
        locationName,
        id: restaurant.locations.find(l => l.name === locationName)?.id || restaurant.id
      };
    } else {
      selection = restaurant;
    }
    
    onSelectRestaurant(selection);
    setShowDropdown(false);
    setSearchQuery('');
    updateRecentSelections(selection);
  };

  const filteredRestaurants = () => {
    if (!searchQuery.trim()) return restaurants;
    
    const query = searchQuery.toLowerCase();
    return restaurants.filter(restaurant => {
      // Match restaurant name
      if (restaurant.name.toLowerCase().includes(query)) return true;
      
      // Match location names
      if (restaurant.locations) {
        return restaurant.locations.some(location => 
          location.name.toLowerCase().includes(query) || 
          `${restaurant.name} ${location.name}`.toLowerCase().includes(query)
        );
      }
      
      return false;
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !isDisabled && setShowDropdown(!showDropdown)}
        disabled={isDisabled}
        className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
          isDisabled 
            ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' 
            : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
        }`}
      >
        <div className="flex items-center text-left overflow-hidden">
          <Store size={18} className={`flex-shrink-0 mr-2 ${selectedRestaurant ? 'text-indigo-600' : 'text-gray-400'}`} />
          <span className={`truncate ${selectedRestaurant ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            {selectedRestaurant ? selectedRestaurant.name : placeholder}
          </span>
        </div>
        <ChevronDown size={18} className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${showDropdown ? 'transform rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Search box */}
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Search restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={16} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {/* Recent selections */}
            {recentSelections.length > 0 && !searchQuery && (
              <div className="px-3 pt-3 pb-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Selections</h3>
                <div className="space-y-1 mb-2">
                  {recentSelections.map((restaurant) => (
                    <button
                      key={`recent-${restaurant.id}`}
                      type="button"
                      className="w-full text-left px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md flex items-center gap-2 transition-colors duration-150"
                      onClick={() => handleSelectRestaurant(restaurant)}
                    >
                      <Store size={16} className="text-indigo-600 flex-shrink-0" />
                      <span className="truncate">{restaurant.name}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-100 my-2"></div>
              </div>
            )}

            {/* Main restaurant list */}
            <div className="p-1">
              {filteredRestaurants().length === 0 ? (
                <div className="text-center py-8 px-4 text-gray-500">
                  <Store size={24} className="mx-auto text-gray-300 mb-2" />
                  <p>No restaurants found matching "{searchQuery}"</p>
                </div>
              ) : (
                filteredRestaurants().map((restaurant) => (
                  <div key={restaurant.id} className="mb-1">
                    {!restaurant.locations ? (
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-md flex items-center gap-2 transition-colors duration-150"
                        onClick={() => handleSelectRestaurant(restaurant)}
                      >
                        <Store size={16} className="text-indigo-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{restaurant.name}</div>
                          <div className="text-xs text-gray-500">{restaurant.discount}% discount</div>
                        </div>
                      </button>
                    ) : (
                      <>
                        <div className="px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-md mb-1 flex items-center">
                          <Store size={14} className="text-indigo-600 mr-1.5" />
                          {restaurant.name}
                          <span className="ml-auto px-1.5 py-0.5 bg-indigo-100 rounded text-indigo-600 text-xs">{restaurant.discount}%</span>
                        </div>
                        <div className="ml-3 space-y-1 mb-2">
                          {restaurant.locations.map((location) => (
                            <button
                              key={location.id}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-md flex items-center gap-2 transition-colors duration-150"
                              onClick={() => handleSelectRestaurant(restaurant, location.name)}
                            >
                              <MapPin size={14} className="text-indigo-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">{location.name}</div>
                                <div className="text-xs text-gray-500">{location.discount}% discount</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedRestaurantDropdown;