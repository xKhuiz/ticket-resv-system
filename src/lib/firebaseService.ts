import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db, auth, googleProvider } from "./firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const onAuthChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const signOut = async () => {
  await firebaseSignOut(auth);
};

const ticketRef = (sessionId: string, ticketNum: number) =>
  doc(db, "sessions", sessionId, "tickets", `ticket_${ticketNum}`);

export const createSession = async (
  sessionName: string,
  ticketLimit: number,
  adminId: string
) => {
  const sessionRef = doc(collection(db, "sessions"));
  const shareableLink = `${window.location.origin}/s/${sessionRef.id}`;

  await setDoc(sessionRef, {
    sessionName,
    ticketLimit,
    status: "active",
    shareableLink,
    createdAt: serverTimestamp(),
    createdBy: adminId,
  });

  const batch = writeBatch(db);
  for (let i = 1; i <= ticketLimit; i++) {
    batch.set(ticketRef(sessionRef.id, i), {
      ticketNumber: i,
      status: "available",
      bookingId: null,
    });
  }
  await batch.commit();

  return {
    id: sessionRef.id,
    sessionName,
    ticketLimit,
    status: "active" as const,
    shareableLink,
    createdAt: new Date().toISOString(),
    createdBy: adminId,
  };
};

export const getAllSessions = async () => {
  const sessionsRef = collection(db, "sessions");
  const q = query(sessionsRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((sessionDoc) => ({
    id: sessionDoc.id,
    ...sessionDoc.data(),
  }));
};

export const getSession = async (sessionId: string) => {
  const sessionDoc = await getDoc(doc(db, "sessions", sessionId));
  if (sessionDoc.exists()) {
    return { id: sessionDoc.id, ...sessionDoc.data() };
  }
  return null;
};

export const updateSessionStatus = async (
  sessionId: string,
  status: string = "closed"
) => {
  await updateDoc(doc(db, "sessions", sessionId), { status });
};

export const createBooking = async (
  sessionId: string,
  name: string,
  phoneNumber: string,
  ticketNumbers: number[]
) => {
  const sessionRef = doc(db, "sessions", sessionId);
  const bookingRef = doc(collection(db, "sessions", sessionId, "bookings"));

  await runTransaction(db, async (transaction) => {
    const sessionDoc = await transaction.get(sessionRef);
    if (!sessionDoc.exists()) {
      throw new Error("Session not found");
    }
    if (sessionDoc.data().status !== "active") {
      throw new Error("Session is closed");
    }

    for (const ticketNum of ticketNumbers) {
      const ticketDoc = await transaction.get(ticketRef(sessionId, ticketNum));
      if (!ticketDoc.exists() || ticketDoc.data().status !== "available") {
        throw new Error(`Ticket ${ticketNum} is not available`);
      }
    }

    transaction.set(bookingRef, {
      name,
      phoneNumber,
      ticketNumbers,
      status: "pending",
      createdAt: serverTimestamp(),
      approvedAt: null,
      approvedBy: null,
    });

    for (const ticketNum of ticketNumbers) {
      transaction.update(ticketRef(sessionId, ticketNum), {
        status: "pending",
        bookingId: bookingRef.id,
      });
    }
  });

  return bookingRef.id;
};

export const getSessionBookings = async (sessionId: string) => {
  const bookingsRef = collection(db, "sessions", sessionId, "bookings");
  const q = query(bookingsRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((bookingDoc) => ({
    id: bookingDoc.id,
    ...bookingDoc.data(),
  }));
};

export const updateBookingStatus = async (
  sessionId: string,
  bookingId: string,
  status: string,
  adminId: string
) => {
  const bookingRef = doc(db, "sessions", sessionId, "bookings", bookingId);

  await runTransaction(db, async (transaction) => {
    const bookingDoc = await transaction.get(bookingRef);
    if (!bookingDoc.exists()) {
      throw new Error("Booking not found");
    }

    const bookingData = bookingDoc.data();

    transaction.update(bookingRef, {
      status,
      approvedAt: status === "confirmed" ? serverTimestamp() : null,
      approvedBy: status === "confirmed" ? adminId : null,
    });

    for (const ticketNum of bookingData.ticketNumbers) {
      if (status === "confirmed") {
        transaction.update(ticketRef(sessionId, ticketNum), { status: "confirmed" });
      } else if (status === "rejected" || status === "cancelled") {
        transaction.update(ticketRef(sessionId, ticketNum), {
          status: "available",
          bookingId: null,
        });
      }
    }
  });
};

export const getTicketAvailability = async (sessionId: string) => {
  const ticketsRef = collection(db, "sessions", sessionId, "tickets");
  const querySnapshot = await getDocs(ticketsRef);
  return querySnapshot.docs
    .map((ticketDoc) => ({
      id: ticketDoc.id,
      ...ticketDoc.data(),
    }))
    .sort((a: any, b: any) => a.ticketNumber - b.ticketNumber);
};

export const getSessionByLink = async (link: string) => {
  const sessionId = link.split("/").filter(Boolean).pop() || link;
  return getSession(sessionId);
};
