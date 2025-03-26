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
  completeMaintenanceRequest
} from './MaintenanceFirebase';



// Placeholder for your Firebase imports
// import { collection, addDoc, updateDoc, deleteDoc, query, where, orderBy, getDocs, onSnapshot, doc, serverTimestamp } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { db, storage } from './firebase';

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
  
  const handleAddRequest = async () => {
    try {
      const requestData = {
        title: newRequest.title,
        description: newRequest.description,
        urgencyLevel: newRequest.urgencyLevel,
        location: newRequest.location,
        createdBy: currentUser?.name || 'Current User',
      };
      
      // Create the request in Firebase
      await createMaintenanceRequest(requestData, newRequest.images);
      
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
  
  const handleScheduleMaintenance = async (requestId, date) => {
    try {
      // Get the request details
      const request = maintenanceRequests.find(req => req.id === requestId);
      
      // Create event data
      const eventData = {
        title: request.title,
        start: date,
        end: new Date(date.getTime() + 2 * 60 * 60 * 1000), // Default 2 hour duration
        technician: 'TBD'
      };
      
      // Schedule in Firebase
      await scheduleMaintenanceEvent(requestId, eventData);
      showNotification('Maintenance scheduled successfully!', 'success');
    } catch (error) {
      console.error("Error scheduling maintenance:", error);
      showNotification('Failed to schedule maintenance', 'error');
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
      
      await addCommentToRequest(requestId, commentData);
      setNewComment('');
      showNotification('Comment added successfully!', 'success');
    } catch (error) {
      console.error("Error adding comment:", error);
      showNotification('Failed to add comment', 'error');
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Preview URLs for display
      const imagePreviewUrls = filesArray.map(file => URL.createObjectURL(file));
      
      setNewRequest({
        ...newRequest,
        images: [...newRequest.images, ...filesArray],
        imagePreviewUrls: [...newRequest.imagePreviewUrls, ...imagePreviewUrls]
      });
    }
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
      case 1: return { text: 'Very Low', color: 'bg-gray-100 text-gray-800' };
      case 2: return { text: 'Low', color: 'bg-blue-100 text-blue-800' };
      case 3: return { text: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
      case 4: return { text: 'High', color: 'bg-orange-100 text-orange-800' };
      case 5: return { text: 'Critical', color: 'bg-red-100 text-red-800' };
      default: return { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-300 border border-yellow-800">
            <AlertTriangle size={12} className="mr-1" /> Pending
          </span>
        );
      case 'scheduled': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-800">
            <Calendar size={12} className="mr-1" /> Scheduled
          </span>
        );
      case 'completed': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-800">
            <Check size={12} className="mr-1" /> Completed
          </span>
        );
      default: 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {notification && <Notification message={notification.message} type={notification.type} />}
      
      {/* Rest of your component */}
  {/* Header */}
  <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Wrench size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 ml-3">Maintenance Management</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-100 px-4 py-2 rounded-lg">
            <User size={18} className="text-gray-600 mr-2" />
            <span className="text-sm text-gray-600">Logged in as <strong className="text-indigo-600">{currentUser?.name || 'User'}</strong></span>
          </div>
        </div>
      </div>
    </div>
  </header>

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
      <main className="flex-grow max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Requests View */}
        {activeView === 'requests' && (
          <div className="space-y-6">
            {/* Header and Actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Maintenance Requests</h2>
                <p className="text-gray-400 mt-1">Track and manage maintenance issues</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowAddRequestModal(true)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  <PlusCircle size={16} className="mr-2" />
                  New Request
                </button>
              </div>
            </div>
            
{/* Filters and Search */}
<div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
    <div className="flex-grow">
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
    </div>
    
    <div className="flex flex-col sm:flex-row gap-3">
      <div>
        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-400 mb-1">
          Status
        </label>
        <select
          id="status-filter"
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
        <label htmlFor="urgency-filter" className="block text-sm font-medium text-gray-400 mb-1">
          Urgency
        </label>
        <select
          id="urgency-filter"
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
            
            {/* Requests List */}
{/* Requests List */}
<div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
  {isLoading ? (
    <div className="p-12 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
    </div>
  ) : filteredRequests.length === 0 ? (
    <div className="p-12 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
        <Wrench size={32} className="text-indigo-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900">No maintenance requests found</h3>
      <p className="mt-2 text-sm text-gray-400">
        {searchTerm || filterStatus !== 'all' || filterUrgency !== 'all'
          ? 'Try adjusting your search or filters'
          : 'Get started by creating a new maintenance request'}
      </p>
      <div className="mt-6">
        <button
          onClick={() => setShowAddRequestModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
        >
          <PlusCircle size={16} className="mr-2" />
          New Request
        </button>
      </div>
    </div>
  ) : (
    <ul className="divide-y divide-gray-200">
      {filteredRequests.map((request) => (
        <li 
          key={request.id} 
          className="p-6 hover:bg-gray-100 cursor-pointer transition-all duration-200"
          onClick={() => {
            setSelectedRequest(request);
            setShowDetailModal(true);
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-grow">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                    request.urgencyLevel >= 4 ? 'bg-red-900' : 
                    request.urgencyLevel === 3 ? 'bg-yellow-800' : 
                    'bg-blue-900'
                  }`}>
                    <AlertTriangle 
                      size={28} 
                      className={`${
                        request.urgencyLevel >= 4 ? 'text-red-300' : 
                        request.urgencyLevel === 3 ? 'text-yellow-300' : 'text-blue-300'
                      }`} 
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{request.title}</h3>
                  <div className="mt-2 flex items-center">
                    <MapPin size={16} className="text-gray-400 mr-1" />
                    <span className="text-sm text-gray-400">{request.location}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-400 line-clamp-2">{request.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {/* Urgency Badge */}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      request.urgencyLevel >= 4 ? 'bg-red-900 text-red-200' :
                      request.urgencyLevel === 3 ? 'bg-yellow-900 text-yellow-200' :
                      'bg-blue-900 text-blue-200'
                    }`}>
                      Urgency: {getUrgencyLabel(request.urgencyLevel).text}
                    </span>
                    
                    {/* Status Badge */}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                      {request.status === 'pending' && <AlertTriangle size={12} className="mr-1 text-yellow-400" />}
                      {request.status === 'scheduled' && <Calendar size={12} className="mr-1 text-blue-400" />}
                      {request.status === 'completed' && <Check size={12} className="mr-1 text-green-400" />}
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                    
                    {/* Comments Badge */}
                    {request.comments.length > 0 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-gray-300">
                        <MessageCircle size={14} className="mr-1" /> {request.comments.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end text-sm text-gray-400">
              <div className="font-medium text-gray-600">Created by {request.createdBy}</div>
              <time dateTime={request.createdAt.toISOString()} className="mt-1">
                {formatDate(request.createdAt)}
              </time>
              {request.status === 'scheduled' && (
                <div className="mt-2 text-indigo-400 font-medium flex items-center">
                  <Calendar size={14} className="mr-1" />
                  Scheduled: {formatDate(request.scheduledDate)}
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )}
</div>
          </div>
        )}
        
        {/* Calendar View */}
        {activeView === 'calendar' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-gray-900">Maintenance Calendar</h2>
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
                <span className="text-xl font-semibold text-gray-700">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
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
            
            {/* Calendar Grid */}
            <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="bg-gray-100 py-3 text-center text-sm font-medium text-gray-600">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {generateCalendarDays().map((dayObj, idx) => (
                <div 
                  key={idx} 
                  className={`bg-gray-100 h-44 p-4 overflow-hidden transition-colors duration-300 ${
                    !dayObj.day ? 'bg-gray-200' : 'hover:bg-gradient-to-b hover:from-gray-100 hover:to-gray-200'
                  }`}
                >
                    {dayObj.day && (
                      <>
                        <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          dayObj.date.toDateString() === new Date().toDateString() 
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center' 
                            : 'text-gray-600'
                        }`}>
                            {dayObj.day}
                          </span>
                          
                          {/* Add event button */}
                          <button 
                            className="text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("Add event on", dayObj.date);
                            }}
                          >
                            <PlusCircle size={14} />
                          </button>
                        </div>
                        
                        {/* Events for this day */}
                        <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                          {dayObj.events && dayObj.events.map((event) => (
                            <div 
                              key={event.id} 
                              className="px-3 py-2 text-xs rounded-lg bg-gradient-to-r from-indigo-900 to-violet-900 text-indigo-200 shadow-sm truncate border border-indigo-800"
                              title={`${event.title} - ${formatTime(event.start)} to ${formatTime(event.end)}`}
                            >
                              <div className="font-medium">{event.title}</div>
                              <div className="text-indigo-700">{formatTime(event.start)}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Events Legend */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Maintenance</h3>
              
              {maintenanceEvents.length === 0 ? (
                <p className="text-gray-400 text-sm">No upcoming maintenance events scheduled.</p>
              ) : (
                <div className="space-y-4">
                  {maintenanceEvents
                    .filter(event => new Date(event.start) > new Date())
                    .sort((a, b) => new Date(a.start) - new Date(b.start))
                    .slice(0, 5)
                    .map(event => (
                      <div key={event.id} className="flex items-start p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-900 to-purple-900 flex items-center justify-center mr-4 shadow-sm">
                          <Wrench size={20} className="text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                          <div className="mt-1 flex items-center">
                            <Calendar size={14} className="text-gray-400 mr-1" />
                            <span className="text-sm text-gray-400">
                              {formatDate(event.start)} • {formatTime(event.start)} - {formatTime(event.end)}
                            </span>
                          </div>
                          {event.technician && (
                            <div className="mt-1 flex items-center">
                              <User size={14} className="text-gray-400 mr-1" />
                              <span className="text-sm text-gray-500">{event.technician}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
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
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">              <div className="px-6 pt-5 pb-4 sm:p-6">
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
                      
                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Images
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-500 transition-colors duration-200">
                          <div className="space-y-1 text-center">
                            <Camera size={28} className="mx-auto text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="image-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                              >
                                <span>Upload images</span>
                                <input 
                                  id="image-upload" 
                                  name="image-upload" 
                                  type="file" 
                                  className="sr-only" 
                                  multiple
                                  accept="image/*"
                                  onChange={handleFileChange}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 10MB
                            </p>
                          </div>
                        </div>
                        
                        {/* Image previews */}
                        {newRequest.imagePreviewUrls.length > 0 && (
                          <div className="mt-4 grid grid-cols-3 gap-3">
                            {newRequest.imagePreviewUrls.map((url, index) => (
                              <div key={index} className="relative group">
                                <img 
                                  src={url} 
                                  alt={`Preview ${index}`}
                                  className="h-24 w-full object-cover rounded-lg shadow-sm" 
                                />
                                <button
                                  type="button"
                                  className="absolute top-2 right-2 rounded-full bg-red-100 p-1.5 text-red-600 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                  onClick={() => {
                                    const updatedImages = [...newRequest.images];
                                    updatedImages.splice(index, 1);
                                    
                                    const updatedPreviews = [...newRequest.imagePreviewUrls];
                                    updatedPreviews.splice(index, 1);
                                    
                                    setNewRequest({
                                      ...newRequest, 
                                      images: updatedImages,
                                      imagePreviewUrls: updatedPreviews
                                    });
                                  }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-700 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-base font-medium text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                  onClick={handleAddRequest}
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                  onClick={() => setShowAddRequestModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Request Detail Modal */}
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
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-sm ${
                          selectedRequest.urgencyLevel >= 4 ? 'bg-red-100 text-red-800' :
                          selectedRequest.urgencyLevel === 3 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          Urgency: {getUrgencyLabel(selectedRequest.urgencyLevel).text}
                        </span>
                      </div>
                      
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
                              <img 
                                key={index}
                                src={image}
                                alt={`Issue ${index + 1}`}
                                className="h-48 w-full object-cover rounded-lg shadow-sm"
                              />
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
                                  <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
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
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-lg shadow-sm text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                              onClick={() => handleAddComment(selectedRequest.id)}
                            >
                              <MessageCircle size={16} className="mr-2" />
                              Post
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedRequest.status === 'pending' && (
                  <button
                    type="button"
                    className="ml-3 inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-base font-medium text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
                    onClick={() => {
                      const scheduleDate = new Date();
                      scheduleDate.setDate(scheduleDate.getDate() + 7);
                      handleScheduleMaintenance(selectedRequest.id, scheduleDate);
                      setShowDetailModal(false);
                    }}
                  >
                    <Calendar size={16} className="mr-2" />
                    Schedule Maintenance
                  </button>
                )}
                
                {selectedRequest.status === 'scheduled' && (
                  <button
                    type="button"
                    className="ml-3 inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-base font-medium text-white hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm transition-all duration-200"
                    onClick={() => handleMarkAsCompleted(selectedRequest.id)}
                  >
                    <Check size={16} className="mr-2" />
                    Mark as Completed
                  </button>
                )}
                
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-center text-gray-600">
            &copy; {new Date().getFullYear()} Josh Law • All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MaintenanceManagement;