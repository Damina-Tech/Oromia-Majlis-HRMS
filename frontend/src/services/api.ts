export interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

const getAuthToken = () => localStorage.getItem('hrms_token');

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!res.ok) {
    let message = 'Request failed';
    try {
      const data = await res.json();
      message = data?.error || message;
    } catch {}
    throw new Error(message);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

export type Employee = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  status?: string;
  manager?: string;
  salary?: number;
  avatar?: string;
  address?: string;
  emergencyContact?: string;
  employeeId?: string;
};

export type Department = {
  id: string;
  name: string;
  head?: string;
  description?: string;
};

export const Api = {
  login: (email: string, password: string) => api<{ token: string; user: any }>(`/auth/login`, { method: 'POST', body: { email, password } }),
  employees: {
    list: () => api<Employee[]>(`/employees`),
    get: (id: string) => api<Employee>(`/employees/${id}`)
  },
  departments: {
    list: () => api<Department[]>(`/departments`)
  }
};


