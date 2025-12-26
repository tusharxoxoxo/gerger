import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import MaterialRequestsPage from "./pages/MaterialRequestsPage";
import { CompanyProvider } from "./contexts/CompanyContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route
            path="/material-requests"
            element={
              <ProtectedRoute>
                <CompanyProvider>
                  <MaterialRequestsPage />
                </CompanyProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/material-requests/new"
            element={
              <ProtectedRoute>
                <CompanyProvider>
                  <MaterialRequestsPage mode="create" />
                </CompanyProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/material-requests/:id/edit"
            element={
              <ProtectedRoute>
                <CompanyProvider>
                  <MaterialRequestsPage mode="edit" />
                </CompanyProvider>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/material-requests" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;