import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Building2,
  Calendar,
  Mail,
  MapPin,
  Shield,
  User as UserIcon,
  Lock,
  RefreshCw,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentUser, updateCurrentUser, uploadAvatar, type User as DetailedUser } from "@/services/users";
import { format } from "date-fns";

type PermissionGroup = {
  module: string;
  permissions: {
    id: string;
    name: string;
    description?: string;
    action: string;
  }[];
};

const ProfilePage: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const [profile, setProfile] = useState<DetailedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [savingBasic, setSavingBasic] = useState(false);
  const [savingAbout, setSavingAbout] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [basicForm, setBasicForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [aboutForm, setAboutForm] = useState({
    bio: "",
    location: "",
    linkedIn: "",
    interests: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const apiBaseUrl = useMemo(() => import.meta.env.VITE_API_URL || "http://localhost:4000", []);
  const resolveAvatarUrl = useCallback(
    (value?: string | null) => {
      if (!value) return undefined;
      if (value.startsWith("http")) return value;
      return `${apiBaseUrl}${value}`;
    },
    [apiBaseUrl]
  );

  const formatStatus = useCallback((status?: string | null) => {
    if (!status) return "—";
    return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }, []);

  const getStatusBadgeClass = useCallback((status?: string | null) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "ON_LEAVE":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "INACTIVE":
        return "bg-rose-50 text-rose-600 border-rose-200";
      default:
        return "bg-muted text-foreground border-transparent";
    }
  }, []);

  const formatEmploymentType = useCallback((value?: string | null) => {
    if (!value) return "—";
    return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }, []);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getCurrentUser();
      setProfile(data);
      setBasicForm({
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        email: data.email ?? "",
      });
      const storedAbout = localStorage.getItem(`hrms_profile_about_${user.id}`);
      if (storedAbout) {
        setAboutForm(JSON.parse(storedAbout));
      }
    } catch (error: any) {
      console.error("Failed to load profile", error);
      setFetchError(
        error?.response?.data?.message ?? "Failed to load your profile information."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const fullName = useMemo(() => {
    if (!profile) return "";
    return `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
  }, [profile]);

  const groupedPermissions: PermissionGroup[] = useMemo(() => {
    if (!profile?.permissions || profile.permissions.length === 0) return [];
    const groups = new Map<string, PermissionGroup>();
    profile.permissions.forEach((perm: any) => {
      const module = perm.module ?? "GENERAL";
      if (!groups.has(module)) {
        groups.set(module, {
          module,
          permissions: [],
        });
      }
      groups.get(module)!.permissions.push({
        id: perm.id,
        name: perm.name,
        description: perm.description,
        action: perm.action,
      });
    });

    return Array.from(groups.values()).sort((a, b) =>
      a.module.localeCompare(b.module)
    );
  }, [profile?.permissions]);

  const employmentSummary = useMemo(() => {
    if (!profile?.employee) return [];
    const emp = profile.employee;
    return [
      { label: "Employee ID", value: emp.employeeCode ?? "—" },
      { label: "Department", value: emp.department?.name ?? "—" },
      { label: "Designation", value: emp.designation ?? "—" },
      { label: "Employment Type", value: formatEmploymentType(emp.employmentType) },
      {
        label: "Manager",
        value: emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : "—",
      },
      {
        label: "Joined",
        value: emp.joiningDate ? format(new Date(emp.joiningDate), "PP") : "—",
      },
    ];
  }, [profile?.employee, formatEmploymentType]);

  const employmentStatus = profile?.employee?.status ?? null;
  const avatarSrc = resolveAvatarUrl(profile?.avatarUrl ?? profile?.employee?.avatarUrl);

  const handleBasicSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSavingBasic(true);
    try {
      await updateCurrentUser({
        firstName: basicForm.firstName,
        lastName: basicForm.lastName,
      });
      await refreshUserData();
      toast.success("Profile information updated");
      loadProfile();
    } catch (error: any) {
      console.error("Failed to update profile", error);
      toast.error(
        error?.response?.data?.message ??
          "Unable to update your profile information."
      );
    } finally {
      setSavingBasic(false);
    }
  };

  const handleSaveAbout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSavingAbout(true);
    try {
      localStorage.setItem(
        `hrms_profile_about_${user.id}`,
        JSON.stringify(aboutForm)
      );
      toast.success("About section updated");
    } finally {
      setSavingAbout(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      await updateCurrentUser({
        password: passwordForm.newPassword,
      });
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      toast.success("Password updated successfully");
    } catch (error: any) {
      console.error("Failed to update password", error);
      toast.error(
        error?.response?.data?.message ?? "Unable to update your password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const { avatarUrl } = await uploadAvatar(file);
      setProfile((prev) => {
        if (!prev) return prev;
        const updatedEmployee = prev.employee
          ? { ...prev.employee, avatarUrl }
          : prev.employee;
        return { ...prev, avatarUrl, employee: updatedEmployee };
      });
      await refreshUserData();
      toast.success("Profile photo updated");
    } catch (error: any) {
      console.error("Failed to upload avatar", error);
      toast.error(
        error?.response?.data?.message ?? "Unable to update your profile photo."
      );
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Please sign in to view your profile.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-6">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Unable to load profile</CardTitle>
            <CardDescription>{fetchError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadProfile}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {avatarSrc && (
              <AvatarImage src={avatarSrc} alt={`${fullName || user.email} avatar`} />
            )}
            <AvatarFallback className="text-xl">
              {fullName ? fullName.charAt(0) : user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{fullName || user.email}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {profile?.email}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile?.roles?.map((role) => (
                <Badge key={role.id} variant="outline">
                  {role.name}
                </Badge>
              ))}
              {employmentStatus && (
                <Badge variant="outline" className={getStatusBadgeClass(employmentStatus)}>
                  {formatStatus(employmentStatus)}
                </Badge>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? "Uploading…" : "Change photo"}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              Joined{" "}
              {profile?.createdAt
                ? format(new Date(profile.createdAt), "PP")
                : "—"}
            </span>
          </div>
          {profile?.updatedAt && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                Last updated {format(new Date(profile.updatedAt), "PPp")}
              </span>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {profile?.employee && (
            <Card>
              <CardHeader>
                <CardTitle>Employment snapshot</CardTitle>
                <CardDescription>
                  Key details synced from your HR record.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {employmentSummary.map((item) => (
                    <div key={item.label} className="flex flex-col gap-1">
                      <span className="text-xs uppercase text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                  {employmentStatus && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs uppercase text-muted-foreground">Status</span>
                      <Badge variant="outline" className={getStatusBadgeClass(employmentStatus)}>
                        {formatStatus(employmentStatus)}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Basic information</CardTitle>
              <CardDescription>
                Update your name and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-6 md:grid-cols-2" onSubmit={handleBasicSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={basicForm.firstName}
                    onChange={(event) =>
                      setBasicForm((prev) => ({ ...prev, firstName: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={basicForm.lastName}
                    onChange={(event) =>
                      setBasicForm((prev) => ({ ...prev, lastName: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" value={basicForm.email} disabled />
                  <p className="text-xs text-muted-foreground">
                    Contact an administrator if you need to change your email.
                  </p>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={savingBasic}>
                    {savingBasic ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About you</CardTitle>
              <CardDescription>
                Share a bit more about yourself with your colleagues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSaveAbout}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="Add your city or country"
                      value={aboutForm.location}
                      onChange={(event) =>
                        setAboutForm((prev) => ({ ...prev, location: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedIn">LinkedIn</Label>
                    <Input
                      id="linkedIn"
                      placeholder="https://linkedin.com/in/username"
                      value={aboutForm.linkedIn}
                      onChange={(event) =>
                        setAboutForm((prev) => ({ ...prev, linkedIn: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell others a little about your role, expertise, or interests."
                    rows={4}
                    value={aboutForm.bio}
                    onChange={(event) =>
                      setAboutForm((prev) => ({ ...prev, bio: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interests">Professional interests</Label>
                  <Textarea
                    id="interests"
                    placeholder="e.g. HR analytics, team leadership, employee engagement"
                    rows={3}
                    value={aboutForm.interests}
                    onChange={(event) =>
                      setAboutForm((prev) => ({
                        ...prev,
                        interests: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={savingAbout}>
                    {savingAbout ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save about section"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Employment details
              </CardTitle>
              <CardDescription>
                Information associated with your employee record.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Employee ID</p>
                <p className="font-medium">
                  {profile?.employee?.employeeCode ?? "Not assigned"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Designation</p>
                <p className="font-medium">
                  {profile?.employee?.designation ?? "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="font-medium">
                  {profile?.employee?.department?.name ?? "Not assigned"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={profile?.status === "ACTIVE" ? "default" : "destructive"}>
                  {profile?.status ?? "Unknown"}
                </Badge>
              </div>
              <div className="md:col-span-2">
                <Separator className="my-2" />
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    Chiro HRMS Organization
                  </span>
                  {aboutForm.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {aboutForm.location}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>The access levels assigned to your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.roles?.length ? (
                profile.roles.map((role) => (
                  <div key={role.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{role.name}</p>
                        {role.description && (
                          <p className="text-sm text-muted-foreground">
                            {role.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">{role.name}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No roles assigned. Contact an administrator if you believe this is an error.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Update password
              </CardTitle>
              <CardDescription>
                Use a strong password that you don&apos;t reuse on other sites.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handlePasswordChange}>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: event.target.value,
                      }))
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground md:col-span-2">
                  Password must be at least 8 characters long.
                </p>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={savingPassword}>
                    {savingPassword ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Updating…
                      </>
                    ) : (
                      "Update password"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Account activity</CardTitle>
              <CardDescription>
                Recent events related to your account and access changes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <Shield className="mt-1 h-4 w-4 text-emerald-500" />
                <div>
                  <p className="font-medium text-foreground">SSO available</p>
                  <p>Single sign-on is enabled for the organization. Use &ldquo;Login with SSO&rdquo; on the sign-in page.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserIcon className="mt-1 h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-medium text-foreground">Primary role</p>
                  <p>
                    {profile?.roles?.[0]?.name ?? "User"} &mdash;{" "}
                    {profile?.roles?.[0]?.description ?? "Standard account access"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Permissions overview</CardTitle>
              <CardDescription>
                Permissions are granted via roles. Contact an administrator if you need additional access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {groupedPermissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No permissions available to display.
                </p>
              ) : (
                groupedPermissions.map((group) => (
                  <div key={group.module} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Badge variant="outline">{group.module}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {group.permissions.length} permission
                        {group.permissions.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {group.permissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="rounded-md border bg-muted/30 p-3 text-sm"
                        >
                          <p className="font-medium capitalize">
                            {permission.name.replace(/[-_]/g, " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {permission.description ?? `Action: ${permission.action}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;

