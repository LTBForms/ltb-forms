"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, FileText, Download, Search } from "lucide-react";
import PDFUnifiedTester from "./PDFUnifiedTester";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

import React, { useState, useEffect } from "react";
import EmailGateModal, {
  type EmailGateTarget,
} from "@/components/EmailGateModal";

/**
 * LTB Forms — landing page
 * 1:1 React conversion of the WordPress/Elementor build.
 *
 * Usage:  import LtbFormsLanding from "./LtbFormsLanding";
 *         <LtbFormsLanding />
 *
 * No dependencies. All styles are scoped under .ltb.
 */

/* ------------------------------------------------------------------ */
/* Icons (inline SVG — replaces Elementor's icon font)                  */
/* ------------------------------------------------------------------ */

type IcoProps = React.SVGProps<SVGSVGElement> & {
  d?: string;
  size?: number;
  sw?: number;
};

type FaqEntry = { q: string; a: string };

const Ico = ({
  d,
  size = 18,
  fill = "none",
  sw = 1.7,
  children,
  ...p
}: IcoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    {children || <path d={d} />}
  </svg>
);

const CheckCircle = ({ size = 17 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="11" fill="#1F7A4D" />
    <path
      d="M7.5 12.4l3 3 6-6.4"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IcoCoins = (p: IcoProps) => (
  <Ico {...p}>
    <ellipse cx="9" cy="6" rx="6" ry="3" />
    <path d="M3 6v5c0 1.7 2.7 3 6 3s6-1.3 6-3V6" />
    <path d="M15 12.5c3 .3 6 1.5 6 3.2 0 1.8-2.7 3.3-6 3.3s-6-1.5-6-3.3" />
  </Ico>
);
const IcoTrend = (p: IcoProps) => (
  <Ico {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </Ico>
);
const IcoCloud = (p: IcoProps) => (
  <Ico {...p}>
    <path d="M6.5 18a4.5 4.5 0 010-9 6 6 0 0111.4 1.6A3.7 3.7 0 0117.5 18H6.5z" />
  </Ico>
);
const IcoClock = (p: IcoProps) => (
  <Ico {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3.2 2" />
  </Ico>
);
const IcoShield = (p: IcoProps) => (
  <Ico {...p}>
    <path d="M12 3l7 3v5.5c0 4.4-3 7.9-7 9.5-4-1.6-7-5.1-7-9.5V6l7-3z" />
    <path d="M9.2 12l2 2 3.6-3.8" />
  </Ico>
);
const IcoChat = (p: IcoProps) => (
  <Ico {...p}>
    <path d="M20 12.5a7.5 7.5 0 01-11 6.6L4 21l1.9-4.7A7.5 7.5 0 1120 12.5z" />
  </Ico>
);
const IcoGear = (p: IcoProps) => (
  <Ico {...p}>
    <circle cx="12" cy="12" r="2.8" />
    <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5" />
  </Ico>
);
const IcoHeadset = (p: IcoProps) => (
  <Ico {...p}>
    <path d="M4 13v-1a8 8 0 0116 0v1" />
    <rect x="2.6" y="13" width="4.4" height="6" rx="2" />
    <rect x="17" y="13" width="4.4" height="6" rx="2" />
    <path d="M19 19v.6a2.6 2.6 0 01-2.6 2.6H13" />
  </Ico>
);
const IcoBolt = (p: IcoProps) => (
  <Ico {...p}>
    <path d="M13.5 2L4.8 13.4h6L10.5 22l8.7-11.4h-6L13.5 2z" />
  </Ico>
);
const IcoDocCheck = (p: IcoProps) => (
  <Ico {...p}>
    <path d="M14 2.8H7a2 2 0 00-2 2v14.4a2 2 0 002 2h10a2 2 0 002-2V7.8L14 2.8z" />
    <path d="M13.6 3v5h5" />
    <path d="M8.8 14.4l1.9 1.9 3.6-3.8" />
  </Ico>
);
const IcoScale = (p: IcoProps) => (
  <Ico {...p}>
    <path d="M12 3v18M6 21h12M3 8l3-4 3 4M15 8l3-4 3 4M3 8c0 1.7 1.3 3 3 3s3-1.3 3-3M15 8c0 1.7 1.3 3 3 3s3-1.3 3-3M12 4.5L6 6M12 4.5L18 6" />
  </Ico>
);
const IcoAward = (p: IcoProps) => (
  <Ico {...p}>
    <circle cx="12" cy="8.5" r="5.5" />
    <path d="M8.4 13.2L7 22l5-2.6L17 22l-1.4-8.8" />
  </Ico>
);
const IcoTag = (p: IcoProps) => (
  <Ico {...p}>
    <path d="M20.6 13.3l-7.3 7.3a2 2 0 01-2.8 0l-7.1-7.1a2 2 0 01-.6-1.4V4.5a2 2 0 012-2h7.6a2 2 0 011.4.6l6.8 6.8a2 2 0 010 2.8z" />
    <circle cx="7.6" cy="7.6" r="1.3" fill="currentColor" stroke="none" />
  </Ico>
);
const IcoDoc = (p: IcoProps) => (
  <Ico {...p}>
    <path d="M14 2.8H7a2 2 0 00-2 2v14.4a2 2 0 002 2h10a2 2 0 002-2V7.8L14 2.8z" />
    <path d="M13.6 3v5h5M8.6 12.5h6.8M8.6 16h4.6" />
  </Ico>
);
const IcoArrowRight = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 12h15M13 5.5l6.5 6.5L13 18.5" />
  </svg>
);
const IcoChevronUp = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 15l6-6 6 6" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Content                                                              */
/* ------------------------------------------------------------------ */

/* Section visibility. Flip to true to bring a section back. */
const SHOW_FOUNDER_VIDEO = false;
const SHOW_TEAM_PHOTOS = false;

const PHONE = "(905) 926-5898";
const PHONE_HREF = "tel:+19059265898";

/* Real routes on the live site. Change them in one place here. */
const ROUTES = {
  home: "/",
  n4: "/n4",
  n5: "/n5",
  n8: "/n8",
  n12: "/n12",
  contact: "/contact-us",
};

const GATED_ROUTES: Record<string, EmailGateTarget> = {
  [ROUTES.n4]: {
    href: ROUTES.n4,
    formId: "n4",
    title: "Start your N4",
    subtitle: "Notice to End Tenancy for Non-Payment of Rent",
  },
  [ROUTES.n5]: {
    href: ROUTES.n5,
    formId: "n5",
    title: "Start your N5",
    subtitle: "Interference, Damage or Overcrowding",
  },
  [ROUTES.n8]: {
    href: ROUTES.n8,
    formId: "n8",
    title: "Start your N8",
    subtitle: "Notice to End Tenancy at End of Term",
  },
  [ROUTES.n12]: {
    href: ROUTES.n12,
    formId: "n12",
    title: "Start your N12",
    subtitle: "Notice to End Tenancy for Landlord's Own Use",
  },
};

/**
 * Internal links render as a plain <a>, so this file works in any React app.
 * In the Next.js app, swap the body for next/link to get client-side routing:
 *
 *   import Link from "next/link";
 *   const LinkTo = ({ href, ...p }) => <Link href={href} {...p} />;
 *
 * Leave the tel: links as plain <a> — next/link is only for internal routes.
 */
const GateContext = React.createContext<((t: EmailGateTarget) => void) | null>(
  null,
);

const LinkTo = ({ href, onClick, ...p }: React.ComponentProps<"a">) => {
  const openGate = React.useContext(GateContext);
  const target = href ? GATED_ROUTES[href] : undefined;

  return (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (!target || !openGate) return;
        // let cmd/ctrl/middle-click open a new tab as normal
        if (
          e.defaultPrevented ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.button !== 0
        )
          return;
        e.preventDefault();
        openGate(target);
      }}
      {...p}
    />
  );
};

const NAV = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Forms List", href: "#forms" },
  { label: "Why Trust Us", href: "#trust" },
  { label: "FAQ", href: "#faq" },
];

