# LTB Forms - Complete Code Structure Documentation

## 🏗️ PROJECT OVERVIEW

This is a **Next.js 14** application for generating **LTB (Landlord and Tenant Board) forms** for Ontario, Canada. It's a form-filling service that allows landlords or their legal representatives to complete official forms (N4, N5, N8, N12), pay via Stripe, and download filled PDFs.

**Tech Stack:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- React Hook Form + Zod validation
- pdf-lib (PDF manipulation)
- Stripe (payments)
- SendGrid/Nodemailer (email)
- Radix UI (shadcn/ui components)

---

## 📁 COMPLETE FILE STRUCTURE

```
ltb-froms/
├── public/
│   ├── images/
│   │   ├── logo.png, logo.webp, landing-logo.png
│   │   ├── contact-us.svg
│   │   ├── form-paper.svg
│   │   └── pdf-icon.png
│   └── templates/
│       ├── N4_Acro.pdf (fillable form template)
│       ├── N5_Acro.pdf
│       ├── N8_Acro.pdf
│       └── N12_Acro.pdf
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── checkout/route.ts          # Stripe payment session
│   │   │   ├── fill-n4/route.ts           # PDF generation for N4
│   │   │   ├── fill-n5/route.ts           # PDF generation for N5
│   │   │   ├── fill-n8/route.ts           # PDF generation for N8
│   │   │   ├── fill-n12/route.ts          # PDF generation for N12
│   │   │   ├── send-email/route.ts        # Email delivery
│   │   │   └── extract-pdf-fields/route.ts # PDF field inspector
│   │   │
│   │   ├── n4/page.tsx                    # N4 form page
│   │   ├── n5/page.tsx                    # N5 form page
│   │   ├── n8/page.tsx                    # N8 form page
│   │   ├── n12/page.tsx                   # N12 form page
│   │   ├── download/page.tsx              # PDF download page
│   │   ├── contact-us/page.tsx            # Contact page
│   │   ├── layout.tsx                     # Root layout
│   │   ├── page.tsx                       # Landing page
│   │   └── globals.css                    # Global styles
│   │
│   ├── components/
│   │   ├── FormN4.tsx                     # N4 form logic (~1870 lines)
│   │   ├── FormN5.tsx                     # N5 form logic
│   │   ├── FormN8.tsx                     # N8 form logic
│   │   ├── FormN12.tsx                    # N12 form logic
│   │   ├── DownloadPage.tsx               # Download page component
│   │   ├── ContactPageComponent.tsx       # Contact form component
│   │   ├── LandingPage/
│   │   │   ├── Header.tsx                 # Navigation header
│   │   │   ├── HeroSection.tsx            # Main CTA section
│   │   │   ├── HowItWorksSection.tsx      # Process explanation
│   │   │   ├── PricingSection.tsx         # Pricing display
│   │   │   ├── BenefitsSection.tsx        # Feature highlights
│   │   │   ├── ServicesSection.tsx        # Available forms
│   │   │   ├── TestimonialSection.tsx     # Customer reviews
│   │   │   └── FooterCTA.tsx              # Final conversion
│   │   └── ui/                            # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── textarea.tsx
│   │       ├── select.tsx
│   │       ├── radio-group.tsx
│   │       ├── checkbox.tsx
│   │       ├── form.tsx
│   │       ├── card.tsx
│   │       ├── toast.tsx
│   │       └── toaster.tsx
│   │
│   ├── hooks/
│   │   ├── use-form-persistence.ts        # Form state management
│   │   └── use-toast.ts                   # Toast notifications
│   │
│   └── lib/
│       ├── validation.ts                  # Zod schemas & validators
│       ├── utils.ts                       # Utility functions
│       └── rentPaymentFormToHTML.ts       # Form to HTML converter
│
├── components.json                        # shadcn/ui config
├── next.config.mjs                        # Next.js config
├── package.json                           # Dependencies
├── tailwind.config.ts                     # Tailwind config
├── tsconfig.json                          # TypeScript config
└── README.md                              # This file
```

---

## 🔧 ROOT CONFIGURATION FILES

### `package.json` - Dependencies

**Key Dependencies:**
```json
{
  "dependencies": {
    "next": "14.2.16",
    "react": "^18",
    "react-dom": "^18",
    "react-hook-form": "^7.63.0",
    "zod": "^4.1.11",
    "@hookform/resolvers": "^5.2.2",
    "pdf-lib": "^1.17.1",
    "stripe": "^18.5.0",
    "@sendgrid/mail": "^8.1.6",
    "nodemailer": "^7.0.6",
    "@radix-ui/react-*": "various",
    "tailwindcss": "^3.4.1",
    "lucide-react": "^0.543.0",
    "date-fns": "^4.1.0"
  }
}
```

### `next.config.mjs`
```javascript
export default {
  eslint: {
    ignoreDuringBuilds: true,  // Skips linting during production builds
  },
};
```

### `tailwind.config.ts` - Custom Theme

```typescript
{
  theme: {
    extend: {
      colors: {
        btnBgPrimary: '#C0111F',      // Red primary button
        formStepsColor: '#444444',     // Dark gray for text
        inputBorder: '#949494',        // Gray for borders
      },
      fontFamily: {
        inter: ['var(--font-inter)'],  // Inter from Google Fonts
      }
    }
  }
}
```

---

## 🎯 APP DIRECTORY - CORE PAGES

### `src/app/layout.tsx` - Root Layout

**What it does:**
- Sets up HTML structure
- Configures Google Tag Manager for analytics
- Loads Inter font from Google Fonts
- Includes global `<Toaster />` for notifications
- Sets viewport (prevents mobile zoom)
- Defines metadata (title, favicon)

**Key Features:**
```typescript
export const metadata: Metadata = {
  title: "LTB Forms",
  description: "Achieve more efficiency in your rental property management",
  icons: { icon: "/images/logo.png" }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,  // Prevents zoom on mobile
}
```

### `src/app/page.tsx` - Landing Page

**Structure:**
```typescript
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />           // Main CTA: "Start My N4 Now"
        <HowItWorksSection />     // 3-step process
        <PricingSection />        // $86 pricing
        <BenefitsSection />       // Value propositions
        <ServicesSection />       // Available forms
        <TestimonialsSection />   // Social proof
        <FooterCTA />             // Final conversion
      </main>
    </div>
  );
}
```

---

## 📝 FORM PAGES - N4, N5, N8, N12

### `src/app/n4/page.tsx` (and similar for N5, N8, N12)

**Pattern:**
```typescript
import dynamic from 'next/dynamic';

const FormN4 = dynamic(() => import('@/components/FormN4'), { 
  ssr: false  // Client-side only
});

export default function NFourPage() {
  return <FormN4 />
}
```

**Why `ssr: false`?**
- Forms use `sessionStorage` (browser-only API)
- Prevents hydration mismatches
- Avoids "window is not defined" errors
- Form state is client-side only

---

## 🎨 MAIN FORM COMPONENT - FormN4.tsx

### **File: `src/components/FormN4.tsx` (~1870 lines)**

This is the core form logic. Here's a detailed breakdown:

### **Multi-Step Form Architecture**

#### **Step 1: Tenant Information**

**Fields:**
```typescript
{
  landlordName: string,          // 3-30 chars
  landlordPhoneNumber: string,   // Auto-filled later
  tenantNames: string[],         // 1-3 tenants, dynamic add/remove
  rentalAddress: string          // 5-150 chars
}
```

