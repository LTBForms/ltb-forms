import React from 'react'
export function PricingSection() {
  return (
    <section id="pricing" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Pricing Made Simple
        </h2>
        <div className="overflow-x-auto custom-box-shadow rounded-lg">
          <table className="min-w-full bg-white !rounded-lg !overflow-hidden ">
            <thead className="bg-btnBgPrimary text-white">
              <tr>
                <th className="py-4 px-6 text-left">Service</th>
                <th className="py-4 px-6 text-left">Price</th>
                <th className="py-4 px-6 text-left">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 rounded-b-lg">
              <tr>
                <td className="py-4 px-6 font-medium">N4 Self-Drafting Form</td>
                <td className="py-4 px-6 font-bold">$86</td>
                <td className="py-4 px-6">
                  Fill out the online form & download your completed N4
                  instantly
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-4 px-6 font-medium">
                  N4 + Filing with the LTB
                </td>
                <td className="py-4 px-6 font-bold">$86 + Filing Fee</td>
                <td className="py-4 px-6">
                  We file your application with the Landlord and Tenant Board
                </td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium">
                  N4 + Filing + Representation
                </td>
                <td className="py-4 px-6">Custom Quote</td>
                <td className="py-4 px-6">Full-service legal support</td>
              </tr>
              <tr className="bg-gray-50 !rounded-b-lg">
                <td className="py-4 px-6 font-medium">
                  Other Forms (N5, N6, N7, etc.)
                </td>
                <td className="py-4 px-6">Custom Quote</td>
                <td className="py-4 px-6">
                  Paralegal-assisted drafting and optional representation
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* <div className="text-center mt-12">
          <button className="bg-btnBgPrimary hover:bg-btnBgPrimary/90 text-white font-semibold py-3 px-8 rounded-lg text-lg shadow-md transition duration-300">
            Start for $86
          </button>
        </div> */}
      </div>
    </section>
  )
}
