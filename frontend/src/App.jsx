import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import FactoryOSLanding from './FactoryOSLanding';
import LoginPage from './LoginPage';
import DOEPlatformHome from './DOEPlatformHome';
import ExperimentDashboard from './ExperimentDashboard';
import ExperimentWizard from './ExperimentWizard';
import DesignMatrixPage from './DesignMatrixPage';
import AnalysisResultsPage from './AnalysisResultsPage';
import ConfirmationRunPage from './ConfirmationRunPage';
import ResponseSurfacePage from './ResponseSurfacePage';
import ProcessControlPage from './ProcessControlPage';
import HelpCenter from './HelpCenter';
// Engineering Design Cycle
import DesignCycleHome from './DesignCycleHome';
import DesignCycleWizard from './DesignCycleWizard';
import DesignCycleNewProject from './DesignCycleNewProject';
import DesignReviewsPage from './components/design-cycle/DesignReviewsPage';
// Quality (8D)
import QualityDashboard from './components/quality/QualityDashboard';
import QualityCaseDetail from './components/quality/QualityCaseDetail';
// Timeline (Gantt)
import TimelinePage from './components/timeline/TimelinePage';
// SOPs (Alpha)
import { SOPListPage, SOPDetailPage } from './components/sops';
// Reporting
import ReportingDashboard from './components/reporting/ReportingDashboard';
import Baja2025DesignReport from './components/reporting/Baja2025DesignReport';
// Executive Dashboard (Corporate Only)
import ExecutiveDashboard from './components/executive/ExecutiveDashboard';
// Resources (Tool & Asset Inventory)
import { ResourcesHome } from './components/resources';
// Shared Experiment Access
import SharedExperimentPage from './pages/SharedExperimentPage';
import SharedWithMePage from './pages/SharedWithMePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<FactoryOSLanding />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Shared Experiment Access (requires login) */}
          <Route path="/share/experiment/:token" element={
            <ProtectedRoute>
              <SharedExperimentPage />
            </ProtectedRoute>
          } />
          <Route path="/shared-with-me" element={
            <ProtectedRoute>
              <SharedWithMePage />
            </ProtectedRoute>
          } />

          {/* Protected DOE Platform Routes */}
          <Route path="/doe" element={
            <ProtectedRoute>
              <DOEPlatformHome />
            </ProtectedRoute>
          } />
          <Route path="/doe/dashboard" element={
            <ProtectedRoute>
              <ExperimentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/doe/new" element={
            <ProtectedRoute>
              <ExperimentWizard />
            </ProtectedRoute>
          } />
          <Route path="/doe/experiment/:id" element={
            <ProtectedRoute>
              <DesignMatrixPage />
            </ProtectedRoute>
          } />
          <Route path="/doe/analysis/:id" element={
            <ProtectedRoute>
              <AnalysisResultsPage />
            </ProtectedRoute>
          } />
          <Route path="/doe/confirmation" element={
            <ProtectedRoute>
              <ConfirmationRunPage />
            </ProtectedRoute>
          } />
          <Route path="/doe/response-surface" element={
            <ProtectedRoute>
              <ResponseSurfacePage />
            </ProtectedRoute>
          } />
          <Route path="/doe/process-control" element={
            <ProtectedRoute>
              <ProcessControlPage />
            </ProtectedRoute>
          } />
          <Route path="/doe/help" element={
            <ProtectedRoute>
              <HelpCenter />
            </ProtectedRoute>
          } />

          {/* Protected Engineering Design Cycle Routes */}
          <Route path="/design" element={
            <ProtectedRoute>
              <DesignCycleHome />
            </ProtectedRoute>
          } />
          <Route path="/design/new" element={
            <ProtectedRoute>
              <DesignCycleNewProject />
            </ProtectedRoute>
          } />
          <Route path="/design/project/:id" element={
            <ProtectedRoute>
              <DesignCycleWizard />
            </ProtectedRoute>
          } />
          <Route path="/design/reviews" element={
            <ProtectedRoute>
              <DesignReviewsPage />
            </ProtectedRoute>
          } />

          {/* Protected Quality (8D) Routes */}
          <Route path="/quality" element={
            <ProtectedRoute>
              <QualityDashboard />
            </ProtectedRoute>
          } />
          <Route path="/quality/:id" element={
            <ProtectedRoute>
              <QualityCaseDetail />
            </ProtectedRoute>
          } />

          {/* Protected Timeline (Gantt) Routes */}
          <Route path="/timeline" element={
            <ProtectedRoute>
              <TimelinePage />
            </ProtectedRoute>
          } />

          {/* Protected SOPs (Alpha) Routes */}
          <Route path="/sops" element={
            <ProtectedRoute>
              <SOPListPage />
            </ProtectedRoute>
          } />
          <Route path="/sops/:id" element={
            <ProtectedRoute>
              <SOPDetailPage />
            </ProtectedRoute>
          } />

          {/* Protected Reporting Routes */}
          <Route path="/reporting" element={
            <ProtectedRoute>
              <ReportingDashboard />
            </ProtectedRoute>
          } />
          <Route path="/reporting/baja-2025-design-report" element={
            <ProtectedRoute>
              <Baja2025DesignReport />
            </ProtectedRoute>
          } />

          {/* Protected Executive Dashboard Routes (Corporate Only) */}
          <Route path="/executive" element={
            <ProtectedRoute>
              <ExecutiveDashboard />
            </ProtectedRoute>
          } />

          {/* Protected Resources (Tool & Asset Inventory) Routes */}
          <Route path="/resources" element={
            <ProtectedRoute>
              <ResourcesHome />
            </ProtectedRoute>
          } />

          {/* factoryos-only features — served as vanilla HTML by the backend */}
          {/* /projects — Project dashboard & node tree launcher */}
          {/* /app?project=ID — Node tree editor */}
          {/* /discovery?project=ID — Discovery workspace */}
          {/* /sops/workspace?project=ID — SOP editor (vanilla) */}
          {/* /onboarding — Initial setup wizard */}
          {/* /settings — User settings */}
          {/* /invest — Investor pitch page */}
          {/* /share/:token — Public project share viewer */}

          {/* Unknown routes: redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
