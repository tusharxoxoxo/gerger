import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { StatusUpdateDialog } from "./StatusUpdateDialog";
import { useUpdateStatus } from "../hooks/useMaterialRequests";
import { useCompany } from "../contexts/CompanyContext";
import type { MaterialRequest, MaterialRequestStatus } from "../types/database";
import { Edit } from "lucide-react";

const statusLabels: Record<MaterialRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  fulfilled: "Fulfilled",
};

const statusColors: Record<MaterialRequestStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
  fulfilled: "secondary",
};

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const priorityColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline",
  medium: "default",
  high: "secondary",
  urgent: "destructive",
};

interface MaterialRequestTableProps {
  requests: MaterialRequest[];
  isLoading?: boolean;
}

export function MaterialRequestTable({
  requests,
  isLoading,
}: MaterialRequestTableProps) {
  const navigate = useNavigate();
  const { companyId } = useCompany();
  const updateStatusMutation = useUpdateStatus(companyId);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [newStatus, setNewStatus] = useState<MaterialRequestStatus | null>(null);

  const handleStatusChange = (request: MaterialRequest, newStatus: MaterialRequestStatus) => {
    setSelectedRequest(request);
    setNewStatus(newStatus);
    setStatusDialogOpen(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedRequest || !newStatus) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: selectedRequest.id,
        status: newStatus,
      });
      setStatusDialogOpen(false);
      setSelectedRequest(null);
      setNewStatus(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update status";
      alert(message);
    }
  };

  const getNextStatusOptions = (currentStatus: MaterialRequestStatus): MaterialRequestStatus[] => {
    switch (currentStatus) {
      case "pending":
        return ["approved", "rejected"];
      case "approved":
        return ["fulfilled"];
      case "rejected":
        return ["pending"]; // Allow re-opening rejected requests
      case "fulfilled":
        return []; // No further status changes
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No material requests found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => {
              const nextStatusOptions = getNextStatusOptions(request.status);
              return (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {request.material_name}
                  </TableCell>
                  <TableCell>
                    {request.quantity} {request.unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[request.status]}>
                      {statusLabels[request.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={priorityColors[request.priority]}>
                      {priorityLabels[request.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {request.requested_by}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(request.requested_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {nextStatusOptions.length > 0 && (
                        <Select
                          value=""
                          onValueChange={(value: MaterialRequestStatus) =>
                            handleStatusChange(request, value)
                          }
                        >
                          <SelectTrigger className="w-32 h-7">
                            <SelectValue placeholder="Update" />
                          </SelectTrigger>
                          <SelectContent>
                            {nextStatusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {statusLabels[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/material-requests/${request.id}/edit`)}
                      >
                        <Edit className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedRequest && newStatus && (
        <StatusUpdateDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          currentStatus={selectedRequest.status}
          newStatus={newStatus}
          materialName={selectedRequest.material_name}
          onConfirm={confirmStatusUpdate}
          isLoading={updateStatusMutation.isPending}
        />
      )}
    </>
  );
}

