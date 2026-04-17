import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useProductsFetch, applyDefaultSort, ProductCard, CompactCard, Header, Footer, PAGE_SIZE } from "@/shared";

// -- Category Scroll Sections (mobile home page, each section fetches own data) --
const CAT_SCROLL_ORDER = [
  { id: "shoes", label: "Обувь" },
  { id: "tops", label: "Верх" },
  { id: "bottoms", label: "Низ" },
  { id: "accessories", label: "Аксессуары" },
] as const;

function CategoryScrollSection({ catId, label, genderParam }: { catId: string; label: string; genderParam: string }) {
  const { data: products } = useProductsFetch({ category: catId, gender: genderParam, random: true, limit: 8 });
  const items = React.useMemo(() => {
    if (!products) return [];
    return (products as Array<{ id: number; brand: string; name: string; price: number; badge?: string | null; imageUrl: string; imageUrls?: string[]; category: string; createdAt: string }>)
      .filter(p => p.badge !== "sold" && p.badge !== "reserved");
  }, [products]);
  if (!items || items.length < 2) return null;
  return (
    <div className="cat-scroll-block" style={{ background: "var(--pm-surface-alt)", borderRadius: 16, padding: 16, margin: "0 12px 12px", transition: "background 0.3s ease", border: "1px solid color-mix(in srgb, var(--pm-border) 30%, transparent)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 4, height: 20, background: "var(--pm-primary)", borderRadius: 2, flexShrink: 0, transition: "background 0.3s ease" }} />
          <h3 style={{ fontSize: 17, fontWeight: 500, color: "var(--pm-text-heading)", margin: 0, transition: "color 0.3s ease" }}>{label}</h3>
        </div>
        <a href={`/catalog?category=${catId}`} style={{ fontSize: 12, fontWeight: 600, color: "var(--pm-primary)", textDecoration: "none", transition: "color 0.3s ease" }}>Смотреть все →</a>
      </div>
      <div className="[&::-webkit-scrollbar]:hidden" style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", gap: 8, paddingBottom: 4, scrollbarWidth: "none" } as React.CSSProperties}>
        {items.map(p => (
          <div key={p.id} style={{ minWidth: 140, maxWidth: 150, flexShrink: 0, scrollSnapAlign: "start", border: "0.5px solid var(--pm-border)", borderRadius: 12, overflow: "hidden" }}>
            <CompactCard product={p} />
          </div>
        ))}
        <a href={`/catalog?category=${catId}`} style={{ minWidth: 56, flexShrink: 0, scrollSnapAlign: "start", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--pm-surface)", border: "1.5px solid var(--pm-primary-border)", borderRadius: 12, color: "var(--pm-primary)", fontSize: 22, fontWeight: 700, textDecoration: "none", transition: "background 0.3s ease, color 0.3s ease, border-color 0.3s ease" }}>→</a>
      </div>
    </div>
  );
}

function CategoryScrollSections({ genderParam }: { genderParam: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {CAT_SCROLL_ORDER.map(({ id, label }) => (
        <CategoryScrollSection key={`${id}-${genderParam}`} catId={id} label={label} genderParam={genderParam} />
      ))}
    </div>
  );
}

// -- Full Catalog Page --
export default function CatalogPage() {
  const { gender: themeGender, mode } = useTheme();
  const [filter, setFilter] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    const valid = ["shoes", "tops", "bottoms", "accessories", "supplements"];
    return cat && valid.includes(cat) ? cat : "all";
  });
  const [genderFilter, setGenderFilter] = useState<"all" | "women" | "men">(() =>
    themeGender === "female" ? "women" : themeGender === "male" ? "men" : "all"
  );
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"default" | "newest" | "price_asc" | "price_desc">("default");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [hideSold, setHideSold] = useState(false);
  const [giftOnly, setGiftOnly] = useState(() => new URLSearchParams(window.location.search).get("gift") === "true");

  // Sync genderFilter when theme gender changes
  React.useEffect(() => {
    setGenderFilter(themeGender === "female" ? "women" : themeGender === "male" ? "men" : "all");
  }, [themeGender]);

  const queryParam = filter !== "all" ? filter : undefined;
  const genderQueryParam = genderFilter !== "all" ? genderFilter : undefined;
  const { data: allProducts, isLoading } = useProductsFetch({
    category: queryParam,
    gender: giftOnly ? "women" : genderQueryParam,
    featured: giftOnly || undefined,
  });

  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, genderFilter, search, sort, hideSold, giftOnly]);

  const categories = [
    { id: "all", label: "Все" },
    { id: "shoes", label: "Обувь" },
    { id: "tops", label: "Верх" },
    { id: "bottoms", label: "Низ" },
    { id: "accessories", label: "Аксессуары" },
    { id: "supplements", label: "БАД" },
  ];

  type CatalogProduct = { id: number; brand: string; name: string; price: number; badge?: string | null; imageUrl: string; imageUrls?: string[]; category: string; createdAt: string; gender?: string | null; sortOrder?: number | null; telegramUrl?: string; avitoLink?: string | null; caption?: string | null; published?: boolean; size?: string };
  const products = (allProducts ?? []) as CatalogProduct[];

  const filtered = React.useMemo(() => {
    if (!products) return [];
    let list = [...products];
    if (hideSold) list = list.filter(p => p.badge !== "sold");
    if (genderFilter === "women") list = list.filter(p => p.gender === "women" || p.gender === "unisex");
    else if (genderFilter === "men") list = list.filter(p => p.gender === "men" || p.gender === "unisex");
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.brand.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
    }
    if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "newest") list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else list = applyDefaultSort(list);
    return list;
  }, [products, genderFilter, search, sort, hideSold]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(v => v + PAGE_SIZE);
            setIsLoadingMore(false);
          }, 400);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  return (
    <>
      <Header />
      <main className="page-gradient min-h-screen">
        <section className="pt-28 pb-16 px-6">
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-10">
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-3">Каталог</h1>
              {themeGender === "female" && <p className="font-script text-2xl" style={{ color: "var(--pm-primary)" }}>весь мой гардероб — выбирай своё ✨</p>}
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск по бренду или названию..."
                  className="w-full px-5 py-3 rounded-full border-2 focus:outline-none font-sans text-sm text-foreground placeholder:text-muted-foreground"
                  style={{ background: "var(--pm-surface)", borderColor: "var(--pm-border)" }}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--pm-primary)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--pm-border)"}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                  >
                    ✕
                  </button>
                )}
              </div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as typeof sort)}
                className="px-5 py-3 rounded-full border-2 focus:outline-none font-sans text-sm cursor-pointer text-foreground"
                style={{ background: "var(--pm-surface)", borderColor: "var(--pm-border)" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--pm-primary)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--pm-border)"}
              >
                <option value="default">По умолчанию</option>
                <option value="newest">Новинки</option>
                <option value="price_asc">Цена ↑</option>
                <option value="price_desc">Цена ↓</option>
              </select>
            </div>

            {/* Gender filter */}
            <div className="flex justify-center gap-2 mb-4">
              {([
                { id: "all", label: "Все" },
                { id: "women", label: "♀ Женское" },
                { id: "men", label: "♂ Мужское" },
              ] as { id: "all" | "women" | "men"; label: string }[]).map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGenderFilter(g.id)}
                  className={`px-5 py-2 rounded-full font-sans text-sm font-bold transition-all border-2 ${
                    genderFilter === g.id
                      ? "bg-primary border-primary text-white shadow-md"
                      : "catalog-filter-btn bg-transparent border-secondary text-muted-foreground hover:border-[var(--pm-primary)] hover:text-primary"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Category filter + hide sold */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilter(c.id)}
                  className={`px-6 py-2.5 rounded-full font-sans text-sm font-bold transition-all border-2 ${
                    filter === c.id
                      ? "bg-primary border-primary text-white shadow-md"
                      : "catalog-filter-btn bg-transparent border-secondary text-muted-foreground hover:border-[var(--pm-primary)] hover:text-primary"
                  }`}
                >
                  {c.label}
                </button>
              ))}
              <button
                onClick={() => setHideSold(v => !v)}
                className={`px-6 py-2.5 rounded-full font-sans text-sm font-bold transition-all border-2 flex items-center gap-2 ${
                  hideSold
                    ? "bg-foreground border-foreground text-white shadow-md"
                    : "catalog-filter-btn bg-transparent border-secondary text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                <span className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-all ${hideSold ? "border-background bg-background" : "border-current"}`}>
                  {hideSold && <span className="text-foreground text-[10px] font-black leading-none">✓</span>}
                </span>
                Скрыть проданные
              </button>
              {themeGender === "male" && (
                <button
                  onClick={() => setGiftOnly(v => !v)}
                  className={`px-6 py-2.5 rounded-full font-sans text-sm font-bold transition-all border-2 flex items-center gap-2 ${
                    giftOnly
                      ? "text-white shadow-md"
                      : "catalog-filter-btn bg-transparent text-muted-foreground hover:text-primary"
                  }`}
                  style={giftOnly
                    ? { background: "var(--pm-gift-accent, var(--pm-primary))", borderColor: "var(--pm-gift-accent, var(--pm-primary))" }
                    : { borderColor: "var(--pm-gift-border, var(--pm-primary-border))", color: "var(--pm-gift-accent, var(--pm-primary))" }
                  }
                >
                  🎁 Подарок для неё
                </button>
              )}
            </div>

            {giftOnly && themeGender === "male" && (
              <div className="mb-4 text-center relative py-3">
                {mode === "dark" && (
                  <div className="absolute inset-[-30%] pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 50% at 50% 50%, color-mix(in srgb, var(--pm-gift-accent, var(--pm-primary)) 25%, transparent), transparent 70%)" }} />
                )}
                <p className={`relative text-[16px] md:text-[18px] mx-auto whitespace-nowrap ${mode === "light" ? "gift-pill" : ""}`} style={{ color: "var(--pm-text-body)", lineHeight: 1.7 }}>
                  ✨ Открываю от сердца самые популярные и любимые женские позиции ✨
                </p>
              </div>
            )}

            {isLoading ? (
              <>
                {/* Mobile loading */}
                <div className="md:hidden grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-primary/10 animate-pulse" style={{ background: "var(--pm-card-bg, #fff)" }}>
                      <div className="w-full aspect-square bg-secondary/50" />
                      <div className="p-2">
                        <div className="h-2.5 w-12 bg-secondary rounded mb-1" />
                        <div className="h-3.5 w-3/4 bg-secondary rounded mb-2" />
                        <div className="h-3 w-1/3 bg-secondary rounded" />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop loading */}
                <div className="hidden md:grid grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-2xl overflow-hidden border border-primary/10 animate-pulse" style={{ background: "var(--pm-card-bg, #fff)" }}>
                      <div className="w-full aspect-[3/4] bg-secondary/50" />
                      <div className="p-5">
                        <div className="h-3 w-16 bg-secondary rounded mb-2" />
                        <div className="h-5 w-3/4 bg-secondary rounded mb-2" />
                        <div className="h-4 w-1/4 bg-secondary rounded mb-4" />
                        <div className="flex justify-between items-center">
                          <div className="h-6 w-20 bg-secondary rounded" />
                          <div className="h-10 w-10 bg-secondary rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : filtered.length > 0 ? (
              <>
                {/* Mobile: 2-col compact grid */}
                <div className="md:hidden grid grid-cols-2 gap-2">
                  {visible.map((product) => (
                    <CompactCard key={product.id} product={product} />
                  ))}
                </div>
                {/* Desktop: 4-col full cards */}
                <div className="hidden md:grid grid-cols-4 gap-6">
                  {visible.map((product) => (
                    <ProductCard key={product.id} product={product as any} />
                  ))}
                </div>
                <div ref={sentinelRef} className="h-1" />
                {isLoadingMore && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </>
            ) : filter === "supplements" ? (
              <div className="w-full py-6" style={{ animation: "fadeIn 0.5s ease-out" }}>
                <div className="w-full rounded-3xl overflow-hidden flex flex-col md:flex-row"
                  style={{ boxShadow: "0 8px 40px rgba(247,109,165,0.2), 0 2px 12px rgba(247,109,165,0.12)", border: "1.5px solid rgba(247,109,165,0.3)", minHeight: 280 }}>
                  {/* Image */}
                  <div className="md:w-1/2 w-full flex-shrink-0" style={{ minHeight: 240 }}>
                    <picture>
                      <source srcSet="/bad-detective.webp" type="image/webp" />
                      <img
                        src="/bad-detective.png"
                        alt="Детектив ищет БАДы"
                        loading="lazy"
                        decoding="async"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", minHeight: 240 }}
                      />
                    </picture>
                  </div>
                  {/* Text */}
                  <div className="md:w-1/2 w-full flex items-center justify-center p-8 md:p-10"
                    style={{ background: "linear-gradient(135deg, rgba(255,230,241,0.92) 0%, rgba(255,248,252,0.95) 100%)", backdropFilter: "blur(12px)" }}>
                    <div className="text-center md:text-left">
                      <h3 className="font-display font-bold text-primary mb-4" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", lineHeight: 1.15 }}>
                        Кто-то похитил все БАДы!
                      </h3>
                      <p className="font-sans text-muted-foreground leading-relaxed" style={{ fontSize: "0.95rem" }}>
                        Но я делаю всё возможное,<br className="hidden md:block" /> чтобы скорее их вернуть 💪
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 text-muted-foreground font-medium">
                <p className="text-lg">Ничего не найдено. Попробуй другой запрос!</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