const HERO_POINTS = [
  "Official Ontario LTB-compliant forms",
  "Complete your N4 in minutes",
  "Instant PDF download",
  "Licensed paralegal support available",
  "Trusted by Ontario landlords",
];

const COSTS = [
  {
    icon: IcoCoins,
    text: "More unpaid rent adds up while nothing is officially in motion.",
  },
  {
    icon: IcoTrend,
    text: "Financial pressure builds — your mortgage, taxes and upkeep don't pause.",
  },
  {
    icon: IcoCloud,
    text: "The stress of an unresolved situation carries into everything else.",
  },
  {
    icon: IcoClock,
    text: "Recovering possession of your property is pushed further out.",
  },
];

const STEPS = [
  {
    eyebrow: "Pay and get started",
    title: "Start your N4 today",
    body: "Pay first, then answer a few plain-English questions about your tenancy and the rent owed. We use your answers to prepare the official Ontario N4 notice.",
  },
  {
    eyebrow: "Complete your N4",
    title: "Answer a few simple questions",
    body: "Provide the details about your tenancy and unpaid rent. Your answers are used to prepare your completed N4 notice.",
  },
  {
    eyebrow: "Get your N4 reviewed",
    title: "A licensed paralegal can review your notice",
    body: "Before you serve the N4, a licensed paralegal can review your completed notice to help make sure everything is properly prepared.",
  },
  {
    eyebrow: "Serve your N4",
    title: "Download and serve your notice",
    body: "Once you're ready, download your completed N4, print it, and serve it on your tenant. If the notice period passes without payment, a licensed paralegal can help you move forward with the next step.",
  },
];

const BENEFITS = [
  {
    icon: IcoShield,
    title: "Avoid costly mistakes that delay your case",
    body: "Reduce the risk of errors that could get your application dismissed and force you to start over. Get your N4 right the first time so you can move your case forward with confidence.",
  },
  {
    icon: IcoChat,
    title: "Complete your N4 with confidence, without decoding legal language",
    body: "Know exactly what information to provide and move forward without getting stuck trying to interpret complicated Board instructions.",
  },
  {
    icon: IcoGear,
    title: "Get the right Ontario form completed correctly the first time",
    body: "Reduce the risk of errors that could force you to restart the process and lose valuable time.",
  },
  {
    icon: IcoHeadset,
    title: "Get professional help when your case becomes complicated",
    body: "Get experienced support when you need it, so you don't have to navigate filing or a hearing on your own.",
  },
  {
    icon: IcoBolt,
    title: "Save time, reduce stress, and move your case forward faster",
    body: "Spend less time figuring out what to do next and more time moving toward a resolution.",
  },
];

const PLANS = [
  {
    icon: IcoDocCheck,
    title: "Do it yourself",
    body: "Complete the form yourself in minutes and download it instantly.",
    cta: "Start My N4",
    href: ROUTES.n4,
    featured: true,
    badge: "Where most landlords start",
  },
  {
    icon: IcoScale,
    title: "Get help filing",
    body: "A licensed paralegal files your application with the Board for you.",
    cta: "Talk To Us",
    href: ROUTES.contact,
  },
  {
    icon: IcoAward,
    title: "Full representation",
    body: "Receive full representation if your matter proceeds to a hearing.",
    cta: "Get A Quote",
    href: ROUTES.contact,
  },
];

const PRICE_ROWS = [
  [
    "N4 self-drafting form",
    "$43",
    "Complete the online form and download your finished N4 instantly",
  ],
  [
    "N4 + filing with the LTB",
    "$43 + filing fee",
    "We prepare and file your application with the Landlord and Tenant Board",
  ],
  [
    "N4 + filing + representation",
    "Custom quote",
    "Full-service legal support, including your hearing",
  ],
  [
    "Other forms (N5, N6, N7, N8, N12)",
    "Custom quote",
    "Paralegal-assisted drafting with optional representation",
  ],
];