**Features:**
- Dynamic tenant fields (Add/Remove buttons)
- Maximum 3 tenants
- Real-time validation on blur
- Red "X" button to remove tenants

**Validation:**
- Landlord name: min 3 chars, max 30 chars
- Tenant names: Each must be 3-30 chars
- Rental address: min 5 chars, max 150 chars

---

#### **Step 2: Rent Details**

**Fields:**
```typescript
{
  rentalPeriods: [
    {
      rentDueDate: string,       // Date picker (ISO format)
      fromDate: string,          // Auto-calculated (dd/mm/yyyy)
      toDate: string,            // Auto-calculated (dd/mm/yyyy)
      lawfulRent: string,        // Max 6 digits
      paidRent: string,          // Max 6 digits
      rentOwing: number          // Auto-calculated
    }
  ],
  totalLawfulRent: string,       // Sum of all periods
  totalPaidRent: string          // Sum of all periods
}
```

**Automatic Date Calculation:**
```typescript
// If rent due on 1st of month:
fromDate = rentDueDate (1st)
toDate = last day of same month

// If rent due on other day (e.g., 15th):
fromDate = rentDueDate (e.g., Jan 15)
toDate = next month same day - 1 (e.g., Feb 14)

// Handles month overflow:
// Jan 31 → Feb 28/29 (last day of Feb)
```

**Real-time Validation:**
- Paid rent cannot exceed lawful rent
- Shows inline error messages
- Blocks progression if invalid
- Chronological date ordering enforced

**Dynamic Features:**
- Add rental periods (unlimited)
- Remove periods (min 1 required)
- Auto-totals update on change
- Rent owing calculated per period

**UI Elements:**
- Date picker with dd/mm/yyyy display
- Currency input (numbers only)
- Red error messages for invalid amounts
- Alert icon for rent owing display

---

#### **Step 3: Landlord/Legal Representative**

**Radio Selection:**
```typescript
whoAreYou: "landlord" | "legal"
```

**If "Landlord" selected:**
```typescript
{
  phoneNumber: string  // 10 digits, formatted as (XXX)XXX-XXXX
}
```

**If "Legal Representative" selected:**
```typescript
{
  name: string,                 // 3-30 chars
  representativePhoneNumber: string,  // 10 digits
  lsucNumber: string,           // 6 chars (Law Society license)
  companyName: string,          // Optional, 3-50 chars
  mailingAddress: string,       // 5-60 chars
  phoneNumber: string,          // 10 digits
  faxNumber: string,            // Optional, 10 digits
  municipality: string,         // 3-20 chars (City/Town)
  province: string,             // Dropdown (Ontario only)
  postalCode: string,           // 7 chars (A1A 1A1 format)
  representativeName: string    // Copy of name for signature
}
```

**Field Clearing Logic:**
- Switching from Legal → Landlord: clears all legal rep fields
- Switching from Landlord → Legal: clears phone field
- Prevents validation errors from hidden fields

**Input Formatters:**
- Phone: strips non-digits, max 10
- Postal Code: uppercase, max 7 chars
- LSUC #: max 6 chars

---

#### **Step 4: Notice Serving Details**

**Fields:**
```typescript
{
  serveDate: string,           // Date picker (ISO format)
  serveMethod: string,         // Dropdown with 9 options
  email: string,               // Email for PDF delivery
  terminationDate: string      // Auto-calculated (dd/mm/yyyy)
}
```

**Serve Method Options:**
1. "handing_to_person" - Handing the document(s) to the person(s)
2. "handing_to_employee" - Handing to authorized employee of landlord
3. "handing_to_adult" - Handing to adult person in tenant's rental unit
4. "leaving_in_mailbox" - Leaving in mailbox or mail delivery place
5. "placing_under_door" - Placing under door or through mail slot
6. "sending_by_courier" - Sending by courier to the person(s)
7. "sending_by_fax" - Sending by fax to fax number
8. "sending_by_mail" - Sending by mail/Xpresspost to last known address
9. "sending_by_email" - Sending by email (if landlord consented)

**Termination Date Calculation:**
```typescript
// Base notice period
terminationDate = serveDate + 14 days

// Additional days for certain methods
if (serveMethod === "mail" || "courier" || "fax") {
  terminationDate += 5 additional days
}

// Total: 14 days (in-person) or 19 days (mail/courier/fax)
```

**Display:**
- Shows calculated date as: "January 15, 2025"
- Updates automatically when serve date or method changes
- Alert icon with explanation

**Pay Now Button:**
- Validates all Step 4 fields
- Triggers Stripe checkout
- Shows "Processing..." loading state

---

### **Form State Management**

#### **useFormPersistence Hook**

```typescript
const {
  currentStep,              // 1, 2, 3, or 4
  isInitialized,            // Prevents hydration issues
  nextStep,                 // Validates & advances
  prevStep,                 // Goes back
  saveFormData,             // Saves to sessionStorage
  loadFormData,             // Loads from sessionStorage
  clearSavedData,           // Removes all saved data
  isReturningFromCheckout,  // success=false in URL
  isReturningFromSuccessfulPayment  // success=true
} = useFormPersistence({
  formId: 'n4',
  maxSteps: 4,
  onStepChange: (step) => {
    // Updates URL: ?step=2
    // Saves to sessionStorage: n4_currentStep=2
  }
})
```

**Storage Keys:**
- `n4_formData` - All form values (JSON)
- `n4_currentStep` - Current step number
- `formData` - Global form data before checkout
- `formId` - Which form type ('n4', 'n5', etc.)

**Persistence Flow:**
```
User fills Step 1 
  → saveFormData() 
  → sessionStorage.setItem('n4_formData', JSON.stringify(data))

User refreshes page 
  → loadFormData() 
  → sessionStorage.getItem('n4_formData')
  → Form fields repopulate

User clicks "Pay Now" 
  → clearSavedData() clears step data
  → sessionStorage.setItem('formData', data) for checkout

Payment successful 
  → Download page clears all sessionStorage
```

---

### **Form Validation Logic**

#### **Zod Schema**

```typescript
const formSchema = z.object({
  // Step 1
  landlordName: nameValidation,              // 3-30 chars
  tenantNames: validateTenantNames,          // Array, min 1
  rentalAddress: rentalAddressValidation,    // 5-150 chars
  
  // Step 2
  rentalPeriods: z.array(rentalPeriodSchema).min(1),
  
  // Step 3 (conditional)
  whoAreYou: z.enum(["landlord", "legal"]),
  phoneNumber: z.string().refine(val => val.length === 10),
  // ... legal rep fields if whoAreYou === "legal"
  
  // Step 4
  serveDate: z.string().min(1),
  serveMethod: z.string().min(1),
  email: emailValidation,
  
}).refine((data) => {
  // Cross-field validation
  return data.rentalPeriods.every(period => {
    const lawfulRent = parseFloat(period.lawfulRent) || 0;
    const paidRent = parseFloat(period.paidRent) || 0;
    return paidRent <= lawfulRent;  // Paid cannot exceed lawful
  });
}, {
  message: "Paid rent cannot exceed lawful rent",
  path: ["rentalPeriods"]
})
```

#### **Step Validation**

