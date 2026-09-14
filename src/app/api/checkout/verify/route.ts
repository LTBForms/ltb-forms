import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const formId = request.nextUrl.searchParams.get("formId");

  if (!sessionId) {
    return NextResponse.json(
      { paid: false, error: "Missing session_id" },
      { status: 400 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";
    const sessionFormId = session.metadata?.formId ?? null;

    if (formId && sessionFormId && formId !== sessionFormId) {
      return NextResponse.json(
        { paid: false, error: "Session is for a different form" },
        { status: 403 },
      );
    }

    // Only the form fee unlocks a form. A services payment must not.
    const purpose = session.metadata?.purpose ?? "form-access";
    if (purpose !== "form-access") {
      return NextResponse.json(
        { paid: false, error: "Session is not a form purchase" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      paid,
      formId: sessionFormId,
      purpose: session.metadata?.purpose ?? null,
      email: session.customer_details?.email ?? session.customer_email ?? null,
    });
  } catch (error) {
    console.error("Verify session failed:", error);
    return NextResponse.json(
      { paid: false, error: "Could not verify session" },
      { status: 500 },
    );
  }
}
