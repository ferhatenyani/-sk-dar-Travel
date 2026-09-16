import { Resend } from "resend";

/**
 * Envois email via Resend. Sender de test Resend tant que le domaine n'est pas
 * vérifié (Phase 6). Sans RESEND_API_KEY : les envois sont simplement
 * ignorés (warning) pour ne pas casser le parcours en dev.
 */

const FROM = "Üsküdar Travel <onboarding@resend.dev>";

export async function sendContactNotification(input: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFICATION_EMAIL;

  if (!apiKey || !to) {
    console.warn(
      "[email] RESEND_API_KEY absente — notification de contact ignorée.",
    );
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: input.email,
      subject: `Nouvelle demande de contact — ${input.name}`,
      html: `
        <h2>Nouvelle demande via le formulaire de contact</h2>
        <p><strong>Nom :</strong> ${escapeHtml(input.name)}</p>
        <p><strong>E-mail :</strong> ${escapeHtml(input.email)}</p>
        <p><strong>Téléphone :</strong> ${escapeHtml(input.phone || "—")}</p>
        <hr />
        <p style="white-space: pre-wrap;">${escapeHtml(input.message)}</p>
      `,
    });
    return true;
  } catch (error) {
    console.error("[email] Échec envoi notification contact :", error);
    return false;
  }
}

export async function sendResetPasswordEmail(
  to: string,
  resetUrl: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY absente — lien de réinitialisation non envoyé à ${to}. Lien : ${resetUrl}`,
    );
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Réinitialisation de votre mot de passe — Üsküdar Travel",
      html: `
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe administrateur.</p>
        <p><a href="${resetUrl}">Choisir un nouveau mot de passe</a></p>
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error("[email] Échec envoi réinitialisation :", error);
    return false;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
