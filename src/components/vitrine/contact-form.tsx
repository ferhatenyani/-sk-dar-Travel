"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import { cn } from "@/lib/cn";

type FieldErrors = Partial<Record<"name" | "email" | "phone" | "message" | "form", string>>;

const inputClass =
  // text-base en mobile : évite le zoom iOS au focus (< 16 px).
  "w-full rounded-2xl border border-ice bg-white px-4 py-3.5 text-base text-night placeholder:text-night-faint transition-colors focus:border-cobalt focus:outline-none sm:py-3 sm:text-sm";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<FieldErrors>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus("sending");
    setErrors({});

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          message: data.get("message"),
          website: data.get("website"),
        }),
      });

      if (res.ok) {
        setStatus("sent");
        form.reset();
        return;
      }

      const body = (await res.json().catch(() => null)) as {
        fieldErrors?: Record<string, string>;
      } | null;
      setErrors({
        name: body?.fieldErrors?.name,
        email: body?.fieldErrors?.email,
        phone: body?.fieldErrors?.phone,
        message: body?.fieldErrors?.message,
        form: body?.fieldErrors
          ? undefined
          : "Une erreur est survenue. Réessayez dans quelques instants.",
      });
      setStatus("error");
    } catch {
      setErrors({ form: "Impossible d’envoyer le message. Vérifiez votre connexion." });
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        className="flex h-full min-h-[380px] flex-col items-center justify-center rounded-3xl border border-ice bg-white p-8 text-center"
        role="status"
      >
        <span className="grid h-16 w-16 place-items-center rounded-full bg-whatsapp/10 text-whatsapp">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h2 className="mt-5 text-xl font-bold text-night">Message envoyé !</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-night-muted">
          Merci pour votre message. Nous revenons vers vous très vite — pour une
          réponse immédiate, écrivez-nous directement sur WhatsApp.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 rounded-full border border-ice-strong px-5 py-2.5 text-sm font-semibold text-night transition-colors hover:bg-ice/60"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-3xl border border-ice bg-white p-6 shadow-[0_20px_48px_-32px_rgba(15,23,42,0.3)] sm:p-8"
    >
      <h2 className="text-xl font-bold tracking-tight text-night">
        Écrivez-nous
      </h2>
      <p className="mt-1.5 text-sm text-night-muted">
        Réponse sous 24 h ouvrées — souvent bien plus vite.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label htmlFor="vt-name" className="block text-sm font-semibold text-night">
            Nom complet <span className="text-cobalt">*</span>
          </label>
          <input
            id="vt-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Votre nom"
            aria-invalid={Boolean(errors.name)}
            className={cn(inputClass, "mt-1.5", errors.name && "border-danger")}
          />
          {errors.name ? (
            <p className="mt-1.5 text-xs text-danger">{errors.name}</p>
          ) : null}
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="vt-email" className="block text-sm font-semibold text-night">
            E-mail <span className="text-cobalt">*</span>
          </label>
          <input
            id="vt-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vous@exemple.com"
            aria-invalid={Boolean(errors.email)}
            className={cn(inputClass, "mt-1.5", errors.email && "border-danger")}
          />
          {errors.email ? (
            <p className="mt-1.5 text-xs text-danger">{errors.email}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="vt-phone" className="block text-sm font-semibold text-night">
            Téléphone <span className="text-xs font-normal text-night-muted">(optionnel)</span>
          </label>
          <input
            id="vt-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Pour vous joindre plus facilement"
            className={cn(inputClass, "mt-1.5", errors.phone && "border-danger")}
          />
          {errors.phone ? (
            <p className="mt-1.5 text-xs text-danger">{errors.phone}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="vt-message" className="block text-sm font-semibold text-night">
            Votre projet <span className="text-cobalt">*</span>
          </label>
          <textarea
            id="vt-message"
            name="message"
            required
            rows={5}
            placeholder="Destination, période, nombre de personnes, envies particulières…"
            aria-invalid={Boolean(errors.message)}
            className={cn(inputClass, "mt-1.5 resize-y", errors.message && "border-danger")}
          />
          {errors.message ? (
            <p className="mt-1.5 text-xs text-danger">{errors.message}</p>
          ) : null}
        </div>
      </div>

      {/* Honeypot anti-spam : invisible pour les humains. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="vt-website">Ne pas remplir</label>
        <input id="vt-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {errors.form ? (
        <p role="alert" className="mt-4 rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {errors.form}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-citrine px-6 py-3.5 text-[15px] font-semibold text-night transition-all hover:bg-citrine-hover active:scale-[0.98] disabled:opacity-60 sm:w-auto"
      >
        {status === "sending" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {status === "sending" ? "Envoi en cours…" : "Envoyer ma demande"}
      </button>
    </form>
  );
}
