import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createSession,
  getAllSessions,
  getSessionBookings,
  updateBookingStatus,
  updateSessionStatus,
  signOut,
} from "@/lib/firebaseService";
import { toast } from "sonner";

interface Session {
  id: string;
  sessionName: string;
  ticketLimit: number;
  status: "active" | "closed";
  shareableLink: string;
  createdAt: any;
}

interface Booking {
  id: string;
  name: string;
  phoneNumber: string;
  ticketNumbers: number[];
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  createdAt: any;
}

export function AdminDashboard({ user }: { user: any }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [ticketLimit, setTicketLimit] = useState("20");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject" | "cancel" | "close";
    bookingId?: string;
  } | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await getAllSessions();
      setSessions(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async (sessionId: string) => {
    try {
      const data = await getSessionBookings(sessionId);
      setBookings(data);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handlecreateSession = async () => {
    if (!sessionName.trim()) {
      toast.error("Please enter a session name");
      return;
    }
    const limit = parseInt(ticketLimit);
    if (isNaN(limit) || limit < 1 || limit > 200) {
      toast.error("Ticket limit must be between 1 and 200");
      return;
    }
    setCreating(true);
    try {
      const session = await createSession(sessionName, limit, user.uid);
      toast.success("Session created successfully");
      setShowCreateModal(false);
      setSessionName("");
      setTicketLimit("20");
      await loadSessions();
      if (session) {
        setSelectedSession(session);
        await loadBookings(session.id);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSelectSession = async (session: Session) => {
    setSelectedSession(session);
    await loadBookings(session.id);
  };

  const handleBookingAction = async () => {
    if (!confirmAction || !selectedSession) return;
    try {
      if (confirmAction.type === "close") {
        await updateSessionStatus(selectedSession.id);
        toast.success("Session closed");
        setSelectedSession({ ...selectedSession, status: "closed" });
        await loadSessions();
      } else if (confirmAction.bookingId) {
        await updateBookingStatus(
          selectedSession.id,
          confirmAction.bookingId,
          confirmAction.type === "approve" ? "confirmed" : confirmAction.type === "reject" ? "rejected" : "cancelled",
          user.uid
        );
        toast.success(`Booking ${confirmAction.type}d`);
        await loadBookings(selectedSession.id);
      }
      setConfirmAction(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "all") return true;
    return b.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={styles[status] || ""}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Sessions</h2>
            <p className="text-slate-500 mt-1">Manage your ticket booking sessions</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Session
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {sessions.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="p-6 text-center text-slate-500">
                  No sessions yet. Create your first session!
                </CardContent>
              </Card>
            ) : (
              sessions.map((session) => (
                <Card
                  key={session.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedSession?.id === session.id ? "ring-2 ring-indigo-500" : ""
                  }`}
                  onClick={() => handleSelectSession(session)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-900">{session.sessionName}</h3>
                      <Badge
                        className={
                          session.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {session.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">
                      {session.ticketLimit} tickets available
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyLink(session.shareableLink);
                        }}
                      >
                        Copy Link
                      </Button>
                      {session.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmAction({ type: "close" });
                          }}
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedSession ? (
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{selectedSession.sessionName}</CardTitle>
                      <CardDescription>
                        {selectedSession.ticketLimit} tickets •{" "}
                        {selectedSession.status === "active" ? "Active" : "Closed"}
                      </CardDescription>
                    </div>
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredBookings.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      No bookings found
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-slate-900">{booking.name}</p>
                              <p className="text-sm text-slate-500">{booking.phoneNumber}</p>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1 flex-wrap">
                              {booking.ticketNumbers.map((num) => (
                                <span
                                  key={num}
                                  className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium"
                                >
                                  #{num}
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              {booking.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() =>
                                      setConfirmAction({ type: "approve", bookingId: booking.id })
                                    }
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600"
                                    onClick={() =>
                                      setConfirmAction({ type: "reject", bookingId: booking.id })
                                    }
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {(booking.status === "pending" || booking.status === "confirmed") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setConfirmAction({ type: "cancel", bookingId: booking.id })
                                  }
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-12 text-center text-slate-500">
                  Select a session to view bookings
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>
              Set up a new ticket booking session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sessionName">Session Name</Label>
              <Input
                id="sessionName"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., Annual Conference 2024"
              />
            </div>
            <div>
              <Label htmlFor="ticketLimit">Number of Tickets (1-200)</Label>
              <Input
                id="ticketLimit"
                type="number"
                min="1"
                max="200"
                value={ticketLimit}
                onChange={(e) => setTicketLimit(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handlecreateSession} disabled={creating}>
              {creating ? "Creating..." : "Create Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "approve"
                ? "Approve Booking"
                : confirmAction?.type === "reject"
                ? "Reject Booking"
                : confirmAction?.type === "cancel"
                ? "Cancel Booking"
                : "Close Session"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "close"
                ? "Are you sure you want to close this session? Users will no longer be able to book tickets."
                : "Are you sure you want to proceed with this action?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleBookingAction}
              className={
                confirmAction?.type === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : confirmAction?.type === "reject" || confirmAction?.type === "cancel"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}