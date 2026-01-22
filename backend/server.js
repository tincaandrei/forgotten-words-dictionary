const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const multer = require("multer");
const db = require("./db");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const app = express();
const PORT = process.env.PORT || 4000;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp"
]);
const ALLOWED_AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/webm",
  "audio/ogg"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AUDIO_BYTES,
    files: 2
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "image") {
      if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
        return cb(new Error("Image must be a PNG, JPG, or WEBP file."));
      }
      return cb(null, true);
    }
    if (file.fieldname === "audio") {
      if (!ALLOWED_AUDIO_TYPES.has(file.mimetype)) {
        return cb(
          new Error("Audio must be an MP3, MP4, WebM, or OGG file.")
        );
      }
      return cb(null, true);
    }
    return cb(new Error("Unexpected file field."));
  }
});

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

const parseBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return false;
};

const buildWordResponse = (row) => {
  if (!row) {
    return null;
  }
  const hasImage = Boolean(row.has_image);
  const hasAudio = Boolean(row.has_audio);
  return {
    id: row.id,
    term: row.term,
    definition: row.definition,
    examples: row.examples,
    created_by: row.created_by,
    created_at: row.created_at,
    hasImage,
    hasAudio,
    imageUrl: hasImage ? `/api/words/${row.id}/image` : null,
    audioUrl: hasAudio ? `/api/words/${row.id}/audio` : null
  };
};

const buildExpressionResponse = (row) => {
  if (!row) {
    return null;
  }
  const hasAudio = Boolean(row.has_audio);
  return {
    id: row.id,
    expression: row.expression,
    meaning: row.meaning,
    examples: row.examples,
    created_by: row.created_by,
    created_at: row.created_at,
    hasAudio,
    audioUrl: hasAudio ? `/api/expressions/${row.id}/audio` : null
  };
};

const uploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "audio", maxCount: 1 }
]);

const handleUploadError = (err, res) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ ok: false, error: "File size exceeds 10MB limit." });
    }
  }
  return res
    .status(400)
    .json({ ok: false, error: err.message || "Invalid upload." });
};

const maybeUpload = (req, res, next) => {
  if (!req.is("multipart/form-data")) {
    return next();
  }

  return uploadFields(req, res, (err) => {
    if (err) {
      return handleUploadError(err, res);
    }
    return next();
  });
};

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
    methods: ["GET", "POST", "PUT", "OPTIONS"],
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
      `SELECT id,
              term,
              definition,
              examples,
              created_by,
              created_at,
              (image_bytes IS NOT NULL) AS has_image,
              (audio_bytes IS NOT NULL) AS has_audio
       FROM words
       ORDER BY term ASC`
    );
    res.json(result.rows.map(buildWordResponse));
  } catch (err) {
    console.error("Error fetching words:", err);
    res.status(500).json({ error: "Failed to fetch words" });
  }
});

