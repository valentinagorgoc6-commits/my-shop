import React, { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "@/hooks/use-toast";
import {
  Header, Footer, DecorBar, ProductCard,
  useProductsFetch, trackClick,
  SHOE_SIZE_CHART, matchShoeSizeRow, getVisibleSizeRows,
  type ProductDetail,
} from "@/shared";
import { getImageSrcSet, SIZES_PRODUCT } from "@/lib/image-utils";

// ─── Similar Products ─────────────────────────────────────────────
function SimilarProducts({ currentId, category }: { currentId: number; category: string }) {
  const { gender } = useTheme();
  const genderParam = gender === "female" ? "women" : "men";
  const { data: sameCat } = useProductsFetch({ category, gender: genderParam, random: true });
  const { data: allGender } = useProductsFetch({ gender: genderParam, random: true });

  const similar = React.useMemo(() => {
    const exclude = (p: Record<string, unknown>) => p.id !== currentId && p.badge !== "sold" && p.badge !== "reserved";
    const sameCatAvailable = (sameCat ?? []).filter(exclude);
    const shuffled = [...sameCatAvailable].sort(() => Math.random() - 0.5);
    const result = shuffled.slice(0, 4);
    if (result.length < 4 && allGender) {
      const usedIds = new Set(result.map(p => p.id));
      usedIds.add(currentId);
      const extras = allGender.filter(p => !usedIds.has(p.id) && exclude(p)).sort(() => Math.random() - 0.5);
      result.push(...extras.slice(0, 4 - result.length));
    }
    return result;
  }, [sameCat, allGender, currentId]);

  if (similar.length === 0) return null;

  return (
    <div className="mt-16">
      <div className={`mb-8 text-center ${gender === "male" ? "section-glow" : ""}`}>
        <DecorBar />
        <h2 className="font-serif text-[26px] md:text-[32px] font-bold text-foreground similar-title">Тебе также понравится</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {similar.map(p => (
          <div key={p.id as number} className="h-full">
            <ProductCard product={p as any} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Gift Share Button ────────────────────────────────────────────
function GiftShareButton({ productId, brand, name }: { productId: number; brand: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const tipRef = useRef<HTMLDivElement>(null);
  const giftUrl = `https://pickmestore.ru/gift/${productId}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${brand} ${name} — PickMe Store`, text: "Посмотри, хочу такой подарок!", url: giftUrl });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(giftUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  };

  useEffect(() => {
    if (!tipOpen) return;
    const handler = (e: MouseEvent) => {
      if (tipRef.current && !tipRef.current.contains(e.target as Node)) setTipOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [tipOpen]);

  return (
    <div className="flex items-center gap-2 w-full">
      <button
        onClick={handleShare}
        style={{
          flex: 1, padding: "10px 24px", borderRadius: 12,
          border: "1px solid var(--pm-gift-border)", background: copied ? "var(--pm-gift-bg)" : "transparent",
          color: "var(--pm-gift-accent)", fontSize: 13, fontWeight: 500, cursor: "pointer",
          transition: "background 150ms, transform 150ms",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--pm-gift-bg)", e.currentTarget.style.transform = "translateY(-1px)")}
        onMouseLeave={e => (e.currentTarget.style.background = copied ? "var(--pm-gift-bg)" : "transparent", e.currentTarget.style.transform = "none")}
      >
        {copied ? "Ссылка скопирована ✓" : "Согласовать подарок 🎁"}
      </button>
      <div ref={tipRef} style={{ position: "relative" }}>
        <button
          onClick={() => setTipOpen(v => !v)}
          style={{
            width: 22, height: 22, borderRadius: "50%", border: "1px solid var(--pm-border)",
            color: "var(--pm-text-muted, #9ca3af)", fontSize: 12, display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", background: "transparent", flexShrink: 0,
          }}
          aria-label="Что такое подарочная ссылка?"
        >
          ?
        </button>
        {tipOpen && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 8px)", right: 0, width: 280,
            background: "var(--pm-card-bg)", border: "1px solid var(--pm-border)",
            borderRadius: 12, padding: "12px 16px", fontSize: 12, color: "var(--pm-text-body)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 50, lineHeight: 1.5,
          }}>
            Нажми, чтобы поделиться ссылкой на этот товар. Получатель увидит фото и описание, но цена будет скрыта — удобно, чтобы согласовать подарок.
            <div style={{ position: "absolute", bottom: -5, right: 9, width: 10, height: 10, background: "var(--pm-card-bg)", border: "1px solid var(--pm-border)", transform: "rotate(45deg)", borderTop: "none", borderLeft: "none" }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Product Page ─────────────────────────────────────────────────
function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { gender } = useTheme();
  const isMale = gender === "male";
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [measOpen, setMeasOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const liveDragX = useRef(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHoriz = useRef<boolean | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    setImgIdx(0);
    window.scrollTo(0, 0);
    fetch(`/api/products/${id}`)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((data: ProductDetail) => {
        setProduct(data);
        setLoading(false);
        const imgs: string[] = data.imageUrls && data.imageUrls.length > 0 ? data.imageUrls : data.imageUrl ? [data.imageUrl] : [];
        const imgUrl = imgs[0] ? (imgs[0].startsWith("http") ? imgs[0] : `https://pickmestore.ru${imgs[0]}`) : "";
        const title = `${data.name} ${data.brand} — PickMe Store`;
        const desc = `${data.brand} ${data.name}, размер ${data.size}. Цена ${Number(data.price).toLocaleString("ru-RU")} ₽. Оригинал. Доставка по России`;
        const url = `https://pickmestore.ru/product/${data.id}`;
        document.title = title;
        const setMeta = (name: string, content: string) => {
          let el = document.querySelector(`meta[name="${name}"]`);
          if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
          el.setAttribute("content", content);
        };
        const setOg = (property: string, content: string) => {
          let el = document.querySelector(`meta[property="${property}"]`);
          if (!el) { el = document.createElement("meta"); el.setAttribute("property", property); document.head.appendChild(el); }
          el.setAttribute("content", content);
        };
        setMeta("description", desc);
        setOg("og:title", title);
        setOg("og:description", desc);
        setOg("og:image", imgUrl);
        setOg("og:url", url);
        setOg("og:type", "product");
        setMeta("twitter:card", "summary_large_image");
        trackClick(data.id, "card_view");
      })
      .catch(() => { setLoading(false); setNotFound(true); });
    return () => { document.title = "PickMe Store — брендовые вещи с доставкой"; };
  }, [id]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el || !product) return;
    const imgs: string[] = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [];
    const onStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isHoriz.current = null; liveDragX.current = 0;
      setAnimating(false); setDragX(0);
    };
    const onMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - touchStartY.current;
      if (isHoriz.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) isHoriz.current = Math.abs(dx) >= Math.abs(dy);
      if (isHoriz.current === true && imgs.length > 1) { e.preventDefault(); liveDragX.current = dx; setDragX(dx); }
    };
    const onEnd = () => {
      if (isHoriz.current !== true) { touchStartX.current = null; return; }
      const dx = liveDragX.current;
      setAnimating(true); setDragX(0);
      if (Math.abs(dx) >= 30 && imgs.length > 1) setImgIdx(i => dx < 0 ? (i + 1) % imgs.length : (i - 1 + imgs.length) % imgs.length);
      liveDragX.current = 0; touchStartX.current = null; isHoriz.current = null;
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [product]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="page-gradient min-h-screen pt-32 pb-24 px-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Загружаем товар…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (notFound || !product) {
    return (
      <>
        <Header />
        <main className="page-gradient min-h-screen pt-32 pb-24 px-6 flex flex-col items-center justify-center gap-6">
          <p className="font-serif text-3xl font-bold text-foreground">Товар не найден</p>
          <a href="/catalog" className="btn-glow bg-primary hover:bg-[var(--pm-primary-hover)] text-white px-8 py-3 rounded-full font-bold text-sm">← Назад в каталог</a>
        </main>
        <Footer />
      </>
    );
  }

  const images: string[] = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [];
  const isSold = product.badge === "sold";
  const isReserved = product.badge === "reserved";
  const matchedRow = product.category === "shoes" ? matchShoeSizeRow(product.size) : null;

  const prevImg = (e: React.MouseEvent) => { e.preventDefault(); setAnimating(true); setImgIdx(i => (i - 1 + images.length) % images.length); };
  const nextImg = (e: React.MouseEvent) => { e.preventDefault(); setAnimating(true); setImgIdx(i => (i + 1) % images.length); };

  return (
    <>
      <div className="noise-overlay" aria-hidden="true" />
      <Header />
      <main className="page-gradient min-h-screen pt-24 pb-24 px-6">
        <div className="max-w-[1100px] mx-auto">
          <a href="/catalog" className="back-btn inline-flex items-center gap-1 text-primary font-semibold text-sm mt-6 mb-8 px-6 py-2.5 rounded-full transition-all hover:scale-105">
            ← Назад в каталог
          </a>

          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* ── Photo ── */}
            <div className="w-full md:w-1/2">
              <div
                ref={carouselRef}
                className="relative w-full aspect-[3/4] overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--pm-primary-bg)] to-secondary"
                style={{ touchAction: "pan-y" }}
              >
                {images.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      width: `${images.length * 100}%`,
                      height: "100%",
                      transform: `translateX(calc(${-(imgIdx / images.length) * 100}% + ${dragX}px))`,
                      transition: animating ? "transform 300ms ease-out" : "none",
                      willChange: "transform",
                    }}
                    onTransitionEnd={() => setAnimating(false)}
                  >
                    {images.map((src, i) => (
                      <div key={i} style={{ width: `${100 / images.length}%`, flexShrink: 0, height: "100%", overflow: "hidden" }}>
                        {(() => { const img = getImageSrcSet(src); return (
                          <img src={img.src} srcSet={img.srcSet} sizes={SIZES_PRODUCT} alt={product.name} className="w-full h-full object-cover" loading={i === 0 ? "eager" : "lazy"} decoding={i === 0 ? "auto" : "async"} />
                        ); })()}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl opacity-40">👗</span>
                  </div>
                )}

                {/* ПРОДАНО ribbon */}
                {isSold && (
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                    <div style={{ position: "absolute", top: "44px", left: "-52px", width: "210px", background: "var(--pm-primary)", color: "#fff", textAlign: "center", transform: "rotate(-45deg)", fontSize: "15px", fontWeight: 700, padding: "8px 0", boxShadow: "0 2px 8px rgba(0,0,0,0.22)", letterSpacing: "0.08em" }}>ПРОДАНО</div>
                  </div>
                )}
                {isReserved && (
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                    <div style={{ position: "absolute", top: "44px", left: "-52px", width: "210px", background: "#f97316", color: "#fff", textAlign: "center", transform: "rotate(-45deg)", fontSize: "15px", fontWeight: 700, padding: "8px 0", boxShadow: "0 2px 8px rgba(0,0,0,0.22)", letterSpacing: "0.08em" }}>БРОНЬ</div>
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <button onClick={prevImg}
                      className={isMale
                        ? "absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all opacity-70 hover:opacity-100 hover:scale-110 text-xl font-bold"
                        : "absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-md hover:bg-primary hover:text-white text-xl font-bold transition-colors"}
                      style={isMale ? { zIndex: 10, background: "var(--pm-card-bg)", color: "var(--pm-primary)", border: "1px solid var(--pm-primary-border)" } : { zIndex: 10 }}
                    >‹</button>
                    <button onClick={nextImg}
                      className={isMale
                        ? "absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all opacity-70 hover:opacity-100 hover:scale-110 text-xl font-bold"
                        : "absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-md hover:bg-primary hover:text-white text-xl font-bold transition-colors"}
                      style={isMale ? { zIndex: 10, background: "var(--pm-card-bg)", color: "var(--pm-primary)", border: "1px solid var(--pm-primary-border)" } : { zIndex: 10 }}
                    >›</button>
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2" style={{ zIndex: 10 }}>
                      {images.map((_, i) => (
                        <button key={i} onClick={e => { e.preventDefault(); setAnimating(true); setImgIdx(i); }} className={`rounded-full transition-all ${i === imgIdx ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-white/70"}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Info ── */}
            <div
              className="w-full md:w-1/2 flex flex-col gap-5"
            >
              {/* Brand + badges + Name */}
              <div className={isMale ? "section-glow section-glow-wide" : ""}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-primary">{product.brand}</span>
                  {product.badge === "new" && <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white bg-primary">New</span>}
                  {isSold && <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white" style={{ background: "var(--pm-primary)" }}>Продано</span>}
                  {isReserved && <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white" style={{ background: "#f97316" }}>Забронировано</span>}
                </div>
                <h1 className="font-serif text-[28px] md:text-[36px] font-bold text-foreground leading-tight mt-5">{product.name}</h1>
              </div>

              {/* Caption — space always reserved */}
              <p className="font-script text-[22px] leading-tight -mt-2 min-h-[28px]" style={{ color: "var(--pm-primary)" }}>
                {product.caption ?? ""}
              </p>

              {/* Size */}
              <p className="text-[15px] text-muted-foreground size-label">
                {product.category === "shoes" ? `Длина стельки: ${product.size} см` : `Размер: ${product.size}`}
              </p>

              {/* Size chart — shoes only */}
              {product.category === "shoes" && (
                <div className="rounded-xl overflow-hidden size-chart-block" style={{ border: "1px solid var(--pm-primary-border)" }}>
                  <button
                    type="button"
                    onClick={() => setSizeChartOpen(v => !v)}
                    className="flex items-center gap-2 w-full text-left text-[13px] font-semibold text-primary/80 hover:text-primary transition-colors py-3 px-4 hover:bg-[var(--pm-primary-bg)]"
                  >
                    <span className="text-lg leading-none">📏</span>
                    <span className="flex-1">Таблица размеров</span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: sizeChartOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 220ms ease" }}>
                      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {sizeChartOpen && (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", tableLayout: "fixed" }}>
                      <thead>
                        <tr style={{ background: "var(--pm-primary-bg)" }}>
                          <th style={{ width: "50%", padding: "6px 12px", textAlign: "center", fontWeight: 700, color: "var(--pm-primary)", borderBottom: "1px solid var(--pm-primary-border)" }}>Стелька (см)</th>
                          <th style={{ width: "50%", padding: "6px 12px", textAlign: "center", fontWeight: 700, color: "var(--pm-primary)", borderBottom: "1px solid var(--pm-primary-border)" }}>RU</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getVisibleSizeRows(matchedRow).map(({ row, globalIdx }, i, arr) => {
                          const isMatch = globalIdx === matchedRow;
                          return (
                            <tr key={row.cm} style={{ background: isMatch ? "color-mix(in srgb, var(--pm-primary) 18%, var(--pm-card-bg))" : i % 2 === 0 ? "var(--pm-card-bg)" : "var(--pm-surface-alt)", borderBottom: i < arr.length - 1 ? "1px solid var(--pm-primary-border)" : "none", boxShadow: isMatch ? "inset 3px 0 0 var(--pm-primary)" : "none" }}>
                              <td style={{ padding: "6px 12px", textAlign: "center", fontWeight: isMatch ? 700 : 400, color: isMatch ? "var(--pm-primary)" : "var(--pm-text-body)" }}>{row.cm}</td>
                              <td style={{ padding: "6px 12px", textAlign: "center", fontWeight: isMatch ? 700 : 400, color: isMatch ? "var(--pm-primary)" : "var(--pm-text-body)" }}>
                                {row.ru}{isMatch && <span style={{ marginLeft: 4, fontSize: 10 }}>◀</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Measurements accordion — bottoms only */}
              {product.category === "bottoms" && (() => {
                const rows: { label: string; value: string }[] = [];
                if (product.outerSeam != null) rows.push({ label: "Длина по внешнему шву", value: `${product.outerSeam} см` });
                if (product.innerSeam != null) rows.push({ label: "Длина по внутреннему шву", value: `${product.innerSeam} см` });
                if (product.riseHeight != null) rows.push({ label: "Высота посадки", value: `${product.riseHeight} см` });
                if (product.halfWaist != null) rows.push({ label: "Полуобхват талии", value: `${product.halfWaist} см` });
                if (product.halfHip != null) rows.push({ label: "Полуобхват бёдер", value: `${product.halfHip} см` });
                if (product.halfLegOpening != null) rows.push({ label: "Полуобхват штанины внизу", value: `${product.halfLegOpening} см` });
                if (product.model) rows.push({ label: "Модель", value: product.model });
                if (rows.length === 0) return null;
                return (
                  <div className="rounded-xl overflow-hidden size-chart-block" style={{ border: "1px solid var(--pm-primary-border)" }}>
                    <button
                      type="button"
                      onClick={() => setMeasOpen(v => !v)}
                      className="flex items-center gap-2 w-full text-left text-[13px] font-semibold text-primary/80 hover:text-primary transition-colors py-3 px-4 hover:bg-[var(--pm-primary-bg)]"
                    >
                      <span className="text-lg leading-none">📐</span>
                      <span className="flex-1">Замеры</span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: measOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 220ms ease" }}>
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {measOpen && (
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <tbody>
                          {rows.map(({ label, value }, i) => (
                            <tr key={label} style={{ background: i % 2 === 0 ? "var(--pm-card-bg)" : "var(--pm-surface-alt)", borderBottom: i < rows.length - 1 ? "1px solid var(--pm-primary-border)" : "none" }}>
                              <td style={{ padding: "7px 12px", color: "var(--pm-primary)", fontWeight: 600, width: "60%" }}>{label}</td>
                              <td style={{ padding: "7px 12px", color: "var(--pm-text-body)", textAlign: "right" }}>{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })()}

              {/* Price */}
              <div className={`text-[34px] font-bold ${isSold ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {Number(product.price).toLocaleString("ru-RU")} ₽
              </div>

              {/* Buy button */}
              {isSold ? (
                <button disabled className="w-full py-4 rounded-full bg-secondary text-muted-foreground text-[15px] font-bold cursor-not-allowed">Продано</button>
              ) : isReserved ? (
                <button disabled className="w-full py-4 rounded-full text-[15px] font-bold cursor-not-allowed" style={{ background: "color-mix(in srgb, #f97316 15%, var(--pm-card-bg, #fff))", color: "#f97316" }}>Забронировано</button>
              ) : product.avitoLink ? (
                <a
                  href={product.avitoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-full bg-primary text-white text-[15px] font-bold hover:bg-[var(--pm-primary-hover)] transition-colors flex items-center justify-center gap-2 btn-glow"
                  onClick={() => trackClick(product.id, "avito_click")}
                >
                  <img src="https://www.avito.ru/favicon.ico" width={16} height={16} alt="" aria-hidden="true" />
                  Купить на Авито
                </a>
              ) : (
                <a
                  href={product.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-full bg-primary text-white text-[15px] font-bold hover:bg-[var(--pm-primary-hover)] transition-colors flex items-center justify-center gap-2 btn-glow"
                  onClick={() => trackClick(product.id, "telegram_click")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.01 13.585l-2.94-.918c-.64-.203-.653-.64.136-.954l11.5-4.43c.533-.194 1-.131.818.938z"/>
                  </svg>
                  Написать в Telegram
                </a>
              )}

              {/* Share — always right after buy button */}
              <button
                onClick={() => {
                  const url = `https://pickmestore.ru/product/${product.id}`;
                  navigator.clipboard.writeText(url)
                    .then(() => {
                      toast({ title: "Ссылка скопирована ✓", duration: 2000 });
                    })
                    .catch(() => {
                      toast({ title: "Не удалось скопировать ссылку", duration: 2000 });
                    });
                }}
                className="share-btn w-full py-3 rounded-full border-2 border-primary text-primary text-[14px] font-semibold hover:bg-[var(--pm-primary-bg)] transition-colors flex items-center justify-center gap-2"
              >
                🔗 Поделиться
              </button>

              {/* Gift button — show for women's products in male theme */}
              {isMale && product.gender === "women" && (
                <GiftShareButton productId={product.id} brand={product.brand} name={product.name} />
              )}

              {/* Description — fills all remaining height, always ends at photo bottom */}
              {product.description && (
                <div className="flex-1 min-h-0 overflow-hidden p-5 flex flex-col gap-2 rounded-3xl" style={{ background: "var(--pm-surface)", backdropFilter: "blur(12px)", border: "1px solid var(--pm-primary-border)" }}>
                  <p className="text-[11px] font-bold uppercase tracking-[1.5px] shrink-0" style={{ color: "var(--pm-primary)" }}>О товаре</p>
                  <p className="text-[14px] leading-relaxed whitespace-pre-line overflow-hidden" style={{ color: "var(--pm-text-body)" }}>{product.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Similar products ── */}
          <SimilarProducts currentId={product.id} category={product.category} />
        </div>

        {/* ── CTA block ── */}
        <div className="mt-16">
          <div className={`max-w-[700px] mx-auto relative p-8 md:p-12 text-center ${isMale ? "section-glow section-glow-wide" : ""}`}>
            <div className="absolute inset-[-60%] pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 50% at 50% 50%, color-mix(in srgb, var(--pm-primary) 22%, transparent), transparent 70%)" }} />
            <div className="relative z-10">
            <p className="font-serif text-[30px] md:text-[38px] font-black text-foreground mb-2">Есть вопросы по этому товару?</p>
            <p className={`text-[17px] mb-8 ${isMale ? "product-cta-sub" : "text-muted-foreground"}`}>Пиши мне, отвечу на все вопросы и помогу с выбором</p>
            <div className="flex items-stretch justify-center gap-4 flex-wrap">
              {/* Авито */}
              <a
                href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-[13px] transition-all hover:scale-105 text-white min-w-[120px]"
                style={{ background: "color-mix(in srgb, var(--pm-primary) 35%, transparent)" }}
              >
                <img src="https://www.avito.ru/favicon.ico" width={20} height={20} alt="" aria-hidden="true" className="shrink-0" />
                <span className="leading-snug">Профиль на<br/>Авито</span>
              </a>

              {/* Telegram — центральная, выделена */}
              <a
                href={product.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glow flex items-center gap-3 text-white px-9 py-5 rounded-full font-bold text-[16px] transition-all shadow-lg min-w-[165px]"
                style={{ background: "var(--pm-primary)" }}
                onClick={() => trackClick(product.id, "telegram_click")}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="shrink-0" aria-hidden="true">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.01 13.585l-2.94-.918c-.64-.203-.653-.64.136-.954l11.5-4.43c.533-.194 1-.131.818.938z"/>
                </svg>
                <span className="leading-snug">Написать в<br/>Telegram</span>
              </a>

              {/* MAX */}
              <a
                href="https://tinyurl.com/5h4bbmkr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-[13px] transition-all hover:scale-105 text-white min-w-[120px]"
                style={{ background: "color-mix(in srgb, var(--pm-primary) 35%, transparent)" }}
              >
                <img src="https://max.ru/favicon.ico" width={20} height={20} alt="" aria-hidden="true" className="shrink-0" />
                <span className="leading-snug">Написать в<br/>MAX</span>
              </a>
            </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default ProductPage;
