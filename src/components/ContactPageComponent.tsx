"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export default function ContactPageComponent() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="">
        <Link href="/">
          <Image src="/images/logo.png" alt="LTB Logo" width={150} height={150} />
        </Link>
      </div>

      {/* Right Section - Download Button */}
      <div className="w-full flex items-center justify-center p-8 flex-1">
        <div className="text-center">
          {/* PDF Icon */}
          <div className="mb-8 flex justify-center">
            <Image src="/images/contact-us.svg" alt="PDF Icon" width={96} height={76} />
          </div>

          {/* Form Title */}
          <h1 className="text-[30px] font-semibold text-gray-800 mb-8">
          Need Assistance with This Form?
          </h1>
          <p className="font-medium text-[26px] text-gray-800 mb-8 max-w-[957px]">
          If you have any questions or need help completing this form, please contact LTB
           Forms. Our team will guide you through the process and provide any clarification
            you may need.
          </p>

          {/* Download Button */}
          <Button
            asChild
            className="bg-[#C0111F] hover:bg-[#C0111F]/80 text-white px-8 py-4 min-w-[208px] h-[51px] text-sm font-normal rounded-[5px] shadow-lg transition-colors disabled:cursor-not-allowed"
          >
            <a href="tel:9059265898" aria-label="Call LTB Forms">
              Contact Us
            </a>
          </Button>
          
        </div>
      </div>
    </div>
  )
}
