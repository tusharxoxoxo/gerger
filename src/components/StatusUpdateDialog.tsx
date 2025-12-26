import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import type { MaterialRequestStatus } from "../types/database";

interface StatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: MaterialRequestStatus;
  newStatus: MaterialRequestStatus;
  materialName: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

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

export function StatusUpdateDialog({
  open,
  onOpenChange,
  currentStatus,
  newStatus,
  materialName,
  onConfirm,
  isLoading = false,
}: StatusUpdateDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update Request Status</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to update the status of this material request?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Material:</p>
            <p className="text-sm font-medium">{materialName}</p>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Current Status:</p>
              <Badge variant={statusColors[currentStatus]}>
                {statusLabels[currentStatus]}
              </Badge>
            </div>
            <div className="text-muted-foreground">→</div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">New Status:</p>
              <Badge variant={statusColors[newStatus]}>
                {statusLabels[newStatus]}
              </Badge>
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Updating..." : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

