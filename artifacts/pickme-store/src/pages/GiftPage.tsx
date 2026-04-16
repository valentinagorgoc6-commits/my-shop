import React, { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { Header, Footer, type ProductDetail } from "@/shared";

function GiftPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [measOpen, setMeasOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const liveDragX = useRef(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHoriz = useRef<boolean | null>(null);
  const prevTheme = useRef<string | null>(null);

  // Force female theme without saving to localStorage
  useEffect(() => {
    prevTheme.current = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "female");
    return () => {
      if (prevTheme.current) {
        document.documentElement.setAttribute("data-theme", prevTheme.current);
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true); setNotFound(false); setImgIdx(0);
    window.scrollTo(0, 0);
    fetch(`/api/products/${id}`)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((data: ProductDetail) => {
        setProduct(data); setLoading(false);
        const imgs: string[] = data.imageUrls && data.imageUrls.length > 0 ? data.imageUrls : data.imageUrl ? [data.imageUrl] : [];
        const imgUrl = imgs[0] ? (imgs[0].startsWith("http") ? imgs[0] : `https://pickmestore.ru${imgs[0]}`) : "";
        const title = `${data.brand} ${data.name} — PickMe Store`;
        const desc = "Подарочная ссылка — PickMe Store";
        const url = `https://pickmestore.ru/gift/${data.id}`;
        document.title = title;
        const setOg = (property: string, content: string) => {
          let el = document.querySelector(`meta[property="${property}"]`);
          if (!el) { el = document.createElement("meta"); el.setAttribute("property", property); document.head.appendChild(el); }
          el.setAttribute("content", content);
        };
        setOg("og:title", title);
        setOg("og:description", desc);
        setOg("og:image", imgUrl);
        setOg("og:url", url);
        setOg("og:type", "product");
      })
      .catch(() => { setLoading(false); setNotFound(true); });
    return () => { document.title = "PickMe Store — брендовые вещи с доставкой"; };
  }, [id]);

  // Touch carousel
  useEffect(() => {
    const el = carouselRef.current;
    if (!el || !product) return;
    const imgs: string[] = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [];
    const onStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; isHoriz.current = null; liveDragX.current = 0; setAnimating(false); setDragX(0); };
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
    return () => { el.removeEventListener("touchstart", onStart); el.removeEventListener("touchmove", onMove); el.removeEventListener("touchend", onEnd); el.removeEventListener("touchcancel", onEnd); };
  }, [product]);

  if (loading) {
    return (
      <>
        <div className="noise-overlay" aria-hidden="true" />
        <Header />
        <main className="page-gradient min-h-screen pt-32 pb-24 px-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Загружаем подарок…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (notFound || !product) {
    return (
      <>
        <div className="noise-overlay" aria-hidden="true" />
        <Header />
        <main className="page-gradient min-h-screen pt-32 pb-24 px-6 flex flex-col items-center justify-center gap-4 text-center">
          <span className="text-6xl">💝</span>
          <p className="font-serif text-3xl font-bold text-foreground">Этот подарок уже нашёл своего владельца</p>
          <p className="text-muted-foreground text-[15px] mt-1">Но у нас есть много других прекрасных вещей</p>
          <a href="/" className="mt-4 btn-glow bg-primary hover:bg-[var(--pm-primary-hover)] text-white px-8 py-3 rounded-full font-bold text-sm">На главную</a>
        </main>
        <Footer />
      </>
    );
  }

  const images: string[] = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [];
  const prevImg = (e: React.MouseEvent) => { e.preventDefault(); setAnimating(true); setImgIdx(i => (i - 1 + images.length) % images.length); };
  const nextImg = (e: React.MouseEvent) => { e.preventDefault(); setAnimating(true); setImgIdx(i => (i + 1) % images.length); };

  return (
    <>
      <div className="noise-overlay" aria-hidden="true" />
      <Header />
      <main className="page-gradient min-h-screen pt-24 pb-24 px-6">
        <div className="max-w-[1100px] mx-auto">
          <a href="/" className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:underline mt-6 mb-6 block">
            ← На главную
          </a>

          {/* Gift banner */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--pm-gift-bg)", border: "1px solid var(--pm-gift-border)",
            borderRadius: 12, padding: "8px 16px", fontSize: 13,
            color: "var(--pm-gift-accent)", marginBottom: 24,
          }}>
            🎁 Подарочная ссылка — цена скрыта
          </div>

          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* Photo */}
            <div className="w-full md:w-1/2">
              <div
                ref={carouselRef}
                className="relative w-full aspect-[3/4] overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--pm-primary-bg)] to-secondary"
                style={{ touchAction: "pan-y" }}
              >
                {images.length > 0 ? (
                  <div
                    style={{
                      display: "flex", width: `${images.length * 100}%`, height: "100%",
                      transform: `translateX(calc(${-(imgIdx / images.length) * 100}% + ${dragX}px))`,
                      transition: animating ? "transform 300ms ease-out" : "none", willChange: "transform",
                    }}
                    onTransitionEnd={() => setAnimating(false)}
                  >
                    {images.map((src, i) => (
                      <div key={i} style={{ width: `${100 / images.length}%`, flexShrink: 0, height: "100%", overflow: "hidden" }}>
                        <img src={src} alt={product.name} className="w-full h-full object-cover" loading={i === 0 ? "eager" : "lazy"} decoding={i === 0 ? "auto" : "async"} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center"><span className="text-6xl opacity-40">🎁</span></div>
                )}
                {images.length > 1 && (
                  <>
                    <button onClick={prevImg} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-md hover:bg-primary hover:text-white text-xl font-bold transition-colors" style={{ zIndex: 10 }}>‹</button>
                    <button onClick={nextImg} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-md hover:bg-primary hover:text-white text-xl font-bold transition-colors" style={{ zIndex: 10 }}>›</button>
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2" style={{ zIndex: 10 }}>
                      {images.map((_, i) => (
                        <button key={i} onClick={e => { e.preventDefault(); setAnimating(true); setImgIdx(i); }} className={`rounded-full transition-all ${i === imgIdx ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-white/70"}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="w-full md:w-1/2 md:aspect-[3/4] flex flex-col gap-5 min-h-0">
              <span className="text-[13px] font-bold tracking-[1.5px] uppercase" style={{ color: "var(--pm-gift-accent)" }}>{product.brand}</span>
              <h1 className="font-serif text-[28px] md:text-[36px] font-bold text-foreground leading-tight -mt-2">{product.name}</h1>
              {product.caption && (
                <p className="font-script text-[22px] leading-tight -mt-2" style={{ color: "var(--pm-primary)" }}>{product.caption}</p>
              )}
              <p className="text-[15px] text-muted-foreground size-label">
                {product.category === "shoes" ? `Длина стельки: ${product.size} см` : `Размер: ${product.size}`}
              </p>

              {/* Measurements — bottoms only */}
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
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid color-mix(in srgb, var(--pm-primary) 30%, white)" }}>
                    <button type="button" onClick={() => setMeasOpen(v => !v)} className="flex items-center gap-2 w-full text-left text-[13px] font-semibold text-primary/80 hover:text-primary transition-colors py-3 px-4 hover:bg-[var(--pm-primary-bg)]">
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
                            <tr key={label} style={{ background: i % 2 === 0 ? "#fff" : "color-mix(in srgb, var(--pm-primary) 4%, white)", borderBottom: i < rows.length - 1 ? "1px solid color-mix(in srgb, var(--pm-primary) 15%, white)" : "none" }}>
                              <td style={{ padding: "7px 12px", color: "var(--pm-primary-hover)", fontWeight: 600, width: "60%" }}>{label}</td>
                              <td style={{ padding: "7px 12px", color: "#374151", textAlign: "right" }}>{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })()}

              {/* Description */}
              {product.description && (
                <div className="flex-1 min-h-0 overflow-hidden p-5 flex flex-col gap-2 rounded-3xl" style={{ background: "var(--pm-surface)", backdropFilter: "blur(12px)", border: "1px solid var(--pm-primary-border)" }}>
                  <p className="text-[11px] font-bold uppercase tracking-[1.5px] shrink-0" style={{ color: "var(--pm-primary)" }}>О товаре</p>
                  <p className="text-[14px] leading-relaxed whitespace-pre-line overflow-hidden" style={{ color: "var(--pm-text-body)" }}>{product.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default GiftPage;