```typescript
const validateStep = (step: number): boolean => {
  switch (step) {
    case 1:
      return landlordName.length >= 3 &&
             tenantNames.every(name => name.length >= 3) &&
             rentalAddress.length >= 5;
    
    case 2:
      return rentalPeriods.every(period =>
        period.rentDueDate !== "" &&
        period.lawfulRent !== "" &&
        period.paidRent !== "" &&
        parseFloat(period.paidRent) <= parseFloat(period.lawfulRent)
      );
    
    case 3:
      if (whoAreYou === "landlord") {
        return phoneNumber.length === 10;
      } else {
        return name.length >= 3 &&
               lsucNumber.length === 6 &&
               mailingAddress.length >= 5 &&
               phoneNumber.length === 10 &&
               municipality.length >= 3 &&
               province !== "" &&
               postalCode !== "";
      }
    
    case 4:
      return serveDate !== "" &&
             serveMethod !== "" &&
             /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

#### **Real-time Validation**

```typescript
<Input
  {...field}
  onBlur={() => {
    field.onBlur();
    form.trigger('landlordName');  // Validates immediately
  }}
/>

// Updates isStepValid state
useEffect(() => {
  const isValid = !hasValidationErrors(currentStep);
  setIsStepValid(isValid);
}, [formData, errors, currentStep]);

// Disables "Next" button if invalid
<Button
  onClick={nextStep}
  disabled={!isStepValid}
>
  Next
</Button>
```

---

### **Payment Flow - handlePayNow()**

```typescript
const handlePayNow = async () => {
  // 1. Final validation
  const isValid = await form.trigger(['serveDate', 'serveMethod', 'email']);
  if (!isValid) return;

  setIsLoading(true);
  
  // 2. Process rental periods (combine 3+)
  let processedRentalPeriods = [...rentalPeriods];
  
  if (processedRentalPeriods.length > 2) {
    const firstPeriod = processedRentalPeriods[0];
    const secondPeriod = processedRentalPeriods[1];
    
    // Sum periods 3, 4, 5, ... into single period
    const remainingPeriods = processedRentalPeriods.slice(2);
    const totalLawfulRent = remainingPeriods.reduce(
      (sum, p) => sum + parseFloat(p.lawfulRent), 0
    );
    const totalPaidRent = remainingPeriods.reduce(
      (sum, p) => sum + parseFloat(p.paidRent), 0
    );
    
    const thirdPeriod = {
      fromDate: minPeriod.fromDate,  // Earliest date
      toDate: maxPeriod.toDate,      // Latest date
      lawfulRent: totalLawfulRent.toString(),
      paidRent: totalPaidRent.toString(),
      rentOwing: totalLawfulRent - totalPaidRent
    };
    
    processedRentalPeriods = [firstPeriod, secondPeriod, thirdPeriod];
  }
  
  // 3. Format dates to dd/mm/yyyy
  const formattedRentalPeriods = processedRentalPeriods.map(period => ({
    ...period,
    rentDueDate: formatDateToDDMMYYYY(period.rentDueDate)
  }));
  
  // 4. Calculate termination date
  const terminationDate = calculateTerminationDate();
  
  // 5. Prepare form data
  let formDataWithProcessedPeriods = {
    landlordName,
    tenantNames,
    rentalAddress,
    rentalPeriods: formattedRentalPeriods,
    serveDate: formatDateToDDMMYYYY(serveDate),
    serveMethod,
    email,
    terminationDate,
    whoAreYou
  };
  
  // 6. Add landlord/legal rep fields
  if (whoAreYou === "landlord") {
    formDataWithProcessedPeriods.landlordPhoneNumber = 
      formatPhoneNumber(phoneNumber);
    // Clear legal rep fields
  } else {
    formDataWithProcessedPeriods.name = name;
    formDataWithProcessedPeriods.representativePhoneNumber = 
      formatPhoneNumber(phoneNumber);
    formDataWithProcessedPeriods.lsucNumber = lsucNumber;
    // ... other legal rep fields
  }
  
  // 7. Store in sessionStorage
  sessionStorage.setItem('formData', JSON.stringify(formDataWithProcessedPeriods));
  sessionStorage.setItem('formId', 'n4');
  
  // 8. Create Stripe checkout session
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      formId: 'n4',
      customerEmail: email,
      successUrl: `${window.location.origin}/download?success=true&formId=n4`,
      cancelUrl: `${window.location.origin}/n4?success=false&step=${currentStep}`
    })
  });
  
  const data = await response.json();
  
  // 9. Clear saved data & redirect to Stripe
  clearSavedData();
  window.location.href = data.url;  // Redirects to Stripe Checkout
}
```

**Why combine 3+ periods?**
- PDF template only has 3 rental period rows
- Aggregating extra periods prevents data loss
- Shows comprehensive date range (earliest to latest)
- Sums all amounts correctly

---

## 🔌 API ROUTES

### `src/app/api/checkout/route.ts` - Stripe Payment

```typescript
POST /api/checkout

Input:
{
  formId: "n4",
  customerEmail: "user@example.com",
  successUrl: "https://ltbforms.com/download?success=true&formId=n4",
  cancelUrl: "https://ltbforms.com/n4?success=false&step=4"
}

Process:
1. Create Stripe checkout session
2. Use STRIPE_PRICE_ID from environment
3. Set mode to "payment" (one-time)
4. Store formId in metadata
5. Set customer email

Output:
{
  url: "https://checkout.stripe.com/pay/cs_test_..."
}

Environment Variables:
- STRIPE_SECRET_KEY
- STRIPE_PRICE_ID (created in Stripe dashboard)
```

---

### `src/app/api/fill-n4/route.ts` - PDF Generation (~1034 lines)

```typescript
POST /api/fill-n4

Input:
{
  landlordName: "John Doe",
  tenantNames: "Jane Smith, Bob Johnson",  // Comma-separated
  rentalAddress: "123 Main St, Toronto, ON",
  rentalPeriods: [
    {
      rentDueDate: "01/01/2024",
      fromDate: "01/01/2024",
      toDate: "31/01/2024",
      lawfulRent: "1200",
      paidRent: "800",
      rentOwing: 400
    }
  ],
  terminationDate: "15/01/2024",
  whoAreYou: "legal",
  name: "Legal Rep Name",
  lsucNumber: "123456",
  // ... other fields
  serveDate: "01/01/2024"
}

Process:
1. Load template PDF
   const pdfPath = path.join(process.cwd(), 'public', 'templates', 'N4_Acro.pdf');
   const pdfBytes = fs.readFileSync(pdfPath);
   const pdfDoc = await PDFDocument.load(pdfBytes);

2. Get form fields
   const form = pdfDoc.getForm();
   const fields = form.getFields();

3. Map data to PDF field names
   Field Name Pattern: "form1[0].#subform[X].FieldGroup[0].FieldName[0]"
   
   Examples:
   - Tenant Name: "form1[0].#subform[1].Notice_Name_and_Address[0].TO_TenameName[0]"
   - Landlord Name: "form1[0].#subform[1].Notice_Name_and_Address[0].From_LandlordName[0]"
   - Rental Address: "form1[0].#subform[1].Notice_Name_and_Address[0].RentalUnitAddress[0]"
   - Termination Date: "form1[0].#subform[1].PayDate[0]"

4. Fill rental period fields (3 rows max)
   Period 1:
   - ArrearFrom1[0] → fromDate
   - ArrearTo1[0] → toDate
   - RentCharge1[0] → lawfulRent (formatted: "  1200.00")
   - RentPaid1[0] → paidRent (formatted: "   800.00")
   - RentOwe1[0] → rentOwing (formatted: "    400.00")
   
   Period 2: Same pattern with suffix "2"
   Period 3: Same pattern with suffix "3" (aggregated if >2 periods)

5. Calculate and fill totals
   TotalRentOwe[0] → Sum of all rentOwing
   OweMeAmount[0] → Same as TotalRentOwe

