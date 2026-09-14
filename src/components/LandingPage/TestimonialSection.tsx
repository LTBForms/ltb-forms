import React from 'react'
import { QuoteIcon } from 'lucide-react'
export function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        'I completed my N4 in 5 minutes . This system is a game changer.',
      author: 'Toronto Landlord',
    },
    {
      quote:
        'The paralegal handled my N5 and hearing flawlessly. I felt supported the entire way.',
      author: 'Mississauga Landlord',
    },
  ]
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Trusted by Ontario Landlords
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-[#F9FAFB] p-8 rounded-lg shadow-md">
              <QuoteIcon className="h-10 w-10 text-btnBgPrimary mb-4" />
              <p className="text-lg text-[#374151] mb-6 italic font-normal">
                {testimonial.quote}
              </p>
              <p className="text-gray-900 font-semibold">
                — {testimonial.author}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
