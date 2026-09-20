"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { TRIP_STATUSES, tripRequests } from "@/db/schema";
import type { ActionResult, FormState } from "@/lib/form-state";
import { requireAdmin } from "@/lib/session";

function revalidateDemandes(id?: number) {
  revalidatePath("/admin/demandes");
  revalidatePath("/admin");
  if (id) revalidatePath(`/admin/demandes/${id}`);
}

const statusSchema = z.enum(TRIP_STATUSES);

const patchSchema = z.object({
  status: statusSchema,
  adminNote: z
    .string()
    .trim()
    .max(2000, "La note est trop longue (2000 caractères max).")
    .optional()
    .default(""),
});

/** Statut + note interne : un seul formulaire « Enregistrer ». */
export async function updateDemande(id: number, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = patchSchema.safeParse({
    status: formData.get("status"),
    adminNote: formData.get("adminNote"),
  });

  if (!Number.isInteger(id) || !parsed.success) {
    return {
      status: "error",
      message: "Corrigez les champs indiqués.",
      fieldErrors: { status: "Statut invalide." },
    };
  }

  await db
    .update(tripRequests)
    .set({
      status: parsed.data.status,
      adminNote: parsed.data.adminNote || null,
    })
    .where(eq(tripRequests.id, id));

  revalidateDemandes(id);
  return { status: "success", message: "Demande mise à jour." };
}

export async function deleteDemande(id: number): Promise<ActionResult> {
  await requireAdmin();
  if (!Number.isInteger(id)) return { ok: false, error: "Demande introuvable." };

  await db.delete(tripRequests).where(eq(tripRequests.id, id));
  revalidateDemandes();
  return { ok: true };
}
