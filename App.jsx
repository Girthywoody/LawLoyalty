import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  Building, 
  Percent, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle,
  Calendar,
  Shield,
  Award
} from 'lucide-react';

const RestaurantLoyaltyApp = () => {
  // App state
  const [view, setView] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedLocation, setSelectedLocation] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  
  // Data
  const [locations, setLocations] = useState([
    'Downtown Bistro', 
    'Harbor Seafood', 
    'Uptown Grill', 
    'Beachside Café',
    'The Garden Restaurant'
  ]);
  
  const [jobTitles, setJobTitles] = useState([
    'Server', 
    'Host', 
    'Chef', 
    'Bartender', 
    'Manager',
    'Kitchen Staff',
    'Busser'
  ]);
  
  const [employees, setEmployees] = useState([
    { id: 1, name: 'John Smith', jobTitle: 'Server', discount: 25 },
    { id: 2, name: 'Maria Garcia', jobTitle: 'Chef', discount: 35 },
    { id: 3, name: 'David Wong', jobTitle: 'Host', discount: 20 },
    { id: 4, name: 'Sarah Johnson', jobTitle: 'Bartender', discount: 30 },
    { id: 5, name: 'Alex Lee', jobTitle: 'Manager', discount: 40 },
    { id: 6, name: 'Emma Roberts', jobTitle: 'Kitchen Staff', discount: 25 }
  ]);
  
  const [discountRules, setDiscountRules] = useState({
    'Server': { 'Downtown Bistro': 25, 'Harbor Seafood': 20, 'Uptown Grill': 15, 'Beachside Café': 20, 'The Garden Restaurant': 25 },
    'Host': { 'Downtown Bistro': 20, 'Harbor Seafood': 15, 'Uptown Grill': 15, 'Beachside Café': 15, 'The Garden Restaurant': 20 },
    'Chef': { 'Downtown Bistro': 35, 'Harbor Seafood': 35, 'Uptown Grill': 30, 'Beachside Café': 30, 'The Garden Restaurant': 35 },
    'Bartender': { 'Downtown Bistro': 30, 'Harbor Seafood': 25, 'Uptown Grill': 30, 'Beachside Café': 35, 'The Garden Restaurant': 30 },
    'Manager': { 'Downtown Bistro': 40, 'Harbor Seafood': 40, 'Uptown Grill': 40, 'Beachside Café': 40, 'The Garden Restaurant': 40 },
    'Kitchen Staff': { 'Downtown Bistro': 25, 'Harbor Seafood': 25, 'Uptown Grill': 25, 'Beachside Café': 25, 'The Garden Restaurant': 25 },
    'Busser': { 'Downtown Bistro': 20, 'Harbor Seafood': 20, 'Uptown Grill': 20, 'Beachside Café': 20, 'The Garden Restaurant': 20 }
  });
  
  const [newEmployee, setNewEmployee] = useState({ name: '', jobTitle: '', discount: 20 });

  // Clock update effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Format time with leading zeros and seconds
  const formatTime = (time) => {
    return time.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  // Handle login with loading state and simulated delay
  const handleLogin = (e) => {
    e.preventDefault();
    
    // Clear any previous error
    setLoginError('');
    setIsLoading(true);
    
    // Simulate network request
    setTimeout(() => {
      // Check if password is "password"
      if (password !== "password") {
        setLoginError('Please use "password" as the password');
        setIsLoading(false);
        return;
      }
      
      // Find employee from our data
      const matchedEmployee = employees.find(emp => 
        emp.name.toLowerCase() === username.toLowerCase());
      
      if (matchedEmployee) {
        setCurrentUser(matchedEmployee);
        
        // Check if manager
        if (matchedEmployee.jobTitle === 'Manager') {
          setView('manager');
        } else {
          setView('employee');
        }
      } else {
        // For demo purposes, if username contains "manager", go to manager view
        if (username.toLowerCase().includes('manager')) {
          setCurrentUser({
            id: 999,
            name: username,
            jobTitle: 'Manager',
            discount: 40
          });
          setView('manager');
        } else {
          // Otherwise treat as regular employee
          setCurrentUser({
            id: 1000,
            name: username || 'Demo Employee',
            jobTitle: 'Server',
            discount: 25
          });
          setView('employee');
        }
      }
      setIsLoading(false);
    }, 800); // Simulate a short delay
  };

  // Handle logout
  const handleLogout = () => {
    setView('login');
    setUsername('');
    setPassword('');
    setSelectedLocation('');
    setCurrentUser(null);
  };

  // Calculate discount for current employee at selected location
  const getDiscount = (jobTitle, location) => {
    if (discountRules[jobTitle] && discountRules[jobTitle][location]) {
      return discountRules[jobTitle][location];
    }
    return 0;
  };

  // Add employee
  const addEmployee = () => {
    if (newEmployee.name && newEmployee.jobTitle) {
      const newId = Math.max(...employees.map(e => e.id), 0) + 1;
      setEmployees([...employees, { ...newEmployee, id: newId }]);
      setNewEmployee({ name: '', jobTitle: '', discount: 20 });
      setShowAddForm(false);
      showNotification('Employee added successfully!', 'success');
    } else {
      showNotification('Please fill in all required fields', 'error');
    }
  };

  // Remove employee
  const removeEmployee = (id) => {
    setEmployees(employees.filter(emp => emp.id !== id));
    showNotification('Employee removed successfully!', 'success');
  };
  
  // Start editing employee
  const startEditEmployee = (employee) => {
    setEditEmployee({...employee});
    setIsEditingEmployee(true);
  };
  
  // Save employee edits
  const saveEmployeeEdit = () => {
    if (editEmployee && editEmployee.id) {
      setEmployees(employees.map(emp => 
        emp.id === editEmployee.id ? editEmployee : emp
      ));
      setIsEditingEmployee(false);
      setEditEmployee(null);
      showNotification('Employee updated successfully!', 'success');
    }
  };
  
  // Cancel employee edit
  const cancelEdit = () => {
    setIsEditingEmployee(false);
    setEditEmployee(null);
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Notification component
  const Notification = ({ message, type }) => {
    const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 
                     type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 
                     'bg-blue-100 border-blue-400 text-blue-700';
    
    const icon = type === 'success' ? <CheckCircle size={20} className="text-green-500" /> :
                 type === 'error' ? <XCircle size={20} className="text-red-500" /> :
                 null;
    
    return (
      <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg border ${bgColor} shadow-lg flex items-center z-50`}>
        {icon && <span className="mr-2">{icon}</span>}
        <span>{message}</span>
      </div>
    );
  };

  // User profile badge
  const UserProfileBadge = ({ user }) => (
    <div className="flex items-center">
      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
        <User size={24} className="text-white" />
      </div>
      <div className="ml-4">
        <h2 className="text-lg font-bold text-gray-800">{user?.name}</h2>
        <div className="flex items-center">
          <Award size={14} className="text-indigo-700 mr-1" />
          <p className="text-indigo-600 text-sm font-medium">{user?.jobTitle}</p>
        </div>
      </div>
    </div>
  );

  // Add this effect to handle search filtering
  useEffect(() => {
    const filtered = employees.filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  // LOGIN VIEW
  if (view === 'login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                <Shield size={36} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Restaurant Loyalty</h1>
            <p className="mt-2 text-gray-500">Employee Discount System</p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <CheckCircle size={14} className="mr-1" />
                  Use "password" as the password
                </p>
              </div>
            </div>

            {/* Add helpful tooltips */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <CheckCircle size={14} className="text-green-500 mr-2" />
                <span>Enter any name to access employee view</span>
              </div>
              <div className="flex items-center">
                <CheckCircle size={14} className="text-green-500 mr-2" />
                <span>Include "manager" in name for manager access</span>
              </div>
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center">
                <XCircle size={16} className="mr-2" />
                {loginError}
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
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Restaurant Group • All rights reserved
          </p>
        </div>
      </div>
    );
  }

  // EMPLOYEE VIEW
  if (view === 'employee') {
    const currentDiscount = selectedLocation ? 
      getDiscount(currentUser?.jobTitle || 'Server', selectedLocation) : 0;
      
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        {notification && <Notification message={notification.message} type={notification.type} />}
        
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center">
              <Shield size={24} className="text-indigo-600 mr-2" />
              <h1 className="text-xl font-semibold text-indigo-700">Employee Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center text-gray-700 bg-gray-100 py-1 px-3 rounded-lg">
                <Clock size={18} className="mr-2 text-indigo-600" />
                <span className="font-mono font-medium">{formatTime(currentTime)}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Logout"
              >
                <LogOut size={18} className="mr-1" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-grow max-w-5xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            {/* User info card */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <UserProfileBadge user={currentUser} />
            </div>

            {/* Location selector */}
            <div className="p-6 border-b border-gray-200">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Select Restaurant Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building size={20} className="text-gray-500" />
                </div>
                <select
                  id="location"
                  className="block w-full pl-10 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border shadow-sm"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <option value="">Select a restaurant</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Discount display */}
            {selectedLocation ? (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Discount</h3>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-indigo-100">Location</p>
                      <div className="flex items-center mt-1">
                        <Building size={18} className="text-white mr-2" />
                        <p className="text-lg font-medium text-white">{selectedLocation}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-indigo-100">Your Discount</p>
                      <div className="flex items-center mt-1">
                        <Percent size={18} className="text-white mr-2" />
                        <p className="text-3xl font-bold text-white">{currentDiscount}%</p>
                      </div>
                    </div>
                    <div className="md:col-span-2 pt-3 border-t border-indigo-400">
                      <p className="text-sm font-medium text-indigo-100">Valid</p>
                      <div className="flex items-center mt-1">
                        <Calendar size={18} className="text-white mr-2" />
                        <p className="text-lg font-medium text-white">
                          {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="mt-4 bg-indigo-400 bg-opacity-20 p-3 rounded-lg border border-indigo-300 border-opacity-30">
                        <p className="text-sm text-white flex items-center">
                          <Clock size={14} className="mr-2" />
                          Show this screen to the cashier to receive your discount.
                          The live clock confirms this is being viewed in real-time.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code placeholder for potential future feature */}
                <div className="mt-6 p-6 rounded-xl border border-gray-200 text-center bg-gray-50">
                  <div className="w-40 h-40 mx-auto bg-white p-2 rounded-lg shadow-sm border border-gray-300 flex items-center justify-center">
                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-400">
                      QR Code
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">
                    Alternatively, scan this code at checkout
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-indigo-100">
                  <Building size={24} className="text-indigo-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Select a Location</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Choose a restaurant location from the dropdown above to view your available discount.
                </p>
              </div>
            )}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs text-center text-gray-500">
              &copy; {new Date().getFullYear()} Restaurant Group • All rights reserved
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // MANAGER VIEW
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {notification && <Notification message={notification.message} type={notification.type} />}
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Shield size={24} className="text-indigo-600 mr-2" />
            <h1 className="text-xl font-semibold text-indigo-700">Manager Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center text-gray-700 bg-gray-100 py-1 px-3 rounded-lg">
              <Clock size={18} className="mr-2 text-indigo-600" />
              <span className="font-mono font-medium">{formatTime(currentTime)}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              aria-label="Logout"
            >
              <LogOut size={18} className="mr-1" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow max-w-6xl w-full mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Employee management section */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Employee Management</h2>
                <p className="text-gray-500">Manage discount information for your restaurant employees</p>
              </div>
              <UserProfileBadge user={currentUser} />
            </div>
            
            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Employee Roster
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {employees.length} employees registered
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? (
                    <>
                      <XCircle size={16} className="mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Plus size={16} className="mr-2" />
                      Add Employee
                    </>
                  )}
                </button>
              </div>

              {/* Add new employee form */}
              {showAddForm && (
                <div className="px-6 py-5 border-b border-gray-200 bg-indigo-50">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                    Add New Employee
                  </h4>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                      <label htmlFor="name" className="block text-xs font-medium text-gray-500 mb-1">Employee Name</label>
                      <input
                        type="text"
                        id="name"
                        placeholder="Full Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="jobTitle" className="block text-xs font-medium text-gray-500 mb-1">Position</label>
                      <select
                        id="jobTitle"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        value={newEmployee.jobTitle}
                        onChange={(e) => setNewEmployee({...newEmployee, jobTitle: e.target.value})}
                      >
                        <option value="">Select Job Title</option>
                        {jobTitles.map(title => (
                          <option key={title} value={title}>{title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-1">
                      <label htmlFor="discount" className="block text-xs font-medium text-gray-500 mb-1">Discount %</label>
                      <input
                        type="number"
                        id="discount"
                        placeholder="Discount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        value={newEmployee.discount}
                        onChange={(e) => setNewEmployee({...newEmployee, discount: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="sm:col-span-1 flex items-end">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full justify-center"
                        onClick={addEmployee}
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Employee list */}
              <div className="px-6 py-5">
                {/* Search bar */}
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:w-64 mb-4 sm:mb-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search employees..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">
                      Showing {filteredEmployees.length} of {employees.length} employees
                    </span>
                  </div>
                </div>
              
                {/* Employee table */}
                <div className="overflow-x-auto rounded-lg shadow">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job Title
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Base Discount
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isEditingEmployee && editEmployee ? (
                        <tr className="bg-indigo-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              className="w-full px-2 py-1 border border-indigo-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              value={editEmployee.name}
                              onChange={(e) => setEditEmployee({...editEmployee, name: e.target.value})}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              className="w-full px-2 py-1 border border-indigo-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              value={editEmployee.jobTitle}
                              onChange={(e) => setEditEmployee({...editEmployee, jobTitle: e.target.value})}
                            >
                              {jobTitles.map(title => (
                                <option key={title} value={title}>{title}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              className="w-20 px-2 py-1 border border-indigo-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              value={editEmployee.discount}
                              onChange={(e) => setEditEmployee({...editEmployee, discount: parseInt(e.target.value) || 0})}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={saveEmployeeEdit}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <XCircle size={16} />
                            </button>
                          </td>
                        </tr>
                      ) : null}
                      
                      {filteredEmployees.map((employee) => (
                        isEditingEmployee && editEmployee && employee.id === editEmployee.id ? null : (
                          <tr key={employee.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <User size={14} className="text-indigo-600" />
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                  <div className="text-xs text-gray-500">ID: {employee.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs rounded-full bg-indigo-50 text-indigo-700">
                                {employee.jobTitle}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {employee.discount}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => startEditEmployee(employee)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                aria-label="Edit employee"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => removeEmployee(employee.id)}
                                className="text-red-600 hover:text-red-900"
                                aria-label="Remove employee"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        )
                      ))}
                      
                      {filteredEmployees.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-6 py-10 text-center text-sm text-gray-500">
                            No employees found. Try a different search or add a new employee.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Discount rules info */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                    Discount Rules by Location
                  </h4>
                  <div className="overflow-x-auto pb-2">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Position
                          </th>
                          {locations.map(location => (
                            <th key={location} scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {location}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {jobTitles.map(jobTitle => (
                          <tr key={jobTitle} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {jobTitle}
                            </td>
                            {locations.map(location => (
                              <td key={`${jobTitle}-${location}`} className="px-4 py-3 whitespace-nowrap text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  discountRules[jobTitle][location] >= 30 ? 'bg-green-100 text-green-800' : 
                                  discountRules[jobTitle][location] >= 20 ? 'bg-blue-100 text-blue-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {discountRules[jobTitle][location]}%
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Discount rules section */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Discount Rules</h2>
            <div className="grid gap-4">
              {jobTitles.map(jobTitle => (
                <DiscountRuleCard
                  key={jobTitle}
                  jobTitle={jobTitle}
                  locations={locations}
                  discountRules={discountRules}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-center text-gray-500">
            &copy; {new Date().getFullYear()} Restaurant Group • All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
};

// Update the employee view to show location-specific info more clearly
const EmployeeLocationCard = ({ location, discount }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <Building size={20} className="text-indigo-600 mr-2" />
        <h3 className="font-medium text-gray-900">{location}</h3>
      </div>
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
        {discount}% off
      </span>
    </div>
    <p className="text-sm text-gray-500">
      Valid at this location during regular business hours
    </p>
  </div>
);

// Add this component for the manager view
const DiscountRuleCard = ({ jobTitle, locations, discountRules }) => (
  <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
    <h3 className="font-medium text-gray-900 mb-3">{jobTitle}</h3>
    <div className="space-y-2">
      {locations.map(location => (
        <div key={location} className="flex justify-between items-center text-sm">
          <span className="text-gray-600">{location}</span>
          <span className={`px-2 py-0.5 rounded-full ${
            discountRules[jobTitle][location] >= 30 ? 'bg-green-100 text-green-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {discountRules[jobTitle][location]}%
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Update the employee view styling for the discount card
const DiscountCard = ({ location, discount, currentTime }) => (
  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <p className="text-sm font-medium text-indigo-100">Location</p>
        <div className="flex items-center mt-1">
          <Building size={18} className="text-white mr-2" />
          <p className="text-lg font-medium text-white">{location}</p>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-indigo-100">Your Discount</p>
        <div className="flex items-center mt-1">
          <Percent size={18} className="text-white mr-2" />
          <p className="text-3xl font-bold text-white">{discount}%</p>
        </div>
      </div>
      <div className="md:col-span-2 pt-3 border-t border-indigo-400">
        <p className="text-sm font-medium text-indigo-100">Valid</p>
        <div className="flex items-center mt-1">
          <Calendar size={18} className="text-white mr-2" />
          <p className="text-lg font-medium text-white">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="mt-4 bg-indigo-400 bg-opacity-20 p-3 rounded-lg border border-indigo-300 border-opacity-30">
          <p className="text-sm text-white flex items-center">
            <Clock size={14} className="mr-2" />
            Show this screen to the cashier to receive your discount.
            The live clock confirms this is being viewed in real-time.
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default RestaurantLoyaltyApp;