// POST /api/words
app.post("/api/words", maybeUpload, async (req, res) => {
  const { term, definition, examples, created_by } = req.body || {};

  const trimmedTerm = normalizeText(term);
  const trimmedDefinition = normalizeText(definition);
  const trimmedCreatedBy = normalizeText(created_by);
  const trimmedExamples = normalizeText(examples);

  if (!trimmedTerm || !trimmedDefinition || !trimmedCreatedBy) {
    return res.status(400).json({
      ok: false,
      error: "term, definition and created_by are required",
    });
  }

  const imageFile = req.files?.image?.[0];
  const audioFile = req.files?.audio?.[0];

  if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
    return res.status(400).json({
      ok: false,
      error: "Image must be 5MB or smaller.",
    });
  }

  if (audioFile && audioFile.size > MAX_AUDIO_BYTES) {
    return res.status(400).json({
      ok: false,
      error: "Audio must be 10MB or smaller.",
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO words (
        term,
        definition,
        examples,
        image_bytes,
        image_mime,
        audio_bytes,
        audio_mime,
        created_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id,
                 term,
                 definition,
                 examples,
                 created_by,
                 created_at,
                 (image_bytes IS NOT NULL) AS has_image,
                 (audio_bytes IS NOT NULL) AS has_audio`,
      [
        trimmedTerm,
        trimmedDefinition,
        trimmedExamples || null,
        imageFile ? imageFile.buffer : null,
        imageFile ? imageFile.mimetype : null,
        audioFile ? audioFile.buffer : null,
        audioFile ? audioFile.mimetype : null,
        trimmedCreatedBy,
      ]
    );

    res.status(201).json({
      ok: true,
      word: buildWordResponse(result.rows[0]),
    });
  } catch (err) {
    console.error("Error inserting word:", err);
    res.status(500).json({ ok: false, error: "Failed to add word" });
  }
});

// GET /api/words/:id/image
app.get("/api/words/:id/image", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid word id" });
  }

  try {
    const result = await db.query(
      `SELECT image_bytes, image_mime
       FROM words
       WHERE id = $1`,
      [id]
    );

    if (!result.rows.length || !result.rows[0].image_bytes) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.setHeader(
      "Content-Type",
      result.rows[0].image_mime || "application/octet-stream"
    );
    return res.send(result.rows[0].image_bytes);
  } catch (err) {
    console.error("Error fetching word image:", err);
    return res.status(500).json({ error: "Failed to fetch image" });
  }
});

// GET /api/words/:id/audio
app.get("/api/words/:id/audio", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid word id" });
  }

  try {
    const result = await db.query(
      `SELECT audio_bytes, audio_mime
       FROM words
       WHERE id = $1`,
      [id]
    );

    if (!result.rows.length || !result.rows[0].audio_bytes) {
      return res.status(404).json({ error: "Audio not found" });
    }

    res.setHeader(
      "Content-Type",
      result.rows[0].audio_mime || "application/octet-stream"
    );
    return res.send(result.rows[0].audio_bytes);
  } catch (err) {
    console.error("Error fetching word audio:", err);
    return res.status(500).json({ error: "Failed to fetch audio" });
  }
});

// GET /api/words/by-term/:term
app.get("/api/words/by-term/:term", async (req, res) => {
  const term = normalizeText(req.params.term);
  if (!term) {
    return res.status(400).json({ error: "term is required" });
  }

  try {
    const result = await db.query(
      `SELECT id,
              term,
              definition,
              examples,
              created_by,
              created_at,
              (image_bytes IS NOT NULL) AS has_image,
              (audio_bytes IS NOT NULL) AS has_audio
       FROM words
       WHERE LOWER(term) = LOWER($1)
       ORDER BY created_at DESC
       LIMIT 1`,
      [term]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Word not found" });
    }

    return res.json(buildWordResponse(result.rows[0]));
  } catch (err) {
    console.error("Error fetching word by term:", err);
    return res.status(500).json({ error: "Failed to fetch word" });
  }
});

// GET /api/words/:id
app.get("/api/words/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid word id" });
  }

  try {
    const result = await db.query(
      `SELECT id,
              term,
              definition,
              examples,
              created_by,
              created_at,
              (image_bytes IS NOT NULL) AS has_image,
              (audio_bytes IS NOT NULL) AS has_audio
       FROM words
       WHERE id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Word not found" });
    }

    return res.json(buildWordResponse(result.rows[0]));
  } catch (err) {
    console.error("Error fetching word:", err);
    return res.status(500).json({ error: "Failed to fetch word" });
  }
});

// PUT /api/words/:id
app.put("/api/words/:id", maybeUpload, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ ok: false, error: "Invalid word id" });
  }

  const { term, definition, examples, removeImage, removeAudio } = req.body || {};
  const trimmedTerm = normalizeText(term);
  const trimmedDefinition = normalizeText(definition);
  const trimmedExamples = normalizeText(examples);

  if (!trimmedTerm || !trimmedDefinition) {
    return res.status(400).json({
      ok: false,
      error: "term and definition are required",
    });
  }

  const imageFile = req.files?.image?.[0];
  const audioFile = req.files?.audio?.[0];

  if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
    return res.status(400).json({
      ok: false,
      error: "Image must be 5MB or smaller.",
    });
  }

  if (audioFile && audioFile.size > MAX_AUDIO_BYTES) {
    return res.status(400).json({
      ok: false,
      error: "Audio must be 10MB or smaller.",
    });
  }

  const shouldRemoveImage = parseBoolean(removeImage);
  const shouldRemoveAudio = parseBoolean(removeAudio);
  const shouldUpdateImage = shouldRemoveImage || Boolean(imageFile);
  const shouldUpdateAudio = shouldRemoveAudio || Boolean(audioFile);

  const values = [trimmedTerm, trimmedDefinition, trimmedExamples || null];
  const setClauses = ["term = $1", "definition = $2", "examples = $3"];
  let paramIndex = 4;

  if (shouldUpdateImage) {
    setClauses.push(`image_bytes = $${paramIndex}`);
    values.push(shouldRemoveImage ? null : imageFile?.buffer || null);
    paramIndex += 1;
    setClauses.push(`image_mime = $${paramIndex}`);
    values.push(shouldRemoveImage ? null : imageFile?.mimetype || null);
    paramIndex += 1;
  }

  if (shouldUpdateAudio) {
    setClauses.push(`audio_bytes = $${paramIndex}`);
    values.push(shouldRemoveAudio ? null : audioFile?.buffer || null);
    paramIndex += 1;
    setClauses.push(`audio_mime = $${paramIndex}`);
    values.push(shouldRemoveAudio ? null : audioFile?.mimetype || null);
    paramIndex += 1;
  }

  const idPlaceholder = paramIndex;
  values.push(id);

  try {
    const result = await db.query(
      `UPDATE words
       SET ${setClauses.join(", ")}
       WHERE id = $${idPlaceholder}
       RETURNING id,
                 term,
                 definition,
                 examples,
                 created_by,
                 created_at,
                 (image_bytes IS NOT NULL) AS has_image,
                 (audio_bytes IS NOT NULL) AS has_audio`,
      values
    );

    if (!result.rows.length) {
      return res.status(404).json({ ok: false, error: "Word not found" });
    }

    return res.json({
      ok: true,
      word: buildWordResponse(result.rows[0]),
    });
  } catch (err) {
    console.error("Error updating word:", err);
    return res.status(500).json({ ok: false, error: "Failed to update word" });
  }
});

