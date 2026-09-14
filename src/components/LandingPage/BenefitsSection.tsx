import React from 'react'
import { CheckCircleIcon } from 'lucide-react'
export function BenefitsSection() {
  const benefits = [
    'Instant N4 Drafting — No waiting, no errors.',
    'Licensed Paralegal Support — Real legal professionals when you need them.',
    'Transparent Pricing — Flat rates, no surprises.',
    'Error-Free Documents — Compliant with Ontario LTB requirements.',
    'Save Time & Stress — We simplify a complicated process.',
  ]
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Landlords Choose LTB Forms
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
              <p className="text-lg text-gray-700">{benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
