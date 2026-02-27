console.log("Starting server.ts...");
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { initDb, supabase } from "../db.js";

const JWT_SECRET = "ebd-secret-key-2026";

console.log("Starting initDb...");
initDb();
console.log("initDb complete. Setting up express...");
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());


const upload = multer({ storage: multer.memoryStorage() });

// Middleware for Auth
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Auth Routes
app.post("/api/login", async (req, res) => {
  const { email, password, churchId } = req.body;
  const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
  if (error || !user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  // If standard user, check if church matches
  if (user.role === 'standard' && user.church_id !== parseInt(churchId)) {
    return res.status(401).json({ error: "Usuário não pertence a esta igreja" });
  }

  // Fetch church name to include in user object
  let church_name = undefined;
  if (churchId) {
    const { data: church } = await supabase.from('churches').select('name').eq('id', churchId).single();
    if (church) church_name = church.name;
  } else if (user.church_id) {
    const { data: church } = await supabase.from('churches').select('name').eq('id', user.church_id).single();
    if (church) church_name = church.name;
  }

  const token = jwt.sign({ id: user.id, role: user.role, church_id: user.church_id || churchId }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, church_id: user.church_id || churchId, church_name } });
});

app.post("/api/change-password", authenticate, async (req: any, res) => {
  const { newPassword } = req.body;
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  const { error } = await supabase.from('users').update({ password: hashedPassword }).eq('id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// User Management
app.get("/api/users", authenticate, async (req: any, res) => {
  if (req.user.role !== 'master') return res.status(403).json({ error: "Forbidden" });
  const { data: users, error } = await supabase.from('users').select('id, name, email, role, authorized, churches(name)');

  if (error) return res.status(500).json({ error: error.message });

  // transform joined data to match old format
  const formattedUsers = users.map((u: any) => ({
    ...u,
    church_name: u.churches?.name
  }));

  res.json(formattedUsers);
});

app.put("/api/users/:id", authenticate, async (req: any, res) => {
  if (req.user.role !== 'master') return res.status(403).json({ error: "Forbidden" });
  const { name, email, password, church_id, role, authorized } = req.body;

  const updateData: any = { name, email, church_id, role, authorized: authorized ? 1 : 0 };
  if (password) {
    updateData.password = bcrypt.hashSync(password, 10);
  }

  const { error } = await supabase.from('users').update(updateData).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
});

app.delete("/api/users/:id", authenticate, async (req: any, res) => {
  if (req.user.role !== 'master') return res.status(403).json({ error: "Forbidden" });
  const { error } = await supabase.from('users').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: "Erro ao excluir usuário. Verifique se existem registros vinculados." });

  res.json({ success: true });
});

// Toggle Status Endpoints
app.patch("/api/students/:id/toggle", authenticate, async (req: any, res) => {
  const { data: student, error } = await supabase.from('students').select('*').eq('id', req.params.id).single();
  if (error || !student) return res.status(404).json({ error: "Not found" });
  if (req.user.role !== 'master' && student.church_id !== req.user.church_id) return res.status(403).json({ error: "Forbidden" });

  const { error: updateError } = await supabase.from('students').update({ active: student.active ? 0 : 1 }).eq('id', req.params.id);
  if (updateError) return res.status(500).json({ error: updateError.message });
  res.json({ success: true });
});

app.patch("/api/teachers/:id/toggle", authenticate, async (req: any, res) => {
  const { data: teacher, error } = await supabase.from('teachers').select('*').eq('id', req.params.id).single();
  if (error || !teacher) return res.status(404).json({ error: "Not found" });
  if (req.user.role !== 'master' && teacher.church_id !== req.user.church_id) return res.status(403).json({ error: "Forbidden" });

  const { error: updateError } = await supabase.from('teachers').update({ active: teacher.active ? 0 : 1 }).eq('id', req.params.id);
  if (updateError) return res.status(500).json({ error: updateError.message });
  res.json({ success: true });
});

app.patch("/api/classes/:id/toggle", authenticate, async (req: any, res) => {
  const { data: cls, error } = await supabase.from('classes').select('*').eq('id', req.params.id).single();
  if (error || !cls) return res.status(404).json({ error: "Not found" });
  if (req.user.role !== 'master' && cls.church_id !== req.user.church_id) return res.status(403).json({ error: "Forbidden" });

  const { error: updateError } = await supabase.from('classes').update({ active: cls.active ? 0 : 1 }).eq('id', req.params.id);
  if (updateError) return res.status(500).json({ error: updateError.message });
  res.json({ success: true });
});

// Churches
app.get("/api/churches", async (req, res) => {
  const { data: churches, error } = await supabase.from('churches').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(churches);
});

app.post("/api/churches", authenticate, async (req: any, res) => {
  if (req.user.role !== 'master') return res.status(403).json({ error: "Forbidden" });
  const { name, type, pastor, members } = req.body;
  const { error } = await supabase.from('churches').insert({ name, type, pastor, members: members || 0 });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.put("/api/churches/:id", authenticate, async (req: any, res) => {
  if (req.user.role !== 'master') return res.status(403).json({ error: "Forbidden" });
  const { name, type, pastor, members } = req.body;
  const { error } = await supabase.from('churches').update({ name, type, pastor, members: members || 0 }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/churches/:id", authenticate, async (req: any, res) => {
  if (req.user.role !== 'master') return res.status(403).json({ error: "Forbidden" });
  const churchId = req.params.id;
  await supabase.from('attendance').delete().eq('church_id', churchId);
  await supabase.from('teacher_schedule').delete().eq('church_id', churchId);
  await supabase.from('materials').delete().eq('church_id', churchId);
  await supabase.from('students').delete().eq('church_id', churchId);
  await supabase.from('teachers').delete().eq('church_id', churchId);
  await supabase.from('classes').delete().eq('church_id', churchId);
  await supabase.from('users').delete().eq('church_id', churchId);
  const { error } = await supabase.from('churches').delete().eq('id', churchId);
  if (error) return res.status(400).json({ error: "Erro ao excluir igreja. Verifique se existem alunos, professores ou classes vinculados." });
  res.json({ success: true });
});

// Magazines
app.get("/api/magazines", authenticate, async (req, res) => {
  const { data: magazines, error } = await supabase.from('magazines').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(magazines);
});

app.post("/api/magazines", authenticate, async (req: any, res) => {
  const { title, quarter, year } = req.body;
  const { error } = await supabase.from('magazines').insert({ title, quarter, year });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.put("/api/magazines/:id", authenticate, async (req: any, res) => {
  const { title, quarter, year } = req.body;
  const { error } = await supabase.from('magazines').update({ title, quarter, year }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/magazines/:id", authenticate, async (req: any, res) => {
  if (req.user.role !== 'master') return res.status(403).json({ error: "Forbidden" });

  const { data: lessons } = await supabase.from('lessons').select('id').eq('magazine_id', req.params.id);
  const lessonIds = lessons?.map((l: any) => l.id) || [];
  if (lessonIds.length > 0) {
    await supabase.from('attendance').delete().in('lesson_id', lessonIds);
    await supabase.from('teacher_schedule').delete().in('lesson_id', lessonIds);
    await supabase.from('lessons').delete().in('id', lessonIds);
  }

  const { error } = await supabase.from('magazines').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: "Erro ao excluir revista. Verifique se existem lições vinculadas." });
  res.json({ success: true });
});

// Lessons
app.get("/api/lessons", authenticate, async (req, res) => {
  const { data: lessons, error } = await supabase.from('lessons').select('*, magazines(title)');
  if (error) return res.status(500).json({ error: error.message });

  const formattedLessons = lessons.map((l: any) => ({
    ...l,
    magazine_title: l.magazines?.title
  }));

  res.json(formattedLessons);
});

app.post("/api/lessons", authenticate, async (req: any, res) => {
  const { magazine_id, number, title, date, golden_text, suggested_hymns } = req.body;
  const { error } = await supabase.from('lessons').insert({ magazine_id, number, title, date, golden_text, suggested_hymns });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.put("/api/lessons/:id", authenticate, async (req: any, res) => {
  const { magazine_id, number, title, date, golden_text, suggested_hymns } = req.body;
  const { error } = await supabase.from('lessons').update({ magazine_id, number, title, date, golden_text, suggested_hymns }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/lessons/:id", authenticate, async (req: any, res) => {
  // if (req.user.role !== 'master') return res.status(403).json({ error: "Forbidden" });
  const lessonId = req.params.id;
  await supabase.from('attendance').delete().eq('lesson_id', lessonId);
  await supabase.from('teacher_schedule').delete().eq('lesson_id', lessonId);

  const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
  if (error) return res.status(400).json({ error: "Erro ao excluir lição. Verifique se existem registros de chamada ou escalas vinculadas." });
  res.json({ success: true });
});

// Students
app.get("/api/students", authenticate, async (req: any, res) => {
  let query = supabase.from('students').select('*, churches(name), classes(name)');

  if (req.user.role !== 'master') {
    query = query.eq('church_id', req.user.church_id);
  }

  const { data: students, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const formattedStudents = students.map((s: any) => ({
    ...s,
    church_name: s.churches?.name,
    class_name: s.classes?.name
  }));

  res.json(formattedStudents);
});

app.post("/api/students", authenticate, async (req: any, res) => {
  const { name, birth_date, class_id } = req.body;
  const church_id = req.user.church_id;
  const { error } = await supabase.from('students').insert({ name, birth_date, church_id, class_id });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.put("/api/students/:id", authenticate, async (req: any, res) => {
  const { name, birth_date, class_id } = req.body;
  let query = supabase.from('students').update({ name, birth_date, class_id }).eq('id', req.params.id);

  if (req.user.role !== 'master') {
    query = query.eq('church_id', req.user.church_id);
  }

  const { error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/students/:id", authenticate, async (req: any, res) => {
  // First verify ownership
  const { data: student } = await supabase.from('students').select('id, church_id').eq('id', req.params.id).single();
  if (!student) return res.status(404).json({ error: "Aluno não encontrado" });
  if (req.user.role !== 'master' && student.church_id !== req.user.church_id) return res.status(403).json({ error: "Forbidden" });

  await supabase.from('attendance').delete().eq('student_id', req.params.id);

  const { error } = await supabase.from('students').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: "Erro ao excluir aluno. Verifique se existem registros de chamada vinculados." });
  res.json({ success: true });
});

// Teachers
app.get("/api/teachers", authenticate, async (req: any, res) => {
  let query = supabase.from('teachers').select('*, churches(name), classes(name)');

  if (req.user.role !== 'master') {
    query = query.eq('church_id', req.user.church_id);
  }

  const { data: teachers, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const formattedTeachers = teachers.map((t: any) => ({
    ...t,
    church_name: t.churches?.name,
    class_name: t.classes?.name
  }));

  res.json(formattedTeachers);
});

app.post("/api/teachers", authenticate, async (req: any, res) => {
  const { name, class_id } = req.body;
  const church_id = req.user.church_id;
  const { error } = await supabase.from('teachers').insert({ name, church_id, class_id });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.put("/api/teachers/:id", authenticate, async (req: any, res) => {
  const { name, class_id } = req.body;
  let query = supabase.from('teachers').update({ name, class_id }).eq('id', req.params.id);

  if (req.user.role !== 'master') {
    query = query.eq('church_id', req.user.church_id);
  }

  const { error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/teachers/:id", authenticate, async (req: any, res) => {
  const { data: teacher } = await supabase.from('teachers').select('id, church_id').eq('id', req.params.id).single();
  if (!teacher) return res.status(404).json({ error: "Professor não encontrado" });
  if (req.user.role !== 'master' && teacher.church_id !== req.user.church_id) return res.status(403).json({ error: "Forbidden" });

  await supabase.from('teacher_schedule').delete().eq('teacher_id', req.params.id);

  const { error } = await supabase.from('teachers').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: "Erro ao excluir professor. Verifique se existem escalas vinculadas." });
  res.json({ success: true });
});

// Classes
app.get("/api/classes", authenticate, async (req: any, res) => {
  let query = supabase.from('classes').select('*, churches(name), magazines(title)');

  if (req.user.role !== 'master') {
    query = query.eq('church_id', req.user.church_id);
  }

  const { data: classes, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const formattedClasses = classes.map((c: any) => ({
    ...c,
    church_name: c.churches?.name,
    magazine_title: c.magazines?.title
  }));

  res.json(formattedClasses);
});

app.post("/api/classes", authenticate, async (req: any, res) => {
  const { name, magazine_id } = req.body;
  const church_id = req.user.church_id;
  const { error } = await supabase.from('classes').insert({ name, church_id, magazine_id });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.put("/api/classes/:id", authenticate, async (req: any, res) => {
  const { name, magazine_id } = req.body;
  let query = supabase.from('classes').update({ name, magazine_id }).eq('id', req.params.id);

  if (req.user.role !== 'master') {
    query = query.eq('church_id', req.user.church_id);
  }

  const { error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/classes/:id", authenticate, async (req: any, res) => {
  const { data: cls } = await supabase.from('classes').select('id, church_id').eq('id', req.params.id).single();
  if (!cls) return res.status(404).json({ error: "Classe não encontrada" });
  if (req.user.role !== 'master' && cls.church_id !== req.user.church_id) return res.status(403).json({ error: "Forbidden" });

  const { data: students } = await supabase.from('students').select('id').eq('class_id', req.params.id);
  const { data: teachers } = await supabase.from('teachers').select('id').eq('class_id', req.params.id);

  const studentIds = students?.map((s: any) => s.id) || [];
  if (studentIds.length > 0) {
    await supabase.from('attendance').delete().in('student_id', studentIds);
    await supabase.from('students').delete().in('id', studentIds);
  }
  const teacherIds = teachers?.map((t: any) => t.id) || [];
  if (teacherIds.length > 0) {
    await supabase.from('teacher_schedule').delete().in('teacher_id', teacherIds);
    await supabase.from('teachers').delete().in('id', teacherIds);
  }
  await supabase.from('teacher_schedule').delete().eq('class_id', req.params.id);

  const { error } = await supabase.from('classes').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: "Erro ao excluir classe. Verifique se existem alunos ou professores vinculados." });
  res.json({ success: true });
});

// Attendance
app.get("/api/attendance/check", authenticate, async (req: any, res) => {
  const { lesson_id, class_id, date } = req.query;
  const church_id = req.user.church_id;

  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('class_id', class_id);

  if (studentError || !students || students.length === 0) {
    return res.json({ exists: false });
  }

  const studentIds = students.map((s: any) => s.id);

  const { count, error } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('lesson_id', lesson_id)
    .eq('date', date)
    .eq('church_id', church_id)
    .in('student_id', studentIds);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ exists: count && count > 0 });
});

app.get("/api/attendance", authenticate, async (req: any, res) => {
  let query = supabase.from('attendance').select('*, students(name), lessons(title), churches(name)');

  if (req.user.role !== 'master') {
    query = query.eq('church_id', req.user.church_id);
  }

  const { data: attendance, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const formattedAttendance = attendance.map((a: any) => ({
    ...a,
    student_name: a.students?.name,
    lesson_title: a.lessons?.title,
    church_name: a.churches?.name
  }));

  res.json(formattedAttendance);
});

app.post("/api/attendance", authenticate, async (req: any, res) => {
  const church_id = req.user.church_id;

  if (req.body.records && Array.isArray(req.body.records)) {
    const recordsWithChurch = req.body.records.map((r: any) => ({
      student_id: r.student_id,
      lesson_id: r.lesson_id,
      present: r.present ? true : false,
      date: r.date,
      church_id
    }));
    const { error } = await supabase.from('attendance').insert(recordsWithChurch);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  const { student_id, lesson_id, present, date } = req.body;
  const { error } = await supabase.from('attendance').insert({ student_id, lesson_id, church_id, present: present ? true : false, date });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.put("/api/attendance/:id", authenticate, async (req: any, res) => {
  if (req.user.role !== 'master') return res.status(403).json({ error: "Forbidden" });
  const { present } = req.body;
  let query = supabase.from('attendance').update({ present: present ? true : false }).eq('id', req.params.id);

  if (req.user.role !== 'master') {
    query = query.eq('church_id', req.user.church_id);
  }

  const { error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/attendance/:id", authenticate, async (req: any, res) => {
  if (req.user.role !== 'master') return res.status(403).json({ error: "Forbidden" });
  let query = supabase.from('attendance').delete().eq('id', req.params.id);

  if (req.user.role !== 'master') {
    query = query.eq('church_id', req.user.church_id);
  }

  const { error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Materials
app.get("/api/materials", authenticate, async (req: any, res) => {
  let query = supabase.from('materials').select('*, churches(name)');

  if (req.user.role !== 'master') {
    query = query.eq('church_id', req.user.church_id);
  }

  const { data: materials, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const formattedMaterials = materials.map((m: any) => ({
    ...m,
    church_name: m.churches?.name
  }));

  res.json(formattedMaterials);
});

app.post("/api/materials", authenticate, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req: any, res) => {
  if (req.user.role !== 'master') return res.status(403).json({ error: "Forbidden" });
  const { title } = req.body;
  const church_id = req.user.church_id;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const mainFile = files['file']?.[0];
  const coverFile = files['cover']?.[0];

  if (!mainFile) return res.status(400).json({ error: "No file uploaded" });

  try {
    const mainFileName = `${Date.now()}${path.extname(mainFile.originalname)}`;
    const { error: uploadError } = await supabase.storage.from('materials').upload(mainFileName, mainFile.buffer, {
      contentType: mainFile.mimetype
    });

    if (uploadError) throw new Error("Erro ao enviar arquivo principal: " + uploadError.message);
    const { data: pubData } = supabase.storage.from('materials').getPublicUrl(mainFileName);
    const file_path = pubData.publicUrl;
    const file_type = mainFile.mimetype;

    let cover_path = null;
    if (coverFile) {
      const coverFileName = `cover_${Date.now()}${path.extname(coverFile.originalname)}`;
      const { error: coverError } = await supabase.storage.from('materials').upload(coverFileName, coverFile.buffer, {
        contentType: coverFile.mimetype
      });
      if (coverError) throw new Error("Erro ao enviar capa: " + coverError.message);

      const { data: coverPubData } = supabase.storage.from('materials').getPublicUrl(coverFileName);
      cover_path = coverPubData.publicUrl;
    }

    const { error } = await supabase.from('materials').insert({ title, file_path, file_type, church_id, cover_path });
    if (error) throw new Error(error.message);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/materials/:id", authenticate, async (req: any, res) => {
  if (req.user.role !== 'master') return res.status(403).json({ error: "Forbidden" });
  const { data: material, error } = await supabase.from('materials').select('*').eq('id', req.params.id).single();
  if (error || !material) return res.status(404).json({ error: "Not found" });
  if (req.user.role !== 'master' && material.church_id !== req.user.church_id) return res.status(403).json({ error: "Forbidden" });

  try {
    // Delete from Supabase Storage
    const extractFilename = (url: string) => {
      if (!url) return null;
      const parts = url.split('/');
      return parts[parts.length - 1];
    };

    const mainFilename = extractFilename(material.file_path);
    const coverFilename = extractFilename(material.cover_path);

    const filesToRemove = [];
    if (mainFilename) filesToRemove.push(mainFilename);
    if (coverFilename) filesToRemove.push(coverFilename);

    if (filesToRemove.length > 0) {
      await supabase.storage.from('materials').remove(filesToRemove);
    }

    const { error: deleteError } = await supabase.from('materials').delete().eq('id', req.params.id);
    if (deleteError) throw new Error(deleteError.message);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher Schedule
app.get("/api/schedule", authenticate, async (req: any, res) => {
  let query = supabase.from('teacher_schedule').select('*, teachers(name), classes(name), lessons(title), churches(name)');

  if (req.user.role !== 'master') {
    query = query.eq('church_id', req.user.church_id);
  }

  const { data: schedule, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const formattedSchedule = schedule.map((s: any) => ({
    ...s,
    teacher_name: s.teachers?.name,
    class_name: s.classes?.name,
    lesson_title: s.lessons?.title,
    church_name: s.churches?.name
  }));

  res.json(formattedSchedule);
});

app.post("/api/schedule", authenticate, async (req: any, res) => {
  const { teacher_id, class_id, lesson_id, date } = req.body;
  const church_id = req.user.church_id;
  const { error } = await supabase.from('teacher_schedule').insert({ teacher_id, class_id, lesson_id, church_id, date });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.put("/api/schedule/:id", authenticate, async (req: any, res) => {
  const { teacher_id, class_id, lesson_id, date } = req.body;
  let query = supabase.from('teacher_schedule').update({ teacher_id, class_id, lesson_id, date }).eq('id', req.params.id);

  if (req.user.role !== 'master') {
    query = query.eq('church_id', req.user.church_id);
  }

  const { error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/schedule/:id", authenticate, async (req: any, res) => {
  let query = supabase.from('teacher_schedule').delete().eq('id', req.params.id);

  if (req.user.role !== 'master') {
    query = query.eq('church_id', req.user.church_id);
  }

  const { error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default app;
