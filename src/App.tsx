import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
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
import { PortalLandingPage } from './pages/PortalLandingPage';
import { PortalProjectsPage } from './pages/PortalProjectsPage';
import { PortalProjectDetailPage } from './pages/PortalProjectDetailPage';
import { WalkthroughSessionPage } from './pages/WalkthroughSessionPage';

function AppRoutes() {
  return (
    <Routes>
      {/* Test route - no protection */}
      <Route path="/test" element={<div style={{padding: '20px', fontFamily: 'sans-serif'}}><h1>✅ App is working!</h1><p>Auth context loaded successfully.</p></div>} />
      
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes - with fallback */}
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
        <Route path="/client-portal" element={<PortalLandingPage />} />
        <Route path="/client-portal/projects" element={<PortalProjectsPage />} />
        <Route path="/client-portal/projects/:projectId" element={<PortalProjectDetailPage />} />
        <Route path="/walkthroughs/new/:leadId" element={<WalkthroughSessionPage />} />

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
  );
}

function App() {
  // Signal when App has mounted and is ready
  useEffect(() => {
    console.log('[App Ready] Component mounted and rendering');
    const win = window as any;
    if (typeof win.__onAppReady__ === 'function') {
      win.__onAppReady__();
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
