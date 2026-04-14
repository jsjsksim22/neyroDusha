import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import { RateLimiterMemory } from "rate-limiter-flexible";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

// --- static
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// rate limiting basic
const rateLimiter = new RateLimiterMemory({
  points: 60,
  duration: 60,
});

// uploads dir
const UPLOAD_DIR = path.join(__dirname, "public", "uploads");
const THUMB_DIR = path.join(UPLOAD_DIR, "thumbs");

// ensure folders exist
await fs.mkdir(UPLOAD_DIR, { recursive: true });
await fs.mkdir(THUMB_DIR, { recursive: true });

// multer storage with unique filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = XXXINLINECODEXXX0XXXINLINECODEXXX;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png","image/jpeg","image/webp","image/gif","image/svg+xml"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Недопустимый формат файла"));
  }
});

// Simple crisis detector (unchanged)
const CRISIS_KEYWORDS = [
  "суицид","покончу","хочу умереть","не хочу жить","убью себя","самоубийство",
  "suicide","kill myself","want to die","hurt myself"
];
function containsCrisis(text){
  if (!text) return false;
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some(k => lower.includes(k));
}
function crisisResponseHints() {
  return {
    escalate: true,
    reply: XXXINLINECODEXXX1XXXINLINECODEXXX
  };
}

// --- API: чат (прощённый). При необходимости замените на ваш код/провайдера.
app.post("/api/chat", async (req, res) => {
  try { await rateLimiter.consume(req.ip); } catch { return res.status(429).json({ error:"Too many requests" }); }
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message" });
  if (containsCrisis(message)) return res.json(crisisResponseHints());

  // For simplicity: echo with empathetic prefix.
  // Замените этот блок вызовом реальной модели (OpenAI/HF/local) как в предыдущих вариантах.
  const reply = XXXINLINECODEXXX2XXXINLINECODEXXX;
  return res.json({ reply, escalate: false });
});

// --- API: загрузка фото
app.post("/api/upload", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Файл не найден" });
    const filePath = path.join(UPLOAD_DIR, req.file.filename);
    const thumbPath = path.join(THUMB_DIR, req.file.filename);

    // Создать миниатюру 400x400 (сохраняя пропорции)
    try {
      await sharp(filePath)
        .resize({ width: 800, height: 800, fit: "inside" })
        .toFile(filePath + ".tmp");
      await fs.rename(filePath + ".tmp", filePath);
      await sharp(filePath)
        .resize({ width: 320, height: 320, fit: "cover" })
        .toFile(thumbPath);
    } catch (err) {
      console.warn("Sharp processing failed:", err);
    }

    const url = XXXINLINECODEXXX3XXXINLINECODEXXX;
    const thumbUrl = XXXINLINECODEXXX4XXXINLINECODEXXX;
    return res.json({ ok: true, url, thumb: thumbUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Ошибка загрузки" });
  }
});

// --- API: список изображений для галереи
app.get("/api/gallery", async (req, res) => {
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    // filter out thumbs dir and hidden
    const images = [];
    for (const f of files) {
      if (f === "thumbs") continue;
      const stat = await fs.stat(path.join(UPLOAD_DIR, f));
      if (stat.isFile()) {
        images.push({
          filename: f,
          url: XXXINLINECODEXXX5XXXINLINECODEXXX,
          thumb: XXXINLINECODEXXX6XXXINLINECODEXXX
        });
      }
    }
    // newest first
    images.sort((a,b) => b.filename.localeCompare(a.filename));
    return res.json({ images });
  } catch (err) {
    console.error("Gallery error:", err);
    return res.status(500).json({ error: "Не удалось получить галерею" });
  }
});

// Serve uploads statically (already under public/uploads), ensure correct permission
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

app.listen(PORT, () => console.log(XXXINLINECODEXXX7XXXINLINECODEXXX));