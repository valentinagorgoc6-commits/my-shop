import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: IRouter = Router();

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Допустимые форматы: jpg, png, webp"));
    }
  },
});

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || token !== adminPassword) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.post("/admin/login", (req: Request, res: Response): void => {
  const { password } = req.body as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.status(500).json({ error: "Admin password not configured" });
    return;
  }
  if (password !== adminPassword) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }
  res.json({ token: adminPassword });
});

router.post("/admin/upload", adminAuth, upload.single("image"), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  const imageUrl = `/api/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

router.post("/admin/upload-multiple", adminAuth, upload.array("images", 3), (req: Request, res: Response): void => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    res.status(400).json({ error: "No files uploaded" });
    return;
  }
  const imageUrls = files.map(f => `/api/uploads/${f.filename}`);
  res.json({ imageUrls });
});

export default router;
