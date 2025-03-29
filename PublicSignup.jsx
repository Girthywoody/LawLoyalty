import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser, addEmployee, collection, getDocs, db, sendEmailVerification, auth } from './firebase';
import { User, Shield, CheckCircle, XCircle, Mail, Coffee, Store, ChevronDown, MapPin, CreditCard } from 'lucide-react';

const PublicSignup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showRestaurantDropdown, setShowRestaurantDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurantName, setSelectedRestaurantName] = useState('Select your location');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdownElement = document.getElementById('restaurant-dropdown');
      if (dropdownElement && !dropdownElement.contains(event.target)) {
        setShowRestaurantDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch restaurants for dropdown
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        // Using predefined restaurants from App.jsx for consistency
        const RESTAURANTS = [
          { id: "coras", name: "Cora's Breakfast"},
          { id: "js-roadhouse", name: "J's Roadhouse"},
          { id: "swiss-chalet", name: "Swiss Chalet"},
          { id: "poke-bar", name: "Poke Bar"},
          { id: "northern-climate", name: "Northern Climate"},
          { id: "flooring-and-more-superstore", name: "Flooring and More Superstore"},
          { id: "wellness-studio", name: "Wellness Studio"},
          { id: "east-side-marios-orillia", name: "East Side Mario's Orillia"},
          { id: "jlaw-workers", name: "JLaw Worker's"},
          {
            id: "lot-88",
            name: "Lot 88",
            discount: 20,
            locations: [
              { id: "lot88-sudbury", name: "Sudbury"},
              { id: "lot88-timmins", name: "Timmins"},
              { id: "lot88-orillia", name: "Orillia"},
              { id: "lot88-north-bay", name: "North Bay"},
              { id: "lot88-thunder-bay", name: "Thunder Bay"},
              { id: "lot88-burlington", name: "Burlington"}
            ]
          }, 
          {
            id: "montanas",
            name: "Montanas",
            discount: 20,
            locations: [
              { id: "montanas-sudbury", name: "Sudbury"},
              { id: "montanas-orillia", name: "Orillia"},
            ]
          }, 
          {
            id: "kelseys",
            name: "Kelseys",
            discount: 20,
            locations: [
              { id: "kelseys-sudbury", name: "Sudbury"},
              { id: "kelseys-orillia", name: "Orillia"},
            ]
          }, 
          {
            id: "overtime-bar",
            name: "Overtime Bar",
            discount: 20,
            locations: [
              { id: "overtime-sudbury", name: "Sudbury"},
              { id: "overtime-val-caron", name: "Val Caron"},
              { id: "overtime-chelmsford", name: "Chelmsford"}
            ]
          },   {
            id: "happy-life",
            name: "Happy Life",
            discount: 10,
            locations: [
              { id: "happy-life-kingsway", name: "Kingsway"},
              { id: "happy-life-val-caron", name: "Val Caron "},
              { id: "happy-life-chelmsford", name: "Chelmsford "},
              { id: "happy-life-timmins", name: "Timmins "},
              { id: "happy-life-lakeshore", name: "Lakeshore"},
              { id: "happy-life-alqonquin", name: "Alqonquin"},
              { id: "happy-life-espanola", name: "Espanola"}
            ]
          },
        ]
        
        setRestaurants(RESTAURANTS);
      } catch (err) {
        console.error("Error fetching restaurants:", err);
        setError("Failed to load restaurants. Please try again later.");
      }
    };

    fetchRestaurants();
  }, []);
  
  const handleSelectRestaurant = (restaurantId, displayName) => {
    setSelectedRestaurant(restaurantId);
    setSelectedRestaurantName(displayName);
    setShowRestaurantDropdown(false);
    setSearchQuery('');
  };
  
  const filteredRestaurants = () => {
    if (!searchQuery) return restaurants;
    
    return restaurants.filter(restaurant => 
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (restaurant.locations && restaurant.locations.some(location => 
        `${restaurant.name} - ${location.name}`.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    );
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !email || !password || !confirmPassword || !selectedRestaurant) {
      setError('Please fill in all fields and select a restaurant');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Get restaurant details
      const restaurantParts = selectedRestaurant.split('|');
      const restaurantId = restaurantParts[0];
      const restaurantName = restaurantParts[1];
      

      // Create the user in Firebase Auth
      const user = await createUser(email, password);

      // Send verification email
      await sendEmailVerification(auth.currentUser);

      // Add user to Firestore with pending status
      await addEmployee({
        firstName: firstName,
        lastName: lastName,
        name: `${firstName} ${lastName}`,
        email: email,
        jobTitle: 'Employee',
        discount: 20,
        restaurantId: restaurantId,
        restaurantName: restaurantName,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        uid: user.uid,
        emailVerified: false
      });

      
      // Show success message
      setSuccess(true);
      
      // Navigate to the login page after successful registration (with a delay)
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
      await logoutUser();

    }
  };

// Success state in PublicSignup.jsx
if (success) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg">
              <CheckCircle size={36} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Registration Submitted!</h1>
          <p className="mt-2 text-gray-500">Waiting for Approval</p>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg border border-green-100 mt-6">
          <p className="text-green-700 font-medium mb-2">Thank you for registering!</p>
          <p className="text-green-600 text-sm mb-4">
            Your registration has been submitted to the restaurant manager for approval. You'll need to wait for approval before you can log in.
          </p>
          <p className="text-green-600 text-sm">
            Please check your email including spam folders for verification instructions. You'll be notified once your account is approved.
          </p>
        </div>
        
        <div className="mt-6">
          <button
            onClick={() => navigate('/')}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors font-medium"
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <img src="/logo.jpg" alt="Restaurant Logo" className="h-20 w-20 object-contain" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Create Your Account</h1>
          <p className="mt-2 text-gray-500">Sign up to access employee discounts</p>
        </div>
        
        <form className="mt-4 sm:mt-6 space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 sm:space-y-5">
            {/* First Name Field */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-xs text-gray-500">(as it appears on driver's license)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
            </div>
            
            {/* Last Name Field */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-xs text-gray-500">(as it appears on driver's license)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard size={18} className="text-gray-400" />
                </div>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            {/* Enhanced Restaurant Dropdown */}
            <div className="relative" id="restaurant-dropdown">
              <label htmlFor="restaurant" className="block text-sm font-medium text-gray-700 mb-1">Select Location</label>
              <button
                type="button"
                onClick={() => setShowRestaurantDropdown(!showRestaurantDropdown)}
                className="w-full flex items-center justify-between pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
                aria-haspopup="listbox"
                aria-expanded={showRestaurantDropdown}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Store size={18} className="text-gray-400" />
                </div>
                <span className={`text-left truncate ${selectedRestaurant ? 'text-gray-900' : 'text-gray-500'}`}>
                  {selectedRestaurantName}
                </span>
                <ChevronDown 
                  size={18} 
                  className={`text-gray-400 transition-transform duration-200 ${showRestaurantDropdown ? 'transform rotate-180' : ''}`} 
                />
              </button>
              
              {showRestaurantDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg overflow-auto border border-gray-200">
                  <div className="sticky top-0 p-2 border-b border-gray-200 bg-white z-10">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Search locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-52 pt-1">
                    {filteredRestaurants().length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        No restaurants match your search
                      </div>
                    ) : (
                      filteredRestaurants().map(restaurant => (
                        <div key={restaurant.id} className="px-1 py-1">
                          {!restaurant.locations ? (
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-md flex items-center gap-2 transition-colors duration-150"
                              onClick={() => handleSelectRestaurant(`${restaurant.id}|${restaurant.name}`, restaurant.name)}
                            >
                              <Store size={16} className="text-indigo-600 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-gray-900">{restaurant.name}</div>
                              </div>
                            </button>
                          ) : (
                            <>
                              <div className="px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-md mx-2 mb-1">
                                {restaurant.name}
                              </div>
                              <div className="ml-4 mt-1 space-y-1 mb-2">
                                {restaurant.locations.map(location => (
                                  <button
                                    key={location.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-md flex items-center gap-2 transition-colors duration-150"
                                    onClick={() => handleSelectRestaurant(
                                      `${location.id}|${restaurant.name} - ${location.name}`,
                                      `${restaurant.name} - ${location.name}`
                                    )}
                                  >
                                    <MapPin size={14} className="text-indigo-400 flex-shrink-0" />
                                    <div>
                                      <div className="font-medium text-gray-900">{location.name}</div>
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
              )}
            </div>
            
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Create Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield size={18} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14z" clipRule="evenodd" />
                      <path d="M19.542 10C18.268 14.057 14.478 17 10 17c-1.865 0-3.598-.544-5.06-1.483L8.18 12.28A3 3 0 0015.9 11.05L14.26 12.69A3 3 0 0110 10c-.149 0-.293.014-.434.035L7.524 7.993C8.373 7.368 9.419 7 10 7c4.478 0 8.268 2.943 9.542 7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield size={18} className="text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14z" clipRule="evenodd" />
                      <path d="M19.542 10C18.268 14.057 14.478 17 10 17c-1.865 0-3.598-.544-5.06-1.483L8.18 12.28A3 3 0 0015.9 11.05L14.26 12.69A3 3 0 0110 10c-.149 0-.293.014-.434.035L7.524 7.993C8.373 7.368 9.419 7 10 7c4.478 0 8.268 2.943 9.542 7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm flex items-center">
              <XCircle size={16} className="mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors font-medium ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-4 sm:mt-6 text-center">
          <button 
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            onClick={() => navigate('/')}
          >
            Already have an account? Sign in
          </button>
        </div>
        
        <div className="text-center text-sm text-gray-500 mt-2 sm:mt-4">
          <p>By creating an account, you'll get access to exclusive employee discounts at all participating locations after approval!</p>
        </div>
      </div>
    </div>
  );
};

export default PublicSignup;