import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Mail,
  MessageSquare,
  Phone,
  Bell,
  Calendar,
  Users,
  Loader2,
  AlertCircle,
  Eye,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  getAnnouncement,
  acknowledgeAnnouncement,
  getAnnouncementStats,
  listAnnouncementReads,
  getTypeLabel,
  getTypeColor,
  getUrgencyLabel,
  getUrgencyColor,
  getStatusLabel,
  getChannelLabel,
  type Announcement,
} from "@/services/announcements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canViewStats = hasPermission("announcements.view");

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [reads, setReads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    if (id) {
      loadAnnouncement();
      if (canViewStats) {
        loadStats();
        loadReads();
      }
    }
  }, [id, canViewStats]);

  const loadAnnouncement = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await getAnnouncement(id);
      setAnnouncement(data);

      // Auto-mark as read when viewing
      if (!data.isRead) {
        await acknowledgeAnnouncement(id, { acknowledged: false });
      }
    } catch (err: any) {
      console.error("Failed to load announcement:", err);
      toast.error("Failed to load announcement");
      navigate("/announcements");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!id) return;

    try {
      const data = await getAnnouncementStats(id);
      setStats(data);
    } catch (err: any) {
      console.error("Failed to load stats:", err);
    }
  };

  const loadReads = async () => {
    if (!id) return;

    try {
      const response = await listAnnouncementReads(id);
      setReads(response.items || []);
    } catch (err: any) {
      console.error("Failed to load reads:", err);
    }
  };

  const handleAcknowledge = async () => {
    if (!id) return;

    try {
      setAcknowledging(true);
      await acknowledgeAnnouncement(id, { acknowledged: true });
      toast.success("Announcement acknowledged");
      await loadAnnouncement();
      await loadReads();
    } catch (err: any) {
      toast.error("Failed to acknowledge announcement");
    } finally {
      setAcknowledging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Announcement Not Found</h3>
          <Button onClick={() => navigate("/announcements")}>Back to Announcements</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/announcements")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{announcement.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getUrgencyColor(announcement.urgency)}>
                {getUrgencyLabel(announcement.urgency)}
              </Badge>
              <Badge className={getTypeColor(announcement.type)}>
                {getTypeLabel(announcement.type)}
              </Badge>
              <Badge variant="outline">{getStatusLabel(announcement.status)}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcement Content */}
          <Card>
            <CardHeader>
              <CardTitle>Announcement</CardTitle>
              <CardDescription>
                {announcement.publishedAt
                  ? `Published on ${format(new Date(announcement.publishedAt), "MMMM dd, yyyy 'at' h:mm a")}`
                  : announcement.publishAt
                  ? `Scheduled for ${format(new Date(announcement.publishAt), "MMMM dd, yyyy 'at' h:mm a")}`
                  : "Draft"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: announcement.body }}
              />

              {/* Attachments */}
              {announcement.attachments && announcement.attachments.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3">Attachments</h4>
                  <div className="space-y-2">
                    {announcement.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">{attachment.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {(attachment.fileSize / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RSVP/Acknowledgement */}
              {(announcement.requiresAck || announcement.requiresRSVP) && (
                <div className="mt-6 pt-6 border-t">
                  {announcement.acknowledged ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">You have acknowledged this announcement</span>
                    </div>
                  ) : (
                    <Button onClick={handleAcknowledge} disabled={acknowledging}>
                      {acknowledging ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {announcement.requiresRSVP ? "RSVP" : "Acknowledge"}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Channels */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Channels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
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
                    <Badge key={channel} variant="outline" className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {getChannelLabel(channel)}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Card (Admin only) */}
          {canViewStats && stats && (
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Reads</p>
                  <p className="text-2xl font-bold">{stats.reads.total}</p>
                </div>
                {announcement.requiresAck && (
                  <div>
                    <p className="text-sm text-gray-600">Acknowledged</p>
                    <p className="text-2xl font-bold">{stats.reads.acknowledged}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Deliveries</p>
                  <p className="text-2xl font-bold">{stats.deliveries.total}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Target Info */}
          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Type:</strong> {announcement.target.type}
                </p>
                {announcement.target.ids && announcement.target.ids.length > 0 && (
                  <p className="text-sm">
                    <strong>Count:</strong> {announcement.target.ids.length}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Read List (Admin only) */}
          {canViewStats && reads.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Read Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {reads.map((read) => (
                    <div key={read.id} className="flex items-center justify-between text-sm">
                      <span>
                        {read.user.firstName} {read.user.lastName}
                      </span>
                      <div className="flex items-center gap-2">
                        {read.acknowledged && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        <span className="text-xs text-gray-500">
                          {format(new Date(read.readAt), "MMM dd")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