6. Fill signature section
   if (whoAreYou === "landlord"):
     - RFirstName[0] → landlordName.split(' ')[0]
     - RLastName[0] → landlordName.split(' ').slice(1).join(' ')
     - RDayPhone[0] → landlordPhoneNumber
     - SelectSign[0] → radio option "1"
   
   if (whoAreYou === "legal"):
     - RFirstName[0] → name.split(' ')[0]
     - RLastName[0] → name.split(' ').slice(1).join(' ')
     - RDayPhone[0] → representativePhoneNumber
     - SelectSign[0] → radio option "2"
     - AgentName[0] → name
     - AgentLSUC[0] → lsucNumber
     - AgentCompany[0] → companyName
     - AgentAddress[0] → mailingAddress
     - AgentPhoneNum[0] → representativePhoneNumber
     - AgentMunicipality[0] → municipality
     - AgentProvince[0] → province
     - AgentPostCode[0] → postalCode
     - AgentFaxNum[0] → faxNumber

7. Format amounts with padding
   lawfulRent: "1200" → "  1200.00" (9 chars, right-aligned)
   paidRent: "800" → "   800.00" (9 chars, right-aligned)
   rentOwing: "400" → "    400.00" (10 chars, right-aligned)

8. Format phone numbers
   "4165551234" → "(416)555-1234"

9. Save filled PDF
   const filledPdfBytes = await pdfDoc.save();

Output:
Response with PDF buffer
Content-Type: application/pdf
Content-Disposition: attachment; filename="N4.pdf"
```

**Similar routes exist for:**
- `/api/fill-n5` - Form N5 (Interference/Damage)
- `/api/fill-n8` - Form N8 (End of Term)
- `/api/fill-n12` - Form N12 (Landlord/Family Requires Unit)

---

### `src/app/api/send-email/route.ts` - Email Delivery

```typescript
POST /api/send-email

Input:
{
  email: "user@example.com",
  formId: "n4",
  pdfBuffer: "JVBERi0xLjcKCjEgMCBv...",  // Base64 encoded PDF
  fileName: "N4.pdf"
}

Process:
1. Decode base64 to buffer
   const pdfBuffer = Buffer.from(pdfBuffer, 'base64');

2. Check file size (max 25MB)
   if (pdfBuffer.length > 25 * 1024 * 1024) {
     return error("PDF too large");
   }

3. Send email via SendGrid or Nodemailer
   
   SendGrid:
   await sgMail.send({
     to: email,
     from: process.env.SMTP_FROM,
     subject: `Your ${formId.toUpperCase()} Form`,
     text: `Your completed ${formId.toUpperCase()} form is attached.`,
     attachments: [
       {
         content: pdfBuffer.toString('base64'),
         filename: fileName,
         type: 'application/pdf',
         disposition: 'attachment'
       }
     ]
   });
   
   OR
   
   Nodemailer:
   await transporter.sendMail({
     from: process.env.SMTP_FROM,
     to: email,
     subject: `Your ${formId.toUpperCase()} Form`,
     text: `Your completed ${formId.toUpperCase()} form is attached.`,
     attachments: [
       {
         filename: fileName,
         content: pdfBuffer
       }
     ]
   });

Output:
{ success: true }

Environment Variables:
- SMTP_HOST (smtp.gmail.com)
- SMTP_PORT (587)
- SMTP_USER
- SMTP_PASS (App Password for Gmail)
- SMTP_FROM (LTB Forms <noreply@ltbforms.com>)
```

---

## 📥 DOWNLOAD PAGE

### `src/app/download/page.tsx` → `src/components/DownloadPage.tsx`

```typescript
Component Flow:

1. Check URL parameters
   const success = searchParams.get('success');
   const formId = searchParams.get('formId');

2. Load formId from URL or sessionStorage
   useEffect(() => {
     if (urlFormId) {
       setFormId(urlFormId);
     } else {
       const storedFormId = sessionStorage.getItem('formId');
       setFormId(storedFormId);
     }
   }, [urlFormId]);

3. Handle different scenarios
   
   if (success === 'false'):
     Show "Payment Cancelled" message
     Button: "Return to Form" → redirects to /n4
   
   if (success === 'true' || no success param):
     Show "Download PDF" button
     Click triggers handleDownload()

