import React, { useState, useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, useParams } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminPage from "@/pages/admin";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, Star, Check, Camera, DollarSign, Clock, ArrowRight, X } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useGetProducts } from "@workspace/api-client-react";

const queryClient = new QueryClient();

// ─── Analytics helpers ────────────────────────────────────────────
function getOrCreateVisitorId(): string {
  const name = "pickme_vid";
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  if (match) return decodeURIComponent(match[1]);
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const expires = new Date(Date.now() + 365 * 86400 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(id)}; expires=${expires}; path=/; SameSite=Lax`;
  return id;
}

function trackPageview(page: string): void {
  try {
    const visitorId = getOrCreateVisitorId();
    fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, referrer: document.referrer || null, userAgent: navigator.userAgent, visitorId }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* silent */ }
}

function trackClick(productId: number, actionType: "avito_click" | "telegram_click" | "card_view"): void {
  try {
    const visitorId = getOrCreateVisitorId();
    fetch("/api/analytics/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, actionType, visitorId }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* silent */ }
}
// ─────────────────────────────────────────────────────────────────

// -- Animation Variants --
const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.13 } }
};

// -- Shared Decorator Bar (bigger on desktop) --
function DecorBar({ align = "center" }: { align?: "center" | "left" | "responsive" }) {
  const justifyClass = align === "left" ? "justify-start" : align === "responsive" ? "justify-center md:justify-start" : "justify-center";
  return (
    <div className={`flex items-center ${justifyClass} gap-3 mb-3`}>
      <span className="text-[#f76da5] text-base md:text-xl">✦</span>
      <div className="h-[2px] w-12 md:w-20 bg-gradient-to-r from-transparent to-[#f76da5] opacity-60" />
      <span className="text-[#f76da5] text-lg md:text-3xl">💗</span>
      <div className="h-[2px] w-12 md:w-20 bg-gradient-to-l from-transparent to-[#f76da5] opacity-60" />
      <span className="text-[#f76da5] text-base md:text-xl">✦</span>
    </div>
  );
}

// -- Section Title --
function SectionTitle({ title, sub, titleNode, id }: { title?: string; sub: React.ReactNode; titleNode?: React.ReactNode; id?: string }) {
  return (
    <motion.div
      initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
      className="text-center mb-14"
      id={id}
    >
      <DecorBar />
      <h2 className="font-serif text-[32px] md:text-[44px] font-bold text-foreground mb-2">
        {titleNode ?? title}
      </h2>
      <p className="font-script text-[22px] md:text-[24px] font-medium text-[#e8609a]">{sub}</p>
    </motion.div>
  );
}

// -- Logo Word --
function LogoWord() {
  return (
    <span className="font-serif text-2xl font-bold no-underline tracking-tight">
      <span className="text-[#e02163]">Pick</span><span className="font-script text-[26px] font-semibold text-[#f76da5]">Me</span>
      <span className="text-[#e02163]"> Store</span>
    </span>
  );
}

// -- Header --
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navLinks = [
    { name: "Каталог", href: "/catalog" },
    { name: "Обо мне", href: "#about" },
    { name: "Отзывы", href: "#reviews" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 flex items-center justify-between ${
          scrolled
            ? "glass-card border-b border-[rgba(251,162,200,0.2)] shadow-[0_4px_24px_rgba(240,69,134,0.06)]"
            : "bg-transparent"
        }`}
      >
        <a href="/" className="no-underline flex flex-col leading-none cursor-pointer" data-testid="link-logo">
          <LogoWord />
          <span className="text-[10px] text-muted-foreground font-sans font-normal mt-0.5 tracking-normal">ПикМи — магазин брендовых вещей</span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <ul className="flex gap-6 list-none m-0 p-0 items-center">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a href={link.href} className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors tracking-wide" data-testid={`link-nav-${link.href.replace("#", "")}`}>
                  {link.name}
                </a>
              </li>
            ))}
            <li>
              <a
                href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661"
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors tracking-wide flex items-center gap-1"
                data-testid="link-nav-avito"
              >
                <img src="https://www.avito.ru/favicon.ico" width={16} height={16} alt="" aria-hidden="true" className="shrink-0" />
                Авито
              </a>
            </li>
            <li>
              <a
                href="https://tinyurl.com/5h4bbmkr"
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors tracking-wide flex items-center gap-1"
              >
                <img src="https://max.ru/favicon.ico" width={16} height={16} alt="" aria-hidden="true" className="shrink-0" />
                MAX
              </a>
            </li>
          </ul>
          <a
            href="https://t.me/V_Limerence"
            target="_blank"
            rel="noreferrer"
            className="btn-glow bg-primary hover:bg-[#e02163] text-white px-6 py-2.5 rounded-full font-semibold text-sm"
            data-testid="button-nav-contact"
          >
            Написать мне
          </a>
        </nav>

        {/* Mobile burger */}
        <button
          className="md:hidden p-2 text-primary"
          onClick={() => setMobileOpen(true)}
          aria-label="Открыть меню"
          data-testid="button-mobile-menu"
        >
          <Menu size={28} />
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-[300px] sm:w-[340px] flex flex-col"
              style={{
                background: "linear-gradient(160deg, #fff5f9 0%, #fde4ef 100%)",
                borderLeft: "1px solid rgba(247,109,165,0.2)",
                boxShadow: "-8px 0 48px rgba(240,69,134,0.12)",
              }}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-7 pt-7 pb-6 border-b border-[rgba(247,109,165,0.15)]">
                <a href="/" className="no-underline cursor-pointer" onClick={() => setMobileOpen(false)}>
                  <LogoWord />
                </a>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/60 text-primary flex items-center justify-center hover:bg-white transition-colors"
                  aria-label="Закрыть меню"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex flex-col gap-1 px-5 pt-6 flex-1">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.07 }}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-4 rounded-2xl font-serif text-[20px] font-bold text-foreground hover:text-primary hover:bg-white/50 transition-all"
                  >
                    <span className="text-primary text-sm">✦</span>
                    {link.name}
                  </motion.a>
                ))}

                <motion.a
                  href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661"
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + navLinks.length * 0.07 }}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 rounded-2xl font-serif text-[20px] font-bold text-muted-foreground hover:text-primary hover:bg-white/50 transition-all"
                >
                  <img src="https://www.avito.ru/favicon.ico" width={18} height={18} alt="" aria-hidden="true" className="shrink-0" />
                  Авито
                </motion.a>
                <motion.a
                  href="https://tinyurl.com/5h4bbmkr"
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + navLinks.length * 0.07 + 0.07 }}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 rounded-2xl font-serif text-[20px] font-bold text-muted-foreground hover:text-primary hover:bg-white/50 transition-all"
                >
                  <img src="https://max.ru/favicon.ico" width={18} height={18} alt="" aria-hidden="true" className="shrink-0" />
                  MAX
                </motion.a>
              </div>

              {/* Bottom CTA */}
              <div className="px-7 pb-10 pt-4 border-t border-[rgba(247,109,165,0.15)]">
                <a
                  href="https://t.me/V_Limerence"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="btn-glow-strong block w-full bg-primary text-white px-6 py-4 rounded-2xl font-bold text-center text-[16px] tracking-wide"
                >
                  Написать мне ✈️
                </a>
                <p className="font-script text-[14px] text-[#f76da5] text-center mt-3">на связи 24/7 💕</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// -- Hero Section --
