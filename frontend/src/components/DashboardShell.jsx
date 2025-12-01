// File: src/components/DashboardShell.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardShell({
  title = "Dashboard",
  subtitle = "",
  logo = "T",
  children,
}) {
  const navigate = useNavigate();
  function handleLogout() {
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <div className="ad-page">
      <style>{css}</style>

      {/* NAVBAR */}
      <header className="ad-navbar">
        <div className="ad-navwrap">
          <div className="ad-brand">
            <div className="ad-logo">{logo}</div>
            <div className="ad-brandtext">
              <h1>
                {title.split(" ")[0]}{" "}
                <span>{title.split(" ").slice(1).join(" ")}</span>
              </h1>
              {subtitle ? <p>{subtitle}</p> : null}
            </div>
          </div>
          <div className="ad-actions">
            <button className="ad-btn ad-btn--danger" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="ad-container">{children}</main>
    </div>
  );
}

/* ===== CSS opción B (mismo de Student/Admin) ===== */
const css = `
:root{
  --bg:#f4f6fb; --card:#fff; --border:#e6e8ee; --text:#0f172a; --muted:#64748b;
  --blue:#2563eb; --indigo:#4f46e5; --green:#10b981; --amber:#d97706; --dark:#0f172a; --red:#dc2626;
}
*{box-sizing:border-box}
.ad-page{min-height:100vh;background:linear-gradient(180deg,#f8fafc,#eef2ff 90%);color:var(--text)}
.ad-navbar{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.85);backdrop-filter:blur(8px);border-bottom:1px solid var(--border)}
.ad-navwrap{max-width:1200px;margin:0 auto;padding:12px 16px;display:flex;align-items:center;justify-content:space-between}
.ad-brand{display:flex;align-items:center;gap:12px}
.ad-logo{height:40px;width:40px;border-radius:14px;background:var(--indigo);color:#fff;display:grid;place-items:center;font-weight:800;box-shadow:0 2px 6px rgba(79,70,229,.25)}
.ad-brandtext h1{margin:0;font-size:22px;font-weight:800;letter-spacing:-.02em}
.ad-brandtext h1 span{color:var(--indigo)}
.ad-brandtext p{margin:0;color:var(--muted);font-size:12px;margin-top:2px}
.ad-actions{display:flex;gap:8px}

.ad-btn{border:0;border-radius:12px;padding:10px 16px;font-size:14px;background:var(--indigo);color:#fff;cursor:pointer;transition:.2s background,.2s box-shadow;box-shadow:0 2px 6px rgba(79,70,229,.25)}
.ad-btn:hover{filter:brightness(.95)}
.ad-btn--dark{background:var(--dark)}
.ad-btn--danger{background:var(--red)}

.ad-container{max-width:1200px;margin:0 auto;padding:24px 16px;display:flex;flex-direction:column;gap:16px}
.ad-card{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:18px;box-shadow:0 1px 3px rgba(15,23,42,.04)}
.ad-h2{margin:0 0 10px 0;font-size:18px;font-weight:700}
.ad-empty{color:var(--muted);font-size:14px}

.ad-grid{display:grid;grid-template-columns:1fr;gap:16px}
@media (min-width:900px){.ad-grid{grid-template-columns:1fr 2fr}}

.ad-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--border);border-radius:12px;overflow:hidden}
.ad-table thead th{background:#f8fafc;text-align:left;padding:10px 12px;font-weight:600;color:#334155;font-size:14px;border-bottom:1px solid var(--border)}
.ad-table tbody td{padding:10px 12px;border-bottom:1px solid var(--border)}
.ad-table tbody tr:nth-child(even){background:#f9fafb}

.ad-inline-form{display:flex;gap:8px;flex-wrap:wrap}
.ad-inline-form input, .ad-inline-form select{
  border:1px solid var(--border);border-radius:12px;padding:10px 12px;font-size:14px;background:#fff
}
`;
