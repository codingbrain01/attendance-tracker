# AttendTrack

A role-based attendance tracking system built with React, TypeScript, and Tailwind CSS. Designed as a portfolio project — fully functional with no backend required. All data is stored locally in the browser using `localStorage`.

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Main Control | control@demo.com | Demo@1234 |
| Admin | admin@demo.com | Demo@1234 |
| Employee | alice@demo.com | Demo@1234 |

> Additional employee accounts: `bob@demo.com`, `carol@demo.com`, `david@demo.com`, `eva@demo.com` — all use `Demo@1234`.

A **Reset demo data** link on the login page wipes `localStorage` and restores the original seed data.

---

## Features

### Employee
- **Attendance** — Visual step tracker (Clock In → Break → Clock Out) with real-time state machine. Automatically detects late arrival and calculates overtime against the assigned shift.
- **Dashboard** — Hours worked today, this week, and this month; overtime hours; late day count; full attendance history table with status badges.
- **Profile** — View name, position, and role. Update email with live validation.

### Admin
- **Dashboard** — Clickable employee list; per-employee profile card with monthly hours, overtime, and late day totals; full attendance history.
- **Accounts** — Create employee accounts. Manage per-employee shifts (add/delete by date with start and end times).

### Main Control
- **Employees** — Full CRUD: create, edit, delete employee accounts.
- **Admins** — Full CRUD: create, edit, delete admin accounts.
- **Attendance** — View, edit, and delete all attendance logs across all employees. Filter by employee.
- **Shifts** — View, create, edit, and delete all shifts. Filter by employee.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Build | Vite 8 |
| State | React Context (AuthContext) |
| Storage | Browser `localStorage` (mock backend) |

---

## Project Structure

```
src/
├── lib/
│   ├── mockData.ts         # Seed users, shifts, and 14-day attendance history
│   ├── mockStore.ts        # localStorage read/write layer + resetDemoData()
│   └── timeUtils.ts        # Shared helpers: calcHoursWorked, formatHours,
│                           #   formatTime, formatDate, getInitials, etc.
├── types/
│   └── index.ts            # User, Shift, AttendanceLog, Role, ROLE_ROUTES
├── contexts/
│   └── AuthContext.tsx     # Auth state: user, signIn, signOut, refreshUser
├── services/               # All data access lives here — swap for a real API
│   ├── auth.service.ts
│   ├── employee.service.ts
│   ├── attendance.service.ts
│   └── shift.service.ts
├── routes/
│   └── ProtectedRoute.tsx  # Role guard; redirects wrong-role users to own page
├── components/
│   └── Modal.tsx           # Reusable modal with backdrop blur
└── pages/
    ├── auth/
    │   └── LoginPage.tsx   # Split-panel login with quick-login cards
    ├── employee/
    │   ├── EmployeePage.tsx
    │   ├── AttendanceTab.tsx
    │   ├── DashboardTab.tsx
    │   └── ProfileTab.tsx
    ├── admin/
    │   ├── AdminPage.tsx
    │   ├── DashboardTab.tsx
    │   └── AccountsTab.tsx
    └── main-control/
        ├── MainControlPage.tsx
        ├── UsersTab.tsx
        ├── AttendanceTab.tsx
        └── ShiftsTab.tsx
```

---

## Shift & Overtime Logic

- **Late** — employee clocked in after `shift_start`. Only flagged when a shift is assigned for that day.
- **Overtime** — minutes worked past `shift_end`. Stored as an integer in `overtime_minutes`.
- **No shift assigned** — late and overtime calculations are skipped entirely.
- Break time is excluded from total hours worked.

---

## Running Locally

```bash
npm install
npm run dev
```

---

## Swapping to a Real Backend

All data access is isolated inside `src/services/`. To connect a real backend (e.g. Supabase), replace the `localStorage` implementations in the four service files — the rest of the app requires no changes.

The expected database schema:

```sql
create table users (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  position    text not null,
  email       text not null,
  role        text not null check (role in ('main_control', 'admin', 'employee'))
);

create table shifts (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid references users(id) on delete cascade,
  date         date not null,
  shift_start  time not null,
  shift_end    time not null
);

create table attendance_logs (
  id               uuid primary key default gen_random_uuid(),
  employee_id      uuid references users(id) on delete cascade,
  date             date not null,
  time_in          time,
  break_start      time,
  break_end        time,
  time_out         time,
  is_late          boolean not null default false,
  overtime_minutes int     not null default 0
);
```
