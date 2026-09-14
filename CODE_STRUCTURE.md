# LTB Forms — Code Structure

A Next.js 14 application for generating Ontario Landlord and Tenant Board (LTB) PDF notice forms with Stripe payment integration.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Tech Stack & Dependencies](#tech-stack--dependencies)
4. [Pages & Routing](#pages--routing)
5. [Components](#components)
   - [Landing Page Sections](#landing-page-sections)
   - [Form Components](#form-components)
   - [Utility Components](#utility-components)
   - [UI Components](#ui-components)
6. [API Routes](#api-routes)
7. [Hooks](#hooks)
8. [Library / Utilities](#library--utilities)
9. [Configuration Files](#configuration-files)
10. [Public Assets](#public-assets)
11. [Environment Variables](#environment-variables)
12. [Data Flow](#data-flow)
13. [Form Field Schemas](#form-field-schemas)
14. [Stripe Payment Integration](#stripe-payment-integration)
15. [PDF Generation](#pdf-generation)
16. [Email Delivery](#email-delivery)

---

## Project Overview

LTB Forms is a web application that allows Ontario landlords to fill in LTB notice forms online and download a completed PDF. The core flow is:

1. Landlord visits the landing page and selects a form (N4, N5, N8, or N12).
2. A multi-step React form collects all required information.
3. On completion, the user is redirected to a Stripe Checkout session.
4. After successful payment, the user is taken to a download page where the completed PDF is generated server-side and sent via email.

---

## Directory Structure

```
ltb-froms/
├── public/
│   ├── images/
│   │   ├── contact-us.svg
│   │   ├── form-paper.svg
│   │   ├── landing-logo.png
│   │   ├── logo.ico
│   │   ├── logo.png
│   │   ├── logo.webp
│   │   └── pdf-icon.png
│   └── templates/
│       ├── N4_Acro.pdf
│       ├── N5_Acro.pdf
│       ├── N8_Acro.pdf
│       └── N12_Acro.pdf
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── checkout/route.ts
│   │   │   ├── extract-pdf-fields/route.ts
│   │   │   ├── fill-n4/route.ts
│   │   │   ├── fill-n5/route.ts
│   │   │   ├── fill-n8/route.ts
│   │   │   ├── fill-n12/route.ts
│   │   │   └── send-email/route.ts
│   │   ├── contact-us/page.tsx
│   │   ├── download/page.tsx
│   │   ├── fonts/
│   │   │   ├── GeistMonoVF.woff
│   │   │   └── GeistVF.woff
│   │   ├── n4/page.tsx
│   │   ├── n5/page.tsx
│   │   ├── n8/page.tsx
│   │   ├── n12/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── logo.ico
│   │   └── page.tsx
│   ├── components/
│   │   ├── LandingPage/
│   │   │   ├── Header.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── HowItWorksSection.tsx
│   │   │   ├── PricingSection.tsx
│   │   │   ├── BenefitsSection.tsx
│   │   │   ├── ServicesSection.tsx
│   │   │   └── TestimonialSection.tsx
│   │   │   └── FooterCTA.tsx
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   └── toaster.tsx
│   │   ├── ContactPageComponent.tsx
│   │   ├── DownloadButtonPage.tsx
│   │   ├── DownloadPage.tsx
│   │   ├── FormN4.tsx
│   │   ├── FormN5.tsx
│   │   ├── FormN8.tsx
│   │   ├── FormN12.tsx
│   │   ├── LandingPage.tsx          ← (legacy, no longer used by page.tsx)
│   │   └── PDFUnifiedTester.tsx
│   ├── hooks/
│   │   ├── use-form-persistence.ts
│   │   └── use-toast.ts
│   └── lib/
│       ├── rentPaymentFormToHTML.ts
│       ├── utils.ts
│       └── validation.ts
├── .env
├── .eslintrc.json
├── CODE_STRUCTURE.md
├── README.md
├── components.json
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── test-checkout-integration.js
├── test-n4-dates.js
├── test-n4-rental-periods.js
├── test-tenant-names-handling.js
└── tsconfig.json
```

---

## Tech Stack & Dependencies

### Framework
- **Next.js 14** (App Router, Server Components, API Routes)
- **React 18**
- **TypeScript 5**

### UI
| Package | Purpose |
|---|---|
| `tailwindcss` + `tailwindcss-animate` | Utility-first CSS |
| `@radix-ui/react-*` | Headless UI primitives (checkbox, label, popover, radio-group, select, slot, toast) |
| `lucide-react` | Icon library |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Conditional class handling |

### Forms & Validation
| Package | Purpose |
|---|---|
| `react-hook-form` | Form state management |
| `@hookform/resolvers` | Zod resolver adapter |
| `zod` | Schema-based runtime validation |

### PDF
| Package | Purpose |
|---|---|
| `pdf-lib` | Server-side PDF field filling |
| `jspdf` + `html2canvas` | Client-side PDF generation (legacy/test) |

### Payments
| Package | Purpose |
|---|---|
| `stripe` | Stripe Checkout session creation |

### Email
| Package | Purpose |
|---|---|
| `@sendgrid/mail` | Email delivery via SendGrid |
| `nodemailer` | Fallback/alternative email transport |

### Dates
| Package | Purpose |
|---|---|
| `date-fns` | Date arithmetic helpers |
| `react-day-picker` | Calendar picker component |

### Analytics
| Package | Purpose |
|---|---|
| `@next/third-parties` | Google Tag Manager integration |

---

## Pages & Routing

| Route | File | Component Rendered | Description |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Landing page sections | Public marketing landing page |
| `/n4` | `src/app/n4/page.tsx` | `<FormN4 />` | 4-step N4 form |
| `/n5` | `src/app/n5/page.tsx` | `<FormN5 />` | 4-step N5 form |
| `/n8` | `src/app/n8/page.tsx` | `<FormN8 />` | 4-step N8 form |
| `/n12` | `src/app/n12/page.tsx` | `<FormN12 />` | 4-step N12 form |
| `/download` | `src/app/download/page.tsx` | `<DownloadPage />` | Post-payment PDF download & email |
| `/contact-us` | `src/app/contact-us/page.tsx` | `<ContactPageComponent />` | Contact page for paralegal-assisted forms |

### Root Layout (`src/app/layout.tsx`)
- Sets Inter font via `next/font/google`
- Configures `<Metadata>` (title: "LTB Forms", favicon)
- Sets `<Viewport>` — disables user scaling on mobile
- Injects `<GoogleTagManager>` using `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID`
- Renders `<Toaster />` globally for toast notifications

---

## Components

### Landing Page Sections

The landing page (`src/app/page.tsx`) is composed of independently imported section components from `src/components/LandingPage/`. The old `LandingPage.tsx` monolith is retained but no longer used by the main page.

#### `Header.tsx`
- Sticky top navigation bar
- Links: "How It Works", "Pricing", "Forms List" (anchor links)
- CTA button: `<a href="tel:9059265898">` (phone call)

#### `HeroSection.tsx`
- Full-width gradient section (`#EAB9BD4D`)
- Headline: *"LTB Forms. Filed Right — Every Time."*
- CTA button: `<Link href="/n4">Start My N4 Now</Link>`

#### `HowItWorksSection.tsx`
- Section ID: `#how-it-works`
- 5-step grid (`md:grid-cols-5`) with icons from `lucide-react`:
  1. Select Your Notice Type
  2. Complete the Online Form
  3. Make Your Payment
  4. Download Your N4 Instantly
  5. Complex Forms? We've Got You.

#### `PricingSection.tsx`
- Section ID: `#pricing`
- HTML table listing pricing tiers:
  | Service | Price |
  |---|---|
  | N4 Self-Drafting Form | $86 |
  | N4 + Filing with the LTB | $86 + Filing Fee |
  | N4 + Filing + Representation | Custom Quote |
  | Other Forms (N5, N6, N7, etc.) | Custom Quote |

#### `BenefitsSection.tsx`
- 5 benefit bullet points with `CheckCircleIcon`
- Grid layout: `md:grid-cols-2 lg:grid-cols-3`

#### `ServicesSection.tsx`
- Section ID: `#services`
- 4-column grid of form cards (N4, N5, N8, N12)
- **N4** and **N12** link directly to their form pages
- **N5** and **N8** link to `/contact-us` (paralegal-assisted)
- Each card shows `form-paper.svg` icon + form title + "Create form" link

#### `TestimonialSection.tsx`
- 2 testimonial cards with `QuoteIcon`
- Static testimonials from "Toronto Landlord" and "Mississauga Landlord"

#### `FooterCTA.tsx`
- Section ID: `#contact`
- Red background (`bg-btnBgPrimary`) CTA section
- Two buttons: "Start My N4 Now" (`/n4`) and phone call `(905) 926-5898`

---

### Form Components

All form components share the same architecture:

**Common patterns:**
- `"use client"` directive
- `react-hook-form` + `zodResolver` for validation
- `useFormPersistence` hook for session storage persistence and step management
- `useToast` for error/success notifications
- 4-step wizard with `renderStep1()` ... `renderStep4()` render functions
- `validateStep(step)` and `hasValidationErrors(step)` for per-step validation
- `isStepValid` state drives Next/Pay Now button enabled state
- On payment: stores form data in `sessionStorage` ('formData', 'formId'), calls `/api/checkout`
- Logo header: links back to `/`

---

#### `FormN4.tsx` — Notice to End Tenancy for Non-Payment of Rent

**Step 1 — Tenant Information**
| Field | Type | Validation |
|---|---|---|
| Landlord Name | text | min 3, max 30 chars |
| Tenant Name(s) | text (up to 1 input in step 1) | min 3, max 80 chars each |
| Rental Address | textarea | min 5, max 150 chars |

> Note: Step 1 for N4 shows only the first tenant field with an inline note to use commas for multiple tenants. Other forms (N5, N8, N12) use a dynamic multi-tenant UI with Add/Remove buttons.

**Step 2 — Rent Details**
| Field | Type | Notes |
|---|---|---|
| Rent Due Date | date | Per rental period; auto-calculates `fromDate`/`toDate` |
| Lawful Rent | number | Whole numbers only, max 6 digits |
| Paid Rent | number | Cannot exceed lawful rent |
| Rent Owing | computed | `max(0, lawful - paid)`, shown as read-only |

- Multiple rental periods supported via "Add Rental Period" button
- Periods can be removed (index > 0)
- **Skipped Month Detection**: When a new period is added that skips calendar months compared to the previous period, a modal dialog appears asking whether the tenant paid rent for the skipped month(s)
  - "No, they didn't pay" → creates a $0-paid period for that month
  - "Yes" → prompts for lawful/paid amounts and creates a fully filled period
- Totals (`totalLawfulRent`, `totalPaidRent`) are auto-calculated
- On submit (step 4): if more than 2 periods exist, periods 3+ are consolidated into a single combined third period for the PDF

**Step 3 — Landlord / Legal Representative**

Two modes selected by radio:

*Landlord mode:*
| Field | Type | Validation |
|---|---|---|
| Phone Number | tel | exactly 10 digits |

*Legal Representative mode:*
| Field | Type | Validation |
|---|---|---|
| Name | text | min 3, max 30 |
| LSUC # | text | exactly 6 chars |
| Company Name | text | optional, 3–50 chars |
| Mailing Address | text | min 5, max 60 |
| Phone Number | tel | exactly 10 digits |
| Fax Number | tel | optional, 10 digits |
| Municipality | text | min 3, max 20 |
| Province | select | Ontario only |
| Postal Code | text | uppercase, max 7 chars |

**Step 4 — Notice Serving Details**
| Field | Type | Notes |
|---|---|---|
| Serve Date | date | Displayed as dd/mm/yyyy |
| Serve Method | select | 9 options (handing, mailbox, door, courier, fax, mail, email) |
| Calculated Termination Date | computed | +14 days, +5 extra for mail/courier/fax |
| Email | email | Required for Stripe checkout |

**Pay Now → Services Modal**

Before redirecting to Stripe, a modal appears offering optional add-on services:
- "Our service for filing the form for you" (checkbox → `serviceFiling`)
- "Our service for representing you" (checkbox → `serviceRepresentation`)

The selected options are passed to `/api/checkout` as `serviceOption`:
| serviceOption | Price |
|---|---|
| (none) | $86 (via `STRIPE_PRICE_ID`) |
| `"filing"` | $272 CAD |
| `"representation"` | $586 CAD |
| `"both"` | $772 CAD |

**Key internal helpers:**
- `parseISODate(dateString)` — parses YYYY-MM-DD without timezone shifts
- `formatDateToDDMMYYYY(dateString)` — converts YYYY-MM-DD → dd/mm/yyyy
- `calculateTerminationDate()` — computes termination date for PDF
- `getTerminationDateForUI()` — human-readable format for display
- `formatPhoneNumber(phone)` — formats 10 digits as `(XXX)XXX-XXXX`
- `getSkippedMonths(periods)` — detects gaps between rental period dates
- `createPeriodForMonthWithAmounts(year, month, lawfulRent, paidRent, baseDay)` — constructs a new rental period object
- `insertRentalPeriodAt(index, period)` — inserts a period at a specific index, recalculates totals

---

#### `FormN5.tsx` — Notice to End Tenancy for Interference, Damage, or Overcrowding

**Step 1 — Tenant Information** (same as N4 but with multi-tenant Add/Remove UI)

**Step 2 — Reason for Notice**
| Field | Type | Notes |
|---|---|---|
| Reason for Notice | radio | `interference` / `damage` / `overcrowding` |
| Correction Period | radio | `7days` / `immediate` (shown per reason) |
| Awareness Date | date | Date landlord became aware |
| Incident Details | textarea | min 5, max 250 chars |
| Damage Amount | number | Shown only for `damage` + `7days`; repair or replace |
| Damage Type | radio | `repair` / `replace` |
| People Count | text | Shown only for `overcrowding` + `7days`; 1–2 digits |

**Step 3 — Landlord / Legal Representative** (same as N4)

**Step 4 — Service Details** (same as N4 but no services modal; direct Pay Now)

---

#### `FormN8.tsx` — Notice to End Tenancy at End of Term

**Step 1 — Tenant Information** (multi-tenant Add/Remove UI)

**Step 2 — Reason for Termination**
| Field | Type | Notes |
|---|---|---|
| Selected Reasons | checkbox array | At least one required |
| Payment Dates | text | dd/mm/yyyy format; min 10, max 250 chars |
| Late Payment Explanation | textarea | min 5, max 500 chars |
| Notice Details | text | Additional notice information |

**Step 3 — Landlord / Legal Representative** (same as N4)

**Step 4 — Notice Serving Details** (same as N4, direct Pay Now)

---

#### `FormN12.tsx` — Notice to End Tenancy for Landlord's Own Use

**Step 1 — Tenant Information** (multi-tenant Add/Remove UI)

**Step 2 — Reason for Termination**
| Field | Type | Notes |
|---|---|---|
| Selected Reasons | checkbox array | At least one required |
| Intended Occupant | checkbox array | Who will occupy the unit |
| Care Services Person | checkbox array | Person requiring care |

**Step 3 — Landlord / Legal Representative** (same as N4)

**Step 4 — Notice Serving Details** (same as N4, direct Pay Now)

---

### Utility Components

#### `DownloadPage.tsx`
- Rendered at `/download` after successful Stripe payment
- Reads `formId` from URL query (`?formId=n4`) or `sessionStorage`
- On "Download PDF":
  1. Reads `formData` from `sessionStorage`
  2. Converts `tenantNames` array to comma-separated string
  3. POSTs to `/api/fill-{formId}` → receives PDF bytes
  4. Converts bytes to base64
  5. Triggers browser download
  6. POSTs to `/api/send-email` to deliver the PDF to the customer
- Shows loading states (`Loader2` spinner)
- Displays success/error toasts

#### `ContactPageComponent.tsx`
- Rendered at `/contact-us`
- Simple informational page for paralegal-assisted forms (N5, N8 from ServicesSection)
- Contains a "Contact Us" `<a href="tel:9059265898">` button

#### `DownloadButtonPage.tsx`
- Standalone button component (appears to be a simpler variant of the download flow)

#### `LandingPage.tsx` (legacy)
- Original monolithic landing page component
- Contains the form list UI, PDF extraction/download test buttons (commented out)
- Conditionally renders `<PDFUnifiedTester />` via state toggle
- **No longer used by `src/app/page.tsx`** — superseded by the modular LandingPage section components

#### `PDFUnifiedTester.tsx`
- Development/testing component for manually filling all four PDF forms with dummy data
- Accessible from `LandingPage.tsx` via hidden toggle

---

### UI Components (`src/components/ui/`)

All components are shadcn/ui wrappers around Radix UI primitives, styled with Tailwind and CVA.

| Component | Radix Primitive | Notes |
|---|---|---|
| `button.tsx` | `@radix-ui/react-slot` | Variants: default, destructive, outline, secondary, ghost, link |
| `card.tsx` | — | Card, CardContent, CardHeader, CardTitle, etc. |
| `checkbox.tsx` | `@radix-ui/react-checkbox` | |
| `form.tsx` | — | RHF context providers; FormItem, FormLabel, FormControl, FormMessage |
| `input.tsx` | — | Standard HTML input with Tailwind styling |
| `label.tsx` | `@radix-ui/react-label` | |
| `radio-group.tsx` | `@radix-ui/react-radio-group` | |
| `select.tsx` | `@radix-ui/react-select` | SelectTrigger, SelectContent, SelectItem |
| `textarea.tsx` | — | |
| `toast.tsx` | `@radix-ui/react-toast` | Toast variants: default, destructive |
| `toaster.tsx` | — | Renders active toasts using `useToast` |

---

## API Routes

All routes live under `src/app/api/` and are Next.js App Router route handlers.

### `POST /api/checkout`

Creates a Stripe Checkout session and returns the redirect URL.

**Request body:**
```json
{
  "formId": "n4",
  "customerEmail": "user@example.com",
  "successUrl": "https://domain.com/download?success=true&formId=n4",
  "cancelUrl": "https://domain.com/n4?success=false&step=4",
  "serviceOption": "" | "filing" | "representation" | "both"
}
```

**Pricing logic:**
- Default (no `serviceOption` or non-N4): uses `STRIPE_PRICE_ID` env var ($86)
- N4 with `serviceOption`:
  - `"filing"` → 27200 cents ($272 CAD)
  - `"representation"` → 58600 cents ($586 CAD)
  - `"both"` → 77200 cents ($772 CAD)

**Response:** `{ url: "https://checkout.stripe.com/..." }`

Stores `formId` and `serviceOption` in Stripe session metadata.

---

### `POST /api/fill-n4`

Fills the N4 PDF template with submitted form data using `pdf-lib`.

**Accepts:** JSON body with all N4 form fields  
**Returns:** Binary PDF file (`application/pdf`)

Key processing:
- Loads `public/templates/N4_Acro.pdf`
- Maps form fields to PDF acroform field names
- Supports up to 3 rental periods (4th+ are consolidated before reaching API)
- Fills text fields, checkboxes, and radio buttons
- Returns the completed PDF bytes

---

### `POST /api/fill-n5`

Fills the N5 PDF template.

**Accepts:** JSON with N5 form fields (reason, correctionPeriod, incident details, damage amounts, etc.)  
**Returns:** Binary PDF

---

### `POST /api/fill-n8`

Fills the N8 PDF template.

**Accepts:** JSON with N8 form fields (reasons checkboxes, payment dates, explanation)  
**Returns:** Binary PDF

---

### `POST /api/fill-n12`

Fills the N12 PDF template.

**Accepts:** JSON with N12 form fields (reasons, intended occupant, care services)  
**Returns:** Binary PDF

---

### `POST /api/send-email`

Sends the completed PDF to the customer via SendGrid.

**Request body:**
```json
{
  "email": "user@example.com",
  "formId": "n4",
  "pdfBuffer": "<base64-encoded-pdf>",
  "fileName": "N4-Notice.pdf",
  "serviceOption": "" | "filing" | "representation" | "both"
}
```

**Flow:**
1. Validates base64 PDF buffer integrity (checks `%PDF` header)
2. Validates required env vars (`SENDGRID_API_KEY`, `EMAIL_FROM`)
3. Sends email to customer with PDF attachment via `@sendgrid/mail`
4. If `serviceOption` is set, sends a copy/notification to the admin email

---

### `GET /api/extract-pdf-fields`

Developer utility: reads the N4 PDF template and logs all acroform field names and types to the server console.  
**Returns:** `{ success: true, totalFields: number, fieldKeys: string[] }`

---

## Hooks

### `useFormPersistence` (`src/hooks/use-form-persistence.ts`)

Manages multi-step form state with sessionStorage persistence and URL sync.

**Options:**
```typescript
interface FormPersistenceOptions {
  formId: string      // e.g. 'n4', 'n5'
  maxSteps: number    // 4 for all current forms
  onStepChange?: (step: number) => void
}
```

**Returns:**
| Property | Type | Description |
|---|---|---|
| `currentStep` | `number` | Active step (1–4) |
| `isInitialized` | `boolean` | True after hydration from storage |
| `goToStep(n)` | function | Jump to specific step |
| `nextStep()` | function | Advance one step |
| `prevStep()` | function | Go back one step |
| `saveFormData(data)` | function | Serialize to sessionStorage |
| `loadFormData()` | function | Deserialize from sessionStorage |
| `clearSavedData()` | function | Remove form data + step from storage |
| `isReturningFromCheckout` | `boolean` | `?success=false` in URL |
| `isReturningFromSuccessfulPayment` | `boolean` | `?success=true` in URL |

**Storage keys:** `{formId}_currentStep`, `{formId}_formData`

**Step initialization priority:**
1. URL `?step=` parameter
2. sessionStorage `{formId}_currentStep`
3. Default: step 1

**Side effects:**
- Clears all saved data automatically when `?success=true` is detected
- Calls `onStepChange` on every step change (used to sync URL via `history.replaceState`)

---

### `useToast` (`src/hooks/use-toast.ts`)

Standard shadcn/ui toast hook. Manages a global toast queue with auto-dismiss.

---

## Library / Utilities

### `src/lib/utils.ts`

```typescript
export function cn(...inputs: ClassValue[]): string
// Merges Tailwind classes using clsx + tailwind-merge
```

---

### `src/lib/validation.ts`

Zod schemas and input formatter functions shared across all form components.

**Zod Schemas:**
| Export | Type | Constraints |
|---|---|---|
| `nameValidation` | `z.string` | min 3, max 30 chars |
| `rentalAddressValidation` | `z.string` | min 5, max 150 chars |
| `companyNameValidation` | `z.string` | min 3, max 50 chars |
| `mailingAddressValidation` | `z.string` | min 5, max 60 chars |
| `municipalityValidation` | `z.string` | min 3, max 20 chars |
| `emailValidation` | `z.string` | valid email format |
| `validateTenantNames` | `z.array(z.string)` | each item max 80 chars, min 1 item |
| `optionalNameValidation` | `z.string` | optional; if present, 3–30 chars |
| `optionalCompanyNameValidation` | `z.string` | optional; if present, 3–50 chars |
| `optionalMailingAddressValidation` | `z.string` | optional; if present, 5–60 chars |
| `optionalMunicipalityValidation` | `z.string` | optional; if present, 3–20 chars |
| `optionalFaxNumberValidation` | `z.string` | optional; if present, exactly 10 digits |

**Formatter Functions:**
| Export | Behavior |
|---|---|
| `validatePhoneNumber(value)` | Strips non-digits, max 10 digits |
| `validateFaxNumber(value)` | Strips non-digits, max 10 digits |
| `validateAmount(value)` | Numbers + one decimal point, max 6 digits before decimal |
| `validateLSUCNumber(value)` | Pass-through (no transformation) |
| `validatePostalCode(value)` | Alphanumeric only, uppercase, max 7 chars |

---

### `src/lib/rentPaymentFormToHTML.ts`

Utility for converting N4 rent payment data into an HTML representation (used in legacy PDF generation flow). Contains typed interfaces for `DateInputs`, `MoneyInputs`, `RentRow`, and `FormData`.

---

## Configuration Files

### `tailwind.config.ts`

Custom design tokens:

| Token | Value | Usage |
|---|---|---|
| `btnBgPrimary` | `#C0111F` | Primary buttons, accents, required asterisks |
| `formStepsColor` | `#444444` | Form labels, step headings |
| `inputBorder` | `#949494` | Input and select borders |
| `--font-inter` | Inter (Google Fonts) | Body font |

Custom box shadows: `custom-lg`, `custom-md`

---

### `components.json`

shadcn/ui configuration: TypeScript enabled, Tailwind CSS v3, path aliases using `@/components`, `@/lib`, `@/hooks`.

---

### `tsconfig.json`

Path alias: `@/*` → `./src/*`

---

### `.env`

Required environment variables (not committed):

| Variable | Used By |
|---|---|
| `STRIPE_SECRET_KEY` | `/api/checkout` |
| `STRIPE_PRICE_ID` | `/api/checkout` (base N4 price, $86) |
| `SENDGRID_API_KEY` | `/api/send-email` |
| `EMAIL_FROM` | `/api/send-email` |
| `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID` | `layout.tsx` GTM |

---

## Public Assets

### `public/images/`
| File | Used In |
|---|---|
| `logo.png` | FormN5 header, ContactPageComponent, DownloadPage |
| `logo.webp` | FormN4 header |
| `landing-logo.png` | Legacy `LandingPage.tsx` left panel |
| `form-paper.svg` | ServicesSection form cards |
| `contact-us.svg` | ContactPageComponent illustration |
| `pdf-icon.png` | DownloadPage |

### `public/templates/`
- `N4_Acro.pdf`, `N5_Acro.pdf`, `N8_Acro.pdf`, `N12_Acro.pdf`
- Ontario LTB official acroform PDF templates
- Filled server-side by the respective `/api/fill-*` route handlers

---

## Data Flow

### Happy Path (N4 form example)

```
User visits /n4
  └─> FormN4 mounts
        └─> useFormPersistence initializes (reads sessionStorage or defaults to step 1)
              └─> User fills Step 1, 2, 3, 4
                    └─> Step 4: clicks "Pay Now"
                          └─> Services modal opens (filing / representation checkboxes)
                                └─> "Continue" clicked
                                      └─> formData serialized to sessionStorage
                                            └─> POST /api/checkout
                                                  └─> Stripe session created
                                                        └─> Redirect to Stripe Checkout
                                                              └─> Payment success
                                                                    └─> Redirect to /download?success=true&formId=n4
                                                                          └─> DownloadPage mounts
                                                                                └─> User clicks "Download PDF"
                                                                                      └─> POST /api/fill-n4 (with formData)
                                                                                            └─> PDF bytes returned
                                                                                                  └─> Browser download triggered
                                                                                                        └─> POST /api/send-email (base64 PDF)
                                                                                                              └─> Email sent via SendGrid
```

### Checkout Cancellation
- Stripe redirects to `cancelUrl` → `/n4?success=false&step=4`
- `useFormPersistence` detects `?success=false`
- `isReturningFromCheckout` is `true`
- Toast shown: "Checkout Cancelled — your data has been restored"
- User continues from step 4

---

## Form Field Schemas

### N4 Schema (`FormN4.tsx`)
```typescript
{
  // Step 1
  landlordName: string            // min 3, max 30
  landlordPhoneNumber: string     // set from phoneNumber on submit
  tenantNames: string[]           // array, each max 80 chars
  rentalAddress: string           // min 5, max 150

  // Step 2
  rentalPeriods: {
    rentDueDate: string           // YYYY-MM-DD
    fromDate: string              // dd/mm/yyyy (auto-computed)
    toDate: string                // dd/mm/yyyy (auto-computed)
    lawfulRent: string            // whole number, max 6 digits
    paidRent: string              // whole number ≤ lawfulRent
    rentOwing: number             // computed
  }[]
  totalLawfulRent: string         // sum of all lawfulRent values
  totalPaidRent: string           // sum of all paidRent values

  // Step 3
  whoAreYou: "landlord" | "legal"
  name: string                    // legal rep name
  representativePhoneNumber: string
  lsucNumber: string              // exactly 6 chars
  companyName: string             // optional
  mailingAddress: string          // min 5, max 60
  phoneNumber: string             // exactly 10 digits
  faxNumber: string               // optional, 10 digits
  municipality: string            // min 3, max 20
  province: string                // "ON"
  postalCode: string              // max 7 chars

  // Step 4
  serveDate: string               // YYYY-MM-DD
  serveMethod: string             // one of 9 method values
  email: string                   // valid email

  // Computed / POST fields
  representativeName: string      // copy of name
  terminationDate: string         // dd/mm/yyyy
}
```

### N5 Schema (`FormN5.tsx`)
Extends N4 common fields with Step 2 replacements:
```typescript
{
  reasonForNotice: "interference" | "damage" | "overcrowding"
  correctionPeriod: "7days" | "immediate"
  awarenessDate: string           // YYYY-MM-DD
  incidentDetails: string         // min 5, max 250
  damageAmount: string            // required if damage + 7days
  damageType: "repair" | "replace"
  peopleCount: string             // required if overcrowding + 7days; 1-2 digits
}
```

### N8 Schema (`FormN8.tsx`)
Extends N4 common fields with Step 2 replacements:
```typescript
{
  selectedReasons: string[]       // at least 1
  paymentDates: string            // dd/mm/yyyy format; min 10, max 250
  latePaymentExplanation: string  // min 5, max 500
  noticeDetails: string
}
```

### N12 Schema (`FormN12.tsx`)
Extends N4 common fields with Step 2 replacements:
```typescript
{
  selectedReasons: string[]       // at least 1
  intendedOccupant: string[]      // who will use the unit
  careServicesPerson: string[]    // person requiring care services
}
```

---

## Stripe Payment Integration

The checkout flow uses **Stripe Checkout** (hosted payment page).

**Session creation** (`/api/checkout`):
- Uses `stripe` SDK with API version `2025-08-27.basil`
- Mode: `"payment"` (one-time)
- Currency: `cad`
- Customer email pre-filled from form data
- `formId` and `serviceOption` stored in session and payment intent metadata

**Pricing:**
- Standard price for N5/N8/N12 and N4 without add-ons: uses `STRIPE_PRICE_ID` (configured in Stripe Dashboard as $86 CAD)
- N4 add-ons use dynamic `price_data` (inline prices not from Dashboard)

---

## PDF Generation

PDF generation is entirely server-side using **`pdf-lib`**.

**Process (per form):**
1. Load official LTB acroform PDF template from `public/templates/`
2. Parse the incoming JSON request body
3. Get all form fields from the PDF
4. For each field, check field type (`PDFTextField`, `PDFCheckBox`, `PDFRadioGroup`, etc.)
5. Map form data values to the corresponding PDF field names
6. Return the filled PDF as a binary response with `Content-Type: application/pdf`

**N4 special handling:**
- Up to 3 rental period rows supported in the PDF
- If the user entered more than 2 periods, the frontend consolidates periods 3+ into a single third row before sending to the API
- `fromDate` of the earliest and `toDate` of the latest are used for the combined row

---

## Email Delivery

Email is sent via **SendGrid** (`@sendgrid/mail`).

**`/api/send-email` flow:**
1. Accepts base64-encoded PDF buffer
2. Validates buffer: checks `%PDF` header, tests base64 round-trip
3. Constructs `MailDataRequired` object with attachment
4. Sends to customer email with the completed PDF attached
5. If `serviceOption` is non-empty (N4 add-on selected), sends an additional admin notification

**Environment variables required:**
- `SENDGRID_API_KEY`
- `EMAIL_FROM` (verified SendGrid sender)

`nodemailer` is also installed as a fallback/alternative but SendGrid is the primary delivery mechanism.

---

## Test Scripts

| Script | Purpose |
|---|---|
| `test-checkout-integration.js` | Integration test for the Stripe checkout API endpoint |
| `test-n4-dates.js` | Unit tests for N4 date calculation logic |
| `test-n4-rental-periods.js` | Unit tests for rental period consolidation logic |
| `test-tenant-names-handling.js` | Unit tests for tenant name array handling |
