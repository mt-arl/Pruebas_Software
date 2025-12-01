const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const User = require("../models/User");
const Sclass = require("../models/Sclass");
const Grade = require("../models/Grade");
const Subject = require("../models/subjectSchema");

let tokenAdmin, tokenStudent, tokenStudent2, studentId, studentId2, classId, subjectId;

// ⬅️ Timeout aumentado a 30s
beforeAll(async () => {
  // Limpiar BD
  await User.deleteMany({});
  await Sclass.deleteMany({});
  await Grade.deleteMany({});
  await Subject.deleteMany({});

  // Crear admin
  const admin = await User.create({
    name: "Admin",
    email: "admin@test.com",
    password: await require("bcrypt").hash("12345678", 12),
    role: "admin"
  });

  const resAdminLogin = await request(app)
    .post("/api/users/login")
    .send({ email: "admin@test.com", password: "12345678" });
  tokenAdmin = resAdminLogin.body.token;

  // Crear estudiantes
  const student1 = await User.create({
    name: "Student1",
    email: "student1@test.com",
    password: await require("bcrypt").hash("12345678", 12),
    role: "student"
  });
  const student2 = await User.create({
    name: "Student2",
    email: "student2@test.com",
    password: await require("bcrypt").hash("12345678", 12),
    role: "student"
  });

  const login1 = await request(app)
    .post("/api/users/login")
    .send({ email: "student1@test.com", password: "12345678" });
  tokenStudent = login1.body.token;
  studentId = student1._id.toString();

  const login2 = await request(app)
    .post("/api/users/login")
    .send({ email: "student2@test.com", password: "12345678" });
  tokenStudent2 = login2.body.token;
  studentId2 = student2._id.toString();

  // Crear materia
  const subject = await Subject.create({ subName: "Matemáticas" });
  subjectId = subject._id;

  // Crear clase y matricular student1
  const sclass = await Sclass.create({
    sclassName: "Clase A",
    subject: subjectId,
    teacher: admin._id,
    students: [studentId]
  });
  classId = sclass._id;

  // Crear calificación student1
  await Grade.create({
    student: studentId,
    subject: subjectId,
    score: 95
  });

}, 30000); // ⬅️ Timeout de 30s

// ======================================================
// 🟢 REPORT API TESTING
// ======================================================
describe("REPORT API TESTING", () => {

  test("Student puede generar su propio reporte PDF", async () => {
    const res = await request(app)
      .get(`/api/reports/student/${studentId}`)
      .set("Authorization", `Bearer ${tokenStudent}`)
      .expect(200);

    expect(res.header['content-type']).toBe('application/pdf');
    expect(res.header['content-disposition']).toContain('attachment');
  });

  test("Student NO puede generar reporte de otro estudiante", async () => {
    const res = await request(app)
      .get(`/api/reports/student/${studentId2}`)
      .set("Authorization", `Bearer ${tokenStudent}`)
      .expect(403);

    expect(res.body.message).toBe("Access denied");
  });

  test("Admin puede generar reporte de cualquier estudiante", async () => {
    const res = await request(app)
      .get(`/api/reports/student/${studentId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(res.header['content-type']).toBe('application/pdf');
  });

  test("Token inválido devuelve 401", async () => {
    const res = await request(app)
      .get(`/api/reports/student/${studentId}`)
      .set("Authorization", `Bearer INVALIDTOKEN`)
      .expect(401);

    expect(res.body.error).toBe("Token inválido o expirado");
  });

});

// 🔚 Cerrar conexión
afterAll(async () => {
  await mongoose.connection.close();
});
