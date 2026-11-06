/** One scroll clock: progress 0..1 over a sticky track. */
export function createScrollClock(track, { reducedMotion = false } = {}) {
  let progress = 0;
  let raf = 0;
  const listeners = new Set();

  function measure() {
    if (reducedMotion) {
      progress = 1;
      listeners.forEach((fn) => fn(progress));
      return;
    }
    const rect = track.getBoundingClientRect();
    const total = Math.max(1, track.offsetHeight - window.innerHeight);
    const scrolled = Math.min(total, Math.max(0, -rect.top));
    progress = scrolled / total;
    listeners.forEach((fn) => fn(progress));
  }

  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      measure();
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  measure();

  return {
    get progress() { return progress; },
    on(fn) { listeners.add(fn); fn(progress); return () => listeners.delete(fn); },
    destroy() {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      listeners.clear();
    },
  };
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const HEX_LOGO = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"><path d="M12 5.2 L19 9.2 V17.2 L12 21.2 L5 17.2 V9.2 Z"/><path d="M5 9.2 L12 13.2 L19 9.2 M12 13.2 V21.2" opacity=".75"/></g><circle cx="12" cy="3.1" r="2.1" fill="currentColor"/></svg>`;
