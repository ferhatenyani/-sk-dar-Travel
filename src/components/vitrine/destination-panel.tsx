"use client";

import Image from "next/image";
import { isUploadedImage } from "@/lib/images";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/cn";

type Destination = { slug: string; title: string; imageUrl: string };

const GAP = 12;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function DestinationCard({ d, className }: { d: Destination; className: string }) {
  return (
    <Link
      href={`/destinations/${d.slug}`}
      className={`group block shrink-0 snap-start ${className}`}
    >
      <span className="block aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-night/5">
        <Image
          src={d.imageUrl}
          unoptimized={isUploadedImage(d.imageUrl)}
          alt={`Destination ${d.title}`}
          width={480}
          height={360}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </span>
      <span className="mt-2.5 flex items-center justify-between gap-2 px-0.5">
        <span className="truncate text-sm font-semibold text-night transition-colors group-hover:text-cobalt">
          {d.title}
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-night-faint transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cobalt" />
      </span>
    </Link>
  );
}

/**
 * Carrousel des destinations sous le hero (inspi3) : piste à défilement
 * horizontal avec accroche, points cliquables et flèches. La pagination
 * suit le défilement réel : en fin de course l'index passe à la dernière
 * carte, le pas est mesuré au runtime.
 */
export function DestinationStrip({ destinations }: { destinations: Destination[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  const maxIndex = Math.max(0, destinations.length - 1);

  const stepOf = (el: HTMLDivElement) => {
    const card = el.firstElementChild as HTMLElement | null;
    return card ? card.offsetWidth + GAP : 132;
  };

  const sync = (el: HTMLDivElement) => {
    const step = stepOf(el);
    // En fin de course, l'index saute à la dernière carte : avec plusieurs
    // cartes visibles, le scroll max n'atteint jamais le dernier cran en pas
    // de carte. Garde : sans débordement mesurable (layout pas encore
    // résolu), on ne considère jamais la fin atteinte.
    const overflows = el.scrollWidth > el.clientWidth + 4;
    const end = overflows && el.scrollLeft >= el.scrollWidth - el.clientWidth - 4;
    setIndex(end ? maxIndex : clamp(Math.round(el.scrollLeft / step), 0, maxIndex));
    setAtEnd(end);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    sync(el);
    // Observer aussi la première carte capte la résolution du layout
    // (scrollWidth ne déclenche pas le ResizeObserver).
    const ro = new ResizeObserver(() => sync(el));
    ro.observe(el);
    const card = el.firstElementChild;
    if (card) ro.observe(card);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinations.length]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => sync(e.currentTarget);

  const scrollByCards = (dir: 1 | -1) => {
    const el = trackRef.current;
    el?.scrollBy({ left: dir * stepOf(el), behavior: "smooth" });
  };

  const goTo = (i: number) => {
    const el = trackRef.current;
    el?.scrollTo({ left: i * stepOf(el), behavior: "smooth" });
  };

  const dots = (
    <div className="flex items-center gap-1.5" role="tablist" aria-label="Positions du carrousel">
      {destinations.map((d, i) => (
        <button
          key={d.slug}
          type="button"
          role="tab"
          aria-selected={i === index}
          aria-label={`Aller à la destination ${d.title}`}
          onClick={() => goTo(i)}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i === index ? "w-5 bg-cobalt" : "w-1.5 bg-ice-strong hover:bg-night-faint",
          )}
        />
      ))}
    </div>
  );

  const arrows = (dir: 1 | -1, disabled: boolean, label: string) => (
    <button
      type="button"
      onClick={() => scrollByCards(dir)}
      aria-label={label}
      disabled={disabled}
      className="grid h-9 w-9 place-items-center rounded-full border border-ice-strong bg-white text-night transition-colors hover:bg-ice disabled:opacity-40"
    >
      {dir === -1 ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
    </button>
  );

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="vt-no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth scroll-ps-4 px-4 sm:mx-0 sm:scroll-ps-0 sm:px-0"
        aria-label="Nos destinations"
      >
        {destinations.map((d) => (
          <DestinationCard
            key={d.slug}
            d={d}
            className="w-[calc(56%-12px)] min-[480px]:w-[calc(44%-12px)] sm:w-[calc(31%-12px)] xl:w-[calc(23%-12px)]"
          />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        {dots}
        <div className="flex gap-1.5">
          {arrows(-1, index === 0, "Destinations précédentes")}
          {arrows(1, atEnd, "Destinations suivantes")}
        </div>
      </div>
    </div>
  );
}
