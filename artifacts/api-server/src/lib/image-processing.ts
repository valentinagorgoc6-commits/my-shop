import sharp from "sharp";
import path from "path";
import fs from "fs";

export const IMAGE_SIZES = {
  thumb: 400,
  medium: 800,
  full: 1600,
} as const;

export type ImageSize = keyof typeof IMAGE_SIZES;

const WEBP_QUALITY = 85;

/**
 * Process an uploaded image: create WebP variants at 3 sizes.
 * Returns the base name (without extension) used for all variants.
 *
 * Output files:
 *   {baseName}-thumb.webp  (400px wide)
 *   {baseName}-medium.webp (800px wide)
 *   {baseName}-full.webp   (1600px wide)
 *   {baseName}.webp        (original converted to webp, kept for backwards compat)
 */
export async function processUploadedImage(
  filePath: string,
  uploadsDir: string,
): Promise<{ baseName: string; variants: Record<ImageSize, string> }> {
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);

  const variants: Record<string, string> = {};

  for (const [sizeName, maxWidth] of Object.entries(IMAGE_SIZES)) {
    const outFilename = `${baseName}-${sizeName}.webp`;
    const outPath = path.join(uploadsDir, outFilename);

    await sharp(filePath)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(outPath);

    variants[sizeName] = outFilename;
  }

  // Also create a plain .webp version (the "medium" size, used as default)
  const defaultWebp = `${baseName}.webp`;
  await sharp(filePath)
    .resize({ width: IMAGE_SIZES.medium, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(path.join(uploadsDir, defaultWebp));

  // Remove the original upload (png/jpg) to save disk space
  // The .webp versions are the source of truth now
  try {
    fs.unlinkSync(filePath);
  } catch {
    // ignore if already removed
  }

  return {
    baseName,
    variants: variants as Record<ImageSize, string>,
  };
}

/**
 * Migrate a single existing image file to WebP variants.
 * Moves original to uploads-original/ for backup.
 */
export async function migrateExistingImage(
  filename: string,
  uploadsDir: string,
  backupDir: string,
): Promise<boolean> {
  const filePath = path.join(uploadsDir, filename);
  const ext = path.extname(filename).toLowerCase();

  if (![".jpg", ".jpeg", ".png"].includes(ext)) return false;
  if (!fs.existsSync(filePath)) return false;

  const baseName = path.basename(filename, ext);

  // Skip if already migrated
  if (fs.existsSync(path.join(uploadsDir, `${baseName}.webp`))) return false;

  // Create variants
  for (const [sizeName, maxWidth] of Object.entries(IMAGE_SIZES)) {
    const outPath = path.join(uploadsDir, `${baseName}-${sizeName}.webp`);
    await sharp(filePath)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(outPath);
  }

  // Default .webp
  await sharp(filePath)
    .resize({ width: IMAGE_SIZES.medium, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(path.join(uploadsDir, `${baseName}.webp`));

  // Backup original
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  fs.copyFileSync(filePath, path.join(backupDir, filename));
  fs.unlinkSync(filePath);

  return true;
}
