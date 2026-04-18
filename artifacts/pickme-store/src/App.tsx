import React, { useState, useEffect, useRef, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Star, Check, Camera, DollarSign, Clock } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "@/hooks/useInView";
import { useTheme, type ThemeGender } from "@/context/ThemeContext";
import {
  trackPageview, useProductsFetch, themeContent,
  DecorBar, SectionTitle,
  Header, Footer, ProductCard, CompactCard, applyDefaultSort,
  PageLoading,
} from "@/shared";
import { getImageSrcSet, SIZES_CARD } from "@/lib/image-utils";

const CatalogPage = React.lazy(() => import("@/pages/CatalogPage"));
const ProductPage = React.lazy(() => import("@/pages/ProductPage"));
const GiftPage = React.lazy(() => import("@/pages/GiftPage"));
const AdminPage = React.lazy(() => import("@/pages/admin"));

const queryClient = new QueryClient();

// -- Splash Screen (modal popup) --
function SplashScreen({ onSelect }: { onSelect: (g: ThemeGender) => void }) {
  const [leaving, setLeaving] = useState(false);

  const choose = (g: ThemeGender) => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => onSelect(g), 380);
  };

  const close = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => onSelect("female"), 380);
  };

  return (
    <div
      className={`modal-overlay fixed inset-0 z-[1000] flex items-center justify-center p-4 ${leaving ? 'closing' : ''}`}
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      onClick={close}
    >
      <div
        className={`modal-content relative w-[420px] max-w-[90vw] rounded-[20px] p-8 text-center ${leaving ? 'closing' : ''}`}
        style={{ background: "#fff", boxShadow: "0 24px 80px rgba(0,0,0,0.18), 0 4px 20px rgba(0,0,0,0.08)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors duration-150"
          style={{ background: "rgba(0,0,0,0.05)", color: "#999", border: "none" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.1)"; e.currentTarget.style.color = "#555"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.05)"; e.currentTarget.style.color = "#999"; }}
          aria-label="Закрыть"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
        </button>

        <div className="mb-1">
          <span className="font-serif text-[28px] font-bold">
            <span style={{ color: "#f04586" }}>Pick</span>
            <span className="font-script text-[32px] font-semibold" style={{ color: "#f76da5" }}>Me</span>
            <span style={{ color: "#2d1520" }}> Store</span>
          </span>
        </div>
        <p className="font-serif text-[18px] font-semibold mb-1" style={{ color: "#2d1520" }}>
          Добро пожаловать в PickMe Store
        </p>
        <p className="font-script text-[17px] font-medium mb-7" style={{ color: "#b06090" }}>
          Выбери, что тебе интереснее
        </p>

        <div className="flex flex-row gap-4 justify-center items-center">
          <button
            onClick={() => choose("female")}
            disabled={leaving}
            className="flex-1 max-w-[160px] rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 border-2 focus:outline-none active:scale-95"
            style={{
              background: "rgba(240,69,134,0.04)",
              borderColor: "rgba(240,69,134,0.25)",
              boxShadow: "0 4px 16px rgba(240,69,134,0.08)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 36px rgba(240,69,134,0.2)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#f04586";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(240,69,134,0.08)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(240,69,134,0.25)";
            }}
          >
            <div className="flex justify-center mb-3">
              <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="20" r="12" stroke="#f04586" strokeWidth="1.75"/>
                <line x1="24" y1="32" x2="24" y2="44" stroke="#f04586" strokeWidth="1.75" strokeLinecap="round"/>
                <line x1="17" y1="38" x2="31" y2="38" stroke="#f04586" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="font-serif text-[17px] font-bold" style={{ color: "#f04586" }}>Для неё</div>
          </button>

          <button
            onClick={() => choose("male")}
            disabled={leaving}
            className="flex-1 max-w-[160px] rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 border-2 focus:outline-none active:scale-95"
            style={{
              background: "rgba(0,116,196,0.04)",
              borderColor: "rgba(0,116,196,0.25)",
              boxShadow: "0 4px 16px rgba(0,116,196,0.08)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 36px rgba(0,116,196,0.2)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#0074c4";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,116,196,0.08)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,116,196,0.25)";
            }}
          >
            <div className="flex justify-center mb-3">
              <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="28" r="12" stroke="#0074c4" strokeWidth="1.75"/>
                <line x1="29.5" y1="18.5" x2="42" y2="6" stroke="#0074c4" strokeWidth="1.75" strokeLinecap="round"/>
                <polyline points="33,6 42,6 42,15" stroke="#0074c4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <div className="font-serif text-[17px] font-bold" style={{ color: "#0074c4" }}>Для него</div>
          </button>
        </div>

        <p className="mt-6 text-[11px] text-center" style={{ color: "#bbb" }}>
          Переключиться можно в любой момент в меню
        </p>
      </div>
    </div>
  );
}

