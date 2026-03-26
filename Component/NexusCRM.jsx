// Component/NexusCRM.jsx

import { useState, useRef } from "react";

/* ─── Global Style ─────────────────────────────────────────────────────── */
const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; }
    body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 18px; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: #f1f5f9; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    input, select, textarea, button { font-family: inherit; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .fu { animation: fadeUp .22s ease both; }
    @keyframes slideIn { from { transform: translateX(110%); } to { transform: none; } }
    .si { animation: slideIn .28s cubic-bezier(.22,1,.36,1) both; }
    @media print {
      .np { display: none !important; }
      
    }
  `}</style>
);

/* ─── Color Tokens ─────────────────────────────────────────────────────── */
const C = {
  sidebar: "#0D1424",
  accent: "#6366F1",
  accentFg: "#EEF2FF",
  bg: "#F1F5F9",
  card: "#FFFFFF",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
  warn: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
};

/* ─── Initial Data ─────────────────────────────────────────────────────── */
const INIT_USERS = [
  { id: 1, name: "Alex Morgan",  email: "admin@crm.com",     password: "admin123",     role: "admin",     dept: "Management" },
  { id: 2, name: "Sarah Chen",   email: "sarah@crm.com",     password: "sales123",     role: "sales",     dept: "Sales" },
  { id: 3, name: "Mike Torres",  email: "mike@crm.com",      password: "warehouse123", role: "warehouse", dept: "Operations" },
];

const STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];

const INIT_DEALS = [
  { id: 1, title: "Acme Corp — Website Redesign",  value: 12500, stage: "Proposal",    rep: "Sarah Chen",  product: "Web Services", date: "2026-03-10" },
  { id: 2, title: "TechVault — ERP Integration",   value: 45000, stage: "Negotiation", rep: "Sarah Chen",  product: "Enterprise",   date: "2026-03-12" },
  { id: 3, title: "BlueSky — Mobile App",           value: 28000, stage: "Qualified",   rep: "Alex Morgan", product: "Mobile",       date: "2026-03-15" },
  { id: 4, title: "NovaCom — Support Contract",     value:  8400, stage: "Won",         rep: "Sarah Chen",  product: "Support",      date: "2026-02-28" },
  { id: 5, title: "Sunrise — Analytics Setup",      value: 15600, stage: "Lead",        rep: "Alex Morgan", product: "Analytics",    date: "2026-03-20" },
  { id: 6, title: "DataFlow — CRM Migration",       value: 32000, stage: "Proposal",    rep: "Sarah Chen",  product: "Enterprise",   date: "2026-03-18" },
];

const INIT_INV = [
  { id: 1, sku: "WS-001",  name: "Web Services Package",  cat: "Services",       qty: 99, min: 5,  price: 2500, barcode: "1234567890" },
  { id: 2, sku: "ENT-010", name: "Enterprise License",    cat: "Software",       qty: 12, min: 5,  price: 8000, barcode: "2345678901" },
  { id: 3, sku: "MOB-005", name: "Mobile App Module",     cat: "Software",       qty:  4, min: 8,  price: 4500, barcode: "3456789012" },
  { id: 4, sku: "SUP-012", name: "Premium Support Plan",  cat: "Services",       qty:  6, min: 10, price: 1200, barcode: "4567890123" },
  { id: 5, sku: "ANA-003", name: "Analytics Dashboard",   cat: "Software",       qty: 18, min: 5,  price: 3200, barcode: "5678901234" },
  { id: 6, sku: "CLO-007", name: "Cloud Storage (TB)",    cat: "Infrastructure", qty:  3, min: 10, price:  800, barcode: "6789012345" },
  { id: 7, sku: "SEC-002", name: "Security Audit",        cat: "Services",       qty: 15, min: 3,  price: 5000, barcode: "7890123456" },
  { id: 8, sku: "TRN-001", name: "Training Session",      cat: "Services",       qty: 22, min: 5,  price: 1500, barcode: "8901234567" },
];

const INIT_INVOICES = [
  { id: "INV-001", customer: "Acme Corp",       email: "billing@acme.com",    date: "2026-02-15", due: "2026-03-15", status: "paid",    items: [{ desc: "Web Services Package", qty: 2, price: 2500 }, { desc: "Premium Support Plan", qty: 1, price: 1200 }], tax: 10, notes: "Thank you for your business." },
  { id: "INV-002", customer: "TechVault Inc",   email: "ap@techvault.com",    date: "2026-03-01", due: "2026-03-31", status: "pending", items: [{ desc: "Enterprise License", qty: 1, price: 8000 }, { desc: "Training Session", qty: 3, price: 1500 }], tax: 10, notes: "Net 30 terms apply." },
  { id: "INV-003", customer: "NovaCom Systems", email: "finance@novacom.com", date: "2026-03-10", due: "2026-04-10", status: "overdue", items: [{ desc: "Analytics Dashboard", qty: 1, price: 3200 }], tax: 10, notes: "" },
];

const ROLE_MODULES = {
  admin:     ["dashboard", "sales", "inventory", "invoices", "users"],
  sales:     ["dashboard", "sales", "invoices"],
  warehouse: ["inventory"],
};

/* ─── Helpers ──────────────────────────────────────────────────────────── */
const $$ = (n) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fd  = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const sub = (items) => items.reduce((s, i) => s + i.qty * i.price, 0);
const tot = (items, tax) => sub(items) * (1 + tax / 100);

/* ─── Atoms ────────────────────────────────────────────────────────────── */
const AVATAR_COLORS = ["#6366F1","#8B5CF6","#EC4899","#14B8A6","#F59E0B","#3B82F6","#10B981","#EF4444"];
const Avatar = ({ name, size = 32 }) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.34, fontWeight: 700, flexShrink: 0, letterSpacing: "-0.5px" }}>
      {initials}
    </div>
  );
};

const BADGE_MAP = {
  Won: ["#D1FAE5","#065F46"], Lost: ["#FEE2E2","#991B1B"],
  Lead: ["#EDE9FE","#5B21B6"], Qualified: ["#FEF3C7","#92400E"],
  Proposal: ["#DBEAFE","#1E40AF"], Negotiation: ["#FCE7F3","#9D174D"],
  paid: ["#D1FAE5","#065F46"], pending: ["#FEF3C7","#92400E"], overdue: ["#FEE2E2","#991B1B"],
  admin: ["#EDE9FE","#5B21B6"], sales: ["#DBEAFE","#1E40AF"], warehouse: ["#D1FAE5","#065F46"],
};
const Badge = ({ label }) => {
  const [bg, fg] = BADGE_MAP[label] || ["#F1F5F9","#475569"];
  return <span style={{ padding: "2px 10px", borderRadius: 20, background: bg, color: fg, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", display: "inline-block" }}>{label}</span>;
};

const VARIANT_STYLES = {
  primary:   { background: C.accent,   color: "#fff",    border: "none" },
  secondary: { background: "transparent", color: C.text, border: `1.5px solid ${C.border}` },
  danger:    { background: C.danger,   color: "#fff",    border: "none" },
  success:   { background: C.success,  color: "#fff",    border: "none" },
  ghost:     { background: "transparent", color: C.muted, border: "none" },
};
const SIZE_STYLES = {
  sm: { padding: "5px 12px", fontSize: 12 },
  md: { padding: "8px 16px", fontSize: 13 },
  lg: { padding: "11px 22px", fontSize: 14 },
};
const Btn = ({ onClick, children, variant = "primary", size = "md", disabled, full, style: ex = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{ ...VARIANT_STYLES[variant], ...SIZE_STYLES[size], borderRadius: 8, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1, display: "inline-flex", alignItems: "center", gap: 6, transition: "opacity .15s", width: full ? "100%" : undefined, justifyContent: full ? "center" : undefined, ...ex }}>
    {children}
  </button>
);

const Inp = ({ label, value, onChange, type = "text", placeholder, required, disabled, style: ex = {} }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}{required && <span style={{ color: C.danger }}> *</span>}</label>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} disabled={disabled}
      style={{ border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.text, background: "#fff", outline: "none", width: "100%", ...ex }}
      onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
  </div>
);

const Sel = ({ label, value, onChange, options, required }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}{required && <span style={{ color: C.danger }}> *</span>}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.text, background: "#fff", outline: "none", cursor: "pointer", width: "100%" }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
);

const Card = ({ children, style: ex = {} }) => (
  <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 20, ...ex }}>{children}</div>
);

const Modal = ({ title, onClose, children, width = 560 }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
    <div className="fu" style={{ background: "#fff", borderRadius: 16, width, maxWidth: "calc(100vw - 40px)", maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.22)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${C.border}` }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 20, lineHeight: 1, padding: "0 4px" }}>×</button>
      </div>
      <div style={{ padding: 22 }}>{children}</div>
    </div>
  </div>
);

