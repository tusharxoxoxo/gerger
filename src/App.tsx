import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import MaterialRequestsPage from "./pages/MaterialRequestsPage";
import { CompanyProvider } from "./contexts/CompanyContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CompanyAssignmentCheck } from "./components/CompanyAssignmentCheck";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we're returning from a magic link (URL hash contains auth tokens)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hasAuthParams = hashParams.has('access_token') || hashParams.has('type');

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      setLoading(false);

      // If we have auth params in URL but no session, wait a bit for Supabase to process
      if (hasAuthParams && !session) {
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            setSession(session);
            setLoading(false);
          });
        }, 100);
      }
    });

    // Listen for auth state changes (including when user returns from magic link)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      setLoading(false);

      // Clear URL hash after successful authentication
      if (event === 'SIGNED_IN' && session && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <CompanyAssignmentCheck>
      {children}
    </CompanyAssignmentCheck>
  );
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