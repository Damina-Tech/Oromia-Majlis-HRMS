import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/v1`,
  withCredentials: true,
});

// Request interceptor to add token
api.interceptors.request.use(
  (cfg) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      cfg.headers.Authorization = `Bearer ${token}`;
    }
    return cfg;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token and redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("hrms_user");
        // Only redirect if not already on login page
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Document upload helper
export async function uploadDocument(file: File): Promise<{ url: string; filename: string; originalName: string; size: number }> {
  const formData = new FormData();
  formData.append("document", file);
  
  const { data } = await api.post("/employees/upload-document", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  
  return data;
}

// Bulk import helper
export async function bulkImportEmployees(file: File): Promise<{ message: string; results: { total: number; successful: number; failed: number; errors: Array<{ row: number; email?: string; error: string }> } }> {
  const formData = new FormData();
  formData.append("file", file);
  
  const { data } = await api.post("/employees/bulk-import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  
  return data;
}

// Download sample template
export async function downloadSampleTemplate(): Promise<void> {
  const response = await api.get("/employees/sample-template", {
    responseType: "blob",
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "employee_import_template.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default api;
