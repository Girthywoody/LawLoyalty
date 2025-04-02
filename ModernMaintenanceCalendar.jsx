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
  MoreHorizontal,
  Calendar as CalendarIcon,
  PlusCircle,
  Timer,
  ArrowRight,
  ArrowUpRight,
  Activity,
  BarChart2,
  ChevronDown
} from 'lucide-react';

const ModernMaintenanceCalendar = ({ maintenanceEvents = [], currentUser }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('week'); // 'day', 'week', 'month'
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTechnician, setFilterTechnician] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [showStats, setShowStats] = useState(false);
  
  // Initialize stats
  const [stats, setStats] = useState({
    totalEvents: 0,
    averageDuration: 0,
    locationBreakdown: {},
    technicianPerformance: {}
  });
  
  // Calculate stats whenever events change
  useEffect(() => {
    if (maintenanceEvents.length > 0) {
      calculateStats(maintenanceEvents);
    }
  }, [maintenanceEvents]);
  
  // Process events data for display
  useEffect(() => {
    setFilteredEvents(filterEvents(maintenanceEvents));
  }, [maintenanceEvents, searchTerm, filterTechnician, filterLocation]);
  
  // Calculate statistics from events
  const calculateStats = (events) => {
    // Total events
    const totalEvents = events.length;
    
    // Average duration in minutes
    let totalDuration = 0;
    const locationMap = {};
    const technicianMap = {};
    
    events.forEach(event => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      const durationMs = end - start;
      const durationMinutes = durationMs / (1000 * 60);
      
      totalDuration += durationMinutes;
      
      // Location breakdown
      if (event.location) {
        if (!locationMap[event.location]) {
          locationMap[event.location] = {
            count: 0,
            totalDuration: 0
          };
        }
        locationMap[event.location].count += 1;
        locationMap[event.location].totalDuration += durationMinutes;
      }
      
      // Technician performance
      if (event.technician) {
        if (!technicianMap[event.technician]) {
          technicianMap[event.technician] = {
            count: 0,
            totalDuration: 0,
            locations: new Set()
          };
        }
        technicianMap[event.technician].count += 1;
        technicianMap[event.technician].totalDuration += durationMinutes;
        if (event.location) {
          technicianMap[event.technician].locations.add(event.location);
        }
      }
    });
    
    // Calculate average duration
    const averageDuration = totalEvents > 0 ? totalDuration / totalEvents : 0;
    
    // Process technician data to include average
    Object.keys(technicianMap).forEach(tech => {
      technicianMap[tech].avgDuration = technicianMap[tech].totalDuration / technicianMap[tech].count;
      technicianMap[tech].locations = Array.from(technicianMap[tech].locations);
    });
    
    setStats({
      totalEvents,
      averageDuration,
      locationBreakdown: locationMap,
      technicianPerformance: technicianMap
    });
  };
  
  // Filter events based on search term and filters
  const filterEvents = (events) => {
    return events.filter(event => {
      // Filter by search term
      const searchMatch = !searchTerm || 
        (event.title && event.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.technician && event.technician.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by technician
      const technicianMatch = filterTechnician === 'all' || 
        event.technician === filterTechnician;
      
      // Filter by location
      const locationMatch = filterLocation === 'all' || 
        event.location === filterLocation;
      
      return searchMatch && technicianMatch && locationMatch;
    });
  };
  
  // Calculate unique technicians and locations for filters
  const technicians = ['all', ...new Set(maintenanceEvents.map(event => event.technician || 'Unassigned'))];
  const locations = ['all', ...new Set(maintenanceEvents.map(event => event.location || 'Unspecified'))];
  
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
  
  const renderEventCard = (event, index, position, isWeekView = false) => {
    const startTime = new Date(event.start);
    const endTime = new Date(event.end);
    const isHovered = hoveredEvent === event.id;
    
    // Solid color backgrounds based on urgency level
    const urgencyColors = {
      1: 'bg-gray-400 text-white shadow-gray-200', // Very Low
      2: 'bg-blue-500 text-white shadow-blue-200', // Low
      3: 'bg-yellow-500 text-white shadow-yellow-200', // Medium
      4: 'bg-orange-500 text-white shadow-orange-200', // High
      5: 'bg-red-500 text-white shadow-red-200', // Critical
    };
    
    const colorClass = urgencyColors[event.urgencyLevel || 3];
    
    return (
      <div 
        key={`${event.id}-${index}`}
        className={`absolute left-1 right-1 rounded-lg border overflow-hidden shadow-lg transition-all duration-200 ${
          isHovered ? 'transform scale-[1.02] z-30' : 'z-10'
        } ${colorClass}`}
        style={{ 
          top: `${position.top}%`, 
          height: `${position.height}%`,
          minHeight: '28px',
        }}
        onClick={() => setExpandedEvent(event)}
        onMouseEnter={() => setHoveredEvent(event.id)}
        onMouseLeave={() => setHoveredEvent(null)}
      >
        <div className="p-2 h-full flex flex-col">
          <div className="font-medium text-xs truncate">{event.title}</div>
          
          <div className={`text-xs mt-auto flex ${(position.height < 15 && !isHovered) ? 'hidden' : 'block'}`}>
            <div className="inline-flex items-center mr-2">
              <Clock size={10} className="mr-1 flex-shrink-0" />
              <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
            </div>
            
            <div className="inline-flex items-center">
              <span>{calculateDuration(startTime, endTime)}</span>
            </div>
          </div>
          
          {(position.height > 15 || isHovered) && (
            <div className="mt-1 flex items-center text-xs">
              <MapPin size={10} className="mr-1 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          
          {(position.height > 20 || isHovered) && (
            <div className="mt-1 flex items-center text-xs">
              <User size={10} className="mr-1 flex-shrink-0" />
              <span className="truncate">{event.technician}</span>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  
  // Render the day view
  const renderDayView = () => {
    const timeSlots = getTimeSlots();
    const eventsForDay = getEventsForDay(currentDate);
    
    return (
      <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[650px]">
        {/* Day header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="flex px-6 py-4 items-center justify-between">
            <h3 className={`text-lg font-semibold ${isToday(currentDate) ? 'text-indigo-600' : 'text-gray-800'}`}>
              {formatDate(currentDate)}
            </h3>
            {isToday(currentDate) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Today
              </span>
            )}
          </div>
        </div>
        
        {/* Time slots */}
        <div className="flex-grow overflow-y-auto">
          <div className="relative min-h-full">
            {timeSlots.map((slot, index) => (
              <div 
                key={index} 
                className={`flex h-12 border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
              >
                <div className="w-16 flex-shrink-0 py-1 px-2 text-xs text-gray-500 text-right border-r border-gray-200 sticky left-0 bg-inherit">
                  {formatTime(slot)}
                </div>
                <div className="flex-grow"></div>
              </div>
            ))}
            
            {/* Current time indicator */}
            {isToday(currentDate) && (() => {
              const now = new Date();
              const baseTime = new Date(now);
              baseTime.setHours(8, 0, 0, 0);
              
              const maxTime = new Date(now);
              maxTime.setHours(18, 0, 0, 0);
              
              // Only show if within our range
              if (now >= baseTime && now <= maxTime) {
                const totalMinutes = (maxTime - baseTime) / (1000 * 60); // 10 hours = 600 minutes
                const minutesPassed = (now - baseTime) / (1000 * 60);
                const topPosition = (minutesPassed / totalMinutes) * 100;
                
                return (
                  <div 
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: `${topPosition}%` }}
                  >
                    <div className="flex items-center">
                      <div className="w-16 flex-shrink-0 pr-1 text-right">
                        <div className="h-4 w-4 ml-auto rounded-full bg-red-500 border-2 border-white shadow-md"></div>
                      </div>
                      <div className="h-0.5 flex-grow bg-red-500"></div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Events */}
            <div className="absolute top-0 left-16 right-0 bottom-0">
              {eventsForDay.map((event, index) => {
                const position = getEventPosition(event);
                return renderEventCard(event, index, position);
              })}
            </div>
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
      <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[650px]">
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
              <div className={`text-lg mt-1 ${isToday(day) ? 'text-indigo-700 font-bold' : 'text-gray-700'}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
        
        {/* Time grid */}
        <div className="flex-grow overflow-auto">
          <div className="relative min-w-[800px]">
            {timeSlots.map((slot, slotIndex) => (
              <div 
                key={slotIndex} 
                className={`flex h-12 border-b border-gray-100 ${slotIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
              >
                <div className="w-16 flex-shrink-0 py-1 px-2 text-xs text-gray-500 text-right border-r border-gray-200 sticky left-0 bg-inherit">
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
                        const position = getEventPosition(event);
                        
                        // Only render at the first slot the event appears in
                        const slotTime = new Date(slot);
                        const eventStart = new Date(event.start);
                        if (slotIndex !== 0 && slotTime > eventStart) {
                          return null;
                        }
                        
                        return renderEventCard(event, eventIndex, position, true);
                      })}
                  </div>
                ))}
              </div>
            ))}
            
            {/* Current time indicator */}
            {isToday(new Date()) && (() => {
              const now = new Date();
              const baseTime = new Date(now);
              baseTime.setHours(8, 0, 0, 0);
              
              const maxTime = new Date(now);
              maxTime.setHours(18, 0, 0, 0);
              
              // Only show if within our range
              if (now >= baseTime && now <= maxTime) {
                const totalMinutes = (maxTime - baseTime) / (1000 * 60); // 10 hours = 600 minutes
                const minutesPassed = (now - baseTime) / (1000 * 60);
                const topPosition = (minutesPassed / totalMinutes) * 100;
                
                // Find the today column index
                const todayIndex = days.findIndex(day => isToday(day));
                const leftOffset = 16 + (todayIndex * (100 / 7)) + '%';
                const rightOffset = 100 - (todayIndex + 1) * (100 / 7) + '%';
                
                return (
                  <div 
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: `${topPosition}%` }}
                  >
                    <div className="flex items-center">
                      <div className="w-16 flex-shrink-0"></div>
                      <div 
                        className="h-0.5 bg-red-500 relative"
                        style={{ 
                          marginLeft: todayIndex > 0 ? `calc(${todayIndex} * 14.28%)` : '0px',
                          width: '14.28%'
                        }}
                      >
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-red-500 border-2 border-white shadow-md"></div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    );
  };
  
  // Render month view
  const renderMonthView = () => {
    const days = getDaysInMonth();
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Month header */}
        <div className="text-center py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
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
                className={`min-h-24 relative ${
                  isCurrentMonth 
                    ? isDayToday
                      ? 'bg-indigo-50'
                      : 'bg-white' 
                    : 'bg-gray-50'
                }`}
              >
                {/* Day number */}
                <div className={`text-right p-1 ${
                  !isCurrentMonth 
                    ? 'text-gray-400' 
                    : isDayToday 
                      ? 'text-indigo-700 font-bold' 
                      : 'text-gray-700'
                }`}>
                  {day.getDate()}
                </div>
                
                {/* Events for the day */}
                <div className="px-1 pb-1">
                  {dayEvents.length > 0 ? (
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event, eventIndex) => {
                        const urgencyColors = {
                          1: 'bg-gray-400 text-white', // Very Low
                          2: 'bg-blue-500 text-white', // Low
                          3: 'bg-yellow-500 text-white', // Medium
                          4: 'bg-orange-500 text-white', // High
                          5: 'bg-red-500 text-white', // Critical
                        };
                        
                        const colorClass = urgencyColors[event.urgencyLevel || 3];
                        
                        return (
                          <div 
                            key={`${event.id}-${eventIndex}`}
                            className={`rounded-md py-1 px-2 text-xs truncate cursor-pointer shadow-sm ${colorClass}`}
                            onClick={() => setExpandedEvent(event)}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="flex items-center text-xs">
                              <Clock size={8} className="mr-1 flex-shrink-0" />
                              <span className="truncate">{formatTime(new Date(event.start))}</span>
                            </div>
                          </div>
                        );
                      })}
                      
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-center text-indigo-600 bg-indigo-50 py-1 rounded-md font-medium">
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
  
  // Render Stats Dashboard
  const renderStatsDashboard = () => {
    // Find top locations by event count
    const topLocations = Object.entries(stats.locationBreakdown)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    // Find top technicians by efficiency (lowest avg duration)
    const topTechnicians = Object.entries(stats.technicianPerformance)
      .sort((a, b) => a[1].avgDuration - b[1].avgDuration)
      .slice(0, 5);
      
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="text-center py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <h3 className="text-lg font-semibold text-gray-800">
            Maintenance Analytics
          </h3>
        </div>
        
        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <div className="text-xs text-indigo-500 font-medium uppercase">Total Jobs</div>
              <div className="text-2xl font-bold text-indigo-700 mt-1">{stats.totalEvents}</div>
              <div className="text-xs text-indigo-600 mt-1">Across all locations</div>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="text-xs text-blue-500 font-medium uppercase">Average Duration</div>
              <div className="text-2xl font-bold text-blue-700 mt-1">
                {Math.floor(stats.averageDuration / 60)}h {Math.round(stats.averageDuration % 60)}m
              </div>
              <div className="text-xs text-blue-600 mt-1">Per maintenance job</div>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="text-xs text-purple-500 font-medium uppercase">Locations</div>
              <div className="text-2xl font-bold text-purple-700 mt-1">
                {Object.keys(stats.locationBreakdown).length}
              </div>
              <div className="text-xs text-purple-600 mt-1">With maintenance activity</div>
            </div>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Locations Chart */}
            <div className="border border-gray-200 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Top Locations by Activity</h4>
              <div className="space-y-3">
                {topLocations.map(([location, data], index) => (
                  <div key={index}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{location}</span>
                      <span className="text-gray-500">{data.count} jobs</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (data.count / (topLocations[0][1].count || 1)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Avg: {Math.floor(data.totalDuration / data.count / 60)}h {Math.round((data.totalDuration / data.count) % 60)}m per job
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Technician Performance */}
            <div className="border border-gray-200 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Technician Efficiency</h4>
              <div className="space-y-4">
                {topTechnicians.map(([technician, data], index) => (
                  <div key={index} className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-indigo-600" />
                    </div>
                    <div className="ml-3 flex-grow">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">{technician}</span>
                        <span className="text-xs text-gray-500">{data.count} jobs</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>
                          Avg: {Math.floor(data.avgDuration / 60)}h {Math.round(data.avgDuration % 60)}m
                        </span>
                        <span>
                          {data.locations.length} location{data.locations.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Expanded event details modal
  const renderExpandedEventModal = () => {
    if (!expandedEvent) return null;
    
    const urgencyLabels = {
      1: { text: 'Very Low', color: 'bg-gray-100 text-gray-800 border-gray-200', accent: 'bg-gray-500' },
      2: { text: 'Low', color: 'bg-blue-100 text-blue-800 border-blue-200', accent: 'bg-blue-500' },
      3: { text: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', accent: 'bg-yellow-500' },
      4: { text: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200', accent: 'bg-orange-500' },
      5: { text: 'Critical', color: 'bg-red-100 text-red-800 border-red-200', accent: 'bg-red-500' },
    };
    
    const urgency = urgencyLabels[expandedEvent.urgencyLevel || 3];
    const startTime = new Date(expandedEvent.start);
    const endTime = new Date(expandedEvent.end);
    const durationMinutes = (endTime - startTime) / (1000 * 60);
    const durationHours = durationMinutes / 60;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 relative">
            <button
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setExpandedEvent(null)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-gray-900 pr-8">{expandedEvent.title}</h3>
            <div className="flex items-center mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgency.color}`}>
                {urgency.text} Priority
              </span>
            </div>
          </div>
          
          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-6rem)]">
            {/* Time and duration card */}
            <div className="bg-indigo-50 rounded-lg p-4 mb-4 border border-indigo-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock size={18} className="text-indigo-500 mr-2" />
                  <div>
                    <div className="text-xs text-indigo-500 font-medium">Time</div>
                    <div className="text-sm font-semibold">
                      {formatTime(startTime)} - {formatTime(endTime)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Timer size={18} className="text-indigo-500 mr-2" />
                  <div>
                    <div className="text-xs text-indigo-500 font-medium">Duration</div>
                    <div className="text-sm font-semibold">
                      {durationHours.toFixed(1)} hours
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Location */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center">
                  <MapPin size={16} className="text-gray-500 mr-2" />
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Location</div>
                    <div className="text-sm font-medium">{expandedEvent.location || 'Not specified'}</div>
                  </div>
                </div>
              </div>
              
              {/* Technician */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center">
                  <User size={16} className="text-gray-500 mr-2" />
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Technician</div>
                    <div className="text-sm font-medium">{expandedEvent.technician || 'Unassigned'}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Description */}
            {expandedEvent.description && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 font-medium mb-1">Description</div>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-200">
                  {expandedEvent.description}
                </div>
              </div>
            )}
            
            {/* Status */}
            {expandedEvent.status && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 font-medium mb-1">Status</div>
                <div className="flex items-center">
                  {expandedEvent.status === 'completed' ? (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium border border-green-200 inline-flex items-center">
                      <Check size={12} className="mr-1" />
                      Completed
                    </div>
                  ) : (
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium border border-yellow-200 inline-flex items-center">
                      <AlertTriangle size={12} className="mr-1" />
                      In Progress
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <button
              type="button"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              onClick={() => setExpandedEvent(null)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Render expanded event modal */}
      {renderExpandedEventModal()}
      
      {/* Header Section - Modern Design */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-md">
              <Calendar size={20} className="text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">Maintenance Schedule</h2>
              <p className="text-sm text-gray-500">
                Track job durations and technician time at locations
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${
                showStats 
                  ? 'bg-indigo-600 text-white border-indigo-600' 
                  : 'bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-50'
              } transition-colors duration-200`}
            >
              <BarChart2 size={16} className="mr-1.5" />
              Analytics
            </button>
            
            <button
              onClick={goToToday}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors duration-200 border border-indigo-200"
            >
              Today
            </button>
          </div>
        </div>
        
        {/* View controls and date navigation */}
        <div className="px-6 py-3 bg-white border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-1 mb-3 sm:mb-0">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                type="button"
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  calendarView === 'day'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                } transition-all duration-200`}
                onClick={() => setCalendarView('day')}
              >
                Day
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  calendarView === 'week'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                } transition-all duration-200`}
                onClick={() => setCalendarView('week')}
              >
                Week
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  calendarView === 'month'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                } transition-all duration-200`}
                onClick={() => setCalendarView('month')}
              >
                Month
              </button>
            </div>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={goToPrevious}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="px-3 text-lg font-semibold text-gray-700">
              {calendarView === 'month'
                ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
                : calendarView === 'week'
                ? `${formatDate(getDaysInWeek()[0])} - ${formatDate(getDaysInWeek()[6])}`
                : formatDate(currentDate)
              }
            </div>
            
            <button
              onClick={goToNext}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        {/* Filters section - Enhanced */}
        <div className="px-6 py-3 bg-white border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search jobs, locations, technicians..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="sm:w-48 flex-shrink-0">
              <div className="relative">
                <select
                  value={filterTechnician}
                  onChange={(e) => setFilterTechnician(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="all">All Technicians</option>
                  {technicians.filter(tech => tech !== 'all').map((tech, index) => (
                    <option key={index} value={tech}>{tech}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDown size={16} className="text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="sm:w-48 flex-shrink-0">
              <div className="relative">
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="all">All Locations</option>
                  {locations.filter(loc => loc !== 'all').map((location, index) => (
                    <option key={index} value={location}>{location}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDown size={16} className="text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Analytics Dashboard or Calendar View */}
      {showStats ? (
        renderStatsDashboard()
      ) : (
        <>
          {/* Calendar View */}
          {calendarView === 'day' && renderDayView()}
          {calendarView === 'week' && renderWeekView()}
          {calendarView === 'month' && renderMonthView()}
          
          {/* Color Legend */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Priority Legend</h3>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center">
                <div className="w-8 h-5 rounded bg-gray-400 mr-2 shadow-sm"></div>
                <span className="text-xs text-gray-600">Very Low</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-5 rounded bg-blue-500 mr-2 shadow-sm"></div>
                <span className="text-xs text-gray-600">Low</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-5 rounded bg-yellow-500 mr-2 shadow-sm"></div>
                <span className="text-xs text-gray-600">Medium</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-5 rounded bg-orange-500 mr-2 shadow-sm"></div>
                <span className="text-xs text-gray-600">High</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-5 rounded bg-red-500 mr-2 shadow-sm"></div>
                <span className="text-xs text-gray-600">Critical</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ModernMaintenanceCalendar;