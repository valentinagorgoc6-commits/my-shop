#!/usr/bin/env npx tsx
/**
 * Migrate existing uploaded images to WebP with multiple sizes + update DB URLs.
 *
 * Usage (run from api-server directory):
 *   DATABASE_URL=postgresql://... npx tsx scripts/migrate-images.ts [uploads-path]
 *
 * What it does:
 *   1. Scans the uploads directory for .jpg/.jpeg/.png files
 *   2. Creates WebP variants: -thumb.webp (400px), -medium.webp (800px), -full.webp (1600px), .webp (default)
 *   3. Moves originals to uploads-original/ as backup
 *   4. Updates database: replaces .jpg/.png URLs with .webp in image_url and image_urls columns
 *
 * ⚠️  Make a database backup before running: pg_dump pickmestore > backup.sql
 */
import fs from "fs";
import path from "path";
import { migrateExistingImage } from "../src/lib/image-processing.js";

const uploadsDir = process.argv[2] || path.resolve(process.cwd(), "uploads");
const backupDir = path.resolve(uploadsDir, "..", "uploads-original");

async function migrateFiles() {
  console.log(`\n=== Step 1: Migrate image files ===`);
  console.log(`Uploads: ${uploadsDir}`);
  console.log(`Backups: ${backupDir}\n`);

  if (!fs.existsSync(uploadsDir)) {
    console.error("Uploads directory does not exist:", uploadsDir);
    process.exit(1);
  }

  const files = fs.readdirSync(uploadsDir).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return [".jpg", ".jpeg", ".png"].includes(ext);
  });

  console.log(`Found ${files.length} image(s) to convert.\n`);

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
        console.log(`  - ${file} (skipped)`);
      }
    } catch (err) {
      errors++;
      console.error(`  ✗ ${file}: ${(err as Error).message}`);
    }
  }

  console.log(`\nFiles: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
  return migrated;
}

async function updateDatabase() {
  console.log(`\n=== Step 2: Update database URLs ===\n`);

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log("⚠️  DATABASE_URL not set — skipping DB update.");
    console.log("   Run manually:");
    console.log("   UPDATE products SET image_url = regexp_replace(image_url, '\\.(jpg|jpeg|png)$', '.webp');");
    console.log("   UPDATE products SET image_urls = regexp_replace(image_urls, '\\.(jpg|jpeg|png)', '.webp', 'g') WHERE image_urls IS NOT NULL;");
    return;
  }

  // Dynamic import to avoid requiring pg when not needed
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();

  try {
    // Count affected rows
    const countResult = await client.query(
      "SELECT COUNT(*) as cnt FROM products WHERE image_url ~ '\\.(jpg|jpeg|png)$'"
    );
    const count = parseInt(countResult.rows[0].cnt);
    console.log(`Found ${count} products with .jpg/.png URLs.\n`);

    if (count === 0) {
      console.log("Nothing to update — all URLs already .webp!");
      return;
    }

    // Update image_url
    const r1 = await client.query(
      "UPDATE products SET image_url = regexp_replace(image_url, '\\.(jpg|jpeg|png)$', '.webp') WHERE image_url ~ '\\.(jpg|jpeg|png)$'"
    );
    console.log(`  ✓ Updated image_url: ${r1.rowCount} rows`);

    // Update image_urls (JSON string with array of URLs)
    const r2 = await client.query(
      "UPDATE products SET image_urls = regexp_replace(image_urls, '\\.(jpg|jpeg|png)', '.webp', 'g') WHERE image_urls IS NOT NULL AND image_urls ~ '\\.(jpg|jpeg|png)'"
    );
    console.log(`  ✓ Updated image_urls: ${r2.rowCount} rows`);

    // Verify
    const verify = await client.query(
      "SELECT COUNT(*) as cnt FROM products WHERE image_url NOT LIKE '%.webp'"
    );
    console.log(`\n  Verification: ${verify.rows[0].cnt} products still have non-.webp URLs (should be 0)`);
  } finally {
    await client.end();
  }
}

async function main() {
  await migrateFiles();
  await updateDatabase();
  console.log("\n=== Migration complete! ===\n");
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
