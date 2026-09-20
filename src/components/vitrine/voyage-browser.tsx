"use client";

import { useRouter, useSearchParams } from "next/navigation";

import type { VoyagePublic } from "@/lib/voyages";
import { VoyageCard } from "./voyage-panel";
import { VoyageModal } from "./voyage-modal";

/**
 * Grille des voyages organisés + modale de détail pilotée par l'URL
 * (`?voyage=slug`) : la modale est partageable, le retour navigateur la
 * ferme. Le composant vit sous <Suspense> (lecture des search params).
 */
export function VoyageBrowser({ voyages }: { voyages: VoyagePublic[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openSlug = searchParams.get("voyage");
  const selected = voyages.find((v) => v.slug === openSlug) ?? null;

  return (
    <>
      <div className="mt-7 grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
        {voyages.map((voyage) => (
          <VoyageCard key={voyage.slug} voyage={voyage} className="block" />
        ))}
      </div>

      {selected ? (
        <VoyageModal onClose={() => router.replace("/voyages-organises")} voyage={selected} />
      ) : null}
    </>
  );
}
