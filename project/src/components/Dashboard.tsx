import React, { useState } from 'react';
import { useEffect } from 'react';
import { FileText, Camera, Clock, Users, Eye, MapPin, User, Calendar } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: string) => void;
  user?: any;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, user }) => {
  const [activeTab, setActiveTab] = useState('cases');
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    // Load recent activities from localStorage
    const loadRecentActivities = () => {
      const activities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
      setRecentActivity(activities);
    };

    loadRecentActivities();
    
    // Poll for updates every 2 seconds
    const interval = setInterval(loadRecentActivities, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const activeCases = [
    {
      id: 'CASE-2024-001',
      title: 'Traffic Violation - License #ABC123',
      status: 'active',
      evidenceCount: 5,
      witnessCount: 2,
      officersAssigned: ['Officer Smith', 'Officer Johnson'],
      location: 'Main Street Junction',
      date: '2024-01-15',
      priority: 'medium'
    },
    {
      id: 'CASE-2024-002',
      title: 'Theft Report - Electronics Store',
      status: 'active',
      evidenceCount: 8,
      witnessCount: 4,
      officersAssigned: ['Officer Davis', 'Officer Wilson', 'Officer Brown'],
      location: 'Electronics Plaza',
      date: '2024-01-14',
      priority: 'high'
    },
    {
      id: 'CASE-2024-003',
      title: 'Domestic Dispute - Residential',
      status: 'active',
      evidenceCount: 3,
      witnessCount: 1,
      officersAssigned: ['Officer Taylor'],
      location: 'Oak Avenue 123',
      date: '2024-01-16',
      priority: 'high'
    }
  ];

  const caseDetails = {
    'CASE-2024-001': {
      evidence: [
        { id: 'CASE-2024-001-E001', type: 'Photo', description: 'Vehicle damage photo', timestamp: '2024-01-15 14:30' },
        { id: 'CASE-2024-001-E002', type: 'Video', description: 'Traffic camera footage', timestamp: '2024-01-15 14:25' },
        { id: 'CASE-2024-001-E003', type: 'Document', description: 'Driver license copy', timestamp: '2024-01-15 14:35' }
      ],
      witnesses: [
        { name: 'John Doe', contact: '+1-555-0123', statement: 'Witnessed the collision', interviewed: true },
        { name: 'Jane Smith', contact: '+1-555-0124', statement: 'Saw the traffic light sequence', interviewed: false }
      ]
    },
    'CASE-2024-002': {
      evidence: [
        { id: 'CASE-2024-002-E001', type: 'Photo', description: 'Store security footage', timestamp: '2024-01-14 18:20' },
        { id: 'CASE-2024-002-E002', type: 'Photo', description: 'Broken window evidence', timestamp: '2024-01-14 18:45' },
        { id: 'CASE-2024-002-E003', type: 'Document', description: 'Inventory list', timestamp: '2024-01-14 19:00' }
      ],
      witnesses: [
        { name: 'Store Manager', contact: '+1-555-0125', statement: 'First to discover theft', interviewed: true },
        { name: 'Security Guard', contact: '+1-555-0126', statement: 'Saw suspicious activity', interviewed: true },
        { name: 'Customer', contact: '+1-555-0127', statement: 'Heard breaking glass', interviewed: false }
      ]
    }
  };

  const pendingReviews = [
    {
      id: 'REV-001',
      type: 'Evidence Review',
      case: 'CASE-2024-001',
      description: 'Traffic camera footage analysis pending',
      priority: 'high',
      dueDate: '2024-01-17'
    },
    {
      id: 'REV-002',
      type: 'Witness Statement',
      case: 'CASE-2024-002',
      description: 'Customer interview not completed',
      priority: 'medium',
      dueDate: '2024-01-18'
    }
  ];


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleActivityClick = (activity: any) => {
    // Navigate to timeline with specific case
    onNavigate('timeline');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-navy-600 to-navy-800 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Good Morning, {user?.rank} {user?.full_name || 'Officer'}</h2>
        <p className="text-navy-200">Today's priority: 3 active cases, 2 pending reviews</p>
      </div>

      {/* Main Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('cases')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cases'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Active Cases ({activeCases.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending Reviews ({pendingReviews.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'cases' && (
            <div>
              {!selectedCase ? (
                <div className="grid grid-cols-1 gap-4">
                  {activeCases.map((case_) => (
                    <div
                      key={case_.id}
                      onClick={() => setSelectedCase(case_.id)}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">{case_.title}</h3>
                            <p className="text-sm text-gray-600">{case_.id}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(case_.priority)}`}>
                          {case_.priority}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Camera className="h-4 w-4 text-gray-400" />
                          <span>{case_.evidenceCount} Evidence</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{case_.witnessCount} Witnesses</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{case_.officersAssigned.length} Officers</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{case_.location}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-gray-500">
                        Officers: {case_.officersAssigned.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Case Details: {selectedCase}</h3>
                    <button
                      onClick={() => setSelectedCase(null)}
                      className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                    >
                      ← Back to Cases
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Evidence */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Camera className="h-4 w-4 mr-2" />
                        Evidence Items
                      </h4>
                      <div className="space-y-3">
                        {caseDetails[selectedCase as keyof typeof caseDetails]?.evidence.map((item) => (
                          <div key={item.id} className="bg-white p-3 rounded border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{item.id}</span>
                              <span className="text-xs text-gray-500">{item.type}</span>
                            </div>
                            <p className="text-sm text-gray-700">{item.description}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.timestamp}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Witnesses */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Witnesses
                      </h4>
                      <div className="space-y-3">
                        {caseDetails[selectedCase as keyof typeof caseDetails]?.witnesses.map((witness, index) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{witness.name}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                witness.interviewed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {witness.interviewed ? 'Interviewed' : 'Pending'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{witness.statement}</p>
                            <p className="text-xs text-gray-500 mt-1">{witness.contact}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {pendingReviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{review.type}</h3>
                        <p className="text-sm text-gray-600">Case: {review.case}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(review.priority)}`}>
                      {review.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{review.description}</p>
                  <p className="text-xs text-gray-500">Due: {review.dueDate}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              onClick={() => handleActivityClick(activity)}
              className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {activity.type}
                    </span>
                    <span className="text-sm text-gray-500">{activity.time}</span>
                  </div>
                </div>
              </div>
              <p className="font-medium text-gray-900 mt-1">{activity.title}</p>
              <p className="text-sm text-gray-600">Case: {activity.caseId}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;