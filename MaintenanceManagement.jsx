import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Camera,
  Upload,
  Wrench,
  Filter,
  Check,
  X,
  ChevronDown,
  User,
  Trash2,
  Edit,
  MessageCircle,
  PlusCircle,
  PlusSquare,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search
} from 'lucide-react';

import { 
  createMaintenanceRequest, 
  subscribeToMaintenanceRequests, 
  subscribeToMaintenanceEvents, 
  scheduleMaintenanceEvent, 
  addCommentToRequest, 
  completeMaintenanceRequest,
  doc,
  updateDoc,
  serverTimestamp,
  db
} from './MaintenanceFirebase';

import ImageUploadComponent from './ImageUploadComponent';


// Placeholder for your Firebase imports
// import { collection, addDoc, updateDoc, deleteDoc, query, where, orderBy, getDocs, onSnapshot, doc, serverTimestamp } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const MaintenanceManagement = ({ currentUser }) => {
  // State variables
  const [notification, setNotification] = useState(null);
  const [activeView, setActiveView] = useState('requests'); // 'requests' or 'calendar'
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [maintenanceEvents, setMaintenanceEvents] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'scheduled', 'completed'
  const [filterUrgency, setFilterUrgency] = useState('all'); // 'all', '1', '2', '3', '4', '5'
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [expandedImage, setExpandedImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState({
    images: [],
    imagePreviewUrls: []
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  // Add this with your other state variables
  const [isEditingUrgency, setIsEditingUrgency] = useState(false);  
  // Current Month for Calendar View
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Form state for new request
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    urgencyLevel: 3, // Default to medium urgency
    images: [],
    location: '',
    status: 'pending',
    imagePreviewUrls: []
  });

  const handleImageClick = (imageUrl) => {
    setExpandedImage(imageUrl);
  };

  const handleCloseExpandedImage = () => {
    setExpandedImage(null);
  };
  
  // Comment state
  const [newComment, setNewComment] = useState('');
  
  useEffect(() => {
    setIsLoading(true);
    
    // Subscribe to maintenance requests
    const unsubRequestsSnapshot = subscribeToMaintenanceRequests((requests) => {
      setMaintenanceRequests(requests);
      setFilteredRequests(requests);
      setIsLoading(false);
    });
    
    // Subscribe to maintenance events
    const unsubEventsSnapshot = subscribeToMaintenanceEvents((events) => {
      setMaintenanceEvents(events);
    });


// Notification component
  const Notification = ({ message, type }) => {
    const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 
                    type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 
                    'bg-blue-100 border-blue-400 text-blue-700';
    
    const icon = type === 'success' ? <Check size={20} className="text-green-500" /> :
                type === 'error' ? <X size={20} className="text-red-500" /> :
                null;
    
    return (
      <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg border ${bgColor} shadow-lg flex items-center z-50`}>
        {icon && <span className="mr-2">{icon}</span>}
        <span>{message}</span>
      </div>
    );
  };

// Show notification
const showNotification = (message, type = 'info') => {
  setNotification({ message, type });
  setTimeout(() => {
    setNotification(null);
  }, 3000);
};
    
    // Cleanup on unmount
    return () => {
      unsubRequestsSnapshot && unsubRequestsSnapshot();
      unsubEventsSnapshot && unsubEventsSnapshot();
    };
  }, []);
  
  // Apply filters
  useEffect(() => {
    let filtered = [...maintenanceRequests];
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(request => request.status === filterStatus);
    }
    
    // Filter by urgency
    if (filterUrgency !== 'all') {
      filtered = filtered.filter(request => request.urgencyLevel === parseInt(filterUrgency));
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort by urgency (highest first) and then by date (newest first)
    filtered.sort((a, b) => {
      if (a.urgencyLevel !== b.urgencyLevel) {
        return b.urgencyLevel - a.urgencyLevel;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    setFilteredRequests(filtered);
  }, [filterStatus, filterUrgency, maintenanceRequests, searchTerm]);
  
// Add this effect to clean up object URLs when component unmounts or when form is submitted
useEffect(() => {
  return () => {
    // Clean up any object URLs when component unmounts
    newRequest.imagePreviewUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
  };
}, []);

// Handle image change for adding to existing request
const handleAdditionalImageChange = (imageData) => {
  setAdditionalImages({
    images: imageData.images,
    imagePreviewUrls: imageData.imagePreviewUrls
  });
};

// Function to handle adding images to an existing request
const handleAddImagesToRequest = async (requestId) => {
  if (additionalImages.images.length === 0) return;
  
  try {
    setIsUploadingImage(true);
    
    await addImagesToRequest(requestId, additionalImages.images);
    
    // Clean up preview URLs
    additionalImages.imagePreviewUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    
    // Reset the additional images state
    setAdditionalImages({
      images: [],
      imagePreviewUrls: []
    });
    
    showNotification('Images added successfully', 'success');
    
    // Refresh the selected request to show new images
    const updatedRequest = maintenanceRequests.find(req => req.id === requestId);
    if (updatedRequest) {
      setSelectedRequest(updatedRequest);
    }
  } catch (error) {
    console.error("Error adding images:", error);
    showNotification('Failed to upload images', 'error');
  } finally {
    setIsUploadingImage(false);
  }
};

// This function should replace your existing handleAddRequest in MaintenanceManagement.jsx
const handleAddRequest = async () => {
  try {
    // Validate required fields
    if (!newRequest.title.trim()) {
      showNotification('Please enter a title for the request', 'error');
      return;
    }
    
    if (!newRequest.location.trim()) {
      showNotification('Please specify the location of the issue', 'error');
      return;
    }
    
    const requestData = {
      title: newRequest.title,
      description: newRequest.description,
      urgencyLevel: newRequest.urgencyLevel,
      location: newRequest.location,
      createdBy: currentUser?.name || 'Current User',
    };
    
    // Create the request in Firebase
    await createMaintenanceRequest(requestData, newRequest.images);
    
    // Clean up object URLs
    newRequest.imagePreviewUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    
    // Reset form
    setNewRequest({
      title: '',
      description: '',
      urgencyLevel: 3,
      images: [],
      location: '',
      status: 'pending',
      imagePreviewUrls: []
    });
    
    // Close modal
    setShowAddRequestModal(false);
    showNotification('Maintenance request created successfully!', 'success');
  } catch (error) {
    console.error("Error adding request:", error);
    showNotification('Failed to create maintenance request', 'error');
  }
};

  const handleReschedule = (requestId) => {
    // Simply show the schedule picker with the current date/time
    setShowSchedulePicker(true);
  };

  const handleScheduleMaintenanceWithDate = async (requestId, date) => {
    try {
      // Get the request details
      const request = maintenanceRequests.find(req => req.id === requestId);
      
      if (!request) {
        throw new Error("Request not found");
      }
      
      // Ensure the date is set correctly by creating a new date with the exact components
      // This prevents timezone issues from affecting the displayed date
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      // Create a proper date object using these components
      const scheduledDate = new Date(year, month, day, hours, minutes, 0);
      
      // Create event data with the corrected date
      const eventData = {
        title: request.title,
        technician: currentUser?.name || 'Current User',
        location: request.location,
        description: request.description,
        start: scheduledDate,
        end: new Date(scheduledDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours from selected time
      };
      
      // Schedule in Firebase
      const result = await scheduleMaintenanceEvent(requestId, eventData);
      
      // Update the selected request
      setSelectedRequest({
        ...selectedRequest, 
        status: 'scheduled', 
        scheduledDate: scheduledDate
      });
      
      // Update the request in the maintenanceRequests array
      const updatedRequests = maintenanceRequests.map(req => 
        req.id === requestId 
          ? {...req, status: 'scheduled', scheduledDate: scheduledDate}
          : req
      );
      setMaintenanceRequests(updatedRequests);
      
      showNotification('Maintenance scheduled successfully!', 'success');
      setShowSchedulePicker(false);
    } catch (error) {
      console.error("Error scheduling maintenance:", error);
      showNotification('Failed to schedule maintenance', 'error');
    }
  };
  
  const handleImmediateSchedule = async (requestId) => {
    try {
      // Get the request details
      const request = maintenanceRequests.find(req => req.id === requestId);
      
      // Create event data with a concrete JavaScript Date
      const now = new Date();
      const eventData = {
        title: request.title,
        technician: currentUser?.name || 'Current User',
        location: request.location,
        description: request.description,
        // Don't include start/end here - scheduleMaintenanceEvent will add them
      };
      
      // Schedule in Firebase
      const result = await scheduleMaintenanceEvent(requestId, eventData);
      
      // Update the selected request with the returned data
      setSelectedRequest({
        ...selectedRequest, 
        status: 'scheduled', 
        scheduledDate: result.start
      });
      
      // Also update the request in the maintenanceRequests array
      const updatedRequests = maintenanceRequests.map(req => 
        req.id === requestId 
          ? {...req, status: 'scheduled', scheduledDate: result.start}
          : req
      );
      setMaintenanceRequests(updatedRequests);
      
      showNotification('Maintenance scheduled for immediate attention!', 'success');
      
      // Close the detail modal
      setShowDetailModal(false);
    } catch (error) {
      console.error("Error scheduling immediate maintenance:", error);
      showNotification('Failed to schedule immediate maintenance', 'error');
    }
  };
  
  const handleMarkAsCompleted = async (requestId) => {
    try {
      await completeMaintenanceRequest(requestId);
      showNotification('Maintenance marked as completed!', 'success');
      setShowDetailModal(false);
    } catch (error) {
      console.error("Error completing maintenance:", error);
      showNotification('Failed to complete maintenance', 'error');
    }
  };
  
  const handleAddComment = async (requestId) => {
    if (!newComment.trim()) return;
    
    try {
      const commentData = {
        text: newComment,
        createdBy: currentUser?.name || 'Current User',
      };
      
      const newCommentObj = await addCommentToRequest(requestId, commentData);
      
      // Update the selected request locally so we don't have to reload to see the new comment
      setSelectedRequest({
        ...selectedRequest,
        comments: [...(selectedRequest.comments || []), newCommentObj]
      });
      
      setNewComment('');
      showNotification('Comment added successfully!', 'success');
    } catch (error) {
      console.error("Error adding comment:", error);
      showNotification('Failed to add comment', 'error');
    }
  };

  // Function to check for schedule conflicts
const checkForConflicts = (date, time) => {
  const [hours, minutes] = time.split(':');
  const selectedDateTime = new Date(date);
  selectedDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
  
  // Time buffer (15 minutes before and after)
  const buffer = 15 * 60 * 1000; // 15 minutes in milliseconds
  
  return maintenanceEvents.filter(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    // Check if the selected time is within 15 minutes of any existing event
    return (
      (selectedDateTime >= new Date(eventStart.getTime() - buffer) && 
       selectedDateTime <= new Date(eventEnd.getTime() + buffer))
    );
  });
};

const handleNewRequestImageChange = (imageData) => {
  setNewRequest({
    ...newRequest,
    images: imageData.images,
    imagePreviewUrls: imageData.imagePreviewUrls
  });
};

const handleFileChange = (e) => {
  if (e.target.files) {
    const filesArray = Array.from(e.target.files);
    
    // Validate file types and sizes
    const validFiles = filesArray.filter(file => {
      // Check if it's an image file
      const isImage = file.type.startsWith('image/');
      
      // Check size (10MB limit)
      const isUnderSizeLimit = file.size <= 10 * 1024 * 1024; // 10MB in bytes
      
      // Show notification for invalid files
      if (!isImage) {
        showNotification('Only image files are allowed', 'error');
      } else if (!isUnderSizeLimit) {
        showNotification('Files must be under 10MB', 'error');
      }
      
      return isImage && isUnderSizeLimit;
    });
    
    if (validFiles.length === 0) return;
    
    // Preview URLs for display
    const imagePreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    
    setNewRequest({
      ...newRequest,
      images: [...newRequest.images, ...validFiles],
      imagePreviewUrls: [...newRequest.imagePreviewUrls, ...imagePreviewUrls]
    });
  }
};

// Add these functions to your component
const handleDragOver = (e) => {
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'copy';
};

const handleDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFileSelection(Array.from(e.dataTransfer.files));
  }
};

// Common function for both drag&drop and file input
const handleFileSelection = (filesArray) => {
  // Validate file types and sizes
  const validFiles = filesArray.filter(file => {
    // Check if it's an image file
    const isImage = file.type.startsWith('image/');
    
    // Check size (10MB limit)
    const isUnderSizeLimit = file.size <= 10 * 1024 * 1024; // 10MB in bytes
    
    // Show notification for invalid files
    if (!isImage) {
      showNotification('Only image files are allowed', 'error');
    } else if (!isUnderSizeLimit) {
      showNotification('Files must be under 10MB', 'error');
    }
    
    return isImage && isUnderSizeLimit;
  });
  
  if (validFiles.length === 0) return;
  
  // Preview URLs for display
  const imagePreviewUrls = validFiles.map(file => URL.createObjectURL(file));
  
  setNewRequest({
    ...newRequest,
    images: [...newRequest.images, ...validFiles],
    imagePreviewUrls: [...newRequest.imagePreviewUrls, ...imagePreviewUrls]
  });
};


  
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week for the first day (0 is Sunday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Array to hold all calendar days, including empty spots for proper alignment
    const calendarDays = [];
    
    // Add empty days for proper alignment
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarDays.push({ day: null, date: null });
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      
      // Find events for this day
      const eventsForDay = maintenanceEvents.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.getDate() === day && 
               eventDate.getMonth() === month && 
               eventDate.getFullYear() === year;
      });
      
      calendarDays.push({ day, date, events: eventsForDay });
    }
    
    return calendarDays;
  };
  
// Format date helper
const formatDate = (date) => {
  // Check if date is valid before formatting
  if (!date || isNaN(new Date(date).getTime())) {
    return 'N/A'; // Return a placeholder for invalid dates
  }
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};
  
// Format time helper
const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  // Get urgency label
  const getUrgencyLabel = (level) => {
    switch(level) {
      case 1: return { text: 'Very Low', color: 'bg-gray-50 text-gray-700' };
      case 2: return { text: 'Low', color: 'bg-blue-50 text-blue-700' };
      case 3: return { text: 'Medium', color: 'bg-yellow-50 text-yellow-700' };
      case 4: return { text: 'High', color: 'bg-orange-50 text-orange-700' };
      case 5: return { text: 'Critical', color: 'bg-red-50 text-red-700' };
      default: return { text: 'Unknown', color: 'bg-gray-50 text-gray-700' };
    }
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
            <AlertTriangle size={12} className="mr-1" /> Pending
          </span>
        );
      case 'scheduled': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            <Calendar size={12} className="mr-1" /> Scheduled
          </span>
        );
      case 'completed': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
            <Check size={12} className="mr-1" /> Completed
          </span>
        );
      default: 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {notification && <Notification message={notification.message} type={notification.type} />}
      

      {/* Navigation Tabs */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto">
              <div className="flex">
                <button
                  onClick={() => setActiveView('requests')}
                  className={`px-6 py-4 font-medium text-sm transition-all duration-300 ${
                    activeView === 'requests' 
                      ? 'text-gray-900 border-b-2 border-indigo-500 bg-gray-50' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <AlertTriangle size={16} className="mr-2" />
                    Maintenance Requests
                  </div>
                </button>
                <button
                  onClick={() => setActiveView('calendar')}
                  className={`px-6 py-4 font-medium text-sm transition-all duration-300 ${
                    activeView === 'calendar' 
                      ? 'text-gray-900 border-b-2 border-indigo-500 bg-gray-50' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2" />
                    Maintenance Calendar
                  </div>
                </button>
              </div>
            </div>
          </div>

{/* Main Content Area */}
      <main className="flex-grow w-full mx-auto py-4 px-2 sm:py-6 sm:px-4 max-w-7xl">
        {/* Requests View */}
        {activeView === 'requests' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Header and Actions */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Maintenance Requests</h2>
                <p className="text-sm text-gray-400 mt-1">Track and manage maintenance issues</p>
              </div>
              
              <button
                onClick={() => setShowAddRequestModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm"
              >
                <PlusCircle size={16} className="mr-2" />
                New Request
              </button>
            </div>

            {/* Filters and Search - Mobile Optimized */}
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-col space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search requests..."
                    className="block w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 transition-all duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2.5 bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg transition-all duration-200"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  
                  <div>
                    <select
                      value={filterUrgency}
                      onChange={(e) => setFilterUrgency(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2.5 bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg transition-all duration-200"
                    >
                      <option value="all">All Urgency Levels</option>
                      <option value="1">Very Low</option>
                      <option value="2">Low</option>
                      <option value="3">Medium</option>
                      <option value="4">High</option>
                      <option value="5">Critical</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Requests List - Mobile Optimized */}
            <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              {isLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="p-6 sm:p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 mb-4">
                    <Wrench size={32} className="text-indigo-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">No maintenance requests found</h3>
                  <p className="mt-2 text-sm text-gray-400">
                    {searchTerm || filterStatus !== 'all' || filterUrgency !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Get started by creating a new maintenance request'}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <li 
                      key={request.id} 
                      className="p-4 sm:p-6 hover:bg-gray-50 cursor-pointer transition-all duration-200"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailModal(true);
                      }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-grow">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mr-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                request.urgencyLevel >= 4 ? 'bg-red-100' : 
                                request.urgencyLevel === 3 ? 'bg-yellow-100' : 
                                'bg-blue-100'
                              }`}>
                                <AlertTriangle 
                                  size={24} 
                                  className={`${
                                    request.urgencyLevel >= 4 ? 'text-red-600' : 
                                    request.urgencyLevel === 3 ? 'text-yellow-600' : 'text-blue-600'
                                  }`} 
                                />
                              </div>
                            </div>
                            <div className="flex-grow">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900">{request.title}</h3>
                              <div className="mt-1 flex items-center text-sm text-gray-400">
                                <MapPin size={14} className="mr-1" />
                                <span>{request.location}</span>
                              </div>
                              <p className="mt-2 text-sm text-gray-500 line-clamp-2">{request.description}</p>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex flex-wrap gap-2">
                            {getStatusBadge(request.status)}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              request.urgencyLevel >= 4 ? 'bg-red-100 text-red-800' :
                              request.urgencyLevel === 3 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {getUrgencyLabel(request.urgencyLevel).text}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        
        {/* Calendar View - Mobile Optimized */}
        {activeView === 'calendar' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Maintenance Calendar</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const prevMonth = new Date(currentMonth);
                    prevMonth.setMonth(prevMonth.getMonth() - 1);
                    setCurrentMonth(prevMonth);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-base sm:text-xl font-semibold text-gray-700 hidden sm:inline">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <span className="text-base font-semibold text-gray-700 sm:hidden">
                  {currentMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}
                </span>
                <button
                  onClick={() => {
                    const nextMonth = new Date(currentMonth);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    setCurrentMonth(nextMonth);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Calendar Grid - Mobile Optimized */}
            <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                  <div key={day} className="bg-gray-100 py-2 text-center text-sm font-medium text-gray-600">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {generateCalendarDays().map((dayObj, idx) => (
                  <div 
                    key={idx} 
                    className={`bg-white h-24 sm:h-32 p-1 sm:p-2 overflow-hidden transition-colors duration-300 ${
                      !dayObj.day ? 'bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {dayObj.day && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs sm:text-sm font-medium ${
                            dayObj.date?.toDateString() === new Date().toDateString() 
                              ? 'bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center' 
                              : 'text-gray-700'
                          }`}>
                            {dayObj.day}
                          </span>
                        </div>
                        
                        <div className="mt-1 space-y-1 max-h-16 sm:max-h-24 overflow-y-auto">
                          {dayObj.events?.map((event) => (
                            <div 
                              key={event.id} 
                              className="px-1 py-0.5 text-xs rounded bg-blue-50 text-blue-700 truncate"
                            >
                              {event.title}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Add Request Modal */}
      {showAddRequestModal && (
        <div className="fixed inset-0 overflow-y-auto z-20" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" 
              aria-hidden="true"
              onClick={() => setShowAddRequestModal(false)}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
              {/* Close button */}
              <button
                onClick={() => setShowAddRequestModal(false)}
                className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <X size={20} className="text-gray-500" />
              </button>

              <div className="px-6 pt-5 pb-4 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 sm:mx-0 sm:h-10 sm:w-10 shadow-md">
                    <PlusCircle size={20} className="text-white" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-xl font-semibold text-gray-900" id="modal-title">
                      Create Maintenance Request
                    </h3>
                    
                    <form className="mt-6 space-y-4">
                      {/* Title */}
                      <div>
                        <label htmlFor="request-title" className="block text-sm font-medium text-gray-700">
                          Title
                        </label>
                        <input
                          type="text"
                          id="request-title"
                          className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                          placeholder="Brief description of the issue"
                          value={newRequest.title}
                          onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                          required
                        />
                      </div>
                      
                      {/* Location */}
                      <div>
                        <label htmlFor="request-location" className="block text-sm font-medium text-gray-700">
                          Location
                        </label>
                        <input
                          type="text"
                          id="request-location"
                          className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                          placeholder="Where is the issue located?"
                          value={newRequest.location}
                          onChange={(e) => setNewRequest({...newRequest, location: e.target.value})}
                          required
                        />
                      </div>
                      
                      {/* Description */}
                      <div>
                        <label htmlFor="request-description" className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          id="request-description"
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                          placeholder="Detailed description of the issue"
                          value={newRequest.description}
                          onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                          required
                        />
                      </div>
                      
                      {/* Urgency Level */}
                      <div>
                        <label htmlFor="urgency-level" className="block text-sm font-medium text-gray-700">
                          Urgency Level
                        </label>
                        <select
                          id="urgency-level"
                          className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                          value={newRequest.urgencyLevel}
                          onChange={(e) => setNewRequest({...newRequest, urgencyLevel: parseInt(e.target.value)})}
                        >
                          <option value="1">1 - Very Low</option>
                          <option value="2">2 - Low</option>
                          <option value="3">3 - Medium</option>
                          <option value="4">4 - High</option>
                          <option value="5">5 - Critical</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Images</label>
                        <ImageUploadComponent
                          images={newRequest.images}
                          imagePreviewUrls={newRequest.imagePreviewUrls}
                          onImagesChanged={handleNewRequestImageChange}
                          maxSize={10}
                          maxFiles={5}
                        />
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-700 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                  onClick={handleAddRequest}
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Request Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 overflow-y-auto z-20" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" 
              aria-hidden="true"
              onClick={() => setShowDetailModal(false)}
            ></div>
            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-200">
              {/* Close button */}
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <X size={20} className="text-gray-500" />
              </button>

              <div className="bg-white px-6 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle size={20} className="text-white" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-xl font-semibold text-gray-900" id="modal-title">
                      {selectedRequest.title}
                    </h3>
                          <div className="mt-4">
                            {/* Meta Info */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {getStatusBadge(selectedRequest.status)}
                              <div className="flex items-center gap-2">
                                {isEditingUrgency ? (
                                  <div className="flex items-center gap-2">
                                    <select
                                      className="rounded-lg border border-gray-300 shadow-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-200"
                                      value={selectedRequest.urgencyLevel}
                                      onChange={(e) => {
                                        setSelectedRequest({...selectedRequest, urgencyLevel: parseInt(e.target.value)});
                                      }}
                                    >
                                      <option value="1">1 - Very Low</option>
                                      <option value="2">2 - Low</option>
                                      <option value="3">3 - Medium</option>
                                      <option value="4">4 - High</option>
                                      <option value="5">5 - Critical</option>
                                    </select>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Update urgency in Firestore
                                        const requestRef = doc('maintenanceRequests', selectedRequest.id);
                                        updateDoc(requestRef, { 
                                          urgencyLevel: selectedRequest.urgencyLevel,
                                          updatedAt: serverTimestamp() 
                                        }).then(() => {
                                          showNotification('Urgency updated successfully', 'success');
                                          setIsEditingUrgency(false);
                                        }).catch((error) => {
                                          console.error("Error updating urgency:", error);
                                          showNotification('Failed to update urgency', 'error');
                                        });
                                      }}
                                      className="p-1 rounded-full bg-green-100 hover:bg-green-200 transition-colors duration-200"
                                    >
                                      <Check size={16} className="text-green-600" />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditingUrgency(false);
                                      }}
                                      className="p-1 rounded-full bg-red-100 hover:bg-red-200 transition-colors duration-200"
                                    >
                                      <X size={16} className="text-red-600" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-sm ${
                                      selectedRequest.urgencyLevel >= 4 ? 'bg-red-100 text-red-800' :
                                      selectedRequest.urgencyLevel === 3 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      Urgency: {getUrgencyLabel(selectedRequest.urgencyLevel).text}
                                    </span>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditingUrgency(true);
                                      }}
                                      className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                                    >
                                      <Edit size={14} className="text-gray-600" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {isEditingUrgency && (
                              <div className="mb-4">
                                <select
                                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                                  value={selectedRequest.urgencyLevel}
                                  onChange={(e) => {
                                    const newUrgencyLevel = parseInt(e.target.value);
                                    setSelectedRequest({...selectedRequest, urgencyLevel: newUrgencyLevel});
                                    // Update urgency in Firestore
                                    const requestRef = doc(db, 'maintenanceRequests', selectedRequest.id);
                                    updateDoc(requestRef, { 
                                      urgencyLevel: newUrgencyLevel,
                                      updatedAt: serverTimestamp() 
                                    });
                                  }}
                                >
                                  <option value="1">1 - Very Low</option>
                                  <option value="2">2 - Low</option>
                                  <option value="3">3 - Medium</option>
                                  <option value="4">4 - High</option>
                                  <option value="5">5 - Critical</option>
                                </select>
                              </div>
                            )}
                            
                            {/* Location & Created Info */}
                            <div className="flex justify-between text-sm text-gray-500 mb-4">
                              <div className="flex items-center">
                                <MapPin size={16} className="mr-1" />
                                {selectedRequest.location}
                              </div>
                              <div>
                                Created by {selectedRequest.createdBy} on {formatDate(selectedRequest.createdAt)}
                              </div>
                            </div>
                            
                            {/* Description */}
                            <div className="mt-2 mb-4">
                              <h4 className="text-sm font-medium text-gray-300 mb-1">Description</h4>
                              <p className="text-sm text-gray-400 whitespace-pre-wrap">
                                {selectedRequest.description}
                              </p>
                            </div>
                            
                            {/* Status Info */}
                            {selectedRequest.status === 'scheduled' && (
                              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                                <div className="flex items-center">
                                  <Calendar size={18} className="text-blue-600 mr-2" />
                                  <div>
                                    <p className="text-sm font-medium text-blue-800">
                                      Scheduled for {formatDate(selectedRequest.scheduledDate)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {selectedRequest.status === 'completed' && (
                              <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4">
                                <div className="flex items-center">
                                  <Check size={18} className="text-green-600 mr-2" />
                                  <div>
                                    <p className="text-sm font-medium text-green-800">
                                      Completed on {formatDate(selectedRequest.completedDate)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Images */}
                            {selectedRequest.images && selectedRequest.images.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Images</h4>
                              <div className="grid grid-cols-2 gap-3">
                                {selectedRequest.images.map((image, index) => (
                                  <div 
                                    key={index} 
                                    className="relative cursor-pointer rounded-lg overflow-hidden hover:opacity-90 transition-opacity duration-200"
                                    onClick={() => handleImageClick(image)}
                                  >
                                    <img 
                                      src={image}
                                      alt={`Issue ${index + 1}`}
                                      className="h-48 w-full object-cover rounded-lg shadow-sm"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 flex items-center justify-center transition-all duration-200">
                                      <div className="opacity-0 hover:opacity-100 text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                            {/* Comments */}
                            <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-300 mb-3">Comments</h4>
                              
                              {selectedRequest.comments.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No comments yet</p>
                              ) : (
                                <ul className="space-y-4">
                                  {selectedRequest.comments.map((comment) => (
                                    <li key={comment.id} className="bg-gray-100 rounded-lg p-4">
                                      <div className="flex justify-between items-start">
                                        <span className="text-sm font-medium text-gray-900">{comment.createdBy}</span>
                                        <span className="text-xs text-gray-400">
                                          {comment.createdAt instanceof Date ? formatDate(comment.createdAt) : formatDate(new Date(comment.createdAt))}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-sm text-gray-600">{comment.text}</p>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              
                              {/* Add Comment Form */}
                              <div className="mt-4">
                                <div className="flex">
                                <input 
                                  type="text"
                                  className="flex-grow rounded-l-lg border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400"
                                  placeholder="Add a comment..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                />
                                  <button
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-lg shadow-sm text-gray-900 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                                    onClick={() => handleAddComment(selectedRequest.id)}
                                  >
                                    <MessageCircle size={16} className="mr-2" />
                                    Post
                                  </button>
                                </div>
                                <div className="mt-6">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">Add More Images</h4>
                                  <ImageUploadComponent
                                    images={additionalImages.images}
                                    imagePreviewUrls={additionalImages.imagePreviewUrls}
                                    onImagesChanged={handleAdditionalImageChange}
                                    maxSize={10}
                                    maxFiles={3}
                                  />
                                  {additionalImages.images.length > 0 && (
                                    <button
                                      type="button"
                                      className="mt-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                      onClick={() => handleAddImagesToRequest(selectedRequest.id)}
                                      disabled={isUploadingImage}
                                    >
                                      {isUploadingImage ? 'Uploading...' : 'Upload Images'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {showSchedulePicker && selectedRequest && (
        <div className="fixed inset-0 overflow-y-auto z-30" aria-labelledby="schedule-modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" 
              aria-hidden="true"
              onClick={() => setShowSchedulePicker(false)}
            ></div>

            {/* Modal panel - centered for mobile */}
            <div className="inline-block align-middle bg-white rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full max-w-md mx-4 my-8 border border-gray-200">
              {/* Close button */}
              <button
                onClick={() => setShowSchedulePicker(false)}
                className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <X size={20} className="text-gray-500" />
              </button>

              <div className="bg-white px-4 sm:px-6 pt-5 pb-4 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 sm:mx-0 sm:h-10 sm:w-10">
                    <Calendar size={20} className="text-white" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-xl font-semibold text-gray-900" id="schedule-modal-title">
                      Schedule Maintenance
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Select a date and time for this maintenance request.
                    </p>
                    
                    <div className="mt-6 space-y-4">
                      {/* Date Picker */}
                      <div>
                        <label htmlFor="maintenance-date" className="block text-sm font-medium text-gray-700">
                          Date
                        </label>
                        <input
                          type="date"
                          id="maintenance-date"
                          className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                          value={scheduleDate.toISOString().split('T')[0]}
                          onChange={(e) => {
                            // Create date at noon to avoid timezone issues
                            const selectedDate = new Date(e.target.value + 'T12:00:00');
                            setScheduleDate(selectedDate);
                          }}
                        />
                      </div>
                      
                      {/* Time Picker */}
                      <div>
                        <label htmlFor="maintenance-time" className="block text-sm font-medium text-gray-700">
                          Time
                        </label>
                        <input
                          type="time"
                          id="maintenance-time"
                          className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                        />
                      </div>
                      
                      {/* Existing Maintenance Schedule */}
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Your Schedule</h4>
                        <div className="max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-2 border border-gray-200">
                          {maintenanceEvents
                            .filter(event => {
                              const eventDate = new Date(event.start);
                              return eventDate.toDateString() === scheduleDate.toDateString();
                            })
                            .sort((a, b) => new Date(a.start) - new Date(b.start))
                            .map((event, idx) => (
                              <div key={idx} className="py-2 px-3 mb-1 bg-white rounded border border-gray-100 text-sm">
                                <div className="font-medium text-gray-900">{event.title}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                                  {new Date(event.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                                <div className="text-xs text-gray-400">{event.location}</div>
                              </div>
                            ))}
                          {maintenanceEvents.filter(event => {
                              const eventDate = new Date(event.start);
                              return eventDate.toDateString() === scheduleDate.toDateString();
                            }).length === 0 && (
                            <p className="text-sm text-center text-gray-400 py-2">No events scheduled for this day</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-4 sm:px-6 flex flex-col sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  className="w-full sm:w-auto order-1 sm:order-2 inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
                  onClick={() => {
                    const dateTime = new Date(scheduleDate);
                    const [hours, minutes] = scheduleTime.split(':');
                    dateTime.setHours(parseInt(hours), parseInt(minutes), 0);
                    handleScheduleMaintenanceWithDate(selectedRequest.id, dateTime);
                    setShowSchedulePicker(false);
                  }}
                >
                  Confirm Schedule
                </button>
                
                <button
                  type="button"
                  className="w-full sm:w-auto order-2 sm:order-1 inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
                  onClick={() => setShowSchedulePicker(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
              
              <div className="bg-gray-50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedRequest.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-base font-medium text-white hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                      onClick={() => handleImmediateSchedule(selectedRequest.id)}
                    >
                      <Clock size={16} className="mr-2" />
                      Go there now
                    </button>
                    
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-3 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                      onClick={() => setShowSchedulePicker(true)}
                    >
                      <Calendar size={16} className="mr-2" />
                      Schedule Maintenance
                    </button>
                  </div>
                )}
                
                {selectedRequest.status === 'scheduled' && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-3 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                      onClick={() => handleMarkAsCompleted(selectedRequest.id)}
                    >
                      <Check size={16} className="mr-2" />
                      Mark as Completed
                    </button>
                    
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-3 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                      onClick={() => handleReschedule(selectedRequest.id)}
                    >
                      <Calendar size={16} className="mr-2" />
                      Reschedule
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={handleCloseExpandedImage}
        >
          <div className="relative max-w-6xl max-h-full">
            <button
              onClick={handleCloseExpandedImage}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all duration-200"
            >
              <X size={24} />
            </button>
            <img 
              src={expandedImage} 
              alt="Expanded view" 
              className="max-h-[90vh] max-w-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceManagement;