// File: src/pages/StudentDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  // ===== session & id extraction =====
  const session = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);
  const token = session?.token;
  const [studentId, setStudentId] = useState(() => resolveStudentId({ session, token, grades: [] }));

  function decodeJWTPayload(tkn) {
    try {
      const b64 = tkn.split('.')[1];
      const json = JSON.parse(decodeURIComponent(escape(window.atob(b64))));
      return json || {};
    } catch { return {}; }
  }
  function resolveStudentId({ session, token, grades }) {
    const cands = [
      session?.id, session?._id, session?.userId, session?.uid,
      session?.user?.id, session?.user?._id, session?.data?.id, session?.profile?.id,
    ];
    if (token) {
      const p = decodeJWTPayload(token);
      cands.push(p?.id, p?._id, p?.userId, p?.uid, p?.sub);
    }
    if (Array.isArray(grades) && grades.length) {
      const s = grades[0]?.student;
      cands.push(typeof s === 'string' ? s : (s?._id || s?.id));
    }
    return cands.find(Boolean) || null;
  }

  // ===== HTTP helpers con fallbacks =====
  async function safeText(res) {
    try { return (await res.text()).replace(/<[^>]*>/g, '').trim(); }
    catch { return 'Respuesta no válida.'; }
  }
  async function tryGet(paths) {
    for (const p of paths) {
      const opt = typeof p === 'string' ? { path: p, method: 'GET' } : p;
      try {
        const res = await fetch(`${API_BASE}${opt.path}`, {
          method: opt.method || 'GET',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            Accept: opt.accept || 'application/json',
            ...(opt.body ? { 'Content-Type': 'application/json' } : {}),
          },
          body: opt.body ? JSON.stringify(opt.body) : undefined,
        });
        if (!res.ok) throw new Error(await safeText(res));
        return res;
      } catch (_) {}
    }
    throw new Error('No se encontró un endpoint válido.');
  }
  async function tryGetJSON(paths) { return (await tryGet(paths)).json(); }
  async function tryGetBlob(paths) {
    const res = await tryGet(paths.map(p => (typeof p === 'string' ? { path: p } : p)));
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/pdf') || ct.includes('octet-stream')) return res.blob();
    try {
      const j = await res.clone().json();
      throw new Error(j?.message || 'El servidor no devolvió un PDF.');
    } catch { throw new Error(await safeText(res)); }
  }

  function isMineClass(c) {
    const arr = c?.students || c?.alumnos || c?.enrolled || c?.members || [];
    return arr.some(s =>
      (typeof s === 'string' && s === (studentId || '')) ||
      (typeof s === 'object' && ((s?._id || s?.id) === (studentId || '')))
    );
  }

  // ===== carga inicial =====
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [clsRaw, grsRaw] = await Promise.all([
          tryGetJSON(['/class', '/classes', '/classes/my', '/class/my']),
          tryGetJSON(['/grades', '/grade', '/grades/my']),
        ]);
        if (!mounted) return;

        const cls = Array.isArray(clsRaw) ? clsRaw : [];
        const myClasses = cls.filter(isMineClass).length ? cls.filter(isMineClass) : cls;

        const grs = Array.isArray(grsRaw) ? grsRaw : [];
        const myGrades = grs.filter(g =>
          (typeof g?.student === 'string' && g.student === (studentId || '')) ||
          (typeof g?.student === 'object' && ((g.student?._id || g.student?.id) === (studentId || '')))
        );

        // si no teníamos id, intenta resolverlo ahora con las notas
        if (!studentId) {
          const resolved = resolveStudentId({ session, token, grades: myGrades.length ? myGrades : grs });
          if (resolved) setStudentId(resolved);
        }

        setClasses(myClasses);
        setGrades(myGrades.length ? myGrades : grs);
      } catch (e) {
        setError(cleanErr(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []); // eslint-disable-line

  // ===== derivados =====
  const filteredGrades = useMemo(() => {
    if (selectedClassId === 'all') return grades;
    return grades.filter(g => g?.sclass?._id === selectedClassId || g?.sclass === selectedClassId);
  }, [grades, selectedClassId]);

  const overallAvg = useMemo(() => {
    if (!grades.length) return '—';
    const sum = grades.reduce((acc, g) => acc + (Number(g?.score) || 0), 0);
    return (sum / grades.length).toFixed(2);
  }, [grades]);

  const avgBySubject = useMemo(() => {
    const m = {};
    grades.forEach(g => {
      const sid = g?.subject?._id || g?.subject || 'NA';
      const name = g?.subject?.subName || g?.subject?.name || '—';
      if (!m[sid]) m[sid] = { name, sum: 0, count: 0 };
      m[sid].sum += Number(g?.score) || 0;
      m[sid].count += 1;
    });
    return Object.values(m).map(x => ({ name: x.name, avg: (x.sum / x.count).toFixed(2), count: x.count }));
  }, [grades]);

  // ===== acciones =====
  async function handleRefresh() {
    setMessage('');
    setError('');
    try {
      const data = await tryGetJSON(['/grades', '/grade', '/grades/my']);
      const id = studentId || resolveStudentId({ session, token, grades });
      const my = data.filter(g =>
        (typeof g?.student === 'string' && g.student === (id || '')) ||
        (typeof g?.student === 'object' && ((g.student?._id || g.student?.id) === (id || '')))
      );
      setGrades(my.length ? my : data);
      if (!studentId && id) setStudentId(id);
      setMessage('Notas actualizadas.');
    } catch (e) {
      setError(cleanErr(e));
    }
  }

  async function handleDownloadReport() {
    setMessage('');
    setError('');
    const id = studentId || resolveStudentId({ session, token, grades });
    if (!id) { setError('No se encontró tu sesión (no pude obtener tu ID).'); return; }
    try {
      setDownloading(true);
      const blob = await tryGetBlob([
        { path: `/reports/student/${id}`, method: 'GET', accept: 'application/pdf' },
        { path: `/report/student/${id}`, method: 'GET', accept: 'application/pdf' },
        { path: `/reports/${id}`, method: 'GET', accept: 'application/pdf' },
        // Backends que generan bajo demanda:
        { path: `/reports/student/${id}`, method: 'POST', body: { id }, accept: 'application/pdf' },
        { path: `/report/student/${id}`, method: 'POST', body: { id }, accept: 'application/pdf' },
      ]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const humanName = (session?.name || 'student').replace(/\s+/g, '_');
      a.href = url;
      a.download = `report_${humanName}_${yyyy}-${mm}-${dd}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setMessage('Reporte descargado.');
    } catch (e) {
      setError(cleanErr(e));
    } finally {
      setDownloading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('user');
    navigate('/login');
  }

  // ===== UI (CSS embebido – opción B) =====
  return (
    <div className="sd-page">
      <style>{css}</style>

      <header className="sd-navbar">
        <div className="sd-navwrap">
          <div className="sd-brand">
            <div className="sd-logo">S</div>
            <div className="sd-brandtext">
              <h1>Student <span>Dashboard</span></h1>
              <p>Tus clases, notas y reportes en un solo lugar.</p>
            </div>
          </div>
          <button onClick={handleLogout} className="sd-btn sd-btn--danger">Salir</button>
        </div>
      </header>

      <main className="sd-container">
        <section className="sd-card sd-controls">
          <div className="sd-row">
            <div className="sd-filter">
              <label htmlFor="classFilter">Filtrar por clase</label>
              <select
                id="classFilter"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={loading || classes.length === 0}
              >
                <option value="all">Todas</option>
                {classes.map(c => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.sclassName || c.name || 'Clase'} — {c.subject?.subName || c.subject?.name || '—'}
                  </option>
                ))}
              </select>
            </div>
            <div className="sd-actions">
              <button onClick={handleRefresh} className="sd-btn sd-btn--dark" disabled={loading}>Refrescar</button>
              <button onClick={handleDownloadReport} className="sd-btn" disabled={loading || downloading}>
                {downloading ? 'Preparando…' : 'Descargar reporte'}
              </button>
            </div>
          </div>
        </section>

        {message && <div className="sd-alert sd-alert--ok">{message}</div>}
        {error && <div className="sd-alert sd-alert--err">{shorten(error)}</div>}

        <section className="sd-grid">
          <Stat label="Clases matriculadas" value={classes.length} grad="blue" />
          <Stat label="Materias con promedio" value={avgBySubject.length} grad="green" />
          <Stat label="Promedio general" value={overallAvg} grad="amber" />
        </section>

        <section className="sd-grid sd-grid--two">
          <div className="sd-card">
            <h2 className="sd-h2">Mis clases</h2>
            {loading ? (
              <Skeleton lines={5} />
            ) : classes.length === 0 ? (
              <p className="sd-empty">No estás matriculado en ninguna clase.</p>
            ) : (
              <ul className="sd-list">
                {classes.map(c => (
                  <li key={c._id || c.id}>
                    <p className="sd-item-title">{c.sclassName || c.name || 'Clase'}</p>
                    <p className="sd-item-sub">
                      Materia: {c.subject?.subName || c.subject?.name || '—'} • Docente: {c.teacher?.name || c.teacher?.email || '—'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sd-card sd-tablecard">
            <h2 className="sd-h2">Mis notas</h2>
            {loading ? (
              <Skeleton lines={7} />
            ) : filteredGrades.length === 0 ? (
              <p className="sd-empty">Aún no hay notas para mostrar.</p>
            ) : (
              <table className="sd-table">
                <thead>
                  <tr>
                    <th>Materia</th>
                    <th>Clase</th>
                    <th>Puntaje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrades.map(g => (
                    <tr key={g._id}>
                      <td>{g.subject?.subName || g.subject?.name || '—'}</td>
                      <td>{g.sclass?.sclassName || g.sclass?.name || '—'}</td>
                      <td>{g.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {avgBySubject.length > 0 && (
              <div className="sd-averages">
                <h3>Promedios por materia</h3>
                <ul>
                  {avgBySubject.map(s => (
                    <li key={s.name}>
                      <span className="sd-avg-name">{s.name}</span>
                      <span className="sd-avg-dot">•</span>
                      <span className="sd-avg-val">{s.avg}</span>
                      <span className="sd-avg-count">({s.count} notas)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

/* ---------- UI bits ---------- */
function Stat({ label, value, grad = 'blue' }) {
  return (
    <div className={`sd-stat sd-stat--${grad}`}>
      <p className="sd-stat-label">{label}</p>
      <p className="sd-stat-value">{value}</p>
    </div>
  );
}
function Skeleton({ lines = 4 }) {
  return (
    <div className="sd-skeleton">
      {Array.from({ length: lines }).map((_, i) => <div key={i} />)}
    </div>
  );
}
function cleanErr(e) {
  const raw = e?.message || String(e);
  return raw.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || 'Error';
}
function shorten(s, n = 180) { return s.length > n ? s.slice(0, n) + '…' : s; }

/* ---------- CSS embebido (scoped) ---------- */
const css = `
:root{
  --bg: #f4f6fb; --card:#ffffff; --border:#e6e8ee; --text:#0f172a;
  --muted:#6b7280; --blue:#2563eb; --blue-700:#1d4ed8; --dark:#0f172a; --red:#dc2626;
  --green:#059669; --amber:#d97706;
}
*{box-sizing:border-box}
body{margin:0}
.sd-page{min-height:100vh;background:linear-gradient(180deg,#f8fafc, #eef2ff 90%);color:var(--text);}
.sd-navbar{position:sticky;top:0;background:rgba(255,255,255,.85);backdrop-filter:blur(8px);border-bottom:1px solid var(--border);z-index:20}
.sd-navwrap{max-width:1100px;margin:0 auto;padding:12px 16px;display:flex;align-items:center;justify-content:space-between}
.sd-brand{display:flex;align-items:center;gap:12px}
.sd-logo{height:40px;width:40px;border-radius:14px;background:var(--blue);color:#fff;display:grid;place-items:center;font-weight:700;box-shadow:0 2px 6px rgba(37,99,235,.25)}
.sd-brandtext h1{margin:0;font-size:22px;font-weight:800;letter-spacing:-.02em}
.sd-brandtext h1 span{color:var(--blue)}
.sd-brandtext p{margin:0;color:var(--muted);font-size:12px;margin-top:2px}

.sd-btn{border:0;border-radius:12px;padding:10px 16px;font-size:14px;background:var(--blue);color:#fff;cursor:pointer;transition:.2s box-shadow,.2s background;box-shadow:0 2px 6px rgba(37,99,235,.25)}
.sd-btn:hover{background:var(--blue-700)}
.sd-btn:disabled{opacity:.6;cursor:not-allowed}
.sd-btn--dark{background:var(--dark);box-shadow:0 2px 6px rgba(15,23,42,.25)}
.sd-btn--dark:hover{background:#111827}
.sd-btn--danger{background:var(--red);box-shadow:0 2px 6px rgba(220,38,38,.25)}
.sd-btn--danger:hover{background:#b91c1c}

.sd-container{max-width:1100px;margin:0 auto;padding:24px 16px;display:flex;flex-direction:column;gap:16px}
.sd-card{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:18px;box-shadow:0 1px 3px rgba(15,23,42,.04)}
.sd-controls .sd-row{display:flex;flex-direction:column;gap:12px}
@media (min-width:640px){.sd-controls .sd-row{flex-direction:row;align-items:center;justify-content:space-between}}

.sd-filter label{font-size:13px;color:var(--muted);margin-right:8px}
.sd-filter select{min-width:260px;border:1px solid var(--border);border-radius:12px;padding:10px 12px;background:#fff;font-size:14px;outline:none}
.sd-actions{display:flex;gap:8px}

.sd-alert{border-radius:12px;padding:10px 14px;font-size:14px}
.sd-alert--ok{background:#ecfdf5;border:1px solid #d1fae5;color:#065f46}
.sd-alert--err{background:#fef2f2;border:1px solid #fee2e2;color:#991b1b}

.sd-grid{display:grid;grid-template-columns:repeat(1,1fr);gap:16px}
.sd-grid--two{grid-template-columns:1fr}
@media (min-width:640px){.sd-grid{grid-template-columns:repeat(3,1fr)} .sd-grid--two{grid-template-columns:1fr 1fr}}

.sd-stat{position:relative;overflow:hidden;border:1px solid var(--border);border-radius:18px;background:#fff;padding:20px}
.sd-stat::before{content:"";position:absolute;inset:auto -20px 0 -20px;height:60px;opacity:.12;filter:blur(10px)}
.sd-stat--blue::before{background:linear-gradient(90deg,#3b82f6,#6366f1)}
.sd-stat--green::before{background:linear-gradient(90deg,#10b981,#14b8a6)}
.sd-stat--amber::before{background:linear-gradient(90deg,#f59e0b,#fb923c)}
.sd-stat-label{color:var(--muted);font-size:13px}
.sd-stat-value{font-size:28px;font-weight:800;margin-top:4px;letter-spacing:-.02em}

.sd-h2{font-size:18px;font-weight:700;margin:0 0 10px}
.sd-empty{color:var(--muted);font-size:14px}

.sd-list{list-style:none;margin:0;padding:0;border-top:1px solid var(--border)}
.sd-list li{padding:12px 0;border-bottom:1px solid var(--border)}
.sd-item-title{margin:0 0 2px 0;font-weight:600}
.sd-item-sub{margin:0;color:var(--muted);font-size:12px}

.sd-tablecard{overflow-x:auto}
.sd-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--border);border-radius:12px;overflow:hidden}
.sd-table thead th{background:#f8fafc;text-align:left;padding:10px 12px;font-weight:600;color:#334155;font-size:14px;border-bottom:1px solid var(--border)}
.sd-table tbody td{padding:10px 12px;border-bottom:1px solid var(--border)}
.sd-table tbody tr:nth-child(even){background:#f9fafb}
.sd-table tbody tr:hover{background:#eff6ff}

.sd-averages{margin-top:14px}
.sd-averages h3{margin:0 0 8px 0;font-size:15px;font-weight:600}
.sd-averages ul{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr;gap:8px}
@media (min-width:640px){.sd-averages ul{grid-template-columns:1fr 1fr}}
.sd-averages li{padding:10px 12px;border:1px solid var(--border);border-radius:12px;background:#f8fafc;font-size:14px}
.sd-avg-name{font-weight:600}
.sd-avg-dot{margin:0 6px;color:#cbd5e1}
.sd-avg-val{font-weight:600}
.sd-avg-count{color:var(--muted);margin-left:6px;font-size:12px}

.sd-skeleton{display:grid;gap:8px}
.sd-skeleton > div{height:12px;border-radius:8px;background:#e5e7eb;animation:pulse 1.2s infinite ease-in-out}
@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
`;
