import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Menu, Star, Check, Camera, DollarSign, Clock, ArrowRight, X, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { getImageSrcSet, SIZES_CARD } from "@/lib/image-utils";

// ─── Analytics ────────────────────────────────────────────────────
export function getOrCreateVisitorId(): string {
  const key = "pickme-visitor-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export function trackPageview(page: string): void {
  try {
    fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, visitorId: getOrCreateVisitorId(), referrer: document.referrer }),
    }).catch(() => {});
  } catch {}
}

export function trackClick(productId: number, actionType: "avito_click" | "telegram_click" | "card_view"): void {
  try {
    fetch("/api/analytics/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, actionType, visitorId: getOrCreateVisitorId() }),
    }).catch(() => {});
  } catch {}
}

// ─── Data Fetching ────────────────────────────────────────────────
export type ProductsParams = {
  category?: string;
  gender?: string;
  random?: boolean;
  limit?: number;
  featured?: boolean;
};

export function useProductsFetch(params: ProductsParams, enabled = true) {
  const key = ["products-fetch", params];
  return useQuery<Array<Record<string, unknown>>>({
    queryKey: key,
    queryFn: async () => {
      const url = new URL("/api/products", window.location.origin);
      if (params.category) url.searchParams.set("category", params.category);
      if (params.gender) url.searchParams.set("gender", params.gender);
      if (params.random) url.searchParams.set("random", "true");
      if (params.limit) url.searchParams.set("limit", String(params.limit));
      if (params.featured) url.searchParams.set("featured", "true");
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("fetch error");
      return res.json() as Promise<Array<Record<string, unknown>>>;
    },
    enabled,
  });
}

// ─── Theme content ────────────────────────────────────────────────
export const themeContent = {
  female: {
    hero: {
      badge: "✨ подберём лук и для пикми, и для её масика",
      titleLine1: "Здесь твой",
      titleEm: "total slay образ",
      subtitle: "по цене даже ниже, чем пал твой бывший",
      body: <>Оригиналы <strong className="text-foreground font-bold">Nike, Guess, Lacoste</strong> и других брендов — с живыми фото, примеркой на мне и честными ценами от 3 500 ₽. Доставка по всей России.</>,
      ctaPrimary: "Смотреть каталог ↓",
      ctaSecondary: "Узнать больше",
    },
    about: {
      label: null as null | string,
      title: <>Привет, я — <em className="italic text-primary">Валентинка</em></>,
      sub: "та самая пикми-подружка, которая не бесит 💕",
      paragraphs: [
        "Раньше я спасала пассажиров на высоте 10 000 метров от плачущих детей, внезапных болезней, фобий и просто плохого настроения. А теперь с удовольствием спасаю твой гардероб и кошелёк твоего масика.",
        "Я люблю видеть женщин разными: от пикми до пацанок. Каждая индивидуальна и прекрасна в своём естестве. PickMe Store — мой маленький проект, в который я вкладываю всю себя: креатив, заботу и честный внимательный подход к каждому клиенту.",
        "Здесь нет конвейера. Есть я, живые фото и желание, чтобы ты ушла довольной. Пиши в любое время, я почти всегда на связи, как будто меня до сих пор в любой момент могут вызвать в небо. Жду твоё сообщение так, как ещё год назад ждала звонка от планирования с фразой \"Валентина, нужно срочно слетать на Мальдивы, выручайте, пожалуйста\"",
      ],
      ctaLabel: "Написать в Telegram",
    },
    cta: {
      title: <>Напиши мне — <em className="italic text-primary">подберу вещь под тебя</em></>,
      sub: "отвечаю быстрее, чем ты свайпаешь влево, увидев имя Никита 🙅‍♀️",
      quote: null as null | string,
      quoteHint: null as null | string,
    },
  },
  male: {
    hero: {
      badge: null as null | string,
      titleLine1: "Оригинальные товары популярных брендов",
      titleLine2: "по низкой цене",
      subtitle: null as null | string,
      body: <>Nike, Adidas, Lacoste, Tommy Hilfiger, Calvin Klein, Guess и другие. Всё новое и оригинальное, со склада невыкупленных товаров известного магазина.</>,
      ctaPrimary: "Смотреть весь каталог",
      badges: [
        { icon: "✓", title: "Оригинал", sub: "Гарантия подлинности" },
        { icon: "₽", title: "Низкие цены", sub: "До −70% от розницы" },
        { icon: "⚡", title: "Доставка", sub: "По всей России" },
      ],
    },
    about: {
      label: "Обо мне",
      title: <>Привет, я — <em className="italic text-primary">Валентинка</em></>,
      sub: null as null | string,
      paragraphs: [
        "Раньше я спасала пассажиров на высоте 10 000 метров от плачущих детей, внезапных болезней, фобий и просто плохого настроения. А теперь с удовольствием спасаю твой гардероб и помогаю подобрать подарок для «той самой».",
        "PickMe Store — мой маленький проект, в который я вкладываю всю себя: креатив, заботу и честный внимательный подход к каждому клиенту.",
        "Здесь нет конвейера. Есть я, живые фото и желание продуктивного сотрудничества, которое оставит приятное послевкусие для каждой из сторон. Пиши в любое время, я почти всегда на связи, как будто меня до сих пор в любой момент могут вызвать в небо. Жду твоё сообщение так, как ещё год назад ждала звонка от планирования с фразой «Валентина, нужно срочно слетать на Мальдивы, выручайте, пожалуйста»",
      ],
      ctaLabel: "Написать в Telegram",
    },
    cta: {
      title: <>Остались вопросы?</>,
      sub: "Выбери удобный способ связи 👇",
      quote: "Я не смогу стать той, кто напишет тебе первой, но могу стать той самой, которая будет ждать твоё \"Привет\" и отвечать практически в любое время дня и ночи.",
      quoteHint: null as null | string,
    },
  },
} as const;

