import React from 'react'
import {
  ClipboardIcon,
  FormInput,
  DownloadIcon,
  UserIcon,
  FileTextIcon,
  DollarSign,
} from 'lucide-react'
export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-5 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="bg-[#EAB9BD66] p-4 rounded-full mb-4">
              <ClipboardIcon className="h-8 w-8 text-btnBgPrimary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              1. Select Your Notice Type
            </h3>
            <ul className="text-gray-600 space-y-1">
              <li>Instant Self-Drafting: N4</li>
              <li>Paralegal Assisted: N5, N6, N7 and others</li>
            </ul>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-[#EAB9BD66] p-4 rounded-full mb-4">
              <FormInput className="h-8 w-8 text-btnBgPrimary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              2. Complete the Online Form
            </h3>
            <p className="text-gray-600">
              Answer a few simple questions — no legal jargon or confusion.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-[#EAB9BD66] p-4 rounded-full mb-4">
              <DollarSign className="h-8 w-8 text-btnBgPrimary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              3. Make Your Payment Immediately
            </h3>
            <ul className="text-gray-600 space-y-1">
              <li>After payment, you can download</li>
              <li>your form's PDF instantly.</li>
            </ul>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-[#EAB9BD66] p-4 rounded-full mb-4">
              <DownloadIcon className="h-8 w-8 text-btnBgPrimary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              4. Download Your N4 Instantly
            </h3>
            <p className="text-gray-600">
              Our system drafts your official LTB form automatically. Print or
              serve it immediately.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-[#EAB9BD66] p-4 rounded-full mb-4">
              <FileTextIcon className="h-8 w-8 text-btnBgPrimary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              5. Complex Forms? We've Got You.
            </h3>
            <p className="text-gray-600">
              For more complex notices, a licensed paralegal will connect with
              you directly to draft accurately.
            </p>
          </div>
        </div>
        {/* <div className="text-center mt-12">
          <button className="bg-btnBgPrimary hover:bg-btnBgPrimary/90 text-white font-semibold py-3 px-8 rounded-lg text-lg shadow-md transition duration-300">
            Get Started
          </button>
        </div> */}
      </div>
    </section>
  )
}
