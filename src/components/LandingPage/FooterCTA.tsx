import Link from 'next/link'
import React from 'react'
import { Button } from '../ui/button'
export function FooterCTA() {
  return (
    <section id="contact" className="py-16 bg-btnBgPrimary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Start Your N4 in Minutes</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Skip the paperwork headache. Let technology and legal expertise work
            for you.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button className="block">
              <Link href="/n4" className="w-[220px] !h-[52px] block bg-white text-btnBgPrimary hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg text-base lg:text-lg shadow-md transition duration-300">
                Start My N4 Now
              </Link>
            </button>
            <Button asChild className="h-[52px] w-[220px] bg-transparent hover:bg-transparent hover:text-white border-2 border-white text-white font-semibold py-3 px-8 rounded-lg text-base lg:text-lg transition duration-300">
              <a href="tel:9059265898" aria-labe="Call LTB for consultation 2">
                (905) 926-5898
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
