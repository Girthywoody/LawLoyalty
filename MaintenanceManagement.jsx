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
  db,
  deleteImageFromRequest,
  deleteMaintenanceRequest, 
  addImagesToRequest  
} from './MaintenanceFirebase';

import ImageUploadComponent from './ImageUploadComponent';
import ModernMaintenanceCalendar from './ModernMaintenanceCalendar';



// Placeholder for your Firebase imports
// import { collection, addDoc, updateDoc, deleteDoc, query, where, orderBy, getDocs, onSnapshot, doc, serverTimestamp } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const MaintenanceManagement = ({ currentUser, isMaintenance }) => {
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
  
useEffect(() => {
  setIsLoading(true);
  
  // Subscribe to maintenance requests
  const unsubRequestsSnapshot = subscribeToMaintenanceRequests((requests) => {
    // Filter requests based on user role
    let filteredRequests = requests;
    
    // Maintenance and Admin users can see all requests
    // General Managers can only see requests for their managed restaurants
    if (currentUser && currentUser.jobTitle === 'General Manager' && !isMaintenance) {
      // Filter to only show requests created by this manager
      filteredRequests = requests.filter(request => 
        request.createdBy === currentUser.name || 
        request.createdByUid === currentUser.id
      );
    }
    
    setMaintenanceRequests(filteredRequests);
    setFilteredRequests(filteredRequests);
    setIsLoading(false);
  });
  
  // Subscribe to maintenance events
  const unsubEventsSnapshot = subscribeToMaintenanceEvents((events) => {
    // Maintenance and Admin users can see all events
    // General Managers should only see their events
    let filteredEvents = events;
    if (currentUser && currentUser.jobTitle === 'General Manager' && !isMaintenance) {
      filteredEvents = events.filter(event => 
        event.technician === currentUser.name ||
        event.createdBy === currentUser.name ||
        event.createdByUid === currentUser.id
      );
    }
    setMaintenanceEvents(filteredEvents);
  });
  
  // Cleanup on unmount
  return () => {
    unsubRequestsSnapshot && unsubRequestsSnapshot();
    unsubEventsSnapshot && unsubEventsSnapshot();
  };
}, [currentUser, isMaintenance]);
  
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

  const handleDeleteSubmittedImage = async (imageUrl, imageIndex) => {
    if (!selectedRequest) return;
    
    try {
      setIsLoading(true);
      
      // Delete the image from Firebase
      await deleteImageFromRequest(selectedRequest.id, imageUrl);
      
      // Update the selected request in state
      const updatedImages = [...selectedRequest.images];
      updatedImages.splice(imageIndex, 1);
      
      setSelectedRequest({
        ...selectedRequest,
        images: updatedImages
      });
      
      // Also update the request in the maintenanceRequests array
      const updatedRequests = maintenanceRequests.map(req => 
        req.id === selectedRequest.id
          ? { ...req, images: updatedImages }
          : req
      );
      
      setMaintenanceRequests(updatedRequests);
      setFilteredRequests(
        filteredRequests.map(req => 
          req.id === selectedRequest.id
            ? { ...req, images: updatedImages }
            : req
        )
      );
      
      showNotification('Image deleted successfully', 'success');
    } catch (error) {
      console.error("Error deleting image:", error);
      showNotification('Failed to delete image', 'error');
    } finally {
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

      showNotification('Maintenance scheduled for immediate attention!', 'success');


      showNotification('Maintenance scheduled successfully!', 'success');
      setShowSchedulePicker(false);
      
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
      
      if (!request) {
        throw new Error("Request not found");
      }
      
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
        status: 'in progress', // Changed from 'scheduled' to 'in progress'
        scheduledDate: result.start
      });
      
      // Also update the request in the maintenanceRequests array
      const updatedRequests = maintenanceRequests.map(req => 
        req.id === requestId 
          ? {...req, status: 'in progress', scheduledDate: result.start} // Changed from 'scheduled' to 'in progress'
          : req
      );
      setMaintenanceRequests(updatedRequests);
      
      showNotification('Maintenance marked as in progress!', 'success');
      
      // Close the detail modal
      setShowDetailModal(false);
    } catch (error) {
      console.error("Error setting maintenance to in progress:", error);
      showNotification('Failed to update maintenance status', 'error');
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
  
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
            <AlertTriangle size={12} className="mr-1" /> Pending
          </span>
        );
      case 'in progress': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            <Clock size={12} className="mr-1" /> In Progress
          </span>
        );
      case 'scheduled': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
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
            </div>

            {/* Enhanced Maintenance Calendar */}
            <ModernMaintenanceCalendar 
              maintenanceEvents={maintenanceEvents} 
              currentUser={currentUser}
            />
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
      
