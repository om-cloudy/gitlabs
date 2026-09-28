const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = 3000;

const db = new Database("forms.db");

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    type TEXT NOT NULL,
    options TEXT DEFAULT '[]',
    required INTEGER DEFAULT 0,
    FOREIGN KEY(form_id) REFERENCES forms(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(form_id) REFERENCES forms(id) ON DELETE CASCADE
  );
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Get all forms
app.get("/api/forms", (req, res) => {
  const forms = db
    .prepare("SELECT * FROM forms ORDER BY id DESC")
    .all();

  res.json(forms);
});

// Get single form
app.get("/api/forms/:id", (req, res) => {
  const form = db
    .prepare("SELECT * FROM forms WHERE id = ?")
    .get(req.params.id);

  if (!form) {
    return res.status(404).json({ error: "Form not found" });
  }

  const questions = db
    .prepare("SELECT * FROM questions WHERE form_id = ? ORDER BY id")
    .all(req.params.id)
    .map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }));

  res.json({
    ...form,
    questions
  });
});

// Create form
app.post("/api/forms", (req, res) => {
  const {
    title,
    description,
    questions = []
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      error: "Form title is required"
    });
  }

  const createForm = db.transaction(() => {
    const result = db
      .prepare(`
        INSERT INTO forms (title, description)
        VALUES (?, ?)
      `)
      .run(title.trim(), description || "");

    const formId = result.lastInsertRowid;

    const insertQuestion = db.prepare(`
      INSERT INTO questions
      (form_id, question, type, options, required)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const q of questions) {
      insertQuestion.run(
        formId,
        q.question || "Untitled Question",
        q.type || "text",
        JSON.stringify(q.options || []),
        q.required ? 1 : 0
      );
    }

    return formId;
  });

  const formId = createForm();

  res.json({
    success: true,
    id: formId
  });
});

// Submit response
app.post("/api/forms/:id/responses", (req, res) => {
  const form = db
    .prepare("SELECT id FROM forms WHERE id = ?")
    .get(req.params.id);

  if (!form) {
    return res.status(404).json({
      error: "Form not found"
    });
  }

  const data = req.body;

  db.prepare(`
    INSERT INTO responses (form_id, data)
    VALUES (?, ?)
  `).run(
    req.params.id,
    JSON.stringify(data)
  );

  res.json({
    success: true,
    message: "Response submitted successfully"
  });
});

// Get responses
app.get("/api/forms/:id/responses", (req, res) => {
  const responses = db
    .prepare(`
      SELECT *
      FROM responses
      WHERE form_id = ?
      ORDER BY id DESC
    `)
    .all(req.params.id);

  res.json(
    responses.map(response => ({
      ...response,
      data: JSON.parse(response.data)
    }))
  );
});

// Delete form
app.delete("/api/forms/:id", (req, res) => {
  const result = db
    .prepare("DELETE FROM forms WHERE id = ?")
    .run(req.params.id);

  if (!result.changes) {
    return res.status(404).json({
      error: "Form not found"
    });
  }

  res.json({
    success: true
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

