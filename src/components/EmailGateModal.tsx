"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { emailValidation } from "@/lib/validation";

/**
 * Email gate — collects an email before sending the visitor into a form flow.
 *
 * Usage (see LandingPage):
 *   const [gateTarget, setGateTarget] = useState<EmailGateTarget | null>(null)
 *   <EmailGateModal target={gateTarget} onClose={() => setGateTarget(null)} />
 *
 * Styling is self-contained and reuses the .ltb token values so it looks
 * identical whether it is mounted inside the landing page or anywhere else.
 */

/** sessionStorage key the form pages read to pre-fill their email field. */
export const GATE_EMAIL_KEY = "ltb:gateEmail";

/** Change this if your lead endpoint lives somewhere else. */
const LEAD_ENDPOINT = "/api/lead";

/* Same validation the N4/N5/N8/N12 forms use for their email field. */
const emailGateSchema = z.object({ email: emailValidation });
type EmailGateData = z.infer<typeof emailGateSchema>;

export type EmailGateTarget = {
  /** Route to push once the email is captured, e.g. "/n4" */
  href: string;
  /** Form id sent with the lead, e.g. "n4" */
  formId: string;
  /** Modal heading, e.g. "Start your N4" */
  title: string;
  /** Optional line under the heading, e.g. the form's full legal name */
  subtitle?: string;
};

type Props = {
  target: EmailGateTarget | null;
  onClose: () => void;
};

