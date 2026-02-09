import { useState } from 'react';
import { Clock, Share2, MoreVertical, ChevronDown, Plus, Filter } from 'lucide-react';

interface TimelineData {
  startDate: string;
  today: string;
  endDate: string;
  percentComplete: number;
}

export function DashboardPage() {
  const [completedFilter, setCompletedFilter] = useState(true);

  // Mock data
  const timelineData: TimelineData = {
    startDate: '23/09/2024',
    today: '12/10/2024',
    endDate: '18/12/2024',
    percentComplete: 60,
  };



  const analyticsMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const projectHistory = [
    { name: 'Walton Levine', role: 'UIUX Designer', client: 'Client', location: 'Seattle, Washington', project: 'Studio' },
    { name: 'Merrill Conrad', role: 'Project Manager', client: 'Client', location: 'Austin, Texas', project: 'Kitchen' },
    { name: 'Stuart Mcmillan', role: 'Marketing Director', client: 'Client', location: 'Miami, Florida', project: 'Bedroom' },
    { name: 'Darron Burch', role: 'Operations Coordinator', client: 'Client', location: 'Atlanta, Georgia', project: 'Living Room' },
    { name: 'Joy Larson', role: 'Financial Analyst', client: 'Client', location: 'Chicago, Illinois', project: 'Apartment' },
    { name: 'Leila King', role: 'Account Manager', client: 'Client', location: 'Phoenix, Arizona', project: 'Studio' },
  ];

  const assignments = [
    { name: 'Build whole new floor in building', status: 'Completed', deadline: '25 Nov' },
    { name: 'Water for Apartment 2', status: 'In Progress', deadline: '25 Nov' },
    { name: 'Create new project for Floor 2. Apartment 3', status: 'In Progress', deadline: '25 Nov' },
    { name: 'Construction inspection for Building C', status: 'In Progress', deadline: '25 Nov' },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-heading font-bold text-neutral-900">Project Design Studio</h2>
            <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-neutral-600 mt-1">Manage any type of construction project. Assign owners, set timeline and keep track…</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors">
            <Share2 className="w-4 h-4" />
            Shared
          </button>
          <button className="p-1.5 text-neutral-600 hover:bg-neutral-100 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 text-sm font-medium transition-colors">
            New Project
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-900 px-4 py-2.5 text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Add Widget
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Person
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors">
            <Filter className="w-4 h-4" />
            Project Filter
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Time Estimate Graph - Large Left */}
        <div className="col-span-2 bg-white border border-neutral-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-neutral-900">Time Estimate Graph</h3>
            <button className="p-1.5 text-neutral-600 hover:bg-neutral-100 transition-colors">
              <Clock className="w-5 h-5" />
            </button>
          </div>
          
          {/* Timeline Bar */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-10 bg-orange-500 flex items-center justify-center text-white font-semibold text-sm rounded">
                60% Completed
              </div>
              <div className="flex-1 h-10 bg-gradient-to-r from-orange-200 to-orange-100" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.3) 10px, rgba(255,255,255,.3) 20px)'
              }}></div>
            </div>
            
            {/* Date Labels */}
            <div className="flex justify-between text-xs font-medium text-neutral-600 mb-2">
              <span>Start Date</span>
              <span className="absolute left-1/2 -translate-x-1/2 text-center">
                <div>Today</div>
                <div className="text-neutral-500">12/10/2024</div>
              </span>
              <span>End Due</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-neutral-900">
              <span>{timelineData.startDate}</span>
              <span>{timelineData.endDate}</span>
            </div>
          </div>
        </div>

        {/* KPI Cards - Right Column */}
        <div className="space-y-6">
          {/* Active Sales */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="inline-block px-2 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded">
                  +12%
                </div>
              </div>
              <button className="p-1 text-neutral-400 hover:text-neutral-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
            <h3 className="text-sm text-neutral-600 mb-2">Active Sales</h3>
            <p className="text-3xl font-bold text-neutral-900 mb-1">$32,086</p>
            <p className="text-xs text-neutral-500 mb-4">vs last month</p>
            {/* Mini Bar Chart */}
            <div className="flex items-end gap-1 h-12">
              <div className="flex-1 bg-orange-500 rounded" style={{ height: '60%' }}></div>
              <div className="flex-1 bg-orange-400 rounded" style={{ height: '40%' }}></div>
              <div className="flex-1 bg-orange-300 rounded" style={{ height: '80%' }}></div>
              <div className="flex-1 bg-orange-500 rounded" style={{ height: '50%' }}></div>
            </div>
          </div>

          {/* Product Revenue */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="inline-block px-2 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded">
                  +26%
                </div>
              </div>
              <button className="p-1 text-neutral-400 hover:text-neutral-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
            <h3 className="text-sm text-neutral-600 mb-2">Product Revenue</h3>
            <p className="text-3xl font-bold text-neutral-900 mb-1">$18,327</p>
            <p className="text-xs text-neutral-500 mb-4">vs last month</p>
            {/* Donut Chart */}
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-8 border-orange-500 flex items-center justify-center relative"
                style={{
                  background: `conic-gradient(#F97316 0% 26%, #FED7AA 26% 100%)`,
                  borderColor: 'transparent'
                }}>
                <div className="absolute w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-500">26%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Analytics History - Wide Left */}
        <div className="col-span-2 bg-white border border-neutral-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-neutral-900">Analytics History</h3>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors rounded-full">
                This year
                <ChevronDown className="w-3 h-3 inline ml-1" />
              </button>
              <button className="p-1.5 text-neutral-600 hover:bg-neutral-100 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button className="p-1.5 text-neutral-600 hover:bg-neutral-100 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dot Chart */}
          <div className="h-56 flex flex-col justify-between">
            <div className="flex justify-between text-xs text-neutral-600 px-2">
              <span>60K</span>
              <span>50K</span>
              <span>40K</span>
              <span>30K</span>
              <span>20K</span>
              <span>10K</span>
              <span>0K</span>
            </div>
            
            {/* Chart Area */}
            <div className="flex-1 flex items-end justify-between px-2 gap-1 mb-4">
              {[30, 40, 55, 60, 50, 45, 52, 58, 62, 55, 50, 48].map((height, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-1">
                  {/* Back dots (faded) */}
                  {Array(8).fill(0).map((_, i) => (
                    <div key={`back-${i}`} className="w-2 h-2 rounded-full bg-orange-100"></div>
                  ))}
                  {/* Front dots */}
                  {Array(Math.floor(height / 10)).fill(0).map((_, i) => (
                    <div key={`front-${i}`} className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                  ))}
                </div>
              ))}
            </div>

            {/* X Axis Labels */}
            <div className="flex justify-between text-xs text-neutral-600 px-2">
              {analyticsMonths.map((month) => (
                <span key={month}>{month}</span>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
              <span>Completed 85%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-100"></div>
              <span>In Progress 15%</span>
            </div>
          </div>
        </div>

        {/* Project History - Right Tall */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-neutral-900">Project History</h3>
          </div>

          {/* Toggle Pills */}
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setCompletedFilter(true)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                completedFilter 
                  ? 'bg-neutral-900 text-white' 
                  : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
              }`}
            >
              Completed
            </button>
            <button 
              onClick={() => setCompletedFilter(false)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                !completedFilter 
                  ? 'bg-neutral-900 text-white' 
                  : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
              }`}
            >
              Pending
            </button>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-neutral-500 mb-2 px-2">
            <span className="text-orange-600">Client</span>
            <span className="text-orange-600">Location</span>
            <span className="text-orange-600">Project</span>
          </div>

          {/* Project List */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {projectHistory.map((project, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2 px-2 py-2 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-neutral-400 rounded-full flex-shrink-0"></div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-neutral-900 truncate">{project.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{project.role}</p>
                  </div>
                </div>
                <p className="text-xs text-neutral-600 truncate">{project.location}</p>
                <p className="text-xs text-neutral-600 truncate">{project.project}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* My Assignments Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-neutral-900">My Assignments</h3>
          <button className="p-1.5 text-neutral-600 hover:bg-neutral-100 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600">
                  Assignments Name
                  <svg className="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m0 0l4 4" />
                  </svg>
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600">
                  Working Status
                  <svg className="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m0 0l4 4" />
                  </svg>
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600">
                  Time Deadline
                  <svg className="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m0 0l4 4" />
                  </svg>
                </th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment, idx) => (
                <tr key={idx} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-neutral-900">{assignment.name}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                      {assignment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-600">{assignment.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
