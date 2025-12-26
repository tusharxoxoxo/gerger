import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabaseClient";
import { getUserCompany } from "../lib/supabase/materialRequests";

interface CompanyContextType {
  companyId: string | null;
  companyName: string | null;
  role: "admin" | "member" | null;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType>({
  companyId: null,
  companyName: null,
  role: null,
  isLoading: true,
});

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: userCompany, isLoading } = useQuery({
    queryKey: ["userCompany", userId],
    queryFn: () => getUserCompany(userId!),
    enabled: !!userId,
  });

  const value: CompanyContextType = {
    companyId: userCompany?.company_id || null,
    companyName: (userCompany?.company as { name?: string } | undefined)?.name || null,
    role: userCompany?.role || null,
    isLoading,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within CompanyProvider");
  }
  return context;
}