// GET /api/expressions
app.get("/api/expressions", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id,
              expression,
              meaning,
              examples,
              created_by,
              created_at,
              (audio_bytes IS NOT NULL) AS has_audio
       FROM expressions
       ORDER BY expression ASC`
    );
    res.json(result.rows.map(buildExpressionResponse));
  } catch (err) {
    console.error("Error fetching expressions:", err);
    res.status(500).json({ error: "Failed to fetch expressions" });
  }
});

// POST /api/expressions
app.post("/api/expressions", maybeUpload, async (req, res) => {
  const { expression, meaning, examples, created_by } = req.body || {};

  const trimmedExpression = normalizeText(expression);
  const trimmedMeaning = normalizeText(meaning);
  const trimmedCreatedBy = normalizeText(created_by);
  const trimmedExamples = normalizeText(examples);

  if (!trimmedExpression || !trimmedMeaning || !trimmedCreatedBy) {
    return res.status(400).json({
      ok: false,
      error: "expression, meaning and created_by are required",
    });
  }

  const audioFile = req.files?.audio?.[0];

  if (audioFile && audioFile.size > MAX_AUDIO_BYTES) {
    return res.status(400).json({
      ok: false,
      error: "Audio must be 10MB or smaller.",
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO expressions (
        expression,
        meaning,
        examples,
        audio_bytes,
        audio_mime,
        created_by
      )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id,
                 expression,
                 meaning,
                 examples,
                 created_by,
                 created_at,
                 (audio_bytes IS NOT NULL) AS has_audio`,
      [
        trimmedExpression,
        trimmedMeaning,
        trimmedExamples || null,
        audioFile ? audioFile.buffer : null,
        audioFile ? audioFile.mimetype : null,
        trimmedCreatedBy,
      ]
    );

    res.status(201).json({
      ok: true,
      expression: buildExpressionResponse(result.rows[0]),
    });
  } catch (err) {
    console.error("Error inserting expression:", err);
    res.status(500).json({ ok: false, error: "Failed to add expression" });
  }
});

