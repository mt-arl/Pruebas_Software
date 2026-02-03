import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 20 },  // Rampa hasta 20 usuarios en 1min
    { duration: '2m', target: 50 },  // Rampa hasta 50 usuarios en 2min
    { duration: '2m', target: 100 }, // Rampa hasta 100 usuarios en 2min
    { duration: '1m', target: 50 },  // Baja a 50 usuarios en 1min
    { duration: '1m', target: 0 },   // Baja a 0 usuarios en 1min
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% requests <1s
    http_req_failed: ['rate<0.15'],    // <15% de fallos
    errors: ['rate<0.15'],
  },
};

const BASE_URL = 'http://localhost:5000/api';

const credentials = {
  admin: { email: 'admin@school.com', password: 'admin12345' },
  teacher: { email: 'profesor@school.com', password: 'profesor123' },
  student: { email: 'estudiante@school.com', password: 'student123' },
};

export function setup() {
  console.log('💪 Iniciando prueba de estrés...');
  console.log('⚠️  Esta prueba puede tomar ~7 minutos');
  
  const tokens = {};
  const roles = ['admin', 'teacher', 'student'];
  
  roles.forEach(role => {
    let res = http.post(`${BASE_URL}/users/login`, JSON.stringify({
      email: credentials[role].email,
      password: credentials[role].password
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (res.status === 401) {
      const registerData = {
        name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        email: credentials[role].email,
        password: credentials[role].password,
        role: role
      };
      
      http.post(`${BASE_URL}/users/register`, JSON.stringify(registerData), {
        headers: { 'Content-Type': 'application/json' }
      });
      
      res = http.post(`${BASE_URL}/users/login`, JSON.stringify({
        email: credentials[role].email,
        password: credentials[role].password
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (res.status === 200) {
      tokens[role] = res.json('token');
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
  
  // Escenario 1: Usuario consulta su perfil
  let res = http.get(`${BASE_URL}/users/me`, { headers });
  check(res, {
    'status 200': (r) => r.status === 200,
    'has user data': (r) => r.json('email') !== undefined,
  }) || errorRate.add(1);
  
  sleep(Math.random() * 2 + 1); // Entre 1 y 3 segundos
  
  // Escenario 2: Usuario consulta materias disponibles
  res = http.get(`${BASE_URL}/subjects`, { headers });
  check(res, {
    'subjects loaded': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(Math.random() * 2 + 1);
  
  // Escenario 3: Usuario consulta clases
  res = http.get(`${BASE_URL}/class`, { headers });
  check(res, {
    'classes loaded': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(Math.random() * 2 + 1);
  
  // Escenario 4: Operaciones específicas por rol
  if (role === 'admin') {
    // Admin consulta todos los usuarios
    res = http.get(`${BASE_URL}/users`, { headers });
    check(res, {
      'all users retrieved': (r) => r.status === 200,
    }) || errorRate.add(1);
  } else if (role === 'student') {
    // Estudiante consulta sus notas
    res = http.get(`${BASE_URL}/grades`, { headers });
    check(res, {
      'grades retrieved': (r) => r.status === 200,
    }) || errorRate.add(1);
  }
  
  sleep(Math.random() * 3 + 2); // Entre 2 y 5 segundos
}

export function teardown(tokens) {
  console.log('✅ Prueba de estrés completada');
}