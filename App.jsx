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
  Mail,
  Wrench,
  ChevronLeft
} from 'lucide-react';
import MaintenanceManagement from './MaintenanceManagement';
import { subscribeToUserCooldown } from './RestaurantAnalytics';
import MaintenanceIntegration from './MaintenanceIntegration';
import { Store } from 'lucide-react';
import VerificationPopup from './VerificationPopup';
import AnalyticsDashboard from './AnalyticsDashboard';
import { recordRestaurantVisit, checkCooldownPeriod } from './RestaurantAnalytics';
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
  db,
  auth
} from './firebase';

import { collection, query, where, getDocs } from 'firebase/firestore';
import EmployeeRestaurantSelector from './EmployeeRestaurantSelector';
import GeneralManagerManagement from './GeneralManagerManagement';
import RestaurantSelector from './RestaurantSelector';
import UserManagementTable from './UserManagementTable';
import Pagination from './Pagination';

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
  const [activeRestaurant, setActiveRestaurant] = useState(null);
  const [managerView, setManagerView] = useState('manage');
  const [showVerification, setShowVerification] = useState(false);
  const [pendingRestaurant, setPendingRestaurant] = useState(null);
  const [cooldownInfo, setCooldownInfo] = useState(null);
  const [cooldownChecked, setCooldownChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCompletePassword, setShowCompletePassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showMaintenanceView, setShowMaintenanceView] = useState(false);


  const RESTAURANTS = [
    { id: "coras", name: "Cora's Breakfast", discount: 10 },
    { id: "js-roadhouse", name: "J's Roadhouse", discount: 20 },
    { id: "swiss-chalet", name: "Swiss Chalet", discount: 20 },
    { id: "poke-bar", name: "Poke Bar", discount: 20 },
    { id: "wellness-studio", name: "Wellness Studio", discount: 10 },
    { id: "east-side-marios-orillia", name: "East Side Mario's Orillia", discount: 20 },
    {
      id: "lot-88",
      name: "Lot 88",
      discount: 20,
      locations: [
        { id: "lot88-sudbury", name: "Sudbury", discount: 20 },
        { id: "lot88-timmins", name: "Timmins", discount: 20 },
        { id: "lot88-orillia", name: "Orillia", discount: 20 },
        { id: "lot88-north-bay", name: "North Bay", discount: 20 },
        { id: "lot88-thunder-bay", name: "Thunder Bay", discount: 20 },
        { id: "lot88-burlington", name: "Burlington", discount: 20 }
      ]
    }, 
    {
      id: "kelseys",
      name: "Kelseys",
      discount: 20,
      locations: [
        { id: "kelseys-sudbury", name: "Sudbury", discount: 20 },
        { id: "kelseys-orillia", name: "Orillia", discount: 20 }
      ]
    }, 
    {
      id: "montanas",
      name: "Montanas",
      discount: 20,
      locations: [
        { id: "montanas-sudbury", name: "Sudbury", discount: 20 },
        { id: "montanas-orillia", name: "Orillia", discount: 20 }
      ]
    }, 
    {
      id: "overtime-bar",
      name: "Overtime Bar",
      discount: 20,
      locations: [
        { id: "overtime-sudbury", name: "Sudbury", discount: 20 },
        { id: "overtime-val-caron", name: "Val Caron", discount: 20 },
        { id: "overtime-chelmsford", name: "Chelmsford", discount: 20 }
      ]
    },   {
      id: "happy-life",
      name: "Happy Life",
      discount: 10,
      locations: [
        { id: "happy-life-kingsway", name: "Kingsway", discount: 10 },
        { id: "happy-life-val-caron", name: "Val Caron ", discount: 10 },
        { id: "happy-life-chelmsford", name: "Chelmsford ", discount: 10 },
        { id: "happy-life-timmins", name: "Timmins ", discount: 10 },
        { id: "happy-life-lakeshore", name: "Lakeshore", discount: 10 },
        { id: "happy-life-alqonquin", name: "Alqonquin", discount: 10 },
        { id: "happy-life-espanola", name: "Espanola", discount: 10 }
      ]
    },
  ]


useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const employeesRef = collection(db, 'employees');
        const q = query(employeesRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const employeeData = querySnapshot.docs[0].data();
          
          if (employeeData.status === 'pending') {
            await logoutUser();
            setLoginError('Your account is pending approval from your manager. Please contact your manager for assistance.');
            return;
          }
          
          if (employeeData.status === 'rejected') {
            await logoutUser();
            setLoginError('Your application has been declined. Please contact your restaurant manager for more information.');
            return;
          }
          
          const userData = {
            id: user.uid,
            name: employeeData.name || user.displayName || user.email,
            email: user.email,
            jobTitle: employeeData.jobTitle || 'Employee',
            restaurantId: employeeData.restaurantId || null,
            restaurantName: employeeData.restaurantName || null
          };
          
          if (employeeData.jobTitle === 'General Manager' && employeeData.managedRestaurants) {
            userData.managedRestaurants = employeeData.managedRestaurants;
          }
          
          setCurrentUser(userData);
          
          const userView = employeeData.jobTitle === 'Admin' ? 'admin' : 
                        (employeeData.jobTitle === 'Manager' || employeeData.jobTitle === 'General Manager' ? 
                        'manager' : 'employee');
          
          setView(userView);
          
          localStorage.setItem('currentUser', JSON.stringify(userData));
          localStorage.setItem('currentView', userView);
        } else {
          await logoutUser();
          localStorage.removeItem('currentUser');
          localStorage.removeItem('currentView');
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        await logoutUser();
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentView');
      }
    } else {
      setCurrentUser(null);
      setView('login');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentView');
    }
  });
  
  return () => unsubscribe();
}, []);