4. handleDownload() function:
   
   a) Get formData from sessionStorage
      const formData = sessionStorage.getItem('formData');
      const parsedFormData = JSON.parse(formData);
   
   b) Convert tenantNames array to string
      if (Array.isArray(parsedFormData.tenantNames)) {
        parsedFormData.tenantNames = parsedFormData.tenantNames.join(', ');
      }
   
   c) Call fill API
      const response = await fetch(`/api/fill-${formId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedFormData)
      });
   
   d) Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formId.toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
   
   e) Send email in background
      sendEmailWithPDF(blob, formId, parsedFormData.email);
   
   f) Clear sessionStorage
      sessionStorage.removeItem(`${formId}_formData`);
      sessionStorage.removeItem(`${formId}_currentStep`);
      sessionStorage.removeItem('formData');
      sessionStorage.removeItem('formId');
   
   g) Show success toast
      toast({
        title: "Success",
        description: "PDF downloaded and sent to your email!"
      });
   
   h) Redirect to home after 2 seconds
      setTimeout(() => router.push('/'), 2000);

5. sendEmailWithPDF() function:
   
   a) Check PDF size (max 25MB)
   b) Convert blob to base64 in chunks (prevents stack overflow)
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binaryString = '';
      const chunkSize = 8192;  // 8KB chunks
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64String = btoa(binaryString);
   
   c) Send to email API
      await fetch('/api/send-email', {
        method: 'POST',
        body: JSON.stringify({
          email,
          formId,
          pdfBuffer: base64String,
          fileName: `${formId.toUpperCase()}.pdf`
        })
      });

UI States:
- isLoadingFormId: Shows loading spinner while determining formId
- isDownloading: Shows "Generating PDF..." during API call
- downloadComplete: Marks successful download
- isSendingEmail: Background email process
- emailSent: Email delivery confirmation
```

**Form Title Display:**
```typescript
const getFormTitle = () => {
  switch (formId) {
    case 'n4':
      return 'Notice to End Tenancy for Non-Payment of Rent (Form N4)';
    case 'n5':
      return 'Notice to End Tenancy for Interference, Damage, or Overcrowding (Form N5)';
    case 'n8':
      return 'Notice to End Tenancy at End of Term (Form N8)';
    case 'n12':
      return 'Notice to End your Tenancy, Because the Landlord, a Purchaser or a Family Member Requires the Rental Unit (Form N12)';
    default:
      return 'Download Your Form';
  }
}
```

---

## 🪝 CUSTOM HOOKS

### `src/hooks/use-form-persistence.ts`

```typescript
useFormPersistence({ formId, maxSteps, onStepChange })

Purpose:
- Manages multi-step form state
- Persists data across page refreshes
- Handles checkout redirect scenarios

Parameters:
{
  formId: 'n4' | 'n5' | 'n8' | 'n12',
  maxSteps: number,  // e.g., 4 for N4 form
  onStepChange?: (step: number) => void  // Callback when step changes
}

Returns:
{
  currentStep: number,              // Current step (1-4)
  isInitialized: boolean,           // Prevents hydration issues
  goToStep: (step: number) => void,
  nextStep: () => void,
  prevStep: () => void,
  saveFormData: (data: any) => void,
  loadFormData: () => any | null,
  clearSavedData: () => void,
  isReturningFromCheckout: boolean,        // success=false
  isReturningFromSuccessfulPayment: boolean  // success=true
}

Implementation Details:

1. Initialize step from URL or sessionStorage
   const getInitialStep = () => {
     // Check URL: ?step=2
     const stepFromUrl = searchParams.get('step');
     if (stepFromUrl) return parseInt(stepFromUrl);
     
     // Check sessionStorage: n4_currentStep
     const savedStep = sessionStorage.getItem(`${formId}_currentStep`);
     if (savedStep) return parseInt(savedStep);
     
     return 1;  // Default
   };

2. Save step to sessionStorage on change
   useEffect(() => {
     if (isInitialized) {
       sessionStorage.setItem(`${formId}_currentStep`, currentStep.toString());
       onStepChange?.(currentStep);
     }
   }, [currentStep, isInitialized]);

3. Save form data
   const saveFormData = (data: any) => {
     sessionStorage.setItem(`${formId}_formData`, JSON.stringify(data));
   };

4. Load form data
   const loadFormData = () => {
     const savedData = sessionStorage.getItem(`${formId}_formData`);
     return savedData ? JSON.parse(savedData) : null;
   };

5. Clear saved data
   const clearSavedData = () => {
     sessionStorage.removeItem(`${formId}_formData`);
     sessionStorage.removeItem(`${formId}_currentStep`);
   };

6. Check return from checkout
   const isReturningFromCheckout = searchParams.get('success') === 'false';
   const isReturningFromSuccessfulPayment = searchParams.get('success') === 'true';

7. Auto-clear on successful payment
   useEffect(() => {
     if (isReturningFromSuccessfulPayment) {
       clearSavedData();
       setCurrentStep(1);
     }
   }, [isReturningFromSuccessfulPayment]);

Usage in FormN4:
const { currentStep, nextStep, prevStep, saveFormData, loadFormData } = 
  useFormPersistence({ formId: 'n4', maxSteps: 4 });

// Load saved data on mount
const getInitialFormData = () => {
  const savedData = loadFormData();
  if (savedData) return savedData;
  return defaultValues;
};

const form = useForm({ defaultValues: getInitialFormData() });

// Save data on change
useEffect(() => {
  saveFormData(formData);
}, [formData]);
```

---

## ✅ VALIDATION LIBRARY

### `src/lib/validation.ts`

```typescript
Zod Schemas:

1. nameValidation
   z.string().trim()
     .min(1, "Name cannot be empty or contain only spaces")
     .min(3, "Name must be at least 3 characters")
     .max(30, "Name must not exceed 30 characters")

2. rentalAddressValidation
   z.string().trim()
     .min(1, "Rental address cannot be empty")
     .min(5, "Rental address must be at least 5 characters")
     .max(150, "Rental address must not exceed 150 characters")

3. companyNameValidation
   z.string().trim()
     .min(3, "Company name must be at least 3 characters")
     .max(50, "Company name must not exceed 50 characters")

4. mailingAddressValidation
   z.string().trim()
     .min(5, "Mailing address must be at least 5 characters")
     .max(60, "Mailing address must not exceed 60 characters")

5. municipalityValidation
   z.string().trim()
     .min(3, "Municipality must be at least 3 characters")
     .max(20, "Municipality must not exceed 20 characters")

6. emailValidation
   z.string().trim()
     .min(1, "Email cannot be empty")
     .email("Please enter a valid email address")

7. validateTenantNames
   z.array(nameValidation)
     .min(1, "At least one tenant name is required")

8. optionalCompanyNameValidation
   z.string()
     .refine(val => !val || (val.trim().length >= 3 && val.trim().length <= 50))

9. optionalFaxNumberValidation
   z.string()
     .refine(val => !val || val.replace(/\D/g, '').length === 10)

Input Formatters:

1. validatePhoneNumber(value: string): string
   const cleaned = value.replace(/[^0-9]/g, '');  // Remove non-digits
   return cleaned.substring(0, 10);  // Max 10 digits

2. validateFaxNumber(value: string): string
   Same as validatePhoneNumber

3. validateAmount(value: string): string
   const cleaned = value.replace(/[^0-9]/g, '');  // Only digits
   return cleaned.substring(0, 6);  // Max 6 digits (no decimals)

4. validatePostalCode(value: string): string
   return value.replace(/[^A-Za-z0-9\s]/g, '')
               .toUpperCase()
               .substring(0, 7);  // Format: A1A 1A1

Phone Formatting:
formatPhoneNumber("4165551234") → "(416)555-1234"

Date Formatting:
formatDateToDDMMYYYY("2024-01-15") → "15/01/2024"
```

---

## 🎨 UI COMPONENTS (shadcn/ui)

### `src/components/ui/`

All components are from **shadcn/ui** (Radix UI + Tailwind CSS):

```typescript
1. button.tsx
   - Variants: default, destructive, outline, ghost
   - Sizes: sm, default, lg
   - Example: <Button variant="default" size="lg">Click Me</Button>

2. input.tsx
   - Styled text input
   - Example: <Input type="text" placeholder="Enter name" />

3. label.tsx
   - Form labels
   - Example: <Label htmlFor="name">Name</Label>

4. textarea.tsx
   - Multi-line text input
   - Example: <Textarea rows={3} />

5. select.tsx
   - Dropdown menu (Radix UI Select)
   - Example:
     <Select value={value} onValueChange={onChange}>
       <SelectTrigger>
         <SelectValue placeholder="Select option" />
       </SelectTrigger>
       <SelectContent>
         <SelectItem value="option1">Option 1</SelectItem>
       </SelectContent>
     </Select>

6. radio-group.tsx
   - Radio buttons
   - Example:
     <RadioGroup value={value} onValueChange={onChange}>
       <div className="flex items-center space-x-2">
         <RadioGroupItem value="option1" id="option1" />
         <Label htmlFor="option1">Option 1</Label>
       </div>
     </RadioGroup>

7. checkbox.tsx
   - Checkboxes
   - Example: <Checkbox checked={checked} onCheckedChange={setChecked} />

8. form.tsx
   - Form context provider (react-hook-form integration)
   - Example:
     <Form {...form}>
       <FormField
         control={form.control}
         name="fieldName"
         render={({ field }) => (
           <FormItem>
             <FormLabel>Label</FormLabel>
             <FormControl>
               <Input {...field} />
             </FormControl>
             <FormMessage />  // Shows validation errors
           </FormItem>
         )}
       />
     </Form>

9. card.tsx
   - Card container
   - Example:
     <Card>
       <CardHeader>
         <CardTitle>Title</CardTitle>
       </CardHeader>
       <CardContent>Content</CardContent>
     </Card>

10. toast.tsx + toaster.tsx
    - Toast notifications
    - Usage:
      import { useToast } from '@/hooks/use-toast';
      
      const { toast } = useToast();
      
      toast({
        title: "Success",
        description: "Form submitted successfully",
        variant: "default"  // or "destructive"
      });
```

---

## 🎯 LANDING PAGE COMPONENTS

### `src/components/LandingPage/`

```typescript
1. Header.tsx
   - Logo (links to home)
   - Navigation links
   - "Contact Us" button

2. HeroSection.tsx
   - Main headline: "LTB Forms. Filed Right — Every Time."
   - Subheading about N4 form
   - CTA button: "Start My N4 Now" → /n4
   - Background: gradient (light pink)

3. HowItWorksSection.tsx
   - 3-step process:
     1. Fill out the form
     2. Pay $86
     3. Download PDF

4. PricingSection.tsx
   - Pricing cards
   - $86 for N4 form
   - Additional services pricing

5. BenefitsSection.tsx
   - "Why choose LTB Forms?"
   - Features:
     - Fast & easy
     - Legally compliant
     - Expert support
     - Instant download

6. ServicesSection.tsx
   - Available forms:
     - N4 (Non-payment of rent)
     - N5 (Interference/Damage)
     - N8 (End of term)
     - N12 (Landlord/Family requires unit)

7. TestimonialSection.tsx
   - Customer reviews
   - Star ratings
   - Social proof

8. FooterCTA.tsx
   - Final call-to-action
   - "Ready to get started?"
   - CTA button
   - Footer links (Privacy, Terms, Contact)
```

---

## 📧 CONTACT PAGE

### `src/app/contact-us/page.tsx` → `src/components/ContactPageComponent.tsx`

```typescript
Contact Form Fields:
- Name (3-30 chars)
- Email (valid email)
- Phone (optional, 10 digits)
- Subject (dropdown)
- Message (textarea, 10-500 chars)

Submit Process:
1. Validate all fields
2. Send to contact API (or email API)
3. Show success toast
4. Clear form

Example:
<form onSubmit={handleSubmit}>
  <Input name="name" placeholder="Your Name" />
  <Input name="email" type="email" placeholder="Your Email" />
  <Input name="phone" placeholder="Phone (optional)" />
  <Select name="subject">
    <SelectItem value="general">General Inquiry</SelectItem>
    <SelectItem value="support">Support</SelectItem>
  </Select>
  <Textarea name="message" placeholder="Your Message" />
  <Button type="submit">Send Message</Button>
</form>
```

---

## 🔄 COMPLETE USER FLOW

### **Scenario: User fills N4 form**

```
1. Landing Page (/)
   User sees hero section
   Clicks "Start My N4 Now"
   
2. Redirect to /n4
   FormN4 component loads
   useFormPersistence checks sessionStorage
   If saved data exists, repopulates form
   
3. Step 1: Tenant Information (/n4?step=1)
   User enters:
   - Landlord name: "John Doe"
   - Tenant names: "Jane Smith"
   - Rental address: "123 Main St, Toronto, ON"
   
   On change:
   - saveFormData() → sessionStorage.setItem('n4_formData', ...)
   
   Clicks "Next"
   - Validates all Step 1 fields
   - If valid: nextStep() → currentStep = 2
   - URL updates: /n4?step=2
   
4. Step 2: Rent Details (/n4?step=2)
   User enters:
   - Rent due date: Jan 1, 2024
   - Auto-calculates: fromDate = 01/01/2024, toDate = 31/01/2024
   - Lawful rent: $1200
   - Paid rent: $800
   - Auto-calculates: rent owing = $400
   
   Clicks "Add Rental Period"
   - Adds second period
   - Enters Feb data
   
   Clicks "Next"
   - Validates all periods (paid ≤ lawful)
   - If valid: nextStep() → currentStep = 3
   
5. Step 3: Landlord/Representative (/n4?step=3)
   User selects "Landlord"
   - Shows only phone number field
   - Enters: (416)555-1234
   
   Clicks "Next"
   - Validates phone (10 digits)
   - If valid: nextStep() → currentStep = 4
   
6. Step 4: Notice Serving Details (/n4?step=4)
   User enters:
   - Serve date: Jan 1, 2024
   - Serve method: "handing_to_person"
   - Auto-calculates termination date: Jan 15, 2024 (14 days)
   - Email: john@example.com
   
   Clicks "Pay Now"
   
7. Payment Processing
   a) Validates Step 4 fields
   b) Processes rental periods (combines 3+ if needed)
   c) Formats dates to dd/mm/yyyy
   d) Calculates termination date
   e) Stores in sessionStorage:
      - formData = {...all form data}
      - formId = 'n4'
   f) Creates Stripe checkout session:
      POST /api/checkout
      {
        formId: 'n4',
        customerEmail: 'john@example.com',
        successUrl: '/download?success=true&formId=n4',
        cancelUrl: '/n4?success=false&step=4'
      }
   g) Clears form-specific sessionStorage (n4_formData, n4_currentStep)
   h) Redirects to Stripe:
      window.location.href = "https://checkout.stripe.com/pay/..."
   
8. Stripe Checkout Page
   User enters credit card info
   Clicks "Pay $86"
   
   Two scenarios:
   
   A) Payment Cancelled:
      - Stripe redirects to: /n4?success=false&step=4
      - useFormPersistence detects isReturningFromCheckout
      - Shows toast: "Checkout Cancelled. Your form data has been restored."
      - Form repopulates from sessionStorage
      - User can continue or edit
   
   B) Payment Successful:
      - Stripe redirects to: /download?success=true&formId=n4
   
9. Download Page (/download?success=true&formId=n4)
   a) Component loads
   b) Checks URL params: success=true, formId=n4
   c) Shows download button
   d) User clicks "Download PDF"
   
   e) handleDownload() executes:
      - Gets formData from sessionStorage
      - Converts tenantNames array to string
      - Calls: POST /api/fill-n4 with formData
   
10. API: /api/fill-n4
    a) Loads N4_Acro.pdf template
    b) Uses pdf-lib to get form fields
    c) Maps form data to PDF fields:
       - Tenant name → "form1[0].#subform[1]...TO_TenameName[0]"
       - Landlord name → "...From_LandlordName[0]"
       - Rental address → "...RentalUnitAddress[0]"
       - Period 1 dates → "...ArrearFrom1[0]", "...ArrearTo1[0]"
       - Period 1 amounts → "...RentCharge1[0]", "...RentPaid1[0]", "...RentOwe1[0]"
       - Totals → "...TotalRentOwe[0]"
       - Signature → "...RFirstName[0]", "...RLastName[0]"
       - Phone → "...RDayPhone[0]"
       - Radio button → "...SelectSign[0]" = "1" (landlord)
    d) Formats amounts with padding: "  1200.00"
    e) Formats phone: "(416)555-1234"
    f) Saves filled PDF
    g) Returns PDF buffer
    
11. Download Completion
    a) Creates blob from response
    b) Triggers browser download: N4.pdf
    c) Sends email in background:
       - Converts blob to base64 (chunked)
       - Calls POST /api/send-email
       - Attaches PDF
       - Sends to john@example.com
    d) Clears sessionStorage:
       - n4_formData
       - n4_currentStep
       - formData
       - formId
    e) Shows toast: "PDF downloaded and sent to your email!"
    f) Redirects to home after 2 seconds
    
12. Email Delivery
    a) User receives email
    b) Subject: "Your N4 Form"
    c) Body: "Your completed N4 form is attached."
    d) Attachment: N4.pdf (filled form)
    
13. User Returns to Landing Page (/)
    - Clean state
    - Can start new form if needed
```

---

## 💾 SESSION STORAGE STRUCTURE

```typescript
During Form Filling:
{
  "n4_currentStep": "2",  // Current step number
  "n4_formData": {        // All form values
    "landlordName": "John Doe",
    "tenantNames": ["Jane Smith"],
    "rentalAddress": "123 Main St",
    "rentalPeriods": [
      {
        "rentDueDate": "2024-01-01",
        "fromDate": "01/01/2024",
        "toDate": "31/01/2024",
        "lawfulRent": "1200",
        "paidRent": "800",
        "rentOwing": 400
      }
    ],
    "whoAreYou": "landlord",
    "phoneNumber": "4165551234",
    // ... other fields
  }
}

Before Checkout:
{
  "formData": {           // Processed form data
    "landlordName": "John Doe",
    "tenantNames": "Jane Smith",  // Array joined to string
    "rentalAddress": "123 Main St",
    "rentalPeriods": [     // Max 3 periods
      {
        "rentDueDate": "01/01/2024",  // Formatted dd/mm/yyyy
        "fromDate": "01/01/2024",
        "toDate": "31/01/2024",
        "lawfulRent": "1200",
        "paidRent": "800",
        "rentOwing": 400
      }
    ],
    "landlordPhoneNumber": "(416)555-1234",  // Formatted
    "serveDate": "01/01/2024",
    "terminationDate": "15/01/2024",
    // ... all fields
  },
  "formId": "n4"
}

After Download:
{
  // All cleared
}
```

---

## 🔒 ENVIRONMENT VARIABLES

### `.env.local` (not committed to git)

```bash
# ===========================
# STRIPE CONFIGURATION
# ===========================
STRIPE_SECRET_KEY=sk_test_51...  # From Stripe dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_PRICE_ID=price_1...  # Create product in Stripe, copy price ID

# ===========================
# BASE URL
# ===========================
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Change to production URL

# ===========================
# EMAIL CONFIGURATION (SMTP)
# ===========================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false  # true for port 465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Gmail App Password, not regular password
SMTP_FROM=LTB Forms <noreply@ltbforms.com>

# Alternative: SendGrid
# SENDGRID_API_KEY=SG.xxx...

# ===========================
# GOOGLE ANALYTICS (OPTIONAL)
# ===========================
NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID=GTM-XXXXXXX
```

### **Gmail App Password Setup:**
```
1. Go to Google Account settings
2. Security → 2-Step Verification (enable if not already)
3. App passwords
4. Generate new app password for "Mail"
5. Copy 16-character password (e.g., "abcd efgh ijkl mnop")
6. Use as SMTP_PASS (no spaces)
```

### **Stripe Setup:**
```
1. Create Stripe account
2. Go to Products
3. Create new product:
   - Name: "N4 Form Filing"
   - Price: $86 CAD
   - One-time payment
4. Copy price ID (price_1...)
5. Go to Developers → API keys
6. Copy secret key (sk_test_...)
7. Copy publishable key (pk_test_...)
```

---

## 🚀 DEPLOYMENT

### **Prerequisites**
- Node.js 20+ installed
- npm or yarn package manager

### **Local Development**

```bash
# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local  # Then edit with your values

# Run development server
npm run dev

# Open browser
http://localhost:3000
```

### **Build for Production**

```bash
# Build application
npm run build

# Start production server
npm start

# Server runs on port 3000
```

### **Deployment to Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# Settings → Environment Variables
# Add all variables from .env.local
```

### **Deployment to Other Platforms**

**Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod
```

**AWS Amplify:**
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize
amplify init

# Add hosting
amplify add hosting

# Publish
amplify publish
```

**Docker:**
```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build image
docker build -t ltb-forms .

# Run container
docker run -p 3000:3000 --env-file .env.local ltb-forms
```

---

## 📊 FORMS SUPPORTED

| Form | Full Name | Description | Price |
|------|-----------|-------------|-------|
| **N4** | Notice to End Tenancy for Non-Payment of Rent | Used when tenant hasn't paid rent | $86 |
| **N5** | Notice to End Tenancy for Interference, Damage, or Overcrowding | Used for property damage, excessive noise, illegal activity | $86 |
| **N8** | Notice to End Tenancy at End of Term | Used when landlord wants to end tenancy at end of rental period | $86 |
| **N12** | Notice to End Tenancy (Landlord/Family Requires Unit) | Used when landlord or family member needs to move into unit | $86 |

**All forms:**
- Official LTB templates
- Fillable PDF generation
- Email delivery included
- Instant download
- Legally compliant for Ontario

---

## 🛠️ TECHNICAL ARCHITECTURE

### **Frontend:**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Component Library:** shadcn/ui (Radix UI)
- **Form Management:** React Hook Form
- **Validation:** Zod
- **Icons:** Lucide React
- **Date Utilities:** date-fns

### **Backend (API Routes):**
- **Runtime:** Node.js (Next.js server)
- **PDF Generation:** pdf-lib
- **Payment Processing:** Stripe
- **Email Delivery:** SendGrid or Nodemailer

### **State Management:**
- **Form State:** React Hook Form
- **Persistence:** sessionStorage (client-side)
- **URL State:** Next.js useSearchParams

### **Database:**
- None (stateless application)
- All data stored client-side until checkout
- No user accounts or login required

### **File Storage:**
- PDF templates: `/public/templates/`
- Generated PDFs: In-memory (streamed to browser)
- No server-side file storage

### **Payment Flow:**
- Stripe Checkout (hosted)
- No PCI compliance needed (Stripe handles cards)
- Webhook for payment confirmation (optional)

---

## 🔧 KEY TECHNICAL DECISIONS

### **1. Why Next.js App Router?**
- Modern React architecture
- Built-in API routes (no separate backend)
- Server-side rendering for landing page (SEO)
- Client-side rendering for forms (sessionStorage)
- Dynamic imports for code splitting

### **2. Why sessionStorage?**
- No database needed (reduces complexity & cost)
- Data persists during page refresh
- Auto-clears when tab closes (privacy)
- Survives Stripe checkout redirect
- No backend session management

### **3. Why pdf-lib?**
- Fill existing PDF forms (not generate from scratch)
- Works in Node.js environment
- Preserves PDF form structure
- No external dependencies
- Can flatten forms if needed

### **4. Why React Hook Form + Zod?**
- Type-safe validation
- Minimal re-renders (performance)
- Built-in error handling
- Easy integration with shadcn/ui
- Zod schema as single source of truth

### **5. Why Stripe Checkout?**
- PCI compliant (no card handling)
- Mobile-optimized
- Multiple payment methods
- Built-in fraud detection
- Easy integration (just redirect)

### **6. Why shadcn/ui?**
- Fully customizable (copy components)
- Built on Radix UI (accessible)
- Tailwind CSS styling
- No npm package bloat
- Copy only what you need

### **7. Why Dynamic Imports (`ssr: false`)?**
- Forms use sessionStorage (browser-only)
- Prevents hydration mismatches
- Avoids "window is not defined" errors
- Landing page still SSR (SEO benefit)

---

## 🧪 TESTING

### **Manual Testing Checklist**

**Form N4 - Step 1:**
- [ ] Enter landlord name (3-30 chars)
- [ ] Add/remove tenant names (1-3)
- [ ] Enter rental address (5-150 chars)
- [ ] Click "Next" → should advance to Step 2
- [ ] Refresh page → data should persist

**Form N4 - Step 2:**
- [ ] Select rent due date
- [ ] Verify fromDate/toDate auto-calculation
- [ ] Enter lawful rent (max 6 digits)
- [ ] Enter paid rent
- [ ] Verify rent owing calculation
- [ ] Try entering paid > lawful → should show error
- [ ] Add second rental period
- [ ] Remove rental period
- [ ] Click "Next" → should advance to Step 3

**Form N4 - Step 3:**
- [ ] Select "Landlord"
- [ ] Enter phone (10 digits)
- [ ] Switch to "Legal Representative"
- [ ] Verify phone field cleared
- [ ] Fill all legal rep fields
- [ ] Enter invalid LSUC # (not 6 chars) → should show error
- [ ] Enter invalid postal code → should format correctly
- [ ] Click "Next" → should advance to Step 4

**Form N4 - Step 4:**
- [ ] Select serve date
- [ ] Select serve method (in-person)
- [ ] Verify termination date = serve date + 14 days
- [ ] Change to mail method
- [ ] Verify termination date = serve date + 19 days
- [ ] Enter email
- [ ] Click "Pay Now"

**Stripe Checkout:**
- [ ] Verify redirects to Stripe
- [ ] Test card: 4242 4242 4242 4242
- [ ] Expiry: Any future date
- [ ] CVC: Any 3 digits
- [ ] Click "Pay"
- [ ] Verify redirects to /download

**Download Page:**
- [ ] Click "Download PDF"
- [ ] Verify PDF downloads
- [ ] Open PDF → verify all fields filled
- [ ] Check email → verify PDF attachment
- [ ] Verify redirects to home after 2 seconds

**Edge Cases:**
- [ ] Cancel Stripe checkout → should return to Step 4 with data
- [ ] Refresh during form → should keep data
- [ ] Close tab and reopen → data should be gone
- [ ] Fill N4, then visit N5 → should be separate forms
- [ ] Try 5 rental periods → should combine to 3 in PDF

---

## 🐛 COMMON ISSUES & SOLUTIONS

### **Issue: "Window is not defined"**
```
Error: ReferenceError: window is not defined
```
**Solution:** Add `ssr: false` to dynamic import
```typescript
const FormN4 = dynamic(() => import('@/components/FormN4'), { ssr: false });
```

### **Issue: Form data not persisting**
**Causes:**
1. sessionStorage full (5-10MB limit)
2. Private browsing mode
3. Browser settings block storage

**Solution:** Check browser console for storage errors

### **Issue: PDF fields not filling**
**Cause:** Field names don't match template
**Solution:** 
```bash
# Use extract-pdf-fields API to get correct field names
POST /api/extract-pdf-fields
```

### **Issue: Email not sending**
**Causes:**
1. Invalid SMTP credentials
2. Gmail blocking less secure apps
3. PDF too large (>25MB)

**Solution:** 
- Use Gmail App Password (not regular password)
- Check PDF size
- Test with SendGrid instead

### **Issue: Stripe redirect not working**
**Cause:** Incorrect success/cancel URLs
**Solution:** Verify URLs in checkout API:
```typescript
successUrl: `${window.location.origin}/download?success=true&formId=n4`
cancelUrl: `${window.location.origin}/n4?success=false&step=4`
```

### **Issue: Dates showing wrong month**
**Cause:** Timezone conversion
**Solution:** Parse dates without timezone:
```typescript
const parseISODate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);  // month is 0-indexed
};
```

---

## 📝 CODING CONVENTIONS

### **File Naming:**
- Components: PascalCase (`FormN4.tsx`)
- Hooks: camelCase with prefix (`use-form-persistence.ts`)
- Utils: camelCase (`validation.ts`)
- API routes: kebab-case (`fill-n4/route.ts`)

### **Component Structure:**
```typescript
"use client"  // Only if using client-side features

