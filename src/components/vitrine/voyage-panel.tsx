"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays } from "lucide-react";

import { cn } from "@/lib/cn";
import { voyageCardMeta } from "@/lib/voyages";
import type { VoyagePublic } from "@/lib/voyages";

const GAP = 12;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Image de couverture du voyage (repli : pastille avion sur fond cobalt). */
function VoyageCover({ voyage, sizes }: { voyage: VoyagePublic; sizes: string }) {
  return (
    <>
      {voyage.imageUrl ? (
        <Image
          src={voyage.imageUrl}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <span className="grid h-full w-full place-items-center bg-cobalt-soft">
          <CalendarDays className="h-9 w-9 text-cobalt/50" strokeWidth={1.5} />
        </span>
      )}
      {voyage.price ? (
        <span className="absolute top-2.5 right-2.5 rounded-full border border-white/25 bg-night/35 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
          {voyage.price}
        </span>
      ) : null}
    </>
  );
}

/**
 * Carte voyage — posée sur un lien vers la page listing (paramètre `voyage`),
 * qui ouvre la modale de détail du voyage.
 */
export function VoyageCard({ voyage, className }: { voyage: VoyagePublic; className: string }) {
  const meta = voyageCardMeta(voyage.departureDate, voyage.returnDate);

  return (
    <Link
      href={`/voyages-organises?voyage=${voyage.slug}`}
      aria-label={`Voir le voyage « ${voyage.title} »`}
      className={cn("group block shrink-0 snap-start", className)}
    >
      <span className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-ice ring-1 ring-night/5">
        <VoyageCover voyage={voyage} sizes="(max-width: 640px) 56vw, (max-width: 1280px) 31vw, 23vw" />
      </span>
      <span className="mt-2.5 flex items-center justify-between gap-2 px-0.5">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-night transition-colors group-hover:text-cobalt">
            {voyage.title}
          </span>
          {meta ? (
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-night-muted">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {meta}
            </span>
          ) : null}
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-night-faint transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cobalt" />
      </span>
    </Link>
  );
}

/**
 * Carrousel des voyages organisés sous les destinations (accueil) : même
 * mécanique que la piste destinations — accroche, points cliquables et
 * flèches, pagination qui suit le défilement réel.
 */
export function VoyageStrip({ voyages }: { voyages: VoyagePublic[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  const maxIndex = Math.max(0, voyages.length - 1);

  const stepOf = (el: HTMLDivElement) => {
    const card = el.firstElementChild as HTMLElement | null;
    return card ? card.offsetWidth + GAP : 132;
  };

  const sync = (el: HTMLDivElement) => {
    const step = stepOf(el);
    const overflows = el.scrollWidth > el.clientWidth + 4;
    const end = overflows && el.scrollLeft >= el.scrollWidth - el.clientWidth - 4;
    setIndex(end ? maxIndex : clamp(Math.round(el.scrollLeft / step), 0, maxIndex));
    setAtEnd(end);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    sync(el);
    const ro = new ResizeObserver(() => sync(el));
    ro.observe(el);
    const card = el.firstElementChild;
    if (card) ro.observe(card);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voyages.length]);

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
      {voyages.map((v, i) => (
        <button
          key={v.slug}
          type="button"
          role="tab"
          aria-selected={i === index}
          aria-label={`Aller au voyage ${v.title}`}
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
        aria-label="Nos voyages organisés"
      >
        {voyages.map((voyage) => (
          <VoyageCard
            key={voyage.slug}
            voyage={voyage}
            className="w-[calc(56%-12px)] min-[480px]:w-[calc(44%-12px)] sm:w-[calc(31%-12px)] xl:w-[calc(23%-12px)]"
          />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        {dots}
        <div className="flex gap-1.5">
          {arrows(-1, index === 0, "Voyages précédents")}
          {arrows(1, atEnd, "Voyages suivants")}
        </div>
      </div>
    </div>
  );
}