const filteredRestaurants = () => {
  if (currentUser && currentUser.jobTitle === 'Employee') {
    return RESTAURANTS;
  }
  
  if (currentUser && (currentUser.jobTitle === 'Manager' || currentUser.jobTitle === 'General Manager')) {
    if (currentUser.managedRestaurants && currentUser.managedRestaurants.length > 0) {
      return RESTAURANTS.filter(r => currentUser.managedRestaurants.includes(r.id));
    }
    
    if (currentUser.restaurantId) {
      return RESTAURANTS.filter(r => r.id === currentUser.restaurantId);
    }
  }
  
  return RESTAURANTS;
};
  
    const [email, setEmail] = useState(''); // Instead of username
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);


useEffect(() => {
  const storedUser = localStorage.getItem('currentUser');
  const storedView = localStorage.getItem('currentView');
  
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);
      
      if (storedView) {
        setView(storedView);
      } else {
        if (parsedUser.jobTitle === 'Admin') {
          setView('admin');
        } else if (parsedUser.jobTitle === 'Manager' || parsedUser.jobTitle === 'General Manager') {
          setView('manager');
        } else {
          setView('employee');
        }
      }
    } catch (error) {
      console.error("Error parsing stored user:", error);

    }
  }
}, []);


localStorage.removeItem('currentUser');
localStorage.removeItem('currentView');

