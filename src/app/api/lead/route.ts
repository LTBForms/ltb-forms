import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const CLIENT_EMAIL = "info@justuslegal.ca";
const FROM_ADDR = process.env.SMTP_FROM || "info@justuslegal.co";

const FORM_TITLES: Record<string, string> = {
  n4: "Notice to End Tenancy for Non-Payment of Rent (Form N4)",
  n5: "Notice to End Tenancy for Interference, Damage, or Overcrowding (Form N5)",
  n8: "Notice to End Tenancy at End of Term (Form N8)",
  n12: "Notice to End your Tenancy, Because the Landlord, a Purchaser or a Family Member Requires the Rental Unit (Form N12)",
};

export async function POST(request: NextRequest) {
  try {
    const { email, formId, source } = (await request.json()) as {
      email?: string;
      formId?: string;
      source?: string;
    };

    if (!email || !formId) {
      return NextResponse.json(
        { error: "Missing required fields: email or formId" },
        { status: 400 },
      );
    }

    const formTitle = FORM_TITLES[formId.toLowerCase()] || "LTB Form";
    const capturedAt = new Date().toLocaleString("en-CA", {
      timeZone: "America/Toronto",
      dateStyle: "medium",
      timeStyle: "short",
    });

    /* ------------------------------------------------------------------
     * PERSISTENCE HOOK — add your DB write here when you have one.
     * e.g. await prisma.lead.upsert({
     *   where:  { email_formId: { email, formId } },
     *   update: { lastSeenAt: new Date(), source },
     *   create: { email, formId, source, status: 'started' },
     * })
     * Wrap it in its own try/catch so a DB blip never blocks checkout.
     * ---------------------------------------------------------------- */
    console.log(
      `[lead] ${email} | ${formId} | ${source ?? "unknown"} | ${capturedAt}`,
    );

    const internalHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #C0111F; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">LTB Forms</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">New lead captured</h2>
          <p style="color: #666; line-height: 1.6;">
            Someone entered their email to start a form and is being sent to checkout.
          </p>
          <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #C0111F; margin: 20px 0;">
            <p style="color: #333; line-height: 1.8; margin: 0;">
              <strong>Email:</strong> ${email}<br />
              <strong>Form:</strong> ${formTitle}<br />
              <strong>Source:</strong> ${source ?? "unknown"}<br />
              <strong>Captured:</strong> ${capturedAt}
            </p>
          </div>
          <p style="color: #999; font-size: 14px;">
            This is a lead only — it does not mean payment completed. A separate
            "Form submitted" email arrives once they pay and download.
          </p>
        </div>
      </div>`;

    const userHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #C0111F; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">LTB Forms</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">You've started your form</h2>
          <p style="color: #666; line-height: 1.6;">
            Thanks for starting your <strong>${formTitle}</strong>. Once your payment
            goes through, the form opens right away and you can complete it in minutes.
          </p>
          <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #C0111F; margin: 20px 0;">
            <p style="color: #666; line-height: 1.6; margin: 0;">
              Didn't finish? Just head back to our site and enter this same email to
              pick up where you left off. Your completed PDF will be emailed to this
              address as soon as you're done.
            </p>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center;">
            LTB Forms — Ontario Landlord &amp; Tenant Board form preparation.
          </p>
        </div>
      </div>`;

    /* Fire both, but never let a mail failure block the visitor's checkout. */
    const results = await Promise.allSettled([
      sgMail.send({
        to: CLIENT_EMAIL,
        from: FROM_ADDR,
        subject: `New lead: ${email} — ${formId.toUpperCase()}`,
        html: internalHtml,
      }),
      sgMail.send({
        to: email,
        from: FROM_ADDR,
        subject: `Your ${formId.toUpperCase()} — next step`,
        html: userHtml,
      }),
    ]);

    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(
          `[lead] mail ${i === 0 ? "internal" : "user"} failed:`,
          r.reason,
        );
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error capturing lead:", error);
    return NextResponse.json(
      {
        error:
          "Failed to capture lead: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    );
  }
}
