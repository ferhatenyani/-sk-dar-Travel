import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

/** Vérifie la session côté serveur (layout, server actions, middleware upload). */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** À appeler au début de chaque Server Action : bloque les appels non authentifiés. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
