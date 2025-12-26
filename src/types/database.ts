export type MaterialRequestStatus = "pending" | "approved" | "rejected" | "fulfilled";
export type MaterialRequestPriority = "low" | "medium" | "high" | "urgent";
export type UserRole = "admin" | "member";

export interface Company {
  id: string;
  name: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
}

export interface UserCompany {
  user_id: string;
  company_id: string;
  role: UserRole;
  created_at: string;
}

export interface MaterialRequest {
  id: string;
  project_id: string | null;
  material_name: string;
  quantity: number;
  unit: string;
  status: MaterialRequestStatus;
  priority: MaterialRequestPriority;
  requested_by: string;
  requested_at: string;
  notes: string | null;
  company_id: string;
}

export interface MaterialRequestInsert {
  project_id?: string | null;
  material_name: string;
  quantity: number;
  unit: string;
  status?: MaterialRequestStatus;
  priority?: MaterialRequestPriority;
  requested_by: string;
  notes?: string | null;
  company_id: string;
}

export interface MaterialRequestUpdate {
  project_id?: string | null;
  material_name?: string;
  quantity?: number;
  unit?: string;
  status?: MaterialRequestStatus;
  priority?: MaterialRequestPriority;
  notes?: string | null;
}

export interface MaterialRequestFilters {
  status?: MaterialRequestStatus;
  priority?: MaterialRequestPriority;
  project_id?: string;
}

