import { Resend } from "resend";

/**
 * Envois email via Resend — réservé à l'infrastructure admin (mot de passe
 * oublié). Sans RESEND_API_KEY : les envois sont simplement ignorés (warning)
 * pour ne pas casser le parcours en dev.
 */

const FROM = "Üsküdar Travel <onboarding@resend.dev>";

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
