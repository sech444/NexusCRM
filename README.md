# ⚡ NexusCRM

A web-based business management suite with sales tracking, stock control, and customer invoicing — built with Next.js 14 and Tailwind CSS.

---

## Modules

**Sales Pipeline**
- Kanban board across 6 deal stages (Lead → Won/Lost)
- Table view with filters by rep, stage, and date
- CSV report export
- Per-rep access control (sales reps see only their own deals)

**Stock Control**
- Live inventory counts with low-stock alerts
- Manual quantity adjustment (set / add / remove)
- Barcode scan support
- Category filtering and SKU search

**Customer Invoicing**
- Auto-numbered invoices (INV-0001, INV-0002…)
- Line items with tax calculation and live totals
- Payment status tracking (pending / paid / overdue)
- Print-to-PDF via browser

---

## Roles

| Role | Access |
|------|--------|
| **Admin** | Everything — all deals, invoices, inventory, user management |
| **Sales** | Own deals + pipeline, create and view invoices |
| **Warehouse** | Inventory screens only |

Roles are configurable from the Users panel — no code edits needed.

---

## Tech Stack

- **Frontend** — Next.js 14, React, Plus Jakarta Sans
- **Styling** — Tailwind CSS
- **Database** — PostgreSQL (schema in `db_schema.sql`)
- **Auth** — JWT + bcrypt
- **Hosting** — Vercel

---

## Getting Started

```bash
git clone https://github.com/sech444/NexusCRM.git
cd NexusCRM
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@crm.com | admin123 |
| Sales | sarah@crm.com | sales123 |
| Warehouse | mike@crm.com | warehouse123 |

> Change all passwords before deploying to production.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL=postgresql://user:password@host:5432/nexuscrm
JWT_SECRET=your-64-char-random-secret
BCRYPT_ROUNDS=12
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Deployment

Deployed on Vercel. Push to `main` to trigger a new deployment.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sech444/NexusCRM)

---

## Database

The full PostgreSQL schema is in `db_schema.sql`. It includes:

- Users with role-based permissions
- Products with stock adjustment audit trail
- Deals with stage change history
- Customers and auto-numbered invoices
- Computed views for pipeline summary, invoice totals, and low-stock alerts

---

## License

MIT
