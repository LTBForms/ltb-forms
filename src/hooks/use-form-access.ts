"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export const paidKey = (formId: string) => `ltb:paid:${formId}`;
export const GATE_EMAIL_KEY = "ltb:gateEmail";

/**
 * Gates a form page behind the form-fee payment taken at the email gate.
 * - Returning from Stripe: verifies ?session_id= and unlocks for this tab.
 * - Already unlocked in this tab: passes straight through.
 */
export function useFormAccess(formId: string) {
  const searchParams = useSearchParams();
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [justPaid, setJustPaid] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (sessionStorage.getItem(paidKey(formId))) {
        setHasAccess(true);
        setIsChecking(false);
        return;
      }

      const sessionId = searchParams.get("session_id");
      if (!sessionId) {
        setIsChecking(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}&formId=${encodeURIComponent(formId)}`,
        );
        const data = await res.json();
        if (cancelled) return;

        if (res.ok && data.paid) {
          sessionStorage.setItem(paidKey(formId), sessionId);
          if (data.email) sessionStorage.setItem(GATE_EMAIL_KEY, data.email);
          setHasAccess(true);
          setJustPaid(true);
        }
      } catch (error) {
        console.error("Could not verify payment:", error);
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [formId, searchParams]);

  const paidSessionId = useCallback(
    () =>
      typeof window === "undefined"
        ? null
        : sessionStorage.getItem(paidKey(formId)),
    [formId],
  );

  return { hasAccess, isChecking, justPaid, paidSessionId };
}
