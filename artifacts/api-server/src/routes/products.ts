import { Router, type IRouter } from "express";
import { db, productsTable, insertProductSchema } from "@workspace/db";
import { and, eq } from "drizzle-orm";

const router: IRouter = Router();

const VALID_CATEGORIES = ["shoes", "tops", "bottoms", "accessories", "supplements"] as const;
type ValidCategory = typeof VALID_CATEGORIES[number];

function parseImageUrls(raw: string | null | undefined, fallback: string): string[] {
  if (raw) {
    try { return JSON.parse(raw) as string[]; } catch { /* ignore */ }
  }
  return fallback ? [fallback] : [];
}

function formatProduct(p: { imageUrl: string; imageUrls: string | null; telegramUrl: string; createdAt: Date; [key: string]: unknown }) {
  return {
    ...p,
    imageUrl: p.imageUrl,
    imageUrls: parseImageUrls(p.imageUrls, p.imageUrl),
    telegramUrl: p.telegramUrl,
    createdAt: p.createdAt.toISOString(),
  };
}

// Public product list — only published=true
router.get("/products", async (req, res) => {
  const { category, featured, limit: limitRaw, offset: offsetRaw } = req.query as {
    category?: string; featured?: string; limit?: string; offset?: string;
  };
  const limit = limitRaw !== undefined ? parseInt(limitRaw, 10) : undefined;
  const offset = offsetRaw !== undefined ? parseInt(offsetRaw, 10) : undefined;
  try {
    const conditions = [eq(productsTable.published, true)];
    if (category && (VALID_CATEGORIES as readonly string[]).includes(category)) {
      conditions.push(eq(productsTable.category, category as ValidCategory));
    }
    if (featured === "true") {
      conditions.push(eq(productsTable.featured, true));
    }
    let query = db
      .select()
      .from(productsTable)
      .where(and(...conditions))
      .orderBy(productsTable.createdAt)
      .$dynamic();
    if (limit !== undefined && !isNaN(limit)) query = query.limit(limit);
    if (offset !== undefined && !isNaN(offset)) query = query.offset(offset);
    const products = await query;
    res.json(products.map(formatProduct));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch products");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", async (req, res) => {
  const { imageUrls: rawImageUrls, ...rest } = req.body as { imageUrls?: string[]; [key: string]: unknown };
  const imageUrls = Array.isArray(rawImageUrls) ? rawImageUrls : [];
  const body = {
    ...rest,
    imageUrl: imageUrls[0] ?? (typeof rest.imageUrl === "string" ? rest.imageUrl : ""),
    imageUrls: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
    published: false,
  };
  const parsed = insertProductSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const [product] = await db.insert(productsTable).values(parsed.data).returning();
    res.status(201).json(formatProduct(product));
  } catch (err) {
    req.log.error({ err }, "Failed to create product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!product) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatProduct(product));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { imageUrls: rawImageUrls, ...rest } = req.body as { imageUrls?: string[]; [key: string]: unknown };
  const imageUrls = Array.isArray(rawImageUrls) ? rawImageUrls : [];
  const body = {
    ...rest,
    imageUrl: imageUrls[0] ?? (typeof rest.imageUrl === "string" ? rest.imageUrl : ""),
    imageUrls: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
  };
  const parsed = insertProductSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const [product] = await db.update(productsTable).set(parsed.data).where(eq(productsTable.id, id)).returning();
    if (!product) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatProduct(product));
  } catch (err) {
    req.log.error({ err }, "Failed to update product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete product");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
