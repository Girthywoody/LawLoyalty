import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Show 5 page numbers at most
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Adjust if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };
  
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex justify-center items-center space-x-2 mt-4">
      {/* First page button */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-md ${
          currentPage === 1 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-indigo-600 hover:bg-indigo-50'
        }`}
      >
        <ChevronsLeft size={16} />
      </button>
      
      {/* Previous page button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-md ${
          currentPage === 1 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-indigo-600 hover:bg-indigo-50'
        }`}
      >
        <ChevronLeft size={16} />
      </button>
      
      {/* Page numbers */}
      {getPageNumbers().map(number => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`p-2 rounded-md w-8 h-8 flex items-center justify-center ${
            currentPage === number
              ? 'bg-indigo-600 text-white font-medium'
              : 'text-gray-700 hover:bg-indigo-50'
          }`}
        >
          {number}
        </button>
      ))}
      
      {/* Next page button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-md ${
          currentPage === totalPages 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-indigo-600 hover:bg-indigo-50'
        }`}
      >
        <ChevronRight size={16} />
      </button>
      
      {/* Last page button */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-md ${
          currentPage === totalPages 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-indigo-600 hover:bg-indigo-50'
        }`}
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;