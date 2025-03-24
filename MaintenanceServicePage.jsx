import React, { useState, useEffect, useRef } from 'react';
import { 
  Wrench, 
  Calendar as CalendarIcon, 
  PlusCircle, 
  AlertTriangle, 
  CheckCircle, 
  Image as ImageIcon, 
  Camera, 
  Trash2, 
  Edit, 
  MessageCircle,
  Clock,
  X,
  Search,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getStorage } from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

const MaintenanceServicePage = ({ currentUser }) => {
  // States for maintenance issue form
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState(3);
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewIssueForm, setShowNewIssueForm] = useState(false);
  
  // States for viewing and filtering issues
  const [maintenanceIssues, setMaintenanceIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgency, setFilterUrgency] = useState(0); // 0 means all
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('issues'); // 'issues' or 'calendar'
  const [isLoading, setIsLoading] = useState(true);
  
  // States for calendar
  const [calendarView, setCalendarView] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduledEvents, setScheduledEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [selectedIssueForEvent, setSelectedIssueForEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // State for modal views
  const [showIssueDetails, setShowIssueDetails] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Refs
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Load maintenance issues
  useEffect(() => {
    if (!currentUser || !currentUser.restaurantId) return;
    
    // Set up real-time listener for maintenance issues
    const issuesRef = collection(db, 'maintenanceIssues');
    let q;
    
    if (currentUser.jobTitle === 'Maintenance') {
      // Maintenance staff can see all issues
      q = query(issuesRef, orderBy('createdAt', 'desc'));
    } else {
      // Managers only see their restaurant's issues
      q = query(
        issuesRef, 
        where("restaurantId", "==", currentUser.restaurantId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const issues = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      setMaintenanceIssues(issues);
      setFilteredIssues(issues);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching maintenance issues:", error);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // Load scheduled events
  useEffect(() => {
    if (!currentUser || !currentUser.restaurantId) return;
    
    const eventsRef = collection(db, 'maintenanceEvents');
    let q;
    
    if (currentUser.jobTitle === 'Maintenance') {
      // Maintenance staff can see all events
      q = query(eventsRef, orderBy('scheduledDate', 'asc'));
    } else {
      // Managers only see their restaurant's events
      q = query(
        eventsRef, 
        where("restaurantId", "==", currentUser.restaurantId),
        orderBy('scheduledDate', 'asc')
      );
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledDate: doc.data().scheduledDate?.toDate() || new Date()
      }));
      setScheduledEvents(events);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // Filter issues based on search term and filters
  useEffect(() => {
    if (!maintenanceIssues.length) return;
    
    let result = [...maintenanceIssues];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(issue => 
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply urgency filter
    if (filterUrgency > 0) {
      result = result.filter(issue => issue.urgencyLevel === filterUrgency);
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(issue => issue.status === filterStatus);
    }
    
    setFilteredIssues(result);
  }, [maintenanceIssues, searchTerm, filterUrgency, filterStatus]);

  // Handle file input change
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Preview images
    const newImageURLs = files.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...newImageURLs]);
    setImageFiles(prev => [...prev, ...files]);
  };

  // Handle camera capture
  const handleCameraCapture = (e) => {
    const files = Array.from(e.target.files);
    
    // Preview images
    const newImageURLs = files.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...newImageURLs]);
    setImageFiles(prev => [...prev, ...files]);
  };

  // Remove image from preview
  const handleRemoveImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);
  };

  // Submit new maintenance issue
  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    
    if (!issueTitle.trim()) {
      alert("Please enter an issue title");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload images first
      const imageURLs = [];
      
      for (const file of imageFiles) {
        const storageRef = ref(storage, `maintenance/${currentUser.restaurantId}/${Date.now()}-${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(uploadResult.ref);
        imageURLs.push({
          url: downloadURL,
          path: uploadResult.ref.fullPath
        });
      }
      
      // Create maintenance issue document
      await addDoc(collection(db, 'maintenanceIssues'), {
        title: issueTitle,
        description: issueDescription,
        urgencyLevel: Number(urgencyLevel),
        images: imageURLs,
        status: 'pending', // pending, in-progress, scheduled, completed
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        restaurantId: currentUser.restaurantId,
        restaurantName: currentUser.restaurantName,
        comments: []
      });
      
      // Reset form
      setIssueTitle('');
      setIssueDescription('');
      setUrgencyLevel(3);
      setImages([]);
      setImageFiles([]);
      setShowNewIssueForm(false);
      
      // Show success notification
      alert("Maintenance issue submitted successfully!");
    } catch (error) {
      console.error("Error submitting maintenance issue:", error);
      alert("Failed to submit maintenance issue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit new comment
  const handleSubmitComment = async () => {
    if (!commentText.trim() || !selectedIssue) return;
    
    try {
      const issueRef = doc(db, 'maintenanceIssues', selectedIssue.id);
      
      // Get updated issue to prevent overwriting other changes
      const issueDoc = await getDocs(query(collection(db, 'maintenanceIssues'), where("__name__", "==", selectedIssue.id)));
      const currentIssue = { id: issueDoc.docs[0].id, ...issueDoc.docs[0].data() };
      
      const newComment = {
        text: commentText,
        createdAt: new Date(),
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        role: currentUser.jobTitle
      };
      
      const updatedComments = [...(currentIssue.comments || []), newComment];
      
      await updateDoc(issueRef, {
        comments: updatedComments,
        updatedAt: serverTimestamp()
      });
      
      setCommentText('');
      
      // Update the selected issue in state to show the new comment
      setSelectedIssue({
        ...selectedIssue,
        comments: updatedComments
      });
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Failed to submit comment. Please try again.");
    }
  };

  // Update issue status
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedIssue) return;
    
    try {
      const issueRef = doc(db, 'maintenanceIssues', selectedIssue.id);
      
      await updateDoc(issueRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // Update the selected issue in state to show the new status
      setSelectedIssue({
        ...selectedIssue,
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  // Submit new scheduled event
  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    
    if (!eventTitle.trim() || !eventDate) {
      alert("Please enter an event title and date");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const scheduledDateTime = new Date(`${eventDate}T${eventTime || '09:00'}`);
      
      // Create event document
      const eventData = {
        title: eventTitle,
        description: eventDescription,
        scheduledDate: scheduledDateTime,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        restaurantId: currentUser.restaurantId,
        restaurantName: currentUser.restaurantName
      };
      
      // Add related issue if selected
      if (selectedIssueForEvent) {
        eventData.relatedIssueId = selectedIssueForEvent.id;
        eventData.relatedIssueTitle = selectedIssueForEvent.title;
        
        // Also update the issue status to scheduled
        const issueRef = doc(db, 'maintenanceIssues', selectedIssueForEvent.id);
        await updateDoc(issueRef, {
          status: 'scheduled',
          scheduledDate: scheduledDateTime,
          updatedAt: serverTimestamp()
        });
      }
      
      await addDoc(collection(db, 'maintenanceEvents'), eventData);
      
      // Reset form
      setEventTitle('');
      setEventDescription('');
      setEventDate('');
      setEventTime('');
      setSelectedIssueForEvent(null);
      setShowEventForm(false);
      
      // Show success notification
      alert("Maintenance event scheduled successfully!");
    } catch (error) {
      console.error("Error scheduling maintenance event:", error);
      alert("Failed to schedule maintenance event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete maintenance issue
  const handleDeleteIssue = async () => {
    if (!selectedIssue) return;
    
    if (!confirm("Are you sure you want to delete this maintenance issue? This action cannot be undone.")) {
      return;
    }
    
    try {
      // Delete images from storage
      for (const image of selectedIssue.images || []) {
        if (image.path) {
          const imageRef = ref(storage, image.path);
          await deleteObject(imageRef).catch(err => console.error("Error deleting image:", err));
        }
      }
      
      // Delete issue document
      await deleteDoc(doc(db, 'maintenanceIssues', selectedIssue.id));
      
      setShowIssueDetails(false);
      setSelectedIssue(null);
      
      // Show success notification
      alert("Maintenance issue deleted successfully!");
    } catch (error) {
      console.error("Error deleting maintenance issue:", error);
      alert("Failed to delete maintenance issue. Please try again.");
    }
  };

  // Delete scheduled event
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    if (!confirm("Are you sure you want to delete this scheduled event? This action cannot be undone.")) {
      return;
    }
    
    try {
      // Delete event document
      await deleteDoc(doc(db, 'maintenanceEvents', selectedEvent.id));
      
      // If this event was related to an issue, update the issue status
      if (selectedEvent.relatedIssueId) {
        const issueRef = doc(db, 'maintenanceIssues', selectedEvent.relatedIssueId);
        await updateDoc(issueRef, {
          status: 'pending',
          scheduledDate: null,
          updatedAt: serverTimestamp()
        }).catch(err => console.error("Error updating issue status:", err));
      }
      
      setShowEventDetails(false);
      setSelectedEvent(null);
      
      // Show success notification
      alert("Scheduled event deleted successfully!");
    } catch (error) {
      console.error("Error deleting scheduled event:", error);
      alert("Failed to delete scheduled event. Please try again.");
    }
  };

  // View issue details
  const handleViewIssue = (issue) => {
    setSelectedIssue(issue);
    setShowIssueDetails(true);
  };

  // View event details
  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  // Open event form for a specific issue
  const handleScheduleForIssue = (issue) => {
    setSelectedIssueForEvent(issue);
    setEventTitle(`Fix: ${issue.title}`);
    setShowEventForm(true);
    setActiveTab('calendar');
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterUrgency(0);
    setFilterStatus('all');
  };

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge based on status
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock size={12} className="mr-1" />
            Pending
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Wrench size={12} className="mr-1" />
            In Progress
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <CalendarIcon size={12} className="mr-1" />
            Scheduled
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} className="mr-1" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  // Get urgency badge based on level
  const getUrgencyBadge = (level) => {
    const colors = {
      1: 'bg-gray-100 text-gray-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[level]}`}>
        <AlertTriangle size={12} className="mr-1" />
        Urgency: {level}
      </span>
    );
  };

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    
    // Get first day of month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Get number of days in month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Create calendar grid
    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      
      // Get events for this day
      const dayEvents = scheduledEvents.filter(event => {
        const eventDate = new Date(event.scheduledDate);
        return eventDate.getDate() === day && 
               eventDate.getMonth() === currentMonth && 
               eventDate.getFullYear() === currentYear;
      });
      
      calendarDays.push(
        <div 
          key={`day-${day}`} 
          className={`h-24 border border-gray-200 p-1 overflow-hidden ${isToday ? 'bg-indigo-50' : ''}`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-medium ${isToday ? 'text-indigo-600' : ''}`}>{day}</span>
            {dayEvents.length > 0 && (
              <span className="text-xs text-gray-500">{dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="space-y-1 overflow-y-auto max-h-16">
            {dayEvents.map((event, index) => (
              <div 
                key={event.id} 
                className="px-1 py-0.5 text-xs bg-indigo-100 text-indigo-800 rounded truncate cursor-pointer hover:bg-indigo-200"
                onClick={() => handleViewEvent(event)}
              >
                {formatTime(event.scheduledDate)} {event.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return calendarDays;
  };

  // Change month
  const changeMonth = (delta) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedDate(newDate);
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
            <Wrench size={20} className="text-indigo-600 mr-2" />
            Maintenance Services
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {currentUser.jobTitle === 'Maintenance' 
              ? 'Manage maintenance requests and schedule repairs' 
              : 'Submit maintenance requests and track their status'}
          </p>
        </div>
        
        {/* Action buttons based on user role */}
        <div className="flex space-x-2">
          {/* Tab buttons */}
          <div className="bg-white rounded-lg shadow-sm flex">
            <button
              onClick={() => setActiveTab('issues')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                activeTab === 'issues' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Wrench size={16} className="inline-block mr-1" />
              Issues
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                activeTab === 'calendar' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CalendarIcon size={16} className="inline-block mr-1" />
              Calendar
            </button>
          </div>
          
          {/* Action button */}
          {activeTab === 'issues' ? (
            <button
              onClick={() => setShowNewIssueForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusCircle size={16} className="inline-block mr-1" />
              New Issue
            </button>
          ) : (
            <button
              onClick={() => setShowEventForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusCircle size={16} className="inline-block mr-1" />
              Schedule Event
            </button>
          )}
        </div>
      </div>
      
      {/* Main content area */}
      <div className="px-6 py-5">
        {activeTab === 'issues' ? (
          <>
            {/* Filter and search area */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search maintenance issues..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">Urgency:</span>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={filterUrgency}
                    onChange={(e) => setFilterUrgency(Number(e.target.value))}
                  >
                    <option value={0}>All</option>
                    <option value={1}>Level 1 (Low)</option>
                    <option value={2}>Level 2</option>
                    <option value={3}>Level 3 (Medium)</option>
                    <option value={4}>Level 4</option>
                    <option value={5}>Level 5 (Critical)</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">Status:</span>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <RotateCcw size={14} className="mr-1" />
                  Reset
                </button>
              </div>
            </div>
            
            {/* Issues list */}
            {isLoading ? (
              <div className="flex justify-center py-10">
                <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Wrench size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No maintenance issues found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm || filterUrgency > 0 || filterStatus !== 'all'
                    ? 'Try adjusting your filters or create a new maintenance issue.'
                    : 'Get started by creating a new maintenance issue.'}
                </p>
                <button
                  onClick={() => setShowNewIssueForm(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusCircle size={16} className="mr-1" />
                  New Issue
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredIssues.map((issue) => (
                  <div 
                    key={issue.id}
                    className={`relative p-4 border rounded-lg cursor-pointer hover:shadow-md ${
                      issue.urgencyLevel >= 4 ? 'border-red-300 bg-red-50' : 
                      issue.urgencyLevel === 3 ? 'border-yellow-300 bg-yellow-50' : 
                      'border-gray-300 bg-white'
                    }`}
                    onClick={() => handleViewIssue(issue)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center mb-2">
                          <h4 className="font-medium text-gray-900">{issue.title}</h4>
                          <div className="ml-2">
                            {getStatusBadge(issue.status)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-2">{issue.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {getUrgencyBadge(issue.urgencyLevel)}
                          <span className="text-xs text-gray-500">
                            {formatDate(issue.createdAt)} by {issue.createdByName}
                          </span>
                          {issue.images?.length > 0 && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <ImageIcon size={12} className="mr-1" />
                              {issue.images.length} image{issue.images.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          {issue.comments?.length > 0 && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <MessageCircle size={12} className="mr-1" />
                              {issue.comments.length} comment{issue.comments.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 sm:mt-0 flex flex-col sm:flex-row items-center gap-2">
                        {issue.status !== 'scheduled' && currentUser.jobTitle === 'Maintenance' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleScheduleForIssue(issue);
                            }}
                            className="w-full sm:w-auto text-xs px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                          >
                            <CalendarIcon size={12} className="inline-block mr-1" />
                            Schedule
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewIssue(issue);
                          }}
                          className="w-full sm:w-auto text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          // Calendar View
          <>
            <div className="mb-4 flex flex-wrap justify-between items-center">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex space-x-1">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="p-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => changeMonth(1)}
                    className="p-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="mt-2 sm:mt-0">
                <button
                  onClick={() => setShowEventForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusCircle size={16} className="mr-1" />
                  Schedule Maintenance
                </button>
              </div>
            </div>
            
            {/* Calendar grid */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Day headings */}
              <div className="grid grid-cols-7 bg-gray-50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="py-2 text-center text-sm font-medium text-gray-700">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar days */}
              <div className="grid grid-cols-7">
                {generateCalendarGrid()}
              </div>
            </div>
            
            {/* List of upcoming events */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upcoming Maintenance</h3>
              
              {scheduledEvents.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <CalendarIcon size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No scheduled maintenance events</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledEvents
                    .filter(event => new Date(event.scheduledDate) >= new Date())
                    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
                    .slice(0, 5)
                    .map(event => (
                      <div 
                        key={event.id}
                        className="p-3 border border-gray-300 rounded-lg hover:shadow-sm cursor-pointer"
                        onClick={() => handleViewEvent(event)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{event.title}</h4>
                            <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                            {event.relatedIssueId && (
                              <div className="mt-1 text-xs text-indigo-600">
                                Related to issue: {event.relatedIssueTitle}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{formatDate(event.scheduledDate)}</div>
                            <div className="text-xs text-gray-500">{formatTime(event.scheduledDate)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    
    {/* New Issue Form Modal */}
    {showNewIssueForm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900">Report Maintenance Issue</h2>
            <button 
              onClick={() => setShowNewIssueForm(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmitIssue} className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="issueTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="issueTitle"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="E.g., Broken exhaust fan in kitchen"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="issueDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="issueDescription"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Please describe the issue in detail..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="urgencyLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency Level
                </label>
                <select
                  id="urgencyLevel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={urgencyLevel}
                  onChange={(e) => setUrgencyLevel(Number(e.target.value))}
                >
                  <option value={1}>1 - Low (No rush)</option>
                  <option value={2}>2 - Minor (Fix when convenient)</option>
                  <option value={3}>3 - Medium (Fix within a week)</option>
                  <option value={4}>4 - High (Fix within 24-48 hours)</option>
                  <option value={5}>5 - Critical (Immediate attention required)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Images
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <ImageIcon size={16} className="mr-1" />
                    Upload Images
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Camera size={16} className="mr-1" />
                    Take Photo
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCameraCapture}
                  />
                </div>
                
                {/* Image previews */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {images.map((src, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={src} 
                          alt={`Preview ${index + 1}`} 
                          className="h-24 w-full object-cover rounded-lg border border-gray-300" 
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewIssueForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : 'Submit Issue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    
    {/* Issue Details Modal */}
    {showIssueDetails && selectedIssue && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900">Maintenance Issue Details</h2>
            <button 
              onClick={() => setShowIssueDetails(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-1">{selectedIssue.title}</h3>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {getStatusBadge(selectedIssue.status)}
                  {getUrgencyBadge(selectedIssue.urgencyLevel)}
                  <span className="text-sm text-gray-500">
                    Reported by {selectedIssue.createdByName}
                  </span>
                </div>
                
                <div className="prose prose-sm max-w-none mb-4">
                  <p className="text-gray-700 whitespace-pre-line">{selectedIssue.description}</p>
                </div>
                
                {selectedIssue.scheduledDate && (
                  <div className="mb-4 bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-purple-700 flex items-center">
                      <CalendarIcon size={16} className="mr-1" />
                      Maintenance scheduled for {formatDate(selectedIssue.scheduledDate)} at {formatTime(selectedIssue.scheduledDate)}
                    </p>
                  </div>
                )}
                
                {/* Image gallery */}
                {selectedIssue.images?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Images</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedIssue.images.map((image, index) => (
                        <a 
                          key={index}
                          href={image.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img 
                            src={image.url}
                            alt={`Issue ${index + 1}`}
                            className="rounded-lg border border-gray-200 object-cover h-32 w-full hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="md:w-64 flex flex-col space-y-3">
                <div className="text-sm text-gray-500">
                  <p>Created on {formatDate(selectedIssue.createdAt)}</p>
                  {selectedIssue.updatedAt && selectedIssue.updatedAt !== selectedIssue.createdAt && (
                    <p>Last updated on {formatDate(selectedIssue.updatedAt)}</p>
                  )}
                </div>
                
                {/* Status controls for maintenance staff */}
                {currentUser.jobTitle === 'Maintenance' && (
                  <div className="border border-gray-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Update Status</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleUpdateStatus('pending')}
                        className={`w-full px-3 py-1.5 text-xs font-medium rounded-md ${
                          selectedIssue.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Clock size={12} className="inline-block mr-1" />
                        Pending
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('in-progress')}
                        className={`w-full px-3 py-1.5 text-xs font-medium rounded-md ${
                          selectedIssue.status === 'in-progress' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Wrench size={12} className="inline-block mr-1" />
                        In Progress
                      </button>
                      <button
                        onClick={() => handleScheduleForIssue(selectedIssue)}
                        className={`w-full px-3 py-1.5 text-xs font-medium rounded-md ${
                          selectedIssue.status === 'scheduled' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <CalendarIcon size={12} className="inline-block mr-1" />
                        Schedule
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('completed')}
                        className={`w-full px-3 py-1.5 text-xs font-medium rounded-md ${
                          selectedIssue.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <CheckCircle size={12} className="inline-block mr-1" />
                        Completed
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Actions</h4>
                  <div className="space-y-2">
                    {currentUser.jobTitle === 'Maintenance' && (
                      <button
                        onClick={() => handleDeleteIssue()}
                        className="w-full px-3 py-1.5 text-xs font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        <Trash2 size={12} className="inline-block mr-1" />
                        Delete Issue
                      </button>
                    )}
                    {selectedIssue.status !== 'scheduled' && currentUser.jobTitle === 'Maintenance' && (
                      <button
                        onClick={() => {
                          setShowIssueDetails(false);
                          handleScheduleForIssue(selectedIssue);
                        }}
                        className="w-full px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                      >
                        <CalendarIcon size={12} className="inline-block mr-1" />
                        Schedule Maintenance
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Comments section */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Comments</h4>
              
              <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                {selectedIssue.comments?.length > 0 ? (
                  selectedIssue.comments.map((comment, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{comment.createdByName}</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)} {formatTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{comment.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No comments yet</p>
                )}
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  
    {/* Schedule Event Form Modal */}
    {showEventForm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900">Schedule Maintenance</h2>
            <button 
              onClick={() => setShowEventForm(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmitEvent} className="p-6">
            <div className="space-y-4">
              {selectedIssueForEvent && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-sm text-indigo-700">
                    Scheduling maintenance for issue: <strong>{selectedIssueForEvent.title}</strong>
                  </p>
                </div>
              )}
              
              <div>
                <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="eventTitle"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="E.g., Replace exhaust fan in kitchen"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="eventDescription"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add details about the scheduled maintenance..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="eventDate"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="eventTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    id="eventTime"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                  />
                </div>
              </div>
              
              {!selectedIssueForEvent && currentUser.jobTitle === 'Maintenance' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link to Existing Issue (Optional)
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={selectedIssueForEvent?.id || ''}
                    onChange={(e) => {
                      const issueId = e.target.value;
                      if (issueId) {
                        const issue = maintenanceIssues.find(i => i.id === issueId);
                        setSelectedIssueForEvent(issue);
                        setEventTitle(`Fix: ${issue.title}`);
                      } else {
                        setSelectedIssueForEvent(null);
                        setEventTitle('');
                      }
                    }}
                  >
                    <option value="">-- Select an issue (optional) --</option>
                    {maintenanceIssues
                      .filter(issue => issue.status !== 'completed' && issue.status !== 'scheduled')
                      .map(issue => (
                        <option key={issue.id} value={issue.id}>
                          {issue.title} - {issue.restaurantName}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowEventForm(false);
                  setSelectedIssueForEvent(null);
                  setEventTitle('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Scheduling...
                  </>
                ) : 'Schedule Maintenance'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    
    {/* Event Details Modal */}
    {showEventDetails && selectedEvent && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900">Maintenance Event Details</h2>
            <button 
              onClick={() => setShowEventDetails(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{selectedEvent.title}</h3>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <CalendarIcon size={16} className="mr-1" />
                  {formatDate(selectedEvent.scheduledDate)} at {formatTime(selectedEvent.scheduledDate)}
                </div>
              </div>
              
              {selectedEvent.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                  <p className="text-gray-700 text-sm whitespace-pre-line">{selectedEvent.description}</p>
                </div>
              )}
              
              {selectedEvent.relatedIssueId && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-indigo-700 mb-1">Related Issue</h4>
                  <p className="text-indigo-700 text-sm">{selectedEvent.relatedIssueTitle}</p>
                  <button
                    onClick={() => {
                      // Find the related issue
                      const issue = maintenanceIssues.find(i => i.id === selectedEvent.relatedIssueId);
                      if (issue) {
                        setShowEventDetails(false);
                        setSelectedIssue(issue);
                        setShowIssueDetails(true);
                      }
                    }}
                    className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View Issue Details
                  </button>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Created by {selectedEvent.createdByName}</span>
                <span>Restaurant: {selectedEvent.restaurantName}</span>
              </div>
              
              {/* Actions */}
              {currentUser.jobTitle === 'Maintenance' && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Actions</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleDeleteEvent}
                      className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200"
                    >
                      <Trash2 size={14} className="inline-block mr-1" />
                      Delete Event
                    </button>
                    <button
                      onClick={() => {
                        setShowEventDetails(false);
                        setEventTitle(selectedEvent.title);
                        setEventDescription(selectedEvent.description);
                        const date = new Date(selectedEvent.scheduledDate);
                        setEventDate(date.toISOString().split('T')[0]);
                        setEventTime(date.toTimeString().slice(0, 5));
                        if (selectedEvent.relatedIssueId) {
                          const issue = maintenanceIssues.find(i => i.id === selectedEvent.relatedIssueId);
                          setSelectedIssueForEvent(issue);
                        }
                        setShowEventForm(true);
                      }}
                      className="flex-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-200"
                    >
                      <Edit size={14} className="inline-block mr-1" />
                      Edit Event
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
};


export default MaintenanceServicePage;