useEffect(() => {
  const loadEmployees = async () => {
    setIsLoading(true);
    
    let unsubscribe;
    
    if (currentUser && currentUser.jobTitle === 'Manager' && currentUser.restaurantId) {
      unsubscribe = subscribeToRestaurantEmployees((employeesData) => {
        const filteredData = employeesData.filter(emp => 
          emp.jobTitle === 'Employee' || 
          emp.id === currentUser.id
        );
        
        setEmployees(filteredData);
        setFilteredEmployees(filteredData);
        setIsLoading(false);
      }, currentUser.restaurantId);
    } else if (currentUser && currentUser.jobTitle === 'General Manager' && activeRestaurant) {
        unsubscribe = subscribeToRestaurantEmployees((employeesData) => {
        const filteredData = employeesData.filter(emp => 
          emp.jobTitle === 'Employee' || 
          emp.jobTitle === 'Manager' ||
          emp.id === currentUser.id
        );
        
        setEmployees(filteredData);
        setFilteredEmployees(filteredData);
        setIsLoading(false);
      }, activeRestaurant.id);
    } else if (currentUser && currentUser.jobTitle === 'Admin') {
      unsubscribe = subscribeToEmployees((employeesData) => {
        setEmployees(employeesData);
        setFilteredEmployees(employeesData);
        setIsLoading(false);
      });
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  };
  
  if ((view === 'manager' || view === 'admin') && currentUser) {
    loadEmployees();
  }
}, [view, currentUser, activeRestaurant]);

  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setLoginError('');
    setIsLoading(true);
    
    try {
      if (completeSignupPassword !== completeSignupConfirmPassword) {
        throw new Error('Passwords do not match');
      }
      
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
    let unsubCooldown = null;
    
    if (currentUser) {
      unsubCooldown = subscribeToUserCooldown(currentUser.id, (cooldownInfo) => {
        setCooldownInfo(cooldownInfo);
        setCooldownChecked(true);
      });
    } else {
      setCooldownInfo(null);
      setCooldownChecked(false);
    }
    
    return () => {
      if (unsubCooldown) {
        unsubCooldown();
      }
    };
  }, [currentUser]);

  const handleConfirmRestaurant = async () => {
    if (!pendingRestaurant) return;
    
    try {
      await recordRestaurantVisit(
        currentUser.id,
        currentUser.restaurantName || "Not Specified",
        pendingRestaurant.name
      );
      
      // Update local state
      setSelectedRestaurant(pendingRestaurant);
      // Check if this is a location-specific selection
      if (pendingRestaurant.locationName) {
        setSelectedLocation(pendingRestaurant.locationName);
      } else {
        setSelectedLocation(pendingRestaurant.name);
      }
      setShowRestaurantDropdown(false);
      
      // Update cooldown information (now 15 minutes)
      setCooldownInfo({
        inCooldown: true,
        cooldownUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        visitedRestaurant: pendingRestaurant.name
      });
      
      // Show notification
      showNotification(`You've selected ${pendingRestaurant.name}. This selection will be locked for 15 minutes.`, 'success');
    } catch (error) {
      console.error("Error confirming restaurant:", error);
      showNotification("Failed to record your restaurant selection", "error");
    } finally {
      setShowVerification(false);
      setPendingRestaurant(null);
    }
  };
  
  const handleCancelVerification = () => {
    setShowVerification(false);
    setPendingRestaurant(null);
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
      
      // First check if the user exists in our database and has approved status
      const employeesRef = collection(db, 'employees');
      const normalizedEmail = email.toLowerCase();
      
      // Try with both original and lowercase email
      const q1 = query(employeesRef, where("email", "==", email));
      let querySnapshot = await getDocs(q1);
      
      // If no match, try with lowercase email
      if (querySnapshot.empty) {
        const q2 = query(employeesRef, where("email", "==", normalizedEmail));
        querySnapshot = await getDocs(q2);
      }
      
      if (querySnapshot.empty) {
        throw new Error('User not found in employees database');
      }
      
      // Get the employee data
      const employeeData = querySnapshot.docs[0].data();
      
      // Check approval status BEFORE authentication
      if (employeeData.status === 'pending') {
        throw new Error('Your account is pending approval from your manager. Please contact your manager for assistance.');
      }
      
      if (employeeData.status === 'rejected') {
        throw new Error('Your application has been declined. Please contact your restaurant manager for more information.');
      }
      
      // Only proceed with Firebase login if approved
      const user = await loginWithEmailAndPassword(email, password);
      
      // Build the current user object
      const userData = {
        id: user.uid,
        name: employeeData.name || user.displayName || email,
        email: normalizedEmail,
        jobTitle: employeeData.jobTitle || 'Employee',
        restaurantId: employeeData.restaurantId || null,
        restaurantName: employeeData.restaurantName || null
      };
      
      // Add managed restaurants for general managers
      if (employeeData.jobTitle === 'General Manager' && employeeData.managedRestaurants) {
        userData.managedRestaurants = employeeData.managedRestaurants;
      }
      
      setCurrentUser(userData);
  
      // Determine which view to show
      const userView = employeeData.jobTitle === 'Admin' ? 'admin' : 
                      (employeeData.jobTitle === 'Manager' || employeeData.jobTitle === 'General Manager' ? 
                      'manager' : 'employee');
      
      // Set the view
      setView(userView);
      
      // Save to localStorage
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('currentView', userView);
      
      showNotification('Login successful', 'success');
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(error.message || 'Login failed. Check your credentials.');
      
      // Ensure they're logged out if they tried with invalid credentials
      await logoutUser();
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentView');
    } finally {
      setIsLoading(false);
    }
  };

const handleLogout = async () => {
  try {
    // Firebase logout
    await logoutUser();
    
    // Clear localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentView');
    localStorage.removeItem('emailForSignIn');
    
    // Reset all relevant state
    setView('login');
    setEmail('');
    setPassword('');
    setSelectedLocation('');
    setCurrentUser(null);
    setActiveRestaurant(null);
    setSelectedRestaurant(null);
    setCooldownInfo(null);
    setCooldownChecked(false);
    
    // Show notification
    showNotification("Successfully logged out", "success");
  } catch (error) {
    console.error("Logout error:", error);
    showNotification("Error logging out", "error");
  }
};

const getDiscount = (locationName) => {
  // Check if this is a combined restaurant-location name (e.g. "Happy Life - Sudbury")
  if (locationName.includes(' - ')) {
    const [restaurantName, specificLocation] = locationName.split(' - ');
    
    // Find the restaurant first
    const restaurant = RESTAURANTS.find(r => r.name === restaurantName);
    if (restaurant) {
      // Then find the specific location within that restaurant
      if (restaurant.locations) {
        const location = restaurant.locations.find(l => l.name === specificLocation);
        if (location && typeof location.discount === 'number') {
          return location.discount;
        }
      }
      // If location not found but restaurant is, use restaurant discount
      if (typeof restaurant.discount === 'number') {
        return restaurant.discount;
      }
    }
  }
  
  // Original logic for direct restaurant match
  const restaurantByName = RESTAURANTS.find(r => r.name === locationName);
  if (restaurantByName && typeof restaurantByName.discount === 'number') {
    return restaurantByName.discount;
  }
  
  // Original logic for checking locations
  for (const restaurant of RESTAURANTS) {
    if (restaurant.locations) {
      const locationObj = restaurant.locations.find(l => l.name === locationName);
      if (locationObj && typeof locationObj.discount === 'number') {
        return locationObj.discount;
      }
    }
  }
  
  // Default return if no match found
  return 20; // Default discount
};