function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const badgesY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <section ref={ref} className="min-h-[100dvh] flex items-center px-6 pt-20 pb-12 relative overflow-hidden">
      <motion.div
        style={{ y: bgY }}
        className="absolute -top-[200px] -right-[200px] w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(253,228,239,0.8)_0%,transparent_70%)] pointer-events-none"
      />
      <motion.div
        style={{ y: bgY }}
        className="absolute -bottom-[100px] -left-[150px] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(254,241,246,0.7)_0%,transparent_70%)] pointer-events-none"
      />

      <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 md:gap-20 items-center relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center md:text-left"
        >
          <div className="inline-block font-script text-[18px] font-medium text-[#f76da5] mb-4 -rotate-2">
            ✨ подберём лук и для пикми, и для её масика
          </div>
          <h1 className="font-serif text-[40px] md:text-[64px] font-bold leading-[1.1] text-foreground mb-2">
            Здесь твой <em className="italic text-primary">total slay</em> образ
          </h1>
          <p className="font-script text-[22px] md:text-[24px] font-medium text-[#6b4a5a] mb-6">
            по цене даже ниже, чем пал твой бывший
          </p>
          <p className="text-lg leading-relaxed text-muted-foreground mb-10 max-w-md mx-auto md:mx-0">
            Оригиналы <strong className="text-foreground font-bold">Nike, Guess, Lacoste</strong> и других брендов — с живыми фото, примеркой на мне и честными ценами от 3 500 ₽. Доставка по всей России.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <a
              href="#catalog"
              className="btn-glow inline-flex items-center justify-center bg-primary hover:bg-[#e02163] text-white px-8 py-4 rounded-full font-bold text-base"
              data-testid="button-hero-catalog"
            >
              Смотреть каталог ↓
            </a>
            <a
              href="#about"
              className="inline-flex items-center justify-center bg-transparent border-2 border-secondary hover:border-[#f76da5] text-muted-foreground hover:text-primary px-7 py-4 rounded-full font-bold text-[15px] transition-all"
              data-testid="button-hero-about"
            >
              Узнать больше
            </a>
          </div>
        </motion.div>

        <motion.div
          style={{ y: badgesY }}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative mt-12 md:mt-0"
        >
          <div className="w-full aspect-[3/4] max-w-[440px] mx-auto rounded-3xl relative overflow-hidden shadow-[0_24px_64px_rgba(240,69,134,0.18),0_8px_24px_rgba(61,32,48,0.08)]">
            <img
              src="/hero-photo.png"
              alt="PickMe Store — модная одежда"
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Floating sparkle decorations */}
          <motion.span
            animate={{ y: [0, -10, 0], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-4 right-0 text-[#f76da5] text-2xl pointer-events-none select-none"
            aria-hidden="true"
          >✦</motion.span>
          <motion.span
            animate={{ y: [0, -8, 0], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-24 -right-2 text-[#fba2c8] text-xl pointer-events-none select-none"
            aria-hidden="true"
          >♡</motion.span>
          <motion.span
            animate={{ y: [0, -12, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-1/3 -left-2 text-[#e8609a] text-lg pointer-events-none select-none"
            aria-hidden="true"
          >✿</motion.span>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-4 -right-4 md:-right-8 glass-card px-7 py-4 rounded-2xl text-base font-bold text-[#e02163] shadow-[0_8px_24px_rgba(240,69,134,0.22)]"
          >
            💯 Только оригиналы
          </motion.div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
            className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-10 glass-card px-7 py-4 rounded-2xl text-base font-bold text-[#e02163] shadow-[0_8px_24px_rgba(240,69,134,0.22)]"
          >
            Живые фото 📸
          </motion.div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-8 -right-4 md:-right-8 glass-card px-7 py-4 rounded-2xl text-base font-bold text-foreground shadow-[0_8px_24px_rgba(61,32,48,0.14)]"
          >
            Низкие цены 💰
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// -- Why PickMe Section --
function WhyPickMe() {
  const features = [
    { icon: <Check className="text-primary w-8 h-8" />, title: "Только оригиналы", desc: "Оставь страх фразы \"поясни за шмот\" в 2к16" },
    { icon: <Camera className="text-primary w-8 h-8" />, title: "Живые фото", desc: "Мне было мало соцсетей — теперь все вещи в PickMe Store тоже с моими фото" },
    { icon: <DollarSign className="text-primary w-8 h-8" />, title: "Цены 3 500 – 8 000 ₽", desc: "Масику не обязательно знать о нашей тайне 🤫" },
    { icon: <Clock className="text-primary w-8 h-8" />, title: "На связи 24/7", desc: "Отвечу быстрее, чем турок пришлёт огонёк на твою новую сторис" },
  ];

  // Custom title with branded PickMe styling
  const whyTitle = (
    <>
      Почему{" "}
      <span className="text-[#e02163]">Pick</span><span className="font-script text-[28px] md:text-[40px] font-medium text-[#f76da5]">Me</span>?
    </>
  );

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionTitle titleNode={whyTitle} sub="мы не такие, мы особенные 💅" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
          className="grid md:grid-cols-2 gap-6"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              className="why-card-hover glass-card rounded-[20px] p-8 md:p-10 relative overflow-hidden border border-[rgba(251,162,200,0.2)]"
            >
              <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(253,228,239,0.5)_0%,transparent_70%)] pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-[#fef1f6] flex items-center justify-center mb-5">
                {f.icon}
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">{f.title}</h3>
              <p className="font-script text-[18px] font-medium text-[#e8609a] leading-snug">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// -- Shared Product Card --
const SHOE_SIZE_CHART: { cm: number; ru: string }[] = [
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

function matchShoeSizeRow(size: string): number | null {
  const num = parseFloat(size.replace(/[^\d.]/g, ""));
  if (isNaN(num)) return null;
  const byCm = SHOE_SIZE_CHART.findIndex(r => r.cm === num);
  if (byCm >= 0) return byCm;
  const byRu = SHOE_SIZE_CHART.findIndex(r => parseFloat(r.ru) === num);
  if (byRu >= 0) return byRu;
  return null;
}

function getVisibleSizeRows(matchedIdx: number | null): { row: typeof SHOE_SIZE_CHART[0]; globalIdx: number }[] {
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

function ProductCard({ product }: { product: { id: number; brand: string; name: string; size: string; price: number; category?: string; badge?: string | null; imageUrl: string; imageUrls?: string[]; telegramUrl: string; avitoLink?: string | null; caption?: string | null } }) {
  const images = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls
    : product.imageUrl ? [product.imageUrl] : [];
  const [imgIdx, setImgIdx] = useState(0);

  // Drag state — all mutable refs so touchmove never triggers re-renders
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHoriz = useRef<boolean | null>(null);
  const liveDragX = useRef(0);

  // Visual drag offset (causes re-render only when needed)
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

  // Attach non-passive listeners so we can call e.preventDefault()
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isHoriz.current = null;
      liveDragX.current = 0;
      setAnimating(false);
      setDragX(0);
    };

    const onMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - touchStartY.current;

      // Determine direction once, after at least 5px movement
      if (isHoriz.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isHoriz.current = Math.abs(dx) >= Math.abs(dy);
      }

      if (isHoriz.current === true && images.length > 1) {
        e.preventDefault(); // block page scroll only for horizontal gestures
        liveDragX.current = dx;
        setDragX(dx);
      }
    };

    const onEnd = () => {
      if (isHoriz.current !== true) {
        touchStartX.current = null;
        return;
      }
      const dx = liveDragX.current;
      setAnimating(true);
      setDragX(0);
      if (Math.abs(dx) >= 30 && images.length > 1) {
        setImgIdx(i => dx < 0
          ? (i + 1) % images.length
          : (i - 1 + images.length) % images.length
        );
      }
      liveDragX.current = 0;
      touchStartX.current = null;
      isHoriz.current = null;
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
  }, [images.length]);

  const prevImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    setImgIdx(i => (i - 1 + images.length) % images.length);
  };
  const nextImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    setImgIdx(i => (i + 1) % images.length);
  };
  const handleCarouselClick = () => {
    if (Math.abs(liveDragX.current) < 10) {
      window.location.href = `/product/${product.id}`;
    }
  };

  return (
    <div ref={cardRootRef} className="product-card-hover bg-white rounded-[20px] overflow-hidden border border-primary/10 shadow-[0_4px_12px_rgba(61,32,48,0.06)] flex flex-col h-full">
      {/* Carousel container */}
      <div
        ref={carouselRef}
        className="relative w-full aspect-[3/4] overflow-hidden group flex-shrink-0 bg-gradient-to-br from-[#fef1f6] to-secondary"
        style={{ touchAction: "pan-y", cursor: "pointer" }}
        onClick={handleCarouselClick}
      >
        {images.length > 0 ? (
          /* Horizontal strip — all images side by side */
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
              <div
                key={i}
                style={{ width: `${100 / images.length}%`, flexShrink: 0, height: "100%", overflow: "hidden", position: "relative" }}
              >
                <img
                  src={src}
                  alt={product.name}
                  className="product-img-zoom"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl opacity-60 mb-2">👗</span>
            <span className="text-xs text-muted-foreground font-semibold">Фото товара</span>
          </div>
        )}

        {product.badge === "new" && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white bg-primary" style={{ zIndex: 10 }}>
            New
          </div>
        )}
        {product.badge === "sold" && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
            <div style={{
              position: "absolute",
              top: "28px",
              left: "-36px",
              width: "148px",
              background: "#f04586",
              color: "#fff",
              textAlign: "center",
              transform: "rotate(-45deg)",
              fontSize: "11px",
              fontWeight: 700,
              padding: "6px 0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.22)",
              letterSpacing: "0.08em",
            }}>ПРОДАНО</div>
          </div>
        )}
        {product.badge === "reserved" && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
            <div style={{
              position: "absolute",
              top: "28px",
              left: "-36px",
              width: "148px",
              background: "#f97316",
              color: "#fff",
              textAlign: "center",
              transform: "rotate(-45deg)",
              fontSize: "11px",
              fontWeight: 700,
              padding: "6px 0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.22)",
              letterSpacing: "0.08em",
            }}>БРОНЬ</div>
          </div>
        )}

        {images.length > 1 && (
          <>
            {/* Desktop-only arrows */}
            <button
              onClick={prevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-primary hover:text-white text-lg font-bold"
              style={{ zIndex: 10 }}
            >‹</button>
            <button
              onClick={nextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-primary hover:text-white text-lg font-bold"
              style={{ zIndex: 10 }}
            >›</button>

            {/* Dot indicators — clickable on all devices */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5" style={{ zIndex: 10 }}>
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAnimating(true); setImgIdx(i); }}
                  className={`rounded-full transition-all ${i === imgIdx ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-white/70"}`}
                />
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
            {product.category === "shoes"
              ? <>Длина стельки: {product.size} см</>
              : <>Размер: {product.size}</>}
          </div>

          {/* Size chart accordion — shoes only */}
          {product.category === "shoes" && (
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setSizeChartOpen(v => !v)}
                className="flex items-center gap-1.5 w-full text-left text-[12px] font-semibold text-primary/80 hover:text-primary transition-colors py-1.5 px-2.5 rounded-lg hover:bg-[#fef1f6]"
              >
                <span className="text-base leading-none">📏</span>
                <span className="flex-1">Таблица размеров</span>
                <svg
                  width="14" height="14" viewBox="0 0 14 14" fill="none"
                  style={{ transform: sizeChartOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 220ms ease" }}
                >
                  <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {sizeChartOpen && (
                <div
                  className="mt-1 rounded-xl border border-[#f7c6dc] overflow-hidden"
                  style={{ animation: "fadeIn 200ms ease" }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                    <thead>
                      <tr style={{ background: "#fde8f2" }}>
                        <th style={{ padding: "4px 8px", textAlign: "center", fontWeight: 700, color: "#b0437a", borderBottom: "1px solid #f7c6dc" }}>Стелька (см)</th>
                        <th style={{ padding: "4px 8px", textAlign: "center", fontWeight: 700, color: "#b0437a", borderBottom: "1px solid #f7c6dc" }}>RU</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getVisibleSizeRows(matchedRow).map(({ row, globalIdx }, i, arr) => (
                        <tr
                          key={row.cm}
                          style={{
                            background: globalIdx === matchedRow ? "#fde8f2" : i % 2 === 0 ? "#fff" : "#fff9fc",
                            borderBottom: i < arr.length - 1 ? "1px solid #fce4ef" : "none",
                          }}
                        >
                          <td style={{ padding: "4px 8px", textAlign: "center", fontWeight: globalIdx === matchedRow ? 700 : 400, color: globalIdx === matchedRow ? "#c0357a" : "#374151" }}>
                            {row.cm}
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "center", fontWeight: globalIdx === matchedRow ? 700 : 400, color: globalIdx === matchedRow ? "#c0357a" : "#374151" }}>
                            {row.ru}
                            {globalIdx === matchedRow && <span style={{ marginLeft: 4, fontSize: 9 }}>◀</span>}
                          </td>
                        </tr>
                      ))}
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
            <button
              disabled
              className="px-4 py-2 rounded-full bg-[#f3f4f6] text-[#9ca3af] text-[13px] font-bold cursor-not-allowed"
            >
              Продано
            </button>
          ) : product.badge === "reserved" ? (
            <button
              disabled
              className="px-4 py-2 rounded-full text-[13px] font-bold cursor-not-allowed"
              style={{ background: "#fff7ed", color: "#f97316" }}
            >
              Забронировано
            </button>
          ) : (
            <a
              href={`/product/${product.id}`}
              className="w-10 h-10 rounded-full bg-[#fef1f6] text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
              data-testid={`button-buy-${product.id}`}
            >
              <ArrowRight size={18} />
            </a>
          )}
        </div>
        <div className="mt-3 flex justify-center min-h-[36px]">
          {(product.badge === "sold" || product.badge === "reserved") ? (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold"
              style={{ background: "#f3f4f6", color: "#9ca3af", filter: "grayscale(1)", opacity: 0.5, pointerEvents: "none", cursor: "not-allowed" }}
            >
              {product.avitoLink ? (
                <>
                  <img src="https://www.avito.ru/favicon.ico" width={14} height={14} alt="" aria-hidden="true" className="shrink-0" />
                  Купить на Авито
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0" aria-hidden="true">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.01 13.585l-2.94-.918c-.64-.203-.653-.64.136-.954l11.5-4.43c.533-.194 1-.131.818.938z"/>
                  </svg>
                  Написать в Telegram
                </>
              )}
            </div>
          ) : product.avitoLink ? (
            <a
              href={product.avitoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#fef1f6] text-primary text-[13px] font-bold hover:bg-primary hover:text-white transition-colors"
              onClick={() => trackClick(product.id, "avito_click")}
            >
              <img src="https://www.avito.ru/favicon.ico" width={14} height={14} alt="" aria-hidden="true" className="shrink-0" />
              Купить на Авито
            </a>
          ) : (
            <a
              href={product.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#fef1f6] text-primary text-[13px] font-bold hover:bg-primary hover:text-white transition-colors"
              onClick={() => trackClick(product.id, "telegram_click")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0" aria-hidden="true">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.01 13.585l-2.94-.918c-.64-.203-.653-.64.136-.954l11.5-4.43c.533-.194 1-.131.818.938z"/>
              </svg>
              Написать в Telegram
            </a>
          )}
        </div>
        <p className="font-script text-[18px] font-medium text-[#e8609a] mt-3 leading-tight min-h-[1.75rem]">
          {product.caption ?? ""}
        </p>
      </div>
    </div>
  );
}

// -- Catalog Section (landing page — featured only, max 6) --
function Catalog() {
  const { data: products, isLoading } = useGetProducts({ featured: true });
  const featured = products ? products.slice(0, 6) : [];

  return (
    <section id="catalog" className="py-24 px-6">
      <div className="max-w-[1100px] mx-auto">
        <SectionTitle title="Каталог" sub="тут все мои сокровища 🛍️" />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-[20px] overflow-hidden border border-primary/10 animate-pulse">
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
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
          >
            {featured.map((product) => (
              <motion.div key={product.id} variants={fadeInUp} className="h-full">
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 text-muted-foreground font-medium">
            <p>Скоро здесь появятся товары. Загляни позже!</p>
          </div>
        )}

        <div className="flex justify-center mt-12">
          <a
            href="/catalog"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full border-2 border-primary text-primary font-bold text-base hover:bg-primary hover:text-white transition-all"
          >
            Смотреть весь ассортимент →
          </a>
        </div>
      </div>
    </section>
  );
}

const PAGE_SIZE = 15;

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

function applyDefaultSort<T extends { badge?: string | null; sortOrder?: number | null; category: string }>(list: T[]): T[] {
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

// -- Full Catalog Page --
function CatalogPage() {
  const [filter, setFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<"all" | "women" | "men">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"default" | "newest" | "price_asc" | "price_desc">("default");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [hideSold, setHideSold] = useState(false);

  const queryParam = filter !== "all" ? (filter as "shoes" | "tops" | "bottoms" | "accessories" | "supplements") : undefined;
  const { data: allProducts, isLoading } = useGetProducts({ category: queryParam });

  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, genderFilter, search, sort, hideSold]);

  const categories = [
    { id: "all", label: "Все" },
    { id: "shoes", label: "Обувь" },
    { id: "tops", label: "Верх" },
    { id: "bottoms", label: "Низ" },
    { id: "accessories", label: "Аксессуары" },
    { id: "supplements", label: "БАД" },
  ];

  const filtered = React.useMemo(() => {
    if (!allProducts) return [];
    let list = [...allProducts];
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
  }, [allProducts, genderFilter, search, sort, hideSold]);

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
      <div className="noise-overlay" aria-hidden="true" />
      <Header />
      <main className="page-gradient min-h-screen">
        <section className="py-16 px-6">
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-10">
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-3">Каталог</h1>
              <p className="font-script text-2xl text-[#e8609a]">весь мой гардероб — выбирай своё ✨</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск по бренду или названию..."
                  className="w-full px-5 py-3 rounded-full border-2 border-secondary focus:border-primary focus:outline-none font-sans text-sm bg-white/80"
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
                className="px-5 py-3 rounded-full border-2 border-secondary focus:border-primary focus:outline-none font-sans text-sm bg-white/80 cursor-pointer"
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
                      : "bg-transparent border-secondary text-muted-foreground hover:border-[#f76da5] hover:text-primary"
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
                      : "bg-transparent border-secondary text-muted-foreground hover:border-[#f76da5] hover:text-primary"
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
                    : "bg-transparent border-secondary text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                <span className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-all ${hideSold ? "border-white bg-white" : "border-current"}`}>
                  {hideSold && <span className="text-foreground text-[10px] font-black leading-none">✓</span>}
                </span>
                Скрыть проданные
              </button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-[20px] overflow-hidden border border-primary/10 animate-pulse">
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
            ) : filtered.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {visible.map((product) => (
                    <ProductCard key={product.id} product={product} />
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
                <div className="w-full rounded-[24px] overflow-hidden flex flex-col md:flex-row"
                  style={{ boxShadow: "0 8px 40px rgba(247,109,165,0.2), 0 2px 12px rgba(247,109,165,0.12)", border: "1.5px solid rgba(247,109,165,0.3)", minHeight: 280 }}>
                  {/* Image */}
                  <div className="md:w-1/2 w-full flex-shrink-0" style={{ minHeight: 240 }}>
                    <img
                      src="/bad-detective.png"
                      alt="Детектив ищет БАДы"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", minHeight: 240 }}
                    />
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

// -- About Section --
function About() {
  return (
    <section id="about" className="py-24 px-6">
      <div className="max-w-[900px] mx-auto grid md:grid-cols-[300px_1fr] gap-12 md:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-[280px] mx-auto md:max-w-none"
        >
          <div className="about-photo-frame w-full aspect-[9/16] rounded-[24px] overflow-hidden">
            <img
              src="/about-photo.jpg"
              alt="Валентинка — основательница PickMe Store"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <DecorBar align="responsive" />
          <h2 className="font-serif text-[32px] md:text-[40px] font-bold text-foreground mb-2">
            Привет, я — <em className="italic text-primary">Валентинка</em>
          </h2>
          <p className="font-script text-[22px] md:text-[24px] font-medium text-[#e8609a] mb-6">та самая пикми-подружка, которая не бесит 💕</p>

          <div className="space-y-4 text-[16px] leading-[1.8] text-muted-foreground">
            <p>Раньше я спасала пассажиров на высоте 10 000 метров от плачущих детей, внезапных болезней, фобий и просто плохого настроения. А теперь с удовольствием спасаю твой гардероб и кошелёк твоего масика.</p>
            <p>Я люблю видеть женщин разными: от пикми до пацанок. Каждая индивидуальна и прекрасна в своём естестве. PickMe Store — мой маленький проект, в который я вкладываю всю себя: креатив, заботу и честный внимательный подход к каждому клиенту.</p>
            <p>Здесь нет конвейера. Есть я, живые фото и желание, чтобы ты ушла довольной. Пиши в любое время, я почти всегда на связи, как будто меня до сих пор в любой момент могут вызвать в небо. Жду твоё сообщение так, как ещё год назад ждала звонка от планирования с фразой "Валентина, нужно срочно слетать на Мальдивы, выручайте, пожалуйста"</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// -- How It Works --
function HowItWorks() {
  const steps = [
    { num: "1", title: "Выбираешь", desc: "Листаешь каталог и находишь свою вещь" },
    { num: "2", title: "Пишешь", desc: "Нажимаешь кнопку и пишешь мне в Telegram" },
    { num: "3", title: "Обсуждаем", desc: "Договариваемся по деталям и оплате в личке" },
    { num: "4", title: "Получаешь", desc: "Доставка по всей России — СДЭК или Почта" },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-[1000px] mx-auto text-center">
        <SectionTitle title="Как это работает" sub="даже проще, чем пустить стрелку на новых колготках" />

        <div className="relative">
          <div className="hidden md:block absolute top-[28px] left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-secondary via-[#f76da5] to-secondary z-0" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#f76da5] to-primary text-white font-serif text-[22px] font-bold flex items-center justify-center mb-5 shadow-[0_8px_24px_rgba(240,69,134,0.3)]">
                  {step.num}
                </div>
                <h3 className="font-serif text-[18px] font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed max-w-[200px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// -- Reviews Section --
function Reviews() {
  const reviews = [
    { text: "Спасибо большое за брюки! Замечательный продавец — ответила на все вопросы и очень быстро отправила посылку!", author: "Еленишна", source: "Авито" },
    { text: "Суперр!! Спасибо вам, Валентина. Все соответствует", author: "Чика", source: "Авито" },
    { text: "Спасибо большое за чудесное платье!", author: "Наталья", source: "Авито" },
  ];

  return (
    <section id="reviews" className="py-24 px-6">
      <div className="max-w-[900px] mx-auto text-center">
        <SectionTitle title="Отзывы" sub="нас уже выбрали 💕" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6"
        >
          {reviews.map((r, i) => (
            <motion.a
              key={i}
              variants={fadeInUp}
              href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-[20px] p-8 text-left border border-primary/10 shadow-[0_4px_12px_rgba(61,32,48,0.06)] flex flex-col cursor-pointer transition-all duration-200 hover:shadow-[0_12px_32px_rgba(61,32,48,0.14)] hover:-translate-y-1"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="flex text-[#f76da5] gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={16} fill="currentColor" />)}
              </div>
              <p className="italic text-[15px] leading-relaxed text-muted-foreground mb-6 flex-grow">«{r.text}»</p>
              <div className="mb-3">
                <div className="text-[14px] font-bold text-foreground">{r.author}</div>
                <div className="text-[12px] text-muted-foreground">{r.source}</div>
              </div>
              <div className="font-script text-[14px] text-primary mt-auto">Смотреть на Авито →</div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// -- FAQ Section --
function FAQ() {
  const faqs = [
    { q: "Это точно оригиналы?", a: "Да! Все вещи от официальных поставщиков, которые привозят бренды из-за рубежа в Россию. Готова показать бирки, ярлыки и любые подтверждения." },
    { q: "Как происходит доставка?", a: "Отправляю СДЭК или Почтой России — на выбор. Срок зависит от города, обычно 3–7 дней. Трек-номер дам сразу после отправки." },
    { q: "Можно ли вернуть вещь?", a: "Если вещь не подошла — обсудим индивидуально. Мне важно, чтобы ты осталась довольна покупкой." },
    { q: "Почему так дёшево?", a: "Секрет простой: я закупаю вещи напрямую со склада невыкупленных товаров крупного магазина — поэтому цены значительно ниже розницы. Каждая вещь новая и с бирками." },
  ];

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-[700px] mx-auto">
        <SectionTitle title="Частые вопросы" sub={<>отвечаю, пока ты не спросила <img src="/faq-emoji.png" width={28} height={28} alt="" aria-hidden="true" style={{ display: "inline", verticalAlign: "middle" }} /></>} />

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="glass-card border border-[rgba(251,162,200,0.2)] rounded-2xl px-6 data-[state=open]:border-[#fcc8df] transition-colors"
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
        </motion.div>
      </div>
    </section>
  );
}

// -- Final CTA Section --
function FinalCTA() {
  return (
    <section className="py-28 px-6 section-cta relative overflow-hidden text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(249,176,208,0.3),transparent_60%)] pointer-events-none" />

      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
        className="max-w-[700px] mx-auto relative z-10"
      >
        <DecorBar />
        <h2 className="font-serif text-[32px] md:text-[48px] font-bold text-foreground mb-4">
          Напиши мне — <em className="italic text-primary">подберу вещь под тебя</em>
        </h2>
        <p className="font-script text-[22px] md:text-[24px] font-medium text-[#e8609a] mb-10">
          отвечаю быстрее, чем ты свайпаешь влево, увидев имя Никита 🙅‍♀️
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://t.me/V_Limerence"
            target="_blank"
            rel="noreferrer"
            className="btn-glow-strong inline-flex items-center justify-center gap-2 bg-primary hover:bg-[#e02163] text-white px-10 py-5 rounded-full font-bold text-[17px] sm:order-2"
            data-testid="button-final-cta"
          >
            Написать в Telegram ✈️
          </a>
          <a
            href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#fde4ef] hover:bg-[#f9d4e5] text-[#e02163] px-10 py-5 rounded-full font-bold text-[17px] transition-colors sm:order-1"
            data-testid="button-final-avito"
          >
            <img src="https://www.avito.ru/favicon.ico" width={20} height={20} alt="" aria-hidden="true" className="shrink-0" />
            Профиль на Авито
          </a>
          <a
            href="https://tinyurl.com/5h4bbmkr"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#fde4ef] hover:bg-[#f9d4e5] text-[#e02163] px-10 py-5 rounded-full font-bold text-[17px] transition-colors sm:order-3"
            data-testid="button-final-max"
          >
            <img src="https://max.ru/favicon.ico" width={20} height={20} alt="" aria-hidden="true" className="shrink-0" />
            Написать в MAX
          </a>
        </div>
      </motion.div>
    </section>
  );
}

// -- Footer --
function Footer() {
  return (
    <footer className="bg-foreground py-10 px-6 text-center">
      <div className="font-serif text-xl font-bold text-[#fba2c8] mb-1">
        <span className="text-[#fba2c8]">Pick</span><span className="font-script text-[24px] text-[#fcc8df]">Me</span>
        <span className="text-[#fba2c8]"> Store</span>
      </div>
      <p className="text-[10px] text-[#fba2c8]/60 font-sans mb-4">ПикМи — магазин брендовых вещей</p>
      <div className="flex items-center justify-center gap-6 mb-4">
        <a
          href="https://t.me/V_Limerence"
          target="_blank"
          rel="noreferrer"
          className="text-[13px] text-[#fba2c8] hover:text-white transition-colors font-semibold"
        >
          Telegram
        </a>
        <span className="text-[#fba2c8]/30">·</span>
        <a
          href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661"
          target="_blank"
          rel="noreferrer"
          className="text-[13px] text-[#fba2c8] hover:text-white transition-colors font-semibold flex items-center gap-1.5"
        >
          <span className="inline-flex w-4 h-4 rounded-full bg-[#fba2c8]/20 text-[#fba2c8] text-[9px] font-black items-center justify-center">A</span>
          Авито
        </a>
        <span className="text-[#fba2c8]/30">·</span>
        <a
          href="https://tinyurl.com/5h4bbmkr"
          target="_blank"
          rel="noreferrer"
          className="text-[13px] text-[#fba2c8] hover:text-white transition-colors font-semibold flex items-center gap-1.5"
        >
          <img src="https://max.ru/favicon.ico" width={16} height={16} alt="" aria-hidden="true" className="shrink-0" />
          MAX
        </a>
      </div>
      <p className="text-[13px] text-muted-foreground/40">
        © 2026 · Оригинальные бренды с любовью · Доставка по всей России
      </p>
    </footer>
  );
}

// -- Main App --
function Home() {
  return (
    <>
      <div className="noise-overlay" aria-hidden="true" />
      <Header />
      <main className="page-gradient">
        <Hero />
        <WhyPickMe />
        <Catalog />
        <About />
        <HowItWorks />
        <Reviews />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

// ─── Similar Products ─────────────────────────────────────────────
function SimilarProducts({ currentId, category }: { currentId: number; category: string }) {
  const { data: allProducts } = useGetProducts({ category: category as "shoes" | "tops" | "bottoms" | "accessories" | "supplements" });
  const similar = React.useMemo(() => {
    if (!allProducts) return [];
    const available = allProducts.filter(p => p.id !== currentId && p.badge !== "sold" && p.badge !== "reserved");
    if (available.length === 0) return [];
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [allProducts, currentId]);

  if (similar.length === 0) return null;

  return (
    <div className="mt-16">
      <div className="mb-8 text-center">
        <DecorBar />
        <h2 className="font-serif text-[26px] md:text-[32px] font-bold text-foreground">Тебе также понравится</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {similar.map(p => (
          <div key={p.id} className="h-full">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Product Page ─────────────────────────────────────────────────
type ProductDetail = {
  id: number; brand: string; name: string; size: string; price: number;
  category: string; badge: string | null; imageUrl: string; imageUrls?: string[];
  telegramUrl: string; avitoLink?: string | null; caption?: string | null;
  published: boolean; description?: string | null;
};

function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
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
        <div className="noise-overlay" aria-hidden="true" />
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
        <div className="noise-overlay" aria-hidden="true" />
        <Header />
        <main className="page-gradient min-h-screen pt-32 pb-24 px-6 flex flex-col items-center justify-center gap-6">
          <p className="font-serif text-3xl font-bold text-foreground">Товар не найден</p>
          <a href="/catalog" className="btn-glow bg-primary hover:bg-[#e02163] text-white px-8 py-3 rounded-full font-bold text-sm">← Назад в каталог</a>
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
          <a href="/catalog" className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:underline mt-6 mb-8 block">
            ← Назад в каталог
          </a>

          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* ── Photo ── */}
            <div className="w-full md:w-1/2">
              <div
                ref={carouselRef}
                className="relative w-full aspect-[3/4] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#fef1f6] to-secondary"
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
                        <img src={src} alt={product.name} className="w-full h-full object-cover" loading="eager" />
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
                    <div style={{ position: "absolute", top: "44px", left: "-52px", width: "210px", background: "#f04586", color: "#fff", textAlign: "center", transform: "rotate(-45deg)", fontSize: "15px", fontWeight: 700, padding: "8px 0", boxShadow: "0 2px 8px rgba(0,0,0,0.22)", letterSpacing: "0.08em" }}>ПРОДАНО</div>
                  </div>
                )}
                {isReserved && (
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                    <div style={{ position: "absolute", top: "44px", left: "-52px", width: "210px", background: "#f97316", color: "#fff", textAlign: "center", transform: "rotate(-45deg)", fontSize: "15px", fontWeight: 700, padding: "8px 0", boxShadow: "0 2px 8px rgba(0,0,0,0.22)", letterSpacing: "0.08em" }}>БРОНЬ</div>
                  </div>
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

            {/* ── Info ── */}
            <div className="w-full md:w-1/2 md:aspect-[3/4] flex flex-col gap-5 min-h-0">
              {/* Brand + badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-primary">{product.brand}</span>
                {product.badge === "new" && <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white bg-primary">New</span>}
                {isSold && <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white" style={{ background: "#f04586" }}>Продано</span>}
                {isReserved && <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white" style={{ background: "#f97316" }}>Забронировано</span>}
              </div>

              {/* Name */}
              <h1 className="font-serif text-[28px] md:text-[36px] font-bold text-foreground leading-tight">{product.name}</h1>

              {/* Caption — space always reserved */}
              <p className="font-script text-[22px] text-[#e8609a] leading-tight -mt-2 min-h-[28px]">
                {product.caption ?? ""}
              </p>

              {/* Size */}
              <p className="text-[15px] text-muted-foreground">
                {product.category === "shoes" ? `Длина стельки: ${product.size} см` : `Размер: ${product.size}`}
              </p>

              {/* Size chart — shoes only */}
              {product.category === "shoes" && (
                <div className="rounded-xl border border-[#f7c6dc] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSizeChartOpen(v => !v)}
                    className="flex items-center gap-2 w-full text-left text-[13px] font-semibold text-primary/80 hover:text-primary transition-colors py-3 px-4 hover:bg-[#fef1f6]"
                  >
                    <span className="text-lg leading-none">📏</span>
                    <span className="flex-1">Таблица размеров</span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: sizeChartOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 220ms ease" }}>
                      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {sizeChartOpen && (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ background: "#fde8f2" }}>
                          <th style={{ padding: "6px 12px", textAlign: "center", fontWeight: 700, color: "#b0437a", borderBottom: "1px solid #f7c6dc" }}>Стелька (см)</th>
                          <th style={{ padding: "6px 12px", textAlign: "center", fontWeight: 700, color: "#b0437a", borderBottom: "1px solid #f7c6dc" }}>RU</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getVisibleSizeRows(matchedRow).map(({ row, globalIdx }, i, arr) => (
                          <tr key={row.cm} style={{ background: globalIdx === matchedRow ? "#fde8f2" : i % 2 === 0 ? "#fff" : "#fff9fc", borderBottom: i < arr.length - 1 ? "1px solid #fce4ef" : "none" }}>
                            <td style={{ padding: "6px 12px", textAlign: "center", fontWeight: globalIdx === matchedRow ? 700 : 400, color: globalIdx === matchedRow ? "#c0357a" : "#374151" }}>{row.cm}</td>
                            <td style={{ padding: "6px 12px", textAlign: "center", fontWeight: globalIdx === matchedRow ? 700 : 400, color: globalIdx === matchedRow ? "#c0357a" : "#374151" }}>
                              {row.ru}{globalIdx === matchedRow && <span style={{ marginLeft: 4, fontSize: 10 }}>◀</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Price */}
              <div className={`text-[34px] font-bold ${isSold ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {Number(product.price).toLocaleString("ru-RU")} ₽
              </div>

              {/* Buy button */}
              {isSold ? (
                <button disabled className="w-full py-4 rounded-full bg-[#f3f4f6] text-[#9ca3af] text-[15px] font-bold cursor-not-allowed">Продано</button>
              ) : isReserved ? (
                <button disabled className="w-full py-4 rounded-full text-[15px] font-bold cursor-not-allowed" style={{ background: "#fff7ed", color: "#f97316" }}>Забронировано</button>
              ) : product.avitoLink ? (
                <a
                  href={product.avitoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-full bg-primary text-white text-[15px] font-bold hover:bg-[#e02163] transition-colors flex items-center justify-center gap-2 btn-glow"
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
                  className="w-full py-4 rounded-full bg-primary text-white text-[15px] font-bold hover:bg-[#e02163] transition-colors flex items-center justify-center gap-2 btn-glow"
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
                  const url = window.location.href;
                  if (navigator.share) {
                    navigator.share({ title: `${product.name} ${product.brand}`, url }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(url).then(() => {}).catch(() => {});
                  }
                }}
                className="w-full py-3 rounded-full border-2 border-primary text-primary text-[14px] font-semibold hover:bg-[#fef1f6] transition-colors flex items-center justify-center gap-2"
              >
                🔗 Поделиться
              </button>

              {/* Description — fills all remaining height, always ends at photo bottom */}
              {product.description && (
                <div className="flex-1 min-h-0 overflow-hidden p-5 flex flex-col gap-2" style={{ borderRadius: 24, background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(247,109,165,0.15)" }}>
                  <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-primary/50 shrink-0">О товаре</p>
                  <p className="text-[14px] text-foreground/80 leading-relaxed whitespace-pre-line overflow-hidden">{product.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Similar products ── */}
          <SimilarProducts currentId={product.id} category={product.category} />
        </div>

        {/* ── CTA block ── */}
        <div className="mt-16">
          <div className="max-w-[700px] mx-auto rounded-[28px] p-8 md:p-12 text-center" style={{ background: "linear-gradient(135deg, #f7147a 0%, #f76da5 60%, #fbbcd8 100%)" }}>
            <p className="font-serif text-[24px] md:text-[30px] font-bold text-white mb-2">Есть вопросы по этому товару?</p>
            <p className="text-white/80 text-[15px] mb-8">Пиши мне, отвечу на все вопросы и помогу с выбором 💗</p>
            <div className="flex items-stretch justify-center gap-4 flex-wrap">
              {/* Авито */}
              <a
                href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white hover:bg-[#fef1f6] text-primary px-6 py-4 rounded-full font-semibold text-[14px] transition-colors min-w-[140px]"
              >
                <img src="https://www.avito.ru/favicon.ico" width={24} height={24} alt="" aria-hidden="true" className="shrink-0" />
                <span className="leading-snug">Профиль на<br/>Авито</span>
              </a>

              {/* Telegram — центральная, выделена */}
              <a
                href={product.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-primary hover:bg-[#e02163] text-white px-8 py-4 rounded-full font-bold text-[15px] transition-colors shadow-lg min-w-[155px]"
                onClick={() => trackClick(product.id, "telegram_click")}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="shrink-0" aria-hidden="true">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.01 13.585l-2.94-.918c-.64-.203-.653-.64.136-.954l11.5-4.43c.533-.194 1-.131.818.938z"/>
                </svg>
                <span className="leading-snug">Написать в<br/>Telegram ✈️</span>
              </a>

              {/* MAX */}
              <a
                href="https://tinyurl.com/5h4bbmkr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white hover:bg-[#fef1f6] text-primary px-6 py-4 rounded-full font-semibold text-[14px] transition-colors min-w-[140px]"
              >
                <img src="https://max.ru/favicon.ico" width={24} height={24} alt="" aria-hidden="true" className="shrink-0" />
                <span className="leading-snug">Написать в<br/>MAX</span>
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
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
  return (
    <>
      <YmTracker />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/catalog" component={CatalogPage} />
        <Route path="/product/:id" component={ProductPage} />
        <Route>
          <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
            <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Страница не найдена</h1>
            <a href="/" className="text-primary font-bold hover:underline">Вернуться на главную</a>
          </div>
        </Route>
      </Switch>
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
