import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Calendar as CalendarIcon } from 'lucide-react';

const StyledMaintenanceCalendar = ({ maintenanceEvents = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventsForSelectedDate, setEventsForSelectedDate] = useState([]);
  
  // Generate month days
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    const days = [];
    
    // Add empty spaces for days before the 1st of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add actual days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };
  
  // Filter events for the selected date
  useEffect(() => {
    const filteredEvents = maintenanceEvents.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === selectedDate.getDate() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getFullYear() === selectedDate.getFullYear()
      );
    });
    
    // Sort by start time
    filteredEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    setEventsForSelectedDate(filteredEvents);
  }, [selectedDate, maintenanceEvents]);
  
  // Format time (8:00 AM)
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Format time range (e.g., "From 08:00 - 09:30 AM")
  const formatTimeRange = (start, end) => {
    const startTime = formatTime(new Date(start));
    const endTime = formatTime(new Date(end));
    return `From ${startTime} - ${endTime}`;
  };
  
  // Determine if a date is the currently selected date
  const isSelectedDate = (date) => {
    if (!date) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };
  
  // Determine if a date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  // Get current month name and year
  const getMonthName = () => {
    return currentDate.toLocaleString('default', { month: 'long' });
  };
  
  // Go to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };
  
  // Go to next month
  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };
  
  // Sample events to match the screenshot
  const sampleEvents = [
    {
      id: 1,
      title: "Marketing team meeting",
      start: new Date(selectedDate).setHours(8, 0),
      end: new Date(selectedDate).setHours(8, 40),
      color: "bg-orange-100 text-orange-800"
    },
    {
      id: 2,
      title: "Make plans to create new products",
      start: new Date(selectedDate).setHours(9, 0),
      end: new Date(selectedDate).setHours(9, 40),
      color: "bg-blue-100 text-blue-800"
    },
    {
      id: 3,
      title: "Coffee breaks and snacks",
      start: new Date(selectedDate).setHours(10, 0),
      end: new Date(selectedDate).setHours(10, 15),
      color: "bg-blue-100 text-blue-800"
    },
    {
      id: 4,
      title: "Company policy meeting with management team",
      start: new Date(selectedDate).setHours(11, 0),
      end: new Date(selectedDate).setHours(12, 15),
      color: "bg-pink-100 text-pink-800"
    },
    {
      id: 5,
      title: "Have lunch",
      start: new Date(selectedDate).setHours(12, 30),
      end: new Date(selectedDate).setHours(13, 30),
      color: "bg-orange-100 text-orange-800"
    }
  ];
  
  // Generate time slots from 8:00 to 18:00
  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });
  
  // Get event for a specific hour
  const getEventForTimeSlot = (timeSlot) => {
    const [hour] = timeSlot.split(':').map(Number);
    
    return sampleEvents.filter(event => {
      const eventStartHour = new Date(event.start).getHours();
      const eventEndHour = new Date(event.end).getHours();
      const eventEndMinutes = new Date(event.end).getMinutes();
      
      // If event ends exactly at XX:00, don't include it in that hour
      if (eventEndHour === hour && eventEndMinutes === 0) {
        return false;
      }
      
      // Check if the event overlaps with this hour
      return eventStartHour <= hour && (eventEndHour > hour || (eventEndHour === hour && eventEndMinutes > 0));
    });
  };
  
  // Calculate event position
  const calculateEventPosition = (event, timeSlot) => {
    const [hour] = timeSlot.split(':').map(Number);
    const startHour = new Date(event.start).getHours();
    const startMinutes = new Date(event.start).getMinutes();
    const endHour = new Date(event.end).getHours();
    const endMinutes = new Date(event.end).getMinutes();
    
    // Calculate top position (% within the hour)
    let topPosition = 0;
    if (startHour === hour) {
      topPosition = (startMinutes / 60) * 100;
    }
    
    // Calculate height
    let height;
    if (endHour === hour) {
      height = (endMinutes / 60) * 100;
    } else if (endHour > hour) {
      height = 100;
    } else {
      height = 0;
    }
    
    // Adjust height based on top position
    if (topPosition > 0) {
      height = height - topPosition;
    }
    
    return { topPosition, height };
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden max-w-md mx-auto">
      {/* Calendar Header */}
      <header className="p-4 flex items-center justify-between border-b">
        <button className="p-1 rounded-full text-gray-400">
          <ChevronLeft size={20} />
        </button>
        
        <h2 className="text-lg font-semibold text-indigo-600">{getMonthName()}</h2>
        
        <div className="flex space-x-2">
          <button className="p-1 rounded-full text-gray-400">
            <Search size={20} />
          </button>
          <button className="p-1 rounded-full text-gray-400">
            <div className="w-5 h-5 flex flex-col justify-center items-center">
              <div className="w-1 h-1 bg-gray-400 rounded-full mb-0.5"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full mb-0.5"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </button>
        </div>
      </header>
      
      {/* Calendar Days */}
      <div className="p-4 bg-white">
        <div className="grid grid-cols-7 gap-2 text-center mb-2">
          <div className="text-xs text-gray-400">Sun</div>
          <div className="text-xs text-gray-400">Mon</div>
          <div className="text-xs text-gray-400">Tue</div>
          <div className="text-xs text-gray-400">Wed</div>
          <div className="text-xs text-gray-400">Thu</div>
          <div className="text-xs text-gray-400">Fri</div>
          <div className="text-xs text-gray-400">Sat</div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center">
          {getDaysInMonth().map((day, index) => (
            <div key={index} className="h-9 flex items-center justify-center">
              {day && (
                <button
                  onClick={() => setSelectedDate(day)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full text-sm transition-colors ${
                    isSelectedDate(day) 
                      ? 'bg-indigo-600 text-white' 
                      : isToday(day)
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {day.getDate()}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Day Schedule */}
      <div className="px-4 pt-2 pb-4 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-gray-700">Today</h3>
          <button className="p-1 rounded-full bg-gray-100 text-gray-400">
            <CalendarIcon size={18} />
          </button>
        </div>
        
        <div className="space-y-4">
          {timeSlots.map((timeSlot, index) => {
            const events = getEventForTimeSlot(timeSlot);
            
            return (
              <div key={index} className="flex">
                <div className="w-12 flex-shrink-0 pt-1">
                  <div className="text-xs font-medium text-gray-500">{timeSlot}</div>
                </div>
                
                <div className="flex-grow relative ml-2 min-h-16">
                  {events.map((event, eventIndex) => {
                    const { topPosition, height } = calculateEventPosition(event, timeSlot);
                    const showEvent = height > 0;
                    
                    // Only render events that actually appear in this time slot
                    if (!showEvent) return null;
                    
                    // Only show time if this is the first hour of the event
                    const showTime = new Date(event.start).getHours() === parseInt(timeSlot);
                    
                    return (
                      <div
                        key={`${event.id}-${eventIndex}`}
                        className={`absolute w-full rounded-lg p-3 ${event.color}`}
                        style={{
                          top: `${topPosition}%`,
                          height: `${height}%`,
                          minHeight: '40px',
                          zIndex: 10
                        }}
                      >
                        <div className="text-sm font-medium">{event.title}</div>
                        {showTime && (
                          <div className="text-xs mt-1">
                            {formatTimeRange(event.start, event.end)}
                          </div>
                        )}
                        
                        {/* Current time indicator for the "Make plans" event, matching the screenshot */}
                        {event.id === 2 && (
                          <div className="absolute left-0 top-1/2 w-full pr-3">
                            <div className="relative">
                              <div className="absolute left-0 w-3 h-3 bg-indigo-600 rounded-full transform -translate-y-1/2"></div>
                              <div className="border-b border-indigo-600 ml-3"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StyledMaintenanceCalendar;