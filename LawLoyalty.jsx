import React, { useState, useEffect } from 'react';
import { Clock, User, Building, Percent, LogOut, Plus, Trash2, Edit } from 'lucide-react';

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

  // Handle login - fixed to check for password "password"
  const handleLogin = (e) => {
    e.preventDefault();
    
    // Clear any previous error
    setLoginError('');
    
    // Check if password is "password"
    if (password !== "password") {
      setLoginError('Please use "password" as the password');
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
    }
  };

  // Remove employee
  const removeEmployee = (id) => {
    setEmployees(employees.filter(emp => emp.id !== id));
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
    }
  };
  
  // Cancel employee edit
  const cancelEdit = () => {
    setIsEditingEmployee(false);
    setEditEmployee(null);
  };

  // LOGIN VIEW
  if (view === 'login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-indigo-700">Restaurant Loyalty</h1>
            <p className="mt-2 text-gray-600">Employee Discount System</p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="mt-1 text-sm text-green-600">Use "password" as the password</p>
              </div>
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors font-medium"
              >
                Sign in
              </button>
              <p className="mt-3 text-sm text-gray-600 text-center">
                For demo: Enter any name or "manager" for manager view
              </p>
            </div>
          </form>
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
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-indigo-700">Employee Discount Portal</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-700 bg-gray-100 py-1 px-3 rounded-lg">
                <Clock size={18} className="mr-2 text-indigo-600" />
                <span className="font-mono font-medium">{formatTime(currentTime)}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-grow max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-xl overflow-hidden">
            {/* User info card */}
            <div className="p-6 border-b border-gray-200 bg-indigo-50">
              <div className="flex items-center">
                <div className="h-16 w-16 rounded-full bg-indigo-200 flex items-center justify-center">
                  <User size={28} className="text-indigo-700" />
                </div>
                <div className="ml-6">
                  <h2 className="text-2xl font-bold text-gray-800">{currentUser?.name || username}</h2>
                  <p className="text-indigo-600 font-medium">{currentUser?.jobTitle || "Employee"}</p>
                </div>
              </div>
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
                  className="block w-full pl-10 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border"
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
            {selectedLocation && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Discount</h3>
                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-6 rounded-xl shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <div className="flex items-center mt-1">
                        <Building size={18} className="text-indigo-600 mr-2" />
                        <p className="text-lg font-medium text-gray-800">{selectedLocation}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Your Discount</p>
                      <div className="flex items-center mt-1">
                        <Percent size={18} className="text-green-600 mr-2" />
                        <p className="text-3xl font-bold text-green-600">{currentDiscount}%</p>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500">Valid</p>
                      <div className="flex items-center mt-1">
                        <Clock size={18} className="text-indigo-600 mr-2" />
                        <p className="text-lg font-medium text-gray-800">
                          {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 mt-3">
                        Show this screen to the cashier to receive your discount.
                        The live clock above confirms this discount is being viewed in real-time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // MANAGER VIEW
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-indigo-700">Manager Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-700 bg-gray-100 py-1 px-3 rounded-lg">
              <Clock size={18} className="mr-2 text-indigo-600" />
              <span className="font-mono font-medium">{formatTime(currentTime)}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              aria-label="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-indigo-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Employee Discount Management
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Add, remove, or edit employee discount information for your restaurant.
            </p>
          </div>

          {/* Add new employee form */}
          <div className="px-6 py-5 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              Add New Employee
            </h4>
            <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Employee Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                />
              </div>
              <div className="sm:col-span-2">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                <input
                  type="number"
                  placeholder="Discount %"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={newEmployee.discount}
                  onChange={(e) => setNewEmployee({...newEmployee, discount: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="sm:col-span-1">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={addEmployee}
                >
                  <Plus size={16} className="mr-2" />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Employee list */}
          <div className="px-6 py-5">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              Current Employees
            </h4>
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
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ) : null}
                  
                  {employees.map((employee) => (
                    isEditingEmployee && editEmployee && employee.id === editEmployee.id ? null : (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.jobTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.discount}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => startEditEmployee(employee)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => removeEmployee(employee.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RestaurantLoyaltyApp;