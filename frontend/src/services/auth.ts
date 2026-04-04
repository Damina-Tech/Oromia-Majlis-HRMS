import api from "./api";

export type HalalRegistrationPurpose = "halal_business_certificate" | "halal_competency_certificate";

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  registrationPurpose: HalalRegistrationPurpose;
}

export interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string; firstName: string; lastName: string; roles: string[]; permissions: string[]; employeeId?: string; avatarUrl?: string | null };
  redirectTo?: string;
}

export async function registerHalalBusiness(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post("/auth/reset-password", { token, password });
  return data;
}

export async function loginWithGoogle(idToken: string) {
  const { data } = await api.post("/auth/google", { idToken });
  return data;
}

export async function loginWithFacebook(accessToken: string) {
  const { data } = await api.post("/auth/facebook", { accessToken });
  return data;
}

