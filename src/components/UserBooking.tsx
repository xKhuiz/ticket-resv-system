import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getTicketAvailability, createBooking } from "@/lib/firebaseService";
import { toast } from "sonner";

interface Session {
  id: string;
  sessionName: string;
  ticketLimit: number;
  status: "active" | "closed";
}

interface Ticket {
  ticketNumber: number;
  status: "available" | "pending" | "confirmed";
}

export function UserBooking({ sessionId, session }: { sessionId: string; session: Session }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    name: string;
    ticketNumbers: number[];
  } | null>(null);

  useEffect(() => {
    loadTickets();
  }, [sessionId]);

  const loadTickets = async () => {
    try {
      const data = await getTicketAvailability(sessionId);
      setTickets(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTicket = (ticketNumber: number) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketNumber)
        ? prev.filter((t) => t !== ticketNumber)
        : [...prev, ticketNumber]
    );
  };

  const validatePhone = (phone: string) => {
    const regex = /^[+]?[\d\s-]{10,15}$/;
    return regex.test(phone);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!validatePhone(phone)) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (selectedTickets.length === 0) {
      toast.error("Please select at least one ticket");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createBooking(sessionId, name, phone, selectedTickets);
      setConfirmation({ name, ticketNumbers: selectedTickets });
      toast.success("Booking submitted successfully!");
      await loadTickets();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading session...</div>
      </div>
    );
  }

  if (session.status === "closed") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Session Closed</h2>
            <p className="text-slate-500">This booking session is no longer accepting reservations.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Submitted!</h2>
            <p className="text-slate-500 mb-6">
              Thank you, {confirmation.name}! Your reservation is pending confirmation.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-500 mb-2">Your ticket numbers:</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {confirmation.ticketNumbers.map((num) => (
                  <span
                    key={num}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-semibold"
                  >
                    #{num}
                  </span>
                ))}
              </div>
            </div>
            <Badge className="bg-yellow-100 text-yellow-800">Pending Confirmation</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableCount = tickets.filter((t) => t.status === "available").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">{session.sessionName}</h1>
          <p className="text-slate-500 mt-1">
            {availableCount} of {session.ticketLimit} tickets available
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Select Your Tickets</CardTitle>
            <CardDescription>
              Click on available ticket numbers to select them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
              {tickets.map((ticket) => {
                const isSelected = selectedTickets.includes(ticket.ticketNumber);
                const isAvailable = ticket.status === "available";
                return (
                  <button
                    key={ticket.ticketNumber}
                    disabled={!isAvailable}
                    onClick={() => toggleTicket(ticket.ticketNumber)}
                    className={`
                      aspect-square rounded-lg text-sm font-medium transition-all
                      ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                          : isAvailable
                          ? "bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50"
                          : ticket.status === "pending"
                          ? "bg-yellow-50 border-2 border-yellow-200 text-yellow-500 cursor-not-allowed"
                          : "bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed"
                      }
                    `}
                  >
                    {ticket.ticketNumber}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Your Information</CardTitle>
            <CardDescription>Fill in your details to complete the reservation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., +1 234 567 8900"
                className="mt-1"
              />
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500 mb-2">Selected tickets:</p>
              {selectedTickets.length === 0 ? (
                <p className="text-slate-400 text-sm">No tickets selected</p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {selectedTickets.map((num) => (
                    <span
                      key={num}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-semibold"
                    >
                      #{num}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-6 text-base"
            >
              {submitting ? "Submitting..." : "Submit Reservation"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}