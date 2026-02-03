import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.1'],
  },
};

const BASE_URL = 'http://localhost:5000/api';

const credentials = {
  admin: { email: 'admin@school.com', password: 'admin12345' },
  teacher: { email: 'profesor@school.com', password: 'profesor123' },
  student: { email: 'estudiante@school.com', password: 'student123' },
};

export function setup() {
  console.log('🚀 Iniciando prueba de carga básica...');
  const roles = ['admin', 'teacher', 'student'];
  const tokens = {};

  roles.forEach(role => {
    let res = http.post(`${BASE_URL}/users/login`, JSON.stringify({
      email: credentials[role].email,
      password: credentials[role].password
    }), { headers: { 'Content-Type': 'application/json' } });

    // Si login falla con 401 → registrar
    if (res.status === 401) {
      const registerData = {
        name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        email: credentials[role].email,
        password: credentials[role].password,
        role: role
      };

      let regRes = http.post(`${BASE_URL}/users/register`, JSON.stringify(registerData), {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`${role} register status:`, regRes.status, regRes.body);

      // Intentar login nuevamente
      res = http.post(`${BASE_URL}/users/login`, JSON.stringify({
        email: credentials[role].email,
        password: credentials[role].password
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    console.log(`${role} login status:`, res.status, res.body);

    if (res.status === 200) {
      // Ajusta según el campo real que devuelva tu backend
      let body = res.json();
      tokens[role] = body.token || body.accessToken || null;
      console.log(`${role} token:`, tokens[role]);
    } else {
      console.error(`${role} login FAILED`);
    }
  });

  return tokens;
}

export default function(tokens) {
  const roles = ['admin', 'teacher', 'student'];
  const role = roles[Math.floor(Math.random() * roles.length)];
  const token = tokens[role];

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Perfil
  let res = http.get(`${BASE_URL}/users/me`, { headers });
  console.log("Profile status:", res.status, res.body);
  check(res, { 'profile retrieved': (r) => r.status === 200 }) || errorRate.add(1);
  sleep(1);

  // Materias
  res = http.get(`${BASE_URL}/subjects`, { headers });
  console.log("Subjects status:", res.status, res.body);
  check(res, { 'subjects retrieved': (r) => r.status === 200 }) || errorRate.add(1);
  sleep(1);

  // Clases
  res = http.get(`${BASE_URL}/class`, { headers });
  console.log("Classes status:", res.status, res.body);
  check(res, { 'classes retrieved': (r) => r.status === 200 }) || errorRate.add(1);
  sleep(1);

  // Notas (solo admin y student)
  if (role !== 'teacher') {
    res = http.get(`${BASE_URL}/grades`, { headers });
    console.log("Grades status:", res.status, res.body);
    check(res, { 'grades retrieved': (r) => r.status === 200 }) || errorRate.add(1);
  }
  sleep(1);
}

export function teardown(tokens) {
  console.log('✅ Prueba completada');
}
