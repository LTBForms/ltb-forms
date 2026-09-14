'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { ArrowLeft, Download } from 'lucide-react'
import Image from 'next/image'

interface DownloadButtonPageProps {
  onBack?: () => void
  onDownload?: () => void
  isDownloading?: boolean
  title?: string
}

export default function DownloadButtonPage({ onBack, onDownload, isDownloading = false, title = 'Notice to End Tenancy for Non-Payment of Rent (Form N4)' }: DownloadButtonPageProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <div className="">
        <Image src="/images/logo.png" alt="LTB Logo" width={150} height={150} />
      </div>

      {/* Right Section - Download Button */}
      <div className="w-full flex items-center justify-center p-8 flex-1">
        <div className="text-center">
          {/* PDF Icon */}
          <div className="mb-8 flex justify-center">
            <Image src="/images/pdf-icon.png" alt="PDF Icon" width={96} height={76} />
          </div>

          {/* Form Title */}
          <h1 className="text-[30px] font-medium text-gray-800 mb-8">
            {title}
          </h1>

          {/* Download Button */}
          <Button
            onClick={onDownload}
            disabled={isDownloading}
            className="bg-[#C0111F] hover:bg-[#C0111F]/80 text-white px-8 py-4 w-[208px] h-[51px] text-sm font-normal rounded-[5px] shadow-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isDownloading ? 'Generating PDF...' : 'Download PDF'}
          </Button>

          {/* Back Button
          {onBack && (
            <div className="mt-6">
              <Button
                onClick={onBack}
                variant="outline"
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Form
              </Button>
            </div>
          )} */}
        </div>
      </div>
    </div>
  )
}