import statements
type/interface definitions
component function
export default
```

### **Form Field Pattern:**
```typescript
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>
        Label<span className="text-red-500">*</span>
      </FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### **API Route Pattern:**
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Process request
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error message' },
      { status: 500 }
    );
  }
}
```

---

## 🎓 LEARNING RESOURCES

### **Next.js 14:**
- [Official Docs](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)

### **React Hook Form:**
- [Docs](https://react-hook-form.com/)
- [Zod Integration](https://react-hook-form.com/get-started#SchemaValidation)

### **pdf-lib:**
- [Docs](https://pdf-lib.js.org/)
- [Form Filling Guide](https://pdf-lib.js.org/docs/api/form/)

### **Stripe:**
- [Checkout Docs](https://stripe.com/docs/checkout)
- [Next.js Integration](https://stripe.com/docs/checkout/quickstart)

### **shadcn/ui:**
- [Docs](https://ui.shadcn.com/)
- [Components](https://ui.shadcn.com/docs/components)

---

## 📞 SUPPORT & MAINTENANCE

### **Error Monitoring:**
Consider adding:
- [Sentry](https://sentry.io/) for error tracking
- [LogRocket](https://logrocket.com/) for session replay

### **Analytics:**
Already integrated:
- Google Tag Manager (GTM_ID in env)

Consider adding:
- Google Analytics
- Mixpanel for conversion tracking

### **Logging:**
```typescript
// Add structured logging
console.log('📝 Processing N4 form:', { 
  formId: 'n4', 
  step: currentStep,
  timestamp: new Date().toISOString()
});
```

---

## 🔐 SECURITY CONSIDERATIONS

### **Current Security Measures:**

1. **No Sensitive Data Storage:**
   - No passwords
   - No credit card info (handled by Stripe)
   - sessionStorage cleared after download

2. **Input Validation:**
   - Zod schemas on client
   - Should add server-side validation in API routes

3. **CORS:**
   - API routes protected by Next.js
   - Only same-origin requests

### **Recommendations:**

1. **Add Rate Limiting:**
```typescript
// api/fill-n4/route.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5  // 5 requests per IP
});
```

2. **Add CSRF Protection:**
```typescript
// Use next-csrf
import { csrf } from 'next-csrf';
```

3. **Sanitize PDF Inputs:**
```typescript
// Before filling PDF fields
const sanitize = (input: string) => {
  return input.replace(/[<>]/g, '');  // Remove HTML-like chars
};
```

4. **Environment Variables:**
- Never commit `.env.local` to git
- Use Vercel/Netlify environment variables
- Rotate Stripe keys regularly

---

## 📊 PERFORMANCE OPTIMIZATION

### **Current Optimizations:**

1. **Code Splitting:**
   - Dynamic imports for forms
   - Separate chunks for each form component

2. **Image Optimization:**
   - Next.js Image component
   - WebP format for logos

3. **CSS:**
   - Tailwind purges unused styles
   - ~50KB production CSS

### **Recommendations:**

1. **Add Image Lazy Loading:**
```typescript
<Image
  src="/images/logo.png"
  loading="lazy"
  placeholder="blur"