{/* Request Detail Modal - Enhanced Version */}
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

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 pt-5 pb-4 sm:p-6 border-b border-gray-200">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 sm:mx-0 sm:h-10 sm:w-10">
              <AlertTriangle size={20} className="text-white" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-xl font-semibold text-gray-900" id="modal-title">
                {selectedRequest.title}
              </h3>
              
              {/* Meta Info */}
              <div className="flex flex-wrap gap-2 mt-2">
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
                          const requestRef = doc(db, 'maintenanceRequests', selectedRequest.id);
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
              
              {/* Location & Created Info */}
              <div className="flex flex-wrap justify-between mt-3 text-sm text-gray-600">
                <div className="flex items-center mr-4 mb-1">
                  <MapPin size={16} className="text-indigo-500 mr-1 flex-shrink-0" />
                  <span>{selectedRequest.location}</span>
                </div>
                <div className="flex items-center mb-1">
                  <User size={16} className="text-indigo-500 mr-1 flex-shrink-0" />
                  <span>Created by {selectedRequest.createdBy} on {formatDate(selectedRequest.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body - Redesigned */}
        <div className="px-6 py-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Status and Description */}
            <div className="lg:col-span-2 space-y-4">
              {/* Status Info Cards */}
              <div className="space-y-3">
                {selectedRequest.status === 'in progress' && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100">
                        <Clock size={20} className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-semibold text-blue-800">In Progress</h4>
                        <p className="text-sm text-blue-600">
                          This maintenance request is currently being addressed
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedRequest.status === 'scheduled' && (
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-purple-100">
                        <Calendar size={20} className="text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-semibold text-purple-800">Scheduled</h4>
                        <p className="text-sm text-purple-600">
                          Maintenance scheduled for {formatDate(selectedRequest.scheduledDate)} at {formatTime(selectedRequest.scheduledDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedRequest.status === 'completed' && (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-green-100">
                        <Check size={20} className="text-green-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-semibold text-green-800">Completed</h4>
                        <p className="text-sm text-green-600">
                          Completed on {formatDate(selectedRequest.completedDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Description */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MessageCircle size={16} className="mr-2 text-indigo-500" />
                  Description
                </h4>
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {selectedRequest.description || "No description provided."}
                  </p>
                </div>
              </div>
              
              {/* Comments Section */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <MessageCircle size={16} className="mr-2 text-indigo-500" />
                  Comments ({selectedRequest.comments?.length || 0})
                </h4>
                
                {(!selectedRequest.comments || selectedRequest.comments.length === 0) ? (
                  <div className="bg-white rounded-lg p-4 border border-gray-100 text-center">
                    <p className="text-sm text-gray-400 italic">No comments yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {selectedRequest.comments.map((comment) => (
                      <div key={comment.id} className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                              <User size={14} className="text-indigo-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{comment.createdBy}</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {comment.createdAt instanceof Date ? formatDate(comment.createdAt) : formatDate(new Date(comment.createdAt))}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 pl-10">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add Comment Form */}
                <div className="mt-3">
                  <div className="flex">
                    <input 
                      type="text"
                      className="flex-grow rounded-l-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                      onClick={() => handleAddComment(selectedRequest.id)}
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column - Images */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 h-full">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Camera size={16} className="mr-2 text-indigo-500" />
                  Images ({selectedRequest.images?.length || 0})
                </h4>
                
                {(!selectedRequest.images || selectedRequest.images.length === 0) ? (
                  <div className="bg-white rounded-lg p-4 border border-gray-100 text-center">
                    <Camera size={24} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 italic">No images attached</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {selectedRequest.images.map((imageUrl, index) => (
                      <div 
                        key={`img-${index}`} 
                        className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white cursor-pointer"
                        onClick={() => handleImageClick(imageUrl)}
                      >
                        <img 
                          src={imageUrl} 
                          alt={`Request ${index+1}`}
                          className="h-full w-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button 
                              className="p-1 bg-white rounded-full shadow-md"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSubmittedImage(imageUrl, index);
                              }}
                            >
                              <Trash2 size={14} className="text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add More Images */}
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-gray-500 mb-2">Add More Images</h5>
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
                      className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => handleAddImagesToRequest(selectedRequest.id)}
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="mr-2" />
                          Upload Images
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="bg-gray-50 px-6 py-4 sm:px-6 border-t border-gray-200">
        {selectedRequest.status === 'pending' && (
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Only show scheduling buttons for Maintenance role */}
            {(currentUser.jobTitle === 'Maintenance' || currentUser.jobTitle === 'Admin' || isMaintenance) && (
              <>
                <button
                  type="button"
                  className="flex-1 inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-medium text-white hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  onClick={() => handleImmediateSchedule(selectedRequest.id)}
                >
                  <Clock size={16} className="mr-2" />
                  Go there now
                </button>
                
                <button
                  type="button"
                  className="flex-1 inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  onClick={() => setShowSchedulePicker(true)}
                >
                  <Calendar size={16} className="mr-2" />
                  Schedule
                </button>
              </>
            )}
            
            {/* All users with access can delete their own requests */}
            <button
              type="button"
              className="sm:flex-initial inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              onClick={() => handleDeleteRequest(selectedRequest.id)}
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </button>
          </div>
        )}
        
        {selectedRequest.status === 'in progress' && (
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Only show "Complete" button for Maintenance role */}
            {(currentUser.jobTitle === 'Maintenance' || currentUser.jobTitle === 'Admin' || isMaintenance) && (
              <>
                <button
                  type="button"
                  className="flex-1 inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                  onClick={() => handleMarkAsCompleted(selectedRequest.id)}
                >
                  <Check size={16} className="mr-2" />
                  Mark as Completed
                </button>
                
                <button
                  type="button"
                  className="flex-1 inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  onClick={() => handleReschedule(selectedRequest.id)}
                >
                  <Calendar size={16} className="mr-2" />
                  Reschedule
                </button>
              </>
            )}
            
            <button
              type="button"
              className="sm:flex-initial inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              onClick={() => handleDeleteRequest(selectedRequest.id)}
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </button>
          </div>
        )}
          
          {selectedRequest.status === 'in progress' && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                className="flex-1 inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                onClick={() => handleMarkAsCompleted(selectedRequest.id)}
              >
                <Check size={16} className="mr-2" />
                Mark as Completed
              </button>
              
              <button
                type="button"
                className="flex-1 inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                onClick={() => handleReschedule(selectedRequest.id)}
              >
                <Calendar size={16} className="mr-2" />
                Reschedule
              </button>
              
              <button
                type="button"
                className="sm:flex-initial inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                onClick={() => handleDeleteRequest(selectedRequest.id)}
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </button>
            </div>
          )}
          
          {selectedRequest.status === 'completed' && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                This maintenance request has been completed.
              </div>
              <button
                type="button"
                className="inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                onClick={() => handleDeleteRequest(selectedRequest.id)}
              >
                <Trash2 size={16} className="mr-2" />
                Delete Request
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