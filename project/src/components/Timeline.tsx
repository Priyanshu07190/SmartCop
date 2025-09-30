import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Camera, Mic, FileText, User, Clock, Filter } from 'lucide-react';

const Timeline: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCase, setSelectedCase] = useState('all');
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  useEffect(() => {
    // Load timeline events from localStorage
    const loadTimelineEvents = () => {
      const events = JSON.parse(localStorage.getItem('timelineEvents') || '[]');
      setTimelineEvents(events);
    };

    loadTimelineEvents();
    
    // Poll for updates every 2 seconds
    const interval = setInterval(loadTimelineEvents, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const cases = [
    { id: 'all', name: 'All Cases' },
    { id: 'CASE-2024-001', name: 'Traffic Violation - License #ABC123' },
    { id: 'CASE-2024-002', name: 'Theft Report - Electronics Store' },
    { id: 'CASE-2024-003', name: 'Domestic Dispute - Residential' }
  ];


  const getEventIcon = (type: string) => {
    switch (type) {
      case 'evidence':
        return <Camera className="h-4 w-4 text-blue-600" />;
      case 'interview':
        return <Mic className="h-4 w-4 text-green-600" />;
      case 'fir':
        return <FileText className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'evidence':
        return 'bg-blue-100 border-blue-300';
      case 'interview':
        return 'bg-green-100 border-green-300';
      case 'fir':
        return 'bg-purple-100 border-purple-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const filteredEvents = selectedCase === 'all' 
    ? timelineEvents.filter(event => {
        const eventDate = new Date(event.timestamp || event.time).toISOString().split('T')[0];
        return eventDate === selectedDate;
      })
    : timelineEvents.filter(event => event.caseId === selectedCase);

  return (
    <div className="p-6 space-y-6">
      {/* Date and Case Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <h2 className="text-xl font-semibold text-gray-900">Timeline</h2>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {cases.map((case_) => (
                <option key={case_.id} value={case_.id}>
                  {case_.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Events */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Events for {new Date(selectedDate).toLocaleDateString()}
          </h3>
          <p className="text-sm text-gray-600">{filteredEvents.length} events found</p>
        </div>

        <div className="p-6">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No events found for selected date</p>
              <p className="text-gray-400">Try selecting a different date or case</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredEvents.map((event, index) => (
                <div key={event.id} className="relative">
                  {/* Timeline line */}
                  {index < filteredEvents.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                  )}
                  
                  <div className="flex items-start space-x-4">
                    {/* Time */}
                    <div className="flex-shrink-0 w-16 text-right">
                      <span className="text-sm font-medium text-gray-900">{event.time}</span>
                    </div>
                    
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getEventColor(event.type)}`}>
                      {getEventIcon(event.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <span className="text-xs text-gray-500">{event.caseId}</span>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">{event.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{event.officer}</span>
                          </div>
                        </div>
                        
                        {/* Event Details */}
                        <div className="mt-3 p-3 bg-white rounded border">
                          <h5 className="text-xs font-medium text-gray-700 mb-2">Details:</h5>
                          <div className="space-y-1 text-xs text-gray-600">
                            {Object.entries(event.details || {}).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Timeline;