/>
```

2. **Optimize Fonts:**
```typescript
// Already using next/font/google
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',  // Prevents FOIT
});
```

3. **Add Loading States:**
```typescript
// Already implemented for forms
{isLoading && <Loader2 className="animate-spin" />}
```

---

## 🎯 FUTURE ENHANCEMENTS

### **Feature Ideas:**

1. **User Accounts:**
   - Save forms for later
   - View past submissions
   - Payment history

2. **Form Templates:**
   - Pre-fill common data
   - Save as draft
   - Duplicate forms

3. **Multi-Language:**
   - French (required for Ontario)
   - i18n with next-intl

4. **Payment Options:**
   - PayPal
   - Apple Pay
   - Google Pay

5. **Bulk Forms:**
   - Generate multiple N4 forms
   - CSV import
   - Batch processing

6. **Legal Review:**
   - Optional paralegal review ($$$)
   - Live chat support
   - Form correction service

7. **Mobile App:**
   - React Native
   - Offline form filling
   - Push notifications

---

## 📄 LICENSE

```
MIT License

Copyright (c) 2024 LTB Forms

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 🙏 ACKNOWLEDGMENTS

**Built with:**
- Next.js by Vercel
- React by Meta
- Tailwind CSS by Tailwind Labs
- shadcn/ui by shadcn
- pdf-lib by Andrew Dillon
- Stripe

---

## 📞 CONTACT

**Website:** https://ltbforms.com  
**Email:** support@ltbforms.com  
**GitHub:** [GitHub Repo Link]

---

**Last Updated:** October 31, 2024  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

---

## END OF DOCUMENTATION

