import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMaterialRequests,
  getMaterialRequestById,
  createMaterialRequest,
  updateMaterialRequest,
  updateMaterialRequestStatus,
} from "../lib/supabase/materialRequests";
import type {
  MaterialRequest,
  MaterialRequestInsert,
  MaterialRequestUpdate,
  MaterialRequestFilters,
} from "../types/database";

const QUERY_KEYS = {
  materialRequests: (companyId: string, filters?: MaterialRequestFilters) =>
    ["materialRequests", companyId, filters] as const,
  materialRequest: (id: string) => ["materialRequest", id] as const,
};

export function useMaterialRequests(
  companyId: string | null,
  filters?: MaterialRequestFilters
) {
  return useQuery({
    queryKey: QUERY_KEYS.materialRequests(companyId || "", filters),
    queryFn: () => getMaterialRequests(companyId!, filters),
    enabled: !!companyId,
  });
}

export function useMaterialRequest(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.materialRequest(id || ""),
    queryFn: () => getMaterialRequestById(id!),
    enabled: !!id,
  });
}

export function useCreateMaterialRequest(companyId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: MaterialRequestInsert) =>
      createMaterialRequest(request),
    onSuccess: () => {
      // Invalidate and refetch material requests
      queryClient.invalidateQueries({
        queryKey: ["materialRequests", companyId],
      });
    },
  });
}

export function useUpdateMaterialRequest(companyId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: MaterialRequestUpdate;
    }) => updateMaterialRequest(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.materialRequest(id),
      });
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.materialRequests(companyId || ""),
      });

      // Snapshot previous values
      const previousRequest = queryClient.getQueryData<MaterialRequest>(
        QUERY_KEYS.materialRequest(id)
      );
      const previousRequests = queryClient.getQueryData<MaterialRequest[]>(
        QUERY_KEYS.materialRequests(companyId || "")
      );

      // Optimistically update
      if (previousRequest) {
        queryClient.setQueryData<MaterialRequest>(
          QUERY_KEYS.materialRequest(id),
          { ...previousRequest, ...updates }
        );
      }

      if (previousRequests) {
        queryClient.setQueryData<MaterialRequest[]>(
          QUERY_KEYS.materialRequests(companyId || ""),
          previousRequests.map((req) =>
            req.id === id ? { ...req, ...updates } : req
          )
        );
      }

      return { previousRequest, previousRequests };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousRequest) {
        queryClient.setQueryData(
          QUERY_KEYS.materialRequest(_variables.id),
          context.previousRequest
        );
      }
      if (context?.previousRequests) {
        queryClient.setQueryData(
          QUERY_KEYS.materialRequests(companyId || ""),
          context.previousRequests
        );
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.materialRequests(companyId || ""),
      });
    },
  });
}

export function useUpdateStatus(companyId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MaterialRequest["status"] }) =>
      updateMaterialRequestStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.materialRequest(id),
      });
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.materialRequests(companyId || ""),
      });

      // Snapshot previous values
      const previousRequest = queryClient.getQueryData<MaterialRequest>(
        QUERY_KEYS.materialRequest(id)
      );
      const previousRequests = queryClient.getQueryData<MaterialRequest[]>(
        QUERY_KEYS.materialRequests(companyId || "")
      );

      // Optimistically update
      if (previousRequest) {
        queryClient.setQueryData<MaterialRequest>(
          QUERY_KEYS.materialRequest(id),
          { ...previousRequest, status }
        );
      }

      if (previousRequests) {
        queryClient.setQueryData<MaterialRequest[]>(
          QUERY_KEYS.materialRequests(companyId || ""),
          previousRequests.map((req) =>
            req.id === id ? { ...req, status } : req
          )
        );
      }

      return { previousRequest, previousRequests };
    },
    onError: (_error, variables, context) => {
      // Rollback on error
      if (context?.previousRequest) {
        queryClient.setQueryData(
          QUERY_KEYS.materialRequest(variables.id),
          context.previousRequest
        );
      }
      if (context?.previousRequests) {
        queryClient.setQueryData(
          QUERY_KEYS.materialRequests(companyId || ""),
          context.previousRequests
        );
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.materialRequests(companyId || ""),
      });
    },
  });
}

