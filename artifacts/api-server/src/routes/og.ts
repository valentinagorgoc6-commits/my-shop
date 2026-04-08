import { Router } from "express";
import path from "path";
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

const SPA_INDEX = path.resolve(__dirname, "../../pickme-store/dist/public/index.html");

function isBot(ua: string): boolean {
  return BOT_PATTERNS.some((pat) => ua.includes(pat));
}

router.get("/product/:id", async (req, res) => {
  const ua = req.headers["user-agent"] ?? "";

  if (!isBot(ua)) {
    res.sendFile(SPA_INDEX);
    return;
  }

  const id = Number(req.params.id);

  if (!Number.isFinite(id)) {
    res.status(404).setHeader("Content-Type", "text/html; charset=utf-8").send("<html><body>404 Not Found</body></html>");
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id))
    .limit(1);

  if (!product) {
    res.status(404).setHeader("Content-Type", "text/html; charset=utf-8").send("<html><body>404 Not Found</body></html>");
    return;
  }

  const imageUrl = `https://pickmestore.ru${product.imageUrl}`;
  const title = `${product.brand} ${product.name} — ${product.price} ₽`;
  const pageUrl = `/product/${product.id}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title} | PickMe Store</title>
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="Размер: ${product.size}. Оригинальная брендовая вещь в PickMe Store">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="https://pickmestore.ru/product/${product.id}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="PickMe Store">
  <meta http-equiv="refresh" content="0;url=${pageUrl}">
</head>
<body>
  <script>window.location.href='${pageUrl}'</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.send(html);
});

export default router;