// -- Animation Variants --
export const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.13 } }
};

// -- Shared Decorator — delegates to SectionDivider component --
import SectionDivider from "@/components/SectionDivider";

export function DecorBar({ align = "center" }: { align?: "center" | "left" | "responsive" }) {
  return <SectionDivider align={align} />;
}

export function SectionTitle({ title, sub, titleNode, id }: { title?: string; sub?: React.ReactNode; titleNode?: React.ReactNode; id?: string }) {
  const { gender } = useTheme();
  const headingFont = "var(--pm-font-heading, 'Playfair Display', serif)";
  return (
    <div className={`text-center mb-12 ${gender === "male" ? "section-glow" : ""}`} id={id}>
      <DecorBar />
      {titleNode ? (
        <h2 className="text-[28px] md:text-[36px] font-bold text-foreground" style={{ fontFamily: headingFont }}>{titleNode}</h2>
      ) : (
        <h2 className="text-[28px] md:text-[36px] font-bold text-foreground" style={{ fontFamily: headingFont }}>{title}</h2>
      )}
      {sub && <p className="font-script text-[20px] mt-2" style={{ color: "var(--pm-primary)" }}>{sub}</p>}
    </div>
  );
}

export function LogoWord() {
  return (
    <span className="text-[20px] md:text-[26px] font-bold no-underline tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
      <span style={{ color: "var(--pm-primary)" }}>Pick</span>
      <span className="text-[24px] md:text-[30px] font-semibold" style={{ color: "var(--pm-primary)", fontFamily: "'Caveat', cursive" }}>Me</span>
      <span style={{ color: "var(--pm-text-heading, var(--foreground))" }}> Store</span>
    </span>
  );
}

// ─── Shoe Size Chart ──────────────────────────────────────────────
export const SHOE_SIZE_CHART: { cm: number; ru: string }[] = [
  { cm: 22.5, ru: "35" },
  { cm: 23,   ru: "36" },
  { cm: 23.5, ru: "36.5" },
  { cm: 24,   ru: "37" },
  { cm: 24.5, ru: "38" },
  { cm: 25,   ru: "39" },
  { cm: 25.5, ru: "39.5" },
  { cm: 26,   ru: "40" },
  { cm: 26.5, ru: "41" },
  { cm: 27,   ru: "42" },
  { cm: 27.5, ru: "42.5" },
  { cm: 28,   ru: "43" },
  { cm: 28.5, ru: "44" },
  { cm: 29,   ru: "45" },
  { cm: 29.5, ru: "45.5" },
  { cm: 30,   ru: "46" },
  { cm: 30.5, ru: "47" },
  { cm: 31,   ru: "48" },
];

export function matchShoeSizeRow(size: string): number | null {
  const num = parseFloat(size.replace(/[^\d.]/g, ""));
  if (isNaN(num)) return null;
  const byCm = SHOE_SIZE_CHART.findIndex(r => r.cm === num);
  if (byCm >= 0) return byCm;
  const byRu = SHOE_SIZE_CHART.findIndex(r => parseFloat(r.ru) === num);
  if (byRu >= 0) return byRu;
  return null;
}

export function getVisibleSizeRows(matchedIdx: number | null): { row: typeof SHOE_SIZE_CHART[0]; globalIdx: number }[] {
  const total = SHOE_SIZE_CHART.length;
  const WINDOW = 7;
  let start: number;
  if (matchedIdx === null) {
    start = 0;
  } else {
    start = matchedIdx - 3;
    if (start < 0) start = 0;
    if (start + WINDOW > total) start = total - WINDOW;
  }
  return SHOE_SIZE_CHART.slice(start, start + WINDOW).map((row, i) => ({ row, globalIdx: start + i }));
}

// ─── Sorting / Interleave ─────────────────────────────────────────
const INTERLEAVE_ORDER = ["shoes", "tops", "bottoms", "accessories"] as const;

function interleaveSection(items: { category: string; [key: string]: unknown }[]) {
  const supplements = items.filter(p => p.category === "supplements");
  const main = items.filter(p => p.category !== "supplements");
  const queues: Record<string, typeof main> = {};
  for (const cat of INTERLEAVE_ORDER) queues[cat] = main.filter(p => p.category === cat);
  const result: typeof main = [];
  while (INTERLEAVE_ORDER.some(cat => queues[cat].length > 0)) {
    for (const cat of INTERLEAVE_ORDER) {
      if (queues[cat].length > 0) result.push(queues[cat].shift()!);
    }
  }
  return [...result, ...supplements];
}

export function applyDefaultSort<T extends { badge?: string | null; sortOrder?: number | null; category: string }>(list: T[]): T[] {
  const withOrder = list.filter(p => p.sortOrder != null).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const withoutOrder = list.filter(p => p.sortOrder == null);
  const available = withoutOrder.filter(p => p.badge !== "sold" && p.badge !== "reserved");
  const reserved = withoutOrder.filter(p => p.badge === "reserved");
  const sold = withoutOrder.filter(p => p.badge === "sold");
  return [
    ...withOrder,
    ...interleaveSection(available),
    ...interleaveSection(reserved),
    ...interleaveSection(sold),
  ] as T[];
}

// ─── Product Types ────────────────────────────────────────────────
export type ProductDetail = {
  id: number; brand: string; name: string; size: string; price: number;
  category: string; badge: string | null; imageUrl: string; imageUrls?: string[];
  telegramUrl: string; avitoLink?: string | null; caption?: string | null;
  published: boolean; description?: string | null;
  outerSeam?: number | null; innerSeam?: number | null; riseHeight?: number | null;
  halfWaist?: number | null; halfHip?: number | null; halfLegOpening?: number | null;
  model?: string | null;
  gender?: string | null;
};

export const PAGE_SIZE = 15;

