import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Send,
  Calendar,
  Users,
  Loader2,
  AlertCircle,
  X,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  createAnnouncement,
  updateAnnouncement,
  getAnnouncement,
  type CreateAnnouncementData,
  type UpdateAnnouncementData,
} from "@/services/announcements";
import { listEmployees, type Employee } from "@/services/employees";
import { listDepartments, type Department } from "@/services/departments";
import { getRoles, type Role } from "@/services/users";

export default function CreateAnnouncementPage() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const canManage = hasPermission("announcements.create") || hasPermission("announcements.edit");

  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  // Form state
  const [formData, setFormData] = useState<CreateAnnouncementData>({
    title: "",
    body: "",
    type: "GENERAL",
    urgency: "NORMAL",
    publishAt: undefined,
    expireAt: undefined,
    target: {
      type: "all",
      ids: [],
    },
    channels: ["IN_APP"],
    requiresAck: false,
    requiresRSVP: false,
    attachmentIds: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");

  useEffect(() => {
    if (!canManage) {
      navigate("/announcements");
      return;
    }

    loadInitialData();
    if (isEdit) {
      loadAnnouncement();
    }
  }, [id, canManage]);

  const loadInitialData = async () => {
    try {
      const [employeesRes, departmentsRes, rolesRes] = await Promise.all([
        listEmployees({ pageSize: 1000 }),
        listDepartments(),
        getRoles(),
      ]);

      setEmployees(employeesRes.items || []);
      setDepartments(departmentsRes || []);
      setRoles(rolesRes || []);
    } catch (err: any) {
      console.error("Failed to load initial data:", err);
    }
  };

  const loadAnnouncement = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const announcement = await getAnnouncement(id);
      setFormData({
        title: announcement.title,
        body: announcement.body,
        type: announcement.type,
        urgency: announcement.urgency,
        publishAt: announcement.publishAt,
        expireAt: announcement.expireAt,
        target: announcement.target,
        channels: announcement.channels,
        requiresAck: announcement.requiresAck,
        requiresRSVP: announcement.requiresRSVP,
        attachmentIds: announcement.attachments?.map((a) => a.id) || [],
      });
      setScheduleMode(announcement.publishAt ? "later" : "now");
    } catch (err: any) {
      console.error("Failed to load announcement:", err);
      toast.error("Failed to load announcement");
      navigate("/announcements");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.body.trim()) {
      newErrors.body = "Body is required";
    }

    if (formData.channels.length === 0) {
      newErrors.channels = "At least one delivery channel is required";
    }

    if (formData.target.type !== "all" && (!formData.target.ids || formData.target.ids.length === 0)) {
      newErrors.target = "Please select target recipients";
    }

    if (scheduleMode === "later" && !formData.publishAt) {
      newErrors.publishAt = "Publish date is required when scheduling";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (publish: boolean = false) => {
    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    try {
      setSaving(true);

      const submitData: any = {
        ...formData,
        publish: publish, // Explicit publish flag
      };

      // If publish is true and scheduleMode is "now", set publishAt to now
      // If publish is false, keep publishAt as is (or undefined for draft)
      if (publish && scheduleMode === "now") {
        submitData.publishAt = new Date().toISOString();
      } else if (!publish && scheduleMode === "now") {
        // Save as draft - no publishAt
        submitData.publishAt = undefined;
      } else if (scheduleMode === "later") {
        // Keep the scheduled publishAt
        submitData.publishAt = formData.publishAt;
      }

      if (isEdit) {
        // For edit, also pass status if publishing
        if (publish) {
          submitData.status = "PUBLISHED";
        }
        await updateAnnouncement(id!, submitData as UpdateAnnouncementData);
        toast.success(publish ? "Announcement published successfully" : "Announcement updated successfully");
      } else {
        await createAnnouncement(submitData);
        toast.success(publish ? "Announcement published successfully" : "Announcement saved as draft");
      }

      navigate("/announcements");
    } catch (err: any) {
      console.error("Failed to save announcement:", err);
      toast.error(err.response?.data?.message || "Failed to save announcement");
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? "Edit Announcement" : "Create Announcement"}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? "Update announcement details" : "Create a new announcement for users"}
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter announcement title"
                  required
                />
                {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label>
                  Body <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Enter announcement content (HTML supported)"
                  rows={10}
                  required
                />
                {errors.body && <p className="text-sm text-red-500 mt-1">{errors.body}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>
                    Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">General</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="FINANCE">Finance</SelectItem>
                      <SelectItem value="MEETING">Meeting</SelectItem>
                      <SelectItem value="SYSTEM">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Urgency</Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value: any) => setFormData({ ...formData, urgency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="IMPORTANT">Important</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Targeting */}
          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
              <CardDescription>Select who should receive this announcement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Target Type</Label>
                <Select
                  value={formData.target.type}
                  onValueChange={(value: any) =>
                    setFormData({
                      ...formData,
                      target: { type: value, ids: [] },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="role">By Role</SelectItem>
                    <SelectItem value="department">By Department</SelectItem>
                    <SelectItem value="employees">Specific Employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.target.type === "role" && (
                <div>
                  <Label>Select Roles</Label>
                  <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                    {roles.map((role) => (
                      <div key={role.id} className="flex items-center space-x-2 py-2">
                        <Checkbox
                          checked={formData.target.ids?.includes(role.id)}
                          onCheckedChange={(checked) => {
                            const ids = formData.target.ids || [];
                            setFormData({
                              ...formData,
                              target: {
                                ...formData.target,
                                ids: checked
                                  ? [...ids, role.id]
                                  : ids.filter((id) => id !== role.id),
                              },
                            });
                          }}
                        />
                        <Label className="flex-1 cursor-pointer">{role.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.target.type === "department" && (
                <div>
                  <Label>Select Departments</Label>
                  <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                    {departments.map((dept) => (
                      <div key={dept.id} className="flex items-center space-x-2 py-2">
                        <Checkbox
                          checked={formData.target.ids?.includes(dept.id)}
                          onCheckedChange={(checked) => {
                            const ids = formData.target.ids || [];
                            setFormData({
                              ...formData,
                              target: {
                                ...formData.target,
                                ids: checked
                                  ? [...ids, dept.id]
                                  : ids.filter((id) => id !== dept.id),
                              },
                            });
                          }}
                        />
                        <Label className="flex-1 cursor-pointer">{dept.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.target.type === "employees" && (
                <div>
                  <Label>Select Employees</Label>
                  <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                    {employees.map((emp) => (
                      <div key={emp.id} className="flex items-center space-x-2 py-2">
                        <Checkbox
                          checked={formData.target.ids?.includes(emp.id)}
                          onCheckedChange={(checked) => {
                            const ids = formData.target.ids || [];
                            setFormData({
                              ...formData,
                              target: {
                                ...formData.target,
                                ids: checked
                                  ? [...ids, emp.id]
                                  : ids.filter((id) => id !== emp.id),
                              },
                            });
                          }}
                        />
                        <Label className="flex-1 cursor-pointer">
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.target && <p className="text-sm text-red-500">{errors.target}</p>}
            </CardContent>
          </Card>

          {/* Delivery Channels */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Channels</CardTitle>
              <CardDescription>Select how to deliver this announcement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {(["IN_APP", "EMAIL", "SMS", "WHATSAPP"] as const).map((channel) => (
                  <div key={channel} className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.channels.includes(channel)}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData,
                          channels: checked
                            ? [...formData.channels, channel]
                            : formData.channels.filter((c) => c !== channel),
                        });
                      }}
                    />
                    <Label className="cursor-pointer">
                      {channel === "IN_APP"
                        ? "In-App Notification"
                        : channel === "EMAIL"
                        ? "Email"
                        : channel === "SMS"
                        ? "SMS"
                        : "WhatsApp"}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.channels && <p className="text-sm text-red-500">{errors.channels}</p>}
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="publishNow"
                    name="scheduleMode"
                    checked={scheduleMode === "now"}
                    onChange={() => {
                      setScheduleMode("now");
                      setFormData({ ...formData, publishAt: undefined });
                    }}
                  />
                  <Label htmlFor="publishNow" className="cursor-pointer">
                    Publish Immediately
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="publishLater"
                    name="scheduleMode"
                    checked={scheduleMode === "later"}
                    onChange={() => setScheduleMode("later")}
                  />
                  <Label htmlFor="publishLater" className="cursor-pointer">
                    Schedule for Later
                  </Label>
                </div>
              </div>

              {scheduleMode === "later" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>
                      Publish At <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="datetime-local"
                      value={
                        formData.publishAt
                          ? new Date(formData.publishAt).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          publishAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                        })
                      }
                      required={scheduleMode === "later"}
                    />
                    {errors.publishAt && <p className="text-sm text-red-500 mt-1">{errors.publishAt}</p>}
                  </div>

                  <div>
                    <Label>Expire At (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={
                        formData.expireAt
                          ? new Date(formData.expireAt).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expireAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meeting Options */}
          {formData.type === "MEETING" && (
            <Card>
              <CardHeader>
                <CardTitle>Meeting Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.requiresAck}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requiresAck: checked as boolean })
                    }
                  />
                  <Label className="cursor-pointer">Require Acknowledgement</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.requiresRSVP}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requiresRSVP: checked as boolean })
                    }
                  />
                  <Label className="cursor-pointer">Require RSVP</Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/announcements")}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEdit ? "Update" : "Save Draft"}
                </>
              )}
            </Button>
            {!isEdit && (
              <Button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={saving}
              >
                <Send className="h-4 w-4 mr-2" />
                {scheduleMode === "now" ? "Publish Now" : "Schedule"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

