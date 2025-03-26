import React, { useState, useEffect } from 'react';
import { 
  User, Building, CheckCircle, XCircle, 
  Plus, Trash2, Shield, Store
} from 'lucide-react';
import { 
  getEmployees, 
  assignRestaurantToManager, 
  removeRestaurantFromManager
} from './firebase';

const GeneralManagerManagement = ({ currentUser }) => {
  const [managers, setManagers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch all manager-level users
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setIsLoading(true);
        const allEmployees = await getEmployees();
        const managerEmployees = allEmployees.filter(emp => 
          emp.jobTitle === 'Manager' || emp.jobTitle === 'General Manager'
        );
        setManagers(managerEmployees);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching managers:", error);
        showNotification("Failed to load managers", "error");
        setIsLoading(false);
      }
    };

    fetchManagers();
  }, []);

  // Load restaurant list once
  useEffect(() => {
    // Use the RESTAURANTS constant from your app
    const RESTAURANTS = [
      { id: "montanas-sudbury", name: "Montana's Sudbury"},
      { id: "montanas-orillia", name: "Montana's Orillia"},
      { id: "kelseys-sudbury", name: "Kelsey's Sudbury"},
      { id: "kelseys-orillia", name: "Kelsey's Orillia"},
      { id: "coras", name: "Cora's Breakfast"},
      { id: "js-roadhouse", name: "J's Roadhouse"},
      { id: "swiss-chalet", name: "Swiss Chalet"},
      { id: "poke-bar", name: "Poke Bar"},
      { id: "lot88-sudbury", name: "Lot88 Sudbury"},
      { id: "lot88-timmins", name: "Lot88 Timmins"},
      { id: "lot88-orillia", name: "Lot88 Orillia"},
      { id: "lot88-north-bay", name: "Lot88 North Bay"},
      { id: "lot88-thunder-bay", name: "Lot88 Thunder Bay"},
      { id: "lot88-burlington", name: "Lot88 Burlington"},
      { id: "overtime-sudbury", name: "Overtime Sudbury"},
      { id: "overtime-val-caron", name: "Overtime Val Caron"},
      { id: "overtime-chelmsford", name: "Overtime Chelmsford"},
      { id: "happy-life-kingsway", name: "Happy Life Kingsway"},
      { id: "happy-life-val-caron", name: "Happy Life Val Caron"},
      { id: "happy-life-chelmsford", name: "Happy Life Chelmsford"},
      { id: "happy-life-timmins", name: "Happy Life Timmins"},
      { id: "happy-life-lakeshore", name: "Happy Life Lakeshore"},
      { id: "happy-life-alqonquin", name: "Happy Life Alqonquin"},
      { id: "happy-life-espanola", name: "Happy Life Espanola"},
      { id: "jlaw-workers", name: "JLaw Workers"}
    ]
    setRestaurants(RESTAURANTS);
  }, []);

  // Handle assignment of restaurant to manager
  const handleAssignRestaurant = async () => {
    if (!selectedManager || !selectedRestaurant) {
      showNotification("Please select both a manager and a restaurant", "error");
      return;
    }

    try {
      setIsLoading(true);
      await assignRestaurantToManager(selectedManager.id, selectedRestaurant.id, currentUser.id);
      
      // Update the manager in the local state
      setManagers(prevManagers => {
        return prevManagers.map(manager => {
          if (manager.id === selectedManager.id) {
            // Update to General Manager if needed
            const updatedManager = { ...manager };
            
            if (manager.jobTitle !== 'General Manager') {
              updatedManager.jobTitle = 'General Manager';
            }
            
            // Add the restaurant to managedRestaurants
            const managedRestaurants = manager.managedRestaurants || [];
            if (!managedRestaurants.includes(selectedRestaurant.id)) {
              updatedManager.managedRestaurants = [...managedRestaurants, selectedRestaurant.id];
            }
            
            return updatedManager;
          }
          return manager;
        });
      });
      
      showNotification(`${selectedRestaurant.name} assigned to ${selectedManager.name}`, "success");
      setSelectedRestaurant(null);
    } catch (error) {
      console.error("Error assigning restaurant:", error);
      showNotification("Failed to assign restaurant", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle removal of restaurant from manager
  const handleRemoveRestaurant = async (managerId, restaurantId) => {
    try {
      setIsLoading(true);
      await removeRestaurantFromManager(managerId, restaurantId);
      
      // Update the manager in the local state
      setManagers(prevManagers => {
        return prevManagers.map(manager => {
          if (manager.id === managerId) {
            const updatedManager = { ...manager };
            
            // Remove the restaurant from managedRestaurants
            const managedRestaurants = manager.managedRestaurants || [];
            updatedManager.managedRestaurants = managedRestaurants.filter(id => id !== restaurantId);
            
            // If they no longer manage any restaurants, downgrade to regular manager
            if (updatedManager.managedRestaurants.length === 0) {
              updatedManager.jobTitle = 'Manager';
            }
            
            return updatedManager;
          }
          return manager;
        });
      });
      
      const restaurant = restaurants.find(r => r.id === restaurantId);
      const manager = managers.find(m => m.id === managerId);
      
      showNotification(`${restaurant?.name || 'Restaurant'} removed from ${manager?.name || 'manager'}`, "success");
    } catch (error) {
      console.error("Error removing restaurant:", error);
      showNotification("Failed to remove restaurant", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Show notification function
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Format restaurant name based on ID
  const getRestaurantNameById = (id) => {
    const restaurant = restaurants.find(r => r.id === id);
    return restaurant ? restaurant.name : 'Unknown Restaurant';
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
      {notification && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg border shadow-lg flex items-center z-50 ${
          notification.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 
          notification.type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 
          'bg-blue-100 border-blue-400 text-blue-700'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={20} className="text-green-500 mr-2" /> :
           notification.type === 'error' ? <XCircle size={20} className="text-red-500 mr-2" /> : null}
          <span>{notification.message}</span>
        </div>
      )}
      
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          General Manager Access
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Assign and manage restaurant access for General Managers
        </p>
      </div>
      
      <div className="px-6 py-5">
        {/* Assignment Form */}
        <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-12">
          <div className="sm:col-span-5">
            <label htmlFor="manager" className="block text-xs font-medium text-gray-500 mb-1">Select Manager</label>
            <select
              id="manager"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              value={selectedManager ? selectedManager.id : ''}
              onChange={(e) => {
                const manager = managers.find(m => m.id === e.target.value);
                setSelectedManager(manager || null);
              }}
            >
              <option value="">Select a Manager</option>
              {managers.map(manager => (
                <option key={manager.id} value={manager.id}>
                  {manager.name} ({manager.jobTitle})
                </option>
              ))}
            </select>
          </div>
          
          <div className="sm:col-span-5">
            <label htmlFor="restaurant" className="block text-xs font-medium text-gray-500 mb-1">Select Restaurant</label>
            <select
              id="restaurant"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              value={selectedRestaurant ? selectedRestaurant.id : ''}
              onChange={(e) => {
                const restaurant = restaurants.find(r => r.id === e.target.value);
                setSelectedRestaurant(restaurant || null);
              }}
              disabled={!selectedManager}
            >
              <option value="">Select a Restaurant</option>
              {restaurants.map(restaurant => {
                // Check if manager already has this restaurant
                const alreadyAssigned = selectedManager && 
                  selectedManager.managedRestaurants && 
                  selectedManager.managedRestaurants.includes(restaurant.id);
                
                // Skip if already assigned
                if (alreadyAssigned) return null;
                
                return (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className="sm:col-span-2 flex items-end">
            <button
              type="button"
              onClick={handleAssignRestaurant}
              disabled={isLoading || !selectedManager || !selectedRestaurant}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full justify-center ${
                isLoading || !selectedManager || !selectedRestaurant ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <Plus size={16} className="mr-1" />
                  Assign
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* General Managers List */}
        <div className="mt-8">
          <h4 className="text-md font-medium text-gray-700 mb-3">General Managers</h4>
          
          {managers.filter(m => m.jobTitle === 'General Manager').length === 0 ? (
            <div className="bg-gray-50 p-4 rounded-lg text-gray-500 text-center">
              No General Managers found. Assign a restaurant to a manager to create a General Manager.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {managers
                .filter(manager => manager.jobTitle === 'General Manager')
                .map(manager => (
                  <div key={manager.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                        <User size={16} className="text-indigo-600" />
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">{manager.name}</h5>
                        <p className="text-xs text-gray-500">{manager.email}</p>
                      </div>
                    </div>
                    
                    <div className="px-4 py-3">
                      <h6 className="text-xs font-medium text-gray-500 mb-2">Managed Restaurants:</h6>
                      
                      <div className="space-y-2">
                        {(manager.managedRestaurants || []).map(restaurantId => (
                          <div key={restaurantId} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                            <div className="flex items-center">
                              <Store size={14} className="text-indigo-500 mr-2" />
                              <span className="text-sm">{getRestaurantNameById(restaurantId)}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveRestaurant(manager.id, restaurantId)}
                              className="text-red-500 hover:text-red-700 p-1"
                              disabled={isLoading}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneralManagerManagement;