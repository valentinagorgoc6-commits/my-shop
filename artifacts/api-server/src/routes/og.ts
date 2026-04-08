import { Router } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const BOT_PATTERNS = [
  "TelegramBot",
  "WhatsApp",
  "facebookexternalhit",
  "Twitterbot",
  "vkShare",
  "OdnoklassnikiBot",
  "Slackbot",
  "LinkedInBot",
];

function isBot(userAgent: string): boolean {
  return BOT_PATTERNS.some((pat) => userAgent.includes(pat));
}

function parseFirstImage(imageUrls: string | null, fallback: string): string {
  if (imageUrls) {
    try {
      const arr = JSON.parse(imageUrls) as string[];
      if (arr.length > 0) return arr[0];
    } catch { /* ignore */ }
  }
  return fallback;
}

router.get("/product/:id", async (req, res) => {
  const ua = req.headers["user-agent"] ?? "";

  if (!isBot(ua)) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id))
    .limit(1);

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const firstImage = parseFirstImage(product.imageUrls, product.imageUrl);
  const imageUrl = firstImage.startsWith("http")
    ? firstImage
    : `https://pickmestore.ru${firstImage.startsWith("/") ? firstImage : `/api/uploads/${firstImage}`}`;

  const brandPrefix = product.brand?.trim() ? `${product.brand.trim()} ` : "";
  const title = `${brandPrefix}${product.name} — ${product.price.toLocaleString("ru-RU")} ₽`;
  const description = `Размер: ${product.size}. Оригинальная брендовая вещь в PickMe Store`;
  const pageUrl = `https://pickmestore.ru/product/${id}`;

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>${title} | PickMe Store</title>
  <meta name="description" content="${description}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="PickMe Store" />
  <meta http-equiv="refresh" content="0;url=${pageUrl}" />
</head>
<body>
  <p>Переход на <a href="${pageUrl}">${title}</a>…</p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.send(html);
});

export default router;