const FORMS = [
  {
    name: "Form N4",
    desc: "Notice to End Tenancy for Non-Payment of Rent",
    cta: "Start Online",
    href: ROUTES.n4,
  },
  {
    name: "Form N5",
    desc: "Interference, Damage or Overcrowding",
    cta: "Start Online",
    href: ROUTES.n5,
  },
  {
    name: "Form N8",
    desc: "Notice to End Tenancy at End of Term",
    cta: "Start Online",
    href: ROUTES.n8,
  },
  {
    name: "Form N12",
    desc: "Notice to End Tenancy for Landlord's Own Use",
    cta: "Start Online",
    href: ROUTES.n12,
  },
];
const TRUST = [
  {
    icon: IcoAward,
    title: "Licensed Ontario paralegals",
    body: "Licensed by the Law Society of Ontario and experienced in landlord matters.",
  },
  {
    icon: IcoGear,
    title: "Official Ontario LTB forms",
    body: "The Board's own forms, prepared to its formatting requirements.",
  },
  {
    icon: IcoTag,
    title: "Transparent pricing",
    body: "$43 for the N4. No subscriptions, no surprise charges.",
  },
  {
    icon: IcoHeadset,
    title: "Professional legal support",
    body: "Real people to call when your situation isn't straightforward.",
  },
  {
    icon: IcoBolt,
    title: "Fast turnaround",
    body: "Your completed form is ready to download the moment you finish.",
  },
];

const STORIES = [
  {
    tone: "dark",
    quote: "I completed my N4 in 5 minutes. This system is a game changer.",
    by: "Toronto Landlord",
  },
  {
    tone: "light",
    quote:
      "The paralegal handled my N5 and hearing flawlessly. I felt supported the entire way.",
    by: "Mississauga Landlord",
  },
];

const FAQ_ANSWER =
  "Yes. Your answers are used to complete the official Landlord and Tenant Board N4 — Notice to End your Tenancy Early for Non-payment of Rent. You download the finished form as a PDF, ready to serve.";

const FAQ_LEFT = [
  { q: "Is this the official Ontario N4 form?", a: FAQ_ANSWER },
  { q: "Can I complete this myself?", a: FAQ_ANSWER },
  { q: "What happens after I serve the notice?", a: FAQ_ANSWER },
];
const FAQ_RIGHT = [
  { q: "What if I make a mistake?", a: FAQ_ANSWER },
  { q: "When should I hire a paralegal?", a: FAQ_ANSWER },
  { q: "Can someone review my form before I submit it?", a: FAQ_ANSWER },
];

/* ------------------------------------------------------------------ */
/* Small pieces                                                         */
/* ------------------------------------------------------------------ */

const Eyebrow = ({
  children,
  center,
  light,
}: {
  children: React.ReactNode;
  center?: boolean;
  light?: boolean;
}) => (
  <p
    className={`eyebrow${center ? " eyebrow--center" : ""}${light ? " eyebrow--light" : ""}`}
  >
    <span className="eyebrow__rule" />
    {children}
    {center && <span className="eyebrow__rule" />}
  </p>
);

const money = (n: number) =>
  "$" + Math.round(n).toLocaleString("en-CA", { maximumFractionDigits: 0 });

function CostCalculator() {
  const [rent, setRent] = useState("2200");
  const value = Number(String(rent).replace(/[^0-9.]/g, "")) || 0;

  return (
    <div className="calc">
      <h3 className="calc__title">What waiting is costing you</h3>
      <label className="calc__label" htmlFor="ltb-rent">
        Your monthly rent
      </label>
      <div className="calc__field">
        <span className="calc__prefix">$</span>
        <input
          id="ltb-rent"
          className="calc__input"
          type="text"
          inputMode="numeric"
          value={rent}
          onChange={(e) => setRent(e.target.value.replace(/[^0-9]/g, ""))}
          aria-label="Your monthly rent in dollars"
        />
      </div>

      <div className="calc__grid">
        {[1, 2, 3].map((m) => (
          <div className="calc__tile" key={m}>
            <span className="calc__amount">{money(value * m)}</span>
            <span className="calc__months">
              {m} {m === 1 ? "month" : "months"}
            </span>
          </div>
        ))}
      </div>

      <p className="calc__note">
        An estimate of rent lost while the process hasn't started. The sooner
        your N4 is served, the sooner the clock runs in your favour.
      </p>
    </div>
  );
}

