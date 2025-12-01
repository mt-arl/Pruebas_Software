const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const User = require("../models/User");
const Sclass = require("../models/Sclass");
const Subject = require("../models/subjectSchema");

let tokenAdmin, tokenTeacher, tokenStudent;
let studentId, teacherId, classId, subjectId;

beforeAll(async () => {


  // Limpiar BD
  await User.deleteMany({});
  await Sclass.deleteMany({});
  await Subject.deleteMany({});

  // Crear usuarios
  const admin = await User.create({
    name: "Admin",
    email: "admin@test.com",
    password: await require("bcrypt").hash("12345678", 12),
    role: "admin",
  });

  const teacher = await User.create({
    name: "Teacher",
    email: "teacher@test.com",
    password: await require("bcrypt").hash("12345678", 12),
    role: "teacher",
  });
  teacherId = teacher._id.toString();

  const student = await User.create({
    name: "Student",
    email: "student@test.com",
    password: await require("bcrypt").hash("12345678", 12),
    role: "student",
  });
  studentId = student._id.toString();

  // Login usuarios
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
},30000);

// ======================================================
// 🟢 TESTS CLASES
// ======================================================
describe("SCLASS API TESTING", () => {

  test("Admin puede crear clase", async () => {
    const res = await request(app)
      .post("/api/classes")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ sclassName: "Clase 1", subject: subjectId, teacher: teacherId });

    expect(res.statusCode).toBe(201);
    expect(res.body.sclassName).toBe("Clase 1");
    classId = res.body._id;
  });

  test("Teacher NO puede crear clase", async () => {
    const res = await request(app)
      .post("/api/classes")
      .set("Authorization", `Bearer ${tokenTeacher}`)
      .send({ sclassName: "Clase X", subject: subjectId, teacher: teacherId });

    expect(res.statusCode).toBe(403);
  });

  test("Obtener todas las clases según rol", async () => {
    const resStudent = await request(app)
      .get("/api/classes")
      .set("Authorization", `Bearer ${tokenStudent}`);
    expect(resStudent.statusCode).toBe(200);
    expect(Array.isArray(resStudent.body)).toBe(true);

    const resTeacher = await request(app)
      .get("/api/classes")
      .set("Authorization", `Bearer ${tokenTeacher}`);
    expect(resTeacher.statusCode).toBe(200);
    expect(Array.isArray(resTeacher.body)).toBe(true);

    const resAdmin = await request(app)
      .get("/api/classes")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(resAdmin.statusCode).toBe(200);
    expect(Array.isArray(resAdmin.body)).toBe(true);
  });

  test("Obtener clase por ID", async () => {
    const res = await request(app)
      .get(`/api/classes/${classId}`)
      .set("Authorization", `Bearer ${tokenStudent}`);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(classId);
  });

  test("Actualizar clase (solo admin)", async () => {
    const res = await request(app)
      .put(`/api/classes/${classId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ sclassName: "Clase 1 Actualizada" });

    expect(res.statusCode).toBe(200);
    expect(res.body.sclassName).toBe("Clase 1 Actualizada");
  });

  test("Matricular estudiante (solo admin)", async () => {
    const res = await request(app)
      .post(`/api/classes/${classId}/enroll`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ studentId });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Student enrolled");
    expect(res.body.class.students).toContain(studentId);
  });

  test("Desmatricular estudiante (solo admin)", async () => {
    const res = await request(app)
      .post(`/api/classes/${classId}/unenroll`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ studentId });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Student unenrolled");
    expect(res.body.class.students).not.toContain(studentId);
  });

  test("Eliminar clase (solo admin)", async () => {
    const res = await request(app)
      .delete(`/api/classes/${classId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Class deleted successfully");
  });

});

// 🔚 Cerrar conexión
afterAll(async () => {
  await mongoose.connection.close();
});