const Toast = ({ msg, type }) => {
  const bg = { error: C.danger, warn: C.warn, success: C.success }[type] ?? C.success;
  return <div className="si" style={{ position: "fixed", bottom: 24, right: 24, background: bg, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 2000, boxShadow: "0 8px 28px rgba(0,0,0,.18)", maxWidth: 320 }}>{msg}</div>;
};

const HR = ({ style: ex = {} }) => <div style={{ borderTop: `1px solid ${C.border}`, ...ex }} />;

/* ─── Login ────────────────────────────────────────────────────────────── */
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [err,   setErr]   = useState("");
  const [busy,  setBusy]  = useState(false);

  const go = async () => {
    setErr(""); setBusy(true);
    await new Promise(r => setTimeout(r, 550));
    const e = onLogin(email, pass);
    if (e) setErr(e);
    setBusy(false);
  };

  const demo = [
    { lbl: "Admin",     email: "admin@crm.com",     pass: "admin123" },
    { lbl: "Sales",     email: "sarah@crm.com",      pass: "sales123" },
    { lbl: "Warehouse", email: "mike@crm.com",       pass: "warehouse123" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(140deg, #0D1424 0%, #1A2540 55%, #111E36 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <GS />
      <div className="fu" style={{ width: 420, background: "#fff", borderRadius: 20, padding: 40, boxShadow: "0 40px 80px rgba(0,0,0,.45)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: C.accent, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 26 }}>⚡</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>NexusCRM</h1>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 5 }}>Sign in to your workspace</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Email" value={email} onChange={setEmail} type="email" placeholder="you@company.com" required />
          <Inp label="Password" value={pass} onChange={setPass} type="password" placeholder="••••••••" required />
          {err && <p style={{ color: C.danger, fontSize: 12, background: "#FEF2F2", padding: "9px 13px", borderRadius: 8, fontWeight: 500 }}>⚠ {err}</p>}
          <Btn onClick={go} disabled={!email || !pass || busy} size="lg" full style={{ marginTop: 4 }}>
            {busy ? "Signing in…" : "Sign In →"}
          </Btn>
        </div>
        <HR style={{ margin: "26px 0 20px" }} />
        <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10, letterSpacing: ".05em", textTransform: "uppercase" }}>Demo Accounts</p>
        <div style={{ display: "flex", gap: 8 }}>
          {demo.map(d => (
            <button key={d.lbl} onClick={() => { setEmail(d.email); setPass(d.pass); }}
              style={{ flex: 1, padding: "7px 4px", background: C.accentFg, border: `1px solid #C7D2FE`, borderRadius: 8, fontSize: 11, fontWeight: 700, color: C.accent, cursor: "pointer" }}>
              {d.lbl}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar ──────────────────────────────────────────────────────────── */
const NAV = {
  dashboard: { lbl: "Dashboard",  icon: "◈" },
  sales:     { lbl: "Sales",      icon: "◉" },
  inventory: { lbl: "Inventory",  icon: "⬡" },
  invoices:  { lbl: "Invoices",   icon: "▤" },
  users:     { lbl: "Users",      icon: "◎" },
};

function Sidebar({ user, mod, nav, onNav, onLogout }) {
  return (
    <div className="np" style={{ width: 220, background: C.sidebar, display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "22px 18px 16px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: C.accent, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⚡</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: "-0.3px" }}>NexusCRM</div>
            <div style={{ color: "rgba(255,255,255,.35)", fontSize: 10, marginTop: 1 }}>Business Suite</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "10px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {nav.map(key => {
          const { lbl, icon } = NAV[key];
          const active = mod === key;
          return (
            <button key={key} onClick={() => onNav(key)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: "none", cursor: "pointer", background: active ? "rgba(99,102,241,.2)" : "transparent", color: active ? "#A5B4FC" : "rgba(255,255,255,.5)", fontWeight: active ? 600 : 400, fontSize: 13, transition: "all .15s", textAlign: "left", width: "100%" }}>
              <span style={{ fontSize: 17, lineHeight: 1 }}>{icon}</span>
              {lbl}
              {active && <div style={{ marginLeft: "auto", width: 5, height: 5, background: C.accent, borderRadius: "50%" }} />}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 9 }}>
          <Avatar name={user.name} size={30} />
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
            <div style={{ color: "rgba(255,255,255,.35)", fontSize: 10 }}>{user.role}</div>
          </div>
          <button onClick={onLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.35)", fontSize: 17 }} title="Sign out">⏻</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Header ───────────────────────────────────────────────────────────── */
const TITLES = { dashboard: "Dashboard", sales: "Sales Pipeline", inventory: "Stock Control", invoices: "Customer Invoices", users: "User Management" };
function Header({ user, mod }) {
  return (
    <div className="np" style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-0.3px" }}>{TITLES[mod]}</h2>
        <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Badge label={user.role} />
        <Avatar name={user.name} size={34} />
      </div>
    </div>
  );
}

/* ─── Dashboard ────────────────────────────────────────────────────────── */
function Dashboard({ deals, inventory, invoices }) {
  const pipeVal  = deals.filter(d => !["Won","Lost"].includes(d.stage)).reduce((s, d) => s + d.value, 0);
  const wonVal   = deals.filter(d => d.stage === "Won").reduce((s, d) => s + d.value, 0);
  const lowStock = inventory.filter(i => i.qty <= i.min);
  const unpaid   = invoices.filter(i => i.status !== "paid").reduce((s, inv) => s + tot(inv.items, inv.tax), 0);

  const kpis = [
    { lbl: "Pipeline Value",  val: $$(pipeVal),        sub: `${deals.filter(d => !["Won","Lost"].includes(d.stage)).length} active deals`, icon: "◉", clr: C.accent  },
    { lbl: "Closed Revenue",  val: $$(wonVal),          sub: `${deals.filter(d => d.stage === "Won").length} won deals`,                   icon: "★", clr: C.success },
    { lbl: "Low Stock Items", val: lowStock.length,     sub: "items need restocking",                                                       icon: "⚠", clr: C.warn    },
    { lbl: "Outstanding",     val: $$(unpaid),          sub: `${invoices.filter(i => i.status !== "paid").length} invoices unpaid`,         icon: "◈", clr: C.danger  },
  ];

  return (
    <div className="fu" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 14 }}>
        {kpis.map((k, i) => (
          <Card key={i} style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 48, height: 48, background: k.clr + "18", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, color: k.clr }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>{k.val}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".04em", marginTop: 1 }}>{k.lbl}</div>
              <div style={{ fontSize: 11, color: k.clr, marginTop: 2, fontWeight: 500 }}>{k.sub}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>Pipeline by Stage</div>
          {["Lead","Qualified","Proposal","Negotiation"].map(stage => {
            const sd  = deals.filter(d => d.stage === stage);
            const v   = sd.reduce((s, d) => s + d.value, 0);
            const pct = pipeVal > 0 ? (v / pipeVal) * 100 : 0;
            return (
              <div key={stage} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{stage}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{$$(v)} · {sd.length}</span>
                </div>
                <div style={{ height: 5, background: C.bg, borderRadius: 3 }}>
                  <div style={{ height: "100%", width: pct + "%", background: C.accent, borderRadius: 3, minWidth: pct > 0 ? 4 : 0 }} />
                </div>
              </div>
            );
          })}
        </Card>

        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Recent Invoices</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {invoices.slice(0, 4).map(inv => (
              <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: C.bg, borderRadius: 9 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{inv.customer}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{inv.id}</div>
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{$$(tot(inv.items, inv.tax))}</div>
                  <Badge label={inv.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {lowStock.length > 0 && (
        <Card style={{ borderLeft: `4px solid ${C.warn}`, paddingLeft: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>⚠ Low Stock Alerts — {lowStock.length} item{lowStock.length !== 1 ? "s" : ""}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 8 }}>
            {lowStock.map(item => (
              <div key={item.id} style={{ padding: "9px 13px", background: "#FFFBEB", borderRadius: 8, border: "1px solid #FDE68A" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{item.name}</div>
                <div style={{ fontSize: 11, color: C.warn, marginTop: 3, fontWeight: 500 }}>
                  {item.qty === 0 ? "OUT OF STOCK" : `${item.qty} left`} — min {item.min}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─── Sales Module ─────────────────────────────────────────────────────── */
const STAGE_COLOR = { Lead: "#818CF8", Qualified: "#F59E0B", Proposal: "#3B82F6", Negotiation: "#EC4899", Won: "#10B981", Lost: "#EF4444" };

function SalesModule({ deals, setDeals, user, toast }) {
  const [view, setView] = useState("pipeline");
  const [fRep,  setFRep]  = useState("All");
  const [fStage, setFStage] = useState("All");
  const blank = { title: "", value: "", stage: "Lead", rep: user.role === "sales" ? user.name : "", product: "", notes: "" };
  const [form, setForm] = useState(blank);
  const [showNew, setShowNew] = useState(false);

  const reps = ["All", ...new Set(deals.map(d => d.rep))];
  const filtered = deals.filter(d =>
    (fRep   === "All" || d.rep   === fRep)   &&
    (fStage === "All" || d.stage === fStage)  &&
    (user.role !== "sales" || d.rep === user.name)
  );

  const saveDeal = () => {
    if (!form.title || !form.value) return;
    setDeals(p => [...p, { ...form, id: Date.now(), value: parseFloat(form.value), date: new Date().toISOString().split("T")[0] }]);
    setForm(blank); setShowNew(false);
    toast("Deal added to pipeline!");
  };

  const moveTo = (id, stage) => { setDeals(p => p.map(d => d.id === id ? { ...d, stage } : d)); toast(`Moved to ${stage}`); };
  const deleteDeal = (id) => { setDeals(p => p.filter(d => d.id !== id)); toast("Deal removed"); };

  const exportCSV = () => {
    const rows = [["ID","Title","Value","Stage","Rep","Product","Date"], ...filtered.map(d => [d.id, `"${d.title}"`, d.value, d.stage, d.rep, d.product, d.date])];
    const a = document.createElement("a"); a.href = "data:text/csv," + encodeURIComponent(rows.map(r => r.join(",")).join("\n")); a.download = "deals_export.csv"; a.click();
    toast("Report downloaded!");
  };

  const canEdit = user.role === "admin" || user.role === "sales";

  return (
    <div className="fu" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          {["pipeline","table"].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: "7px 16px", border: "none", background: view === v ? C.accent : "transparent", color: view === v ? "#fff" : C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {v === "pipeline" ? "⬡ Pipeline" : "▤ Table"}
            </button>
          ))}
        </div>
        <Sel value={fRep}   onChange={setFRep}   options={reps} />
        <Sel value={fStage} onChange={setFStage} options={["All", ...STAGES]} />
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Btn onClick={exportCSV} variant="secondary" size="sm">↓ Export CSV</Btn>
          {canEdit && <Btn onClick={() => setShowNew(true)} size="sm">+ New Deal</Btn>}
        </div>
      </div>

      {view === "pipeline" && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          {STAGES.map(stage => {
            const sd = filtered.filter(d => d.stage === stage);
            const clr = STAGE_COLOR[stage];
            return (
              <div key={stage} style={{ background: "#fff", borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", minWidth: 155 }}>
                <div style={{ padding: "10px 12px", borderBottom: `3px solid ${clr}`, background: clr + "12" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: clr, textTransform: "uppercase", letterSpacing: ".06em" }}>{stage}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sd.length} · {$$(sd.reduce((s,d)=>s+d.value,0))}</div>
                </div>
                <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 7, minHeight: 180 }}>
                  {sd.map(deal => (
                    <div key={deal.id} style={{ padding: "9px 10px", background: C.bg, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.35, marginBottom: 4 }}>{deal.title}</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: C.accent }}>{$$(deal.value)}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{deal.rep} · {deal.product}</div>
                      {canEdit && (
                        <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                          {STAGES.filter(s => s !== stage).slice(0, 3).map(s => (
                            <button key={s} onClick={() => moveTo(deal.id, s)}
                              style={{ fontSize: 9, padding: "2px 6px", border: `1px solid ${C.border}`, borderRadius: 4, cursor: "pointer", background: "#fff", color: C.muted }}>
                              → {s}
                            </button>
                          ))}
                          {user.role === "admin" && (
                            <button onClick={() => deleteDeal(deal.id)}
                              style={{ fontSize: 9, padding: "2px 6px", border: `1px solid #FCA5A5`, borderRadius: 4, cursor: "pointer", background: "#FEF2F2", color: C.danger }}>
                              ×
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "table" && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {["Deal","Value","Stage","Rep","Product","Date"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? "#fff" : "#FAFBFC" }}>
                  <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: C.text, maxWidth: 220 }}>{d.title}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: C.accent }}>{$$(d.value)}</td>
                  <td style={{ padding: "10px 14px" }}><Badge label={d.stage} /></td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.text }}>{d.rep}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.muted }}>{d.product}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.muted }}>{fd(d.date)}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: 30, textAlign: "center", color: C.muted, fontSize: 13 }}>No deals match the current filter</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {showNew && (
        <Modal title="New Deal" onClose={() => setShowNew(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}><Inp label="Deal Title" value={form.title} onChange={v => setForm(p => ({...p, title: v}))} placeholder="Acme Corp — Enterprise License" required /></div>
            <Inp label="Value ($)" type="number" value={form.value} onChange={v => setForm(p => ({...p, value: v}))} placeholder="10000" required />
            <Sel label="Stage" value={form.stage} onChange={v => setForm(p => ({...p, stage: v}))} options={STAGES} />
            <Inp label="Representative" value={form.rep} onChange={v => setForm(p => ({...p, rep: v}))} placeholder="Rep name" disabled={user.role === "sales"} />
            <Inp label="Product / Service" value={form.product} onChange={v => setForm(p => ({...p, product: v}))} placeholder="e.g. Enterprise" />
            <div style={{ gridColumn: "1/-1" }}><Inp label="Notes" value={form.notes} onChange={v => setForm(p => ({...p, notes: v}))} placeholder="Key info, stakeholders…" /></div>
            <div style={{ gridColumn: "1/-1", display: "flex", gap: 8 }}>
              <Btn onClick={saveDeal} disabled={!form.title || !form.value}>Save Deal</Btn>
              <Btn variant="secondary" onClick={() => setShowNew(false)}>Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── Inventory Module ─────────────────────────────────────────────────── */
function InventoryModule({ inventory, setInventory, user, toast }) {
  const [adjItem, setAdjItem] = useState(null);
  const [adjQty,  setAdjQty]  = useState("");
  const [adjMode, setAdjMode] = useState("add");
  const [barcode, setBarcode] = useState("");
  const [search,  setSearch]  = useState("");
  const [catF,    setCatF]    = useState("All");

  const cats = ["All", ...new Set(inventory.map(i => i.cat))];
  const filtered = inventory.filter(i =>
    (catF === "All" || i.cat === catF) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const applyAdj = () => {
    const q = parseInt(adjQty); if (isNaN(q)) return;
    setInventory(p => p.map(i => {
      if (i.id !== adjItem.id) return i;
      const nq = adjMode === "set" ? q : adjMode === "add" ? i.qty + q : Math.max(0, i.qty - q);
      return { ...i, qty: nq };
    }));
    toast(`Stock updated for ${adjItem.name}`);
    setAdjItem(null); setAdjQty("");
  };

  const scan = () => {
    const found = inventory.find(i => i.barcode === barcode.trim());
    if (found) { setAdjItem(found); setAdjQty(""); setAdjMode("add"); setBarcode(""); toast(`Found: ${found.name}`); }
    else toast("Barcode not found", "error");
  };

  const canEdit = user.role === "admin" || user.role === "warehouse";

  return (
    <div className="fu" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <Inp value={search} onChange={setSearch} placeholder="Search name or SKU…" style={{ width: 230 }} />
        <Sel value={catF} onChange={setCatF} options={cats} />
        {canEdit && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <Inp value={barcode} onChange={setBarcode} placeholder="Barcode…" style={{ width: 160 }} />
            <Btn onClick={scan} variant="secondary" size="sm">▣ Scan</Btn>
          </div>
        )}
      </div>

      {inventory.filter(i => i.qty <= i.min).length > 0 && (
        <div style={{ padding: "10px 14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: C.warn, fontSize: 16 }}>⚠</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#92400E" }}>
            {inventory.filter(i => i.qty <= i.min).length} items are at or below minimum stock levels
          </span>
        </div>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {["SKU","Product","Category","Stock","Min","Unit Price", canEdit ? "Actions" : null].filter(Boolean).map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => {
              const low  = item.qty <= item.min;
              const zero = item.qty === 0;
              return (
                <tr key={item.id} style={{ borderTop: `1px solid ${C.border}`, background: zero ? "#FEF2F2" : low ? "#FFFBEB" : i % 2 === 0 ? "#fff" : "#FAFBFC" }}>
                  <td style={{ padding: "10px 14px", fontSize: 11, fontFamily: "monospace", color: C.muted, letterSpacing: ".03em" }}>{item.sku}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: C.text }}>{item.name}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.muted }}>{item.cat}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: zero ? C.danger : low ? C.warn : C.success }}>{item.qty}</span>
                      {low && <span style={{ fontSize: 9, padding: "2px 7px", background: zero ? "#FEE2E2" : "#FEF3C7", color: zero ? C.danger : C.warn, borderRadius: 10, fontWeight: 700 }}>{zero ? "OUT" : "LOW"}</span>}
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.muted }}>{item.min}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: C.text }}>{$$(item.price)}</td>
                  {canEdit && <td style={{ padding: "10px 14px" }}><Btn onClick={() => { setAdjItem(item); setAdjQty(""); setAdjMode("add"); }} size="sm" variant="secondary">Adjust</Btn></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {adjItem && (
        <Modal title={`Adjust Stock — ${adjItem.name}`} onClose={() => setAdjItem(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 20, padding: "12px 16px", background: C.bg, borderRadius: 8 }}>
              {[["SKU", adjItem.sku], ["Current Stock", adjItem.qty], ["Min Level", adjItem.min]].map(([l, v]) => (
                <div key={l}><div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{l}</div><div style={{ fontWeight: 700, fontSize: 15 }}>{v}</div></div>
              ))}
            </div>
            <Sel label="Mode" value={adjMode} onChange={setAdjMode} options={[
              { value: "set", label: "Set to exact quantity" },
              { value: "add", label: "Add to current stock" },
              { value: "sub", label: "Remove from stock" },
            ]} />
            <Inp label="Quantity" type="number" value={adjQty} onChange={setAdjQty} placeholder="Enter amount" required />
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={applyAdj} disabled={!adjQty}>Apply</Btn>
              <Btn variant="secondary" onClick={() => setAdjItem(null)}>Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── Invoices Module ──────────────────────────────────────────────────── */
function InvoicesModule({ invoices, setInvoices, user, toast }) {
  const [view,    setView]    = useState("list");
  const [vidId,   setVidId]   = useState(null);
  const [stFilter, setStFilter] = useState("All");

  const blank = { customer: "", email: "", date: new Date().toISOString().split("T")[0], due: "", items: [{ desc: "", qty: 1, price: 0 }], tax: 10, notes: "" };
  const [form, setForm] = useState(blank);

  const nextId = () => {
    const max = Math.max(0, ...invoices.map(i => parseInt(i.id.split("-")[1])));
    return "INV-" + String(max + 1).padStart(3, "0");
  };

  const filtered = invoices.filter(i => stFilter === "All" || i.status === stFilter);

  const saveInv = () => {
    if (!form.customer || !form.date || !form.due) return;
    const inv = { ...form, id: nextId(), status: "pending" };
    setInvoices(p => [...p, inv]);
    toast(`${inv.id} created!`);
    setView("list"); setForm(blank);
  };

  const updateStatus = (id, status) => {
    setInvoices(p => p.map(i => i.id === id ? { ...i, status } : i));
    toast(`Invoice marked ${status}`);
  };

  const addLine    = () => setForm(f => ({ ...f, items: [...f.items, { desc: "", qty: 1, price: 0 }] }));
  const removeLine = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const setLine    = (idx, field, val) => setForm(f => ({
    ...f, items: f.items.map((it, i) => i === idx ? { ...it, [field]: ["qty","price"].includes(field) ? parseFloat(val) || 0 : val } : it)
  }));

  const canEdit = user.role === "admin" || user.role === "sales";

  /* Invoice view (print-friendly) */
  if (view === "view" && vidId) {
    const inv = invoices.find(i => i.id === vidId);
    if (!inv) { setView("list"); return null; }
    const s = sub(inv.items), t = s * inv.tax / 100, total = s + t;
    return (
      <div className="fu">
        <div className="np" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Btn onClick={() => setView("list")} variant="secondary" size="sm">← Back</Btn>
          <Btn onClick={() => window.print()} size="sm">Print / Save PDF</Btn>
          {user.role === "admin" && inv.status !== "paid"    && <Btn onClick={() => { updateStatus(inv.id, "paid"); }} variant="success" size="sm">✓ Mark Paid</Btn>}
          {user.role === "admin" && inv.status !== "overdue" && <Btn onClick={() => { updateStatus(inv.id, "overdue"); }} variant="danger" size="sm">Mark Overdue</Btn>}
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 40, maxWidth: 700, margin: "0 auto", boxShadow: "0 4px 20px rgba(0,0,0,.07)", border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, background: C.accent, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
                <span style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: "-0.4px" }}>NexusCRM</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>Invoice Date: {fd(inv.date)}</div>
              <div style={{ fontSize: 12, color: C.muted }}>Due Date: {fd(inv.due)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: "-1px", marginBottom: 8 }}>{inv.id}</div>
              <Badge label={inv.status} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: "16px 20px", background: C.bg, borderRadius: 10, marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Bill To</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{inv.customer}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{inv.email}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>From</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>NexusCRM Inc.</div>
              <div style={{ fontSize: 12, color: C.muted }}>billing@nexuscrm.com</div>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
            <thead>
              <tr style={{ background: C.sidebar }}>
                {[["Description", "left"], ["Qty", "center"], ["Unit Price", "right"], ["Amount", "right"]].map(([h, a]) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: a, fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{it.desc}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, textAlign: "center" }}>{it.qty}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, textAlign: "right" }}>{$$(it.price)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, textAlign: "right", fontWeight: 700 }}>{$$(it.qty * it.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: 260 }}>
              {[["Subtotal", s], [`Tax (${inv.tax}%)`, t]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.muted }}>
                  <span>{l}</span><span>{$$(v)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", fontSize: 17, fontWeight: 800, color: C.text }}>
                <span>Total Due</span><span style={{ color: C.accent }}>{$$(total)}</span>
              </div>
            </div>
          </div>

          {inv.notes && <div style={{ marginTop: 20, padding: "12px 16px", background: C.bg, borderRadius: 8, fontSize: 12, color: C.muted }}><strong>Notes:</strong> {inv.notes}</div>}
        </div>
      </div>
    );
  }

  /* Create form */
  if (view === "create") {
    const s = sub(form.items), total = s * (1 + form.tax / 100);
    return (
      <div className="fu" style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
        <Btn variant="secondary" size="sm" onClick={() => setView("list")}>← Back</Btn>
        <Card>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 18 }}>New Invoice</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <Inp label="Customer Name" value={form.customer} onChange={v => setForm(f => ({...f, customer: v}))} required />
            <Inp label="Customer Email" type="email" value={form.email} onChange={v => setForm(f => ({...f, email: v}))} />
            <Inp label="Invoice Date" type="date" value={form.date} onChange={v => setForm(f => ({...f, date: v}))} required />
            <Inp label="Due Date" type="date" value={form.due} onChange={v => setForm(f => ({...f, due: v}))} required />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>Line Items</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 32px", gap: 6, marginBottom: 6 }}>
              {["Description", "Qty", "Unit Price", ""].map((h, i) => <div key={i} style={{ fontSize: 10, fontWeight: 700, color: C.muted }}>{h}</div>)}
            </div>
            {form.items.map((it, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 32px", gap: 6, marginBottom: 6 }}>
                <input value={it.desc} onChange={e => setLine(i, "desc", e.target.value)} placeholder="Item description"
                  style={{ border: `1.5px solid ${C.border}`, borderRadius: 7, padding: "7px 10px", fontSize: 12, width: "100%" }} />
                <input type="number" value={it.qty} onChange={e => setLine(i, "qty", e.target.value)} min="1"
                  style={{ border: `1.5px solid ${C.border}`, borderRadius: 7, padding: "7px 8px", fontSize: 12, textAlign: "center", width: "100%" }} />
                <input type="number" value={it.price} onChange={e => setLine(i, "price", e.target.value)} placeholder="0.00"
                  style={{ border: `1.5px solid ${C.border}`, borderRadius: 7, padding: "7px 10px", fontSize: 12, width: "100%" }} />
                <button onClick={() => removeLine(i)} disabled={form.items.length === 1}
                  style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 7, cursor: "pointer", color: C.danger, fontWeight: 700, fontSize: 14 }}>×</button>
              </div>
            ))}
            <Btn onClick={addLine} variant="secondary" size="sm">+ Add Line</Btn>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <Inp label="Tax (%)" type="number" value={form.tax} onChange={v => setForm(f => ({...f, tax: parseFloat(v) || 0}))} />
            <Inp label="Notes" value={form.notes} onChange={v => setForm(f => ({...f, notes: v}))} placeholder="Payment terms…" />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: C.bg, borderRadius: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Sub: {$$(s)} · Tax: {$$(s * form.tax / 100)}</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: C.accent }}>Total: {$$(total)}</span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={saveInv} disabled={!form.customer || !form.date || !form.due}>Create Invoice</Btn>
            <Btn variant="secondary" onClick={() => setView("list")}>Cancel</Btn>
          </div>
        </Card>
      </div>
    );
  }

  /* List view */
  return (
    <div className="fu" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          {["All","pending","paid","overdue"].map(s => (
            <button key={s} onClick={() => setStFilter(s)}
              style={{ padding: "7px 14px", border: "none", background: stFilter === s ? C.accent : "transparent", color: stFilter === s ? "#fff" : C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
              {s}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto" }}>
          {canEdit && <Btn onClick={() => setView("create")} size="sm">+ New Invoice</Btn>}
        </div>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {["Invoice #","Customer","Date","Due Date","Amount","Status","Actions"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv, i) => (
              <tr key={inv.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? "#fff" : "#FAFBFC" }}>
                <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: C.accent }}>{inv.id}</td>
                <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: C.text }}>{inv.customer}</td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: C.muted }}>{fd(inv.date)}</td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: inv.status === "overdue" ? C.danger : C.muted, fontWeight: inv.status === "overdue" ? 600 : 400 }}>{fd(inv.due)}</td>
                <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: C.text }}>{$$(tot(inv.items, inv.tax))}</td>
                <td style={{ padding: "10px 14px" }}><Badge label={inv.status} /></td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant="secondary" onClick={() => { setVidId(inv.id); setView("view"); }}>View</Btn>
                    {user.role === "admin" && inv.status !== "paid" && <Btn size="sm" variant="success" onClick={() => updateStatus(inv.id, "paid")}>✓ Paid</Btn>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: C.muted, fontSize: 13 }}>No invoices found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ─── Users Module ─────────────────────────────────────────────────────── */
function UsersModule({ users, setUsers, toast }) {
  const [modal,    setModal]   = useState(false);
  const [editU,    setEditU]   = useState(null);
  const blank = { name: "", email: "", password: "", role: "sales", dept: "" };
  const [form, setForm] = useState(blank);

  const openNew  = () => { setEditU(null);  setForm(blank);                                                     setModal(true); };
  const openEdit = (u) => { setEditU(u); setForm({ name: u.name, email: u.email, password: u.password, role: u.role, dept: u.dept }); setModal(true); };

  const save = () => {
    if (!form.name || !form.email || !form.password) return;
    if (editU) { setUsers(p => p.map(u => u.id === editU.id ? { ...u, ...form } : u)); toast("User updated"); }
    else        { setUsers(p => [...p, { ...form, id: Date.now() }]);                   toast("User created"); }
    setModal(false);
  };

  const del = (id) => {
    if (users.length <= 1) { toast("Cannot delete the last user", "error"); return; }
    setUsers(p => p.filter(u => u.id !== id)); toast("User deleted");
  };

  const PERMS = {
    admin:     ["Full dashboard access", "All sales deals & reports", "All invoices & payments", "Inventory management", "User & permission management"],
    sales:     ["Dashboard (own KPIs)", "Own deals & pipeline", "Create & view invoices", "CSV export"],
    warehouse: ["Inventory view & adjustment", "Barcode scanning", "Low-stock alerts only"],
  };

  return (
    <div className="fu" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 13, color: C.muted }}>{users.length} user{users.length !== 1 ? "s" : ""} · Role-based access control active</p>
        <Btn onClick={openNew} size="sm">+ Add User</Btn>
      </div>

      {users.map(u => (
        <Card key={u.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
          <Avatar name={u.name} size={42} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{u.name}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{u.email} · {u.dept}</div>
          </div>
          <Badge label={u.role} />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" variant="secondary" onClick={() => openEdit(u)}>Edit</Btn>
            <Btn size="sm" variant="danger" onClick={() => del(u.id)}>Delete</Btn>
          </div>
        </Card>
      ))}

      <Card style={{ borderLeft: `4px solid ${C.accent}`, background: C.accentFg }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Role Permissions Matrix</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {Object.entries(PERMS).map(([role, perms]) => (
            <div key={role} style={{ background: "#fff", borderRadius: 9, padding: "12px 14px" }}>
              <div style={{ marginBottom: 10 }}><Badge label={role} /></div>
              {perms.map(p => <div key={p} style={{ fontSize: 11, color: C.muted, paddingBottom: 4, display: "flex", gap: 5 }}><span style={{ color: C.success }}>✓</span>{p}</div>)}
            </div>
          ))}
        </div>
      </Card>

      {modal && (
        <Modal title={editU ? "Edit User" : "New User"} onClose={() => setModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Inp label="Full Name" value={form.name} onChange={v => setForm(f => ({...f, name: v}))} required />
            <Inp label="Email" type="email" value={form.email} onChange={v => setForm(f => ({...f, email: v}))} required />
            <Inp label="Password" type="password" value={form.password} onChange={v => setForm(f => ({...f, password: v}))} required />
            <Sel label="Role" value={form.role} onChange={v => setForm(f => ({...f, role: v}))} options={[
              { value: "admin",     label: "Admin — Full access" },
              { value: "sales",     label: "Sales — Deals & invoices" },
              { value: "warehouse", label: "Warehouse — Inventory only" },
            ]} />
            <Inp label="Department" value={form.dept} onChange={v => setForm(f => ({...f, dept: v}))} placeholder="e.g. Sales, Operations" />
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Btn onClick={save} disabled={!form.name || !form.email || !form.password}>{editU ? "Update" : "Create"} User</Btn>
              <Btn variant="secondary" onClick={() => setModal(false)}>Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── App Root ─────────────────────────────────────────────────────────── */
export default function App() {
  const [user,      setUser]      = useState(null);
  const [mod,       setMod]       = useState("dashboard");
  const [users,     setUsers]     = useState(INIT_USERS);
  const [deals,     setDeals]     = useState(INIT_DEALS);
  const [inventory, setInventory] = useState(INIT_INV);
  const [invoices,  setInvoices]  = useState(INIT_INVOICES);
  const [toastMsg,  setToastMsg]  = useState(null);

  const toast = (msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const login = (email, pass) => {
    const found = users.find(u => u.email === email && u.password === pass);
    if (found) { setUser(found); setMod(ROLE_MODULES[found.role][0]); }
    else return "Invalid email or password.";
  };

  const logout = () => { setUser(null); setMod("dashboard"); };

  if (!user) return <Login onLogin={login} />;

  const nav = ROLE_MODULES[user.role];

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <GS />
      <Sidebar user={user} mod={mod} nav={nav} onNav={setMod} onLogout={logout} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header user={user} mod={mod} />
        <main style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {mod === "dashboard" && <Dashboard deals={deals} inventory={inventory} invoices={invoices} user={user} />}
          {mod === "sales"     && <SalesModule     deals={deals}         setDeals={setDeals}         user={user} toast={toast} />}
          {mod === "inventory" && <InventoryModule inventory={inventory} setInventory={setInventory} user={user} toast={toast} />}
          {mod === "invoices"  && <InvoicesModule  invoices={invoices}   setInvoices={setInvoices}   user={user} toast={toast} />}
          {mod === "users"     && user.role === "admin" && <UsersModule users={users} setUsers={setUsers} toast={toast} />}
        </main>
      </div>
      {toastMsg && <Toast msg={toastMsg.msg} type={toastMsg.type} />}
    </div>
  );
}