function FaqItem({
  q,
  a,
  open,
  onToggle,
  id,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <div className={`faq__item${open ? " is-open" : ""}`}>
      <button
        className="faq__q"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        id={`${id}-btn`}
        onClick={onToggle}
        type="button"
      >
        <span>{q}</span>
        <span className="faq__sign" aria-hidden="true">
          {open ? (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
            >
              <path d="M5 12h14" />
            </svg>
          ) : (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
        </span>
      </button>
      <div
        className="faq__panel"
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-btn`}
        hidden={!open}
      >
        <p>{a}</p>
      </div>
    </div>
  );
}

function FaqColumn({ items, prefix }: { items: FaqEntry[]; prefix: string }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq__col">
      {items.map((it, i) => (
        <FaqItem
          key={it.q}
          id={`${prefix}-${i}`}
          q={it.q}
          a={it.a}
          open={open === i}
          onToggle={() => setOpen(open === i ? -1 : i)}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  const [playing, setPlaying] = useState(false);
  const [gateTarget, setGateTarget] = useState<EmailGateTarget | null>(null);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <GateContext.Provider value={setGateTarget}>
      <div className="ltb">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />

        {/* ---------------- Header ---------------- */}
        <header className="hdr">
          <div className="wrap hdr__inner">
            <LinkTo className="hdr__logo" href={ROUTES.home}>
              LTB Forms
            </LinkTo>

            <nav
              className={`hdr__nav${menuOpen ? " is-open" : ""}`}
              aria-label="Primary"
            >
              {NAV.map((n) => (
                <a
                  key={n.label}
                  href={n.href}
                  onClick={() => setMenuOpen(false)}
                >
                  {n.label}
                </a>
              ))}
              <a
                className="btn btn--red hdr__phone hdr__phone--mobile"
                href={PHONE_HREF}
              >
                {PHONE}
              </a>
            </nav>

            <a className="btn btn--red hdr__phone" href={PHONE_HREF}>
              {PHONE}
            </a>

            <button
              className="hdr__burger"
              type="button"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </header>

        {/* ---------------- Hero ---------------- */}
        <section className="sec sec--hero" id="top">
          <div className="wrap">
            <div className="hero">
              <Eyebrow>Ontario Landlord &amp; Tenant Board notices</Eyebrow>
              <h1 className="hero__h1">
                Protect Your Rental Income.
                <br />
                <span className="red">Take Action on Unpaid Rent Today.</span>
              </h1>
              <p className="hero__lead">
                Complete your Ontario N4 correctly in minutes so you can begin
                the legal process with confidence. Download your completed form
                instantly or get help from one of our licensed paralegals.
              </p>

              <ul className="hero__points">
                {HERO_POINTS.map((p) => (
                  <li key={p}>
                    <CheckCircle />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              <LinkTo className="btn btn--red btn--lg" href={ROUTES.n4}>
                Start My N4 – $43
              </LinkTo>
            </div>
          </div>
        </section>

        {/* ---------------- Cost of waiting ---------------- */}
        <section className="sec sec--dark">
          <div className="wrap cost">
            <div className="cost__left">
              <Eyebrow light>Why timing matters</Eyebrow>
              <h2 className="h2 h2--light">
                Every Month You Wait Can Cost You More
              </h2>
              <p className="lead lead--light">
                The N4 process only begins once you've drafted a compliant N4
                notice. Until then, the calendar keeps moving and so does the
                amount you're owed.
              </p>

              <ul className="cost__list">
                {COSTS.map(({ icon: Icon, text }) => (
                  <li key={text}>
                    <span className="cost__ico">
                      <Icon size={19} />
                    </span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="cost__right">
              <CostCalculator />
            </div>
          </div>
        </section>

        {/* ---------------- Video (hidden — set SHOW_FOUNDER_VIDEO = true) ---------------- */}
        {SHOW_FOUNDER_VIDEO && (
          <section className="sec sec--cream">
            <div className="wrap center">
              <Eyebrow center>A message from our founder</Eyebrow>
              <h2 className="h2">
                Before You File Your N4, Watch This 90-Second Video
              </h2>
              <p className="lead lead--center">
                Dealing with a tenant who has stopped paying is stressful, and
                most landlords have never done this before. In 90 seconds, our
                founder explains where you are in the process, why you're in the
                right place, and how LTB Forms makes the next step simple.
              </p>

              <div className="video">
                {playing ? (
                  <iframe
                    className="video__frame"
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                    title="Founder welcome video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <button
                    className="video__poster"
                    type="button"
                    onClick={() => setPlaying(true)}
                  >
                    <span className="video__play" aria-hidden="true">
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="#fff"
                      >
                        <path d="M8 5.2v13.6L19 12 8 5.2z" />
                      </svg>
                    </span>
                    <span className="video__cap">
                      Founder welcome video — 1:30
                    </span>
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ---------------- Steps ---------------- */}
        <section className="sec" id="how-it-works">
          <div className="wrap">
            <div className="center">
              <Eyebrow center>Your path forward</Eyebrow>
              <h2 className="h2">What happens from here</h2>
              <p className="lead lead--center">
                You choose how far you want to go. Most landlords start with the
                form and stop there. Help is waiting if you need it.
              </p>
            </div>

            <ol className="steps">
              {STEPS.map((s, i) => (
                <li className="step" key={s.title}>
                  <div className="step__marker">
                    <span className="step__num">{i + 1}</span>
                    <span className="step__line" />
                  </div>
                  <p className="step__eyebrow">{s.eyebrow}</p>
                  <h3 className="step__title">{s.title}</h3>
                  <p className="step__body">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------- Benefits ---------------- */}
        <section className="sec sec--tight">
          <div className="wrap">
            <Eyebrow>Why landlords choose us</Eyebrow>
            <h2 className="h2 h2--left">
              Built to protect your case, not just fill a form
            </h2>

            <ul className="benefits">
              {BENEFITS.map(({ icon: Icon, title, body }) => (
                <li className="benefit" key={title}>
                  <span className="benefit__ico">
                    <Icon size={19} />
                  </span>
                  <h3 className="benefit__title">{title}</h3>
                  <p className="benefit__body">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------------- Pricing ---------------- */}
        <section className="sec sec--cream" id="pricing">
          <div className="wrap">
            <div className="center">
              <Eyebrow center>Pricing</Eyebrow>
              <h2 className="h2">Choose the level of help you need</h2>
              <p className="lead lead--center">
                Every landlord's situation is different. Some just need the form
                done right. Others want it handled from start to finish. Find
                the option that fits where you are, then see the full pricing
                below.
              </p>
            </div>

            <div className="plans">
              {PLANS.map(
                ({ icon: Icon, title, body, cta, href, featured, badge }) => (
                  <div
                    className={`plan${featured ? " plan--featured" : ""}`}
                    key={title}
                  >
                    {badge && <span className="plan__badge">{badge}</span>}
                    <span className="plan__ico">
                      <Icon size={22} />
                    </span>
                    <h3 className="plan__title">{title}</h3>
                    <p className="plan__body">{body}</p>
                    <LinkTo
                      className={`btn ${featured ? "btn--red" : "btn--ghost"} plan__cta`}
                      href={href}
                    >
                      {cta}
                    </LinkTo>
                  </div>
                ),
              )}
            </div>

            <div className="table-wrap">
              <table className="ptable">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Price</th>
                    <th>What you get</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICE_ROWS.map(([s, p, d]) => (
                    <tr key={s}>
                      <td className="ptable__service" data-label="Service">
                        {s}
                      </td>
                      <td className="ptable__price" data-label="Price">
                        {p}
                      </td>
                      <td className="ptable__desc" data-label="What you get">
                        {d}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ---------------- Other notices ---------------- */}
        <section className="sec" id="forms">
          <div className="wrap">
            <Eyebrow>Other notices</Eyebrow>
            <h2 className="h2 h2--left">Not a non-payment issue?</h2>
            <p className="lead">
              The N4 covers unpaid rent. If your situation is different, a
              licensed paralegal will draft the right notice with you.
            </p>

            <div className="forms">
              {FORMS.map((f) => (
                <div className="formcard" key={f.name}>
                  <span className="formcard__ico">
                    <IcoDoc size={20} />
                  </span>
                  <h3 className="formcard__name">{f.name}</h3>
                  <p className="formcard__desc">{f.desc}</p>
                  <LinkTo className="formcard__link" href={f.href}>
                    {f.cta} <IcoArrowRight />
                  </LinkTo>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Testimonials ---------------- */}
        <section className="sec sec--cream">
          <div className="wrap">
            <Eyebrow>Landlord stories</Eyebrow>
            <h2 className="h2 h2--left">People who were where you are now</h2>

            <div className="stories">
              {STORIES.map((s) => (
                <figure className={`story story--${s.tone}`} key={s.by}>
                  <blockquote className="story__quote">“{s.quote}”</blockquote>
                  <figcaption className="story__by">— {s.by}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Trust ---------------- */}
        <section className="sec" id="trust">
          <div className="wrap">
            <div className="center">
              <Eyebrow center>Trust &amp; credentials</Eyebrow>
              <h2 className="h2">Why landlords put this in our hands</h2>
            </div>

            <div className="trust">
              {TRUST.map(({ icon: Icon, title, body }) => (
                <div className="trust__card" key={title}>
                  <span className="trust__ico">
                    <Icon size={21} />
                  </span>
                  <h3 className="trust__title">{title}</h3>
                  <p className="trust__body">{body}</p>
                </div>
              ))}
            </div>

            {/* Placeholder photos hidden — set SHOW_TEAM_PHOTOS = true */}
            {SHOW_TEAM_PHOTOS && (
              <div className="photos">
                {[0, 1, 2].map((i) => (
                  <div className="photos__slot" key={i}>
                    Photo — your paralegal team
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section className="sec sec--cream" id="faq">
          <div className="wrap">
            <div className="center">
              <Eyebrow center>Questions</Eyebrow>
              <h2 className="h2">Before you start</h2>
            </div>

            <div className="faq">
              <FaqColumn items={FAQ_LEFT} prefix="faq-l" />
              <FaqColumn items={FAQ_RIGHT} prefix="faq-r" />
            </div>
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="sec sec--cta" id="start">
          <div className="wrap center">
            <h2 className="cta__h2">Ready to move your case forward?</h2>
            <p className="cta__lead">
              Don't let another month of unpaid rent delay the process. Complete
              your N4 online in minutes or speak with one of our licensed
              paralegals today.
            </p>
            <div className="cta__row">
              <LinkTo className="btn btn--white" href={ROUTES.n4}>
                Start My N4
              </LinkTo>
              <a className="btn btn--outline-dark" href={PHONE_HREF}>
                Call Now
              </a>
            </div>
          </div>
        </section>

        {/* ---------------- Footer ---------------- */}
        <footer className="ftr">
          <div className="wrap ftr__inner">
            <p>
              © 2026 LTB Forms. Ontario Landlord &amp; Tenant Board form
              preparation and paralegal services.
            </p>
            <a href={PHONE_HREF}>{PHONE}</a>
          </div>
        </footer>

        <button
          className={`totop${showTop ? " is-visible" : ""}`}
          type="button"
          aria-label="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <IcoChevronUp />
        </button>

        <EmailGateModal
          target={gateTarget}
          onClose={() => setGateTarget(null)}
        />
      </div>
    </GateContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                               */
/* ------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

.ltb{
  --red:#B7121F;
  --red-dark:#9C0F1A;
  --ink:#131A2A;
  --ink-2:#171A2B;
  --body:#6B7280;
  --body-dark:#8B94A2;
  --cream:#F5F4F0;
  --line:#E7E7E4;
  --line-dark:rgba(255,255,255,.09);
  --tint:#FCF2F1;
  --pink:#F09AA0;
  --wrap:1000px;

  font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
  color:var(--ink);
  background:#fff;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.ltb *,.ltb *::before,.ltb *::after{box-sizing:border-box;}
.ltb p,.ltb h1,.ltb h2,.ltb h3,.ltb figure,.ltb blockquote,.ltb ul,.ltb ol{margin:0;padding:0;}
.ltb ul,.ltb ol{list-style:none;}
.ltb a{color:inherit;text-decoration:none;}
.ltb img{max-width:100%;display:block;}
.ltb button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;}
.ltb :focus-visible{outline:2px solid var(--red);outline-offset:3px;border-radius:4px;}

.ltb .wrap{width:100%;max-width:var(--wrap);margin:0 auto;padding:0 24px;}
.ltb .center{text-align:center;}
.ltb .red{color:var(--red);}

/* ---- type ---- */
.ltb .h2{
  font-family:'Plus Jakarta Sans',sans-serif;
  font-weight:800;
  font-size:38px;
  line-height:1.2;
  letter-spacing:-.02em;
  text-transform:capitalize;
  color:var(--ink);
  max-width:640px;
  margin:0 auto;
}
.ltb .center .h2{margin-inline:auto;}
.ltb .h2--left{max-width:560px;margin-left:0;}
.ltb .h2--light{color:#fff;max-width:460px;margin-left:0;}

.ltb .lead{
  font-size:16px;line-height:1.72;color:var(--body);
  max-width:600px;margin-top:16px;
}
.ltb .lead--center{margin-inline:auto;text-align:center;max-width:590px;}
.ltb .lead--light{color:var(--body-dark);max-width:430px;}

.ltb .eyebrow{
  display:flex;align-items:center;gap:10px;
  font-size:11.5px;font-weight:700;letter-spacing:.13em;
  text-transform:uppercase;color:var(--red);margin-bottom:16px;
}
.ltb .eyebrow--center{justify-content:center;}
.ltb .eyebrow--light{color:var(--pink);}
.ltb .eyebrow__rule{width:26px;height:1.5px;background:currentColor;flex:none;}

/* ---- buttons ---- */
.ltb .btn{
  display:inline-flex;align-items:center;justify-content:center;
  font-family:'Plus Jakarta Sans',sans-serif;
  font-weight:700;font-size:14.5px;letter-spacing:.01em;
  padding:14px 26px;border-radius:8px;
  transition:transform .15s ease,background .15s ease,box-shadow .15s ease,color .15s ease;
  white-space:nowrap;
}
.ltb .btn--red{background:var(--red);color:#fff;box-shadow:0 6px 16px rgba(183,18,31,.24);}
.ltb .btn--red:hover{background:var(--red-dark);transform:translateY(-1px);}
.ltb .btn--lg{padding:17px 32px;font-size:15.5px;}
.ltb .btn--ghost{background:#fff;color:var(--ink);border:1px solid var(--line);}
.ltb .btn--ghost:hover{border-color:var(--ink);}
.ltb .btn--white{background:#fff;color:var(--red);box-shadow:0 6px 18px rgba(0,0,0,.14);}
.ltb .btn--white:hover{transform:translateY(-1px);}
.ltb .btn--outline-dark{background:#fff;color:var(--ink);border:1px solid rgba(0,0,0,.25);box-shadow:0 6px 18px rgba(0,0,0,.14);}
.ltb .btn--outline-dark:hover{transform:translateY(-1px);}

/* ---- sections ---- */
.ltb .sec{padding:96px 0;}
.ltb .sec--tight{padding-top:0;}
.ltb .sec--cream{background:var(--cream);}
.ltb .sec--dark{background:var(--ink);}
.ltb .sec--hero{padding:104px 0 112px;}

/* ---- header ---- */
.ltb .hdr{
  position:sticky;top:0;z-index:60;background:#fff;
  border-bottom:1px solid var(--line);
}
.ltb .hdr__inner{display:flex;align-items:center;gap:24px;height:74px;}
.ltb .hdr__logo{
  font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:21px;
  letter-spacing:-.02em;color:var(--red);
}
.ltb .hdr__nav{display:flex;align-items:center;gap:26px;margin:0 auto;}
.ltb .hdr__nav a{font-size:14.5px;font-weight:500;color:#2A3242;transition:color .15s;}
.ltb .hdr__nav a:hover{color:var(--red);}
.ltb .hdr__phone{padding:12px 22px;font-size:14.5px;}
.ltb .hdr__phone--mobile{display:none;}
.ltb .hdr__burger{display:none;flex-direction:column;gap:5px;padding:8px;margin-left:auto;}
.ltb .hdr__burger span{width:22px;height:2px;background:var(--ink);border-radius:2px;}

/* ---- hero ---- */
.ltb .hero{max-width:640px;}
.ltb .hero__h1{
  font-family:'Plus Jakarta Sans',sans-serif;
  font-weight:800;font-size:54px;line-height:1.16;letter-spacing:-.028em;
  text-transform:capitalize;
}
.ltb .hero__lead{margin-top:22px;font-size:16.5px;line-height:1.75;color:var(--body);max-width:610px;}
.ltb .hero__points{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));
  gap:12px 26px;margin:28px 0 34px;max-width:600px;
}
.ltb .hero__points li{display:flex;align-items:flex-start;gap:10px;font-size:14.5px;font-weight:500;line-height:1.4;}
.ltb .hero__points svg{flex:none;margin-top:1px;}

/* ---- cost ---- */
.ltb .cost{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:start;}
.ltb .cost__list{margin-top:30px;}
.ltb .cost__list li{
  display:flex;align-items:flex-start;gap:14px;
  padding:17px 0;border-top:1px solid var(--line-dark);
  color:#E6E9EE;font-size:15px;line-height:1.55;
}
.ltb .cost__list li:last-child{border-bottom:1px solid var(--line-dark);}
.ltb .cost__ico{color:var(--pink);flex:none;margin-top:1px;}

.ltb .calc{background:#fff;border-radius:14px;padding:26px;box-shadow:0 18px 44px rgba(0,0,0,.22);}
.ltb .calc__title{font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:700;}
.ltb .calc__label{
  display:block;margin:14px 0 8px;font-size:10.5px;font-weight:600;
  letter-spacing:.1em;text-transform:uppercase;color:var(--body-dark);
}
.ltb .calc__field{
  display:flex;align-items:center;gap:8px;background:#F3F3F1;
  border:1px solid #EAEAE6;border-radius:8px;padding:13px 16px;
}
.ltb .calc__prefix{color:#9AA0A6;font-size:14px;}
.ltb .calc__input{
  border:0;background:transparent;width:100%;
  font-family:'Plus Jakarta Sans',sans-serif;font-size:19px;font-weight:700;color:var(--ink);
}
.ltb .calc__input:focus{outline:none;}
.ltb .calc__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px;}
.ltb .calc__tile{background:var(--tint);border-radius:8px;padding:15px 8px;text-align:center;}
.ltb .calc__amount{
  display:block;font-family:'Plus Jakarta Sans',sans-serif;
  font-size:19px;font-weight:800;color:var(--red);letter-spacing:-.01em;
}
.ltb .calc__months{
  display:block;margin-top:4px;font-size:9.5px;font-weight:500;
  letter-spacing:.09em;text-transform:uppercase;color:#8A8A8A;
}
.ltb .calc__note{margin-top:16px;font-size:12.5px;line-height:1.6;color:#9AA0A6;}

/* ---- video ---- */
.ltb .video{
  margin:44px auto 0;max-width:700px;aspect-ratio:16/9;
  border-radius:12px;overflow:hidden;box-shadow:0 24px 50px rgba(19,26,42,.22);
}
.ltb .video__frame{width:100%;height:100%;border:0;display:block;}
.ltb .video__poster{
  width:100%;height:100%;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:14px;
  background:linear-gradient(150deg,#1D2739 0%,#2C394F 55%,#212C3E 100%);
}
.ltb .video__play{
  width:56px;height:56px;border-radius:50%;background:var(--red);
  display:flex;align-items:center;justify-content:center;padding-left:4px;
  box-shadow:0 8px 22px rgba(183,18,31,.45);transition:transform .18s ease;
}
.ltb .video__poster:hover .video__play{transform:scale(1.07);}
.ltb .video__cap{font-size:12.5px;color:#93A0B4;}

/* ---- steps ---- */
.ltb .steps{
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));
  gap:0 24px;margin-top:56px;
}
.ltb .step{position:relative;padding-right:8px;}
.ltb .step__marker{display:flex;align-items:center;margin-bottom:20px;}
.ltb .step__num{
  width:40px;height:40px;border-radius:50%;background:var(--red);color:#fff;
  display:flex;align-items:center;justify-content:center;flex:none;
  font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:700;
}
.ltb .step__line{flex:1;height:1px;background:#E0AEB3;margin-left:8px;}
.ltb .step__eyebrow{
  font-size:10.5px;font-weight:700;letter-spacing:.1em;
  text-transform:uppercase;color:var(--red);margin-bottom:8px;
}
.ltb .step__title{
  font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;font-weight:700;
  line-height:1.3;letter-spacing:-.01em;
}
.ltb .step__body{margin-top:12px;font-size:14px;line-height:1.68;color:var(--body);}

/* ---- benefits ---- */
.ltb .benefits{margin-top:36px;border-top:1px solid var(--line);}
.ltb .benefit{
  display:grid;grid-template-columns:64px minmax(0,1fr) minmax(0,1.05fr);
  gap:0 24px;align-items:start;padding:26px 0;border-bottom:1px solid var(--line);
}
.ltb .benefit__ico{
  width:42px;height:42px;border-radius:10px;background:var(--tint);color:var(--red);
  display:flex;align-items:center;justify-content:center;
}
.ltb .benefit__title{
  font-family:'Plus Jakarta Sans',sans-serif;font-size:16.5px;font-weight:700;
  line-height:1.42;letter-spacing:-.01em;padding-top:8px;
}
.ltb .benefit__body{font-size:14px;line-height:1.68;color:var(--body);padding-top:9px;}

/* ---- pricing ---- */
.ltb .plans{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:44px;}
.ltb .plan{
  position:relative;background:#fff;border:1px solid var(--line);
  border-radius:12px;padding:26px 24px 26px;
}
.ltb .plan--featured{border:1.5px solid var(--red);padding-top:34px;}
.ltb .plan__badge{
  position:absolute;top:-13px;left:20px;
  background:var(--red);color:#fff;border-radius:999px;
  padding:6px 15px;font-size:10px;font-weight:700;
  letter-spacing:.09em;text-transform:uppercase;white-space:nowrap;
}
.ltb .plan__ico{display:block;color:var(--red);margin-bottom:16px;}
.ltb .plan__title{font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;font-weight:700;letter-spacing:-.01em;}
.ltb .plan__body{margin-top:11px;font-size:14px;line-height:1.62;color:var(--body);min-height:46px;}
.ltb .plan__cta{display:flex;width:100%;margin-top:20px;}

.ltb .table-wrap{
  margin-top:26px;background:#fff;border-radius:12px;
  box-shadow:0 1px 3px rgba(0,0,0,.06);overflow-x:auto;-webkit-overflow-scrolling:touch;
}
.ltb .ptable{width:100%;min-width:640px;border-collapse:collapse;}
.ltb .ptable thead tr{background:var(--ink-2);}
.ltb .ptable th{
  color:#fff;text-align:left;padding:15px 24px;font-size:11px;
  letter-spacing:.09em;text-transform:uppercase;font-weight:600;
}
.ltb .ptable tbody tr{border-bottom:1px solid #EEE7DD;}
.ltb .ptable tbody tr:last-child{border-bottom:none;}
.ltb .ptable td{padding:19px 24px;vertical-align:top;}
.ltb .ptable__service{font-weight:700;color:var(--ink-2);font-size:14.5px;white-space:nowrap;}
.ltb .ptable__price{font-weight:700;color:var(--ink-2);font-size:14px;white-space:nowrap;}
.ltb .ptable__desc{color:#7A7A7A;font-size:14px;line-height:1.5;}

/* ---- forms ---- */
.ltb .forms{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:38px;}
.ltb .formcard{
  background:#fff;border:1px solid var(--line);border-radius:10px;padding:20px;
  transition:box-shadow .18s ease,transform .18s ease;
}
.ltb .formcard:hover{box-shadow:0 10px 26px rgba(19,26,42,.09);transform:translateY(-2px);}
.ltb .formcard__ico{display:block;color:var(--red);margin-bottom:13px;}
.ltb .formcard__name{font-family:'Plus Jakarta Sans',sans-serif;font-size:16.5px;font-weight:700;}
.ltb .formcard__desc{margin-top:9px;font-size:13.5px;line-height:1.55;color:var(--body);min-height:42px;}
.ltb .formcard__link{
  display:inline-flex;align-items:center;gap:7px;margin-top:14px;
  font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:700;color:var(--red);
}
.ltb .formcard__link:hover{gap:11px;}

/* ---- stories ---- */
.ltb .stories{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:40px;align-items:stretch;}
.ltb .story{
  border-radius:12px;padding:34px 32px;
  display:flex;flex-direction:column;justify-content:space-between;
}
.ltb .story--dark{background:var(--ink);}
.ltb .story--light{background:#fff;border:1px solid var(--line);}
.ltb .story__quote{
  font-family:'Plus Jakarta Sans',sans-serif;
  font-size:21px;font-weight:700;line-height:1.45;letter-spacing:-.015em;margin:0;
}
.ltb .story--dark .story__quote{color:#fff;}
.ltb .story--light .story__quote{color:var(--red);}
.ltb .story__by{
  margin-top:22px;padding-top:18px;border-top:1px solid var(--line-dark);
  font-family:'Plus Jakarta Sans',sans-serif;font-size:13.5px;font-weight:600;
  letter-spacing:.01em;
}
.ltb .story--dark .story__by{color:#9AA5B4;}
.ltb .story--light .story__by{color:var(--body);border-top-color:var(--line);}

/* ---- trust ---- */
.ltb .trust{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-top:44px;}
.ltb .trust__card{
  background:#fff;border:1px solid var(--line);border-radius:10px;
  padding:22px 16px;text-align:center;
}
.ltb .trust__ico{display:flex;justify-content:center;color:var(--red);margin-bottom:14px;}
.ltb .trust__title{font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:700;line-height:1.32;}
.ltb .trust__body{margin-top:10px;font-size:13px;line-height:1.6;color:var(--body);}

.ltb .photos{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:26px;}
.ltb .photos__slot{
  height:222px;border:1.5px dashed #D8D6CF;border-radius:10px;background:#F1F0EC;
  display:flex;align-items:center;justify-content:center;
  font-size:10.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#A8A6A0;
}

/* ---- faq ---- */
.ltb .faq{display:grid;grid-template-columns:1fr 1fr;gap:0 44px;margin-top:42px;}
.ltb .faq__item{padding:14px 0;}
.ltb .faq__q{
  width:100%;display:flex;align-items:center;justify-content:space-between;gap:20px;
  text-align:left;font-family:'Plus Jakarta Sans',sans-serif;
  font-size:16px;font-weight:700;line-height:1.35;
  text-transform:capitalize;color:var(--ink);padding:6px 0;
}
.ltb .faq__sign{color:var(--ink);flex:none;display:flex;}
.ltb .faq__item.is-open .faq__sign{color:var(--red);}
.ltb .faq__panel{padding:8px 40px 12px 0;}
.ltb .faq__panel p{font-size:14px;line-height:1.72;color:var(--body);}

/* ---- cta ---- */
.ltb .sec--cta{background:var(--red);padding:92px 0;}
.ltb .cta__h2{
  font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:36px;
  line-height:1.2;letter-spacing:-.02em;text-transform:capitalize;color:#fff;
}
.ltb .cta__lead{
  margin:18px auto 0;max-width:560px;font-size:15.5px;line-height:1.7;
  color:rgba(255,255,255,.92);
}
.ltb .cta__row{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin-top:32px;}
.ltb .cta__row .btn{padding:17px 34px;font-size:15px;}

/* ---- footer ---- */
.ltb .ftr{background:var(--ink);padding:26px 0;}
.ltb .ftr__inner{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;}
.ltb .ftr p{font-size:13.5px;color:#9AA5B4;}
.ltb .ftr a{font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:700;color:#fff;}

/* ---- back to top ---- */
.ltb .totop{
  position:fixed;right:22px;bottom:22px;z-index:70;
  width:38px;height:38px;border-radius:4px;background:var(--red);color:#fff;
  display:flex;align-items:center;justify-content:center;
  opacity:0;pointer-events:none;transform:translateY(8px);
  transition:opacity .2s ease,transform .2s ease;
  box-shadow:0 6px 18px rgba(0,0,0,.2);
}
.ltb .totop.is-visible{opacity:1;pointer-events:auto;transform:none;}

/* ---- responsive ---- */
@media (max-width:960px){
  .ltb .hdr__phone{display:none;}
  .ltb .hdr__burger{display:flex;}
  .ltb .hdr__nav{
    position:absolute;top:74px;left:0;right:0;background:#fff;
    border-bottom:1px solid var(--line);flex-direction:column;align-items:stretch;
    gap:0;padding:8px 24px 20px;margin:0;display:none;
    box-shadow:0 18px 30px rgba(19,26,42,.09);
  }
  .ltb .hdr__nav.is-open{display:flex;}
  .ltb .hdr__nav a{padding:13px 0;border-bottom:1px solid var(--line);}
  .ltb .hdr__phone--mobile{display:inline-flex;margin-top:16px;border-bottom:0;}

  .ltb .cost{grid-template-columns:1fr;gap:36px;}
  .ltb .h2--light,.ltb .lead--light{max-width:none;}
  .ltb .steps{grid-template-columns:repeat(2,1fr);gap:36px 24px;}
  .ltb .step:nth-child(2n) .step__line{display:none;}
  .ltb .plans{grid-template-columns:1fr;gap:26px;}
  .ltb .plan__body{min-height:0;}
  .ltb .forms{grid-template-columns:repeat(2,1fr);}
  .ltb .stories{grid-template-columns:1fr;}
  .ltb .trust{grid-template-columns:repeat(3,1fr);}
  .ltb .photos{grid-template-columns:1fr;}
  .ltb .faq{grid-template-columns:1fr;gap:0;}
}

@media (max-width:640px){
  .ltb .sec{padding:64px 0;}
  .ltb .sec--hero{padding:56px 0 64px;}
  .ltb .sec--tight{padding-top:0;}
  .ltb .hero__h1{font-size:34px;}
  .ltb .h2,.ltb .cta__h2{font-size:28px;}
  .ltb .hero__points{grid-template-columns:1fr;}
  .ltb .steps{grid-template-columns:1fr;}
  .ltb .step__line{display:none !important;}
  .ltb .benefit{grid-template-columns:44px minmax(0,1fr);gap:0 16px;}
  .ltb .benefit__title{padding-top:6px;}
  .ltb .benefit__body{grid-column:2;padding-top:10px;}
  .ltb .forms{grid-template-columns:1fr;}
  .ltb .formcard__desc{min-height:0;}
  .ltb .trust{grid-template-columns:1fr;}
  .ltb .story{padding:26px 24px;}
  .ltb .story__quote{font-size:18px;}
  .ltb .calc__grid{grid-template-columns:1fr;}
  .ltb .cta__row .btn{width:100%;}
}

@media (prefers-reduced-motion:reduce){
  .ltb *{transition:none !important;animation:none !important;scroll-behavior:auto !important;}
}
`;
