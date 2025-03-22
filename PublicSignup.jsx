import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser, addEmployee, collection, getDocs, db } from './firebase';
import { User, Shield, CheckCircle, XCircle, Mail, Coffee, Store } from 'lucide-react';

const PublicSignup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  // Fetch restaurants for dropdown
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        // Using predefined restaurants from App.jsx for consistency
        const RESTAURANTS = [
          { id: "montanas", name: "Montana's", discount: "20%" },
          { id: "kelseys", name: "Kelsey's", discount: "20%" },
          { id: "coras", name: "Cora's Breakfast", discount: "10%" },
          { id: "js-roadhouse", name: "J's Roadhouse", discount: "20%" },
          { id: "swiss-chalet", name: "Swiss Chalet", discount: "20%" },
          {
            id: "overtime-bar",
            name: "Overtime Bar",
            discount: "20%",
            locations: [
              { id: "overtime-sudbury", name: "Sudbury" },
              { id: "overtime-val-caron", name: "Val Caron" },
              { id: "overtime-chelmsford", name: "Chelmsford" }
            ]
          },
          { id: "lot-88", name: "Lot 88 Steakhouse", discount: "20%" },
          { id: "poke-bar", name: "Poke Bar", discount: "20%" },
          {
            id: "happy-life",
            name: "Happy Life",
            discount: "10%",
            locations: [
              { id: "happy-life-kingsway", name: "Kingsway" },
              { id: "happy-life-val-caron", name: "Val Caron" },
              { id: "happy-life-chelmsford", name: "Chelmsford" }
            ]
          }
        ];
        
        setRestaurants(RESTAURANTS);
      } catch (err) {
        console.error("Error fetching restaurants:", err);
        setError("Failed to load restaurants. Please try again later.");
      }
    };

    fetchRestaurants();
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword || !selectedRestaurant) {
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
      
      // Add user to Firestore with pending status
      await addEmployee({
        name: name,
        email: email,
        jobTitle: 'Employee', // Default to Employee role
        discount: 20, // Default discount
        restaurantId: restaurantId,
        restaurantName: restaurantName,
        status: 'pending', // Add pending status
        createdAt: new Date(),
        updatedAt: new Date(),
        uid: user.uid
      });
      
      // Show success message
      setSuccess(true);
      
      // Navigate to the login page after successful registration (with a delay)
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Success state
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full flex items-center justify-center mb-4">
                <img src="logo.jpg" alt="Restaurant Logo" className="h-20 w-20 object-contain" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Registration Submitted!</h1>
            <p className="mt-2 text-gray-500">Your account is pending approval</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg border border-green-100 mt-6">
            <p className="text-green-700 font-medium mb-2">Thank you for registering!</p>
            <p className="text-green-600 text-sm">
              Your registration has been submitted to the restaurant manager for approval. You'll be notified by email once your account is approved. Please check your email inbox (including spam folders) for updates.
            </p>
          </div>
          
          <div className="flex items-center justify-center mt-6">
            <span className="text-indigo-600 animate-pulse">Redirecting to login...</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full flex items-center justify-center mb-4">
              <img src="logo.jpg" alt="Restaurant Logo" className="h-20 w-20 object-contain" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Create Your Account</h1>
          <p className="mt-2 text-gray-500">Sign up to access employee discounts</p>
        </div>
        
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
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
            <div>
              <label htmlFor="restaurant" className="block text-sm font-medium text-gray-700 mb-1">Select Restaurant</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Store size={18} className="text-gray-400" />
                </div>
                <select
                  id="restaurant"
                  name="restaurant"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  value={selectedRestaurant}
                  onChange={(e) => setSelectedRestaurant(e.target.value)}
                >
                  <option value="">Select your restaurant</option>
                  {restaurants.map(restaurant => {
                    if (restaurant.locations) {
                      return (
                        <optgroup key={restaurant.id} label={restaurant.name}>
                          {restaurant.locations.map(location => (
                            <option 
                              key={location.id} 
                              value={`${location.id}|${restaurant.name} - ${location.name}`}
                            >
                              {restaurant.name} - {location.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    } else {
                      return (
                        <option 
                          key={restaurant.id} 
                          value={`${restaurant.id}|${restaurant.name}`}
                        >
                          {restaurant.name}
                        </option>
                      );
                    }
                  })}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Create Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield size={18} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield size={18} className="text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
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
        
        <div className="mt-6 text-center">
          <button 
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            onClick={() => navigate('/')}
          >
            Already have an account? Sign in
          </button>
        </div>
        
        <div className="text-center text-sm text-gray-500 mt-4">
          <p>By creating an account, you'll get access to exclusive employee discounts at all participating restaurants after approval!</p>
        </div>
      </div>
    </div>
  );
};

export default PublicSignup;