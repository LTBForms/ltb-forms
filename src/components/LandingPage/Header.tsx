import React from 'react'
import { Button } from '../ui/button'
import Link from 'next/link'
export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-btnBgPrimary">LTB Forms</h1>
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a
              href="#how-it-works"
              className="text-gray-700 hover:text-btnBgPrimary"
            >
              How It Works
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-btnBgPrimary">
              Pricing
            </a>
            <a href="#services" className="text-gray-700 hover:text-btnBgPrimary">
              Forms List
            </a>
          </nav>
          <Button asChild className='bg-btnBgPrimary hover:bg-btnBgPrimary/90'>
            <a href="tel:9059265898" aria-label="Call LTB  for consultation 1">
              (905) 926-5898
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
