import { Router, type IRouter, type Request, type Response } from "express";
import { db, pageViewsTable, productClicksTable, productsTable } from "@workspace/db";
import { sql, eq, and, gte } from "drizzle-orm";
import { adminAuth } from "./admin";

const router: IRouter = Router();

function parseDevice(ua: string | undefined): "mobile" | "desktop" {
  if (!ua) return "desktop";
  return /mobile|android|iphone|ipad|tablet/i.test(ua) ? "mobile" : "desktop";
}

// POST /analytics/pageview — public, fire-and-forget
router.post("/analytics/pageview", async (req: Request, res: Response): Promise<void> => {
  const { page, referrer, userAgent, visitorId } = req.body as {
    page?: string; referrer?: string; userAgent?: string; visitorId?: string;
  };
  if (!page || !visitorId) { res.status(400).json({ error: "page and visitorId required" }); return; }
  try {
    await db.insert(pageViewsTable).values({
      page,
      visitorId,
      referrer: referrer ?? null,
      userAgent: userAgent ?? null,
      device: parseDevice(userAgent),
    });
    res.status(204).send();
  } catch {
    res.status(204).send();
  }
});

// POST /analytics/click — public, fire-and-forget
router.post("/analytics/click", async (req: Request, res: Response): Promise<void> => {
  const { productId, actionType, visitorId } = req.body as {
    productId?: number; actionType?: string; visitorId?: string;
  };
  if (!productId || !actionType || !visitorId) { res.status(400).json({ error: "productId, actionType, visitorId required" }); return; }
  try {
    await db.insert(productClicksTable).values({ productId, actionType, visitorId });
    res.status(204).send();
  } catch {
    res.status(204).send();
  }
});

// GET /analytics/dashboard — admin only
router.get("/analytics/dashboard", adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start7d = new Date(startOfToday.getTime() - 6 * 86400000);
    const start30d = new Date(startOfToday.getTime() - 29 * 86400000);

    // Overview counts
    const [visitorsToday, visitors7d, visitors30d, pageviewsToday] = await Promise.all([
      db.select({ count: sql<number>`count(distinct ${pageViewsTable.visitorId})` })
        .from(pageViewsTable).where(gte(pageViewsTable.createdAt, startOfToday)),
      db.select({ count: sql<number>`count(distinct ${pageViewsTable.visitorId})` })
        .from(pageViewsTable).where(gte(pageViewsTable.createdAt, start7d)),
      db.select({ count: sql<number>`count(distinct ${pageViewsTable.visitorId})` })
        .from(pageViewsTable).where(gte(pageViewsTable.createdAt, start30d)),
      db.select({ count: sql<number>`count(*)` })
        .from(pageViewsTable).where(gte(pageViewsTable.createdAt, startOfToday)),
    ]);

    // Daily chart — last 30 days
    const chartRaw = await db.execute(sql`
      SELECT
        DATE(created_at AT TIME ZONE 'UTC') as date,
        COUNT(DISTINCT visitor_id) as visitors
      FROM page_views
      WHERE created_at >= ${start30d.toISOString()}
      GROUP BY DATE(created_at AT TIME ZONE 'UTC')
      ORDER BY date ASC
    `);

    // Top 10 products
    const topProductsRaw = await db.execute(sql`
      SELECT
        pc.product_id as "productId",
        p.name,
        p.brand,
        COUNT(CASE WHEN pc.action_type = 'card_view' THEN 1 END) as "cardViews",
        COUNT(CASE WHEN pc.action_type = 'avito_click' THEN 1 END) as "avitoClicks",
        COUNT(CASE WHEN pc.action_type = 'telegram_click' THEN 1 END) as "telegramClicks",
        COUNT(*) as total
      FROM product_clicks pc
      LEFT JOIN products p ON p.id = pc.product_id
      GROUP BY pc.product_id, p.name, p.brand
      ORDER BY total DESC
      LIMIT 10
    `);

    // Traffic sources (referrer)
    const sourcesRaw = await db.execute(sql`
      SELECT referrer, COUNT(*) as count
      FROM page_views
      WHERE created_at >= ${start30d.toISOString()}
      GROUP BY referrer
      ORDER BY count DESC
    `);

    // Devices
    const devicesRaw = await db.execute(sql`
      SELECT device, COUNT(*) as count
      FROM page_views
      WHERE created_at >= ${start30d.toISOString()}
      GROUP BY device
    `);

    // Top pages
    const topPagesRaw = await db.execute(sql`
      SELECT page, COUNT(*) as views
      FROM page_views
      WHERE created_at >= ${start30d.toISOString()}
      GROUP BY page
      ORDER BY views DESC
      LIMIT 5
    `);

    // Normalize referrer to source group
    function classifyReferrer(ref: string | null | undefined): string {
      if (!ref) return "Прямой заход";
      const r = ref.toLowerCase();
      if (r.includes("t.me") || r.includes("telegram")) return "Telegram";
      if (r.includes("avito")) return "Авито";
      if (r.includes("yandex")) return "Яндекс";
      if (r.includes("google")) return "Google";
      if (r.includes("vk.com") || r.includes("vkontakte")) return "ВКонтакте";
      return "Другое";
    }

    const sourceMap: Record<string, number> = {};
    for (const row of sourcesRaw.rows as { referrer: string | null; count: string }[]) {
      const key = classifyReferrer(row.referrer);
      sourceMap[key] = (sourceMap[key] ?? 0) + Number(row.count);
    }
    const totalSources = Object.values(sourceMap).reduce((a, b) => a + b, 0);
    const sources = Object.entries(sourceMap)
      .map(([source, count]) => ({ source, count, percent: totalSources > 0 ? Math.round(count / totalSources * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    const deviceMap: Record<string, number> = {};
    for (const row of devicesRaw.rows as { device: string | null; count: string }[]) {
      const key = row.device ?? "desktop";
      deviceMap[key] = (deviceMap[key] ?? 0) + Number(row.count);
    }
    const totalDevices = Object.values(deviceMap).reduce((a, b) => a + b, 0);

    res.json({
      overview: {
        visitorsToday: Number(visitorsToday[0]?.count ?? 0),
        visitors7d: Number(visitors7d[0]?.count ?? 0),
        visitors30d: Number(visitors30d[0]?.count ?? 0),
        pageviewsToday: Number(pageviewsToday[0]?.count ?? 0),
      },
      chart: (chartRaw.rows as { date: string; visitors: string }[]).map(r => ({
        date: String(r.date).slice(0, 10),
        visitors: Number(r.visitors),
      })),
      topProducts: (topProductsRaw.rows as { productId: number; name: string; brand: string; cardViews: string; avitoClicks: string; telegramClicks: string; total: string }[]).map(r => ({
        productId: Number(r.productId),
        name: r.name ?? "—",
        brand: r.brand ?? "—",
        cardViews: Number(r.cardViews),
        avitoClicks: Number(r.avitoClicks),
        telegramClicks: Number(r.telegramClicks),
        total: Number(r.total),
      })),
      sources,
      devices: {
        mobile: deviceMap["mobile"] ?? 0,
        desktop: deviceMap["desktop"] ?? 0,
        mobilePercent: totalDevices > 0 ? Math.round((deviceMap["mobile"] ?? 0) / totalDevices * 100) : 0,
        desktopPercent: totalDevices > 0 ? Math.round((deviceMap["desktop"] ?? 0) / totalDevices * 100) : 0,
      },
      topPages: (topPagesRaw.rows as { page: string; views: string }[]).map(r => ({
        page: r.page,
        views: Number(r.views),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Analytics dashboard error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