const handleSelectRestaurant = (restaurant) => {
  // First check if user is in cooldown period
  if (cooldownInfo && cooldownInfo.inCooldown) {
    const cooldownEnds = new Date(cooldownInfo.cooldownUntil);
    const minutesLeft = Math.ceil((cooldownEnds - new Date()) / (1000 * 60));
    
    showNotification(
      `You already selected ${cooldownInfo.visitedRestaurant}. Please wait ${minutesLeft} minutes before selecting another restaurant.`, 
      'error'
    );
    return;
  }
  
  // Show the verification popup
  setPendingRestaurant(restaurant);
  setShowVerification(true);
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

  const handleDeleteRequest = async (requestId) => {
    try {
      if (!confirm("Are you sure you want to delete this maintenance request?")) {
        return; // User cancelled
      }
      
      setIsLoading(true);
      await deleteMaintenanceRequest(requestId);
      
      // Update state
      setMaintenanceRequests(prev => prev.filter(req => req.id !== requestId));
      setFilteredRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Close detail modal if open
      if (showDetailModal && selectedRequest?.id === requestId) {
        setShowDetailModal(false);
        setSelectedRequest(null);
      }
      
      showNotification('Maintenance request deleted successfully', 'success');
    } catch (error) {
      console.error("Error deleting maintenance request:", error);
      showNotification('Failed to delete maintenance request', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const MobileNavbar = ({ currentUser, view, setView, handleLogout }) => {
    const [showMenu, setShowMenu] = useState(false);
    
    const toggleMenu = () => {
      setShowMenu(!showMenu);
    };
    
    return (
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20 p-3 flex justify-between items-center">
          <div className="flex items-center">
            <img src="/logo.jpg" alt="Logo" className="h-8 w-8 rounded-full mr-2" />
            <h1 className="text-lg font-semibold text-indigo-700">Law Loyalty</h1>
          </div>
          
          <button 
            onClick={toggleMenu} 
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
          >
            {showMenu ? (
              <X size={24} />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {showMenu && (
          <div className="fixed inset-0 z-10 bg-gray-900 bg-opacity-50" onClick={toggleMenu}>
            <div 
              className="absolute right-0 top-0 h-full w-64 bg-white shadow-lg py-4 px-2"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                <div className="flex-grow">
                  {currentUser && (
                    <div className="px-4 py-3 border-b border-gray-200 mb-4">
                      <div className="flex items-center mb-2">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                          <User size={20} className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{currentUser.name}</p>
                          <p className="text-xs text-gray-500">{currentUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                          {currentUser.jobTitle}
                        </span>
                        {currentUser.restaurantName && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full ml-2">
                            {currentUser.restaurantName}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="px-2 space-y-1">
                    {currentUser && currentUser.jobTitle === 'Employee' && (
                      <>
                        <button 
                          onClick={() => {
                            setView('employee');
                            setShowMenu(false);
                          }} 
                          className={`w-full flex items-center px-4 py-3 rounded-lg text-left ${view === 'employee' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
                        >
                          <Percent size={20} className="mr-3" />
                          My Discount
                        </button>
                      </>
                    )}
                    
                    {currentUser && (currentUser.jobTitle === 'Manager' || currentUser.jobTitle === 'General Manager') && (
                      <>
                        <button 
                          onClick={() => {
                            setView('manager');
                            setManagerView('manage');
                            setShowMenu(false);
                          }} 
                          className={`w-full flex items-center px-4 py-3 rounded-lg text-left ${view === 'manager' && managerView === 'manage' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
                        >
                          <User size={20} className="mr-3" />
                          Manage Employees
                        </button>
                        
                        <button 
                          onClick={() => {
                            setView('manager');
                            setManagerView('discount');
                            setShowMenu(false);
                          }} 
                          className={`w-full flex items-center px-4 py-3 rounded-lg text-left ${view === 'manager' && managerView === 'discount' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
                        >
                          <Percent size={20} className="mr-3" />
                          View Discount
                        </button>
                      </>
                    )}
                    
                    {currentUser && currentUser.jobTitle === 'Admin' && (
                      <>
                        <button 
                          onClick={() => {
                            setView('admin');
                            setShowMenu(false);
                          }} 
                          className={`w-full flex items-center px-4 py-3 rounded-lg text-left ${view === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
                        >
                          <Shield size={20} className="mr-3" />
                          Admin Dashboard
                        </button>
                        
                        <button 
                          onClick={() => {
                            setActiveTab('analytics');
                            setShowMenu(false);
                          }} 
                          className={`w-full flex items-center px-4 py-3 rounded-lg text-left ${activeTab === 'analytics' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
                        >
                          <BarChart2 size={20} className="mr-3" />
                          Analytics
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <button 
                    onClick={() => {
                      handleLogout();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut size={20} className="mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
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
  
const startEditEmployee = (employee) => {
  setEditEmployee({...employee});
  setIsEditingEmployee(true);
  // Don't modify the filteredEmployees array or do anything that would reorder it
};
  
// Update the saveEmployeeEditToFirebase function
const saveEmployeeEditToFirebase = async () => {
  if (editEmployee && editEmployee.id) {
    try {
      setIsLoading(true);
      
      // Create an update object with necessary fields
      const updateData = {
        name: editEmployee.name,
        email: editEmployee.email,
        jobTitle: editEmployee.jobTitle,
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

  const MobileNavigation = () => {
    // Navigation tabs - we're using a scrollable horizontal container
    return (
      <div className="bg-white shadow-sm border-b border-gray-200 mb-6 overflow-x-auto">
        <div className="flex whitespace-nowrap min-w-full px-2">
          <button
            onClick={() => setManagerView('manage')}
            className={`px-4 py-3 font-medium text-sm transition-colors flex-shrink-0 ${
              managerView === 'manage' 
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <User size={16} className="mr-2 flex-shrink-0" />
              <span>Manage Employees</span>
            </div>
          </button>
          
          <button
            onClick={() => setManagerView('discount')}
            className={`px-4 py-3 font-medium text-sm transition-colors flex-shrink-0 ${
              managerView === 'discount' 
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <Percent size={16} className="mr-2 flex-shrink-0" />
              <span>View Discount</span>
            </div>
          </button>
          
          {/* Only show Maintenance button for General Manager */}
          {currentUser && currentUser.jobTitle === 'General Manager' && (
            <button
              onClick={() => setShowMaintenanceView(true)}
              className={`px-4 py-3 font-medium text-sm transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex-shrink-0`}
            >
              <div className="flex items-center">
                <Wrench size={16} className="mr-2 flex-shrink-0" />
                <span>Maintenance</span>
              </div>
            </button>
          )}
          
          {/* Only show Analytics button for Admin or General Manager */}
          {currentUser && (currentUser.jobTitle === 'Admin' || currentUser.jobTitle === 'General Manager') && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-3 font-medium text-sm transition-colors flex-shrink-0 ${
                activeTab === 'analytics' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <BarChart2 size={16} className="mr-2 flex-shrink-0" />
                <span>Analytics</span>
              </div>
            </button>
          )}
        </div>
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
    (!emp.status || emp.status === 'approved')
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
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm flex items-center">
              <XCircle size={16} className="mr-2 flex-shrink-0" />
              <span>{loginError}</span>
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
  if (showMaintenanceView) {
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
              {currentUser && currentUser.jobTitle === 'General Manager' && (
                <button 
                  onClick={() => setShowMaintenanceView(true)}
                  className="flex items-center p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                >
                  <Wrench size={18} className="mr-1" />
                  <span className="hidden md:inline">Maintenance</span>
                </button>
              )}
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
        <main className="flex-grow">
          <MaintenanceManagement currentUser={currentUser} />
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs text-center text-gray-500">
              &copy; {new Date().getFullYear()} Josh Law • All rights reserved
            </p>
          </div>
        </footer>
      </div>
    );
  }

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
            {/* Add Maintenance Management Button Here */}
            <button 
              onClick={() => setShowMaintenanceView(true)}
              className="flex items-center p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
            >
              <Wrench size={18} className="mr-1" />
              <span className="hidden md:inline">Maintenance Management</span>
            </button>
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


    {currentUser && currentUser.jobTitle === 'Admin' && (
      <GeneralManagerManagement currentUser={currentUser} />
    )}

  <PendingEmployeeApprovals 
          currentUser={currentUser} 
          activeRestaurant={activeRestaurant}
        />

      {/* Main content */}
      <main className="flex-grow max-w-6xl w-full mx-auto py-8 px-4">
        {/* Employee management section */}
        <div className="w-full">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
              <p className="text-gray-500">Manage all users across locations</p>
            </div>
            <UserProfileBadge user={currentUser} />
          </div>
          <UserManagementTable 
            employees={employees}
            filteredEmployees={filteredEmployees}
            searchTerm={searchTerm}
            startEditEmployee={startEditEmployee}
            saveEmployeeEditToFirebase={saveEmployeeEditToFirebase}
            cancelEdit={cancelEdit}
            removeEmployeeFromFirebase={removeEmployeeFromFirebase}
            editEmployee={editEmployee}
            isEditingEmployee={isEditingEmployee}
            getRestaurantName={getRestaurantName}
            RESTAURANTS={RESTAURANTS}
            onSearchChange={(value) => setSearchTerm(value)}
          />
        </div>
      </main>

      {currentUser && currentUser.jobTitle === 'Admin' && (
        <AnalyticsDashboard />
      )}
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-center text-gray-500">
            &copy; {new Date().getFullYear()} Josh Law • All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}


if (view === 'login') {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center mb-4">
              <img src="/logo.jpg" alt="Restaurant Logo" className="h-full w-full object-contain rounded-full" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Law Loyalty</h1>
          <p className="mt-2 text-gray-500">Employee Discount System</p>
        </div>
        
        <form className="mt-6 space-y-5" onSubmit={handleLogin}>
          <div className="space-y-4">
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
                  autoComplete="email"
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
                  type={showLoginPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                >
                  {showLoginPassword ? (
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

          <div className="mt-2 text-center">
            <p className="text-sm text-gray-500">
              New users can <a href="/signup" className="text-indigo-600 hover:text-indigo-800 font-medium">sign up here</a>.
            </p>
          </div>

          {loginError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center">
              <XCircle size={16} className="mr-2 flex-shrink-0" />
              <span>{loginError}</span>
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
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs sm:text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Josh Law • All rights reserved
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
                  type={showCompletePassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Create a secure password"
                  value={completeSignupPassword}
                  onChange={(e) => setCompleteSignupPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowCompletePassword(!showCompletePassword)}
                >
                  {showCompletePassword ? (
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

      {showVerification && (
  <VerificationPopup
    restaurantName={pendingRestaurant?.name}
    onConfirm={handleConfirmRestaurant}
    onCancel={handleCancelVerification}
  />
)}

      {/* Main content */}
      <main className="flex-grow max-w-5xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          {/* User info card */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <UserProfileBadge user={currentUser} />
          </div>

{/* Location selector */}
<div className="p-6 border-b border-gray-200">
  <EmployeeRestaurantSelector 
    restaurants={filteredRestaurants()} 
    currentUser={currentUser} 
    selectedRestaurant={selectedRestaurant} 
    onSelectRestaurant={handleSelectRestaurant} 
    cooldownInfo={cooldownInfo} 
  />
</div>

          {/* Discount display */}
          {selectedLocation ? (
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Your Discount</h3>
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg overflow-hidden">
                {/* Header section */}
                <div className="px-5 py-4 border-b border-indigo-400 border-opacity-30">
                  <h4 className="text-white text-xl font-bold">Employee Verification</h4>
                  <p className="text-indigo-100 text-sm">Show this screen to receive your discount</p>
                </div>
                
                {/* Employee information section */}
                <div className="px-5 py-4 space-y-4">
                  {/* Employee name with ID verification note */}
                  <div className="bg-white bg-opacity-10 rounded-lg p-3 border border-white border-opacity-20">
                    <p className="text-indigo-100 text-xs mb-1">Employee Name (Must Match ID)</p>
                    <div className="flex items-center">
                      <User size={18} className="text-white mr-2" />
                      <p className="text-xl font-bold text-white">{currentUser?.name}</p>
                    </div>
                  </div>
                  
                  {/* Employee's workplace */}
                  <div className="bg-white bg-opacity-10 rounded-lg p-3 border border-white border-opacity-20">
                    <p className="text-indigo-100 text-xs mb-1">Employee Works At</p>
                    <div className="flex items-center">
                      <Building size={18} className="text-white mr-2" />
                      <p className="text-white font-medium">{currentUser?.restaurantName || "Company Restaurant"}</p>
                    </div>
                  </div>
                  
                  {/* Current dining location */}
                  <div className="bg-white bg-opacity-10 rounded-lg p-3 border border-white border-opacity-20">
                    <p className="text-indigo-100 text-xs mb-1">Dining At</p>
                    <div className="flex items-center">
                      <MapPin size={18} className="text-white mr-2" />
                      <p className="text-white font-medium">{selectedLocation}</p>
                    </div>
                  </div>
                  
                  {/* Discount details */}
                  <div className="bg-white bg-opacity-10 rounded-lg p-3 border border-white border-opacity-20">
                    <p className="text-indigo-100 text-xs mb-1">Discount Amount</p>
                    <div className="flex items-center">
                      <Percent size={18} className="text-white mr-2" />
                      <p className="text-3xl font-bold text-white">{currentDiscount}%</p>
                    </div>
                  </div>
                </div>
                
                {/* Live clock and date verification */}
                <div className="bg-indigo-700 rounded-lg px-4 py-2 w-full text-center">
                  <p className="text-white text-sm mb-1">
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-4xl font-mono font-bold text-white tracking-wider">
                    {formatTime(currentTime)}
                  </p>
                </div>
                
                {/* Verification instruction */}
                <div className="bg-indigo-800 px-5 py-4">
                  <div className="flex items-start">
                    <CheckCircle size={20} className="text-indigo-200 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-indigo-100 text-sm">
                      Staff: Please verify employee name with their ID. The live clock confirms this is being viewed in real-time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-indigo-100">
                <Building size={24} className="text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Select a Location</h3>
              <p className="mt-2 text-sm text-gray-500">
                Choose a location from the dropdown above to view your available discount.
              </p>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-center text-gray-500">
            &copy; {new Date().getFullYear()} Josh Law • All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}



// Inside the App.jsx file, update the MANAGER VIEW section

// MANAGER VIEW
if (view === 'manager') {
  if (view === 'manager' && showMaintenanceView && currentUser && currentUser.jobTitle === 'General Manager') {
    return (
      <MaintenanceIntegration 
        currentUser={currentUser} 
        onBack={() => setShowMaintenanceView(false)} 
      />
    );
  }
  // Get the current discount based on selected location or active restaurant
  const currentDiscount = selectedLocation ? 
    getDiscount(selectedLocation) : 
    (activeRestaurant ? getDiscount(activeRestaurant.name) : 0);

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





      {currentUser && (currentUser.jobTitle === 'General Manager' || currentUser.jobTitle === 'Admin') && (
        <RestaurantSelector 
          currentUser={currentUser}
          restaurants={RESTAURANTS}
          onSelectRestaurant={(restaurant) => {
            console.log("Restaurant selected:", restaurant);
            setActiveRestaurant(restaurant);
          }}
        />
      )}


      {/* Main content */}
      <main className="flex-grow max-w-6xl w-full mx-auto py-8 px-4">
        {/* Conditionally render either Manage view or Discount view */}
        {managerView === 'manage' ? (
          <>
            {/* Restaurant info */}
            <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {activeRestaurant?.name || currentUser?.restaurantName || 'Your Restaurant'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage employees for {activeRestaurant?.name || currentUser?.restaurantName || 'your restaurant'}
                  </p>
                </div>
                <UserProfileBadge user={currentUser} />
              </div>
            </div>

            <PendingEmployeeApprovals 
              currentUser={currentUser} 
              activeRestaurant={activeRestaurant}
            />
            
            

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
                    <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                      {filteredEmployees.map((employee) => (
                        <tr key={employee.id} className={`hover:bg-gray-50 ${isEditingEmployee && editEmployee && employee.id === editEmployee.id ? 'bg-indigo-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <User size={14} className="text-indigo-600" />
                              </div>
                              <div className="ml-3">
                                {isEditingEmployee && editEmployee && employee.id === editEmployee.id ? (
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1 border border-indigo-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    value={editEmployee.name}
                                    onChange={(e) => setEditEmployee({...editEmployee, name: e.target.value})}
                                  />
                                ) : (
                                  <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {isEditingEmployee && editEmployee && employee.id === editEmployee.id ? (
                              <input
                                type="email"
                                className="w-full px-2 py-1 border border-indigo-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                value={editEmployee.email}
                                onChange={(e) => setEditEmployee({...editEmployee, email: e.target.value})}
                              />
                            ) : (
                              employee.email
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditingEmployee && editEmployee && employee.id === editEmployee.id ? (
                              <select
                                className="w-full px-2 py-1 border border-indigo-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                value={editEmployee.jobTitle}
                                onChange={(e) => setEditEmployee({...editEmployee, jobTitle: e.target.value})}
                              >
                                <option value="Employee">Employee</option>
                                <option value="Manager">Manager</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                employee.jobTitle === 'Admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                employee.jobTitle === 'Manager' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                'bg-green-50 text-green-700 border border-green-200'
                              }`}>
                                {employee.jobTitle}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {isEditingEmployee && editEmployee && employee.id === editEmployee.id ? (
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
                                {RESTAURANTS.map(restaurant => (
                                  <React.Fragment key={restaurant.id}>
                                    {/* Main restaurant option */}
                                    <option value={restaurant.id}>{restaurant.name}</option>
                                    
                                    {/* Display location options if they exist */}
                                    {restaurant.locations && restaurant.locations.map(location => (
                                      <option key={location.id} value={location.id}>
                                        {restaurant.name} - {location.name}
                                      </option>
                                    ))}
                                  </React.Fragment>
                                ))}
                              </select>
                            ) : (
                              employee.restaurantName || 'Not assigned'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {isEditingEmployee && editEmployee && employee.id === editEmployee.id ? (
                              <>
                                <button
                                  onClick={saveEmployeeEditToFirebase}
                                  className="text-green-600 hover:text-green-900 mr-3 bg-green-50 hover:bg-green-100 p-2 rounded-md transition-colors"
                                  aria-label="Save changes"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-md transition-colors"
                                  aria-label="Cancel editing"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditEmployee(employee)}
                                  className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-md mr-2 transition-colors"
                                  aria-label="Edit employee"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => removeEmployeeFromFirebase(employee.id)}
                                  className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-md transition-colors"
                                  aria-label="Remove employee"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
  
                      {filteredEmployees.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500">
                            <div className="flex flex-col items-center justify-center">
                              <User size={24} className="text-gray-300 mb-2" />
                              <p>No employees found. Try a different search or add a new employee.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Discount View - Adapted from employee view with visual improvements
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-center">
              <UserProfileBadge user={currentUser} />
            </div>

            {/* Location selector for discount view */}
            <div className="p-6 border-b border-gray-200">
              <label htmlFor="restaurant" className="block text-sm font-medium text-gray-700 mb-4">
                Select Restaurant Location for Discount Preview
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
                        {selectedRestaurant ? selectedRestaurant.name : (activeRestaurant ? activeRestaurant.name : 'Select a restaurant')}
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
                        <div key={restaurant.id} className="px-1 py-1">
                          {!restaurant.locations ? (
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-md flex items-center gap-2 transition-colors duration-150"
                              onClick={() => {
                                setSelectedRestaurant(restaurant);
                                setSelectedLocation(restaurant.name);
                                setShowRestaurantDropdown(false);
                                // Update activeRestaurant if in manager view
                                if (currentUser.jobTitle === 'General Manager' || currentUser.jobTitle === 'Manager') {
                                  setActiveRestaurant(restaurant);
                                }
                              }}
                            >
                              <Store size={16} className="text-indigo-600 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-gray-900">{restaurant.name}</div>
                              </div>
                            </button>
                          ) : (
                            // For restaurants with multiple locations
                            <>
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-md flex items-center gap-2 transition-colors duration-150"
                                onClick={() => {
                                  setSelectedRestaurant(restaurant);
                                  setSelectedLocation(restaurant.name);
                                  setShowRestaurantDropdown(false);
                                }}
                              >
                                <Store size={16} className="text-indigo-600 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-gray-900">{restaurant.name}</div>
                                </div>
                              </button>
                              <div className="ml-4 mt-1 space-y-1 mb-2">
                              {restaurant.locations.map((location) => (
                              <button
                                key={location.id}
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-md flex items-center gap-2 transition-colors duration-150"
                                onClick={() => {
                                  // Set both the location name and the parent restaurant
                                  setSelectedLocation(location.name);
                                  setSelectedRestaurant(restaurant); // Make sure we update the parent restaurant too
                                  setShowRestaurantDropdown(false);
                                }}
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
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Discount display */}
            {selectedLocation || activeRestaurant ? (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Employee Discount Card</h3>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg overflow-hidden">
                  {/* Header section */}
                  <div className="px-5 py-4 border-b border-indigo-400 border-opacity-30">
                    <h4 className="text-white text-xl font-bold">Employee Verification</h4>
                    <p className="text-indigo-100 text-sm">Show this screen to receive discount</p>
                  </div>
                  
                  {/* Employee information section */}
                  <div className="px-5 py-4 space-y-4">
                    {/* Employee name with ID verification note */}
                    <div className="bg-white bg-opacity-10 rounded-lg p-3 border border-white border-opacity-20">
                      <p className="text-indigo-100 text-xs mb-1">Employee Name (Must Match ID)</p>
                      <div className="flex items-center">
                        <User size={18} className="text-white mr-2" />
                        <p className="text-xl font-bold text-white">{currentUser?.name}</p>
                      </div>
                    </div>
                    
                    {/* Employee's workplace */}
                    <div className="bg-white bg-opacity-10 rounded-lg p-3 border border-white border-opacity-20">
                      <p className="text-indigo-100 text-xs mb-1">Employee Works At</p>
                      <div className="flex items-center">
                        <Building size={18} className="text-white mr-2" />
                        <p className="text-white font-medium">{currentUser?.restaurantName || "Company Restaurant"}</p>
                      </div>
                    </div>
                    
                    {/* Current dining location */}
                    <div className="bg-white bg-opacity-10 rounded-lg p-3 border border-white border-opacity-20">
                      <p className="text-indigo-100 text-xs mb-1">Dining At</p>
                      <div className="flex items-center">
                        <MapPin size={18} className="text-white mr-2" />
                        <p className="text-white font-medium">{selectedLocation || activeRestaurant?.name}</p>
                      </div>
                    </div>
                    
                    {/* Discount details */}
                    <div className="bg-white bg-opacity-10 rounded-lg p-3 border border-white border-opacity-20">
                      <p className="text-indigo-100 text-xs mb-1">Discount Amount</p>
                      <div className="flex items-center">
                        <Percent size={18} className="text-white mr-2" />
                        <p className="text-3xl font-bold text-white">{currentDiscount}%</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Live clock and date verification */}
                  <div className="bg-indigo-700 rounded-lg px-4 py-2 w-full text-center">
                    <p className="text-white text-sm mb-1">
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-4xl font-mono font-bold text-white tracking-wider">
                      {formatTime(currentTime)}
                    </p>
                  </div>
                  
                  {/* Verification instruction */}
                  <div className="bg-indigo-800 px-5 py-4">
                    <div className="flex items-start">
                      <CheckCircle size={20} className="text-indigo-200 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-indigo-100 text-sm">
                        Staff: Please verify employee name with their ID. The live clock confirms this is being viewed in real-time.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Manager Note */}
                <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Manager Info
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This is how the discount card appears to employees. They can show this screen to receive their discount at participating restaurants.
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
                  Choose a restaurant location from the dropdown above to view the available discount.
                </p>
              </div>
            )}
              {showVerification && (
                <VerificationPopup
                  restaurantName={pendingRestaurant?.name}
                  onConfirm={handleConfirmRestaurant}
                  onCancel={handleCancelVerification}
                />
              )}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs text-center text-gray-500">
            &copy; {new Date().getFullYear()} Josh Law • All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
  return null;
};
export default RestaurantLoyaltyApp;