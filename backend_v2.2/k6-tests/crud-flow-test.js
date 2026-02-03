import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const crudSuccessRate = new Rate('crud_success');
const operationsCompleted = new Counter('operations_completed');

export const options = {
  vus: 3,
  iterations: 10,
  thresholds: {
    crud_success: ['rate>0.95'],
    http_req_duration: ['p(95)<1000'],
  },
};

const BASE_URL = 'http://localhost:5000/api';

export function setup() {
  console.log('🔄 Iniciando pruebas de flujo CRUD...');

  const adminCreds = { email: 'admin@school.com', password: 'admin12345' };

  let res = http.post(`${BASE_URL}/users/login`, JSON.stringify(adminCreds), {
    headers: { 'Content-Type': 'application/json' }
  });

  if (res.status === 401) {
    const registerData = {
      name: 'Admin Test',
      email: adminCreds.email,
      password: adminCreds.password,
      role: 'admin'
    };

    let regRes = http.post(`${BASE_URL}/users/register`, JSON.stringify(registerData), {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log("Admin register:", regRes.status, regRes.body);

    res = http.post(`${BASE_URL}/users/login`, JSON.stringify(adminCreds), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  console.log("Admin login:", res.status, res.body);

  if (res.status !== 200) {
    throw new Error('No se pudo obtener token de admin');
  }

  const body = res.json();
  const token = body.token || body.accessToken || null;
  console.log("Admin token:", token);

  return { token };
}

export default function(data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json'
  };

  const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  let subjectId, classId, teacherId, studentId, gradeId;

  // CREATE Subject
  group('Create Subject', function() {
    const subjectData = { subName: `Materia Test ${uniqueId}` };
    const res = http.post(`${BASE_URL}/subjects`, JSON.stringify(subjectData), { headers });
    const success = check(res, {
      'subject created': (r) => r.status === 201,
      'has subject id': (r) => r.json('_id') !== undefined,
    });
    crudSuccessRate.add(success ? 1 : 0);
    if (success) {
      subjectId = res.json('_id');
      operationsCompleted.add(1);
    }
    console.log("Subject:", res.status, res.body);
    sleep(0.5);
  });

  // … (mantener la misma estructura para Teacher, Student, Class, Grade, READ, UPDATE, DELETE)
  // En cada bloque añade logs y usa crudSuccessRate.add(success ? 1 : 0)

  sleep(2);
}

export function teardown(data) {
  console.log('✅ Pruebas de flujo CRUD completadas');
  console.log(`   Total operaciones: ${operationsCompleted.value || 0}`);
}
