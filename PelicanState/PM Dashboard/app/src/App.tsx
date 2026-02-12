import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkRequestIntakePage } from './pages/WorkRequestIntakePage';
import { WorkRequestListPage } from './pages/WorkRequestListPage';
import { WorkRequestDetailPage } from './pages/WorkRequestDetailPage';
import { EstimateNewPage } from './pages/EstimateNewPage';
import { InvoiceBuilderPage } from './pages/InvoiceBuilderPage';
import { InvoiceListPage } from './pages/InvoiceListPage';
import { SiteWalkthroughPage } from './pages/SiteWalkthroughPage';
import { HistoricDocumentationPage } from './pages/HistoricDocumentationPage';
import { ProjectOverviewPage } from './pages/ProjectOverviewPage';
import { ProjectTaskBoardPage } from './pages/ProjectTaskBoardPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ProjectClientViewPage } from './pages/ProjectClientViewPage';
import { LeadsPage } from './pages/LeadsPage';
import { ContactsPage } from './pages/ContactsPage';
import { EstimatesListPage } from './pages/EstimatesListPage';
import { MainLayout } from './layouts/MainLayout';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Projects */}
            <Route path="/projects" element={<ProjectOverviewPage />} />
            <Route path="/projects/board" element={<ProjectTaskBoardPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/client/projects/:projectId/:token" element={<ProjectClientViewPage />} />

            {/* Work Requests */}
            <Route path="/work-requests" element={<WorkRequestListPage />} />
            <Route path="/work-requests/new" element={<WorkRequestIntakePage />} />
            <Route path="/work-requests/:id" element={<WorkRequestDetailPage />} />
            
            {/* Estimates */}
            <Route path="/estimates" element={<EstimatesListPage />} />
            <Route path="/estimates/new/:id" element={<EstimateNewPage />} />
            
            {/* Invoices */}
            <Route path="/invoices" element={<InvoiceListPage />} />
            <Route path="/invoices/new" element={<InvoiceBuilderPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/walkthroughs" element={<SiteWalkthroughPage />} />
            <Route path="/historic-documentation" element={<HistoricDocumentationPage />} />
            <Route path="/schedules" element={<div className="p-8"><h1 className="text-3xl font-heading font-bold">Schedules (Coming Soon)</h1></div>} />
            <Route path="/analytics" element={<div className="p-8"><h1 className="text-3xl font-heading font-bold">Analytics (Coming Soon)</h1></div>} />
            <Route path="/members" element={<div className="p-8"><h1 className="text-3xl font-heading font-bold">Members (Coming Soon)</h1></div>} />
            <Route path="/settings" element={<div className="p-8"><h1 className="text-3xl font-heading font-bold">Settings (Coming Soon)</h1></div>} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
