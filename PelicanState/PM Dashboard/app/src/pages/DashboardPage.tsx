import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  AlertCircle, 
  DollarSign, 
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { user } = useAuth();

  const metricsCards = [
    {
      title: 'Approval Requests',
      value: 3,
      trend: '+12%',
      trendUp: true,
      color: 'bg-amber-500',
      icon: AlertCircle,
      link: '/work-requests'
    },
    {
      title: 'Active Work Orders',
      value: 5,
      trend: '+26%',
      trendUp: true,
      color: 'bg-blue-500',
      icon: Clock,
      link: '/work-requests'
    },
    {
      title: 'Blocked Items',
      value: 1,
      trend: '-8%',
      trendUp: false,
      color: 'bg-red-500',
      icon: AlertCircle,
      link: '/work-requests'
    },
    {
      title: 'Invoices Pending',
      value: 2,
      trend: '+15%',
      trendUp: true,
      color: 'bg-green-500',
      icon: DollarSign,
      link: '/invoices'
    },
  ];

  const recentActivity = [
    { id: 1, title: 'HVAC Unit Replacement - Room 101', campus: 'Wallace', status: 'In Progress', date: '2 hours ago', type: 'work-request' },
    { id: 2, title: 'Roof Repair - Building C', campus: 'Woodland', status: 'Pending Approval', date: '5 hours ago', type: 'estimate' },
    { id: 3, title: 'Plumbing Work - Main Building', campus: 'Paris', status: 'Completed', date: '1 day ago', type: 'work-request' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-semibold text-[#1F2933]">
            Welcome back, {user?.email?.split('@')[0]}
          </h2>
          <p className="text-neutral-500 mt-1">
            Here's what's happening with your projects today
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsCards.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon = card.trendUp ? TrendingUp : TrendingDown;
          return (
            <Link
              key={index}
              to={card.link}
              className="bg-white p-6 border border-neutral-200 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 ${card.color} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendIcon className="w-4 h-4" />
                  {card.trend}
                </div>
              </div>
              <h3 className="text-sm font-medium text-neutral-500 mb-1">{card.title}</h3>
              <p className="text-3xl font-heading font-bold text-[#1F2933]">{card.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Activity & Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <div className="bg-white border border-neutral-200">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-heading font-semibold text-lg text-[#1F2933]">Recent Activity</h3>
              <Link to="/work-requests" className="text-sm text-[#143352] hover:underline flex items-center gap-1">
                View All <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-neutral-100 hover:border-neutral-200 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`w-2 h-2 mt-2 rounded-full ${
                        activity.status === 'In Progress' ? 'bg-blue-500' :
                        activity.status === 'Pending Approval' ? 'bg-amber-500' :
                        'bg-green-500'
                      }`} />
                      <div>
                        <h4 className="font-medium text-[#1F2933]">{activity.title}</h4>
                        <p className="text-sm text-neutral-500 mt-1">{activity.campus} Campus • {activity.date}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium ${
                      activity.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                      activity.status === 'Pending Approval' ? 'bg-amber-50 text-amber-700' :
                      'bg-green-50 text-green-700'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project Stats */}
          <div className="bg-white border border-neutral-200">
            <div className="p-6 border-b border-neutral-100">
              <h3 className="font-heading font-semibold text-lg text-[#1F2933]">Project Statistics</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full border-4 border-[#143352] flex items-center justify-center">
                    <span className="text-xl font-bold text-[#143352]">72%</span>
                  </div>
                  <p className="text-sm text-neutral-500">Completed</p>
                  <p className="text-xs text-neutral-400 mt-1">26 projects</p>
                </div>
                <div>
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full border-4 border-amber-500 flex items-center justify-center">
                    <span className="text-xl font-bold text-amber-600">35</span>
                  </div>
                  <p className="text-sm text-neutral-500">Delayed</p>
                  <p className="text-xs text-neutral-400 mt-1">Requires attention</p>
                </div>
                <div>
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full border-4 border-blue-500 flex items-center justify-center">
                    <span className="text-xl font-bold text-blue-600">8</span>
                  </div>
                  <p className="text-sm text-neutral-500">In Progress</p>
                  <p className="text-xs text-neutral-400 mt-1">Active work</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Quick Stats & Team */}
        <div className="space-y-6">
          {/* Budget Overview */}
          <div className="bg-white border border-neutral-200">
            <div className="p-6 border-b border-neutral-100">
              <h3 className="font-heading font-semibold text-lg text-[#1F2933]">Budget Overview</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-500">Total Budget</span>
                    <span className="font-semibold text-[#1F2933]">$1,000,000</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2">
                    <div className="bg-[#143352] h-2" style={{ width: '65%' }}></div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">$650,000 spent</p>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-500">Timeline</span>
                    <span className="font-semibold text-[#1F2933]">Oct 2023 - Jan 2026</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2">
                    <div className="bg-green-500 h-2" style={{ width: '40%' }}></div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">40% complete</p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white border border-neutral-200">
            <div className="p-6 border-b border-neutral-100">
              <h3 className="font-heading font-semibold text-lg text-[#1F2933]">Team Members</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { name: 'Walton Levine', role: 'Project Manager', campus: 'Wallace' },
                  { name: 'Merrill Conrad', role: 'Site Supervisor', campus: 'Woodland' },
                  { name: 'Stuart McMillan', role: 'Contractor', campus: 'Paris' },
                ].map((member, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#143352] rounded-full flex items-center justify-center text-white font-semibold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#1F2933] text-sm">{member.name}</p>
                      <p className="text-xs text-neutral-500">{member.role}</p>
                    </div>
                    <span className="text-xs text-[#143352] font-medium">{member.campus}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#143352] text-white p-6">
            <h3 className="font-heading font-semibold text-lg mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link 
                to="/work-requests/new" 
                className="block w-full text-left px-4 py-3 bg-white/10 hover:bg-white/20 transition-colors text-sm"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  New Work Request
                </span>
              </Link>
              <Link 
                to="/estimates" 
                className="block w-full text-left px-4 py-3 bg-white/10 hover:bg-white/20 transition-colors text-sm"
              >
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Create Estimate
                </span>
              </Link>
              <Link 
                to="/invoices" 
                className="block w-full text-left px-4 py-3 bg-white/10 hover:bg-white/20 transition-colors text-sm"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Generate Invoice
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