// GET /api/expressions/:id/audio
app.get("/api/expressions/:id/audio", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid expression id" });
  }

  try {
    const result = await db.query(
      `SELECT audio_bytes, audio_mime
       FROM expressions
       WHERE id = $1`,
      [id]
    );

    if (!result.rows.length || !result.rows[0].audio_bytes) {
      return res.status(404).json({ error: "Audio not found" });
    }

    res.setHeader(
      "Content-Type",
      result.rows[0].audio_mime || "application/octet-stream"
    );
    return res.send(result.rows[0].audio_bytes);
  } catch (err) {
    console.error("Error fetching expression audio:", err);
    return res.status(500).json({ error: "Failed to fetch audio" });
  }
});

// GET /api/expressions/:id
app.get("/api/expressions/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid expression id" });
  }

  try {
    const result = await db.query(
      `SELECT id,
              expression,
              meaning,
              examples,
              created_by,
              created_at,
              (audio_bytes IS NOT NULL) AS has_audio
       FROM expressions
       WHERE id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Expression not found" });
    }

    return res.json(buildExpressionResponse(result.rows[0]));
  } catch (err) {
    console.error("Error fetching expression:", err);
    return res.status(500).json({ error: "Failed to fetch expression" });
  }
});

// PUT /api/expressions/:id
app.put("/api/expressions/:id", maybeUpload, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ ok: false, error: "Invalid expression id" });
  }

  const { expression, meaning, examples, removeAudio } = req.body || {};
  const trimmedExpression = normalizeText(expression);
  const trimmedMeaning = normalizeText(meaning);
  const trimmedExamples = normalizeText(examples);

  if (!trimmedExpression || !trimmedMeaning) {
    return res.status(400).json({
      ok: false,
      error: "expression and meaning are required",
    });
  }

  const audioFile = req.files?.audio?.[0];

  if (audioFile && audioFile.size > MAX_AUDIO_BYTES) {
    return res.status(400).json({
      ok: false,
      error: "Audio must be 10MB or smaller.",
    });
  }

  const shouldRemoveAudio = parseBoolean(removeAudio);
  const shouldUpdateAudio = shouldRemoveAudio || Boolean(audioFile);

  const values = [
    trimmedExpression,
    trimmedMeaning,
    trimmedExamples || null
  ];
  const setClauses = [
    "expression = $1",
    "meaning = $2",
    "examples = $3"
  ];
  let paramIndex = 4;

  if (shouldUpdateAudio) {
    setClauses.push(`audio_bytes = $${paramIndex}`);
    values.push(shouldRemoveAudio ? null : audioFile?.buffer || null);
    paramIndex += 1;
    setClauses.push(`audio_mime = $${paramIndex}`);
    values.push(shouldRemoveAudio ? null : audioFile?.mimetype || null);
    paramIndex += 1;
  }

  const idPlaceholder = paramIndex;
  values.push(id);

  try {
    const result = await db.query(
      `UPDATE expressions
       SET ${setClauses.join(", ")}
       WHERE id = $${idPlaceholder}
       RETURNING id,
                 expression,
                 meaning,
                 examples,
                 created_by,
                 created_at,
                 (audio_bytes IS NOT NULL) AS has_audio`,
      values
    );

    if (!result.rows.length) {
      return res.status(404).json({ ok: false, error: "Expression not found" });
    }

    return res.json({
      ok: true,
      expression: buildExpressionResponse(result.rows[0]),
    });
  } catch (err) {
    console.error("Error updating expression:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to update expression" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
