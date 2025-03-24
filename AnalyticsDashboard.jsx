import React, { useState, useEffect } from 'react';
import { Calendar, BarChart2, ArrowRight, RefreshCw } from 'lucide-react';
import { getRestaurantVisitCounts, getRestaurantTrafficFlow } from './RestaurantAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AnalyticsDashboard = () => {
  const [visitCounts, setVisitCounts] = useState([]);
  const [trafficFlow, setTrafficFlow] = useState([]);
  const [dateRange, setDateRange] = useState('all'); // 'all', 'week', 'month', 'custom'
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, startDate, endDate]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Calculate date range
      let start = null;
      let end = null;
      
      if (dateRange === 'week') {
        start = new Date();
        start.setDate(start.getDate() - 7);
        end = new Date();
      } else if (dateRange === 'month') {
        start = new Date();
        start.setMonth(start.getMonth() - 1);
        end = new Date();
      } else if (dateRange === 'custom' && startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
        // Set end time to end of day
        end.setHours(23, 59, 59, 999);
      }
      
      // Get visit data
      const counts = await getRestaurantVisitCounts(start, end);
      const countsData = Object.entries(counts).map(([name, value]) => ({ name, value }));
      setVisitCounts(countsData);
      
      // Get traffic flow data
      const flow = await getRestaurantTrafficFlow(start, end);
      setTrafficFlow(flow);
    } catch (error) {
      console.error("Error loading analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
            <BarChart2 size={20} className="text-indigo-600 mr-2" />
            Restaurant Visit Analytics
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Track employee discount usage and traffic between restaurants
          </p>
        </div>
        <button 
          onClick={loadAnalyticsData}
          className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          disabled={isLoading}
        >
          <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      <div className="px-6 py-5">
        {/* Date range selector */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center">
            <Calendar size={16} className="text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1 text-sm rounded-md ${dateRange === 'all' 
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`px-3 py-1 text-sm rounded-md ${dateRange === 'week' 
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1 text-sm rounded-md ${dateRange === 'month' 
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateRange('custom')}
              className={`px-3 py-1 text-sm rounded-md ${dateRange === 'custom' 
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}`}
            >
              Custom
            </button>
          </div>
          
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <input
                type="date"
                className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                value={startDate || ''}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                value={endDate || ''}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <>
            {/* Visit counts chart */}
            <div className="mb-8">
              <h4 className="text-md font-medium text-gray-700 mb-3">Restaurant Visit Counts</h4>
              
              {visitCounts.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
                  No data available for the selected time period
                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-lg p-4" style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={visitCounts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} visits`, "Visits"]} />
                      <Bar dataKey="value" fill="#6366F1" name="Visits" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            
            {/* Traffic flow table */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Restaurant Traffic Flow</h4>
              
              {trafficFlow.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
                  No traffic flow data available for the selected time period
                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            From
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            To
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Count
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {trafficFlow.map((flow, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {flow.from}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                              <ArrowRight size={16} className="text-gray-400 mx-2" />
                              {flow.to}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                                {flow.count} visits
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;