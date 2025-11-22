const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

if (!process.env.FAMILY_ACCESS_CODE) {
  console.warn(
    "Warning: FAMILY_ACCESS_CODE is not set in environment variables."
  );
}

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// Health check
app.get("/health", (req, res) => {
  res.json({ message: "Bladniana dictionary backend is running." });
});

// POST /api/check-access
app.post("/api/check-access", (req, res) => {
  const { accessCode } = req.body || {};
  const correctCode = process.env.FAMILY_ACCESS_CODE;

  if (!accessCode) {
    return res.status(400).json({ ok: false, error: "accessCode is required" });
  }

  if (accessCode === correctCode) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false, error: "Invalid access code" });
});

// GET /api/words
app.get("/api/words", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, term, definition, examples, created_by, created_at
       FROM words
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching words:", err);
    res.status(500).json({ error: "Failed to fetch words" });
  }
});

// POST /api/words
app.post("/api/words", async (req, res) => {
  const { term, definition, examples, created_by } = req.body || {};

  const trimmedTerm = typeof term === "string" ? term.trim() : "";
  const trimmedDefinition =
    typeof definition === "string" ? definition.trim() : "";
  const trimmedCreatedBy =
    typeof created_by === "string" ? created_by.trim() : "";

  if (!trimmedTerm || !trimmedDefinition || !trimmedCreatedBy) {
    return res.status(400).json({
      ok: false,
      error: "term, definition and created_by are required",
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO words (term, definition, examples, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, term, definition, examples, created_by, created_at`,
      [trimmedTerm, trimmedDefinition, examples || null, trimmedCreatedBy]
    );

    res.status(201).json({
      ok: true,
      word: result.rows[0],
    });
  } catch (err) {
    console.error("Error inserting word:", err);
    res.status(500).json({ ok: false, error: "Failed to add word" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
