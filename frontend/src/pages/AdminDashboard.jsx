// File: src/pages/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const DEBUG = false;

export default function AdminDashboard() {
  const navigate = useNavigate();

  // ===== Estado general =====
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Datos
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [users, setUsers] = useState([]);

  // Forms
  const [newSubject, setNewSubject] = useState('');
  const [newClass, setNewClass] = useState({ name: '', subjectId: '', teacherId: '' });
  const [registerUser, setRegisterUser] = useState({ name: '', email: '', password: '', role: 'teacher' });
  const [reportStudentId, setReportStudentId] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Enrolar alumno
  const [enroll, setEnroll] = useState({ classId: '', studentId: '' });

  // Expandir alumnos por clase
  const [expanded, setExpanded] = useState({}); // { [classId]: { open: true, students: [...] } }

  // ===== Sesión & Token =====
  const session = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);
  const token = useMemo(() => resolveToken(session), [session]);

  function resolveToken(s) {
    const cands = [
      s?.token, s?.accessToken, s?.jwt, s?.authToken, s?.authorization,
      s?.user?.token, s?.data?.token,
    ].filter(Boolean);
    const t = cands.find(x => typeof x === 'string' && x.trim());
    if (!t) return null;
    return t.replace(/^Bearer\s+/i, '').trim();
  }
  function buildAuthHeaders() {
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`,
      'x-access-token': token,
      'x-auth-token': token,
    };
  }

  // ===== Helpers HTTP =====
  async function safeText(res) {
    try { return (await res.text()).replace(/<[^>]*>/g, '').trim(); }
    catch { return 'Respuesta no válida.'; }
  }
  async function tryRequest(paths, { accept = 'application/json', stopOn401 = true } = {}) {
    let lastErr = null;
    for (const p of paths) {
      const opt = typeof p === 'string' ? { path: p, method: 'GET' } : p;
      if (DEBUG) console.log('[tryRequest]', opt);
      try {
        const headersExtra = opt.headers || {};
        const contentTypeProvided = Object.keys(headersExtra).some(k => k.toLowerCase() === 'content-type');

        const res = await fetch(`${API_BASE}${opt.path}`, {
          method: opt.method || 'GET',
          headers: {
            ...buildAuthHeaders(),
            Accept: opt.accept || accept,
            ...headersExtra,
            ...(!contentTypeProvided && opt.body && opt.bodyRaw === undefined ? { 'Content-Type': 'application/json' } : {}),
          },
          body: opt.bodyRaw !== undefined
            ? opt.bodyRaw
            : (opt.body ? JSON.stringify(opt.body) : undefined),
        });

        if (!res.ok) {
          const txt = await safeText(res);
          const err = new Error(txt || res.statusText);
          err.status = res.status;
          throw err;
        }
        return res;
      } catch (e) {
        lastErr = e;
        if (e?.status === 401 && stopOn401) {
          setUnauthorized(true);
          throw e;
        }
        // seguir probando siguiente opción
      }
    }
    if (lastErr) throw lastErr;
    throw new Error('No se encontró un endpoint válido.');
  }
  async function tryJSON(paths, opts) {
    const res = await tryRequest(paths, opts);
    try { return await res.json(); }
    catch { return []; }
  }
  async function tryBlob(paths) {
    const res = await tryRequest(paths, { accept: 'application/pdf,application/octet-stream' });
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/pdf') || ct.includes('octet-stream')) return res.blob();
    try {
      const j = await res.clone().json();
      throw new Error(j?.message || 'El servidor no devolvió un PDF.');
    } catch {
      throw new Error(await safeText(res));
    }
  }

  // Pequeño helper: ejecuta la PRIMERA request que funcione; si todas fallan, lanza el último error
  async function tryFirstThatWorks(requests) {
    let lastErr = null;
    for (const req of requests) {
      try {
        await tryRequest([req]);
        return req; // éxito
      } catch (e) {
        lastErr = e;
        if (DEBUG) console.warn('[tryFirstThatWorks] fallo', req, e?.status, e?.message);
      }
    }
    throw lastErr || new Error('Ninguna variante funcionó');
  }

  // ===== Carga inicial =====
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token) { setUnauthorized(true); setLoading(false); return; }
      try {
        const loadUsers = (async () => {
          try {
            return await tryJSON(['/users', '/users/list', '/users/all', '/auth/users', '/user/all']);
          } catch (e) { if (e?.status === 404) return []; throw e; }
        })();

        const [subs, cls, grs, usrs] = await Promise.all([
          tryJSON(['/subjects', '/subject'], { stopOn401: true }),
          tryJSON(['/class', '/classes'], { stopOn401: true }),
          tryJSON(['/grades', '/grade'], { stopOn401: true }),
          loadUsers,
        ]);
        if (!mounted) return;

        setSubjects(Array.isArray(subs) ? subs : []);
        setClasses(Array.isArray(cls) ? cls : []);
        setGrades(Array.isArray(grs) ? grs : []);
        setUsers(Array.isArray(usrs) ? usrs : []);
      } catch (e) {
        if (e?.status === 401) setError('Tu sesión no tiene permiso o ha expirado (401). Inicia sesión como administrador.');
        else setError(cleanErr(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  // ===== Derivados =====
  const teachers = useMemo(() => users.filter(u => (u.role || '').toLowerCase() === 'teacher'), [users]);
  const students = useMemo(() => users.filter(u => (u.role || '').toLowerCase() === 'student'), [users]);
  function cmpUsers(a,b){const ea=(a.email||'').toLowerCase(),eb=(b.email||'').toLowerCase(); if(ea&&eb&&ea!==eb) return ea<eb?-1:1; const na=(a.name||'').toLowerCase(),nb=(b.name||'').toLowerCase(); return na<nb?-1:na>nb?1:0;}
  const teachersSorted = useMemo(() => [...teachers].sort(cmpUsers), [teachers]);
  const studentsSorted = useMemo(() => [...students].sort(cmpUsers), [students]);
  const usersById = useMemo(() => { const m=new Map(); users.forEach(u=>{const id=u._id||u.id; if(id) m.set(id,u);}); return m;}, [users]);

  // ===== Subjects =====
  async function handleCreateSubject(e){
    e?.preventDefault(); setMessage(''); setError('');
    const name=newSubject.trim(); if(!name) return setError('Escribe el nombre de la materia.');
    try{
      const created = await tryJSON([
        { path:'/subjects', method:'POST', body:{ subName:name } },
        { path:'/subjects', method:'POST', body:{ name } },
        { path:'/subject',  method:'POST', body:{ subName:name } },
        { path:'/subject',  method:'POST', body:{ name } },
      ]);
      setSubjects(prev=>[created,...prev]); setNewSubject(''); setMessage('Materia creada.');
    }catch(e){ if(e?.status===401) setUnauthorized(true); setError(cleanErr(e)); }
  }
  async function handleDeleteSubject(id){
    setMessage(''); setError('');
    try{
      await tryRequest([{ path:`/subjects/${id}`, method:'DELETE' }, { path:`/subject/${id}`, method:'DELETE' }]);
      setSubjects(prev=>prev.filter(s=>(s._id||s.id)!==id)); setMessage('Materia eliminada.');
    }catch(e){ if(e?.status===401) setUnauthorized(true); setError(cleanErr(e)); }
  }

  // ===== Classes =====
  async function handleCreateClass(e){
    e?.preventDefault(); setMessage(''); setError('');
    const sclassName=newClass.name.trim(), subject=newClass.subjectId, teacher=newClass.teacherId;
    if(!sclassName||!subject||!teacher) return setError('Completa: Nombre de clase, Materia y Docente.');
    try{
      const created = await tryJSON([
        { path:'/classes', method:'POST', body:{ sclassName, subject, teacher } },
        { path:'/class',   method:'POST', body:{ sclassName, subject, teacher } },
        { path:'/classes', method:'POST', body:{ name:sclassName, subject, teacher } },
        { path:'/class',   method:'POST', body:{ name:sclassName, subject, teacher } },
      ]);
      setClasses(prev=>[created,...prev]); setNewClass({ name:'', subjectId:'', teacherId:'' }); setMessage('Clase creada.');
    }catch(e){ if(e?.status===401) setUnauthorized(true); setError(cleanErr(e)); }
  }
  async function handleDeleteClass(id){
    setMessage(''); setError('');
    try{
      await tryRequest([{ path:`/classes/${id}`, method:'DELETE' }, { path:`/class/${id}`, method:'DELETE' }]);
      setClasses(prev=>prev.filter(c=>(c._id||c.id)!==id)); setMessage('Clase eliminada.');
    }catch(e){ if(e?.status===401) setUnauthorized(true); setError(cleanErr(e)); }
  }

  // Ver alumnos
  async function fetchClassStudents(classId){
    const cls = classes.find(c=>(c._id||c.id)===classId);
    const pre = cls?.students || cls?.members || cls?.alumnos || cls?.enrolled;
    if(Array.isArray(pre)) return pre;
    try{
      const list1 = await tryJSON([
        `/class/${classId}/students`,
        `/classes/${classId}/students`,
        `/class/${classId}/members`,
        `/classes/${classId}/members`,
      ], { stopOn401:true });
      if(Array.isArray(list1)) return list1;
    }catch(e){ if(e?.status===401) throw e; }
    try{
      const detail = await tryJSON([`/class/${classId}`, `/classes/${classId}`], { stopOn401:true });
      const arr = detail?.students || detail?.members || detail?.alumnos || detail?.enrolled || [];
      if(Array.isArray(arr)) return arr;
    }catch(e){ if(e?.status===401) throw e; }
    return [];
  }
  async function toggleStudents(classId){
    setMessage(''); setError('');
    const curr = expanded[classId];
    if(curr?.open){ setExpanded(prev=>({ ...prev, [classId]:{ ...curr, open:false } })); return; }
    try{ const list=await fetchClassStudents(classId); setExpanded(prev=>({ ...prev, [classId]:{ open:true, students:Array.isArray(list)?list:[] } })); }
    catch(e){ if(e?.status===401) setUnauthorized(true); setError(cleanErr(e)); }
  }

  // ===== Enrolar alumno a clase (intentos exhaustivos y ordenados) =====
  async function handleEnroll(e){
    e?.preventDefault(); setMessage(''); setError('');
    const classId=enroll.classId.trim(), studentId=enroll.studentId.trim();
    if(!classId||!studentId) return setError('Selecciona una clase y un estudiante.');

    // 1) /class/:id/enroll con múltiples payloads y métodos
    const payloads = [
      { student: studentId },        // lo más probable
      { studentId },
      { userId: studentId },
      { user: studentId },
      { id: studentId },
      { students: [studentId] },
      { members: [studentId] },
      { alumnos: [studentId] },
      { enrolled: [studentId] },
      { student: { _id: studentId } },
      { student: { id: studentId } },
    ];
    const methods = ['POST','PUT','PATCH'];
    try {
      const reqs1 = [];
      for (const m of methods) for (const b of payloads) {
        reqs1.push({ path:`/class/${classId}/enroll`, method:m, body:b });
      }
      await tryFirstThatWorks(reqs1);
      return afterEnrollSuccess(classId, studentId);
    } catch (err1) {
      if (DEBUG) console.warn('nivel 1 fallo:', err1?.message);

      // 2) rutas alternativas
      try {
        const altPaths = [
          `/class/${classId}/students`,
          `/class/${classId}/add-student`,
          `/classes/${classId}/students`,
          `/classes/${classId}/members`,
        ];
        const reqs2 = [];
        for (const p of altPaths) for (const m of methods) for (const b of payloads) {
          reqs2.push({ path:p, method:m, body:b });
        }
        await tryFirstThatWorks(reqs2);
        return afterEnrollSuccess(classId, studentId);
      } catch (err2) {
        if (DEBUG) console.warn('nivel 2 fallo:', err2?.message);

        // 3) x-www-form-urlencoded como último recurso "acción"
        try {
          const form = new URLSearchParams({ classId, studentId }).toString();
          const reqs3 = [
            { path:`/enroll`,          method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, bodyRaw: form },
            { path:`/classes/enroll`,  method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, bodyRaw: form },
            { path:`/class/enroll`,    method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, bodyRaw: form },
          ];
          await tryFirstThatWorks(reqs3);
          return afterEnrollSuccess(classId, studentId);
        } catch (err3) {
          if (DEBUG) console.warn('nivel 3 fallo:', err3?.message);

          // 4) Leer clase y actualizar students (PUT/PATCH)
          try {
            const detail = await tryJSON([`/class/${classId}`, `/classes/${classId}`], { stopOn401:true });
            if (!detail || typeof detail !== 'object') throw new Error('Clase no encontrada para actualizar.');
            const list = detail.students || detail.members || detail.alumnos || detail.enrolled || [];
            const ids = list.map(s => (typeof s === 'string' ? s : (s?._id || s?.id))).filter(Boolean);
            if (!ids.includes(studentId)) ids.push(studentId);

            const bodies = [
              { ...detail, students: ids },
              { ...detail, members: ids },
              { ...detail, alumnos: ids },
              { ...detail, enrolled: ids },
            ];
            const reqs4 = [];
            for (const b of bodies) for (const m of ['PUT','PATCH']) {
              reqs4.push({ path:`/class/${classId}`,   method:m, body:b });
              reqs4.push({ path:`/classes/${classId}`, method:m, body:b });
            }
            await tryFirstThatWorks(reqs4);
            return afterEnrollSuccess(classId, studentId);
          } catch (err4) {
            setError(cleanErr(err4 || err3 || err2 || err1));
            return;
          }
        }
      }
    }
  }

  async function afterEnrollSuccess(classId, studentId){
    setMessage('Estudiante inscrito en la clase.');
    try{
      if(expanded[classId]?.open){
        const list = await fetchClassStudents(classId);
        setExpanded(prev=>({ ...prev, [classId]: { open:true, students:list } }));
      }
    }catch{}
    setClasses(prev=>prev.map(c=>{
      const cid=c._id||c.id; if(cid!==classId) return c;
      const current=c.students||c.members||c.alumnos||c.enrolled||[];
      const already=current.some(s=>(typeof s==='string'? s===studentId : (s?._id||s?.id)===studentId));
      const nextArr=already?current:[...current,{ _id:studentId }];
      return { ...c, students: nextArr };
    }));
    setEnroll({ classId:'', studentId:'' });
  }

  // ===== Users =====
  async function handleRegisterUser(e){
    e?.preventDefault(); setMessage(''); setError('');
    const { name,email,password,role } = registerUser;
    if(!name.trim()||!email.trim()||!password.trim()||!role) return setError('Completa nombre, email, contraseña y rol.');
    try{
      const data = await tryJSON([
        { path:'/users/register', method:'POST', body:{ name,email,password,role } },
        { path:'/users',          method:'POST', body:{ name,email,password,role } },
      ]);
      setUsers(prev=>[data,...prev]); setRegisterUser({ name:'', email:'', password:'', role:'teacher' }); setMessage('Usuario registrado.');
    }catch(e){ if(e?.status===401) setUnauthorized(true); setError(cleanErr(e)); }
  }

  // ===== Grades =====
  async function handleDeleteGrade(id){
    setMessage(''); setError('');
    try{
      await tryRequest([{ path:`/grades/${id}`, method:'DELETE' }, { path:`/grade/${id}`, method:'DELETE' }]);
      setGrades(prev=>prev.filter(g=>g._id!==id)); setMessage('Nota eliminada.');
    }catch(e){ if(e?.status===401) setUnauthorized(true); setError(cleanErr(e)); }
  }

  async function refreshAll(){
    setMessage(''); setError(''); setLoading(true);
    try{
      const loadUsers = (async () => { try{ return await tryJSON(['/users','/users/list','/users/all','/auth/users','/user/all']); } catch(e){ if(e?.status===401) setUnauthorized(true); return []; }})();
      const [subs,cls,grs,usrs] = await Promise.all([
        tryJSON(['/subjects','/subject']),
        tryJSON(['/class','/classes']),
        tryJSON(['/grades','/grade']),
        loadUsers,
      ]);
      setSubjects(Array.isArray(subs)?subs:[]);
      setClasses(Array.isArray(cls)?cls:[]);
      setGrades(Array.isArray(grs)?grs:[]);
      setUsers(Array.isArray(usrs)?usrs:[]);
      setMessage('Datos actualizados.');
    }catch(e){ setError(cleanErr(e)); } finally{ setLoading(false); }
  }

  // ===== Reportes =====
  async function downloadReportById(id){
    setMessage(''); setError('');
    if(!id) return setError('Selecciona o ingresa el ID del estudiante.');
    try{
      setDownloading(true);
      const blob = await tryBlob([
        { path:`/reports/student/${id}`, method:'GET' },
        { path:`/report/student/${id}`,  method:'GET' },
        { path:`/reports/${id}`,         method:'GET' },
        { path:`/report/${id}`,          method:'GET' },
        { path:`/reports?student=${encodeURIComponent(id)}`, method:'GET' },
        { path:`/report?student=${encodeURIComponent(id)}`,  method:'GET' },
        { path:`/reports/student/${id}`, method:'POST', body:{ id } },
        { path:`/report/student/${id}`,  method:'POST', body:{ id } },
        { path:`/reports`,               method:'POST', body:{ student:id } },
        { path:`/report`,                method:'POST', body:{ studentId:id } },
      ]);
      triggerDownload(blob, `report_${id}_${today()}.pdf`);
      setMessage('Reporte descargado.');
    }catch(e){ if(e?.status===401) setUnauthorized(true); setError(cleanErr(e)); } finally{ setDownloading(false); }
  }

  function triggerDownload(blob, filename){
    const url=window.URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=filename;
    document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
  }
  function today(){ const d=new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; }
  function handleLogout(){ localStorage.removeItem('user'); navigate('/login'); }

  // ===== UI (mismo CSS bonito de antes) =====
  return (
    <div className="ad-page">
      <style>{css}</style>

      <header className="ad-navbar">
        <div className="ad-navwrap">
          <div className="ad-brand">
            <div className="ad-logo">A</div>
            <div className="ad-brandtext">
              <h1>Admin <span>Dashboard</span></h1>
              <p>Gestión de materias, clases, usuarios, notas y reportes.</p>
            </div>
          </div>
          <div className="ad-actions">
            <button onClick={refreshAll} className="ad-btn ad-btn--dark" disabled={loading}>Refrescar</button>
            <button onClick={handleLogout} className="ad-btn ad-btn--danger">Salir</button>
          </div>
        </div>
      </header>

      <main className="ad-container">
        {unauthorized && (
          <div className="ad-alert ad-alert--err">
            Tu sesión no es válida o no tiene permisos (401). Inicia sesión como <b>admin</b>.
            <button className="ad-badge ad-badge--danger" style={{ marginLeft: 8 }} onClick={handleLogout}>Ir a login</button>
          </div>
        )}

        {message && <div className="ad-alert ad-alert--ok">{message}</div>}
        {error && <div className="ad-alert ad-alert--err">{error}</div>}

        <section className="ad-grid">
          <Stat label="Materias" value={subjects.length} grad="blue" />
          <Stat label="Clases" value={classes.length} grad="indigo" />
          <Stat label="Usuarios" value={users.length} grad="green" />
          <Stat label="Notas" value={grades.length} grad="amber" />
        </section>

        {/* SUBJECTS */}
        <section className="ad-card">
          <div className="ad-section-head">
            <h2 className="ad-h2">Materias</h2>
            <form onSubmit={handleCreateSubject} className="ad-inline-form">
              <input type="text" placeholder="Nombre de la materia" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
              <button className="ad-btn" disabled={unauthorized}>Agregar</button>
            </form>
          </div>
          {loading ? <Skeleton lines={3} /> : (
            subjects.length === 0 ? <p className="ad-empty">Aún no hay materias.</p> : (
              <table className="ad-table">
                <thead><tr><th>Nombre</th><th style={{width:100}}>Acciones</th></tr></thead>
                <tbody>
                  {subjects.map(s => {
                    const id = s._id || s.id;
                    const name = s.subName || s.name || '—';
                    return (
                      <tr key={id}>
                        <td>{name}</td>
                        <td><button className="ad-badge ad-badge--danger" onClick={() => handleDeleteSubject(id)} disabled={unauthorized}>Eliminar</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}
        </section>

        {/* CLASSES */}
        <section className="ad-card">
          <div className="ad-section-head">
            <h2 className="ad-h2">Clases</h2>
          <form onSubmit={handleCreateClass} className="ad-form-grid">
              <input type="text" placeholder="Nombre de la clase" value={newClass.name} onChange={(e)=>setNewClass(v=>({ ...v, name:e.target.value }))} />
              <select value={newClass.subjectId} onChange={(e)=>setNewClass(v=>({ ...v, subjectId:e.target.value }))}>
                <option value="">Materia…</option>
                {subjects.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.subName || s.name}</option>)}
              </select>
              <select value={newClass.teacherId} onChange={(e)=>setNewClass(v=>({ ...v, teacherId:e.target.value }))} disabled={teachersSorted.length===0}>
                <option value="">{teachersSorted.length ? 'Docente (correo)…' : 'No hay docentes'}</option>
                {teachersSorted.map(t => <option key={t._id || t.id} value={t._id || t.id}>{t.email || t.name || (t._id || t.id)}</option>)}
              </select>
              <button className="ad-btn" disabled={unauthorized || teachersSorted.length===0}>Crear clase</button>
            </form>
          </div>

          {loading ? <Skeleton lines={5} /> : (
            classes.length === 0 ? <p className="ad-empty">Aún no hay clases.</p> : (
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Clase</th><th>Materia</th><th>Docente</th><th>Alumnos</th><th style={{width:220}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map(c => {
                    const id = c._id || c.id;
                    const subName = c.subject?.subName || c.subject?.name || '—';
                    const teacherObj = (typeof c.teacher === 'object' && c.teacher) || usersById.get(c.teacher) || null;
                    const teacherLabel = teacherObj ? (teacherObj.email || teacherObj.name || teacherObj._id || teacherObj.id)
                      : (c.teacher?.email || c.teacher?.name || c.teacher || '—');

                    const count = (c.students?.length ?? c.members?.length ?? c.alumnos?.length ?? c.enrolled?.length ?? 0);
                    const isOpen = expanded[id]?.open;
                    const list = expanded[id]?.students || [];

                    return (
                      <React.Fragment key={id}>
                        <tr>
                          <td>{c.sclassName || c.name || '—'}</td>
                          <td>{subName}</td>
                          <td>{teacherLabel}</td>
                          <td>{count || (isOpen ? list.length : '—')}</td>
                          <td className="ad-row-actions">
                            <button className="ad-badge" onClick={() => toggleStudents(id)} disabled={unauthorized}>
                              {isOpen ? 'Ocultar alumnos' : 'Ver alumnos'}
                            </button>
                            <button className="ad-badge ad-badge--danger" onClick={() => handleDeleteClass(id)} disabled={unauthorized}>Eliminar</button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr key={`detail-${id}`}>
                            <td colSpan={5}>
                              {list?.length ? (
                                <ul className="ad-list">
                                  {list.map(s => {
                                    const sid = typeof s === 'string' ? s : (s?._id || s?.id);
                                    const su = usersById.get(sid);
                                    const label = su ? `${su.name || su.email || sid} — ${su.email || ''}`.trim()
                                                     : (s?.name || s?.email || sid || String(s));
                                    return <li key={sid || String(Math.random())}>{label}</li>;
                                  })}
                                </ul>
                              ) : <p className="ad-empty">La clase no tiene alumnos matriculados.</p>}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )
          )}
        </section>

        {/* ENROLAR ESTUDIANTE A CLASE */}
        <section className="ad-card">
          <div className="ad-section-head">
            <h2 className="ad-h2">Inscribir estudiante a clase</h2>
          </div>
          <form onSubmit={handleEnroll} className="ad-form-grid">
            <select value={enroll.classId} onChange={(e)=>setEnroll(v=>({ ...v, classId:e.target.value }))}>
              <option value="">Clase…</option>
              {classes.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.sclassName || c.name}</option>)}
            </select>
            <select value={enroll.studentId} onChange={(e)=>setEnroll(v=>({ ...v, studentId:e.target.value }))} disabled={studentsSorted.length===0}>
              <option value="">{studentsSorted.length ? 'Estudiante (correo)…' : 'No hay estudiantes'}</option>
              {studentsSorted.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.email || s.name || (s._id || s.id)}</option>)}
            </select>
            <button className="ad-btn" disabled={unauthorized || studentsSorted.length===0}>Inscribir</button>
          </form>
        </section>

        {/* USERS */}
        <section className="ad-card">
          <div className="ad-section-head">
            <h2 className="ad-h2">Registrar usuario</h2>
          </div>
          <form onSubmit={handleRegisterUser} className="ad-form-grid">
            <input type="text" placeholder="Nombre" value={registerUser.name} onChange={(e)=>setRegisterUser(v=>({ ...v, name:e.target.value }))} />
            <input type="email" placeholder="Email" value={registerUser.email} onChange={(e)=>setRegisterUser(v=>({ ...v, email:e.target.value }))} />
            <input type="password" placeholder="Contraseña" value={registerUser.password} onChange={(e)=>setRegisterUser(v=>({ ...v, password:e.target.value }))} />
            <select value={registerUser.role} onChange={(e)=>setRegisterUser(v=>({ ...v, role:e.target.value }))}>
              <option value="teacher">Docente</option>
              <option value="student">Estudiante</option>
            </select>
            <button className="ad-btn" disabled={unauthorized}>Registrar</button>
          </form>
        </section>

        {/* LISTADOS */}
        <section className="ad-card">
          <div className="ad-section-head">
            <h2 className="ad-h2">Usuarios — Docentes y Estudiantes</h2>
          </div>
          {users.length === 0 ? (
            <p className="ad-empty">No pude cargar usuarios. Asegúrate de tener un endpoint como <code>/users</code>.</p>
          ) : (
            <div className="ad-users-grid">
              <div className="ad-subcard">
                <h3 className="ad-h3">Docentes ({teachersSorted.length})</h3>
                {teachersSorted.length === 0 ? <p className="ad-empty">Sin docentes.</p> : (
                  <table className="ad-table">
                    <thead><tr><th>Nombre</th><th>Email</th><th>ID</th></tr></thead>
                    <tbody>
                      {teachersSorted.map(t => (
                        <tr key={t._id || t.id}>
                          <td>{t.name || '—'}</td>
                          <td>{t.email || '—'}</td>
                          <td>{t._id || t.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="ad-subcard">
                <h3 className="ad-h3">Estudiantes ({studentsSorted.length})</h3>
                {studentsSorted.length === 0 ? <p className="ad-empty">Sin estudiantes.</p> : (
                  <table className="ad-table">
                    <thead><tr><th>Nombre</th><th>Email</th><th>ID</th></tr></thead>
                    <tbody>
                      {studentsSorted.map(s => (
                        <tr key={s._id || s.id}>
                          <td>{s.name || '—'}</td>
                          <td>{s.email || '—'}</td>
                          <td>{s._id || s.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </section>

        {/* GRADES */}
        <section className="ad-card">
          <div className="ad-section-head">
            <h2 className="ad-h2">Notas</h2>
            <div className="ad-inline-form">
              {studentsSorted.length > 0 ? (
                <select value={reportStudentId} onChange={(e)=>setReportStudentId(e.target.value)}>
                  <option value="">Estudiante para reporte…</option>
                  {studentsSorted.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.email || s.name || (s._id || s.id)}</option>)}
                </select>
              ) : (
                <input type="text" placeholder="ID estudiante para reporte…" value={reportStudentId} onChange={(e)=>setReportStudentId(e.target.value)} />
              )}
              <button className="ad-btn" disabled={downloading || unauthorized} onClick={()=>downloadReportById(reportStudentId)}>
                {downloading ? 'Preparando…' : 'Descargar reporte'}
              </button>
            </div>
          </div>

          {loading ? <Skeleton lines={6} /> : grades.length === 0 ? (
            <p className="ad-empty">Aún no hay notas registradas.</p>
          ) : (
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Estudiante</th><th>Materia</th><th>Clase</th><th>Puntaje</th><th style={{width:180}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {grades.map(g => {
                  const sid = typeof g.student === 'string' ? g.student : (g.student?._id || g.student?.id);
                  const su = usersById.get(sid);
                  const studentLabel = su ? (su.email || su.name || sid) : (g.student?.email || g.student?.name || sid || '—');
                  return (
                    <tr key={g._id}>
                      <td>{studentLabel}</td>
                      <td>{g.subject?.subName || g.subject?.name || '—'}</td>
                      <td>{g.sclass?.sclassName || g.sclass?.name || '—'}</td>
                      <td>{g.score}</td>
                      <td className="ad-row-actions">
                        <button className="ad-badge" onClick={()=>downloadReportById(sid)} disabled={unauthorized}>Reporte</button>
                        <button className="ad-badge ad-badge--danger" onClick={()=>handleDeleteGrade(g._id)} disabled={unauthorized}>Eliminar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

/* ===== UI bits ===== */
function Stat({ label, value, grad='blue' }) {
  return (
    <div className={`ad-stat ad-stat--${grad}`}>
      <p className="ad-stat-label">{label}</p>
      <p className="ad-stat-value">{value}</p>
    </div>
  );
}
function Skeleton({ lines=4 }) {
  return (
    <div className="ad-skeleton">
      {Array.from({ length: lines }).map((_,i)=><div key={i} />)}
    </div>
  );
}
function cleanErr(e){ const raw=e?.message||String(e); return raw.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim()||'Error'; }

/* ===== CSS embebido (opción B) ===== */
const css = `
:root{--bg:#f4f6fb;--card:#fff;--border:#e6e8ee;--text:#0f172a;--muted:#64748b;--blue:#2563eb;--indigo:#4f46e5;--green:#10b981;--amber:#d97706;--dark:#0f172a;--red:#dc2626;}
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
.ad-subcard{margin-top:12px;padding:12px;border:1px dashed var(--border);border-radius:12px;background:#f8fafc}
.ad-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.ad-h2{margin:0;font-size:18px;font-weight:700}
.ad-h3{margin:0 0 6px 0;font-weight:600}
.ad-empty{color:var(--muted);font-size:14px}
.ad-grid{display:grid;grid-template-columns:repeat(1,1fr);gap:16px}
@media (min-width:640px){.ad-grid{grid-template-columns:repeat(4,1fr)}}
.ad-stat{position:relative;overflow:hidden;border:1px solid var(--border);border-radius:18px;background:#fff;padding:20px}
.ad-stat::before{content:"";position:absolute;inset:auto -20px 0 -20px;height:60px;opacity:.12;filter:blur(10px)}
.ad-stat--blue::before{background:linear-gradient(90deg,#3b82f6,#60a5fa)}
.ad-stat--indigo::before{background:linear-gradient(90deg,#6366f1,#8b5cf6)}
.ad-stat--green::before{background:linear-gradient(90deg,#10b981,#14b8a6)}
.ad-stat--amber::before{background:linear-gradient(90deg,#f59e0b,#fb923c)}
.ad-stat-label{color:var(--muted);font-size:13px}
.ad-stat-value{font-size:28px;font-weight:800;margin-top:4px;letter-spacing:-.02em}
.ad-inline-form{display:flex;gap:8px;flex-wrap:wrap}
.ad-inline-form input,.ad-inline-form select{border:1px solid var(--border);border-radius:12px;padding:10px 12px;font-size:14px;min-width:260px;background:#fff}
.ad-form-grid{display:grid;grid-template-columns:2fr 2fr 2fr auto;gap:8px}
@media (max-width:640px){.ad-form-grid{grid-template-columns:1fr}}
.ad-form-grid input,.ad-form-grid select{border:1px solid var(--border);border-radius:12px;padding:10px 12px;font-size:14px;background:#fff}
.ad-form-grid button{justify-self:start}
.ad-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--border);border-radius:12px;overflow:hidden}
.ad-table thead th{background:#f8fafc;text-align:left;padding:10px 12px;font-weight:600;color:#334155;font-size:14px;border-bottom:1px solid var(--border)}
.ad-table tbody td{padding:10px 12px;border-bottom:1px solid var(--border)}
.ad-table tbody tr:nth-child(even){background:#f9fafb}
.ad-row-actions{display:flex;gap:8px;flex-wrap:wrap}
.ad-badge{border:0;border-radius:999px;padding:6px 10px;font-size:12px;background:#e2e8f0;color:#0f172a;cursor:pointer}
.ad-badge:hover{filter:brightness(.95)}
.ad-badge--danger{background:#fee2e2;color:#991b1b}
.ad-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.ad-pills{display:flex;gap:8px;flex-wrap:wrap}
.ad-pill{background:#eef2ff;color:#3730a3;border:1px solid #e0e7ff;border-radius:999px;padding:6px 10px;font-size:12px}
.ad-users-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media (max-width:900px){.ad-users-grid{grid-template-columns:1fr}}
.ad-alert{border-radius:12px;padding:10px 14px;font-size:14px}
.ad-alert--ok{background:#ecfdf5;border:1px solid #d1fae5;color:#065f46}
.ad-alert--err{background:#fef2f2;border:1px solid #fee2e2;color:#991b1b}
.ad-skeleton{display:grid;gap:8px}
.ad-skeleton>div{height:12px;border-radius:8px;background:#e5e7eb;animation:ad-pulse 1.2s infinite ease-in-out}
@keyframes ad-pulse{0%,100%{opacity:.5}50%{opacity:1}}
`;