// -- Hero Section --
function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const badgesY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const { gender } = useTheme();
  const isMale = gender === "male";
  const heroTextInView = useInView();
  useEffect(() => {
    const hero = ref.current;
    if (!hero) return;
    let animating = false;
    let rafId = 0;
    let currentPos = 0;
    let targetPos = 0;

    const lerp = () => {
      currentPos += (targetPos - currentPos) * 0.045;
      if (Math.abs(targetPos - currentPos) < 0.5) {
        currentPos = targetPos;
        window.scrollTo(0, currentPos);
        animating = false;
        return;
      }
      window.scrollTo(0, currentPos);
      rafId = requestAnimationFrame(lerp);
    };

    const onWheel = (e: WheelEvent) => {
      if (window.scrollY > 80 || e.deltaY <= 0) return;
      e.preventDefault();
      if (animating) return;
      const catalog = document.getElementById("catalog");
      if (!catalog) return;
      animating = true;
      currentPos = window.scrollY;
      targetPos = catalog.getBoundingClientRect().top + window.scrollY;
      rafId = requestAnimationFrame(lerp);
    };
    hero.addEventListener("wheel", onWheel, { passive: false });
    return () => { hero.removeEventListener("wheel", onWheel); cancelAnimationFrame(rafId); };
  }, []);

  return (
    <section ref={ref} className={`flex items-center px-6 relative min-h-fit md:min-h-[100dvh] pt-20 pb-4 md:pb-12 ${isMale ? "section-glow section-glow-hero" : "overflow-hidden"}`}>
      <motion.div
        style={{ y: bgY }}
        className="absolute -top-[200px] -right-[200px] w-[700px] h-[700px] pointer-events-none"
        aria-hidden="true"
      >
        <div className="w-full h-full bg-[radial-gradient(circle,rgba(253,228,239,0.8)_0%,transparent_70%)]" style={{ opacity: isMale ? 0 : 1, transition: "opacity 0.4s ease" }} />
      </motion.div>
      <motion.div
        style={{ y: bgY }}
        className="absolute -bottom-[100px] -left-[150px] w-[500px] h-[500px] pointer-events-none"
        aria-hidden="true"
      >
        <div className="w-full h-full bg-[radial-gradient(circle,rgba(254,241,246,0.7)_0%,transparent_70%)]" style={{ opacity: isMale ? 0 : 1, transition: "opacity 0.4s ease" }} />
      </motion.div>

      {/* Dark theme: subtle ambient glow orbs */}
      {isMale && (
        <>
          <div className="ambient-orb absolute top-[10%] right-[5%] w-[400px] h-[400px] pointer-events-none" aria-hidden="true"
            style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--pm-primary) 6%, transparent) 0%, transparent 70%)" }} />
          <div className="ambient-orb absolute bottom-[5%] left-[0%] w-[350px] h-[350px] pointer-events-none" aria-hidden="true"
            style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--pm-primary) 4%, transparent) 0%, transparent 70%)", animationDelay: "4s" }} />
        </>
      )}

      <div className="max-w-6xl mx-auto w-full relative z-10 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div
          ref={heroTextInView.ref}
          className={`animate-fade-up ${heroTextInView.inView ? 'in-view' : ''} text-center md:text-left`}
        >
          {/* Female version */}
          {!isMale && (
            <>
              <div className="inline-block font-script text-[18px] font-medium mb-4 -rotate-2" style={{ color: "var(--pm-primary)" }}>
                {themeContent.female.hero.badge}
              </div>
              <h1 className="font-serif text-[40px] md:text-[64px] font-bold leading-[1.1] text-foreground mb-2">
                {themeContent.female.hero.titleLine1} <em className="italic text-primary">{themeContent.female.hero.titleEm}</em>
              </h1>
              <p className="font-script text-[22px] md:text-[24px] font-medium mb-6" style={{ color: "var(--pm-text-body)" }}>
                {themeContent.female.hero.subtitle}
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground mb-10 max-w-md mx-auto md:mx-0">
                {themeContent.female.hero.body}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <a href="#catalog" className="btn-glow inline-flex items-center justify-center bg-primary hover:bg-[var(--pm-primary-hover)] text-white px-8 py-4 rounded-full font-bold text-base" data-testid="button-hero-catalog">
                  {themeContent.female.hero.ctaPrimary}
                </a>
                <a href="#about" className="inline-flex items-center justify-center bg-transparent border-2 border-secondary hover:border-[var(--pm-primary)] text-muted-foreground hover:text-primary px-7 py-4 rounded-full font-bold text-[15px] transition-all" data-testid="button-hero-about">
                  {themeContent.female.hero.ctaSecondary}
                </a>
              </div>
            </>
          )}

          {/* Male version */}
          {isMale && (
            <>
              <h1 className="font-serif text-[36px] md:text-[58px] font-bold leading-[1.1] text-foreground mb-4">
                {themeContent.male.hero.titleLine1}
                <br />
                <span style={{ color: "var(--pm-primary)" }}>{themeContent.male.hero.titleLine2}</span>
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground mb-8 max-w-md mx-auto md:mx-0">
                {themeContent.male.hero.body}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-8">
                <a href="/catalog" className="btn-glow hidden md:inline-flex items-center justify-center text-white px-8 py-4 rounded-full font-bold text-base" style={{ background: "var(--pm-primary)" }} data-testid="button-hero-catalog">
                  {themeContent.male.hero.ctaPrimary}
                </a>
                <a href="#about" className="about-btn inline-flex items-center justify-center border-2 px-7 py-4 rounded-full font-bold text-[15px] transition-all" style={{ borderColor: "var(--pm-primary)", color: "var(--pm-primary)", background: "color-mix(in srgb, var(--pm-primary) 10%, transparent)" }}>
                  О магазине
                </a>
              </div>
              {/* Badges row */}
              <div className="flex justify-between w-full">
                {[
                  { icon: "✓", label: "Оригинал" },
                  { icon: "₽", label: "Низкие цены" },
                  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, label: "Доставка РФ" },
                ].map((b) => (
                  <div key={b.label} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ border: "1.5px solid var(--pm-primary)", color: "var(--pm-primary)" }}>
                      {b.icon}
                    </div>
                    <span className="text-[12px] font-semibold text-muted-foreground leading-tight">{b.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right side — photo column (both themes) */}
        <motion.div
          style={{ y: badgesY }}
          className="relative mt-12 md:mt-0 hidden md:block"
        >
          {/* Female: single tall photo with floating badges */}
          {!isMale && (
            <>
              <div className="w-full aspect-[3/4] max-w-[440px] mx-auto rounded-3xl relative overflow-hidden" style={{ boxShadow: "0 24px 64px color-mix(in srgb, var(--pm-primary) 18%, transparent), 0 8px 24px rgba(61,32,48,0.08)" }}>
                <img
                  src="/hero-photo-medium.webp"
                  srcSet="/hero-photo-thumb.webp 400w, /hero-photo-medium.webp 800w, /hero-photo-full.webp 1600w"
                  sizes="(max-width: 768px) 100vw, 440px"
                  alt="PickMe Store — модная одежда"
                  className="w-full h-full object-cover object-center"
                  fetchpriority="high"
                />
              </div>
              <span className="absolute top-4 right-0 text-2xl pointer-events-none select-none opacity-70" style={{ color: "var(--pm-primary)" }} aria-hidden="true">✦</span>
              <span className="absolute bottom-24 -right-2 text-xl pointer-events-none select-none opacity-60" style={{ color: "var(--pm-primary)" }} aria-hidden="true">♡</span>
              <span className="absolute top-1/3 -left-2 text-lg pointer-events-none select-none opacity-50" style={{ color: "var(--pm-primary)" }} aria-hidden="true">✿</span>
              <div className="absolute -top-4 -right-4 md:-right-8 glass-card px-7 py-4 rounded-2xl text-base font-bold" style={{ color: "var(--pm-primary-hover)", boxShadow: "0 8px 24px color-mix(in srgb, var(--pm-primary) 22%, transparent)" }}>
                💯 Только оригиналы
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-10 glass-card px-7 py-4 rounded-2xl text-base font-bold" style={{ color: "var(--pm-primary-hover)", boxShadow: "0 8px 24px color-mix(in srgb, var(--pm-primary) 22%, transparent)" }}>
                Живые фото 📸
              </div>
              <div className="absolute bottom-8 -right-4 md:-right-8 glass-card px-7 py-4 rounded-2xl text-base font-bold" style={{ color: "var(--pm-primary-hover)", boxShadow: "0 8px 24px color-mix(in srgb, var(--pm-primary) 22%, transparent)" }}>
                Низкие цены 💰
              </div>
            </>
          )}

          {/* Male: same photo, badges in male style */}
          {isMale && (
            <>
              <div className="w-full aspect-[3/4] max-w-[440px] mx-auto rounded-3xl relative overflow-hidden" style={{ boxShadow: "0 24px 48px rgba(0,0,0,0.32), 0 8px 20px rgba(0,0,0,0.18)", border: "1px solid var(--pm-primary-border)" }}>
                <img
                  src="/hero-photo-male-medium.webp"
                  srcSet="/hero-photo-male-thumb.webp 400w, /hero-photo-male-medium.webp 800w, /hero-photo-male-full.webp 1600w"
                  sizes="(max-width: 768px) 100vw, 440px"
                  alt="PickMe Store"
                  className="w-full h-full object-cover object-center"
                  fetchpriority="high"
                />
              </div>

              {/* Floating badges — male style: glass with blur, static */}
              <div
                className="absolute -top-4 -right-4 md:-right-8 px-5 py-3 rounded-2xl text-[13px] font-bold"
                style={{ background: "color-mix(in srgb, var(--pm-card-bg) 75%, transparent)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid var(--pm-primary-border)", color: "var(--pm-primary)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
              >
                ✓ Только оригиналы
              </div>
              <div
                className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-10 px-5 py-3 rounded-2xl text-[13px] font-bold"
                style={{ background: "color-mix(in srgb, var(--pm-card-bg) 75%, transparent)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid var(--pm-primary-border)", color: "var(--pm-primary)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
              >
                До −70% от розницы
              </div>
              <div
                className="absolute bottom-8 -right-4 md:-right-8 px-5 py-3 rounded-2xl text-[13px] font-bold"
                style={{ background: "color-mix(in srgb, var(--pm-card-bg) 75%, transparent)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid var(--pm-primary-border)", color: "var(--pm-primary)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
              >
                Доставка по России
              </div>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// -- Why PickMe Section --
function WhyPickMe() {
  const { gender } = useTheme();
  const isMale = gender === "male";
  const { ref, inView } = useInView();
  if (isMale) return null;
  const features = isMale ? [
    { icon: <Check className="text-primary w-8 h-8" />, title: "Только оригиналы", desc: "Гарантия подлинности на каждый товар" },
    { icon: <Camera className="text-primary w-8 h-8" />, title: "Живые фото", desc: "Реальные фото с замерами — без фотошопа" },
    { icon: <DollarSign className="text-primary w-8 h-8" />, title: "Цены 3 500 – 8 000 ₽", desc: "До −70% от розницы: со склада напрямую" },
    { icon: <Clock className="text-primary w-8 h-8" />, title: "На связи 24/7", desc: "Оперативно отвечаю на все вопросы" },
  ] : [
    { icon: <Check className="text-primary w-8 h-8" />, title: "Только оригиналы", desc: "Оставь страх фразы \"поясни за шмот\" в 2к16" },
    { icon: <Camera className="text-primary w-8 h-8" />, title: "Живые фото", desc: "Мне было мало соцсетей — теперь все вещи в PickMe Store тоже с моими фото" },
    { icon: <DollarSign className="text-primary w-8 h-8" />, title: "Цены 3 500 – 8 000 ₽", desc: "Масику не обязательно знать о нашей тайне 🤫" },
    { icon: <Clock className="text-primary w-8 h-8" />, title: "На связи 24/7", desc: "Отвечу быстрее, чем турок пришлёт огонёк на твою новую сторис" },
  ];

  // Custom title with branded PickMe styling
  const whyTitle = (
    <>
      Почему{" "}
      <span style={{ color: "var(--pm-primary-hover)" }}>Pick</span>
      <span style={{ fontFamily: "var(--pm-font-accent, 'Caveat', cursive)", color: "var(--pm-primary)", fontWeight: 500, fontSize: "1.1em" }}>Me</span>?
    </>
  );

  return (
    <section className="pt-8 pb-6 md:py-14 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionTitle titleNode={whyTitle} sub={isMale ? undefined : "мы не такие, мы особенные 💅"} />

        <div
          ref={ref}
          className={`animate-fade-up-stagger ${inView ? 'in-view' : ''} grid grid-cols-2 gap-4 md:gap-6`}
        >
          {features.map((f, i) => (
            <div
              key={i}
              style={{ '--stagger-index': i, border: "1px solid var(--pm-primary-border)" } as React.CSSProperties}
              className="why-card-hover glass-card rounded-2xl md:rounded-3xl p-5 md:p-8 relative overflow-hidden flex flex-col items-center text-center group"
            >
              <div className="why-card-glow absolute -top-[30px] left-1/2 -translate-x-1/2 w-[160px] h-[160px] pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--pm-primary) 18%, transparent) 0%, transparent 70%)" }} />
              <div className="w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-3 md:mb-5" style={{ border: "1.5px solid var(--pm-primary-border)", background: "color-mix(in srgb, var(--pm-primary) 6%, transparent)" }}>
                <span className="[&>svg]:w-5 [&>svg]:h-5 md:[&>svg]:w-7 md:[&>svg]:h-7">{f.icon}</span>
              </div>
              <h3 className="font-serif text-[15px] md:text-[20px] font-bold text-foreground leading-tight mb-1 md:mb-2">{f.title}</h3>
              <p className="hidden md:block text-[14px] leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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

// -- Catalog Section (landing page — category scroll on mobile, featured grid on desktop) --
function Catalog() {
  const { gender } = useTheme();
  const genderParam = gender === "female" ? "women" : "men";
  const { data: featuredProducts, isLoading: featuredLoading } = useProductsFetch({ featured: true, gender: genderParam });
  const featured = featuredProducts
    ? applyDefaultSort(featuredProducts as Array<Record<string, unknown> & { badge?: string | null; sortOrder?: number | null; category: string }>).slice(0, 6)
    : [];
  const { ref: catalogRef, inView: catalogInView } = useInView();

  return (
    <section id="catalog" className={`pt-8 pb-6 md:pt-24 md:pb-14 ${gender === "male" ? "section-glow section-glow-soft" : ""}`}>
      <div className="max-w-[1100px] mx-auto">
        {/* Desktop: full section title */}
        <div className={`hidden md:block px-6 ${gender === "male" ? "section-glow" : ""}`}>
          <SectionTitle title="Каталог" sub={gender === "female" ? "тут все мои сокровища 🛍️" : undefined} />
        </div>

        {/* Mobile: subtitle + CTA + category sections */}
        <div className="md:hidden">
          <div className={`text-center mb-5 px-6 ${gender === "male" ? "section-glow" : ""}`}>
            <DecorBar />
            {gender === "female" && <p className="font-script text-[30px] font-medium text-foreground mt-2 leading-tight whitespace-nowrap">Тут все мои сокровища 🛍️</p>}
            <a
              href="/catalog"
              className="inline-block mt-4 w-[80%] py-4 rounded-full font-bold text-white text-base text-center transition-all"
              style={{ background: "var(--pm-primary)", boxShadow: "0 4px 20px color-mix(in srgb, var(--pm-primary) 45%, transparent)" }}
            >
              Смотреть весь каталог
            </a>
          </div>
          <CategoryScrollSections genderParam={genderParam} />
        </div>

        {/* Desktop: featured grid */}
        <div className="hidden md:block px-6">
          {featuredLoading ? (
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
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
          ) : featured.length > 0 ? (
            <div
              ref={catalogRef}
              className={`animate-fade-up-stagger ${catalogInView ? 'in-view' : ''} grid grid-cols-3 gap-6`}
            >
              {(featured as Parameters<typeof ProductCard>[0]["product"][]).map((product, i) => (
                <div key={(product as {id: number}).id} style={{ '--stagger-index': i } as React.CSSProperties} className="h-full">
                  <ProductCard product={product as Parameters<typeof ProductCard>[0]["product"]} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground font-medium">
              <p>Скоро здесь появятся товары. Загляни позже!</p>
            </div>
          )}
          <div className="flex justify-center mt-8">
            <a
              href="/catalog"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full border-2 border-primary text-primary font-bold text-base hover:bg-primary hover:text-white transition-all"
            >
              Смотреть весь ассортимент →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// -- About Section --
function About() {
  const { gender } = useTheme();
  const c = gender === "male" ? themeContent.male.about : themeContent.female.about;
  const { ref: aboutLeftRef, inView: aboutLeftInView } = useInView();
  const { ref: aboutRightRef, inView: aboutRightInView } = useInView();

  return (
    <section id="about" className={`py-4 px-4 md:py-14 md:px-6 ${gender === "male" ? "section-glow" : ""}`}>
      <div className="max-w-[900px] mx-auto grid md:grid-cols-[300px_1fr] gap-6 md:gap-16 items-center">
        <div
          ref={aboutLeftRef}
          className={`animate-fade-up ${aboutLeftInView ? 'in-view' : ''} w-full max-w-[280px] mx-auto md:max-w-none`}
        >
          <div className="about-photo-frame w-full aspect-[9/16] rounded-3xl overflow-hidden">
            <img
              src="/about-photo.jpg"
              alt="Валентинка — основательница PickMe Store"
              className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
            />
          </div>
        </div>

        <div
          ref={aboutRightRef}
          className={`animate-fade-up ${aboutRightInView ? 'in-view' : ''}`}
        >
          <DecorBar align="responsive" />
          {c.label && (
            <p className="text-[11px] font-bold uppercase tracking-[1.5px] mb-2" style={{ color: "var(--pm-primary)" }}>{c.label}</p>
          )}
          <h2 className="about-title font-serif text-[6.5vw] md:text-[40px] font-bold text-foreground mb-2">
            {c.title}
          </h2>
          {c.sub && (
            <p className="font-script text-[22px] md:text-[24px] font-medium mb-6" style={{ color: "var(--pm-primary)" }}>{c.sub}</p>
          )}

          <div className="space-y-3 md:space-y-4 text-[15px] md:text-[16px] leading-[1.7] md:leading-[1.8] font-sans" style={{ color: "var(--pm-text-body)" }}>
            {c.paragraphs.map((p, i) => <p key={i} style={{ fontFamily: "var(--pm-font-body, var(--font-sans))", fontStyle: "normal" }}>{p}</p>)}
          </div>

        </div>
      </div>
    </section>
  );
}

// -- Gift Section (male only) --
function GiftSection() {
  const { gender, mode } = useTheme();
  const { data: gifts } = useProductsFetch({ gender: "women", featured: true, limit: 4 }, gender === "male");
  const { ref, inView } = useInView();
  if (gender !== "male") return null;
  if (!gifts || gifts.length === 0) return null;

  type GiftProduct = { id: number; brand: string; name: string; imageUrl: string; imageUrls?: string[] };
  const items = gifts as unknown as GiftProduct[];

  return (
    <section className="py-8 px-6 section-glow">
      <div className="max-w-[900px] mx-auto">
        <div
          ref={ref}
          className={`animate-fade-up ${inView ? 'in-view' : ''} flex flex-col md:flex-row items-center gap-10 rounded-2xl gift-frame`}
          style={{ padding: "3rem 2.5rem", background: "var(--pm-gift-bg)", border: "1px solid var(--pm-gift-border)" }}
        >
          {/* Left — text */}
          <div className="flex-1 text-center md:text-left relative">
            {mode === "light" && (
              <>
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(255,130,180,0.35), rgba(255,182,213,0.18) 50%, transparent 75%)", filter: "blur(25px)" }} />
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(255,255,255,0.85), rgba(255,255,255,0.4) 50%, transparent 75%)", filter: "blur(15px)" }} />
              </>
            )}
            <p className="relative text-[11px] font-extrabold uppercase mb-4" style={{ letterSpacing: "2px", color: "var(--pm-text-muted)" }}>
              Идея для подарка
            </p>
            <h2 className="relative text-[32px] font-bold mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "var(--pm-text-heading)" }}>
              Подарок для неё
            </h2>
            <p className="relative text-[15px] font-medium mb-3 max-w-lg mx-auto md:mx-0" style={{ lineHeight: 1.6, color: "var(--pm-text-muted)" }}>
              Не знаешь что подарить? Отправь ей ссылку — она увидит подарок и описание без цены.
            </p>
            <p className="relative text-[12px] font-semibold mb-8" style={{ color: "var(--pm-text-muted)", opacity: 0.6 }}>
              Стильно, лично, без неловких моментов
            </p>
            <a
              href="/catalog?gift=true"
              className="gift-cta-btn inline-flex items-center gap-2 font-bold text-[16px] transition-all whitespace-nowrap"
              style={{
                padding: "16px 40px",
                borderRadius: 24,
                color: "#fff",
                background: "linear-gradient(135deg, #c0386a 0%, #e84393 50%, #c0386a 100%)",
                backgroundSize: "200% 200%",
                border: "none",
                boxShadow: "0 4px 20px rgba(232,67,147,0.4), 0 0 40px rgba(232,67,147,0.15)",
              }}
            >
              🎁 Подобрать подарок
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          </div>

          {/* Right — stacked fan cards */}
          <div className="relative shrink-0" style={{ width: 340, height: 230 }}>
            {items.slice(0, 3).map((p, i) => {
              const img = (p.imageUrls && p.imageUrls.length > 0) ? p.imageUrls[0] : p.imageUrl;
              const rotation = i === 0 ? -6 : i === 1 ? -2 : 3;
              const left = i * 80;
              const zIdx = i + 1;
              return (
                <div
                  key={p.id}
                  className="absolute overflow-hidden"
                  style={{
                    width: 160,
                    height: 200,
                    left,
                    top: "50%",
                    transform: `translateY(-50%) rotate(${rotation}deg)`,
                    zIndex: zIdx,
                    borderRadius: 12,
                    border: "1px solid var(--pm-gift-border, var(--pm-primary-border))",
                    background: "var(--pm-card-bg)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  }}
                >
                  {img
                    ? (() => { const imgData = getImageSrcSet(img); return <img src={imgData.src} srcSet={imgData.srcSet} sizes={SIZES_CARD} alt={p.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />; })()
                    : <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: "var(--pm-primary-light)" }}>🎁</div>
                  }
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// -- How It Works --
function HowItWorks() {
  const { gender } = useTheme();
  const isMale = gender === "male";
  const { ref: hiwRef, inView: hiwInView } = useInView();
  const { ref: hiwRef2, inView: hiwInView2 } = useInView();
  const steps = isMale ? [
    { num: "1", title: "Выбери", desc: "Находишь нужную вещь в каталоге. Все товары с фото и замерами" },
    { num: "2", title: "Напиши", desc: "Пишешь мне в мессенджер — оперативно отвечу на все вопросы" },
    { num: "3", title: "Обсудим", desc: "Уточним размер, сделаю доп. фото, договоримся об оплате" },
    { num: "4", title: "Получи", desc: "Отправлю в любой город. Авито Доставка или самовывоз из Зеленограда" },
  ] : [
    { num: "1", title: "Выбираешь", desc: "Листаешь каталог и находишь свою вещь" },
    { num: "2", title: "Пишешь", desc: "Нажимаешь кнопку и пишешь мне в Telegram" },
    { num: "3", title: "Обсуждаем", desc: "Договариваемся по деталям и оплате в личке" },
    { num: "4", title: "Получаешь", desc: "Доставка по всей России — СДЭК или Почта" },
  ];

  const maleIcons: Record<string, React.ReactNode> = {
    "1": (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    ),
    "2": (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    ),
    "3": (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
    ),
    "4": (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
    ),
  };

  const chevronRight = (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--pm-primary)", opacity: 0.5 }}><polyline points="9 18 15 12 9 6"/></svg>
  );
  const chevronDown = (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--pm-primary)", opacity: 0.5 }}><polyline points="6 9 12 15 18 9"/></svg>
  );

  if (isMale) {
    return (
      <section className="py-14 px-6 section-glow section-glow-soft">
        <div className="max-w-[1100px] mx-auto text-center">
          <SectionTitle title="Как это работает" />

          {/* Desktop: horizontal with chevrons */}
          <div ref={hiwRef} className={`animate-fade-up-stagger ${hiwInView ? 'in-view' : ''} hidden md:flex items-stretch justify-center`}>
            {steps.map((step, i) => (
              <React.Fragment key={i}>
                <div
                  style={{ '--stagger-index': i, background: "var(--pm-card-bg)", border: "1px solid var(--pm-border)" } as React.CSSProperties}
                  className="flex-1 rounded-2xl p-6 text-left flex flex-col gap-4 hiw-card"
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ border: "1.5px solid var(--pm-primary)", color: "var(--pm-primary)" }}>
                    {maleIcons[step.num]}
                  </div>
                  <div>
                    <h3 className="font-serif text-[17px] font-bold text-foreground mb-1">{step.title}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex items-center px-3 shrink-0">{chevronRight}</div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Mobile: vertical with chevrons */}
          <div className="flex md:hidden flex-col items-center gap-0">
            {steps.map((step, i) => (
              <React.Fragment key={i}>
                <div
                  className="w-full rounded-2xl p-5 text-left flex items-start gap-4 hiw-card"
                  style={{ background: "var(--pm-card-bg)", border: "1px solid var(--pm-border)" }}
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ border: "1.5px solid var(--pm-primary)", color: "var(--pm-primary)" }}>
                    {maleIcons[step.num]}
                  </div>
                  <div>
                    <h3 className="font-serif text-[17px] font-bold text-foreground mb-1">{step.title}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="py-2">{chevronDown}</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-14 px-6">
      <div className="max-w-[1000px] mx-auto text-center">
        <SectionTitle title="Как это работает" sub="даже проще, чем пустить стрелку на новых колготках" />

        <div className="relative">
          <div className="hidden md:block absolute top-[28px] left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-secondary via-[var(--pm-primary)] to-secondary z-0" />
          <div ref={hiwRef2} className={`animate-fade-up-stagger ${hiwInView2 ? 'in-view' : ''} grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 relative z-10`}>
            {steps.map((step, i) => (
              <div
                key={i}
                style={{ '--stagger-index': i } as React.CSSProperties}
                className="flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 rounded-full text-white font-serif text-[22px] font-bold flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, var(--pm-primary), var(--pm-primary-hover))", boxShadow: "0 8px 24px color-mix(in srgb, var(--pm-primary) 30%, transparent)" }}>
                  {step.num}
                </div>
                <h3 className="font-serif text-[18px] font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed max-w-[200px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// -- Reviews Section --
function Reviews() {
  const { gender } = useTheme();
  const isMale = gender === "male";
  const { ref, inView } = useInView();
  const reviews = isMale ? [
    { text: "Суперр!! Спасибо вам, Валентина. Все соответствует", author: "Чика", source: "Авито" },
    { text: "Спасибо большое за брюки! Замечательный продавец — ответила на все вопросы и очень быстро отправила посылку!", author: "Еленишна", source: "Авито" },
    { text: "Спасибо большое за чудесное платье!", author: "Наталья", source: "Авито" },
  ] : [
    { text: "Спасибо большое за брюки! Замечательный продавец — ответила на все вопросы и очень быстро отправила посылку!", author: "Еленишна", source: "Авито" },
    { text: "Суперр!! Спасибо вам, Валентина. Все соответствует", author: "Чика", source: "Авито" },
    { text: "Спасибо большое за чудесное платье!", author: "Наталья", source: "Авито" },
  ];

  return (
    <section id="reviews" className={`pt-14 pb-8 px-6 ${isMale ? "section-glow section-glow-soft" : ""}`}>
      <div className="max-w-[900px] mx-auto text-center">
        <SectionTitle title="Отзывы" sub={isMale ? undefined : "нас уже выбрали 💕"} />

        {isMale ? (
          <>
            <div
              ref={ref}
              className={`animate-fade-up-stagger ${inView ? 'in-view' : ''} grid gap-5 md:grid-cols-3 max-w-[960px] mx-auto`}
            >
              {reviews.map((r, i) => (
                <div
                  key={i}
                  style={{ '--stagger-index': i, background: "var(--pm-card-bg)", border: "1px solid var(--pm-border)" } as React.CSSProperties}
                  className="rounded-2xl p-6 text-left flex flex-col hiw-card"
                >
                  <div className="flex gap-1 mb-3" style={{ color: "var(--pm-primary)" }}>
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} fill="currentColor" />)}
                  </div>
                  <p className="text-[14px] leading-relaxed text-muted-foreground mb-5 flex-grow">«{r.text}»</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold" style={{ border: "1.5px solid var(--pm-primary)", color: "var(--pm-primary)" }}>
                      {r.author[0]}
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-foreground leading-tight">{r.author}</div>
                      <div className="text-[11px] text-muted-foreground leading-tight">{r.source}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <a
                href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661#open-reviews-list"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[14px] font-semibold transition-all hover:scale-105"
                style={{ color: "var(--pm-primary)" }}
              >
                <img src="https://www.avito.ru/favicon.ico" width={16} height={16} alt="" aria-hidden="true" className="shrink-0" />
                Смотреть на Авито →
              </a>
            </div>
          </>
        ) : (
          <div
            ref={ref}
            className={`animate-fade-up-stagger ${inView ? 'in-view' : ''} grid gap-6 md:grid-cols-3`}
          >
            {reviews.map((r, i) => (
              <a
                key={i}
                style={{ '--stagger-index': i, textDecoration: "none", color: "inherit", cursor: "pointer" } as React.CSSProperties}
                href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661"
                target="_blank"
                rel="noopener noreferrer"
                className="review-card group rounded-2xl p-8 text-left border border-primary/10 shadow-[0_4px_12px_rgba(61,32,48,0.06)] flex flex-col transition-all duration-200 hover:shadow-[0_12px_32px_rgba(61,32,48,0.14)] hover:-translate-y-1"
              >
                <div className="flex gap-1 mb-4" style={{ color: "var(--pm-primary)" }}>
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={16} fill="currentColor" />)}
                </div>
                <p className="italic text-[15px] leading-relaxed text-muted-foreground mb-6 flex-grow">«{r.text}»</p>
                <div className="mb-3">
                  <div className="text-[14px] font-bold text-foreground">{r.author}</div>
                  <div className="text-[12px] text-muted-foreground">{r.source}</div>
                </div>
                <div className="font-script text-[14px] text-primary mt-auto">Смотреть на Авито →</div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// -- FAQ Section --
function FAQ() {
  const { gender } = useTheme();
  const isMale = gender === "male";
  const { ref, inView } = useInView();
  const faqs = isMale ? [
    { q: "Это точно оригинал?", a: "Да, все товары оригинальные. Они поступают со склада невыкупленных товаров крупного магазина. Могу предоставить дополнительные фото бирок и этикеток." },
    { q: "Как происходит доставка?", a: "Отправляю Авито Доставкой или Почтой России. Также возможен самовывоз из Зеленограда." },
    { q: "Можно примерить перед покупкой?", a: "При самовывозе из Зеленограда — да. При доставке — к сожалению, нет, но я подробно консультирую по размерам и делаю замеры." },
    { q: "Есть ли возврат?", a: "При покупке через Авито Доставку действует стандартная политика возвратов Авито." },
  ] : [
    { q: "Это точно оригиналы?", a: "Да! Все вещи от официальных поставщиков, которые привозят бренды из-за рубежа в Россию. Готова показать бирки, ярлыки и любые подтверждения." },
    { q: "Как происходит доставка?", a: "Отправляю СДЭК или Почтой России — на выбор. Срок зависит от города, обычно 3–7 дней. Трек-номер дам сразу после отправки." },
    { q: "Можно ли вернуть вещь?", a: "Если вещь не подошла — обсудим индивидуально. Мне важно, чтобы ты осталась довольна покупкой." },
    { q: "Почему так дёшево?", a: "Секрет простой: я закупаю вещи напрямую со склада невыкупленных товаров крупного магазина — поэтому цены значительно ниже розницы. Каждая вещь новая и с бирками." },
  ];

  return (
    <section id="faq" className="pt-8 pb-14 px-6">
      <div className="max-w-[700px] mx-auto">
        <SectionTitle title="Частые вопросы" sub={isMale ? undefined : <>отвечаю, пока ты не спросила <img src="/faq-emoji.png" width={28} height={28} alt="" aria-hidden="true" style={{ display: "inline", verticalAlign: "middle" }} /></>} />

        <div ref={ref} className={`animate-fade-up ${inView ? 'in-view' : ''}`}>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="glass-card rounded-2xl px-6 transition-colors"
              style={{ borderColor: "color-mix(in srgb, var(--pm-primary) 20%, transparent)", border: "1px solid color-mix(in srgb, var(--pm-primary) 20%, transparent)" }}
              >
                <AccordionTrigger className="text-[16px] font-bold text-foreground hover:no-underline py-6 text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

// -- Final CTA Section --
function FinalCTA() {
  const { gender } = useTheme();
  const c = gender === "male" ? themeContent.male.cta : themeContent.female.cta;
  const isMale = gender === "male";
  const { ref, inView } = useInView();

  return (
    <section className={`px-6 section-cta relative text-center ${isMale ? "py-16 section-glow section-glow-soft" : "pt-16 pb-24 overflow-hidden"}`}>
      {/* Male-only glow */}
      {isMale && <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 160% at 50% 110%, color-mix(in srgb, var(--pm-primary) 20%, transparent), transparent 70%)" }} />}

      <div
        ref={ref}
        className={`animate-fade-up ${inView ? 'in-view' : ''} max-w-[700px] mx-auto relative z-10`}
      >
        <DecorBar />
        <h2 className="font-serif text-[32px] md:text-[48px] font-bold text-foreground mb-4">
          {c.title}
        </h2>

        {/* Female: script subtitle */}
        {!isMale && c.sub && (
          <p className="font-script text-[22px] md:text-[24px] font-medium mb-10" style={{ color: "var(--pm-primary)" }}>
            {c.sub}
          </p>
        )}

        {/* Male: italic quote + hint */}
        {isMale && c.quote && (
          <>
            <p className="font-serif text-[18px] md:text-[20px] italic mb-4 max-w-[580px] mx-auto cta-quote" style={{ color: "var(--pm-text-body)", fontStyle: "italic" }}>
              {c.quote}
            </p>
            <p className="text-[16px] font-medium mb-10 cta-sub" style={{ color: "var(--pm-text-body)" }}>{c.sub}</p>
          </>
        )}

        {/* Female buttons layout (Авито | Telegram | MAX) */}
        {!isMale && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://t.me/V_Limerence" target="_blank" rel="noreferrer"
              className="btn-glow-strong inline-flex items-center justify-center gap-2 bg-primary text-white px-10 py-5 rounded-full font-bold text-[17px] sm:order-2"
              data-testid="button-final-cta">
              Написать в Telegram ✈️
            </a>
            <a href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661" target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full font-bold text-[17px] transition-colors sm:order-1"
              style={{ background: "rgba(255,255,255,0.55)", color: "var(--pm-primary-hover)" }}
              data-testid="button-final-avito">
              <img src="https://www.avito.ru/favicon.ico" width={20} height={20} alt="" aria-hidden="true" className="shrink-0" />
              Профиль на Авито
            </a>
            <a href="https://tinyurl.com/5h4bbmkr" target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full font-bold text-[17px] transition-colors sm:order-3"
              style={{ background: "rgba(255,255,255,0.55)", color: "var(--pm-primary-hover)" }}
              data-testid="button-final-max">
              <img src="https://max.ru/favicon.ico" width={20} height={20} alt="" aria-hidden="true" className="shrink-0" />
              Написать в MAX
            </a>
          </div>
        )}

        {/* Male buttons: Авито (secondary) | Telegram (primary, center) | MAX (secondary) */}
        {isMale && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661" target="_blank" rel="noreferrer"
              className="cta-secondary-btn inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-[15px] transition-all hover:scale-105"
              style={{ background: "var(--pm-primary-bg)", color: "var(--pm-primary-hover)" }}
              data-testid="button-final-avito">
              <img src="https://www.avito.ru/favicon.ico" width={18} height={18} alt="" aria-hidden="true" className="shrink-0" />
              Авито
            </a>
            <a href="https://t.me/V_Limerence" target="_blank" rel="noreferrer"
              className="btn-glow-strong inline-flex items-center justify-center gap-2 text-white px-10 py-5 rounded-full font-bold text-[17px]"
              style={{ background: "var(--pm-primary)" }}
              data-testid="button-final-cta">
              Написать в Telegram ✈️
            </a>
            <a href="https://tinyurl.com/5h4bbmkr" target="_blank" rel="noreferrer"
              className="cta-secondary-btn inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-[15px] transition-all hover:scale-105"
              style={{ background: "var(--pm-primary-bg)", color: "var(--pm-primary-hover)" }}
              data-testid="button-final-max">
              <img src="https://max.ru/favicon.ico" width={18} height={18} alt="" aria-hidden="true" className="shrink-0" />
              MAX
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// -- Main App --
function Home() {
  const { gender } = useTheme();
  const isMale = gender === "male";
  return (
    <>
      <Header />
      <main className="page-gradient">
        <Hero />
        <WhyPickMe />
        <Catalog />
        <GiftSection />
        <About />
        <HowItWorks />
        <Reviews />
        <FAQ />
        <FinalCTA />
        {isMale && <Footer />}
      </main>
      {!isMale && <Footer />}
    </>
  );
}

function YmTracker() {
  const [location] = useLocation();
  useEffect(() => {
    if (typeof window !== "undefined" && (window as { ym?: (id: number, action: string, path: string) => void }).ym) {
      (window as { ym?: (id: number, action: string, path: string) => void }).ym!(108416864, "hit", window.location.pathname);
    }
    trackPageview(window.location.pathname);
  }, [location]);
  return null;
}

function Router() {
  const [location] = useLocation();
  const { hasChoice, setGender } = useTheme();

  const isGiftPage = location.startsWith("/gift/");
  const isProductPage = location.startsWith("/product/");
  const showSplash = !hasChoice && location === "/" && !isGiftPage && !isProductPage;

  return (
    <>
      <YmTracker />
      {showSplash && <SplashScreen key="splash" onSelect={setGender} />}
      <Suspense fallback={<PageLoading />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/catalog" component={CatalogPage} />
          <Route path="/product/:id" component={ProductPage} />
          <Route path="/gift/:id" component={GiftPage} />
          <Route>
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
              <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Страница не найдена</h1>
              <a href="/" className="text-primary font-bold hover:underline">Вернуться на главную</a>
            </div>
          </Route>
        </Switch>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