// ─── Product Card ─────────────────────────────────────────────────
export function ProductCard({ product }: { product: { id: number; brand: string; name: string; size: string; price: number; category?: string; badge?: string | null; imageUrl: string; imageUrls?: string[]; telegramUrl: string; avitoLink?: string | null; caption?: string | null } }) {
  const images = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls
    : product.imageUrl ? [product.imageUrl] : [];
  const [imgIdx, setImgIdx] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHoriz = useRef<boolean | null>(null);
  const liveDragX = useRef(0);
  const [dragX, setDragX] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const matchedRow = product.category === "shoes" ? matchShoeSizeRow(product.size) : null;
  const cardViewFired = useRef(false);
  const cardRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !cardViewFired.current) {
        cardViewFired.current = true;
        trackClick(product.id, "card_view");
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [product.id]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; isHoriz.current = null; liveDragX.current = 0; setAnimating(false); setDragX(0); };
    const onMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - touchStartY.current;
      if (isHoriz.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) isHoriz.current = Math.abs(dx) >= Math.abs(dy);
      if (isHoriz.current === true && images.length > 1) { e.preventDefault(); liveDragX.current = dx; setDragX(dx); }
    };
    const onEnd = () => {
      if (isHoriz.current !== true) { touchStartX.current = null; return; }
      const dx = liveDragX.current;
      setAnimating(true); setDragX(0);
      if (Math.abs(dx) >= 30 && images.length > 1) setImgIdx(i => dx < 0 ? (i + 1) % images.length : (i - 1 + images.length) % images.length);
      liveDragX.current = 0; touchStartX.current = null; isHoriz.current = null;
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });
    return () => { el.removeEventListener("touchstart", onStart); el.removeEventListener("touchmove", onMove); el.removeEventListener("touchend", onEnd); el.removeEventListener("touchcancel", onEnd); };
  }, [images.length]);

  const prevImg = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setAnimating(true); setImgIdx(i => (i - 1 + images.length) % images.length); };
  const nextImg = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setAnimating(true); setImgIdx(i => (i + 1) % images.length); };
  const handleCarouselClick = () => { if (Math.abs(liveDragX.current) < 10) window.location.href = `/product/${product.id}`; };

  return (
    <div ref={cardRootRef} className="product-card-hover rounded-2xl overflow-hidden border border-primary/10 shadow-[0_4px_12px_rgba(61,32,48,0.06)] flex flex-col h-full" style={{ background: "var(--pm-card-bg, white)" }}>
      <div ref={carouselRef} className="relative w-full aspect-[3/4] overflow-hidden group flex-shrink-0 bg-gradient-to-br from-[var(--pm-primary-bg)] to-secondary" style={{ touchAction: "pan-y", cursor: "pointer" }} onClick={handleCarouselClick}>
        {images.length > 0 ? (
          <div style={{ display: "flex", width: `${images.length * 100}%`, height: "100%", transform: `translateX(calc(${-(imgIdx / images.length) * 100}% + ${dragX}px))`, transition: animating ? "transform 300ms ease-out" : "none", willChange: "transform" }} onTransitionEnd={() => setAnimating(false)}>
            {images.map((src, i) => (
              <div key={i} style={{ width: `${100 / images.length}%`, flexShrink: 0, height: "100%", overflow: "hidden", position: "relative" }}>
                {(() => { const img = getImageSrcSet(src); return (
                  <img src={img.src} srcSet={img.srcSet} sizes={SIZES_CARD} alt={product.name} className="product-img-zoom" loading="lazy" decoding="async" />
                ); })()}
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl opacity-60 mb-2">👗</span>
            <span className="text-xs text-muted-foreground font-semibold">Фото товара</span>
          </div>
        )}
        {product.badge === "new" && <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white bg-primary" style={{ zIndex: 10 }}>New</div>}
        {product.badge === "sold" && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
            <div style={{ position: "absolute", top: "28px", left: "-36px", width: "148px", background: "var(--pm-primary)", color: "#fff", textAlign: "center", transform: "rotate(-45deg)", fontSize: "11px", fontWeight: 700, padding: "6px 0", boxShadow: "0 2px 8px rgba(0,0,0,0.22)", letterSpacing: "0.08em" }}>ПРОДАНО</div>
          </div>
        )}
        {product.badge === "reserved" && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
            <div style={{ position: "absolute", top: "28px", left: "-36px", width: "148px", background: "#f97316", color: "#fff", textAlign: "center", transform: "rotate(-45deg)", fontSize: "11px", fontWeight: 700, padding: "6px 0", boxShadow: "0 2px 8px rgba(0,0,0,0.22)", letterSpacing: "0.08em" }}>БРОНЬ</div>
          </div>
        )}
        {images.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-primary hover:text-white text-lg font-bold" style={{ zIndex: 10 }}>‹</button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-primary hover:text-white text-lg font-bold" style={{ zIndex: 10 }}>›</button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5" style={{ zIndex: 10 }}>
              {images.map((_, i) => (
                <button key={i} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAnimating(true); setImgIdx(i); }} className={`rounded-full transition-all ${i === imgIdx ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-white/70"}`} />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div>
          <div className="text-[11px] font-bold tracking-[1.5px] uppercase text-primary mb-1">{product.brand}</div>
          <a href={`/product/${product.id}`} className="no-underline block">
            <h3 className="font-serif text-[17px] font-bold text-foreground mb-1 hover:text-primary transition-colors">{product.name}</h3>
          </a>
          <div className="text-[13px] text-muted-foreground mb-2">
            {product.category === "shoes" ? <>Длина стельки: {product.size} см</> : <>Размер: {product.size}</>}
          </div>
          {product.category === "shoes" && (
            <div className="mb-2">
              <button type="button" onClick={() => setSizeChartOpen(v => !v)} className="flex items-center gap-1.5 w-full text-left text-[12px] font-semibold text-primary/80 hover:text-primary transition-colors py-1.5 px-2.5 rounded-lg hover:bg-[var(--pm-primary-bg)]">
                <span className="text-base leading-none">📏</span>
                <span className="flex-1">Таблица размеров</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: sizeChartOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 220ms ease" }}>
                  <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {sizeChartOpen && (
                <div className="mt-1 rounded-xl overflow-hidden" style={{ border: "1px solid var(--pm-primary-border)", animation: "fadeIn 200ms ease" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", tableLayout: "fixed" }}>
                    <thead>
                      <tr style={{ background: "var(--pm-primary-bg)" }}>
                        <th style={{ width: "50%", padding: "5px 10px", textAlign: "center", fontWeight: 700, color: "var(--pm-primary)", borderBottom: "1px solid var(--pm-primary-border)" }}>Стелька (см)</th>
                        <th style={{ width: "50%", padding: "5px 10px", textAlign: "center", fontWeight: 700, color: "var(--pm-primary)", borderBottom: "1px solid var(--pm-primary-border)" }}>RU</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getVisibleSizeRows(matchedRow).map(({ row, globalIdx }, i, arr) => {
                        const isMatch = globalIdx === matchedRow;
                        return (
                          <tr key={row.cm} style={{ background: isMatch ? "color-mix(in srgb, var(--pm-primary) 18%, var(--pm-card-bg))" : i % 2 === 0 ? "var(--pm-card-bg)" : "var(--pm-surface-alt)", borderBottom: i < arr.length - 1 ? "1px solid var(--pm-primary-border)" : "none", boxShadow: isMatch ? "inset 3px 0 0 var(--pm-primary)" : "none" }}>
                            <td style={{ padding: "5px 10px", textAlign: "center", fontWeight: isMatch ? 700 : 400, color: isMatch ? "var(--pm-primary)" : "var(--pm-text-body)" }}>{row.cm}</td>
                            <td style={{ padding: "5px 10px", textAlign: "center", fontWeight: isMatch ? 700 : 400, color: isMatch ? "var(--pm-primary)" : "var(--pm-text-body)" }}>
                              {row.ru}{isMatch && <span style={{ marginLeft: 4, fontSize: 9 }}>◀</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex-1" />
        <div className="flex items-center justify-between mt-4">
          <div className={`text-xl font-bold ${product.badge === "sold" ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {product.price.toLocaleString("ru-RU")} ₽
          </div>
          {product.badge === "sold" ? (
            <button disabled className="px-4 py-2 rounded-full bg-secondary text-muted-foreground text-[13px] font-bold cursor-not-allowed">Продано</button>
          ) : product.badge === "reserved" ? (
            <button disabled className="px-4 py-2 rounded-full text-[13px] font-bold cursor-not-allowed" style={{ background: "color-mix(in srgb, #f97316 15%, var(--pm-card-bg, #fff))", color: "#f97316" }}>Забронировано</button>
          ) : (
            <a href={`/product/${product.id}`} className="w-10 h-10 rounded-full text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors" style={{ background: "var(--pm-primary-bg)" }} data-testid={`button-buy-${product.id}`}>
              <ArrowRight size={18} />
            </a>
          )}
        </div>
        <div className="mt-3 flex justify-center min-h-[36px]">
          {(product.badge === "sold" || product.badge === "reserved") ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold" style={{ background: "var(--pm-surface-alt, #f3f4f6)", color: "var(--pm-text-muted, #9ca3af)", filter: "grayscale(1)", opacity: 0.5, pointerEvents: "none", cursor: "not-allowed" }}>
              {product.avitoLink ? (<><img src="https://www.avito.ru/favicon.ico" width={14} height={14} alt="" aria-hidden="true" className="shrink-0" />Купить на Авито</>) : (<><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.01 13.585l-2.94-.918c-.64-.203-.653-.64.136-.954l11.5-4.43c.533-.194 1-.131.818.938z"/></svg>Написать в Telegram</>)}
            </div>
          ) : product.avitoLink ? (
            <a href={product.avitoLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full text-primary text-[13px] font-bold hover:bg-primary hover:text-white transition-colors" style={{ background: "var(--pm-primary-bg)" }} onClick={() => trackClick(product.id, "avito_click")}>
              <img src="https://www.avito.ru/favicon.ico" width={14} height={14} alt="" aria-hidden="true" className="shrink-0" />Купить на Авито
            </a>
          ) : (
            <a href={product.telegramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full text-primary text-[13px] font-bold hover:bg-primary hover:text-white transition-colors" style={{ background: "var(--pm-primary-bg)" }} onClick={() => trackClick(product.id, "telegram_click")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.01 13.585l-2.94-.918c-.64-.203-.653-.64.136-.954l11.5-4.43c.533-.194 1-.131.818.938z"/></svg>
              Написать в Telegram
            </a>
          )}
        </div>
        <p className="font-script text-[18px] font-medium mt-3 leading-tight min-h-[1.75rem]" style={{ color: "var(--pm-primary)" }}>
          {product.caption ?? ""}
        </p>
      </div>
    </div>
  );
}

// ─── Compact Card (mobile) ────────────────────────────────────────
export function CompactCard({ product }: { product: { id: number; brand: string; name: string; price: number; badge?: string | null; imageUrl: string; imageUrls?: string[]; createdAt: string } }) {
  const isSold = product.badge === "sold";
  const isReserved = product.badge === "reserved";
  const image = (product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls[0] : product.imageUrl;
  return (
    <a
      href={`/product/${product.id}`}
      style={{ display: "flex", flexDirection: "column", background: "var(--pm-card-bg)", borderRadius: 12, overflow: "hidden", border: "1px solid var(--pm-primary-border)", boxShadow: "0 2px 8px rgba(61,32,48,0.06)", textDecoration: "none", transition: "background 0.3s ease, border-color 0.3s ease" }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", overflow: "hidden", background: "linear-gradient(135deg, var(--pm-primary-bg), var(--pm-primary-light))", flexShrink: 0 }}>
        {image ? (
          <img src={getImageSrcSet(image).src} srcSet={getImageSrcSet(image).srcSet} sizes={SIZES_CARD} alt={product.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>👗</div>
        )}
        {isSold && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}>
            <div style={{ position: "absolute", top: 20, left: -28, width: 110, background: "var(--pm-primary)", color: "#fff", textAlign: "center", transform: "rotate(-45deg)", fontSize: 9, fontWeight: 700, padding: "4px 0", letterSpacing: "0.08em" }}>ПРОДАНО</div>
          </div>
        )}
        {isReserved && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}>
            <div style={{ position: "absolute", top: 20, left: -28, width: 110, background: "#f97316", color: "#fff", textAlign: "center", transform: "rotate(-45deg)", fontSize: 9, fontWeight: 700, padding: "4px 0", letterSpacing: "0.08em" }}>БРОНЬ</div>
          </div>
        )}
      </div>
      <div style={{ padding: "8px 10px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--pm-primary)" }}>{product.brand}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pm-text-heading)", lineHeight: 1.25, fontFamily: "'Playfair Display', serif" }}>{product.name}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: isSold ? "var(--pm-text-muted)" : "var(--pm-text-heading)", textDecoration: isSold ? "line-through" : "none", marginTop: 2 }}>
          {product.price.toLocaleString("ru-RU")} ₽
        </div>
      </div>
    </a>
  );
}

// ─── Header ───────────────────────────────────────────────────────
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { gender, mode, setGender, toggleMode } = useTheme();
  const [location, navigate] = useLocation();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("/#")) return;
    const hash = href.slice(1);
    if (location === "/") {
      e.preventDefault();
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
    } else {
      e.preventDefault();
      navigate("/");
      setTimeout(() => { document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }); }, 100);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) { document.body.style.overflow = "hidden"; } else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navLinks = [
    { name: "Каталог", href: "/catalog" },
    { name: "Обо мне", href: "/#about" },
    { name: "Отзывы", href: "/#reviews" },
    { name: "FAQ", href: "/#faq" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between max-w-[100vw] overflow-hidden ${scrolled || gender === "male" ? "glass-card shadow-[0_4px_24px_rgba(0,0,0,0.06)]" : "bg-transparent"}`}
        style={(scrolled || gender === "male") ? { borderBottom: "1px solid color-mix(in srgb, var(--pm-primary) 20%, transparent)" } : undefined}
      >
        <a href="/" className="no-underline flex flex-col leading-none cursor-pointer" data-testid="link-logo">
          <LogoWord />
          <span className="text-[10px] text-muted-foreground font-sans font-normal mt-0.5 tracking-normal">ПикМи — магазин брендовых вещей</span>
        </a>
        <nav className="hidden md:flex items-center gap-2">
          <ul className="flex gap-4 list-none m-0 p-0 items-center mr-1">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a href={link.href} onClick={(e) => handleNavClick(e, link.href)} className="text-[14px] font-semibold text-muted-foreground hover:text-primary transition-colors tracking-wide" data-testid={`link-nav-${link.href.replace("#", "")}`}>{link.name}</a>
              </li>
            ))}
            {gender === "female" && (
              <>
                <li><a href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661" target="_blank" rel="noreferrer" className="text-[14px] font-semibold text-muted-foreground hover:text-primary transition-colors tracking-wide flex items-center gap-1" data-testid="link-nav-avito"><img src="https://www.avito.ru/favicon.ico" width={14} height={14} alt="" aria-hidden="true" className="shrink-0" />Авито</a></li>
                <li><a href="https://tinyurl.com/5h4bbmkr" target="_blank" rel="noreferrer" className="text-[14px] font-semibold text-muted-foreground hover:text-primary transition-colors tracking-wide flex items-center gap-1"><img src="https://max.ru/favicon.ico" width={14} height={14} alt="" aria-hidden="true" className="shrink-0" />MAX</a></li>
              </>
            )}
          </ul>
          {gender === "female" && (
            <button onClick={() => setGender("male")} className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold transition-colors" style={{ color: "#0074c4", background: "rgba(0,100,190,0.06)", border: "1px solid rgba(0,100,190,0.15)" }} title="Мужская коллекция">
              <svg width="14" height="14" viewBox="0 0 48 48" fill="none"><circle cx="20" cy="28" r="12" stroke="currentColor" strokeWidth="3"/><line x1="29.5" y1="18.5" x2="42" y2="6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><polyline points="33,6 42,6 42,15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              <span>Для него</span>
            </button>
          )}
          {gender === "male" && (
            <>
              <button onClick={() => setGender("female")} className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold transition-colors" style={{ color: "#f04586", background: "rgba(240,69,134,0.06)", border: "1px solid rgba(240,69,134,0.15)" }} title="Женская коллекция">
                <svg width="14" height="14" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="20" r="12" stroke="currentColor" strokeWidth="3"/><line x1="24" y1="32" x2="24" y2="44" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><line x1="17" y1="38" x2="31" y2="38" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                <span>Для неё</span>
              </button>
              <button onClick={toggleMode} className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold transition-colors" style={{ background: "var(--pm-surface-alt)", border: "1px solid var(--pm-border)", color: "var(--pm-text-body)" }} title={mode === "light" ? "Переключить на тёмную тему" : "Переключить на светлую тему"}>
                {mode === "light" ? <><Moon size={13} /><span>Тёмная</span></> : <><Sun size={13} /><span>Светлая</span></>}
              </button>
            </>
          )}
          <a href="https://t.me/V_Limerence" target="_blank" rel="noreferrer" className="btn-glow bg-primary hover:bg-[var(--pm-primary-hover)] text-white px-6 py-2.5 rounded-full font-semibold text-sm" data-testid="button-nav-contact">Написать мне</a>
        </nav>
        <div className="md:hidden flex items-center gap-2">
          {gender === "female" && (
            <button onClick={() => setGender("male")} className="p-2 rounded-lg text-[17px] transition-colors" style={{ color: "#0074c4", background: "rgba(0,100,190,0.08)", border: "1px solid rgba(0,100,190,0.18)" }} aria-label="Мужская коллекция">
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none"><circle cx="20" cy="28" r="12" stroke="currentColor" strokeWidth="3"/><line x1="29.5" y1="18.5" x2="42" y2="6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><polyline points="33,6 42,6 42,15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
            </button>
          )}
          {gender === "male" && (
            <>
              <button onClick={() => setGender("female")} className="p-2 rounded-lg text-[17px] transition-colors" style={{ color: "#f04586", background: "rgba(240,69,134,0.08)", border: "1px solid rgba(240,69,134,0.18)" }} aria-label="Женская коллекция">
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="20" r="12" stroke="currentColor" strokeWidth="3"/><line x1="24" y1="32" x2="24" y2="44" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><line x1="17" y1="38" x2="31" y2="38" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
              </button>
              <button onClick={toggleMode} className="p-2 rounded-lg transition-colors" style={{ color: "var(--pm-primary)", background: "var(--pm-primary-bg)", border: "1px solid var(--pm-primary-border)" }} aria-label={mode === "light" ? "Тёмная тема" : "Светлая тема"}>
                {mode === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </>
          )}
          <button className="p-2 text-primary" onClick={() => setMobileOpen(true)} aria-label="Открыть меню" data-testid="button-mobile-menu"><Menu size={28} /></button>
        </div>
      </header>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div key="panel" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed top-0 right-0 bottom-0 z-[70] w-[300px] sm:w-[340px] flex flex-col" style={{ background: "linear-gradient(160deg, var(--pm-surface) 0%, var(--pm-bg-page) 100%)", borderLeft: "1px solid var(--pm-primary-border)", boxShadow: "-8px 0 48px color-mix(in srgb, var(--pm-primary) 12%, transparent)" }}>
              <div className="flex items-center justify-between px-7 pt-7 pb-6" style={{ borderBottom: "1px solid color-mix(in srgb, var(--pm-primary) 15%, transparent)" }}>
                <a href="/" className="no-underline cursor-pointer" onClick={() => setMobileOpen(false)}><LogoWord /></a>
                <button onClick={() => setMobileOpen(false)} className="w-9 h-9 rounded-full text-primary flex items-center justify-center transition-colors" style={{ background: "var(--pm-surface-alt, rgba(255,255,255,0.6))" }} aria-label="Закрыть меню"><X size={20} /></button>
              </div>
              <div className="flex flex-col gap-1 px-5 pt-6 flex-1">
                {navLinks.map((link, i) => (
                  <motion.a key={link.name} href={link.href} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.07 }} onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { setMobileOpen(false); handleNavClick(e, link.href); }} className="flex items-center gap-3 px-4 py-4 rounded-2xl font-serif text-[20px] font-bold text-foreground hover:text-primary hover:bg-[var(--pm-primary-bg)] transition-all">
                    <span className="text-primary text-sm">✦</span>{link.name}
                  </motion.a>
                ))}
                {gender === "female" && (
                  <>
                    <motion.a href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661" target="_blank" rel="noreferrer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + navLinks.length * 0.07 }} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-4 rounded-2xl font-serif text-[20px] font-bold text-muted-foreground hover:text-primary hover:bg-[var(--pm-primary-bg)] transition-all">
                      <img src="https://www.avito.ru/favicon.ico" width={18} height={18} alt="" aria-hidden="true" className="shrink-0" />Авито
                    </motion.a>
                    <motion.a href="https://tinyurl.com/5h4bbmkr" target="_blank" rel="noreferrer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + navLinks.length * 0.07 + 0.07 }} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-4 rounded-2xl font-serif text-[20px] font-bold text-muted-foreground hover:text-primary hover:bg-[var(--pm-primary-bg)] transition-all">
                      <img src="https://max.ru/favicon.ico" width={18} height={18} alt="" aria-hidden="true" className="shrink-0" />MAX
                    </motion.a>
                  </>
                )}
                <div className="mt-4 flex flex-col gap-2 px-1">
                  {gender === "female" ? (
                    <button onClick={() => { setGender("male"); setMobileOpen(false); }} className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-[15px] font-semibold text-left transition-colors" style={{ color: "#0074c4", background: "rgba(0,100,190,0.06)", border: "1px solid rgba(0,100,190,0.15)" }}>
                      <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><circle cx="20" cy="28" r="12" stroke="currentColor" strokeWidth="3"/><line x1="29.5" y1="18.5" x2="42" y2="6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><polyline points="33,6 42,6 42,15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                      Переключиться на мужскую тему
                    </button>
                  ) : (
                    <>
                      <button onClick={() => { setGender("female"); setMobileOpen(false); }} className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-[15px] font-semibold text-left transition-colors" style={{ color: "#f04586", background: "rgba(240,69,134,0.06)", border: "1px solid rgba(240,69,134,0.15)" }}>
                        <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="20" r="12" stroke="currentColor" strokeWidth="3"/><line x1="24" y1="32" x2="24" y2="44" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><line x1="17" y1="38" x2="31" y2="38" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                        Переключиться на женскую тему
                      </button>
                      <button onClick={() => { toggleMode(); setMobileOpen(false); }} className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-[15px] font-semibold text-left transition-colors" style={{ background: "var(--pm-surface-alt)", border: "1px solid var(--pm-border)", color: "var(--pm-text-body)" }}>
                        <span>{mode === "light" ? "☽" : "☀"}</span>{mode === "light" ? "Тёмная тема" : "Светлая тема"}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="px-7 pb-10 pt-4" style={{ borderTop: "1px solid color-mix(in srgb, var(--pm-primary) 15%, transparent)" }}>
                <a href="https://t.me/V_Limerence" target="_blank" rel="noreferrer" onClick={() => setMobileOpen(false)} className="btn-glow-strong block w-full bg-primary text-white px-6 py-4 rounded-2xl font-bold text-center text-[16px] tracking-wide">Написать мне ✈️</a>
                <p className="font-script text-[14px] text-center mt-3" style={{ color: "var(--pm-primary)" }}>на связи 24/7 💕</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Footer ───────────────────────────────────────────────────────
export function Footer() {
  const { gender } = useTheme();
  const isMale = gender === "male";
  return (
    <footer className={`py-10 px-6 text-center ${isMale ? "footer-male-light" : ""}`} style={{ background: isMale ? undefined : "hsl(var(--foreground))" }}>
      <div className="text-xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
        <span style={{ color: "var(--pm-primary)" }}>Pick</span>
        <span className="text-[24px] font-semibold" style={{ color: "var(--pm-primary)", fontFamily: "'Caveat', cursive" }}>Me</span>
        <span style={{ color: isMale ? "var(--pm-text-muted)" : "var(--pm-primary)" }}> Store</span>
      </div>
      <p className="text-[10px] font-sans mb-4" style={{ color: isMale ? "var(--pm-text-muted)" : "color-mix(in srgb, var(--pm-primary) 35%, transparent)" }}>ПикМи — магазин брендовых вещей</p>
      <div className="flex items-center justify-center gap-6 mb-4">
        <a href="https://t.me/V_Limerence" target="_blank" rel="noreferrer" className="text-[13px] hover:text-white transition-colors font-semibold" style={{ color: "var(--pm-primary)" }}>Telegram</a>
        <span style={{ color: "color-mix(in srgb, var(--pm-primary) 30%, transparent)" }}>·</span>
        <a href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661" target="_blank" rel="noreferrer" className="text-[13px] hover:text-white transition-colors font-semibold flex items-center gap-1.5" style={{ color: "var(--pm-primary)" }}>
          <span className="inline-flex w-4 h-4 rounded-full text-[9px] font-black items-center justify-center" style={{ background: "color-mix(in srgb, var(--pm-primary) 20%, transparent)", color: "var(--pm-primary)" }}>A</span>Авито
        </a>
        <span style={{ color: "color-mix(in srgb, var(--pm-primary) 30%, transparent)" }}>·</span>
        <a href="https://tinyurl.com/5h4bbmkr" target="_blank" rel="noreferrer" className="text-[13px] hover:text-white transition-colors font-semibold flex items-center gap-1.5" style={{ color: "var(--pm-primary)" }}>
          <img src="https://max.ru/favicon.ico" width={16} height={16} alt="" aria-hidden="true" className="shrink-0" />MAX
        </a>
      </div>
      <p className="text-[13px] text-muted-foreground/65">© 2026 · Оригинальные бренды с любовью · Доставка по всей России</p>
    </footer>
  );
}

// ─── Loading spinner ──────────────────────────────────────────────
export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--pm-bg-page, #fff)" }}>
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Загрузка...</p>
      </div>
    </div>
  );
}
