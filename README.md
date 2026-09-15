# Ticket Reservation System

Admin-managed ticket sessions with shareable guest booking links. Data is stored in Firebase Auth and Cloud Firestore.

## Features

- Google sign-in for admins
- Create sessions (1–200 tickets) and copy a shareable link
- Guests pick ticket numbers and submit name/phone
- Admins approve, reject, or cancel bookings and close sessions

## Tech stack

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Firebase Auth, Cloud Firestore

## Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and add your Firebase web app config.

3. In Firebase Console, enable **Google** sign-in and create a **Firestore** database. Publish the rules from `firestore.rules`.

4. Start the app:

```bash
npm run dev
```

Open `/admin` to sign in. Create a session, copy the link, and book tickets from that URL.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