export default function EmailGateModal({ target, onClose }: Props) {
  const open = target !== null;

  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<EmailGateData>({
    resolver: zodResolver(emailGateSchema),
    mode: "onChange",
    defaultValues: { email: "" },
  });

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isValid },
  } = form;

  const { ref: registerEmailRef, ...emailField } = register("email");

  /* Pre-fill, focus, lock scroll, close on Escape. */
  useEffect(() => {
    if (!open) return;

    const saved = sessionStorage.getItem(GATE_EMAIL_KEY) || "";
    reset({ email: saved });
    if (saved) void trigger("email");

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 60);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = async (data: EmailGateData) => {
    if (!target) return;

    const email = data.email.trim();
    setIsLoading(true);

    try {
      sessionStorage.setItem(GATE_EMAIL_KEY, email);

      /* Lead capture (DB + mail). Non-blocking: never trap the visitor. */
      try {
        await fetch(LEAD_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            formId: target.formId,
            source: "landing-email-gate",
          }),
        });
      } catch (leadError) {
        console.warn("Lead capture failed, continuing to checkout:", leadError);
      }

      /* Pay for the form first — the form itself unlocks after checkout. */
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: target.formId,
          purpose: "form-access",
          customerEmail: email,
          successUrl: `${window.location.origin}${target.href}?paid=true&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/?checkout=cancelled&formId=${target.formId}`,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.url) {
        throw new Error(
          payload?.error || "We couldn't start checkout. Please try again.",
        );
      }

      window.location.href = payload.url;
    } catch (error) {
      console.error("Error starting checkout:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "We couldn't start checkout. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  if (!open || !target) return null;

  return (
    <div
      className="ltbm-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: MODAL_CSS }} />

      <div
        className="ltbm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ltbm-title"
      >
        <button
          type="button"
          className="ltbm__close"
          aria-label="Close"
          onClick={onClose}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <p className="ltbm__eyebrow">
          <span className="ltbm__rule" />
          One step first
        </p>

        <h2 className="ltbm__title" id="ltbm-title">
          {target.title}
        </h2>
        {target.subtitle && <p className="ltbm__sub">{target.subtitle}</p>}

        <p className="ltbm__body">
          Enter your email, then complete payment. Your form opens right after
          checkout and we'll send your receipt and completed PDF to this
          address.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <label className="ltbm__label" htmlFor="ltbm-email">
            Your email
          </label>

          <input
            id="ltbm-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={`ltbm__input${errors.email ? " has-error" : ""}`}
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "ltbm-email-error" : undefined}
            {...emailField}
            ref={(el) => {
              registerEmailRef(el);
              inputRef.current = el;
            }}
          />

          {errors.email && (
            <p className="ltbm__error" id="ltbm-email-error" role="alert">
              {errors.email.message}
            </p>
          )}

          <button
            type="submit"
            className="ltbm__submit"
            disabled={!isValid || isLoading}
          >
            {isLoading ? "Redirecting to checkout..." : "Continue to payment"}
          </button>
        </form>

        <p className="ltbm__note">
          Secure payment by Stripe. We use your email for your form and receipt
          only. No spam.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Styles — mirrors the .ltb token set on the landing page              */
/* ------------------------------------------------------------------ */

const MODAL_CSS = `
.ltbm-backdrop{
  position:fixed;inset:0;z-index:200;
  display:flex;align-items:center;justify-content:center;
  padding:24px;
  background:rgba(19,26,42,.58);
  -webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);
  animation:ltbm-fade .16s ease-out;
}
.ltbm{
  --red:#B7121F;
  --red-dark:#9C0F1A;
  --ink:#131A2A;
  --body:#6B7280;
  --line:#E7E7E4;
  --tint:#FCF2F1;

  position:relative;
  width:100%;max-width:430px;
  background:#fff;border-radius:14px;
  padding:32px 30px 26px;
  box-shadow:0 26px 60px rgba(0,0,0,.34);
  font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
  color:var(--ink);
  -webkit-font-smoothing:antialiased;
  animation:ltbm-pop .18s ease-out;
  max-height:calc(100vh - 48px);
  overflow-y:auto;
}
.ltbm *,.ltbm *::before,.ltbm *::after{box-sizing:border-box;}
.ltbm p,.ltbm h2{margin:0;padding:0;}
.ltbm :focus-visible{outline:2px solid var(--red);outline-offset:3px;border-radius:4px;}

.ltbm__close{
  position:absolute;top:14px;right:14px;
  width:32px;height:32px;border:0;border-radius:8px;
  background:#F3F3F1;color:#5A6270;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:background .15s ease,color .15s ease;
}
.ltbm__close:hover{background:var(--tint);color:var(--red);}

.ltbm__eyebrow{
  display:flex;align-items:center;gap:10px;
  font-size:11.5px;font-weight:700;letter-spacing:.13em;
  text-transform:uppercase;color:var(--red);margin-bottom:14px;
}
.ltbm__rule{width:26px;height:1.5px;background:currentColor;flex:none;}

.ltbm__title{
  font-family:'Plus Jakarta Sans',sans-serif;
  font-weight:800;font-size:25px;line-height:1.22;letter-spacing:-.02em;
  color:var(--ink);
  padding-right:36px;
}
.ltbm__sub{
  margin:6px 0px !important;font-size:13.5px;line-height:1.5;font-weight:500;color:var(--red);
}
.ltbm__body{
  margin-top:14px;font-size:14.5px;line-height:1.68;color:var(--body);
}

.ltbm__label{
  display:block;margin:22px 0 8px;
  font-size:10.5px;font-weight:600;letter-spacing:.1em;
  text-transform:uppercase;color:#8B94A2;
}
.ltbm__input{
  width:100%;
  background:#F3F3F1;border:1px solid #EAEAE6;border-radius:8px;
  padding:14px 16px;
  font-family:'Inter',system-ui,sans-serif;
  font-size:16px;font-weight:500;color:var(--ink);
  transition:border-color .15s ease,background .15s ease;
}
.ltbm__input::placeholder{color:#9AA0A6;font-weight:400;}
.ltbm__input:focus{outline:none;background:#fff;border-color:var(--ink);}
.ltbm__input.has-error{border-color:var(--red);background:var(--tint);}
.ltbm__error{margin-top:8px;font-size:13px;line-height:1.45;color:var(--red);}

.ltbm__submit{
  width:100%;margin-top:18px;
  display:inline-flex;align-items:center;justify-content:center;
  font-family:'Plus Jakarta Sans',sans-serif;
  font-weight:700;font-size:15px;letter-spacing:.01em;
  padding:15px 26px;border:0;border-radius:8px;cursor:pointer;
  background:var(--red);color:#fff;
  box-shadow:0 6px 16px rgba(183,18,31,.24);
  transition:background .15s ease,transform .15s ease,box-shadow .15s ease;
}
.ltbm__submit:hover:not(:disabled){background:var(--red-dark);transform:translateY(-1px); color:#fff;}
.ltbm__submit:disabled{background:#C9CBD0;box-shadow:none;cursor:not-allowed;}

.ltbm__note{
  margin-top:14px;text-align:center;
  font-size:12px;line-height:1.55;color:#9AA0A6;
}

@keyframes ltbm-fade{from{opacity:0;}to{opacity:1;}}
@keyframes ltbm-pop{from{opacity:0;transform:translateY(10px) scale(.985);}to{opacity:1;transform:none;}}
@keyframes ltbm-up{from{transform:translateY(100%);}to{transform:none;}}

@media (max-width:640px){
  .ltbm-backdrop{align-items:flex-end;padding:0;}
  .ltbm{
    max-width:none;
    border-radius:16px 16px 0 0;
    padding:26px 20px calc(22px + env(safe-area-inset-bottom));
    max-height:92vh;
    animation:ltbm-up .22s ease-out;
    box-shadow:0 -14px 40px rgba(0,0,0,.3);
  }
  .ltbm__title{font-size:22px;}
  .ltbm__close{top:12px;right:12px;}
}

@media (prefers-reduced-motion:reduce){
  .ltbm-backdrop,.ltbm{animation:none !important;}
  .ltbm__submit,.ltbm__close,.ltbm__input{transition:none !important;}
}
`;
