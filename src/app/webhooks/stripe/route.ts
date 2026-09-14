import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import sgMail from "@sendgrid/mail";

/* Signature verification needs the raw body, so this must run on Node. */
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const CLIENT_EMAIL = "info@justuslegal.ca";
const FROM_ADDR = process.env.SMTP_FROM || "info@justuslegal.co";

const FORM_TITLES: Record<string, string> = {
  n4: "Notice to End Tenancy for Non-Payment of Rent (Form N4)",
  n5: "Notice to End Tenancy for Interference, Damage, or Overcrowding (Form N5)",
  n8: "Notice to End Tenancy at End of Term (Form N8)",
  n12: "Notice to End your Tenancy, Because the Landlord, a Purchaser or a Family Member Requires the Rental Unit (Form N12)",
};

const SERVICE_LABELS: Record<string, string> = {
  filing: "Filing service (we file the form for you)",
  representation: "Representation service (we represent you)",
  both: "Filing + Representation services",
};

const shell = (heading: string, body: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #C0111F; color: white; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">LTB Forms</h1>
    </div>
    <div style="padding: 30px; background-color: #f9f9f9;">
      <h2 style="color: #333; margin-bottom: 20px;">${heading}</h2>
      ${body}
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #999; font-size: 14px;">
          LTB Forms — Ontario Landlord &amp; Tenant Board form preparation and paralegal services.
        </p>
      </div>
    </div>
  </div>`;

const money = (amount: number | null, currency: string | null) =>
  amount == null
    ? "—"
    : `$${(amount / 100).toFixed(2)} ${(currency ?? "cad").toUpperCase()}`;

async function handleFormAccessPaid(
  session: Stripe.Checkout.Session,
  baseUrl: string,
) {
  const formId = (session.metadata?.formId ?? "").toLowerCase();
  const email =
    session.customer_details?.email ?? session.customer_email ?? null;
  const formTitle = FORM_TITLES[formId] ?? "LTB Form";

  /* The session id is the credential. /api/checkout/verify re-checks it against
     Stripe on every use, so this link is safe to email and works from any device. */
  const resumeUrl = `${baseUrl}/${formId}?paid=true&session_id=${session.id}`;

  const messages: sgMail.MailDataRequired[] = [
    {
      to: CLIENT_EMAIL,
      from: FROM_ADDR,
      subject: `Payment received: ${formId.toUpperCase()} — ${email ?? "unknown email"}`,
      html: shell(
        "Form fee paid",
        `<div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #C0111F; margin: 20px 0;">
           <p style="color: #333; line-height: 1.8; margin: 0;">
             <strong>Email:</strong> ${email ?? "—"}<br />
             <strong>Form:</strong> ${formTitle}<br />
             <strong>Amount:</strong> ${money(session.amount_total, session.currency)}<br />
             <strong>Stripe session:</strong> ${session.id}
           </p>
         </div>
         <p style="color: #666; line-height: 1.6;">
           The form is now unlocked for them. A "Form submitted" email with the
           completed PDF will follow once they finish and download.
         </p>`,
      ),
    },
  ];

  if (email && formId) {
    messages.push({
      to: email,
      from: FROM_ADDR,
      subject: `Your ${formId.toUpperCase()} is unlocked — receipt and resume link`,
      html: shell(
        "Payment received — your form is ready",
        `<p style="color: #666; line-height: 1.6;">
           Thank you. We've received your payment of
           <strong>${money(session.amount_total, session.currency)}</strong> for your
           <strong>${formTitle}</strong>.
         </p>
         <div style="text-align: center; margin: 28px 0;">
           <a href="${resumeUrl}"
              style="background-color: #C0111F; color: #ffffff; text-decoration: none;
                     display: inline-block; padding: 15px 30px; border-radius: 5px;
                     font-weight: bold; font-size: 15px;">
             Open my ${formId.toUpperCase()}
           </a>
         </div>
         <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #C0111F; margin: 20px 0;">
           <p style="color: #666; line-height: 1.6; margin: 0;">
             <strong>Keep this email.</strong> If you close your browser before finishing,
             this link reopens your form without paying again. Your completed PDF will be
             emailed to you as soon as you download it.
           </p>
         </div>`,
      ),
    });
  }

  return messages;
}

async function handleServicesPaid(session: Stripe.Checkout.Session) {
  const formId = (session.metadata?.formId ?? "").toLowerCase();
  const serviceOption = session.metadata?.serviceOption ?? "";
  const email =
    session.customer_details?.email ?? session.customer_email ?? null;

  return [
    {
      to: CLIENT_EMAIL,
      from: FROM_ADDR,
      subject: `SERVICE PURCHASED: ${SERVICE_LABELS[serviceOption] ?? serviceOption} — ${email ?? "unknown"}`,
      html: shell(
        "Paralegal service purchased — action needed",
        `<div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
           <p style="color: #333; line-height: 1.8; margin: 0;">
             <strong>Client email:</strong> ${email ?? "—"}<br />
             <strong>Service:</strong> ${SERVICE_LABELS[serviceOption] ?? serviceOption}<br />
             <strong>Form:</strong> ${FORM_TITLES[formId] ?? formId.toUpperCase()}<br />
             <strong>Amount:</strong> ${money(session.amount_total, session.currency)}<br />
             <strong>Stripe session:</strong> ${session.id}
           </p>
         </div>
         <p style="color: #666; line-height: 1.6;">
           This client has paid for paralegal work. Follow up with them directly.
         </p>`,
      ),
    },
  ] as sgMail.MailDataRequired[];
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    console.error("Webhook missing signature or STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
  ).replace(/\/$/, "");

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== "paid") {
        console.log(`Session ${session.id} completed but not paid; ignoring.`);
        return NextResponse.json({ received: true });
      }

      const purpose = session.metadata?.purpose ?? "form-access";
      const messages =
        purpose === "services"
          ? await handleServicesPaid(session)
          : await handleFormAccessPaid(session, baseUrl);

      const results = await Promise.allSettled(
        messages.map((m) => sgMail.send(m)),
      );
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(
            `Webhook mail ${i} failed for ${session.id}:`,
            r.reason,
          );
        }
      });
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      console.log(
        `Refund issued on charge ${charge.id} (${money(charge.amount_refunded, charge.currency)})`,
      );
      // If you later add a DB, mark the lead refunded here.
    }
  } catch (error) {
    /* Always 200 on handler errors: a 500 makes Stripe retry for days and
       re-send the same emails. Log it and investigate in the dashboard. */
    console.error(`Error handling webhook ${event.type} (${event.id}):`, error);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
