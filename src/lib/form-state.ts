/**
 * Types d'état partagés par les Server Actions et les formulaires clients.
 * (Ne pas mettre "use server" ici : ce module contient des valeurs, pas des actions.)
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

export type FormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: Record<string, string> }
  | { status: "success"; message: string };

export const emptyFormState: FormState = { status: "idle" };
