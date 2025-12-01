const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const User = require("../models/User");

let tokenAdmin, tokenTeacher, tokenStudent, studentId;

beforeAll(async () => {
  await User.deleteMany({}); // BD limpia para pruebas
});

// ======================================================
// 🟢 AUTH
// ======================================================
describe("AUTH TESTING", () => {

  test("Registro exitoso", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ 
        name: "Admin Test", 
        email: "admin@test.com", 
        password: "12345678", 
        role: "admin" 
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Usuario registrado con éxito");
  });

  test("Login correcto devuelve token", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "admin@test.com", password: "12345678" });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    tokenAdmin = res.body.token;
  });

  test("Login falla con contraseña inválida", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "admin@test.com", password: "xxxx0000" });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Contraseña incorrecta");
  });

});

// ======================================================
// 🟣 ROLES & FUNCIONES
// ======================================================
describe("ROLES & FUNCIONES", () => {

  test("Registrar Teacher y Student", async () => {
    const teacher = await request(app)
      .post("/api/users/register")
      .send({ name:"Teacher", email:"teacher@test.com", password:"12345678", role:"teacher" });

    const student = await request(app)
      .post("/api/users/register")
      .send({ name:"Student", email:"student@test.com", password:"12345678", role:"student" });

    const loginTeacher = await request(app)
      .post("/api/users/login").send({ email:"teacher@test.com", password:"12345678" });

    const loginStudent = await request(app)
      .post("/api/users/login").send({ email:"student@test.com", password:"12345678" });

    tokenTeacher = loginTeacher.body.token;
    tokenStudent = loginStudent.body.token;

    const stu = await User.findOne({ email:"student@test.com" });
    studentId = stu._id.toString();

    expect(teacher.statusCode).toBe(201);
    expect(student.statusCode).toBe(201);
  });

  test("Obtención de perfil con token", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${tokenStudent}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe("student@test.com");
    expect(res.body.password).toBeUndefined();
  });

  test("Teacher agrega nota a estudiante", async () => {
    const res = await request(app)
      .post(`/api/users/${studentId}/grades`)
      .set("Authorization", `Bearer ${tokenTeacher}`)
      .send({ subject:"Math", score:95 });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Nota asignada");
  });

  test("Admin obtiene todos los usuarios", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("Admin elimina un usuario", async () => {
    const userToDelete = await User.findOne({ email:"teacher@test.com" });

    const res = await request(app)
      .delete(`/api/users/${userToDelete._id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Usuario eliminado");
  });

});

// 🔚 Cerrar conexión
afterAll(async () => {
  await mongoose.connection.close();
});
