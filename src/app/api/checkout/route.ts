import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const { formId, customerEmail, successUrl, cancelUrl, serviceOption } = body as {
      formId: string;
      customerEmail: string;
      successUrl?: string;
      cancelUrl?: string;
      serviceOption?: "" | "filing" | "representation" | "both";
    };

    // Get the current origin from the request
    const origin = req.headers.get('origin') || req.nextUrl.origin;
    const baseUrl = origin.replace(/\/$/, "");

    // Use provided URLs or fallback to default ones
    const finalSuccessUrl = successUrl || `${baseUrl}/download?success=true&formId=${formId}`;
    const finalCancelUrl = cancelUrl || `${baseUrl}/${formId}?success=false`;

    // N4 form: use dynamic amount based on service option (base / 272 / 586 / 772 CAD)
    const isN4WithService =
      formId === "n4" &&
      (serviceOption === "filing" || serviceOption === "representation" || serviceOption === "both");
    const n4Amounts = {
      filing: 27200, // 272 CAD in cents
      representation: 58600, // 586 CAD in cents
      both: 77200, // 272 + 500 CAD in cents (rounded to 772)
    } as const;

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = isN4WithService
      ? {
          price_data: {
            currency: "cad",
            unit_amount: n4Amounts[serviceOption!],
            product_data: {
              name:
                serviceOption === "filing"
                  ? "Form N4 + Filing service"
                  : serviceOption === "representation"
                    ? "Form N4 + Representation service"
                    : "Form N4 + Filing + Representation service",
            },
          },
          quantity: 1,
        }
      : {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      line_items: [lineItem],
      metadata: {
        ...(formId ? { formId } : {}),
        ...(formId === "n4" && serviceOption ? { serviceOption } : {}),
      },
      customer_email: customerEmail,
      payment_intent_data: {
        metadata: {
          ...(formId ? { formId } : {}),
          ...(formId === "n4" && serviceOption ? { serviceOption } : {}),
        },
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("Checkout session error:", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
