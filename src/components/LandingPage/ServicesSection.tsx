import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export function ServicesSection() {
  const forms = [
    {
      id: 'n4',
      title: 'Form N4 – Notice to End Tenancy for Non-Payment of Rent',
      href: '/n4',
    },
    {
      id: 'n5',
      title:
        'Form N5 – Notice to End Tenancy for Interference, Damage,Overcrowding',
      href: '/contact-us',
    },
    {
      id: 'n8',
      title: 'Form N8 – Notice to End Tenancy at End of Term',
      href: '/contact-us',
    },
    {
      id: 'n12',
      title: "Form N12 – Notice to End Tenancy for Landlord's Own Use",
      href: '/n12',
    },
  ]

  return (
    <section id="services" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Forms List
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow h-full"
            >
              <Image
                src="/images/form-paper.svg"
                alt="PDF Icon"
                width={48}
                height={48}
                className="mb-4"
              />
              <div className="text-gray-900 font-medium leading-relaxed flex-1">
                {form.title}
              </div>
              {form.href.startsWith('tel:') ? (
                <a
                  href={form.href}
                  className="mt-6 inline-flex !items-center text-btnBgPrimary font-semibold hover:text-btnBgPrimary/90"
                  aria-label={`Call for ${form.title}`}
                >
                  Create form
                  <ChevronRight className="ml-1 h-4 w-4" />
                </a>
              ) : (
                <Link
                  href={form.href}
                  className="mt-6 inline-flex !items-center text-btnBgPrimary font-semibold hover:text-btnBgPrimary/90"
                >
                  Create form
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
