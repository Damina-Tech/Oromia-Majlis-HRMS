"use client";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/config/api";

/**
 * Auth callback page for Oromia Majlis integration.
 * Receives accessToken via URL fragment (#accessToken=xxx) or query (?token=xxx),
 * validates it, stores auth state, and redirects to Halal dashboard.
 * Used when Majlis website redirects users after login/register.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { storeAuthFromResponse } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      let token: string | null = null;

      // Prefer fragment (more secure - not sent to server in referrer)
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.replace("#", ""));
        token = params.get("accessToken");
      }
      if (!token) {
        token = searchParams.get("token") || searchParams.get("accessToken");
      }

      if (!token) {
        setError("No token provided. Please log in again.");
        setTimeout(() => navigate("/login?redirect=/halal/dashboard"), 3000);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error("Invalid or expired token");
        }
        const data = await res.json();

        const roles: string[] = Array.isArray(data.roles)
          ? data.roles.map((r: { name?: string } | string) => (typeof r === "string" ? r : r.name || ""))
          : [];
        const permissions: string[] = Array.isArray(data.permissions)
          ? data.permissions.map((p: { name?: string } | string) => (typeof p === "string" ? p : p.name || ""))
          : [];

        const userData = {
          id: data.id,
          email: data.email,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          roles,
          permissions,
          employeeId: data.employee?.id,
          avatarUrl: data.avatarUrl ?? null,
        };

        storeAuthFromResponse(token, userData);

        const redirectTo =
          searchParams.get("redirect") ||
          (userData.roles?.includes("HALAL_BUSINESS") ? "/halal/dashboard" : "/dashboard");
        navigate(redirectTo, { replace: true });
      } catch (e) {
        console.error("Auth callback error:", e);
        setError("Invalid or expired session. Redirecting to login...");
        setTimeout(() => navigate("/login?redirect=/halal/dashboard"), 3000);
      }
    };
    run();
  }, [navigate, searchParams, storeAuthFromResponse]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center p-8">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
