import { useEffect, useState } from "react";
import { AdminLogin } from "@/components/AdminLogin";
import { UserBooking } from "@/components/UserBooking";
import { getSessionByLink } from "@/lib/firebaseService";

export default function App() {
  const [route, setRoute] = useState<"home" | "admin" | "user">("home");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentPath = window.location.pathname;

    // BASE_URL is "/ticket-resv-system/"
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

    // Converts:
    // /ticket-resv-system/admin → /admin
    // /ticket-resv-system/s/abc123 → /s/abc123
    const path = currentPath.startsWith(basePath)
      ? currentPath.slice(basePath.length)
      : currentPath;

    if (path === "/admin" || path.startsWith("/admin/")) {
      setRoute("admin");
      return;
    }

    if (path.startsWith("/s/")) {
      const link = path.split("/s/")[1];

      if (link) {
        setLoading(true);

        getSessionByLink(link)
          .then((foundSession) => {
            if (foundSession) {
              setSession(foundSession);
              setSessionId(foundSession.id);
              setRoute("user");
            } else {
              setRoute("home");
            }
          })
          .catch((error) => {
            console.error("Failed to load session:", error);
            setRoute("home");
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading session...</div>
      </div>
    );
  }

  if (route === "admin") {
    return <AdminLogin />;
  }

  if (route === "user" && sessionId && session) {
    return <UserBooking sessionId={sessionId} session={session} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-200">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          Ticket Reservation System
        </h1>

        <p className="text-slate-500">
          Manage ticket bookings with ease
        </p>

        <div className="flex gap-4 justify-center">
          <a
            href={`${import.meta.env.BASE_URL}admin`}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Admin Login
          </a>
        </div>
      </div>
    </div>
  );
}
