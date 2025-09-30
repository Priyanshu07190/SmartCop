import React, { useState } from 'react';
import { Map, AlertTriangle, MapPin, Clock, CheckCircle, XCircle, Lightbulb } from 'lucide-react';

const PredictivePolicing: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState('downtown');

  const zones = [
    { id: 'downtown', name: 'Downtown District', risk: 'high' },
    { id: 'residential', name: 'Residential Area', risk: 'medium' },
    { id: 'commercial', name: 'Commercial Zone', risk: 'low' },
    { id: 'industrial', name: 'Industrial Park', risk: 'medium' }
  ];

  const problems = [
    {
      id: 'PROB-001',
      zone: 'Downtown District',
      problem: 'High Traffic Violations During Rush Hour',
      location: 'Main Street & 5th Avenue Intersection',
      severity: 'high',
      timeframe: '2:00 PM - 6:00 PM',
      description: 'Increased red light violations and illegal turns causing congestion and safety hazards',
      aiSolution: 'Deploy 2 additional traffic officers at intersection during peak hours. Install temporary traffic cones to guide flow. Consider adjusting traffic light timing.',
      factors: ['Rush hour traffic', 'School dismissal nearby', 'Construction detour'],
      status: 'pending'
    },
    {
      id: 'PROB-002',
      zone: 'Commercial Zone',
      problem: 'Shoplifting Incidents in Evening Hours',
      location: 'Shopping Plaza - Electronics & Clothing Stores',
      severity: 'low',
      timeframe: '6:00 PM - 10:00 PM',
      description: 'Pattern of theft incidents targeting high-value electronics and designer clothing',
      aiSolution: 'Increase foot patrol frequency in shopping areas. Coordinate with store security. Set up temporary surveillance checkpoint.',
      factors: ['Weekend evenings', 'Reduced store staff', 'Poor lighting in parking area'],
      status: 'in-progress'
    },
    {
      id: 'PROB-003',
      zone: 'Residential Area',
      problem: 'Noise Complaints from University District',
      location: 'Oak Avenue & University Campus Area',
      severity: 'medium',
      timeframe: '10:00 PM - 2:00 AM',
      description: 'Recurring noise complaints from parties and gatherings affecting residents',
      aiSolution: 'Schedule regular patrol checks. Establish community liaison program. Create noise ordinance awareness campaign for students.',
      factors: ['University area', 'Weekend nights', 'Off-campus housing'],
      status: 'resolved'
    },
    {
      id: 'PROB-004',
      zone: 'Industrial Park',
      problem: 'Vehicle Break-ins in Parking Areas',
      location: 'Industrial Complex Parking Lots',
      severity: 'medium',
      timeframe: '11:00 PM - 5:00 AM',
      description: 'Multiple reports of vehicle break-ins targeting work trucks and equipment',
      aiSolution: 'Install mobile surveillance units. Coordinate with security companies. Increase overnight patrol frequency.',
      factors: ['Isolated location', 'Valuable equipment in vehicles', 'Limited lighting'],
      status: 'pending'
    }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-300 bg-red-50';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50';
      case 'low':
        return 'border-green-300 bg-green-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'pending':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProblems = selectedZone === 'all' 
    ? problems 
    : problems.filter(problem => problem.zone.toLowerCase().includes(selectedZone));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Predictive Policing - Problem Analysis</h2>
            <p className="text-gray-600">AI-identified problems and suggested solutions</p>
            {selectedZone !== 'all' && (
              <div className="mt-2">
                <span className="text-sm text-gray-500">Current Zone: </span>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(zones.find(z => z.id === selectedZone)?.risk || 'low')}`}>
                  {zones.find(z => z.id === selectedZone)?.name} - {zones.find(z => z.id === selectedZone)?.risk.toUpperCase()} RISK
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Zones</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Problems and Solutions */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Identified Problems & AI Solutions
        </h3>
        
        {filteredProblems.map((problem) => (
          <div key={problem.id} className={`border-2 rounded-lg p-6 ${getSeverityColor(problem.severity)}`}>
            {/* Problem Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <AlertTriangle className={`h-5 w-5 ${
                    problem.severity === 'high' ? 'text-red-600' : 
                    problem.severity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                  <h4 className="text-lg font-semibold text-gray-900">{problem.problem}</h4>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{problem.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{problem.timeframe}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(problem.status)}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(problem.status)}`}>
                  {problem.status.replace('-', ' ')}
                </span>
              </div>
            </div>

            {/* Problem Description */}
            <div className="mb-4">
              <p className="text-gray-700">{problem.description}</p>
            </div>

            {/* Contributing Factors */}
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Contributing Factors:</h5>
              <div className="flex flex-wrap gap-2">
                {problem.factors.map((factor, index) => (
                  <span key={index} className="inline-block px-2 py-1 text-xs bg-white bg-opacity-70 text-gray-700 rounded-full border">
                    {factor}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Solution */}
            <div className="bg-white bg-opacity-70 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <h5 className="font-medium text-blue-900">AI Recommended Solution:</h5>
              </div>
              <p className="text-blue-800 text-sm leading-relaxed">{problem.aiSolution}</p>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex items-center space-x-3">
              {problem.status === 'pending' && (
                <>
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
                    Implement Solution
                  </button>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                    Assign Officers
                  </button>
                </>
              )}
              {problem.status === 'in-progress' && (
                <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm">
                  Update Progress
                </button>
              )}
              <button className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProblems.length === 0 && (
        <div className="text-center py-12">
          <Map className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No problems identified for selected zone</p>
          <p className="text-gray-400">AI monitoring continues in the background</p>
        </div>
      )}
    </div>
  );
};

export default PredictivePolicing;