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
  Award,
  MapPin,
  Mail
} from 'lucide-react';

import { Store } from 'lucide-react';

import ForgotPasswordModal from './ForgotPasswordModal';

import { createUser, sendEmployeeInvite } from './firebase';

import { 
  createManagerWithRestaurant,
  subscribeToRestaurantEmployees,
  sendManagerInvite
} from './firebase';

import { 
  loginWithEmailAndPassword, 
  logoutUser, 
  getEmployees, 
  addEmployee, 
  updateEmployee, 
  deleteEmployee, 
  subscribeToEmployees,
  completeRegistration,
  db
} from './firebase';

import { collection, query, where, getDocs } from 'firebase/firestore'; // Add these imports

import PendingEmployeeApprovals from './PendingEmployeeApprovals';
window.showAppNotification = null;


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
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [jobTitles, setJobTitles] = useState(['Employee', 'Manager']);
  const [employees, setEmployees] = useState([]);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [showRestaurantDropdown, setShowRestaurantDropdown] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [completeSignupName, setCompleteSignupName] = useState('');
  const [completeSignupPassword, setCompleteSignupPassword] = useState('');
  const [completeSignupConfirmPassword, setCompleteSignupConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteRole, setInviteRole] = useState('Employee');
  const [registrationMode, setRegistrationMode] = useState('login'); // 'login', 'invite', 'register'
  const [inviteValidated, setInviteValidated] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDetails, setInviteDetails] = useState(null);
  const [selectedManagerRestaurant, setSelectedManagerRestaurant] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  

  // Data
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
  
  // const [jobTitles, setJobTitles] = useState(['Employee']);
  
  // const [employees, setEmployees] = useState([
  //   { id: 1, name: 'John Smith', jobTitle: 'Employee' },
  //   { id: 2, name: 'Maria Garcia', jobTitle: 'Employee' },
  //   { id: 3, name: 'David Wong', jobTitle: 'Employee' },
  //   { id: 4, name: 'Sarah Johnson', jobTitle: 'Employee' },
  //   { id: 5, name: 'Alex Lee', jobTitle: 'Employee' },
  //   { id: 6, name: 'Emma Roberts', jobTitle: 'Employee' }
  // ]);
  
  // const [newEmployee, setNewEmployee] = useState({ name: '', jobTitle: 'Employee' });
  
    const [email, setEmail] = useState(''); // Instead of username
  // Clock update effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadEmployees = async () => {
      setIsLoading(true);
      
      // Set up the appropriate listener based on user role
      let unsubscribe;
      
      if (currentUser && currentUser.jobTitle === 'Manager' && currentUser.restaurantId) {
        // Restaurant manager - only see employees from their restaurant
        unsubscribe = subscribeToRestaurantEmployees((employeesData) => {
          // Filter out any managers/admins unless the user is an admin
          const filteredData = employeesData.filter(emp => 
            emp.jobTitle === 'Employee' || 
            emp.id === currentUser.id // Always include the current user
          );
          
          setEmployees(filteredData);
          setFilteredEmployees(filteredData);
          setIsLoading(false);
        }, currentUser.restaurantId);
      } else if (currentUser && currentUser.jobTitle === 'Admin') {
        // Admin - see all employees
        unsubscribe = subscribeToEmployees((employeesData) => {
          setEmployees(employeesData);
          setFilteredEmployees(employeesData);
          setIsLoading(false);
        });
      }
      
      // Clean up listener when component unmounts
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    };
    
    // Only load employees if we're in manager or admin view
    if (view === 'manager' || view === 'admin') {
      loadEmployees();
      <PendingEmployeeApprovals currentUser={currentUser} />

    }
  }, [view, currentUser]);
  


  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    
    // Don't proceed if already loading
    if (isLoading) return;
    
    setLoginError('');
    setIsLoading(true);
    
    try {
      // Validate passwords match
      if (completeSignupPassword !== completeSignupConfirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Complete the registration process
      await completeRegistration(completeSignupName, completeSignupPassword, inviteCode);
      
      showNotification('Account created successfully! Please sign in.', 'success');
      setView('login');
    } catch (error) {
      console.error("Registration error:", error);
      setLoginError(error.message || 'Failed to complete registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check for URL parameters that indicate we're coming from an email link
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const emailParam = params.get('email');
    const inviteIdParam = params.get('inviteId');
    
    console.log("URL params:", { mode, emailParam, inviteIdParam }); // Add this for debugging
    
    if (mode === 'complete' && emailParam && inviteIdParam) {
      // Store the email in localStorage for the auth process
      localStorage.setItem('emailForSignIn', emailParam);
      setInviteEmail(emailParam);
      setInviteCode(inviteIdParam);
      
      // Set the view to a dedicated welcome signup page
      setView('completeSignup');
    }
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

// Replace or update the handleLogin function in App.jsx
const handleLogin = async (e) => {
  e.preventDefault();
  
  // Don't proceed if already loading
  if (isLoading) return;
  
  setLoginError('');
  setIsLoading(true);
  
  try {
    // Basic validation
    if (!email || !password) {
      throw new Error('Please enter both email and password');
    }
    
    // Implement actual Firebase login
    const user = await loginWithEmailAndPassword(email, password);
    
    // Query Firestore to get the user's role information
    const employeesRef = collection(db, 'employees');
    const q = query(employeesRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('User not found in employees database');
    }
    
    // Get the employee data
    const employeeData = querySnapshot.docs[0].data();
    
    // Check if the user has been approved
    if (employeeData.status === 'pending') {
      throw new Error('Your account is still pending approval from the restaurant manager.');
    }
    
    if (employeeData.status === 'rejected') {
      throw new Error('Your application has been declined. Please contact the restaurant manager for more information.');
    }
    
    // Set current user from Firebase response and Firestore data
    setCurrentUser({
      id: user.uid,
      name: employeeData.name || user.displayName || email,
      email: user.email,
      jobTitle: employeeData.jobTitle || 'Employee',
      discount: employeeData.discount || 20,
      restaurantId: employeeData.restaurantId || null,
      restaurantName: employeeData.restaurantName || null
    });

    // Navigate to the appropriate view based on role
    if (employeeData.jobTitle === 'Admin') {
      setView('admin');
    } else if (employeeData.jobTitle === 'Manager') {
      setView('manager');
    } else {
      setView('employee');
    }
    
    showNotification('Login successful', 'success');
  } catch (error) {
    console.error("Login error:", error);
    setLoginError(error.message || 'Login failed. Check your credentials.');
  } finally {
    setIsLoading(false);
  }
};

  // Handle logout
  const handleLogout = async () => {
    try {
      await logoutUser(); // Firebase logout
      setView('login');
      setEmail('');
      setPassword('');
      setSelectedLocation('');
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      showNotification("Error logging out", "error");
    }
  };

  // Simplify getDiscount to only use restaurant discount
  const getDiscount = (location) => {
    const restaurant = RESTAURANTS.find(r => 
      r.name === location || 
      (r.locations && r.locations.some(l => l.name === location))
    );
    
    if (restaurant) {
      return parseInt(restaurant.discount);
    }
    return 0;
  };


  const handleSendInvite = async () => {
    if (!inviteEmail) {
      showNotification('Please enter an email address', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // If the user is a manager, they can only invite to their restaurant
      if (currentUser.jobTitle === 'Manager' && currentUser.restaurantId) {
        // Use the current user's ID as senderUid and pass the selected role
        await sendEmployeeInvite(inviteEmail, 'Employee', currentUser.id);
        showNotification(`Invite sent to ${inviteEmail} as Employee for ${currentUser.restaurantName}`, 'success');
      } else if (currentUser.jobTitle === 'Admin') {
        // Admin can invite with custom role and restaurant
        if (inviteRole === 'Manager') {
          if (!selectedManagerRestaurant) {
            throw new Error('Please select a restaurant for the manager');
          }
          
          await sendManagerInvite(
            inviteEmail, 
            'Manager',
            currentUser.id,
            selectedManagerRestaurant.id
          );
          showNotification(`Manager invite sent to ${inviteEmail} for ${selectedManagerRestaurant.name}`, 'success');
        } else {
          // For employees without a specific restaurant assignment (admin's choice)
          await sendEmployeeInvite(inviteEmail, inviteRole, currentUser.id);
          showNotification(`Invite sent to ${inviteEmail} as ${inviteRole}`, 'success');
        }
      }
      
      setInviteEmail('');
      setInviteSuccess(true); // Show success message
      
      // Hide the success message after 5 seconds
      setTimeout(() => {
        setInviteSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Error sending invite:", error);
      showNotification(error.message || "Failed to send invite", "error");
    } finally {
      setIsLoading(false);
    }
  };

// Handle creation of restaurant managers (admin only)
const handleCreateManager = async () => {
  if (!inviteEmail || !selectedManagerRestaurant) {
    showNotification('Please enter an email address and select a restaurant', 'error');
    return;
  }
  
  setIsLoading(true);
  
  try {
    // Only admins can create managers
    if (currentUser.jobTitle !== 'Admin') {
      throw new Error('Only administrators can create restaurant managers');
    }
    
    // Send an invitation with manager role and restaurant assignment
    await sendManagerInvite(
      inviteEmail, 
      'Manager',
      currentUser.id,
      selectedManagerRestaurant.id
    );
    
    showNotification(`Invitation sent to ${inviteEmail} for ${selectedManagerRestaurant.name}`, 'success');
    setInviteEmail('');
    setSelectedManagerRestaurant(null);
    setInviteSuccess(true);
    
    setTimeout(() => {
      setInviteSuccess(false);
    }, 5000);
  } catch (error) {
    console.error("Error sending manager invitation:", error);
    showNotification(error.message || "Failed to send manager invitation", "error");
  } finally {
    setIsLoading(false);
  }
};

  // Remove employee
  const removeEmployeeFromFirebase = async (id) => {
    try {
      setIsLoading(true);
      await deleteEmployee(id);
      showNotification('Employee removed successfully!', 'success');
      setIsLoading(false);
    } catch (error) {
      console.error("Error removing employee:", error);
      showNotification("Failed to remove employee", "error");
      setIsLoading(false);
    }
  };

  // Add this function to handle registration
const handleRegister = async (e) => {
  e.preventDefault();
  
  // Don't proceed if already loading
  if (isLoading) return;
  
  setLoginError('');
  setIsLoading(true);
  
  try {
    // Basic validation
    if (!registerEmail || !registerPassword || !registerName) {
      throw new Error('Please fill in all fields');
    }
    
    // Create user in Firebase Authentication
    const user = await createUser(registerEmail, registerPassword);
    
    // Add user to employees collection as a manager
    await addEmployee({
      name: registerName,
      email: registerEmail,
      jobTitle: 'Manager',
      discount: 40,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Set current user and navigate to manager view
    setCurrentUser({
      id: user.uid,
      name: user.displayName || email,
      email: user.email,
      jobTitle: email.toLowerCase().includes('manager') ? 'Manager' : 'Employee',
      discount: email.toLowerCase().includes('manager') ? 40 : 20
    });

    setView(email.toLowerCase().includes('manager') ? 'manager' : 'employee');

    
    // Clear registration form
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterName('');
    
    // Navigate to manager view
    setView('manager');
    
    showNotification('Account created successfully!', 'success');
  } catch (error) {
    console.error("Registration error:", error);
    setLoginError(error.message || 'Failed to create account. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
  
  // Start editing employee
  const startEditEmployee = (employee) => {
    setEditEmployee({...employee});
    setIsEditingEmployee(true);
  };
  
  const saveEmployeeEditToFirebase = async () => {
    if (editEmployee && editEmployee.id) {
      try {
        setIsLoading(true);
        
        // Create an update object with all necessary fields
        const updateData = {
          name: editEmployee.name,
          email: editEmployee.email,
          jobTitle: editEmployee.jobTitle,
          discount: parseInt(editEmployee.discount) || 0,
          updatedAt: new Date()
        };
        
        // Preserve restaurant assignment if it exists
        if (editEmployee.restaurantId) {
          updateData.restaurantId = editEmployee.restaurantId;
          updateData.restaurantName = editEmployee.restaurantName;
        }
        
        // Update in Firebase
        await updateEmployee(editEmployee.id, updateData);
        
        setIsEditingEmployee(false);
        setEditEmployee(null);
        showNotification('Employee updated successfully!', 'success');
        setIsLoading(false);
      } catch (error) {
        console.error("Error updating employee:", error);
        showNotification("Failed to update employee", "error");
        setIsLoading(false);
      }
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

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
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
          {user?.restaurantName && (
            <div className="flex items-center ml-2">
              <Store size={14} className="text-green-700 mr-1" />
              <p className="text-green-600 text-sm font-medium">{user?.restaurantName}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Helper function to get restaurant name by ID
const getRestaurantName = (restaurantId) => {
  const restaurant = RESTAURANTS.find(r => r.id === restaurantId);
  
  if (restaurant) {
    return restaurant.name;
  }
  
  // For location-specific IDs
  for (const restaurant of RESTAURANTS) {
    if (restaurant.locations) {
      const location = restaurant.locations.find(l => l.id === restaurantId);
      if (location) {
        return `${restaurant.name} - ${location.name}`;
      }
    }
  }
  
  return "Unknown Restaurant";
};

useEffect(() => {
  const filtered = employees.filter(emp => 
    ((emp.name && emp.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (emp.jobTitle && emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    // Only show approved employees in the main list
    emp.status === 'approved'
  );
  setFilteredEmployees(filtered);
}, [searchTerm, employees]);

  // REGISTRATION VIEW
if (view === 'register') {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
              <Shield size={36} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Create Manager Account</h1>
          <p className="mt-2 text-gray-500">Register for the Employee Discount System</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-5">
            <div>
              <label htmlFor="registerName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  id="registerName"
                  name="registerName"
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter your full name"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="registerEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  id="registerEmail"
                  name="registerEmail"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter your email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="registerPassword" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield size={18} className="text-gray-400" />
                </div>
                <input
                  id="registerPassword"
                  name="registerPassword"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Create a password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                />
              </div>
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
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-4 text-center">
          <button 
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            onClick={() => {
              setView('login');
              setLoginError('');
            }}
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

// ADMIN VIEW
if (view === 'admin') {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {notification && <Notification message={notification.message} type={notification.type} />}
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Shield size={24} className="text-indigo-600 mr-2" />
            <h1 className="text-xl font-semibold text-indigo-700">Admin Dashboard</h1>
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
        {/* User Management Panel */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              User Management
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Add new users and assign them to restaurants
            </p>
          </div>
          
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <label htmlFor="inviteEmail" className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
                <input
                  type="email"
                  id="inviteEmail"
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="inviteRole" className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                <select
                  id="inviteRole"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              <div className="sm:col-span-4">
                <label htmlFor="restaurant" className="block text-xs font-medium text-gray-500 mb-1">Restaurant</label>
                <select
                  id="restaurant"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  value={selectedManagerRestaurant ? selectedManagerRestaurant.id : ''}
                  onChange={(e) => {
                    const restaurant = RESTAURANTS.find(r => r.id === e.target.value);
                    setSelectedManagerRestaurant(restaurant);
                  }}
                >
                  <option value="">Select Restaurant</option>
                  {RESTAURANTS.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-1 flex items-end">
              <button
                  type="button"
                  onClick={handleSendInvite}
                  disabled={isLoading || !inviteEmail}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Invite'
                  )}
                </button>
              </div>
            </div>
            
            {inviteSuccess && (
              <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Invitation sent successfully! The user will receive an email with instructions.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Employee management section */}
        <div className="w-full">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
              <p className="text-gray-500">Manage all users across restaurants</p>
            </div>
            <UserProfileBadge user={currentUser} />
          </div>
          
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            {/* Search bar */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-64 mb-4 sm:mb-0">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <span className="text-sm text-gray-500">
                    Showing {filteredEmployees.length} of {employees.length} users
                  </span>
                </div>
              </div>
            </div>

            {/* Employee table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Restaurant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
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
                        <input
                          type="email"
                          className="w-full px-2 py-1 border border-indigo-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          value={editEmployee.email}
                          onChange={(e) => setEditEmployee({...editEmployee, email: e.target.value})}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          className="w-full px-2 py-1 border border-indigo-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          value={editEmployee.jobTitle}
                          onChange={(e) => setEditEmployee({...editEmployee, jobTitle: e.target.value})}
                        >
                          <option value="Employee">Employee</option>
                          <option value="Manager">Manager</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          className="w-full px-2 py-1 border border-indigo-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          value={editEmployee.restaurantId || ''}
                          onChange={(e) => {
                            const restaurantId = e.target.value;
                            setEditEmployee({
                              ...editEmployee, 
                              restaurantId: restaurantId,
                              restaurantName: restaurantId ? getRestaurantName(restaurantId) : null
                            });
                          }}
                        >
                          <option value="">None</option>
                          {RESTAURANTS.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
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
                          onClick={saveEmployeeEditToFirebase}
                          className="text-green-600 hover:text-green-900 mr-3"
                          aria-label="Save changes"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                          aria-label="Cancel editing"
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
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            employee.jobTitle === 'Admin' ? 'bg-purple-50 text-purple-700' :
                            employee.jobTitle === 'Manager' ? 'bg-indigo-50 text-indigo-700' :
                            'bg-green-50 text-green-700'
                          }`}>
                            {employee.jobTitle}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.restaurantName || 'Not assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {employee.discount}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => startEditEmployee(employee)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            aria-label="Edit user"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => removeEmployeeFromFirebase(employee.id)}
                            className="text-red-600 hover:text-red-900"
                            aria-label="Remove user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  ))}
                  
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500">
                        No users found. Try a different search or add a new user.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
}




  // LOGIN VIEW
  if (view === 'login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full flex items-center justify-center mb-4">
                <img src="logo.jpg" alt="Restaurant Logo" className="h-20 w-20 object-contain" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Restaurant Loyalty</h1>
            <p className="mt-2 text-gray-500">Employee Discount System</p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-5">
              <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                New users need an invitation from a manager.
              </p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                New users can <a href="/signup" className="text-indigo-600 hover:text-indigo-800 font-medium">sign up here</a>.
              </p>
            </div>

            {/* Add helpful tooltips */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <CheckCircle size={14} className="text-green-500 mr-2" />
                <span>Ask your manager if you are having any problems logging in</span>
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

        <div className="mt-2 text-center">
          <button 
            onClick={handleForgotPassword}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Forgot your password?
          </button>
        </div>
                

        {showForgotPassword && (
          <ForgotPasswordModal 
            onClose={() => setShowForgotPassword(false)}
          />
        )}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Restaurant Group • All rights reserved
          </p>
        </div>
      </div>
    );
  }

  // COMPLETE SIGNUP VIEW
// COMPLETE SIGNUP VIEW
if (view === 'completeSignup') {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
              <Shield size={36} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome to Law Loyalty!</h1>
          <p className="mt-2 text-gray-500">Complete your account setup</p>
        </div>
        
        {inviteEmail && (
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-center">
            <Mail size={18} className="text-indigo-600 mr-2" />
            <p className="text-sm text-indigo-700">Setting up account for: <strong>{inviteEmail}</strong></p>
          </div>
        )}
        
        <form className="mt-6 space-y-6" onSubmit={handleCompleteSignup}>
          <div className="space-y-5">
            <div>
              <label htmlFor="completeName" className="block text-sm font-medium text-gray-700 mb-1">Your Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  id="completeName"
                  name="completeName"
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter your full name"
                  value={completeSignupName}
                  onChange={(e) => setCompleteSignupName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="completePassword" className="block text-sm font-medium text-gray-700 mb-1">Create Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield size={18} className="text-gray-400" />
                </div>
                <input
                  id="completePassword"
                  name="completePassword"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Create a secure password"
                  value={completeSignupPassword}
                  onChange={(e) => setCompleteSignupPassword(e.target.value)}
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
                  value={completeSignupConfirmPassword}
                  onChange={(e) => setCompleteSignupConfirmPassword(e.target.value)}
                />
              </div>
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
                  Creating Account...
                </>
              ) : (
                'Complete Setup'
              )}
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm text-gray-500 mt-4">
          <p>By creating an account, you'll get access to exclusive employee discounts at all participating restaurants!</p>
        </div>
      </div>
    </div>
  );
}

  // EMPLOYEE VIEW
  if (view === 'employee') {
    const currentDiscount = selectedLocation ? 
      getDiscount(selectedLocation) : 0;
      
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
              <label htmlFor="restaurant" className="block text-sm font-medium text-gray-700 mb-4">
                Select Restaurant Location
              </label>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRestaurantDropdown(!showRestaurantDropdown)}
                  className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Building size={20} className="text-gray-400 mr-3" />
                      <span className="text-gray-700">
                        {selectedRestaurant ? selectedRestaurant.name : 'Select a restaurant'}
                      </span>
                    </div>
                    <svg
                      className={`h-5 w-5 text-gray-400 transform transition-transform duration-200 ${
                        showRestaurantDropdown ? 'rotate-180' : ''
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>

                {/* Dropdown menu */}
                {showRestaurantDropdown && (
                  <div className="absolute z-10 mt-2 w-full rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="max-h-60 overflow-auto">
                      {RESTAURANTS.map((restaurant) => (
                        <div key={restaurant.id}>
                          <button
                            onClick={() => {
                              setSelectedRestaurant(restaurant);
                              if (!restaurant.locations) {
                                setSelectedLocation(restaurant.name);
                              }
                              setShowRestaurantDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between group"
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mr-3 group-hover:bg-indigo-100">
                                <Building size={16} className="text-indigo-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{restaurant.name}</p>
                                <p className="text-xs text-gray-500">{restaurant.discount} discount</p>
                              </div>
                            </div>
                            {restaurant.locations && (
                              <MapPin size={16} className="text-gray-400 group-hover:text-indigo-500" />
                            )}
                          </button>

                          {/* Location sub-menu */}
                          {selectedRestaurant?.id === restaurant.id && restaurant.locations && (
                            <div className="ml-12 border-l border-gray-100">
                              {restaurant.locations.map((location) => (
                                <button
                                  key={location.id}
                                  onClick={() => {
                                    setSelectedLocation(location.name);
                                    setShowRestaurantDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
                                >
                                  <MapPin size={14} className="text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-700">{location.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                          Show this screen to the worker to receive your discount.
                          The live clock confirms this is being viewed in real-time.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Replace the QR code section with this: */}
                {selectedLocation && (
                  <div className="mt-6 text-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex flex-col items-center justify-center">
                      <Clock size={32} className="text-indigo-600 mb-2" />
                      <div className="text-4xl font-bold text-gray-800 font-mono tracking-wider">
                        {formatTime(currentTime)}
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Current Time
                      </p>
                    </div>
                  </div>
                )}
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

{/* Admin-only section to create restaurant managers */}


// MANAGER VIEW
if (view === 'manager') {

  <PendingEmployeeApprovals currentUser={currentUser} />

// To add this component to the manager view, insert this line right after the restaurant info card:
// <PendingEmployeeApprovals currentUser={currentUser} />
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
        {/* Restaurant info */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {currentUser?.restaurantName || 'Your Restaurant'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage employees for your restaurant
              </p>
            </div>
            <UserProfileBadge user={currentUser} />
          </div>
        </div>
          
        <PendingEmployeeApprovals currentUser={currentUser} />

        {/* Invite employee form - only for this restaurant */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Invite New Employee
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Send an email invitation to join your restaurant
            </p>
          </div>
          
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="inviteEmail" className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
                <input
                  type="email"
                  id="inviteEmail"
                  placeholder="employee@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="inviteRole" className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                <select
                  id="inviteRole"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="Employee">Employee</option>
                </select>
              </div>
              <div className="sm:col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={handleSendInvite}
                  disabled={isLoading || !inviteEmail || (inviteRole === 'Manager' && !selectedManagerRestaurant)}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full justify-center ${isLoading || !inviteEmail || (inviteRole === 'Manager' && !selectedManagerRestaurant) ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Invite'
                  )}
                </button>
              </div>
            </div>
            
            {inviteSuccess && (
              <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Invitation sent successfully! The employee will receive an email with instructions.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Employee management section - filtered by restaurant */}
        <div className="w-full">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Employee Management</h2>
            <p className="text-gray-500">Manage employees for {currentUser?.restaurantName || 'your restaurant'}</p>
          </div>
          
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            {/* Search bar */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
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
            </div>

            {/* Employee table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
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
                        <input
                          type="email"
                          className="w-full px-2 py-1 border border-indigo-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          value={editEmployee.email}
                          onChange={(e) => setEditEmployee({...editEmployee, email: e.target.value})}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          className="w-full px-2 py-1 border border-indigo-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          value={editEmployee.jobTitle}
                          onChange={(e) => setEditEmployee({...editEmployee, jobTitle: e.target.value})}
                        >
                          <option value="Employee">Employee</option>
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
                          onClick={saveEmployeeEditToFirebase}
                          className="text-green-600 hover:text-green-900 mr-3"
                          aria-label="Save changes"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                          aria-label="Cancel editing"
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
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-50 text-green-700">
                            {employee.jobTitle}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
                            onClick={() => removeEmployeeFromFirebase(employee.id)}
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
                      <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500">
                        No employees found. Try a different search or invite new employees.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
}
  return null;
};
export default RestaurantLoyaltyApp;