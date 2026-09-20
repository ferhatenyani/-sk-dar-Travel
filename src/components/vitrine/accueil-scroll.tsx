"use client";

import { useEffect } from "react";

const STORAGE_KEY = "vt-accueil-scroll";

/**
 * Mémoire de position de l'accueil : la position de défilement est
 * sauvegardée en localStorage (throttlée) et restaurée au retour sur la
 * page — saut d'ancre (#contact) ou scroll frais via « Composer mon voyage »
 * ont la priorité (flag sessionStorage).
 */
export function AccueilScroll() {
  // Restauration au montage (deux passes : hydration puis images chargées).
  useEffect(() => {
    if (window.location.hash) return;
    if (sessionStorage.getItem("vt-accueil-scroll-skip")) {
      sessionStorage.removeItem("vt-accueil-scroll-skip");
      return;
    }
    const saved = Number(window.localStorage.getItem(STORAGE_KEY) ?? "0");
    if (saved > 0) {
      const restore = () => window.scrollTo(0, saved);
      requestAnimationFrame(restore);
      const onLoad = () => restore();
      if (document.readyState !== "complete") {
        window.addEventListener("load", onLoad, { once: true });
      }
      const t = setTimeout(onLoad, 600);
      return () => {
        window.removeEventListener("load", onLoad);
        clearTimeout(t);
      };
    }
  }, []);

  // Sauvegarde throttlée de la position.
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        window.localStorage.setItem(
          STORAGE_KEY,
          String(Math.round(window.scrollY)),
        );
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
