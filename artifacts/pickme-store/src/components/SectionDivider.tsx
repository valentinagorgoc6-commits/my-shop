import { Heart } from "lucide-react";

/**
 * Decorative section divider: ✦ ─── [♥] ─── ✦
 *
 * All colors via CSS custom properties — adapts to female/male/male-dark themes automatically.
 * No infinite animations. Static gradients + shadows only.
 */
export default function SectionDivider({ align = "center" }: { align?: "center" | "left" | "responsive" }) {
  const justifyCls =
    align === "center" ? "justify-center"
    : align === "left" ? "justify-start"
    : "justify-center md:justify-start";

  return (
    <div className={`flex items-center gap-4 mb-5 ${justifyCls}`}>
      {/* Left sparkle */}
      <span
        className="text-[12px] select-none leading-none"
        style={{ color: "var(--pm-primary)", opacity: 0.5 }}
        aria-hidden="true"
      >
        ✦
      </span>

      {/* Left line */}
      <div
        className="w-[60px] h-px"
        style={{ background: "color-mix(in srgb, var(--pm-primary) 30%, transparent)" }}
      />

      {/* Center heart plaque */}
      <div
        className="flex items-center justify-center rounded-full shrink-0 transition-transform duration-200 hover:scale-105"
        style={{
          width: 48,
          height: 48,
          background: "radial-gradient(circle, var(--pm-surface, #fff) 30%, color-mix(in srgb, var(--pm-primary) 12%, var(--pm-surface, #fff)) 100%)",
          boxShadow:
            "0 0 0 1px color-mix(in srgb, var(--pm-primary) 15%, transparent), " +
            "0 4px 20px color-mix(in srgb, var(--pm-primary) 35%, transparent), " +
            "0 0 40px color-mix(in srgb, var(--pm-primary) 15%, transparent)",
        }}
      >
        <Heart
          size={24}
          fill="var(--pm-primary)"
          color="var(--pm-primary)"
          strokeWidth={0}
          aria-hidden="true"
          style={{ filter: "drop-shadow(0 1px 3px color-mix(in srgb, var(--pm-primary) 40%, transparent))" }}
        />
      </div>

      {/* Right line */}
      <div
        className="w-[60px] h-px"
        style={{ background: "color-mix(in srgb, var(--pm-primary) 30%, transparent)" }}
      />

      {/* Right sparkle */}
      <span
        className="text-[12px] select-none leading-none"
        style={{ color: "var(--pm-primary)", opacity: 0.5 }}
        aria-hidden="true"
      >
        ✦
      </span>
    </div>
  );
}
