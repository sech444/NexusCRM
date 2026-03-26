# NexusCRM — Administrator Guide

> Version 1.0 · March 2026

---

## 1. Quick Start

### Demo Accounts (development only)

| Role      | Email              | Password     | Access |
|-----------|--------------------|--------------|--------|
| Admin     | admin@crm.com      | admin123     | Everything |
| Sales Rep | sarah@crm.com      | sales123     | Sales + Invoices |
| Warehouse | mike@crm.com       | warehouse123 | Inventory only |

**Change all passwords before going live.** See §3 for instructions.

---

## 2. Recommended Production Stack

```
Frontend:  Next.js 14 (App Router)
Backend:   Next.js API Routes  OR  Express.js
Database:  PostgreSQL 14+ (Supabase, Neon, or self-hosted)
ORM:       Prisma 5
Auth:      JWT (jsonwebtoken) + bcrypt (cost 12)
Hosting:   Vercel (frontend) + Railway / Render (API + DB)
Storage:   Cloudinary (logo uploads, invoice attachments)
HTTPS:     Automatic via Vercel/Railway; self-hosted → Nginx + Let's Encrypt
```

### Environment Variables

Create a `.env` file (never commit to git):

```env
DATABASE_URL="postgresql://user:password@host:5432/nexuscrm?schema=public"
JWT_SECRET="replace-with-64-char-random-string"
BCRYPT_ROUNDS=12
NEXT_PUBLIC_APP_URL="https://crm.yourcompany.com"

# Optional future integrations
RESEND_API_KEY=""          # email sending
STRIPE_SECRET_KEY=""       # payment processing
XERO_CLIENT_ID=""          # accounting sync
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 3. User Management

### Adding a New User (Admin UI)

1. Sign in as an admin → click **Users** in the sidebar.
2. Click **+ Add User** → fill in name, email, password, role, department.
3. Click **Create User** — the account is active immediately.

### Changing a User's Role

1. Users → find the user → click **Edit**.
2. Change the **Role** dropdown → click **Update User**.
3. Role change takes effect on the user's next page load (JWT re-issued at next login).

### Role Capabilities (Quick Reference)

| Feature | Admin | Sales | Warehouse |
|---------|-------|-------|-----------|
| Dashboard | ✓ All KPIs | ✓ Own KPIs | ✗ |
| All deals | ✓ | ✗ | ✗ |
| Own deals | ✓ | ✓ | ✗ |
| Move deal stages | ✓ | ✓ | ✗ |
| Delete deals | ✓ | ✗ | ✗ |
| Inventory view | ✓ | ✗ | ✓ |
| Stock adjustment | ✓ | ✗ | ✓ |
| Create invoice | ✓ | ✓ | ✗ |
| Mark invoice paid/overdue | ✓ | ✗ | ✗ |
| User management | ✓ | ✗ | ✗ |

### Adding a Custom Role (future)

1. Add the new value to the `user_role` Postgres enum:
   ```sql
   ALTER TYPE user_role ADD VALUE 'manager';
   ```
2. Add the module list to `ROLE_MODULES` in `App.jsx`:
   ```js
   manager: ["dashboard", "sales", "invoices"],
   ```
3. Deploy. No other code changes needed — the sidebar, header, and permission guards all read from that map.

### Resetting a Password

Via the Admin UI: Users → Edit → enter new password → Update.

Via SQL (emergency):
```sql
UPDATE users
SET password_hash = crypt('newpassword', gen_salt('bf', 12))
WHERE email = 'user@company.com';
```

---

## 4. Database Backups

### Automated Backups (Recommended)

If hosted on **Supabase** or **Neon**: backups run automatically every 24 hours with point-in-time recovery. Enable via their dashboard — no configuration required.

If self-hosted, add this cron job (`crontab -e`):

```cron
# Daily backup at 02:00, keep 30 days
0 2 * * * pg_dump -Fc $DATABASE_URL > /backups/nexuscrm_$(date +\%Y\%m\%d).dump && find /backups -name '*.dump' -mtime +30 -delete
```

### Manual Backup

```bash
# Dump (compressed)
pg_dump -Fc -d $DATABASE_URL -f nexuscrm_backup.dump

# Restore to a new database
pg_restore -d $NEW_DATABASE_URL nexuscrm_backup.dump
```

### What gets backed up

The `pg_dump` above captures all tables, sequences (including the invoice number counter), views, functions, and seed data. It does **not** back up uploaded files — those should be stored in Cloudinary or S3 with their own versioning.

---

## 5. Configuration Reference

### Changing the Company Name / Logo

In `NexusCRM.jsx`, search for `NexusCRM` — it appears in the sidebar, login screen, and invoice header. Replace with your brand name. To add a logo image, swap the `⚡` emoji with an `<img src={logoUrl} />` tag.

### Tax Rate Default

Invoice creation defaults to **10%**. Change the `tax: 10` default in the `blank` form object inside `InvoicesModule`. To make it configurable per-region, store it in a `settings` table and load it on app start.

### Invoice Numbering

The sequence starts at `INV-0001` and auto-increments. If you need to reset it (e.g. new financial year):

```sql
-- Only do this if you archive old invoices first
ALTER SEQUENCE invoice_seq RESTART WITH 1;
```

### Low-Stock Threshold

Each product has its own `min_qty`. Change it per-item in the Inventory → Adjust modal (warehouse staff can do this). To bulk-update:

```sql
UPDATE products SET min_qty = 10 WHERE category = 'Software';
```

---

## 6. HTTPS & Security Checklist

Before going live, verify:

- [ ] All passwords changed from demo values (`admin123`, `sales123`, `warehouse123`)
- [ ] `JWT_SECRET` is a cryptographically random 64-char string
- [ ] HTTPS is enabled (Vercel/Railway: automatic; self-hosted: Nginx + Certbot)
- [ ] Database is not publicly accessible (use connection pooling via PgBouncer or Supabase's pooler)
- [ ] `.env` is in `.gitignore`
- [ ] CORS restricted to your domain in the API layer
- [ ] Rate limiting on `/api/auth/login` (e.g. express-rate-limit: 5 attempts / 15 min)
- [ ] HTTP security headers set (use `next/headers` or Helmet.js)

---

## 7. Future Integration Hooks

The architecture is ready for these — no schema changes needed:

### Email (Resend / SendGrid)
Trigger after `invoices.status` changes to `pending` → send a PDF to `customers.email`.
```js
await resend.emails.send({ from: '...', to: customer.email, subject: `Invoice ${inv.invoice_number}` });
```

### Accounting (Xero / QuickBooks)
On invoice `paid`: push a payment record via their API. Map `customers.tax_id` to the Xero contact's `TaxNumber`.

### Payments (Stripe)
Add a `stripe_payment_intent_id` column to `invoices`. Generate a Stripe payment link on invoice creation; webhook updates `status → paid` automatically.

### Barcode Hardware
The barcode field in Inventory accepts any string. USB/Bluetooth barcode scanners emit keystrokes directly into the input — no driver needed. For mobile scanning, integrate the `html5-qrcode` library.

---

## 8. Handover Checklist

Items to cover in the 1-hour handover call:

1. Walk through all three modules as each demo role
2. Create a test deal → move it through all pipeline stages
3. Adjust inventory qty via the UI and via a simulated barcode scan
4. Create a new invoice → view it → mark paid → print to PDF
5. Add a new user, assign a role, log in as that user to verify access
6. Show how to run a manual database backup and restore it to a staging environment
7. Review the `.env` variables and confirm production values are set
8. Confirm HTTPS is active on the production domain

---


