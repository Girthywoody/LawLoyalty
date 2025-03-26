import React from 'react';
import { XCircle } from 'lucide-react';

const VerificationPopup = ({ restaurantName, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative animate-fade-in">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <XCircle size={20} />
        </button>
        
        <div className="text-center py-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Confirm Restaurant Selection</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you are at <span className="font-bold text-indigo-600">{restaurantName}</span>?
          </p>
          <p className="text-gray-600 mb-6 text-sm">
            You will not be able to access another discount for 15 minutes after confirmation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onCancel}
              className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="w-full sm:w-auto px-6 py-2 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPopup;