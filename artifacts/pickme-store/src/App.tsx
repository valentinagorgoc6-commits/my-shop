import React, { useState, useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, useParams } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminPage from "@/pages/admin";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, Star, Check, Camera, DollarSign, Clock, ArrowRight, X, Moon, Sun } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
// api-client-react generated hooks available if needed
import { useTheme, type ThemeGender } from "@/context/ThemeContext";

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

// ─── Custom products fetch hook (supports gender, giftSuggestion, random, limit) ──
type ProductsParams = {
  category?: string;
  gender?: string;
  giftSuggestion?: boolean;
  random?: boolean;
  limit?: number;
  featured?: boolean;
};

function useProductsFetch(params: ProductsParams, enabled = true) {
  const key = ["products-fetch", params];
  return useQuery<Array<Record<string, unknown>>>({
    queryKey: key,
    queryFn: async () => {
      const url = new URL("/api/products", window.location.origin);
      if (params.category) url.searchParams.set("category", params.category);
      if (params.gender) url.searchParams.set("gender", params.gender);
      if (params.giftSuggestion) url.searchParams.set("giftSuggestion", "true");
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
const themeContent = {
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
      title: <>Привет, я Валентинка ♡</>,
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
  const { gender, mode } = useTheme();
  if (gender === "male") {
    const justifyClass = align === "left" ? "justify-start" : align === "responsive" ? "justify-center md:justify-start" : "justify-center";
    return (
      <div className={`flex items-center ${justifyClass} mb-4 w-full`}>
        <div className="h-[1px] w-16 md:w-20" style={{ background: "linear-gradient(to right, transparent, var(--pm-primary-border))" }} />
        <div className="w-1.5 h-1.5 rounded-full mx-3" style={{ background: "var(--pm-primary)", opacity: mode === "dark" ? 0.6 : 0.3 }} />
        <div className="h-[1px] w-16 md:w-20" style={{ background: "linear-gradient(to left, transparent, var(--pm-primary-border))" }} />
      </div>
    );
  }
  const justifyClass = align === "left" ? "justify-start" : align === "responsive" ? "justify-center md:justify-start" : "justify-center";
  return (
    <div className={`flex items-center ${justifyClass} gap-3 mb-3`}>
      <span style={{ color: "var(--pm-primary)" }} className="text-base md:text-xl">✦</span>
      <div style={{ background: `linear-gradient(to right, transparent, var(--pm-primary))` }} className="h-[2px] w-12 md:w-20 opacity-60" />
      <span style={{ color: "var(--pm-primary)" }} className="text-lg md:text-3xl">💗</span>
      <div style={{ background: `linear-gradient(to left, transparent, var(--pm-primary))` }} className="h-[2px] w-12 md:w-20 opacity-60" />
      <span style={{ color: "var(--pm-primary)" }} className="text-base md:text-xl">✦</span>
    </div>
  );
}

// -- Section Title --
function SectionTitle({ title, sub, titleNode, id }: { title?: string; sub?: React.ReactNode; titleNode?: React.ReactNode; id?: string }) {
  return (
    <motion.div
      initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.05 }} variants={fadeInUp}
      className="text-center mb-10"
      id={id}
    >
      <DecorBar />
      <h2 className="font-serif text-[32px] md:text-[44px] font-bold text-foreground mb-2">
        {titleNode ?? title}
      </h2>
      {sub != null && <p className="font-script text-[22px] md:text-[24px] font-medium" style={{ color: "var(--pm-primary)" }}>{sub}</p>}
    </motion.div>
  );
}

// -- Logo Word --
function LogoWord() {
  return (
    <span className="text-[26px] font-bold no-underline tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
      <span style={{ color: "var(--pm-primary)" }}>Pick</span>
      <span className="text-[30px] font-semibold" style={{ color: "var(--pm-primary)", fontFamily: "'Caveat', cursive" }}>Me</span>
      <span style={{ color: "var(--pm-text-heading, var(--foreground))" }}> Store</span>
    </span>
  );
}

// -- Splash Screen --
function SplashScreen({ onSelect }: { onSelect: (g: ThemeGender) => void }) {
  const [leaving, setLeaving] = useState(false);

  const choose = (g: ThemeGender) => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => onSelect(g), 420);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.42, ease: "easeInOut" }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #fff5f9 0%, #faf8ff 50%, #f5f9ff 100%)" }}
    >
      <div className="text-center max-w-lg w-full">
        <div className="mb-1">
          <span className="font-serif text-[40px] font-bold">
            <span style={{ color: "#f04586" }}>Pick</span>
            <span className="font-script text-[44px] font-semibold" style={{ color: "#f76da5" }}>Me</span>
            <span style={{ color: "#2d1520" }}> Store</span>
          </span>
        </div>
        <p className="font-script text-[22px] font-medium mb-10" style={{ color: "#b06090" }}>
          Выбери свой стиль ✨
        </p>

        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
          <button
            onClick={() => choose("female")}
            disabled={leaving}
            className="w-[200px] rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 hover:-translate-y-2 border-2 focus:outline-none active:scale-95"
            style={{
              background: "rgba(240,69,134,0.04)",
              borderColor: "rgba(240,69,134,0.25)",
              boxShadow: "0 4px 20px rgba(240,69,134,0.08)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 16px 48px rgba(240,69,134,0.22)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#f04586";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(240,69,134,0.08)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(240,69,134,0.25)";
            }}
          >
            <div className="flex justify-center mb-4">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="20" r="12" stroke="#f04586" strokeWidth="1.75"/>
                <line x1="24" y1="32" x2="24" y2="44" stroke="#f04586" strokeWidth="1.75" strokeLinecap="round"/>
                <line x1="17" y1="38" x2="31" y2="38" stroke="#f04586" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="font-serif text-[20px] font-bold" style={{ color: "#f04586" }}>Для неё</div>
          </button>

          <button
            onClick={() => choose("male")}
            disabled={leaving}
            className="w-[200px] rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 hover:-translate-y-2 border-2 focus:outline-none active:scale-95"
            style={{
              background: "rgba(0,116,196,0.04)",
              borderColor: "rgba(0,116,196,0.25)",
              boxShadow: "0 4px 20px rgba(0,116,196,0.08)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 16px 48px rgba(0,116,196,0.22)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#0074c4";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(0,116,196,0.08)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,116,196,0.25)";
            }}
          >
            <div className="flex justify-center mb-4">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="28" r="12" stroke="#0074c4" strokeWidth="1.75"/>
                <line x1="29.5" y1="18.5" x2="42" y2="6" stroke="#0074c4" strokeWidth="1.75" strokeLinecap="round"/>
                <polyline points="33,6 42,6 42,15" stroke="#0074c4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <div className="font-serif text-[20px] font-bold" style={{ color: "#0074c4" }}>Для него</div>
          </button>
        </div>

        <p className="mt-8 text-[12px] text-center" style={{ color: "#aaa" }}>
          Не переживай — переключиться можно в любой момент в меню
        </p>
      </div>
    </motion.div>
  );
}

// -- Header --
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { gender, mode, setGender, toggleMode } = useTheme();
  const [location, navigate] = useLocation();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("/#")) return;
    const hash = href.slice(1); // "#about"
    if (location === "/") {
      e.preventDefault();
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
    } else {
      e.preventDefault();
      navigate("/");
      setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

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
    { name: "Обо мне", href: "/#about" },
    { name: "Отзывы", href: "/#reviews" },
    { name: "FAQ", href: "/#faq" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 flex items-center justify-between ${
          scrolled ? "glass-card shadow-[0_4px_24px_rgba(0,0,0,0.06)]" : "bg-transparent"
        }`}
        style={scrolled ? { borderBottom: "1px solid color-mix(in srgb, var(--pm-primary) 20%, transparent)" } : undefined}
      >
        <a href="/" className="no-underline flex flex-col leading-none cursor-pointer" data-testid="link-logo">
          <LogoWord />
          <span className="text-[10px] text-muted-foreground font-sans font-normal mt-0.5 tracking-normal">ПикМи — магазин брендовых вещей</span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-3">
          <ul className="flex gap-5 list-none m-0 p-0 items-center mr-1">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-[12px] font-semibold text-muted-foreground hover:text-primary transition-colors tracking-wide"
                  data-testid={`link-nav-${link.href.replace("#", "")}`}
                >
                  {link.name}
                </a>
              </li>
            ))}
            {gender === "female" && (
              <>
                <li>
                  <a
                    href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] font-semibold text-muted-foreground hover:text-primary transition-colors tracking-wide flex items-center gap-1"
                    data-testid="link-nav-avito"
                  >
                    <img src="https://www.avito.ru/favicon.ico" width={14} height={14} alt="" aria-hidden="true" className="shrink-0" />
                    Авито
                  </a>
                </li>
                <li>
                  <a
                    href="https://tinyurl.com/5h4bbmkr"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] font-semibold text-muted-foreground hover:text-primary transition-colors tracking-wide flex items-center gap-1"
                  >
                    <img src="https://max.ru/favicon.ico" width={14} height={14} alt="" aria-hidden="true" className="shrink-0" />
                    MAX
                  </a>
                </li>
              </>
            )}
          </ul>

          {/* Female: "Для него" */}
          {gender === "female" && (
            <button
              onClick={() => setGender("male")}
              className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold transition-colors"
              style={{ color: "#0074c4", background: "rgba(0,100,190,0.06)", border: "1px solid rgba(0,100,190,0.15)" }}
              title="Мужская коллекция"
            >
              <svg width="14" height="14" viewBox="0 0 48 48" fill="none"><circle cx="20" cy="28" r="12" stroke="currentColor" strokeWidth="3"/><line x1="29.5" y1="18.5" x2="42" y2="6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><polyline points="33,6 42,6 42,15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              <span>Для него</span>
            </button>
          )}

          {/* Male: "Для неё" + mode toggle */}
          {gender === "male" && (
            <>
              <button
                onClick={() => setGender("female")}
                className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold transition-colors"
                style={{ color: "#f04586", background: "rgba(240,69,134,0.06)", border: "1px solid rgba(240,69,134,0.15)" }}
                title="Женская коллекция"
              >
                <svg width="14" height="14" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="20" r="12" stroke="currentColor" strokeWidth="3"/><line x1="24" y1="32" x2="24" y2="44" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><line x1="17" y1="38" x2="31" y2="38" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                <span>Для неё</span>
              </button>
              <button
                onClick={toggleMode}
                className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold transition-colors"
                style={{ background: "var(--pm-surface-alt)", border: "1px solid var(--pm-border)", color: "var(--pm-text-body)" }}
                title={mode === "light" ? "Переключить на тёмную тему" : "Переключить на светлую тему"}
              >
                {mode === "light"
                  ? <><Moon size={13} /><span>Тёмная</span></>
                  : <><Sun size={13} /><span>Светлая</span></>
                }
              </button>
            </>
          )}

          <a
            href="https://t.me/V_Limerence"
            target="_blank"
            rel="noreferrer"
            className="btn-glow bg-primary hover:bg-[var(--pm-primary-hover)] text-white px-6 py-2.5 rounded-full font-semibold text-sm"
            data-testid="button-nav-contact"
          >
            Написать мне
          </a>
        </nav>

        {/* Mobile: icon toggles + burger */}
        <div className="md:hidden flex items-center gap-2">
          {gender === "female" && (
            <button
              onClick={() => setGender("male")}
              className="p-2 rounded-lg text-[17px] transition-colors"
              style={{ color: "#0074c4", background: "rgba(0,100,190,0.08)", border: "1px solid rgba(0,100,190,0.18)" }}
              aria-label="Мужская коллекция"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none"><circle cx="20" cy="28" r="12" stroke="currentColor" strokeWidth="3"/><line x1="29.5" y1="18.5" x2="42" y2="6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><polyline points="33,6 42,6 42,15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
            </button>
          )}
          {gender === "male" && (
            <>
              <button
                onClick={() => setGender("female")}
                className="p-2 rounded-lg text-[17px] transition-colors"
                style={{ color: "#f04586", background: "rgba(240,69,134,0.08)", border: "1px solid rgba(240,69,134,0.18)" }}
                aria-label="Женская коллекция"
              >
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="20" r="12" stroke="currentColor" strokeWidth="3"/><line x1="24" y1="32" x2="24" y2="44" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><line x1="17" y1="38" x2="31" y2="38" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
              </button>
              <button
                onClick={toggleMode}
                className="p-2 rounded-lg transition-colors"
                style={{ color: "var(--pm-primary)", background: "var(--pm-primary-bg)", border: "1px solid var(--pm-primary-border)" }}
                aria-label={mode === "light" ? "Тёмная тема" : "Светлая тема"}
              >
                {mode === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </>
          )}
          <button
            className="p-2 text-primary"
            onClick={() => setMobileOpen(true)}
            aria-label="Открыть меню"
            data-testid="button-mobile-menu"
          >
            <Menu size={28} />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-[300px] sm:w-[340px] flex flex-col"
              style={{
                background: "linear-gradient(160deg, var(--pm-surface) 0%, var(--pm-bg-page) 100%)",
                borderLeft: "1px solid var(--pm-primary-border)",
                boxShadow: "-8px 0 48px color-mix(in srgb, var(--pm-primary) 12%, transparent)",
              }}
            >
              {/* Panel header */}
              <div
                className="flex items-center justify-between px-7 pt-7 pb-6"
                style={{ borderBottom: "1px solid color-mix(in srgb, var(--pm-primary) 15%, transparent)" }}
              >
                <a href="/" className="no-underline cursor-pointer" onClick={() => setMobileOpen(false)}>
                  <LogoWord />
                </a>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-9 h-9 rounded-full text-primary flex items-center justify-center transition-colors"
                  style={{ background: "var(--pm-surface-alt, rgba(255,255,255,0.6))" }}
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
                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { setMobileOpen(false); handleNavClick(e, link.href); }}
                    className="flex items-center gap-3 px-4 py-4 rounded-2xl font-serif text-[20px] font-bold text-foreground hover:text-primary hover:bg-[var(--pm-primary-bg)] transition-all"
                  >
                    <span className="text-primary text-sm">✦</span>
                    {link.name}
                  </motion.a>
                ))}

                {gender === "female" && (
                  <>
                    <motion.a
                      href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661"
                      target="_blank"
                      rel="noreferrer"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + navLinks.length * 0.07 }}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-4 rounded-2xl font-serif text-[20px] font-bold text-muted-foreground hover:text-primary hover:bg-[var(--pm-primary-bg)] transition-all"
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
                      className="flex items-center gap-3 px-4 py-4 rounded-2xl font-serif text-[20px] font-bold text-muted-foreground hover:text-primary hover:bg-[var(--pm-primary-bg)] transition-all"
                    >
                      <img src="https://max.ru/favicon.ico" width={18} height={18} alt="" aria-hidden="true" className="shrink-0" />
                      MAX
                    </motion.a>
                  </>
                )}

                {/* Mobile menu gender/mode switches */}
                <div className="mt-4 flex flex-col gap-2 px-1">
                  {gender === "female" ? (
                    <button
                      onClick={() => { setGender("male"); setMobileOpen(false); }}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-[15px] font-semibold text-left transition-colors"
                      style={{ color: "#0074c4", background: "rgba(0,100,190,0.06)", border: "1px solid rgba(0,100,190,0.15)" }}
                    >
                      <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><circle cx="20" cy="28" r="12" stroke="currentColor" strokeWidth="3"/><line x1="29.5" y1="18.5" x2="42" y2="6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><polyline points="33,6 42,6 42,15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                      Переключиться на мужскую тему
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => { setGender("female"); setMobileOpen(false); }}
                        className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-[15px] font-semibold text-left transition-colors"
                        style={{ color: "#f04586", background: "rgba(240,69,134,0.06)", border: "1px solid rgba(240,69,134,0.15)" }}
                      >
                        <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="20" r="12" stroke="currentColor" strokeWidth="3"/><line x1="24" y1="32" x2="24" y2="44" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><line x1="17" y1="38" x2="31" y2="38" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                        Переключиться на женскую тему
                      </button>
                      <button
                        onClick={() => { toggleMode(); setMobileOpen(false); }}
                        className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-[15px] font-semibold text-left transition-colors"
                        style={{ background: "var(--pm-surface-alt)", border: "1px solid var(--pm-border)", color: "var(--pm-text-body)" }}
                      >
                        <span>{mode === "light" ? "☽" : "☀"}</span>
                        {mode === "light" ? "Тёмная тема" : "Светлая тема"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Bottom CTA */}
              <div
                className="px-7 pb-10 pt-4"
                style={{ borderTop: "1px solid color-mix(in srgb, var(--pm-primary) 15%, transparent)" }}
              >
                <a
                  href="https://t.me/V_Limerence"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="btn-glow-strong block w-full bg-primary text-white px-6 py-4 rounded-2xl font-bold text-center text-[16px] tracking-wide"
                >
                  Написать мне ✈️
                </a>
                <p className="font-script text-[14px] text-center mt-3" style={{ color: "var(--pm-primary)" }}>на связи 24/7 💕</p>
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
  const { gender } = useTheme();
  const isMale = gender === "male";
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
    <section ref={ref} className="flex items-center px-6 relative overflow-hidden min-h-fit md:min-h-[100dvh] pt-20 pb-4 md:pb-12">
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
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={fadeInUp}
          className="text-center md:text-left"
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
                <a href="/catalog" className="btn-glow inline-flex items-center justify-center text-white px-8 py-4 rounded-full font-bold text-base" style={{ background: "var(--pm-primary)" }} data-testid="button-hero-catalog">
                  {themeContent.male.hero.ctaPrimary}
                </a>
                <a href="#about" className="inline-flex items-center justify-center bg-transparent border-2 text-muted-foreground px-7 py-4 rounded-full font-bold text-[15px] transition-all" style={{ borderColor: "var(--pm-primary-border)" }}>
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
        </motion.div>

        {/* Right side — photo column (both themes) */}
        <motion.div
          style={{ y: badgesY }}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.8 }}
          className="relative mt-12 md:mt-0 hidden md:block"
        >
          {/* Female: single tall photo with floating badges */}
          {!isMale && (
            <>
              <div className="w-full aspect-[3/4] max-w-[440px] mx-auto rounded-3xl relative overflow-hidden" style={{ boxShadow: "0 24px 64px color-mix(in srgb, var(--pm-primary) 18%, transparent), 0 8px 24px rgba(61,32,48,0.08)" }}>
                <img src="/hero-photo.png" alt="PickMe Store — модная одежда" className="w-full h-full object-cover object-center" />
              </div>
              <motion.span animate={{ y: [0, -10, 0], opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-4 right-0 text-2xl pointer-events-none select-none" style={{ color: "var(--pm-primary)" }} aria-hidden="true">✦</motion.span>
              <motion.span animate={{ y: [0, -8, 0], opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-24 -right-2 text-xl pointer-events-none select-none" style={{ color: "var(--pm-primary)" }} aria-hidden="true">♡</motion.span>
              <motion.span animate={{ y: [0, -12, 0], opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute top-1/3 -left-2 text-lg pointer-events-none select-none" style={{ color: "var(--pm-primary)" }} aria-hidden="true">✿</motion.span>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-4 -right-4 md:-right-8 glass-card px-7 py-4 rounded-2xl text-base font-bold" style={{ color: "var(--pm-primary-hover)", boxShadow: "0 8px 24px color-mix(in srgb, var(--pm-primary) 22%, transparent)" }}>
                💯 Только оригиналы
              </motion.div>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }} className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-10 glass-card px-7 py-4 rounded-2xl text-base font-bold" style={{ color: "var(--pm-primary-hover)", boxShadow: "0 8px 24px color-mix(in srgb, var(--pm-primary) 22%, transparent)" }}>
                Живые фото 📸
              </motion.div>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-8 -right-4 md:-right-8 glass-card px-7 py-4 rounded-2xl text-base font-bold" style={{ color: "var(--pm-primary-hover)", boxShadow: "0 8px 24px color-mix(in srgb, var(--pm-primary) 22%, transparent)" }}>
                Низкие цены 💰
              </motion.div>
            </>
          )}

          {/* Male: same photo, badges in male style */}
          {isMale && (
            <>
              <div className="w-full aspect-[3/4] max-w-[440px] mx-auto rounded-3xl relative overflow-hidden" style={{ boxShadow: "0 24px 48px rgba(0,0,0,0.32), 0 8px 20px rgba(0,0,0,0.18)", border: "1px solid var(--pm-primary-border)" }}>
                <img src="/hero-photo-male.png" alt="PickMe Store" className="w-full h-full object-cover object-center" />
              </div>

              {/* Floating badges — male style: glass with blur */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 md:-right-8 px-5 py-3 rounded-2xl text-[13px] font-bold"
                style={{ background: "color-mix(in srgb, var(--pm-card-bg) 75%, transparent)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid var(--pm-primary-border)", color: "var(--pm-primary)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
              >
                ✓ Только оригиналы
              </motion.div>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
                className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-10 px-5 py-3 rounded-2xl text-[13px] font-bold"
                style={{ background: "color-mix(in srgb, var(--pm-card-bg) 75%, transparent)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid var(--pm-primary-border)", color: "var(--pm-primary)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
              >
                До −70% от розницы
              </motion.div>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                className="absolute bottom-8 -right-4 md:-right-8 px-5 py-3 rounded-2xl text-[13px] font-bold"
                style={{ background: "color-mix(in srgb, var(--pm-card-bg) 75%, transparent)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid var(--pm-primary-border)", color: "var(--pm-primary)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
              >
                Доставка по России
              </motion.div>
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
      <span className="font-script text-[28px] md:text-[40px] font-medium" style={{ color: "var(--pm-primary)" }}>Me</span>?
    </>
  );

  return (
    <section className="pt-8 pb-6 md:py-14 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionTitle titleNode={whyTitle} sub={isMale ? undefined : "мы не такие, мы особенные 💅"} />

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.05 }} variants={staggerContainer}
          className="grid grid-cols-2 gap-4 md:gap-6"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              className="why-card-hover glass-card rounded-2xl md:rounded-3xl p-5 md:p-8 relative overflow-hidden flex flex-col items-center text-center group"
              style={{ border: "1px solid var(--pm-primary-border)" }}
            >
              <div className="why-card-glow absolute -top-[30px] left-1/2 -translate-x-1/2 w-[160px] h-[160px] pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--pm-primary) 18%, transparent) 0%, transparent 70%)" }} />
              <div className="w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-3 md:mb-5" style={{ border: "1.5px solid var(--pm-primary-border)", background: "color-mix(in srgb, var(--pm-primary) 6%, transparent)" }}>
                <span className="[&>svg]:w-5 [&>svg]:h-5 md:[&>svg]:w-7 md:[&>svg]:h-7">{f.icon}</span>
              </div>
              <h3 className="font-serif text-[15px] md:text-[20px] font-bold text-foreground leading-tight mb-1 md:mb-2">{f.title}</h3>
              <p className="hidden md:block text-[14px] leading-relaxed text-muted-foreground">{f.desc}</p>
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
    <div ref={cardRootRef} className="product-card-hover rounded-2xl overflow-hidden border border-primary/10 shadow-[0_4px_12px_rgba(61,32,48,0.06)] flex flex-col h-full" style={{ background: "var(--pm-card-bg, white)" }}>
      {/* Carousel container */}
      <div
        ref={carouselRef}
        className="relative w-full aspect-[3/4] overflow-hidden group flex-shrink-0 bg-gradient-to-br from-[var(--pm-primary-bg)] to-secondary"
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
              background: "var(--pm-primary)",
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
                className="flex items-center gap-1.5 w-full text-left text-[12px] font-semibold text-primary/80 hover:text-primary transition-colors py-1.5 px-2.5 rounded-lg hover:bg-[var(--pm-primary-bg)]"
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
                  className="mt-1 rounded-xl overflow-hidden"
                  style={{ border: "1px solid var(--pm-primary-border)", animation: "fadeIn 200ms ease" }}
                >
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
                          <tr
                            key={row.cm}
                            style={{
                              background: isMatch ? "color-mix(in srgb, var(--pm-primary) 18%, var(--pm-card-bg))" : i % 2 === 0 ? "var(--pm-card-bg)" : "var(--pm-surface-alt)",
                              borderBottom: i < arr.length - 1 ? "1px solid var(--pm-primary-border)" : "none",
                              boxShadow: isMatch ? "inset 3px 0 0 var(--pm-primary)" : "none",
                            }}
                          >
                            <td style={{ padding: "5px 10px", textAlign: "center", fontWeight: isMatch ? 700 : 400, color: isMatch ? "var(--pm-primary)" : "var(--pm-text-body)" }}>
                              {row.cm}
                            </td>
                            <td style={{ padding: "5px 10px", textAlign: "center", fontWeight: isMatch ? 700 : 400, color: isMatch ? "var(--pm-primary)" : "var(--pm-text-body)" }}>
                              {row.ru}
                              {isMatch && <span style={{ marginLeft: 4, fontSize: 9 }}>◀</span>}
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
            <button
              disabled
              className="px-4 py-2 rounded-full bg-secondary text-muted-foreground text-[13px] font-bold cursor-not-allowed"
            >
              Продано
            </button>
          ) : product.badge === "reserved" ? (
            <button
              disabled
              className="px-4 py-2 rounded-full text-[13px] font-bold cursor-not-allowed"
              style={{ background: "color-mix(in srgb, #f97316 15%, var(--pm-card-bg, #fff))", color: "#f97316" }}
            >
              Забронировано
            </button>
          ) : (
            <a
              href={`/product/${product.id}`}
              className="w-10 h-10 rounded-full text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
              style={{ background: "var(--pm-primary-bg)" }}
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
              style={{ background: "var(--pm-surface-alt, #f3f4f6)", color: "var(--pm-text-muted, #9ca3af)", filter: "grayscale(1)", opacity: 0.5, pointerEvents: "none", cursor: "not-allowed" }}
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
              className="flex items-center gap-2 px-4 py-2 rounded-full text-primary text-[13px] font-bold hover:bg-primary hover:text-white transition-colors"
              style={{ background: "var(--pm-primary-bg)" }}
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
              className="flex items-center gap-2 px-4 py-2 rounded-full text-primary text-[13px] font-bold hover:bg-primary hover:text-white transition-colors"
              style={{ background: "var(--pm-primary-bg)" }}
              onClick={() => trackClick(product.id, "telegram_click")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0" aria-hidden="true">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.01 13.585l-2.94-.918c-.64-.203-.653-.64.136-.954l11.5-4.43c.533-.194 1-.131.818.938z"/>
              </svg>
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

// -- Compact Card (mobile) --
function CompactCard({ product }: { product: { id: number; brand: string; name: string; price: number; badge?: string | null; imageUrl: string; imageUrls?: string[]; createdAt: string } }) {
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
          <img src={image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
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
        {product.badge === "new" && !isSold && !isReserved && (
          <div style={{ position: "absolute", top: 6, left: 6, zIndex: 10, padding: "2px 7px", borderRadius: 20, background: "var(--pm-primary)", color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em" }}>NEW</div>
        )}
      </div>
      <div style={{ padding: "6px 8px 8px", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--pm-primary)", letterSpacing: "0.06em", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.brand}</p>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--pm-text-heading)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>{product.name}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, marginTop: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: isSold ? "var(--pm-text-muted, #9ca3af)" : "var(--pm-text-heading)", textDecoration: isSold ? "line-through" : "none" }}>
            {product.price.toLocaleString("ru-RU")} ₽
          </span>
          {isSold ? (
            <span className="bg-secondary text-muted-foreground" style={{ fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 20 }}>Продано</span>
          ) : isReserved ? (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 20, background: "color-mix(in srgb, #f97316 15%, var(--pm-card-bg, #fff))", color: "#f97316" }}>Бронь</span>
          ) : (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "var(--pm-primary)", color: "#fff" }}>Купить</span>
          )}
        </div>
      </div>
    </a>
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
    <div style={{ background: "var(--pm-surface-alt)", borderRadius: 16, padding: 16, margin: "0 12px 12px", transition: "background 0.3s ease" }}>
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
  const featured = featuredProducts ? (featuredProducts as Array<Record<string, unknown>>).slice(0, 6) : [];

  return (
    <section id="catalog" className="pt-8 pb-6 md:pt-24 md:pb-14">
      <div className="max-w-[1100px] mx-auto">
        {/* Desktop: full section title */}
        <div className="hidden md:block px-6">
          <SectionTitle title="Каталог" sub={gender === "female" ? "тут все мои сокровища 🛍️" : undefined} />
        </div>

        {/* Mobile: subtitle + CTA + category sections */}
        <div className="md:hidden">
          <div className="text-center mb-5 px-6">
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
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="grid grid-cols-3 gap-6"
            >
              {(featured as Parameters<typeof ProductCard>[0]["product"][]).map((product) => (
                <motion.div key={(product as {id: number}).id} variants={fadeInUp} className="h-full">
                  <ProductCard product={product as Parameters<typeof ProductCard>[0]["product"]} />
                </motion.div>
              ))}
            </motion.div>
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
  const { gender: themeGender } = useTheme();
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
    gender: genderQueryParam,
    giftSuggestion: giftOnly || undefined,
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
      <div className="noise-overlay" aria-hidden="true" />
      <Header />
      <main className="page-gradient min-h-screen">
        <section className="py-16 px-6">
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
                      : "bg-transparent border-secondary text-muted-foreground hover:border-[var(--pm-primary)] hover:text-primary"
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
                      : "bg-transparent border-secondary text-muted-foreground hover:border-[var(--pm-primary)] hover:text-primary"
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
                      : "bg-transparent text-muted-foreground hover:text-primary"
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
              <div className="mb-10 text-center relative py-8">
                <div className="absolute inset-[-30%] pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 50% at 50% 50%, color-mix(in srgb, var(--pm-gift-accent, var(--pm-primary)) 25%, transparent), transparent 70%)" }} />
                <p className="relative text-[16px] md:text-[18px] mx-auto whitespace-nowrap" style={{ color: "var(--pm-text-body)", lineHeight: 1.7 }}>
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
                <div className="w-full rounded-3xl overflow-hidden flex flex-col md:flex-row"
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
  const { gender } = useTheme();
  const c = gender === "male" ? themeContent.male.about : themeContent.female.about;

  return (
    <section id="about" className="py-14 px-6">
      <div className="max-w-[900px] mx-auto grid md:grid-cols-[300px_1fr] gap-12 md:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-[280px] mx-auto md:max-w-none"
        >
          <div className="about-photo-frame w-full aspect-[9/16] rounded-3xl overflow-hidden">
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
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.7 }}
        >
          <DecorBar align="responsive" />
          {c.label && (
            <p className="text-[11px] font-bold uppercase tracking-[1.5px] mb-2" style={{ color: "var(--pm-primary)" }}>{c.label}</p>
          )}
          <h2 className="font-serif text-[32px] md:text-[40px] font-bold text-foreground mb-2">
            {c.title}
          </h2>
          {c.sub && (
            <p className="font-script text-[22px] md:text-[24px] font-medium mb-6" style={{ color: "var(--pm-primary)" }}>{c.sub}</p>
          )}

          <div className="space-y-4 text-[16px] leading-[1.8] text-muted-foreground font-sans">
            {c.paragraphs.map((p, i) => <p key={i} style={{ fontFamily: "var(--pm-font-body, var(--font-sans))", fontStyle: "normal" }}>{p}</p>)}
          </div>

        </motion.div>
      </div>
    </section>
  );
}

// -- Gift Section (male only) --
function GiftSection() {
  const { gender } = useTheme();
  const { data: gifts } = useProductsFetch({ giftSuggestion: true, limit: 4 }, gender === "male");
  if (gender !== "male") return null;
  if (!gifts || gifts.length === 0) return null;

  type GiftProduct = { id: number; brand: string; name: string; imageUrl: string; imageUrls?: string[] };
  const items = gifts as unknown as GiftProduct[];

  return (
    <section className="py-8 px-6">
      <div className="max-w-[900px] mx-auto">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.05 }} variants={fadeInUp}
          className="flex flex-col md:flex-row items-center gap-10 rounded-2xl"
          style={{ padding: "3rem 2.5rem", background: "var(--pm-gift-bg)", border: "1px solid var(--pm-gift-border)" }}
        >
          {/* Left — text */}
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase mb-4" style={{ letterSpacing: "2px", color: "var(--pm-text-muted)" }}>
              Идея для подарка
            </p>
            <h2 className="text-[32px] font-semibold mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "var(--pm-text-heading)" }}>
              Подарок для неё
            </h2>
            <p className="text-[15px] mb-3 max-w-lg" style={{ lineHeight: 1.6, color: "var(--pm-text-muted)" }}>
              Не знаешь что подарить? Отправь ей ссылку — она увидит подарок и описание без цены.
            </p>
            <p className="text-[12px] mb-8" style={{ color: "var(--pm-text-muted)", opacity: 0.6 }}>
              Стильно, лично, без неловких моментов
            </p>
            <a
              href="/catalog?gift=true"
              className="inline-flex items-center gap-2 font-semibold text-[15px] transition-all hover:scale-105"
              style={{
                padding: "14px 36px",
                borderRadius: 20,
                color: "var(--pm-gift-accent, var(--pm-primary))",
                background: "color-mix(in srgb, var(--pm-gift-accent, var(--pm-primary)) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--pm-gift-accent, var(--pm-primary)) 25%, transparent)",
              }}
            >
              Подобрать подарок
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
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
                    ? <img src={img} alt={p.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: "var(--pm-primary-light)" }}>🎁</div>
                  }
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// -- How It Works --
function HowItWorks() {
  const { gender } = useTheme();
  const isMale = gender === "male";
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
      <section className="py-14 px-6">
        <div className="max-w-[1100px] mx-auto text-center">
          <SectionTitle title="Как это работает" />

          {/* Desktop: horizontal with chevrons */}
          <div className="hidden md:flex items-stretch justify-center">
            {steps.map((step, i) => (
              <React.Fragment key={i}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.05 }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="flex-1 rounded-2xl p-6 text-left flex flex-col gap-4"
                  style={{ background: "var(--pm-card-bg)", border: "1px solid var(--pm-border)" }}
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ border: "1.5px solid var(--pm-primary)", color: "var(--pm-primary)" }}>
                    {maleIcons[step.num]}
                  </div>
                  <div>
                    <h3 className="font-serif text-[17px] font-bold text-foreground mb-1">{step.title}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.05 }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="w-full rounded-2xl p-5 text-left flex items-start gap-4"
                  style={{ background: "var(--pm-card-bg)", border: "1px solid var(--pm-border)" }}
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ border: "1.5px solid var(--pm-primary)", color: "var(--pm-primary)" }}>
                    {maleIcons[step.num]}
                  </div>
                  <div>
                    <h3 className="font-serif text-[17px] font-bold text-foreground mb-1">{step.title}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05 }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 rounded-full text-white font-serif text-[22px] font-bold flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, var(--pm-primary), var(--pm-primary-hover))", boxShadow: "0 8px 24px color-mix(in srgb, var(--pm-primary) 30%, transparent)" }}>
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
  const { gender } = useTheme();
  const isMale = gender === "male";
  const reviews = isMale ? [
    { text: "Спасибо большое за брюки! Замечательный продавец — ответила на все вопросы и очень быстро отправила посылку!", author: "Еленишна", source: "Авито" },
    { text: "Суперр!! Спасибо вам, Валентина. Все соответствует", author: "Чика", source: "Авито" },
    { text: "Спасибо большое за чудесное платье!", author: "Наталья", source: "Авито" },
  ] : [
    { text: "Спасибо большое за брюки! Замечательный продавец — ответила на все вопросы и очень быстро отправила посылку!", author: "Еленишна", source: "Авито" },
    { text: "Суперр!! Спасибо вам, Валентина. Все соответствует", author: "Чика", source: "Авито" },
    { text: "Спасибо большое за чудесное платье!", author: "Наталья", source: "Авито" },
  ];

  return (
    <section id="reviews" className="pt-14 pb-8 px-6">
      <div className="max-w-[900px] mx-auto text-center">
        <SectionTitle title="Отзывы" sub={isMale ? undefined : "нас уже выбрали 💕"} />

        {isMale ? (
          <>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.05 }} variants={staggerContainer}
              className="grid gap-5 md:grid-cols-3 max-w-[960px] mx-auto"
            >
              {reviews.map((r, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="rounded-2xl p-6 text-left flex flex-col"
                  style={{ background: "var(--pm-card-bg)", border: "1px solid var(--pm-border)" }}
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
                </motion.div>
              ))}
            </motion.div>
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
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.05 }} variants={staggerContainer}
            className="grid gap-6 md:grid-cols-3"
          >
            {reviews.map((r, i) => (
              <motion.a
                key={i}
                variants={fadeInUp}
                href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661"
                target="_blank"
                rel="noopener noreferrer"
                className="review-card group rounded-2xl p-8 text-left border border-primary/10 shadow-[0_4px_12px_rgba(61,32,48,0.06)] flex flex-col transition-all duration-200 hover:shadow-[0_12px_32px_rgba(61,32,48,0.14)] hover:-translate-y-1"
                style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
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
              </motion.a>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

// -- FAQ Section --
function FAQ() {
  const { gender } = useTheme();
  const isMale = gender === "male";
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

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.05 }} transition={{ duration: 0.6 }}>
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
        </motion.div>
      </div>
    </section>
  );
}

// -- Final CTA Section --
function FinalCTA() {
  const { gender } = useTheme();
  const c = gender === "male" ? themeContent.male.cta : themeContent.female.cta;
  const isMale = gender === "male";

  return (
    <section className={`px-6 section-cta relative overflow-hidden text-center ${isMale ? "py-16" : "pt-16 pb-24"}`}>
      {/* Male-only glow */}
      {isMale && <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 160% at 50% 110%, color-mix(in srgb, var(--pm-primary) 20%, transparent), transparent 70%)" }} />}

      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.05 }} variants={fadeInUp}
        className="max-w-[700px] mx-auto relative z-10"
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
            <p className="font-serif text-[18px] md:text-[20px] italic mb-4 max-w-[580px] mx-auto" style={{ color: "var(--pm-text-body)", fontStyle: "italic" }}>
              «{c.quote}»
            </p>
            <p className="text-[16px] font-medium mb-10 text-muted-foreground">{c.sub}</p>
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
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-[15px] transition-all hover:scale-105"
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
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-[15px] transition-all hover:scale-105"
              style={{ background: "var(--pm-primary-bg)", color: "var(--pm-primary-hover)" }}
              data-testid="button-final-max">
              <img src="https://max.ru/favicon.ico" width={18} height={18} alt="" aria-hidden="true" className="shrink-0" />
              MAX
            </a>
          </div>
        )}
      </motion.div>
    </section>
  );
}

// -- Footer --
function Footer() {
  const { gender } = useTheme();
  const isMale = gender === "male";
  return (
    <footer
      className="py-10 px-6 text-center"
      style={{ background: isMale ? "var(--pm-surface)" : "hsl(var(--foreground))" }}
    >
      
      <div className="text-xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
        <span style={{ color: "var(--pm-primary)" }}>Pick</span>
        <span className="text-[24px] font-semibold" style={{ color: "var(--pm-primary)", fontFamily: "'Caveat', cursive" }}>Me</span>
        <span style={{ color: isMale ? "var(--pm-text-muted)" : "var(--pm-primary)" }}> Store</span>
      </div>
      <p className="text-[10px] font-sans mb-4" style={{ color: isMale ? "var(--pm-text-muted)" : "color-mix(in srgb, var(--pm-primary) 35%, transparent)" }}>ПикМи — магазин брендовых вещей</p>
      <div className="flex items-center justify-center gap-6 mb-4">
        <a
          href="https://t.me/V_Limerence"
          target="_blank"
          rel="noreferrer"
          className="text-[13px] hover:text-white transition-colors font-semibold"
          style={{ color: "var(--pm-primary)" }}
        >
          Telegram
        </a>
        <span style={{ color: "color-mix(in srgb, var(--pm-primary) 30%, transparent)" }}>·</span>
        <a
          href="https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661"
          target="_blank"
          rel="noreferrer"
          className="text-[13px] hover:text-white transition-colors font-semibold flex items-center gap-1.5"
          style={{ color: "var(--pm-primary)" }}
        >
          <span className="inline-flex w-4 h-4 rounded-full text-[9px] font-black items-center justify-center" style={{ background: "color-mix(in srgb, var(--pm-primary) 20%, transparent)", color: "var(--pm-primary)" }}>A</span>
          Авито
        </a>
        <span style={{ color: "color-mix(in srgb, var(--pm-primary) 30%, transparent)" }}>·</span>
        <a
          href="https://tinyurl.com/5h4bbmkr"
          target="_blank"
          rel="noreferrer"
          className="text-[13px] hover:text-white transition-colors font-semibold flex items-center gap-1.5"
          style={{ color: "var(--pm-primary)" }}
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
        <GiftSection />
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
      <div className="mb-8 text-center">
        <DecorBar />
        <h2 className="font-serif text-[26px] md:text-[32px] font-bold text-foreground">Тебе также понравится</h2>
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
type ProductDetail = {
  id: number; brand: string; name: string; size: string; price: number;
  category: string; badge: string | null; imageUrl: string; imageUrls?: string[];
  telegramUrl: string; avitoLink?: string | null; caption?: string | null;
  published: boolean; description?: string | null;
  outerSeam?: number | null; innerSeam?: number | null; riseHeight?: number | null;
  halfWaist?: number | null; halfHip?: number | null; halfLegOpening?: number | null;
  model?: string | null; giftSuggestion?: boolean;
};

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
          <a href="/catalog" className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:underline mt-6 mb-8 block">
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
              {/* Brand + badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-primary">{product.brand}</span>
                {product.badge === "new" && <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white bg-primary">New</span>}
                {isSold && <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white" style={{ background: "var(--pm-primary)" }}>Продано</span>}
                {isReserved && <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white" style={{ background: "#f97316" }}>Забронировано</span>}
              </div>

              {/* Name */}
              <h1 className="font-serif text-[28px] md:text-[36px] font-bold text-foreground leading-tight">{product.name}</h1>

              {/* Caption — space always reserved */}
              <p className="font-script text-[22px] leading-tight -mt-2 min-h-[28px]" style={{ color: "var(--pm-primary)" }}>
                {product.caption ?? ""}
              </p>

              {/* Size */}
              <p className="text-[15px] text-muted-foreground">
                {product.category === "shoes" ? `Длина стельки: ${product.size} см` : `Размер: ${product.size}`}
              </p>

              {/* Size chart — shoes only */}
              {product.category === "shoes" && (
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--pm-primary-border)" }}>
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
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--pm-primary-border)" }}>
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
                className="w-full py-3 rounded-full border-2 border-primary text-primary text-[14px] font-semibold hover:bg-[var(--pm-primary-bg)] transition-colors flex items-center justify-center gap-2"
              >
                🔗 Поделиться
              </button>

              {/* Gift button — only if giftSuggestion */}
              {product.giftSuggestion && (
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
          <div className="max-w-[700px] mx-auto relative p-8 md:p-12 text-center">
            <div className="absolute inset-[-60%] pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 50% at 50% 50%, color-mix(in srgb, var(--pm-primary) 22%, transparent), transparent 70%)" }} />
            <div className="relative z-10">
            <p className="font-serif text-[24px] md:text-[30px] font-bold text-foreground mb-2">Есть вопросы по этому товару?</p>
            <p className="text-muted-foreground text-[15px] mb-8">Пиши мне, отвечу на все вопросы и помогу с выбором</p>
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

// ─── Gift Page ────────────────────────────────────────────────────
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
                        <img src={src} alt={product.name} className="w-full h-full object-cover" loading="eager" />
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
              <p className="text-[15px] text-muted-foreground">
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
  const showSplash = !hasChoice && location === "/" && !isGiftPage;

  return (
    <>
      <YmTracker />
      <AnimatePresence>
        {showSplash && (
          <SplashScreen key="splash" onSelect={setGender} />
        )}
      </AnimatePresence>
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
