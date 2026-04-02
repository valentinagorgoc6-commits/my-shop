import { Router, type IRouter } from "express";
import { db, productsTable, insertProductSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/products", async (req, res) => {
  const { category } = req.query as { category?: string };
  try {
    let products;
    if (category && ["shoes", "tops", "bottoms", "accessories"].includes(category)) {
      products = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.category, category as "shoes" | "tops" | "bottoms" | "accessories"))
        .orderBy(productsTable.createdAt);
    } else {
      products = await db
        .select()
        .from(productsTable)
        .orderBy(productsTable.createdAt);
    }
    res.json(products.map(p => ({
      ...p,
      imageUrl: p.imageUrl,
      telegramUrl: p.telegramUrl,
      createdAt: p.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch products");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", async (req, res) => {
  const parsed = insertProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const [product] = await db.insert(productsTable).values(parsed.data).returning();
    res.status(201).json({
      ...product,
      imageUrl: product.imageUrl,
      telegramUrl: product.telegramUrl,
      createdAt: product.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  try {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!product) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({
      ...product,
      imageUrl: product.imageUrl,
      telegramUrl: product.telegramUrl,
      createdAt: product.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const parsed = insertProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const [product] = await db
      .update(productsTable)
      .set(parsed.data)
      .where(eq(productsTable.id, id))
      .returning();
    if (!product) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({
      ...product,
      imageUrl: product.imageUrl,
      telegramUrl: product.telegramUrl,
      createdAt: product.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  try {
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete product");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
