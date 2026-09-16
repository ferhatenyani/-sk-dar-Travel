import { NextResponse } from "next/server";
import { z } from "zod";

import { sendContactNotification } from "@/lib/email";
import { clientIpFrom, rateLimit } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom est requis.")
    .max(100, "Le nom est trop long."),
  email: z.string().trim().email("Adresse e-mail invalide.").max(200),
  phone: z.string().trim().max(20, "Numéro trop long.").optional().default(""),
  message: z
    .string()
    .trim()
    .min(10, "Le message doit contenir au moins 10 caractères.")
    .max(2000, "Le message est trop long (2000 caractères max)."),
  // Honeypot anti-spam : doit rester vide (champ caché dans le formulaire).
  website: z.string().optional().default(""),
});

export async function POST(request: Request) {
  const ip = clientIpFrom(request.headers);
  if (!rateLimit(`contact:${ip}`, 5, 5 * 60_000)) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez dans quelques minutes." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json(
      { error: "Données invalides.", fieldErrors },
      { status: 400 },
    );
  }

  const { name, email, phone, message, website } = parsed.data;

  // Honeypot rempli → bot : faux succès, rien n'est envoyé.
  if (website) {
    return NextResponse.json({ ok: true });
  }

  // Pas de stockage : la demande part uniquement par e-mail (notification).
  await sendContactNotification({ name, email, phone, message });

  return NextResponse.json({ ok: true });
}
