# 🚀 CRM Pro — Enterprise CRM System

A production-grade, full-stack **Customer Relationship Management (CRM) system** for managing leads, customers, sales pipelines, follow-ups, tasks, team members, and analytics — built as a real SaaS product, not a CRUD demo.

![Stack](https://img.shields.io/badge/Stack-MERN-blue) ![Auth](https://img.shields.io/badge/Auth-JWT%20%2B%20RBAC-green) ![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)

---

## 1. Project Overview

CRM Pro gives sales teams a single platform to run their entire operation:

- **Capture & qualify leads** with intelligent duplicate prevention
- **Convert leads** into customers and opportunities in one click
- **Move deals** through a drag-and-drop visual sales pipeline
- **Never miss a follow-up** with scheduled reminders and overdue detection
- **See every customer** in a 360° profile with full activity history
- **Measure everything** with real-time dashboards and exportable reports
- **Stay secure** with JWT auth, role-based access control, rate limiting, and audit logs

> **Demo accounts** (auto-seeded):
> | Role | Email | Password |
> |------|-------|----------|
> | 👑 Admin | `admin@crm.com` | `Admin@123` |
> | 👨‍💼 Sales Manager | `manager@crm.com` | `Manager@123` |
> | 👨‍💻 Executive | `john@crm.com` | `John@123` |
> | 👨‍💻 Executive | `jane@crm.com` | `Jane@123` |

---

## 2. Features

### Core CRM

- ✅ **Authentication** — register, login, refresh-token rotation, secure httpOnly cookies, bcrypt password hashing
- ✅ **Role-Based Access Control** — enforced on the **backend**, not just the UI (Admin / Sales Manager / Sales Executive)
- ✅ **Lead Management** — create, edit, assign, reassign, search, filter, sort, paginate, tag, add notes
- ✅ **Duplicate Lead Prevention** — detects duplicates by email, phone, or company + name
- ✅ **Lead Conversion** — convert qualified leads into Customer + Opportunity atomically
- ✅ **Customer 360° Profile** — contact info, purchase history, opportunities, tasks, follow-ups, interaction timeline
- ✅ **Sales Pipeline** — Kanban board with drag-and-drop stage changes, weighted pipeline value, win/loss tracking
- ✅ **Follow-up Management** — schedule calls, meetings, emails, demos; auto-mark overdue
- ✅ **Task Management** — assign, prioritize, complete, and track overdue tasks
- ✅ **Interaction Timeline** — every phone call, email, meeting, status change, and assignment is recorded
- ✅ **Notifications** — in-app bell with unread counts for assignments, reminders, and deal changes
- ✅ **Reports & Analytics** — revenue by employee/month/source, lead analytics, customer growth, CSV export
- ✅ **Audit Logs** — every important action tracked with user, IP, and metadata (admin-only view)
- ✅ **Automated Jobs** — cron-based follow-up reminders and overdue detection (no frontend timers)

### UI/UX

- 🎨 Modern SaaS design with **dark mode**
- 📱 Fully responsive with mobile-friendly navigation
- 💀 Loading skeletons, empty states, and error states
- 🔔 Toast notifications and confirmation dialogs
- 📊 Interactive charts (Recharts)

---

## 3. Tech Stack

| Layer          | Technology                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| **Frontend**   | React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Recharts, Axios |
| **Backend**    | Node.js, Express.js, JWT, bcryptjs, express-validator, node-cron                                              |
| **Database**   | MongoDB with Mongoose ODM (indexed, normalized schema)                                                        |
| **Testing**    | Jest + Supertest + mongodb-memory-server (36 integration tests)                                               |
| **Deployment** | Vercel (frontend), Render/Railway (backend), MongoDB Atlas (database)                                         |

---

## 4. Architecture

```
crm-system/
├── server/                        # Backend (Express + MongoDB)
│   ├── config/                    # Env config, centralized settings
│   ├── controllers/               # Request handlers (thin)
│   ├── routes/                    # REST route definitions
│   ├── models/                    # Mongoose schemas (9 entities)
│   ├── services/                  # Business logic layer
│   ├── middleware/                # Auth, RBAC, validation, audit, errors
│   ├── validators/                # express-validator rules
│   ├── utils/                     # AppError, APIFeatures, helpers
│   ├── jobs/                      # node-cron scheduled jobs
│   ├── database/                  # Connection + seed script
│   ├── tests/                     # Jest integration tests
│   ├── app.js                     # Express app (middleware chain)
│   └── server.js                  # Entry point
│
└── client/                        # Frontend (React + Vite + TS)
    ├── src/
    │   ├── components/            # Reusable UI (table, modal, badges...)
    │   ├── layouts/               # App layout with sidebar + header
    │   ├── pages/                 # Route-level pages
    │   ├── features/              # Feature-scoped modules
    │   ├── hooks/                 # useDebounce, etc.
    │   ├── services/              # Axios client with token refresh
    │   ├── contexts/              # Auth + theme providers
    │   ├── utils/                 # Formatters, exporters
    │   └── types/                 # TypeScript interfaces
    └── vite.config.ts             # Dev proxy /api → :5000
```

### Request Flow

```
React UI → Axios (JWT interceptor) → Express Router → Validators → Auth/RBAC Middleware
        → Controller → Service → Mongoose → MongoDB
        → Response (uniform { success, message, data, pagination })
```

---

## 5. Database Schema

| Entity           | Key Fields                                                                                               | Indexes                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **User**         | name, email, password (hashed), role (`admin`/`manager`/`executive`), department, refreshToken           | email, role                                               |
| **Lead**         | name, company, email, phone, source, industry, status, priority, assignedTo, estimatedValue, tags, notes | email, phone, company+name, status, assignedTo, createdAt |
| **Customer**     | name, company, email, phone, address, industry, status, totalPurchases, leadSource                       | email, phone, company+name, status, assignedTo            |
| **Opportunity**  | title, customer, lead, assignedTo, stage, expectedValue, probability, closingDate                        | stage, assignedTo, customer, expectedClosingDate          |
| **Task**         | title, description, assignedTo, priority, dueDate, relatedTo (polymorphic), status                       | assignedTo, status, dueDate, priority                     |
| **FollowUp**     | title, assignedTo, lead/customer/opportunity, followUpDate, status                                       | assignedTo, followUpDate, status, customer                |
| **Interaction**  | type, subject, description, lead/customer/opportunity, performedBy                                       | lead, customer, performedBy, createdAt                    |
| **Notification** | user, type, title, message, relatedTo, isRead                                                            | user+isRead, createdAt                                    |
| **AuditLog**     | user, action, entity, entityId, description, ipAddress, metadata                                         | user, action, entity, createdAt                           |

### Relationships

```
User 1──N Leads, Customers, Opportunities, Tasks, FollowUps
Lead 1──1 Customer (convertedToCustomer)
Lead 1──1 Opportunity (convertedToOpportunity)
Customer 1──N Opportunities, Interactions, Tasks, FollowUps
Opportunity 1──N Tasks, FollowUps, Interactions
User 1──N Notifications
User 1──N AuditLogs
```

---

## 6. API Documentation

Base URL: `http://localhost:5000/api` · Auth: `Authorization: Bearer <accessToken>`

### Authentication

| Method | Endpoint         | Description             | Access |
| ------ | ---------------- | ----------------------- | ------ |
| POST   | `/auth/register` | Create account          | Public |
| POST   | `/auth/login`    | Login, returns JWT pair | Public |
| POST   | `/auth/logout`   | Invalidate session      | All    |
| GET    | `/auth/me`       | Current user profile    | All    |
| POST   | `/auth/refresh`  | Rotate refresh token    | Public |

### Leads

| Method | Endpoint                                          | Description                       | Access |
| ------ | ------------------------------------------------- | --------------------------------- | ------ |
| GET    | `/leads?page&limit&search&status&source&priority` | List (server-paginated)           | All    |
| GET    | `/leads/:id`                                      | Lead detail                       | All    |
| POST   | `/leads`                                          | Create (409 on duplicate)         | All    |
| PATCH  | `/leads/:id`                                      | Update / reassign                 | All    |
| DELETE | `/leads/:id`                                      | Soft delete                       | All    |
| POST   | `/leads/:id/convert`                              | Convert to customer + opportunity | All    |

### Customers

| Method | Endpoint                              | Description                                                   |
| ------ | ------------------------------------- | ------------------------------------------------------------- |
| GET    | `/customers?page&limit&search&status` | List                                                          |
| GET    | `/customers/:id`                      | 360° profile (opportunities, interactions, tasks, follow-ups) |
| POST   | `/customers`                          | Create (409 on duplicate email/phone)                         |
| PATCH  | `/customers/:id`                      | Update                                                        |
| DELETE | `/customers/:id`                      | Soft delete                                                   |

### Opportunities

| Method | Endpoint                                 | Description                              |
| ------ | ---------------------------------------- | ---------------------------------------- |
| GET    | `/opportunities?page&limit&search&stage` | List                                     |
| GET    | `/opportunities/:id`                     | Detail                                   |
| POST   | `/opportunities`                         | Create                                   |
| PATCH  | `/opportunities/:id`                     | Update                                   |
| PATCH  | `/opportunities/:id/stage`               | Move pipeline stage (Won/Lost supported) |
| DELETE | `/opportunities/:id`                     | Soft delete                              |

### Tasks & Follow-ups

| Method       | Endpoint         | Description                               |
| ------------ | ---------------- | ----------------------------------------- |
| GET/POST     | `/tasks`         | List / create                             |
| PATCH/DELETE | `/tasks/:id`     | Update (complete with timestamp) / delete |
| GET/POST     | `/followups`     | List / schedule                           |
| PATCH/DELETE | `/followups/:id` | Update (complete/cancel) / delete         |

### Dashboard & Reports

| Method | Endpoint                 | Description                                                        |
| ------ | ------------------------ | ------------------------------------------------------------------ |
| GET    | `/dashboard/summary`     | KPI cards + upcoming follow-ups, overdue tasks, recent leads/deals |
| GET    | `/dashboard/revenue`     | Monthly won revenue                                                |
| GET    | `/dashboard/pipeline`    | Stage distribution + all opportunities                             |
| GET    | `/dashboard/performance` | Revenue by employee, win/loss, pipeline value                      |
| GET    | `/dashboard/charts`      | Lead sources, customer growth, lead status                         |

### Admin Only

| Method       | Endpoint     | Description                |
| ------------ | ------------ | -------------------------- |
| GET/POST     | `/users`     | List / create team members |
| PATCH/DELETE | `/users/:id` | Update roles / deactivate  |
| GET          | `/audit`     | Audit log trail            |

### Notifications

| Method | Endpoint                      | Description          |
| ------ | ----------------------------- | -------------------- |
| GET    | `/notifications`              | List + unread count  |
| GET    | `/notifications/unread-count` | Unread badge count   |
| PATCH  | `/notifications/:id/read`     | Mark read (or `all`) |

---

## 7. Environment Variables

Copy each `.env.example` to `.env` and fill in real values. **Never commit `.env`.**

### Server (`server/.env`)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/crm
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

### Client (`client/.env`)

```env
VITE_API_URL=/api
```

---

## 8. Local Setup

> **Prerequisites:** Node.js ≥ 18, MongoDB (local or Atlas).

```bash
# 1. Clone & install
git clone <your-repo-url> crm-system
cd crm-system

# 2. Backend
cd server
npm install
cp .env.example .env        # add your MongoDB URI + secrets
npm run seed                # load demo data (optional but recommended)
npm run dev                 # → http://localhost:5000

# 3. Frontend (new terminal)
cd ../client
npm install
cp .env.example .env
npm run dev                 # → http://localhost:3000
```

### 🧪 Run the full stack with zero setup (in-memory DB)

```bash
cd server
node dev-runner.js          # starts in-memory MongoDB → seeds → boots API
```

---

## 9. Database Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Whitelist your IP and create a database user
3. Set `MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/crm`
4. Run `npm run seed` to populate demo data with indexes auto-created

---

## 10. Running the Frontend

```bash
cd client
npm run dev        # dev server with /api proxy to :5000
npm run build      # production build → dist/
npm run preview    # serve the production build
```

---

## 11. Running the Backend

```bash
cd server
npm run dev        # nodemon watch mode
npm start          # production mode
npm run seed       # reset + seed demo data
```

---

## 12. Testing

```bash
cd server
npm test           # 36 integration tests (Jest + Supertest + in-memory MongoDB)
```

Coverage includes:

- ✅ Authentication (register, login, token protection, password hashing)
- ✅ Leads (CRUD, duplicate detection, pagination, search, filter)
- ✅ RBAC (admin-only routes denied for manager/executive, executive data scoping)
- ✅ Critical workflows (register→lead→convert→win→revenue; follow-up lifecycle; task completion)

---

## 13. Deployment

### Backend → Render / Railway

1. Push the repo to GitHub
2. On Render, create a **Web Service** → connect repo → root dir: `server`
3. Build: `npm install` · Start: `npm start`
4. Add env vars (see §7) — point `MONGODB_URI` at Atlas
5. Set `CORS_ORIGIN` to your Vercel URL

### Frontend → Vercel

1. On Vercel, import the repo → root dir: `client`
2. Build: `npm run build` · Output: `dist`
3. Env: `VITE_API_URL=https://<your-backend>.onrender.com/api`
4. Deploy 🎉

### Database → MongoDB Atlas

Managed, indexed, auto-backup. See §9.

---

## 14. Security Checklist

- [x] bcrypt password hashing (12 salt rounds)
- [x] JWT access (15m) + refresh (7d) token architecture
- [x] httpOnly, Secure, SameSite cookies
- [x] Role-based authorization on every protected route
- [x] express-validator input validation on all mutations
- [x] Rate limiting (global + strict auth limiter)
- [x] Helmet secure headers + CORS whitelist
- [x] NoSQL-injection-safe queries (Mongoose)
- [x] XSS protection (helmet + React escaping)
- [x] 10kb request body limit
- [x] No secrets in code — `.env` only, `.gitignore` enforced
- [x] Full audit logging (user, action, entity, IP)

---

## 15. Future Improvements

- 🤖 AI lead scoring & sales recommendations
- 📧 Email / WhatsApp / Google Calendar integrations
- 🔔 Real-time notifications (WebSockets)
- 📈 Sales forecasting & predictive analytics
- 🏷️ Multi-tenant workspaces
- 📱 PWA support
- 🤝 Team chat
- 💬 Customer support tickets & satisfaction surveys

---

## License

MIT — free for personal and commercial use.
