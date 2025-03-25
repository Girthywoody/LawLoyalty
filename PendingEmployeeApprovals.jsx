import React, { useState, useEffect } from 'react';
import { User, CheckCircle, XCircle, Calendar, Mail, Store, Clock } from 'lucide-react';
import { db, updateEmployee, declineEmployeeApplication } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const PendingEmployeeApprovals = ({ currentUser, activeRestaurant }) => {
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchPendingEmployees = async () => {
      if (!currentUser) return;
      
      setIsLoading(true);
      
      try {
        const employeesRef = collection(db, 'employees');
        let q;
        
        if (currentUser.jobTitle === 'Admin') {
          // Admin can see all pending applications
          q = query(employeesRef, where("status", "==", "pending"));
        } else if (currentUser.jobTitle === 'General Manager' && activeRestaurant) {
          // General manager sees pending applications for the currently active restaurant
          q = query(
            employeesRef, 
            where("status", "==", "pending"),
            where("restaurantId", "==", activeRestaurant.id)
          );
        } else if (currentUser.jobTitle === 'Manager' && currentUser.restaurantId) {
          // Regular manager only sees pending applications for their restaurant
          q = query(
            employeesRef, 
            where("status", "==", "pending"),
            where("restaurantId", "==", currentUser.restaurantId)
          );
        } else {
          // No pending applications to show
          setPendingEmployees([]);
          setIsLoading(false);
          return;
        }
        
        const querySnapshot = await getDocs(q);
        const pendingData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPendingEmployees(pendingData);
      } catch (error) {
        console.error("Error fetching pending employees:", error);
        showNotification("Failed to load pending employee applications", "error");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPendingEmployees();
  }, [currentUser, activeRestaurant]);

  const handleApproveEmployee = async (employeeId) => {
    try {
      setIsLoading(true);
      
      // Update the employee status to approved
      await updateEmployee(employeeId, {
        status: 'approved',
        approvedBy: currentUser.id,
        approvedAt: new Date()
      });
      
      // Update local state
      setPendingEmployees(prevEmployees => 
        prevEmployees.filter(employee => employee.id !== employeeId)
      );
      
      showNotification("Employee application approved successfully", "success");
    } catch (error) {
      console.error("Error approving employee:", error);
      showNotification("Failed to approve employee application", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineEmployee = async (employeeId) => {
    try {
      setIsLoading(true);
      
      // Use the declineEmployeeApplication function
      await declineEmployeeApplication(employeeId);
      
      // Update local state
      setPendingEmployees(prevEmployees => 
        prevEmployees.filter(employee => employee.id !== employeeId)
      );
      
      showNotification("Employee application declined", "success");
    } catch (error) {
      console.error("Error declining employee:", error);
      showNotification("Failed to decline employee application", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // If no pending employees or not authorized to see them, don't render the component
  if (pendingEmployees.length === 0 && !isLoading) {
    return null;
  }

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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
      {notification && <Notification message={notification.message} type={notification.type} />}
      
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-yellow-50">
        <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
          <Clock size={20} className="text-amber-600 mr-2" />
          Pending Employee Applications
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Review and approve new employee registrations
        </p>
      </div>
      
      <div className="px-6 py-5">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <>
            {pendingEmployees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pending applications to review
              </div>
            ) : (
              <div className="space-y-4">
                {pendingEmployees.map(employee => (
                  <div key={employee.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                          <User size={18} className="text-indigo-600" />
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">
                            {employee.name || `${employee.firstName} ${employee.lastName}`}
                          </h5>
                          <div className="flex items-center text-xs text-gray-500">
                            <Mail size={12} className="mr-1 flex-shrink-0" />
                            <span className="truncate max-w-[180px] sm:max-w-none">{employee.email}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 self-end sm:self-center">
                        <button
                          onClick={() => handleApproveEmployee(employee.id)}
                          disabled={isLoading}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <CheckCircle size={14} className="mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleDeclineEmployee(employee.id)}
                          disabled={isLoading}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <XCircle size={14} className="mr-1" />
                          Decline
                        </button>
                      </div>
                    </div>
                    
                    <div className="px-4 py-3">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Store size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-600 font-medium mr-1">Restaurant:</span>
                          <span className="text-gray-900">{employee.restaurantName || 'Not specified'}</span>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <Calendar size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-600 font-medium mr-1">Applied:</span>
                          <span className="text-gray-900">{formatDate(employee.createdAt)}</span>
                        </div>
                        
                        <div className="text-sm">
                          <span className="font-medium">Email verification status: </span>
                          {/* Use the proper auth property for email verification */}
                          {employee.uid ? (
                            <span className="text-green-600 font-medium">Account Created</span>
                          ) : (
                            <span className="text-amber-600 font-medium">Account Pending</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PendingEmployeeApprovals;