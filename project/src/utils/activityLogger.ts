export interface ActivityDetails {
  [key: string]: string | number | boolean | string[];
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  time: string;
  timestamp: string;
  status: string;
  caseId: string;
  evidenceId?: string;
  location: string;
  officer: string;
  details: ActivityDetails;
}

export const addActivity = (
  type: string, 
  title: string, 
  caseId: string, 
  details: ActivityDetails = {}
): void => {
  const activity: Activity = {
    id: Date.now().toString(),
    type,
    title,
    time: new Date().toLocaleTimeString(),
    timestamp: new Date().toLocaleString(),
    status: 'completed',
    caseId,
    evidenceId: details.evidenceId as string || '',
    location: 'Current Location',
    officer: 'Officer Doe',
    details
  };
  
  // Store in localStorage for dashboard to pick up
  const existingActivities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
  existingActivities.unshift(activity);
  localStorage.setItem('recentActivities', JSON.stringify(existingActivities.slice(0, 10))); // Keep only last 10
  
  // Store in timeline events
  const existingTimeline = JSON.parse(localStorage.getItem('timelineEvents') || '[]');
  existingTimeline.unshift(activity);
  localStorage.setItem('timelineEvents', JSON.stringify(existingTimeline));
};