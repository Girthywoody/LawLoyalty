import React from 'react';
import { Shield, Wrench, ChevronLeft } from 'lucide-react';
import MaintenanceManagement from './MaintenanceManagement';

const MaintenanceIntegration = ({ currentUser, onBack }) => {
  // Allow both General Manager and Maintenance roles to access
  // but pass the isMaintenance flag to control permissions
  if (!currentUser || (currentUser.jobTitle !== 'General Manager' && 
                      currentUser.jobTitle !== 'Maintenance' && 
                      currentUser.jobTitle !== 'Admin')) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-white shadow-lg rounded-xl p-8 max-w-md text-center">
          <Shield size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">
            Only Maintenance staff and General Managers have access to the maintenance management system.
          </p>
          <button
            onClick={onBack}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ChevronLeft size={16} className="mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Determine if the user is maintenance staff
  const isMaintenance = currentUser.jobTitle === 'Maintenance' || currentUser.jobTitle === 'Admin';
  
  // Customize button text based on user role
  const backButtonText = currentUser.jobTitle === 'Admin' 
    ? "Back to Admin Dashboard" 
    : isMaintenance 
      ? "View Discount" 
      : "Back to Dashboard";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Wrench size={24} className="text-indigo-600 mr-2" />
            <h1 className="text-xl font-semibold text-indigo-700">
              {isMaintenance ? "Maintenance Management" : "Maintenance Requests"}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={onBack}
              className="flex items-center p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
            >
              <ChevronLeft size={18} className="mr-1" />
              <span>{backButtonText}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        <MaintenanceManagement 
          currentUser={currentUser}
          isMaintenance={isMaintenance}
        />
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
};

export default MaintenanceIntegration;