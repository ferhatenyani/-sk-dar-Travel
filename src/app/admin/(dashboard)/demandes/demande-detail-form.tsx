"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import type { FormState } from "@/lib/form-state";
import { emptyFormState } from "@/lib/form-state";
import {
  deleteDemande,
  updateDemande,
} from "@/lib/actions/demandes";
import { TRIP_STATUSES, type TripStatus } from "@/db/schema";
import { TRIP_STATUS_LABELS } from "./status";

/**
 * Bloc « suivi » de la demande : statut (dropdown 100 % maison, la valeur
 * transite par un input hidden vers la server action) + note interne
 * (enregistrés ensemble) et suppression avec confirmation.
 */
export function DemandeDetailForm({
  id,
  status,
  adminNote,
}: {
  id: number;
  status: TripStatus;
  adminNote: string | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (_prev, formData) => updateDemande(id, formData),
    emptyFormState,
  );
  const [statusValue, setStatusValue] = useState<TripStatus>(status);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    if (!window.confirm("Supprimer définitivement cette demande ?")) return;
    setDeleting(true);
    const res = await deleteDemande(id);
    if (res.ok) {
      router.push("/admin/demandes");
      router.refresh();
    } else {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <form action={action} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-base font-semibold">Suivi</h2>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="status" className="text-sm font-medium text-ink">
              Statut
            </label>
            <Dropdown
              id="status"
              name="status"
              ariaLabel="Statut de la demande"
              className="mt-1.5"
              value={statusValue}
              onChange={(v) => setStatusValue(v as TripStatus)}
              options={TRIP_STATUSES.map((s) => ({
                value: s,
                label: TRIP_STATUS_LABELS[s],
              }))}
            />
          </div>

          <div>
            <label htmlFor="adminNote" className="text-sm font-medium text-ink">
              Note interne
            </label>
            <textarea
              id="adminNote"
              name="adminNote"
              rows={4}
              defaultValue={adminNote ?? ""}
              placeholder="Devis envoyé le…, relancé le…, points à confirmer…"
              className="mt-1.5 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-base text-ink placeholder:text-ink-faint transition-colors focus:border-navy focus:outline-none"
            />
          </div>

          {state.status === "success" ? (
            <p role="status" className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="size-4" />
              {state.message}
            </p>
          ) : null}
          {state.status === "error" ? (
            <p role="alert" className="text-sm text-danger">
              {state.message}
            </p>
          ) : null}

          <Button type="submit" loading={pending} className="w-full">
            <Save className="size-4" />
            Enregistrer
          </Button>
        </div>
      </form>

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-base font-semibold">Supprimer</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Suppression définitive de la demande, sans confirmation supplémentaire.
        </p>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-danger-border bg-danger-soft px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-60"
        >
          <Trash2 className="size-4" />
          {deleting ? "Suppression…" : "Supprimer la demande"}
        </button>
      </div>
    </div>
  );
}
