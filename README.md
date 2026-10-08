# Loop · Campus Toto booking

**Small rides. Stronger connections.**

**Built by Nexus Titans · `vibe-1-nexus-titans`**

## Open the live application

### [Open Loop →](https://vibe-1-nexus-titans.vercel.app)

**For teachers and evaluators:** click the link above to use the working application. No download, Node.js installation, MongoDB setup, or shared Wi-Fi is required. The application runs on Vercel and stores its records in MongoDB Atlas.

- [Create a Student or Employee account](https://vibe-1-nexus-titans.vercel.app/signup)
- [Sign in to an existing account](https://vibe-1-nexus-titans.vercel.app/login)
- For **Rider access**, obtain the application password privately from Nexus Titans. The rider email is `rider@lawazia.org`. Rider registration is intentionally unavailable on the public signup page.

> The live app uses the accounts registered on the Atlas version. The local demo accounts listed near the bottom of this README do **not** work on the live app. No live passwords or database credentials are published here.

## Loop Interactive

**Inspiring mobility and technology.**

Loop is a campus mobility app by **Loop Interactive**, built by Nexus Titans.

## About and maintainers

Made and maintained by **Subendu Kundu — Principal Engineer** and **Hemant Kumar Rawani — Lead Engineer**. [Meet the team](https://vibe-1-nexus-titans.vercel.app/about).

> Existing rider email, passwords, accounts, and trip records continue to work after the Loop rebrand. The database name and existing account email addresses retain their original identifiers.

## Group passengers

Group requests can include registered accounts and manually named guest passengers. Guests do not need to sign in. Their Boarded or Missed results stay in the trip record and rider log. Guest entries are not automatically linked to accounts or personal histories.

## What the project does

Loop has one campus Toto and three fixed stops: **College**, **Railway Station**, and **Office**. Students and employees request solo or group rides. The rider accepts a request, marks each passenger **Boarded** or **Missed**, and completes the trip. Passenger histories and the rider's trip log retain the boarding results.

There are no GPS, map, fare, or multiple-vehicle features. The interface combines warm white surfaces, charcoal campus scenes and orange accents, with interactive stop exploration, route shortcuts, trip search and responsive layouts.

## Teacher's end-to-end testing guide

This walkthrough covers the three required checks: competing requests, three-person boarding, and persistent histories.

### 1. Prepare three passenger accounts and one rider session

Use these labels to keep the demonstration clear:

| Test participant | Role | What they will do |
| --- | --- | --- |
| Passenger A | Student | Submit the three-person group request; Boarded |
| Passenger B | Employee | Submit a competing request; Boarded on the accepted group trip |
| Passenger C | Student or Employee | Join the group; Missed |
| Rider | Rider | Accept the group request, mark passengers, and complete the trip |

1. Open the live app and choose **Create an account**.
2. Register A, B, and C with different email addresses and passwords of **10–128 characters**. Choose each account's role as shown above. Existing registered accounts can also be used.
3. Make sure all three passenger accounts exist **before** searching for group members.
4. Keep A and B signed in on separate laptops or separate browser sessions. Use a different browser or private/incognito window for the rider. Ordinary tabs in one browser share the same login cookie, so they are not separate accounts.
5. Sign in to the rider session with the credentials provided privately by Nexus Titans.

All ride times in the interface are **IST (Asia/Kolkata)**. Choose a future date within 90 days and an unused time on a 30-minute boundary, such as tomorrow at **10:00 AM**. Use the **same date and time** for both competing requests. Avoid reusing a slot reserved by an earlier demonstration.

### 2. Student steps — Passenger A

1. Open **Overview** and find **Request a ride**.
2. Select **With my group**.
3. Choose **FROM: College** and **TO: Railway Station**.
4. Choose the agreed future **Date** and **Departure time**.
5. In **Find a passenger by name or email**, search for Passenger B using at least two characters, then click the matching account.
6. Repeat for Passenger C. A is included automatically; confirm the passenger count is **3 listed**.
7. Click **Request a ride**.
8. Find the new request under **Your rides**. It should show **Awaiting rider**.

### 3. Employee steps — Passenger B

Complete these steps **before the rider accepts either request**:

1. Open **Overview → Request a ride**.
2. Select **Just me**.
3. Choose **College → Railway Station**.
4. Select the **exact same date and departure time** used by Passenger A.
5. Click **Request a ride**.
6. Initially the separate request should show **Awaiting rider**. B may also see A's group trip because B is listed as a passenger on it.
7. Wait for the rider to accept A's group request in the next section.

### 4. Rider steps — accept the correct request and check the conflict

1. Open **Ride requests** and leave the filter on **All requests**.
2. Locate the request **by Passenger A** with **3 passengers** at the agreed date and time.
3. Click **Accept** on that request, or open its details and click **Accept and reserve Toto**.
4. Confirm A's group request changes to **Confirmed**.
5. Confirm B's separate one-person request changes to **Slot unavailable**. This is the expected scheduling conflict; it cannot be accepted.
6. In the passenger sessions, refresh or wait up to **15 seconds** for the status change. B should see both the confirmed group trip and the conflicting solo request.

**Expected check 1:** one request is accepted and the competing request is flagged as a conflict. A pending request by itself does not reserve the vehicle; acceptance does.

### 5. Rider steps — record two Boarded and one Missed

1. Open the **Confirmed** three-person group trip by clicking its route or view arrow. You can also use **View trip** in the rider's main card.
2. For the pickup demonstration, click **Arrived · Start pickup**. The trip changes to **In progress**.
3. In **Passenger list**, mark:
   - Passenger A: **Boarded**
   - Passenger B: **Boarded**
   - Passenger C: **Missed**
4. Confirm the screen reflects each person's individual result.
5. Notice that **Drop complete · End trip** stays disabled until every passenger has been marked.
6. After recording all three statuses, click **Drop complete · End trip** to simulate drop completion. In actual use, the rider should click it only after reaching the destination.
7. Confirm the trip is **Completed**. Its passenger results are saved and cannot be edited through the completed-trip screen.

**Expected check 2:** the three-person pickup records exactly two Boarded passengers and one Missed passenger.

### 6. Student and Employee steps — verify personal histories

1. In Passenger A's session, refresh and open **My history**. Find the completed trip and confirm A's result is **boarded**.
2. In Passenger B's session, refresh and open **My history**. Find the same completed group trip and confirm B's result is **boarded**.
3. Sign in as Passenger C using a separate session or after signing out. Open **My history** and confirm the trip appears with C's result **missed**.
4. Click a trip's route or view arrow to inspect its passenger record.
5. Refresh or sign out and back in: the completed trip and boarding results should still be present.

The conflicting solo request remains in **Overview** as **Slot unavailable**. It is not a completed trip and does not appear as completed history.

### 7. Rider steps — verify the full trip log

1. Open **Trip log** in the rider session.
2. Find the completed three-person trip.
3. Open it and confirm the route, date/time, requester, and all three passenger results are recorded.

**Expected check 3:** both Boarded passengers see the trip in their personal histories, the Missed passenger also retains their result, and the accepting rider sees it in the completed trip log.

### Optional additional checks

- **Solo ride:** submit a new **Just me** request at another unused future slot. It should list one passenger.
- **Already reserved slot:** after acceptance, submit another request for that reserved time. It should immediately show **Slot unavailable**.
- **One active vehicle:** accept requests in two adjacent unused slots. Start one; attempting to start the other before completing the first should be rejected. Finish marking and completing the first demonstration trip afterward.
- **Roles:** Student and Employee accounts can request rides but cannot accept trips or record boarding.

## Common questions during the demonstration

| What you see | What to do / what it means |
| --- | --- |
| **Slot unavailable** | Another trip reserved the interval. In the rider session, inspect **Confirmed** requests. For a fresh test, choose an unused future slot. Conflicting requests cannot be accepted. |
| Group passenger cannot be found | Ask them to register first. Search their registered name or email using at least two characters. Rider accounts cannot be added as passengers. |
| No **Accept** button | Use the rider account and a future request showing **Awaiting rider**. Accepted, conflicting, or past requests cannot be accepted again. |
| End-trip button disabled | Mark every listed passenger Boarded or Missed first. |
| Completed ride disappeared from Overview | Open **My history** as a passenger or **Trip log** as the rider. Completed trips are displayed there. |
| Other account's change is not visible yet | Refresh the page or wait up to 15 seconds. |
| Email or password is incorrect | Use your own registered live account. Local demo credentials do not work on the live site. Ask Nexus Titans privately for rider access. |
| Changing one tab changes another tab's account | Tabs in the same browser share cookies. Use separate browsers, profiles, private sessions, or laptops. |
| A localhost or Wi-Fi link will not open | Use [the public HTTPS application](https://vibe-1-nexus-titans.vercel.app). The local instructions below are only for developers running their own copy. |

## Technical overview

| Layer | Implementation |
| --- | --- |
| Interface and routing | Next.js App Router, React, TypeScript, CSS |
| Backend | Next.js API route handlers running on Node.js |
| Database | MongoDB Atlas using the official MongoDB Node.js driver |
| Authentication | Custom salted scrypt password hashing and database-backed sessions |
| Authorization | Student, Employee, and Rider permissions checked on the server |
| Scheduling | Custom interval checks inside MongoDB transactions with a shared vehicle document |
| Hosting | Vercel; private server environment variables hold the database configuration |

No ready-made authentication or booking SDK is used. The MongoDB driver is used for database communication.

### Booking and record rules

- Default reservations last **30 minutes**, configurable through `SLOT_MINUTES`.
- Origins and destinations must be different members of the three fixed stops.
- The requester is always included; group passengers are registered students or employees linked by account IDs with name/email snapshots.
- Acceptance reserves `[startsAt, endsAt)`. Overlapping pending requests are flagged as conflicts, and later requests for reserved intervals are flagged immediately.
- Schedule mutations write the same vehicle document inside a transaction before inspecting reservations. Concurrent accepts contend on that write and cannot both reserve an overlapping slot.
- Only one trip can be in progress. The accepting rider manages its boarding and completion.
- Completed trips remain stored with their boarding results, including Missed passengers. Booking records have no automatic expiration.
- Durations are planned reservations; route travel time, GPS, and vehicle repositioning are not calculated.

### Source guide

| Location | Responsibility |
| --- | --- |
| `app/` | Pages and JSON API routes |
| `components/` | Authentication screens, booking form, rider pickup, histories |
| `lib/auth.ts` | Custom account authentication, hashing, sessions, rate limits |
| `lib/session.ts` | Cookie lookup and server-side role checks |
| `lib/bookings.ts` | Booking creation, conflict handling, pickup, boarding, completion, history |
| `lib/db.ts` | MongoDB connection reuse, indexes, transaction guard |
| `lib/config.ts` | Private MongoDB URI configuration |
| `scripts/seed.ts` | Rider provisioning |
| `scripts/demo.ts` | Local MongoDB demonstration |
| `tests/` | Database integration and configuration checks |

Collections: `users`, `sessions`, `bookings`, `vehicles`, and `rateLimits`. Passwords use salted scrypt. Session tokens are random, stored as hashes in MongoDB, expire after seven days, and are revoked on logout. Cookies are HTTP-only, SameSite=Lax, and Secure in production. Mutation routes validate their origin and JSON input; login/signup attempts are rate limited.

## Developer setup — optional

**Teachers using the live app can skip everything below.** These instructions are for running your own copy of the source code. Requires Node.js 22+ and npm.

### Run the local demonstration

```sh
npm install
npm run demo
```

Open `http://127.0.0.1:3000` on the computer running the command. The demo runs a real local MongoDB replica set and stores its data in ignored `.local/mongo-data`. The first run downloads MongoDB; the Windows archive is about 600 MB. Later runs reuse it.

The following accounts work **only in the local demo**, all with password `CampusRide!2026`:

| Role | Email |
| --- | --- |
| Student | student@lawazia.demo |
| Employee | employee@lawazia.demo |
| Rider | rider@lawazia.demo |
| Group member | rohan@lawazia.demo |
| Group member | ananya@lawazia.demo |

The local demo includes sample requests and history. These credentials are not live app credentials.

### Configure your own Atlas database

1. Create an Atlas account and a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create an application database user with read/write access to your app database and a private password.
3. Configure Atlas network access for your local machine or hosting provider.
4. Choose **Connect → Drivers → Node.js** and copy the connection URI.
5. Copy `.env.example` to `.env.local`. Set `MONGODB_URI`, `MONGODB_DB`, `APP_ORIGIN`, and your private rider credentials. If the URI contains `<db_password>`, set `MONGODB_PASSWORD` to the raw database-user password; the app safely URL-encodes it. If placing a password directly in the URI, URL-encode special characters yourself.
6. Match `APP_ORIGIN` to the exact browser origin, e.g. `http://127.0.0.1:3000` for local development or your HTTPS production URL.
7. Run `npm run seed` to create the rider, then `npm run dev`.
8. Register Student and Employee accounts through the app. The seed script does not reset an existing rider password.

Keep `.env.local`, MongoDB credentials, private rider passwords, and session tokens out of the public repository.

### Verification commands

```sh
npm run typecheck
npm test
npm run build
```

The six core integration checks passed during development: concurrent slot acceptance, three-person boarding and histories, single active vehicle, requests for reserved slots, server-side roles/validation, and password/session behavior. Configuration checks cover database-password encoding.

Integration tests create and remove an isolated test database. Run them with the local MongoDB replica set or a dedicated test environment, **not the restricted live Atlas account**. The separate manual walkthrough above verifies the deployed application.

### Hosting your own copy

Build with `npm run build` and run with `npm start`, or deploy to a Next.js-compatible Node hosting provider. Configure `MONGODB_URI`, `MONGODB_PASSWORD` when using a placeholder, `MONGODB_DB`, `SLOT_MINUTES`, and the deployed HTTPS `APP_ORIGIN` as private server environment variables. Leave `LOCAL_DEMO` unset and provision the rider privately. The backend requires the Node runtime for MongoDB TCP connections.

---

**Nexus Titans · Loop campus mobility**

© 2026 Loop Interactive. All rights reserved.
