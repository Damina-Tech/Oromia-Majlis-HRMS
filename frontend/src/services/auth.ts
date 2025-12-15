import api from "./api";

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

