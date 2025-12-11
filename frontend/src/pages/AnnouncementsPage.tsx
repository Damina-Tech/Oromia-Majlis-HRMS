import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Users,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Edit,
  Trash2,
  Send,
  Eye,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  listAnnouncements,
  deleteAnnouncement,
  publishAnnouncement,
  getTypeLabel,
  getTypeColor,
  getUrgencyLabel,
  getUrgencyColor,
  getStatusLabel,
  getStatusColor,
  getChannelLabel,
  type Announcement,
} from "@/services/announcements";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AnnouncementsPage() {
  const { hasPermission, user } = useAuth();
  const navigate = useNavigate();
  const canCreate = hasPermission("announcements.create");
  const canEdit = hasPermission("announcements.edit");
  const canDelete = hasPermission("announcements.delete");
  const canPublish = hasPermission("announcements.publish");
  
  // Check if user is admin or HR for KPI cards visibility
  const isAdminOrHR = user?.roles?.some((role: string) => 
    role.toUpperCase() === "ADMIN" || role.toUpperCase() === "HR"
  ) || false;

  // State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]); // For stats calculation
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, [page, searchTerm, typeFilter, urgencyFilter, statusFilter, unreadOnly]);

  // Load stats independently (only once on mount, or when manually refreshed)
  useEffect(() => {
    loadStats();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await listAnnouncements({
        page,
        pageSize,
        search: searchTerm || undefined,
        type: typeFilter !== "all" ? (typeFilter as any) : undefined,
        urgency: urgencyFilter !== "all" ? (urgencyFilter as any) : undefined,
        status: statusFilter !== "all" ? (statusFilter as any) : undefined,
        unreadOnly,
      });

      // Sort by date (newest first) - prioritize publishedAt, then publishAt, then createdAt
      const sortedItems = (response.items || []).sort((a, b) => {
        const dateA = a.publishedAt 
          ? new Date(a.publishedAt).getTime()
          : a.publishAt 
          ? new Date(a.publishAt).getTime()
          : new Date(a.createdAt).getTime();
        const dateB = b.publishedAt 
          ? new Date(b.publishedAt).getTime()
          : b.publishAt 
          ? new Date(b.publishAt).getTime()
          : new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      setAnnouncements(sortedItems);
      setTotal(response.total || 0);
    } catch (err: any) {
      console.error("Failed to load announcements:", err);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      // Load all announcements for stats calculation (not filtered)
      const response = await listAnnouncements({
        pageSize: 1000,
      });
      setAllAnnouncements(response.items || []);
    } catch (err: any) {
      console.error("Failed to load stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleAcknowledge = async (announcement: Announcement) => {
    try {
      const { acknowledgeAnnouncement } = await import("@/services/announcements");
      await acknowledgeAnnouncement(announcement.id, { acknowledged: true });
      toast.success("Announcement acknowledged");
      loadAnnouncements();
    } catch (err: any) {
      toast.error("Failed to acknowledge announcement");
    }
  };

  const handleDelete = async () => {
    if (!announcementToDelete) return;
    try {
      await deleteAnnouncement(announcementToDelete.id);
      toast.success("Announcement deleted successfully");
      setDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
      loadAnnouncements();
      loadStats(); // Refresh stats
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete announcement");
    }
  };

  const handlePublish = async (announcement: Announcement) => {
    try {
      await publishAnnouncement(announcement.id);
      toast.success("Announcement published successfully");
      loadAnnouncements();
      loadStats(); // Refresh stats
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to publish announcement");
    }
  };

  // Calculate summary stats from all announcements
  const draftCount = allAnnouncements.filter((a) => a.status === "DRAFT").length;
  const scheduledCount = allAnnouncements.filter((a) => a.status === "SCHEDULED").length;
  const publishedCount = allAnnouncements.filter((a) => a.status === "PUBLISHED").length;
  const totalReads = allAnnouncements.reduce((sum, a) => sum + (a._count?.reads || 0), 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">View and manage announcements</p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate("/announcements/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Announcement
          </Button>
        )}
      </div>

      {/* Stats Cards - Only visible to Admin and HR */}
      {isAdminOrHR && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Draft</p>
                <p className="text-2xl font-bold">{statsLoading ? "..." : draftCount}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold">{statsLoading ? "..." : scheduledCount}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold">{statsLoading ? "..." : publishedCount}</p>
              </div>
              <Send className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reads</p>
                <p className="text-2xl font-bold">{statsLoading ? "..." : totalReads}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Read Rate</p>
                <p className="text-2xl font-bold">
                  {statsLoading
                    ? "..."
                    : publishedCount > 0
                    ? Math.round((totalReads / publishedCount) * 10) / 10
                    : 0}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="FINANCE">Finance</SelectItem>
                <SelectItem value="MEETING">Meeting</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
              </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="IMPORTANT">Important</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            {(searchTerm || typeFilter !== "all" || urgencyFilter !== "all" || statusFilter !== "all" || unreadOnly) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                  setUrgencyFilter("all");
                  setStatusFilter("all");
                  setUnreadOnly(false);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="unreadOnly"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="unreadOnly" className="text-sm text-gray-600 cursor-pointer">
              Show unread only
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No announcements found</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className={`hover:shadow-md transition-shadow ${
                !announcement.isRead ? "border-l-4 border-l-blue-500" : ""
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/announcements/${announcement.id}`)}
                  >
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {!announcement.isRead && (
                        <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                      <Badge className={getStatusColor(announcement.status)}>
                        {announcement.status === "SCHEDULED" && announcement.publishAt
                          ? `Scheduled: ${format(new Date(announcement.publishAt), "MMM dd, HH:mm")}`
                          : getStatusLabel(announcement.status)}
                      </Badge>
                      <Badge className={getUrgencyColor(announcement.urgency)}>
                        {getUrgencyLabel(announcement.urgency)}
                      </Badge>
                      <Badge className={getTypeColor(announcement.type)}>
                        {getTypeLabel(announcement.type)}
                      </Badge>
                    </div>
                    <div
                      className="text-sm text-gray-600 mb-3 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: announcement.body }}
                    />
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {announcement.publishedAt
                          ? format(new Date(announcement.publishedAt), "MMM dd, yyyy")
                          : announcement.publishAt
                          ? `Scheduled: ${format(new Date(announcement.publishAt), "MMM dd, yyyy")}`
                          : format(new Date(announcement.createdAt), "MMM dd, yyyy")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {announcement._count?.reads || 0} read
                      </div>
                      <div className="flex items-center gap-1">
                        {announcement.channels.map((channel) => {
                          const Icon =
                            channel === "EMAIL"
                              ? Mail
                              : channel === "SMS"
                              ? Phone
                              : channel === "WHATSAPP"
                              ? MessageSquare
                              : Bell;
                          return (
                            <span key={channel} title={getChannelLabel(channel)}>
                              <Icon className="h-3 w-3" />
                            </span>
                          );
                        })}
                      </div>
                      {announcement.requiresAck && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {announcement.acknowledged ? "Acknowledged" : "Requires ACK"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {announcement.requiresAck && !announcement.acknowledged && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcknowledge(announcement);
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Acknowledge
                      </Button>
                    )}
                    {announcement.status === "DRAFT" && canPublish && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePublish(announcement);
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Publish Now
                      </Button>
                    )}
                    {announcement.status !== "EXPIRED" && canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/announcements/edit/${announcement.id}`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {announcement.status !== "EXPIRED" && canDelete && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAnnouncementToDelete(announcement);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / pageSize)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{announcementToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

