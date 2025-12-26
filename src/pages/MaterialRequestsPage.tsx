import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { MaterialRequestTable } from "../components/MaterialRequestTable";
import { MaterialRequestForm } from "../components/MaterialRequestForm";
import { useCompany } from "../contexts/CompanyContext";
import { useMaterialRequests } from "../hooks/useMaterialRequests";
import { exportToCSV, exportToExcel } from "../lib/export";
import type { MaterialRequestStatus } from "../types/database";
import { Plus, Download, FileSpreadsheet } from "lucide-react";
import { supabase } from "../supabaseClient";

interface MaterialRequestsPageProps {
  mode?: "create" | "edit" | "list";
}

export default function MaterialRequestsPage({ mode: propMode }: MaterialRequestsPageProps) {
  const navigate = useNavigate();
  const params = useParams();
  const { companyId, isLoading: isLoadingCompany } = useCompany();
  const [statusFilter, setStatusFilter] = useState<MaterialRequestStatus | "all">("all");
  const [signOutLoading, setSignOutLoading] = useState(false);

  // Determine mode from URL params or prop
  const mode = propMode || (params.id ? "edit" : "list");

  const { data: requests = [], isLoading, error } = useMaterialRequests(
    companyId,
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );

  const handleExportCSV = () => {
    exportToCSV(requests);
  };

  const handleExportExcel = () => {
    exportToExcel(requests);
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    await supabase.auth.signOut();
    setSignOutLoading(false);
  };

  if (isLoadingCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (mode === "create" || mode === "edit") {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <MaterialRequestForm
          requestId={mode === "edit" ? params.id : undefined}
          onSuccess={() => navigate("/material-requests")}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Material Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track material requests for your projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={signOutLoading}
          >
            {signOutLoading ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Select
              value={statusFilter}
              onValueChange={(value: MaterialRequestStatus | "all") =>
                setStatusFilter(value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={requests.length === 0}
            >
              <Download className="size-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={requests.length === 0}
            >
              <FileSpreadsheet className="size-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => navigate("/material-requests/new")}>
              <Plus className="size-4 mr-2" />
              New Request
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-none border border-destructive/20">
            <p className="text-sm font-medium">Error loading material requests</p>
            <p className="text-xs mt-1">
              {error instanceof Error ? error.message : "An unknown error occurred"}
            </p>
          </div>
        )}

        <MaterialRequestTable requests={requests} isLoading={isLoading} />
      </Card>
    </div>
  );
}

