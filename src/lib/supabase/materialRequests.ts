import { supabase } from "../../supabaseClient";
import type {
  MaterialRequest,
  MaterialRequestInsert,
  MaterialRequestUpdate,
  MaterialRequestFilters,
} from "../../types/database";

export async function getMaterialRequests(
  companyId: string,
  filters?: MaterialRequestFilters
) {
  let query = supabase
    .from("material_requests")
    .select(
      `
      *,
      project:projects(id, name)
    `
    )
    .eq("company_id", companyId)
    .order("requested_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }

  if (filters?.project_id) {
    query = query.eq("project_id", filters.project_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch material requests: ${error.message}`);
  }

  return data as MaterialRequest[];
}

export async function getMaterialRequestById(id: string) {
  const { data, error } = await supabase
    .from("material_requests")
    .select(
      `
      *,
      project:projects(id, name)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch material request: ${error.message}`);
  }

  return data as MaterialRequest;
}

export async function createMaterialRequest(
  request: MaterialRequestInsert
): Promise<MaterialRequest> {
  const { data, error } = await supabase
    .from("material_requests")
    .insert(request)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create material request: ${error.message}`);
  }

  return data as MaterialRequest;
}

export async function updateMaterialRequest(
  id: string,
  updates: MaterialRequestUpdate
): Promise<MaterialRequest> {
  const { data, error } = await supabase
    .from("material_requests")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update material request: ${error.message}`);
  }

  return data as MaterialRequest;
}

export async function updateMaterialRequestStatus(
  id: string,
  status: MaterialRequest["status"]
): Promise<MaterialRequest> {
  return updateMaterialRequest(id, { status });
}

export async function getProjects(companyId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  return data;
}

export async function getUserCompany(userId: string) {
  // First, get the user_companies row
  const { data: userCompany, error: userCompanyError } = await supabase
    .from("user_companies")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (userCompanyError) {
    throw new Error(`Failed to fetch user company: ${userCompanyError.message}`);
  }

  // If no user_company found, return null
  if (!userCompany) {
    return null;
  }

  // If we have a company_id, fetch the company details
  if (userCompany.company_id) {
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", userCompany.company_id)
      .single();

    if (companyError) {
      // If company fetch fails, still return the user_company data without company details
      console.warn("Failed to fetch company details:", companyError.message);
      return {
        ...userCompany,
        company: null,
      };
    }

    return {
      ...userCompany,
      company,
    };
  }

  return userCompany;
}

