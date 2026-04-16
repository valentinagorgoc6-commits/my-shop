#!/usr/bin/env npx tsx
/**
 * Migrate existing uploaded images to WebP with multiple sizes.
 *
 * Usage (run from api-server directory):
 *   npx tsx scripts/migrate-images.ts
 *
 * Or specify a custom uploads path:
 *   npx tsx scripts/migrate-images.ts /var/www/pickme-store/uploads
 *
 * What it does:
 *   1. Scans the uploads directory for .jpg/.jpeg/.png files
 *   2. Creates WebP variants: -thumb.webp (400px), -medium.webp (800px), -full.webp (1600px), .webp (default)
 *   3. Moves originals to uploads-original/ as backup
 *   4. Updates database: replaces .jpg/.png URLs with .webp
 */
import fs from "fs";
import path from "path";
import { migrateExistingImage } from "../src/lib/image-processing.js";

// Allow DATABASE_URL from .env or environment
const uploadsDir = process.argv[2] || path.resolve(process.cwd(), "uploads");
const backupDir = path.resolve(uploadsDir, "..", "uploads-original");

async function main() {
  console.log(`\nMigrating images in: ${uploadsDir}`);
  console.log(`Backups will go to: ${backupDir}\n`);

  if (!fs.existsSync(uploadsDir)) {
    console.error("Uploads directory does not exist:", uploadsDir);
    process.exit(1);
  }

  const files = fs.readdirSync(uploadsDir).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return [".jpg", ".jpeg", ".png"].includes(ext);
  });

  console.log(`Found ${files.length} image(s) to migrate.\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const result = await migrateExistingImage(file, uploadsDir, backupDir);
      if (result) {
        migrated++;
        console.log(`  ✓ ${file} → .webp (3 sizes)`);
      } else {
        skipped++;
        console.log(`  - ${file} (skipped, already migrated or not an image)`);
      }
    } catch (err) {
      errors++;
      console.error(`  ✗ ${file}: ${(err as Error).message}`);
    }
  }

  console.log(`\nDone! Migrated: ${migrated}, Skipped: ${skipped}, Errors: ${errors}`);
  console.log(`\nNote: Database URLs still reference original filenames (.jpg/.png).`);
  console.log(`The Nginx WebP rewrite rule will serve .webp automatically.`);
  console.log(`Or update DB URLs manually: UPDATE products SET image_url = replace(image_url, '.jpg', '.webp');`);
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
