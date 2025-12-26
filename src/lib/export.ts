import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { MaterialRequest } from "../types/database";

export function exportToCSV(data: MaterialRequest[], filename = "material-requests") {
  const csvData = data.map((request) => ({
    "Material Name": request.material_name,
    Quantity: request.quantity,
    Unit: request.unit,
    Status: request.status,
    Priority: request.priority,
    "Requested By": request.requested_by,
    "Requested At": new Date(request.requested_at).toLocaleString(),
    Notes: request.notes || "",
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(data: MaterialRequest[], filename = "material-requests") {
  const excelData = data.map((request) => ({
    "Material Name": request.material_name,
    Quantity: request.quantity,
    Unit: request.unit,
    Status: request.status,
    Priority: request.priority,
    "Requested By": request.requested_by,
    "Requested At": new Date(request.requested_at).toLocaleString(),
    Notes: request.notes || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Material Requests");

  XLSX.writeFile(
    workbook,
    `${filename}-${new Date().toISOString().split("T")[0]}.xlsx`
  );
}

