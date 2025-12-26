import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { useCompany } from "../contexts/CompanyContext";
import { useCreateMaterialRequest, useUpdateMaterialRequest, useMaterialRequest } from "../hooks/useMaterialRequests";
import { getProjects } from "../lib/supabase/materialRequests";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabaseClient";
import { getMaterialSuggestions, suggestPriority } from "../lib/ai/materialSuggestions";
import type { MaterialRequest, MaterialRequestPriority } from "../types/database";
import { Sparkles } from "lucide-react";

const materialRequestSchema = z.object({
  material_name: z.string().min(1, "Material name is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  project_id: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

type MaterialRequestFormData = z.infer<typeof materialRequestSchema>;

interface MaterialRequestFormProps {
  requestId?: string;
  onSuccess?: () => void;
}

export function MaterialRequestForm({ requestId, onSuccess }: MaterialRequestFormProps) {
  const navigate = useNavigate();
  const { companyId } = useCompany();
  const [materialSuggestions, setMaterialSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiPrioritySuggestion, setAiPrioritySuggestion] = useState<{
    priority: MaterialRequestPriority;
    reasoning: string;
  } | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const { data: request, isLoading: isLoadingRequest } = useMaterialRequest(requestId || null);
  const { data: projects } = useQuery({
    queryKey: ["projects", companyId],
    queryFn: () => getProjects(companyId!),
    enabled: !!companyId,
  });

  const createMutation = useCreateMaterialRequest(companyId);
  const updateMutation = useUpdateMaterialRequest(companyId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<MaterialRequestFormData>({
    resolver: zodResolver(materialRequestSchema),
    defaultValues: {
      priority: "medium",
      project_id: null,
      notes: null,
    },
  });

  const materialName = watch("material_name");
  const quantity = watch("quantity");
  const unit = watch("unit");
  const projectId = watch("project_id");

  // Load existing request data for edit mode
  useEffect(() => {
    if (request) {
      reset({
        material_name: request.material_name,
        quantity: request.quantity,
        unit: request.unit,
        priority: request.priority,
        project_id: request.project_id || null,
        notes: request.notes || null,
      });
    }
  }, [request, reset]);

  // Fetch material suggestions as user types
  useEffect(() => {
    if (materialName && materialName.length >= 2) {
      setIsLoadingSuggestions(true);
      getMaterialSuggestions(materialName).then((suggestions) => {
        setMaterialSuggestions(suggestions.map((s) => s.name));
        setShowSuggestions(true);
        setIsLoadingSuggestions(false);
      });
    } else {
      setMaterialSuggestions([]);
      setShowSuggestions(false);
    }
  }, [materialName]);

  // Get AI priority suggestion when material, quantity, or unit changes
  useEffect(() => {
    if (materialName && quantity && unit) {
      suggestPriority(materialName, quantity, unit, projectId || undefined).then(
        (suggestion) => {
          setAiPrioritySuggestion({
            priority: suggestion.priority,
            reasoning: suggestion.reasoning,
          });
        }
      );
    }
  }, [materialName, quantity, unit, projectId]);

  const onSubmit = async (data: MaterialRequestFormData) => {
    if (!companyId) {
      alert("Company ID is required");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("User not authenticated");
      return;
    }

    try {
      if (requestId) {
        // Update existing request
        await updateMutation.mutateAsync({
          id: requestId,
          updates: data,
        });
      } else {
        // Create new request
        await createMutation.mutateAsync({
          ...data,
          requested_by: user.id,
          company_id: companyId,
        });
      }

      onSuccess?.();
      if (!onSuccess) {
        navigate("/material-requests");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save material request";
      alert(message);
    }
  };

  if (isLoadingRequest) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="material_name">Material Name *</Label>
          <div className="relative">
            <Input
              id="material_name"
              {...register("material_name")}
              placeholder="e.g., Cement, Steel Rebar"
              className={errors.material_name ? "border-destructive" : ""}
            />
            {showSuggestions && materialSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-none shadow-lg max-h-48 overflow-y-auto">
                {materialSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted cursor-pointer"
                    onClick={() => {
                      setValue("material_name", suggestion);
                      setShowSuggestions(false);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.material_name && (
            <p className="text-xs text-destructive mt-1">
              {errors.material_name.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              {...register("quantity", { valueAsNumber: true })}
              className={errors.quantity ? "border-destructive" : ""}
            />
            {errors.quantity && (
              <p className="text-xs text-destructive mt-1">
                {errors.quantity.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="unit">Unit *</Label>
            <Select
              value={watch("unit") || ""}
              onValueChange={(value) => setValue("unit", value)}
            >
              <SelectTrigger id="unit" className={errors.unit ? "border-destructive" : ""}>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="m">m</SelectItem>
                <SelectItem value="pieces">pieces</SelectItem>
                <SelectItem value="liters">liters</SelectItem>
                <SelectItem value="m²">m²</SelectItem>
                <SelectItem value="m³">m³</SelectItem>
                <SelectItem value="boxes">boxes</SelectItem>
                <SelectItem value="rolls">rolls</SelectItem>
              </SelectContent>
            </Select>
            {errors.unit && (
              <p className="text-xs text-destructive mt-1">
                {errors.unit.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="priority">Priority *</Label>
          <div className="space-y-2">
            <Select
              value={watch("priority") || "medium"}
              onValueChange={(value: MaterialRequestPriority) =>
                setValue("priority", value)
              }
            >
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            {aiPrioritySuggestion && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="size-3" />
                <span>AI suggests: </span>
                <Badge variant="outline">{aiPrioritySuggestion.priority}</Badge>
                <span className="text-xs">({aiPrioritySuggestion.reasoning})</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setValue("priority", aiPrioritySuggestion.priority)}
                >
                  Use
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="project_id">Project (Optional)</Label>
          <Select
            value={watch("project_id") || ""}
            onValueChange={(value) => setValue("project_id", value || null)}
          >
            <SelectTrigger id="project_id">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            {...register("notes")}
            placeholder="Additional information about this request..."
            rows={4}
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : requestId
              ? "Update Request"
              : "Create Request"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/material-requests")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

