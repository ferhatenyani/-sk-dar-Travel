import Image from "next/image";
import { BedDouble, CarFront, Plane, ShieldCheck, Sparkles, Users } from "lucide-react";

import { cn } from "@/lib/cn";

const SERVICE_ICONS: Record<string, typeof Plane> = {
  "voyages-organises": Users,
  "voyages-sur-mesure": Sparkles,
  hotellerie: BedDouble,
  billetterie: Plane,
  transferts: CarFront,
  "assurance-voyage": ShieldCheck,
};

export type ServiceCardData = {
  slug: string;
  title: string;
  description: string;
  price: string | null;
  imageUrl: string;
};

/**
 * Carte service — posée sur un lien WhatsApp « Demander ce service ».
 * Mobile : carte horizontale (image à gauche) ; sm+ : image au-dessus.
 */
export function ServiceCard({
  service,
  waHref,
}: {
  service: ServiceCardData;
  waHref: string;
}) {
  const Icon = SERVICE_ICONS[service.slug];

  return (
    <a
      href={waHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Demander « ${service.title} » sur WhatsApp`}
      className="group flex flex-row overflow-hidden rounded-3xl border border-ice bg-white transition-all duration-300 hover:-translate-y-1 hover:border-ice-strong hover:shadow-[0_24px_48px_-24px_rgba(15,23,42,0.25)] sm:flex-col"
    >
      <span className="relative block w-[38%] shrink-0 self-stretch overflow-hidden sm:w-full sm:h-44">
        {service.imageUrl ? (
          <Image
            src={service.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 40vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="grid h-full w-full place-items-center bg-cobalt-soft">
            {Icon ? (
              <Icon className="h-9 w-9 text-cobalt/50 sm:h-10 sm:w-10" strokeWidth={1.5} />
            ) : (
              <Plane className="h-9 w-9 text-cobalt/50 sm:h-10 sm:w-10" strokeWidth={1.5} />
            )}
          </span>
        )}
      </span>

      <span className="flex flex-1 flex-col p-4 sm:p-5">
        <span className="text-[15px] font-bold tracking-tight text-night sm:text-lg">
          {service.title}
        </span>
        {service.description ? (
          <span className="mt-1 text-xs leading-relaxed text-night-muted line-clamp-3 sm:text-sm">
            {service.description}
          </span>
        ) : null}
        <span className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs",
              service.price
                ? "bg-cobalt-soft text-cobalt"
                : "bg-ice text-night-soft",
            )}
          >
            {service.price || "Sur devis"}
          </span>
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-full bg-night text-white transition-colors duration-300 group-hover:bg-citrine group-hover:text-night sm:h-9 sm:w-9"
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
      </span>
    </a>
  );
}
