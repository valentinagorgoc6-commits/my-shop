/**
 * Given an image URL like "/api/uploads/123456.webp",
 * returns srcSet and src for responsive images.
 *
 * If the URL already ends with .webp, assumes processed variants exist:
 *   -thumb.webp (400w), -medium.webp (800w), -full.webp (1600w)
 *
 * For legacy .jpg/.png URLs, returns the original as-is.
 */

export function getImageSrcSet(url: string): {
  src: string;
  srcSet: string | undefined;
  isWebp: boolean;
} {
  if (!url) return { src: url, srcSet: undefined, isWebp: false };

  const isWebp = url.endsWith(".webp");

  if (!isWebp) {
    // Legacy image — check if a .webp version might exist
    const webpUrl = url.replace(/\.(jpe?g|png)$/i, ".webp");
    return { src: url, srcSet: undefined, isWebp: false };
  }

  // Processed image — build srcset from variants
  const base = url.replace(/\.webp$/, "");
  const srcSet = [
    `${base}-thumb.webp 400w`,
    `${base}-medium.webp 800w`,
    `${base}-full.webp 1600w`,
  ].join(", ");

  return {
    src: url, // default .webp (medium size)
    srcSet,
    isWebp: true,
  };
}

/**
 * Sizes attribute for responsive images.
 * - Card in catalog grid: ~25vw on desktop, ~50vw on mobile
 * - Product page hero: ~50vw on desktop, ~100vw on mobile
 */
export const SIZES_CARD = "(min-width: 768px) 25vw, 50vw";
export const SIZES_PRODUCT = "(min-width: 768px) 50vw, 100vw";
