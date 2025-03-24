// This component should be extracted to its own file
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { User, CheckCircle, XCircle } from 'lucide-react';
import { db, updateEmployee } from './firebase';

const PendingEmployeeApprovals = ({ currentUser, activeRestaurant }) => {
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [localNotification, setLocalNotification] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);
  
  // Keep track of component mount status to prevent state updates after unmount
  const isMounted = useRef(true);
  
  useEffect(() => {
    // Set up mount status
    isMounted.current = true;
    
    // Clean up on unmount
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  const loadPendingEmployees = async () => {
    // Get the correct restaurantId based on user role and active selection
    const restaurantId = activeRestaurant?.id || currentUser?.restaurantId;
    
    if (!restaurantId) {
      showLocalNotification("No restaurant selected", "error");
      return;
    }
    
    try {
      setIsRefreshing(true);
      
      const employeesRef = collection(db, 'employees');
      const q = query(
        employeesRef, 
        where("restaurantId", "==", restaurantId),
        where("status", "==", "pending")
      );
      
      const querySnapshot = await getDocs(q);
      const pendingData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Only update state if component is still mounted
      if (isMounted.current) {
        setPendingEmployees(pendingData);
        setHasCheckedOnce(true);
        setIsRefreshing(false);
        
        if (pendingData.length > 0) {
          showLocalNotification(`Found ${pendingData.length} pending application(s)`, "info");
        } else {
          showLocalNotification("No pending applications found", "info");
        }
      }
    } catch (error) {
      console.error("Error loading pending employees:", error);
      if (isMounted.current) {
        showLocalNotification("Failed to load pending employees", "error");
        setIsRefreshing(false);
      }
    }
  };

  // Show notification within this component only
  const showLocalNotification = (message, type = 'info') => {
    setLocalNotification({ message, type });
    setTimeout(() => {
      if (isMounted.current) {
        setLocalNotification(null);
      }
    }, 3000);
  };
  
  // Internal Notification component
  const LocalNotification = ({ message, type }) => {
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

  // Approve an employee
  const handleApprove = async (employeeId) => {
    try {
      await updateEmployee(employeeId, {
        status: 'approved',
        updatedAt: new Date()
      });
      
      // Remove from the local state immediately
      if (isMounted.current) {
        setPendingEmployees(prev => prev.filter(emp => emp.id !== employeeId));
        showLocalNotification("Employee approved successfully", "success");
      }
    } catch (error) {
      console.error("Error approving employee:", error);
      if (isMounted.current) {
        showLocalNotification("Failed to approve employee", "error");
      }
    }
  };

// Replace the handleDecline function in PendingEmployeeApprovals.jsx
const handleDecline = async (employeeId) => {
  try {
    // Use the new function instead of just updating the status
    await declineEmployeeApplication(employeeId);
    
    // Remove from the local state immediately
    if (isMounted.current) {
      setPendingEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      showLocalNotification("Employee application declined", "success");
    }
  } catch (error) {
    console.error("Error declining employee:", error);
    if (isMounted.current) {
      showLocalNotification("Failed to decline employee", "error");
    }
  }
};

  // Render with refresh button
  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
      {localNotification && <LocalNotification message={localNotification.message} type={localNotification.type} />}
      
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Pending Applications
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Click refresh to check for new applications
          </p>
        </div>
        <button 
          onClick={loadPendingEmployees}
          disabled={isRefreshing}
          className="flex items-center px-3 py-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg text-indigo-600 transition-colors"
        >
          {isRefreshing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Check for Applications
            </>
          )}
        </button>
      </div>
      
      {!hasCheckedOnce ? (
        <div className="p-6 text-center text-gray-500">
          Click the refresh button to check for pending applications.
        </div>
      ) : pendingEmployees.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No pending applications found.
        </div>
      ) : (
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
                  Date Applied
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingEmployees.map(employee => (
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.createdAt?.toDate
                      ? employee.createdAt.toDate().toLocaleDateString()
                      : new Date(employee.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleApprove(employee.id)}
                      className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md mr-2 transition-colors"
                      aria-label="Approve employee"
                    >
                      <CheckCircle size={14} className="inline mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleDecline(employee.id)}
                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                      aria-label="Decline employee"
                    >
                      <XCircle size={14} className="inline mr-1" />
                      Decline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PendingEmployeeApprovals;