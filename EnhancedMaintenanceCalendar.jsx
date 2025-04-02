import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Tool,
  AlertTriangle,
  Search,
  Filter,
  Check,
  Clock as ClockIcon,
} from 'lucide-react';

// Calendar component to replace the existing calendar view in MaintenanceManagement.jsx
const EnhancedMaintenanceCalendar = ({ maintenanceEvents = [], currentUser }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('week'); // 'day', 'week', 'month'
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTechnician, setFilterTechnician] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [expandedEvent, setExpandedEvent] = useState(null);
  
  // Calculate unique technicians and locations for filters
  const technicians = ['all', ...new Set(maintenanceEvents.map(event => event.technician || 'Unassigned'))];
  const locations = ['all', ...new Set(maintenanceEvents.map(event => event.location || 'Unspecified'))];
  
  // Apply filters to events
  useEffect(() => {
    let filtered = [...maintenanceEvents];
    
    // Filter by search term
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        (event.title && event.title.toLowerCase().includes(lowercaseSearch)) ||
        (event.description && event.description.toLowerCase().includes(lowercaseSearch)) ||
        (event.location && event.location.toLowerCase().includes(lowercaseSearch)) ||
        (event.technician && event.technician.toLowerCase().includes(lowercaseSearch))
      );
    }
    
    // Filter by technician
    if (filterTechnician !== 'all') {
      filtered = filtered.filter(event => event.technician === filterTechnician);
    }
    
    // Filter by location
    if (filterLocation !== 'all') {
      filtered = filtered.filter(event => event.location === filterLocation);
    }
    
    setFilteredEvents(filtered);
  }, [maintenanceEvents, searchTerm, filterTechnician, filterLocation]);
  
  // Navigate to previous time period
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (calendarView === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };
  
  // Navigate to next time period
  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (calendarView === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };
  
  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Format date for display
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: calendarView === 'month' ? 'short' : 'long',
      month: 'short',
      day: 'numeric',
      year: currentDate.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
    }).format(date);
  };
  
  // Format time for display
  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };
  
  // Calculate duration between two dates in hours and minutes
  const calculateDuration = (start, end) => {
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${minutes} min`;
    }
  };
  
  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  // Get events for a specific day
  const getEventsForDay = (day) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.getDate() === day.getDate() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getFullYear() === day.getFullYear();
    });
  };
  
  // Get time slots for day view (8 AM to 6 PM in 30-minute increments)
  const getTimeSlots = () => {
    const slots = [];
    const baseDate = new Date(currentDate);
    baseDate.setHours(8, 0, 0, 0);
    
    for (let i = 0; i < 20; i++) { // 10 hours * 2 slots per hour = 20 slots
      const slotTime = new Date(baseDate);
      slotTime.setMinutes(baseDate.getMinutes() + i * 30);
      slots.push(slotTime);
    }
    
    return slots;
  };
  
  // Get days for the week view
  const getDaysInWeek = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    
    // Set to the beginning of the week (Sunday)
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };
  
  // Get all days in the current month for month view
  const getDaysInMonth = () => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    
    // Get the day of the week for the first day (0 is Sunday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Add days from the previous month to align with the week
    for (let i = 0; i < firstDayOfWeek; i++) {
      const previousMonthDay = new Date(year, month, -i);
      days.unshift(previousMonthDay);
    }
    
    // Add days of the current month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add days from the next month to complete the grid (6 rows x 7 days = 42 cells)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };
  
  // Get event position and height for day view (relative to 8 AM - 6 PM)
  const getEventPosition = (event) => {
    const startTime = new Date(event.start);
    const endTime = new Date(event.end);
    
    // Base time (8 AM)
    const baseTime = new Date(startTime);
    baseTime.setHours(8, 0, 0, 0);
    
    // End time (6 PM)
    const maxTime = new Date(startTime);
    maxTime.setHours(18, 0, 0, 0);
    
    // Adjust times if they're outside our range
    const adjustedStart = startTime < baseTime ? baseTime : startTime;
    const adjustedEnd = endTime > maxTime ? maxTime : endTime;
    
    // Calculate position as percentage
    const totalMinutes = (maxTime - baseTime) / (1000 * 60); // 10 hours = 600 minutes
    const startMinutes = (adjustedStart - baseTime) / (1000 * 60);
    const endMinutes = (adjustedEnd - baseTime) / (1000 * 60);
    
    const top = (startMinutes / totalMinutes) * 100;
    const height = ((endMinutes - startMinutes) / totalMinutes) * 100;
    
    return { top, height };
  };
  
  // Determine if an event spans multiple days
  const isMultiDayEvent = (event) => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    return startDate.getDate() !== endDate.getDate() ||
      startDate.getMonth() !== endDate.getMonth() ||
      startDate.getFullYear() !== endDate.getFullYear();
  };
  
  // Check if a specific day is included in a multi-day event
  const isDayInEvent = (day, event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    // Set time to midnight for proper date comparison
    const startDate = new Date(eventStart);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(eventEnd);
    endDate.setHours(23, 59, 59, 999);
    
    const currentDate = new Date(day);
    currentDate.setHours(12, 0, 0, 0);
    
    return currentDate >= startDate && currentDate <= endDate;
  };
  
  // Get the type of day for a multi-day event (start, middle, end)
  const getMultiDayPosition = (day, event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    // Set to midnight for proper date comparison
    eventStart.setHours(0, 0, 0, 0);
    eventEnd.setHours(0, 0, 0, 0);
    
    const currentDate = new Date(day);
    currentDate.setHours(0, 0, 0, 0);
    
    if (currentDate.getTime() === eventStart.getTime()) {
      return 'start';
    } else if (currentDate.getTime() === eventEnd.getTime()) {
      return 'end';
    } else {
      return 'middle';
    }
  };
  
  // Calculate background gradient for multi-day events
  const getEventBackground = (event, day, position) => {
    const urgencyColors = {
      1: 'rgba(209, 213, 219, 0.9)', // Very Low - Gray
      2: 'rgba(191, 219, 254, 0.9)', // Low - Blue
      3: 'rgba(254, 243, 199, 0.9)', // Medium - Yellow
      4: 'rgba(254, 215, 170, 0.9)', // High - Orange
      5: 'rgba(252, 165, 165, 0.9)', // Critical - Red
    };
    
    const baseColor = urgencyColors[event.urgencyLevel || 3];
    
    if (position === 'start') {
      return `linear-gradient(to right, ${baseColor} 90%, ${baseColor.replace('0.9', '0.7')})`;
    } else if (position === 'end') {
      return `linear-gradient(to right, ${baseColor.replace('0.9', '0.7')}, ${baseColor} 10%)`;
    } else {
      return baseColor;
    }
  };
  
  // Render the day view
  const renderDayView = () => {
    const timeSlots = getTimeSlots();
    const eventsForDay = getEventsForDay(currentDate);
    
    return (
      <div className="flex flex-col h-[600px] overflow-y-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Day header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="flex px-4 py-3 items-center justify-center">
            <h3 className={`text-lg font-semibold ${isToday(currentDate) ? 'text-indigo-600' : 'text-gray-800'}`}>
              {formatDate(currentDate)}
            </h3>
          </div>
        </div>
        
        {/* Time slots */}
        <div className="relative flex-grow">
          {timeSlots.map((slot, index) => (
            <div 
              key={index} 
              className={`flex h-12 border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
            >
              <div className="w-16 flex-shrink-0 py-1 px-2 text-xs text-gray-500 text-right border-r border-gray-200">
                {formatTime(slot)}
              </div>
              <div className="flex-grow"></div>
            </div>
          ))}
          
          {/* Events */}
          <div className="absolute top-0 left-16 right-0 bottom-0">
            {eventsForDay.map((event, index) => {
              const { top, height } = getEventPosition(event);
              const urgencyColors = {
                1: 'bg-gray-200 border-gray-300 text-gray-800', // Very Low
                2: 'bg-blue-100 border-blue-200 text-blue-800', // Low
                3: 'bg-yellow-100 border-yellow-200 text-yellow-800', // Medium
                4: 'bg-orange-100 border-orange-200 text-orange-800', // High
                5: 'bg-red-100 border-red-200 text-red-800', // Critical
              };
              
              const colorClass = urgencyColors[event.urgencyLevel || 3];
              
              return (
                <div 
                  key={`${event.id}-${index}`}
                  className={`absolute left-1 right-1 rounded-md border shadow-sm overflow-hidden ${colorClass}`}
                  style={{ 
                    top: `${top}%`, 
                    height: `${height}%`,
                    minHeight: '24px',
                    zIndex: hoveredEvent === event.id ? 20 : 10
                  }}
                  onClick={() => setExpandedEvent(event)}
                  onMouseEnter={() => setHoveredEvent(event.id)}
                  onMouseLeave={() => setHoveredEvent(null)}
                >
                  <div className="p-1 text-xs font-medium truncate">
                    {event.title}
                  </div>
                  {(height > 10 || hoveredEvent === event.id) && (
                    <div className="px-1 text-xs flex items-center">
                      <MapPin size={10} className="mr-1 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  {(height > 15 || hoveredEvent === event.id) && (
                    <div className="px-1 text-xs flex items-center">
                      <User size={10} className="mr-1 flex-shrink-0" />
                      <span className="truncate">{event.technician}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  // Render week view
  const renderWeekView = () => {
    const days = getDaysInWeek();
    const timeSlots = getTimeSlots();
    
    return (
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="min-w-[800px]">
          {/* Week header */}
          <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="w-16 flex-shrink-0"></div>
            {days.map((day, index) => (
              <div 
                key={index} 
                className={`flex-1 px-2 py-3 text-center ${
                  isToday(day) ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700'
                }`}
              >
                <div className="text-xs uppercase font-medium">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className={`text-lg mt-1 ${isToday(day) ? 'text-indigo-700 font-bold' : 'text-gray-700'}`}>{day.getDate()}</div>
              </div>
            ))}
          </div>
          
          {/* Time grid */}
          <div className="relative">
            {timeSlots.map((slot, slotIndex) => (
              <div 
                key={slotIndex} 
                className={`flex h-12 border-b border-gray-100 ${slotIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
              >
                <div className="w-16 flex-shrink-0 py-1 px-2 text-xs text-gray-500 text-right border-r border-gray-200">
                  {formatTime(slot)}
                </div>
                {days.map((day, dayIndex) => (
                  <div key={dayIndex} className="flex-1 relative border-r border-gray-100">
                    {filteredEvents
                      .filter(event => {
                        const eventDate = new Date(event.start);
                        return eventDate.getDate() === day.getDate() &&
                          eventDate.getMonth() === day.getMonth() &&
                          eventDate.getFullYear() === day.getFullYear();
                      })
                      .map((event, eventIndex) => {
                        const { top, height } = getEventPosition(event);
                        const urgencyColors = {
                          1: 'bg-gray-200 border-gray-300 text-gray-800', // Very Low
                          2: 'bg-blue-100 border-blue-200 text-blue-800', // Low
                          3: 'bg-yellow-100 border-yellow-200 text-yellow-800', // Medium
                          4: 'bg-orange-100 border-orange-200 text-orange-800', // High
                          5: 'bg-red-100 border-red-200 text-red-800', // Critical
                        };
                        
                        // Only render if this time slot aligns with the event
                        const slotTime = new Date(slot);
                        const eventStart = new Date(event.start);
                        const eventEnd = new Date(event.end);
                        
                        // Only render at the first slot the event appears in
                        if (slotIndex !== 0 && slotTime > eventStart) {
                          return null;
                        }
                        
                        const colorClass = urgencyColors[event.urgencyLevel || 3];
                        
                        return (
                          <div 
                            key={`${event.id}-${eventIndex}`}
                            className={`absolute left-0 right-0 mx-1 rounded-md border shadow-sm overflow-hidden ${colorClass}`}
                            style={{ 
                              top: `${top}%`, 
                              height: `${height}%`,
                              minHeight: '24px',
                              zIndex: hoveredEvent === event.id ? 20 : 10
                            }}
                            onClick={() => setExpandedEvent(event)}
                            onMouseEnter={() => setHoveredEvent(event.id)}
                            onMouseLeave={() => setHoveredEvent(null)}
                          >
                            <div className="p-1 text-xs font-medium truncate">
                              {event.title}
                            </div>
                            {(height > 10 || hoveredEvent === event.id) && (
                              <div className="px-1 text-xs flex items-center">
                                <MapPin size={10} className="mr-1 flex-shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Render month view
  const renderMonthView = () => {
    const days = getDaysInMonth();
    
    // Group multi-day events by week row for proper rendering
    const getMultiDayEvents = (weekRow) => {
      const multiDayEvents = filteredEvents.filter(event => isMultiDayEvent(event));
      const weekStart = weekRow * 7;
      const weekDays = days.slice(weekStart, weekStart + 7);
      
      return multiDayEvents.filter(event => {
        return weekDays.some(day => isDayInEvent(day, event));
      });
    };
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Month header */}
        <div className="text-center py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
        </div>
        
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <div key={index} className="py-2 text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-gray-200">
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isDayToday = isToday(day);
            
            return (
              <div 
                key={index} 
                className={`min-h-24 relative ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}`}
              >
                {/* Day number */}
                <div className={`text-right p-1 ${
                  !isCurrentMonth ? 'text-gray-400' : 
                  isDayToday ? 'text-indigo-700 font-bold' : 'text-gray-700'
                }`}>
                  {day.getDate()}
                </div>
                
                {/* Events for the day */}
                <div className="px-1 pb-1">
                  {dayEvents.length > 0 ? (
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event, eventIndex) => {
                        const urgencyColors = {
                          1: 'bg-gray-200 text-gray-800', // Very Low
                          2: 'bg-blue-100 text-blue-800', // Low
                          3: 'bg-yellow-100 text-yellow-800', // Medium
                          4: 'bg-orange-100 text-orange-800', // High
                          5: 'bg-red-100 text-red-800', // Critical
                        };
                        
                        const colorClass = urgencyColors[event.urgencyLevel || 3];
                        
                        return (
                          <div 
                            key={`${event.id}-${eventIndex}`}
                            className={`rounded-md py-1 px-2 text-xs truncate cursor-pointer ${colorClass}`}
                            onClick={() => setExpandedEvent(event)}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                          </div>
                        );
                      })}
                      
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-center text-gray-500">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Expanded event details modal
  const renderExpandedEventModal = () => {
    if (!expandedEvent) return null;
    
    const urgencyLabels = {
      1: { text: 'Very Low', color: 'bg-gray-100 text-gray-800 border-gray-200' },
      2: { text: 'Low', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      3: { text: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      4: { text: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      5: { text: 'Critical', color: 'bg-red-100 text-red-800 border-red-200' },
    };
    
    const urgency = urgencyLabels[expandedEvent.urgencyLevel || 3];
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900">{expandedEvent.title}</h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setExpandedEvent(null)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Start Time</div>
                <div className="flex items-center">
                  <Clock size={16} className="text-indigo-500 mr-2" />
                  <span>{formatDate(new Date(expandedEvent.start))} {formatTime(new Date(expandedEvent.start))}</span>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500 mb-1">End Time</div>
                <div className="flex items-center">
                  <Clock size={16} className="text-indigo-500 mr-2" />
                  <span>{formatDate(new Date(expandedEvent.end))} {formatTime(new Date(expandedEvent.end))}</span>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1">Duration</div>
              <div className="flex items-center">
                <ClockIcon size={16} className="text-indigo-500 mr-2" />
                <span>{calculateDuration(new Date(expandedEvent.start), new Date(expandedEvent.end))}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1">Location</div>
              <div className="flex items-center">
                <MapPin size={16} className="text-indigo-500 mr-2" />
                <span>{expandedEvent.location || 'Not specified'}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1">Technician</div>
              <div className="flex items-center">
                <User size={16} className="text-indigo-500 mr-2" />
                <span>{expandedEvent.technician || 'Unassigned'}</span>
              </div>
            </div>
            
            {expandedEvent.urgencyLevel && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Urgency</div>
                <div className="inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${urgency.color}">
                  {urgency.text}
                </div>
              </div>
            )}
            
            {expandedEvent.description && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Description</div>
                <div className="bg-gray-50 rounded-md p-3 text-gray-700 text-sm">
                  {expandedEvent.description}
                </div>
              </div>
            )}
            
            {expandedEvent.status && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <div className="flex items-center">
                  {expandedEvent.status === 'completed' ? (
                    <Check size={16} className="text-green-500 mr-2" />
                  ) : (
                    <AlertTriangle size={16} className="text-yellow-500 mr-2" />
                  )}
                  <span className="capitalize">{expandedEvent.status}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Render expanded event modal */}
      {renderExpandedEventModal()}
      
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <div className="flex items-center">
          <h2 className="text-xl font-bold text-gray-900 mr-4 flex items-center">
            <Calendar size={20} className="mr-2 text-indigo-600" />
            Maintenance Schedule
          </h2>
          
          <div className="inline-flex rounded-md shadow-sm ml-3">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${
                calendarView === 'day'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 rounded-l-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
              onClick={() => setCalendarView('day')}
            >
              Day
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${
                calendarView === 'week'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-r border-b border-gray-300 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
              onClick={() => setCalendarView('week')}
            >
              Week
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${
                calendarView === 'month'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-r border-b border-gray-300 rounded-r-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
              onClick={() => setCalendarView('month')}
            >
              Month
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrevious}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button
            onClick={goToToday}
            className="py-1 px-3 rounded-md bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200 transition-colors duration-200"
          >
            Today
          </button>
          
          <button
            onClick={goToNext}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>
          
          <div className="text-lg font-semibold text-gray-700 hidden sm:inline">
            {calendarView === 'month'
              ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
              : calendarView === 'week'
              ? `${formatDate(getDaysInWeek()[0])} - ${formatDate(getDaysInWeek()[6])}`
              : formatDate(currentDate)
            }
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search jobs, locations, technicians..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="sm:w-48">
            <select
              value={filterTechnician}
              onChange={(e) => setFilterTechnician(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">All Technicians</option>
              {technicians.filter(tech => tech !== 'all').map((tech, index) => (
                <option key={index} value={tech}>{tech}</option>
              ))}
            </select>
          </div>
          
          <div className="sm:w-48">
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">All Locations</option>
              {locations.filter(loc => loc !== 'all').map((location, index) => (
                <option key={index} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Calendar View */}
      <div className="bg-white rounded-lg">
        {calendarView === 'day' && renderDayView()}
        {calendarView === 'week' && renderWeekView()}
        {calendarView === 'month' && renderMonthView()}
      </div>
      
      {/* Color Legend */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Urgency Legend</h3>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-gray-200 mr-1"></div>
            <span className="text-xs text-gray-600">Very Low</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-100 mr-1"></div>
            <span className="text-xs text-gray-600">Low</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-yellow-100 mr-1"></div>
            <span className="text-xs text-gray-600">Medium</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-orange-100 mr-1"></div>
            <span className="text-xs text-gray-600">High</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-red-100 mr-1"></div>
            <span className="text-xs text-gray-600">Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMaintenanceCalendar;