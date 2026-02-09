import { useAuth } from '../context/AuthContext';
import { Clock, AlertCircle, DollarSign, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { user } = useAuth();

  const statusCards = [
    {
      title: 'Requests Needing Approval',
      count: 3,
      trend: '+12%',
      color: 'bg-amber-50',
      textColor: 'text-amber-700',
      icon: AlertCircle,
    },
    {
      title: 'Active Work',
      count: 5,
      trend: '+26%',
      color: 'bg-blue-50',
      textColor: 'text-blue-700',
      icon: Clock,
    },
    {
      title: 'Blocked Items',
      count: 1,
      trend: '-8%',
      color: 'bg-red-50',
      textColor: 'text-red-700',
      icon: AlertCircle,
    },
    {
      title: 'Invoices Pending',
      count: 2,
      trend: '+15%',
      color: 'bg-green-50',
      textColor: 'text-green-700',
      icon: DollarSign,
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-primary-900 mb-2">
          Welcome back, {user?.email?.split('@')[0]}
        </h1>
        <p className="text-neutral-600">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Primary CTA */}
      <div className="mb-8">
        <Link
          to="/work-requests/new"
          className="btn-primary inline-block py-3 px-6 text-lg font-medium"
        >
          + Create Work Request
        </Link>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 ${card.color} rounded`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
                <span className="text-sm font-medium text-green-600">{card.trend}</span>
              </div>
              <h3 className="text-sm font-medium text-neutral-600 mb-2">{card.title}</h3>
              <p className="text-3xl font-heading font-bold text-primary-900">{card.count}</p>
            </div>
          );
        })}
      </div>

       {/* Recent Activity */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-6">
           <div className="card p-6">
             <h2 className="text-lg font-heading font-semibold text-neutral-900 mb-4">
               Recent Work Requests
             </h2>
             <div className="space-y-3">
               <p className="text-neutral-600 py-8 text-center">
                 No work requests yet. <Link to="/work-requests/new" className="text-primary-500 font-medium hover:text-primary-600">Create one</Link>
               </p>
             </div>
           </div>

           <div className="card p-6">
             <h2 className="text-lg font-heading font-semibold text-neutral-900 mb-4 flex items-center gap-2">
               <FileText className="w-5 h-5 text-primary-600" />
               Recent Documents
             </h2>
             <div className="space-y-2">
               <p className="text-xs text-neutral-500 mb-3">Quick access to recently generated PDFs</p>
               <div className="text-center py-6 text-neutral-500 text-sm">
                 <p>No documents generated yet</p>
                 <p className="text-xs mt-1">Documents will appear here when you create estimates, invoices, or reports</p>
               </div>
             </div>
           </div>
         </div>

         <div className="card p-6">
           <h2 className="text-lg font-heading font-semibold text-neutral-900 mb-4">
             Quick Actions
           </h2>
           <div className="space-y-2">
             <Link to="/work-requests" className="block btn-secondary py-2 px-3 text-center text-sm">
               View All Requests
             </Link>
             <Link to="/invoices" className="block btn-secondary py-2 px-3 text-center text-sm">
               Manage Invoices
             </Link>
             <Link to="/schedules" className="block btn-secondary py-2 px-3 text-center text-sm">
               View Schedule
             </Link>
             <Link to="/estimates" className="block btn-secondary py-2 px-3 text-center text-sm">
               Create Estimate
             </Link>
             <Link to="/invoices/create" className="block btn-secondary py-2 px-3 text-center text-sm">
               Create Invoice
             </Link>
           </div>
         </div>
       </div>
    </div>
  );
}
