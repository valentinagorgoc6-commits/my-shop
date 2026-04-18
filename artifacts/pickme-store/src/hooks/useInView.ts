import { useEffect, useRef, useState, useCallback } from "react";

export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0, rootMargin: "0px 0px -20px 0px" }
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return; // already triggered, skip

    const element = ref.current;
    if (!element) return;

    // If element is already in viewport — show immediately
    const rect = element.getBoundingClientRect();
    if (
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.width > 0 // not display:none
    ) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  });
  // No dependency array — re-runs on every render until inView=true
  // This handles the case where ref.current is null on first render
  // but becomes available after data loads. Once inView=true, early return prevents re-observing.

  return { ref, inView };
}
