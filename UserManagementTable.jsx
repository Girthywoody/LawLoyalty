import React, { useState, useEffect } from 'react';
import { User, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Pagination from './Pagination'; // Import the pagination component

const UserManagementTable = ({ 
  employees, 
  filteredEmployees, 
  searchTerm, 
  startEditEmployee, 
  saveEmployeeEditToFirebase, 
  cancelEdit, 
  removeEmployeeFromFirebase, 
  editEmployee, 
  isEditingEmployee,
  getRestaurantName,
  RESTAURANTS,
  onSearchChange  // Add this prop to handle search changes
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);  // Fixed at 15 items per page
  const [currentItems, setCurrentItems] = useState([]);

  // Calculate pagination whenever filtered employees change
  useEffect(() => {
    // Get current items for the page
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setCurrentItems(filteredEmployees.slice(indexOfFirstItem, indexOfLastItem));
    
    // If current page is now empty (except for page 1), go back one page
    if (currentItems.length === 0 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [filteredEmployees, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top of table
    document.querySelector('.user-management-table')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden user-management-table">
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
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div>
            <span className="text-sm text-gray-500">
              Showing {currentItems.length} of {filteredEmployees.length} users
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
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {currentItems.map((employee) => (
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
                          onChange={(e) => startEditEmployee({...editEmployee, name: e.target.value})}
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
                      onChange={(e) => startEditEmployee({...editEmployee, email: e.target.value})}
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
                      onChange={(e) => startEditEmployee({...editEmployee, jobTitle: e.target.value})}
                    >
                      <option value="Employee">Employee</option>
                      <option value="Manager">Manager</option>
                      {employee.jobTitle === 'Admin' && <option value="Admin">Admin</option>}
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
                        startEditEmployee({
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
            
            {currentItems.length === 0 && (
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
      
      {/* Pagination component */}
      {filteredEmployees.length > itemsPerPage && (
        <div className="px-6 py-4 border-t border-gray-200">
          <Pagination 
            totalItems={filteredEmployees.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default UserManagementTable;