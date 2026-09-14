import Link from 'next/link'
import React from 'react'
export function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-[#EAB9BD4D] to-[#EAB9BD4D] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            LTB Forms. Filed Right — Every Time.
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Complete your N4 Notice to End Tenancy online in minutes and
            download it instantly — all for $86. Need more help? A licensed
            landlord specialist paralegal can file with the Board and represent
            you at the hearing.
          </p>
          <button className="">
            <Link href="/n4" className='bg-btnBgPrimary hover:bg-btnBgPrimary/90 text-white font-semibold py-3 px-8 rounded-lg text-lg shadow-md transition duration-300'>
            Start My N4 Now
            </Link>
          </button>
        </div>
      </div>
    </section>
  )
}
