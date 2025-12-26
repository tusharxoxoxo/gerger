import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { getUserCompany } from "../lib/supabase/materialRequests";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertCircle } from "lucide-react";

interface CompanyAssignmentCheckProps {
  children: React.ReactNode;
}

export function CompanyAssignmentCheck({ children }: CompanyAssignmentCheckProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompany, setHasCompany] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUserId = session?.user?.id || null;
      setUserId(currentUserId);
      
      if (currentUserId) {
        checkCompanyAssignment(currentUserId);
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUserId = session?.user?.id || null;
      setUserId(currentUserId);
      
      if (currentUserId) {
        checkCompanyAssignment(currentUserId);
      } else {
        setIsLoading(false);
        setHasCompany(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkCompanyAssignment = async (currentUserId: string) => {
    try {
      setIsLoading(true);
      const userCompany = await getUserCompany(currentUserId);
      setHasCompany(!!userCompany?.company_id);
    } catch (error) {
      console.error("Error checking company assignment:", error);
      setHasCompany(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!hasCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="size-5 text-destructive" />
              <CardTitle>Company Assignment Required</CardTitle>
            </div>
            <CardDescription>
              Your account has been created successfully, but no company has been assigned to your account yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-none">
              <p className="text-sm text-muted-foreground">
                Please contact your administrator to assign you to a company. Once assigned, you'll be able to access the application.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

