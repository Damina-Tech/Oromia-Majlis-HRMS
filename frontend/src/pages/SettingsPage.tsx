import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Globe,
  Palette,
  ShieldCheck,
  SunMedium,
  Smartphone,
  Mail,
  UserCog,
  RefreshCw,
  MoonStar,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/services/notifications";
import { updateCurrentUser } from "@/services/users";

type ThemePreference = "system" | "light" | "dark";

const THEME_STORAGE_KEY = "chiro_hrms_theme";

const AVAILABLE_LANGUAGES = [
  { label: "English (United States)", value: "en-US" },
  { label: "Amharic", value: "am-ET" },
  { label: "French", value: "fr-FR" },
  { label: "Arabic", value: "ar" },
];

const AVAILABLE_TIMEZONES = [
  { label: "UTC", value: "UTC" },
  { label: "East Africa Time (UTC+3)", value: "Africa/Addis_Ababa" },
  { label: "Eastern Time (UTC-5)", value: "America/New_York" },
  { label: "Central European Time (UTC+1)", value: "Europe/Berlin" },
];

const SettingsPage: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [accountForm, setAccountForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [savingAccount, setSavingAccount] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [notificationChannels, setNotificationChannels] = useState({
    inApp: true,
    email: false,
    push: false,
    sms: false,
    whatsapp: false,
  });
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [language, setLanguage] = useState("en-US");
  const [timezone, setTimezone] = useState("Africa/Addis_Ababa");
  const [compactMode, setCompactMode] = useState(false);
  const [employeeSettings, setEmployeeSettings] = useState({
    defaultCreateAccount: false,
    defaultPageSize: 10,
  });
  const [savingEmployeeSettings, setSavingEmployeeSettings] = useState(false);
  const applyTheme = useCallback((value: ThemePreference) => {
    if (value === "system") {
      document.documentElement.classList.remove("dark");
      document.documentElement.removeAttribute("data-theme");
    } else if (value === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);
  useEffect(() => {
    if (!user) return;
    setAccountForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
    });
    const storedTheme = (localStorage.getItem(THEME_STORAGE_KEY) ??
      "system") as ThemePreference;
    setThemePreference(storedTheme);
    applyTheme(storedTheme);
    const storedLanguage = localStorage.getItem("hrms_language");
    if (storedLanguage) setLanguage(storedLanguage);
    const storedTimezone = localStorage.getItem("hrms_timezone");
    if (storedTimezone) setTimezone(storedTimezone);
    const storedCompact = localStorage.getItem("hrms_compact_mode");
    if (storedCompact) setCompactMode(storedCompact === "true");
    const storedDefaultCreateAccount = localStorage.getItem("hrms_employee_default_create_account");
    const storedEmployeePageSize = localStorage.getItem("hrms_employee_page_size");
    const parsedPageSize =
      storedEmployeePageSize && !Number.isNaN(Number(storedEmployeePageSize))
        ? Number(storedEmployeePageSize)
        : 10;
    const validatedPageSize = parsedPageSize > 0 ? parsedPageSize : 10;
    setEmployeeSettings({
      defaultCreateAccount: storedDefaultCreateAccount === "true",
      defaultPageSize: validatedPageSize,
  });
  }, [user, applyTheme]);
  const loadNotificationPrefs = useCallback(async () => {
    if (!user) return;
    setLoadingNotifications(true);
    try {
      const prefs = await getNotificationPreferences();
      const channels =
        (prefs.channels as Record<string, boolean>) ?? notificationChannels;
      setNotificationChannels({
        inApp: channels.inApp ?? true,
        email: channels.email ?? false,
        push: channels.push ?? false,
        sms: channels.sms ?? false,
        whatsapp: channels.whatsapp ?? false,
      });
    } catch (error: any) {
      console.error("Failed to load notification preferences", error);
      toast.error(
        error?.response?.data?.message ??
          "Unable to load your notification preferences."
      );
    } finally {
      setLoadingNotifications(false);
    }
  }, [user]);
  useEffect(() => {
    loadNotificationPrefs();
  }, [loadNotificationPrefs]);
  const handleAccountSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSavingAccount(true);
    try {
      await updateCurrentUser({
        firstName: accountForm.firstName,
        lastName: accountForm.lastName,
      });
      await refreshUserData();
      toast.success("Account information updated");
    } catch (error: any) {
      console.error("Failed to update account", error);
      toast.error(
        error?.response?.data?.message ?? "Unable to update your account details."
      );
    } finally {
      setSavingAccount(false);
    }
  };
  const handlePasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
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
      await updateCurrentUser({ password: passwordForm.newPassword });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated successfully");
    } catch (error: any) {
      console.error("Failed to change password", error);
      toast.error(
        error?.response?.data?.message ?? "Unable to update your password."
      );
    } finally {
      setSavingPassword(false);
    }
  };
  const handleNotificationToggle = async (
    key: keyof typeof notificationChannels,
    value: boolean
  ) => {
    setNotificationChannels((prev) => ({ ...prev, [key]: value }));
    try {
      await updateNotificationPreferences({
        channels: {
          ...notificationChannels,
          [key]: value,
        },
      });
      toast.success("Notification preferences updated");
      loadNotificationPrefs();
    } catch (error: any) {
      console.error("Failed to update notification settings", error);
      toast.error(
        error?.response?.data?.message ??
          "Unable to update notification preferences."
      );
    }
  };
  const handleThemeChange = (value: ThemePreference) => {
    setThemePreference(value);
    localStorage.setItem(THEME_STORAGE_KEY, value);
    applyTheme(value);
    toast.success("Theme preference updated");
  };
  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    localStorage.setItem("hrms_language", value);
    toast.success("Language preference updated");
  };
  const handleTimezoneChange = (value: string) => {
    setTimezone(value);
    localStorage.setItem("hrms_timezone", value);
    toast.success("Timezone updated");
  };
  const handleCompactToggle = (value: boolean) => {
    setCompactMode(value);
    localStorage.setItem("hrms_compact_mode", value ? "true" : "false");
  };
  const handleEmployeeSettingsSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingEmployeeSettings(true);
    try {
      localStorage.setItem(
        "hrms_employee_default_create_account",
        employeeSettings.defaultCreateAccount ? "true" : "false"
      );
      localStorage.setItem("hrms_employee_page_size", String(employeeSettings.defaultPageSize));
      window.dispatchEvent(new Event("hrms:employee-settings-update"));
      toast.success("Employee management settings updated");
    } finally {
      setSavingEmployeeSettings(false);
    }
  };
  const notificationSummary = useMemo(() => {
    const enabled = Object.entries(notificationChannels)
      .filter(([, value]) => value)
      .map(([key]) => key.toUpperCase());
    return enabled.length ? enabled.join(", ") : "In-app only";
  }, [notificationChannels]);
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage how Chiro HRMS works for your account.
          </p>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full flex-wrap justify-start gap-2">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        <TabsTrigger value="employees">Employees</TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Account details
              </CardTitle>
              <CardDescription>
                Update how your name appears to your colleagues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleAccountSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                <Input
                    id="firstName"
                    value={accountForm.firstName}
                    onChange={(event) =>
                      setAccountForm((prev) => ({
                      ...prev,
                        firstName: event.target.value,
                      }))
                    }
                />
              </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={accountForm.lastName}
                    onChange={(event) =>
                      setAccountForm((prev) => ({
                        ...prev,
                        lastName: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input id="email" value={accountForm.email} disabled />
                  <p className="text-xs text-muted-foreground">
                    Contact your administrator to change your email address.
                  </p>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={savingAccount}>
                    {savingAccount ? (
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
        </TabsContent>
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification channels
              </CardTitle>
              <CardDescription>
                Choose how you want to stay informed. Current: {notificationSummary}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingNotifications ? (
                <p className="text-sm text-muted-foreground">Loading notification preferences…</p>
              ) : (
                <div className="space-y-6">
                  {(
                    [
                      {
                        key: "inApp",
                        label: "In-app",
                        description: "Receive notifications inside Chiro HRMS.",
                        icon: SunMedium,
                        disabled: true,
                      },
                      {
                        key: "email",
                        label: "Email",
                        description: "Important updates will be sent to your inbox.",
                        icon: Mail,
                      },
                      {
                        key: "push",
                        label: "Push",
                        description:
                          "Get push notifications on supported browsers and devices.",
                        icon: Smartphone,
                      },
                      {
                        key: "sms",
                        label: "SMS",
                        description: "Time-critical alerts delivered via SMS.",
                        icon: ShieldCheck,
                      },
                      {
                        key: "whatsapp",
                        label: "WhatsApp",
                        description: "Notifications delivered to WhatsApp (beta).",
                        icon: Smartphone,
                      },
                    ] as const
                  ).map(({ key, label, description, icon: Icon, disabled }) => (
                <div
                      key={key}
                      className="flex items-start justify-between rounded-lg border bg-muted/30 p-4"
                >
                      <div className="flex items-start gap-3">
                        <Icon className="mt-1 h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                      </div>
                    <Switch
                        checked={notificationChannels[key]}
                        disabled={disabled}
                        onCheckedChange={(value) =>
                          handleNotificationToggle(key, value)
                        }
                    />
                  </div>
                  ))}
                    </div>
                  )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Change password
              </CardTitle>
              <CardDescription>
                Use at least 8 characters and avoid using the same password on other sites.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handlePasswordSubmit}>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: event.target.value,
                      }))
                    }
                  />
                </div>
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
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
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
        </TabsContent>
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme & display
              </CardTitle>
              <CardDescription>
                Personalize how Chiro HRMS looks on your device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid gap-2 md:grid-cols-3">
                  {(
                    [
                      { value: "system", label: "System", icon: Globe },
                      { value: "light", label: "Light", icon: SunMedium },
                      { value: "dark", label: "Dark", icon: MoonStar },
                    ] as const
                  ).map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleThemeChange(value)}
                      className={`rounded-lg border p-4 text-left transition ${
                        themePreference === value
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                </div>
                    </button>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
              <div>
                  <p className="font-medium">Compact mode</p>
                    <p className="text-sm text-muted-foreground">
                    Reduce spacing and show more information at once.
                  </p>
                  </div>
                <Switch checked={compactMode} onCheckedChange={handleCompactToggle} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Locale preferences
              </CardTitle>
              <CardDescription>
                Language and timezone settings affect how information is displayed.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_LANGUAGES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                  </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={handleTimezoneChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                    {AVAILABLE_TIMEZONES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                        </SelectContent>
                      </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee management
              </CardTitle>
              <CardDescription>
                Control defaults for employee creation and the directory experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleEmployeeSettingsSave}>
                <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="font-medium">Default create user account</p>
                  <p className="text-sm text-muted-foreground">
                      Automatically enable the “Create User Account” option when adding a new employee.
                  </p>
                </div>
                <Switch
                    checked={employeeSettings.defaultCreateAccount}
                    onCheckedChange={(checked) =>
                      setEmployeeSettings((prev) => ({ ...prev, defaultCreateAccount: checked }))
                    }
                        />
                      </div>
                <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-[260px_auto] sm:items-center">
                      <div>
                    <p className="font-medium">Employees per page</p>
                    <p className="text-sm text-muted-foreground">
                      Choose how many employees appear in each page of the directory.
                    </p>
                      </div>
                      <Select
                    value={String(employeeSettings.defaultPageSize)}
                    onValueChange={(value) =>
                      setEmployeeSettings((prev) => ({
                            ...prev,
                        defaultPageSize: Number(value),
                      }))
                    }
                      >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Employees per page" />
                        </SelectTrigger>
                        <SelectContent>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="20">20 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
              <Separator />
                <div className="flex justify-end">
                  <Button type="submit" disabled={savingEmployeeSettings}>
                    {savingEmployeeSettings ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save settings"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
