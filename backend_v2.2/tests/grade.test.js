const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const User = require("../models/User");
const Grade = require("../models/Grade");
const Subject = require("../models/subjectSchema");

let tokenAdmin, tokenTeacher, tokenStudent, studentId, gradeId, subjectId;

beforeAll(async () => {
  // Limpiar BD
  await User.deleteMany({});
  await Grade.deleteMany({});
  await Subject.deleteMany({});

  // Crear usuarios
  const admin = await User.create({
    name: "Admin",
    email: "admin@test.com",
    password: await require("bcrypt").hash("12345678", 12),
    role: "admin"
  });

  const teacher = await User.create({
    name: "Teacher",
    email: "teacher@test.com",
    password: await require("bcrypt").hash("12345678", 12),
    role: "teacher"
  });

  const student = await User.create({
    name: "Student",
    email: "student@test.com",
    password: await require("bcrypt").hash("12345678", 12),
    role: "student"
  });
  studentId = student._id.toString();

  // Login
  const loginAdmin = await request(app)
    .post("/api/users/login")
    .send({ email: "admin@test.com", password: "12345678" });
  tokenAdmin = loginAdmin.body.token;

  const loginTeacher = await request(app)
    .post("/api/users/login")
    .send({ email: "teacher@test.com", password: "12345678" });
  tokenTeacher = loginTeacher.body.token;

  const loginStudent = await request(app)
    .post("/api/users/login")
    .send({ email: "student@test.com", password: "12345678" });
  tokenStudent = loginStudent.body.token;

  // Crear materia
  const subject = await Subject.create({ subName: "Matemáticas" });
  subjectId = subject._id;
},30000); // ⬅️ Timeout de 30s

//======================================================
// 🟢 GRADE API TESTING
// ======================================================
describe("GRADE API TESTING", () => {

  test("Admin puede crear nota", async () => {
    const res = await request(app)
      .post("/api/grades")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ student: studentId, subject: subjectId, score: 90 });

    gradeId = res.body._id;

    expect(res.statusCode).toBe(201);
    expect(res.body.score).toBe(90);
  });

  test("Teacher puede crear nota", async () => {
    const res = await request(app)
      .post("/api/grades")
      .set("Authorization", `Bearer ${tokenTeacher}`)
      .send({ student: studentId, subject: subjectId, score: 95 });

    expect(res.statusCode).toBe(201);
    expect(res.body.score).toBe(95);
  });

  test("Student NO puede crear nota", async () => {
    const res = await request(app)
      .post("/api/grades")
      .set("Authorization", `Bearer ${tokenStudent}`)
      .send({ student: studentId, subject: subjectId, score: 100 });

    expect(res.statusCode).toBe(403);
  });

  test("Cualquier usuario puede ver sus notas", async () => {
    const res = await request(app)
      .get("/api/grades")
      .set("Authorization", `Bearer ${tokenStudent}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("Obtener nota por ID (student puede solo la suya)", async () => {
    const res = await request(app)
      .get(`/api/grades/${gradeId}`)
      .set("Authorization", `Bearer ${tokenStudent}`);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(gradeId);
  });

  test("Student NO puede ver nota de otro estudiante", async () => {
    // Creamos otro estudiante
    const other = await User.create({
      name: "Other",
      email: "other@test.com",
      password: await require("bcrypt").hash("12345678", 12),
      role: "student"
    });

    const gradeOther = await Grade.create({
      student: other._id,
      subject: subjectId,
      score: 70
    });

    const res = await request(app)
      .get(`/api/grades/${gradeOther._id}`)
      .set("Authorization", `Bearer ${tokenStudent}`);

    expect(res.statusCode).toBe(403);
  });

  test("Actualizar nota (teacher)", async () => {
    const res = await request(app)
      .put(`/api/grades/${gradeId}`)
      .set("Authorization", `Bearer ${tokenTeacher}`)
      .send({ score: 99 });

    expect(res.statusCode).toBe(200);
    expect(res.body.score).toBe(99);
  });

  test("Eliminar nota (admin)", async () => {
    const res = await request(app)
      .delete(`/api/grades/${gradeId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Grade deleted successfully");
  });

  test("Calcular promedio de estudiante", async () => {
    // Crear dos notas
    await Grade.create({ student: studentId, subject: subjectId, score: 80 });
    await Grade.create({ student: studentId, subject: subjectId, score: 100 });

    const res = await request(app)
      .get(`/api/grades/average/${studentId}`)
      .set("Authorization", `Bearer ${tokenStudent}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.average).toBe(92);
    expect(res.body.count).toBe(3);
  });

});

// 🔚 Cerrar conexión
afterAll(async () => {
  await mongoose.connection.close();
});
