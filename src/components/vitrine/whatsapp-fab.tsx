import { waLink, WA_MESSAGE, type VitrineSettings } from "@/lib/vitrine";
import { WhatsAppIcon } from "./primitives";

/** Bouton flottant WhatsApp — présent sur toutes les pages publiques. */
export function WhatsAppFab({ settings }: { settings: VitrineSettings }) {
  return (
    <a
      href={waLink(settings.whatsappNumber, WA_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Discuter avec Üsküdar Travel sur WhatsApp"
      className="fixed right-4 bottom-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-white shadow-[0_12px_32px_-8px_rgba(37,211,102,0.55)] transition-transform duration-200 hover:scale-105 hover:bg-whatsapp-hover active:scale-95 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
