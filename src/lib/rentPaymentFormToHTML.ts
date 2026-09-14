interface DateInputs {
  day1: string
  day2: string
  month1: string
  month2: string
  year1: string
  year2: string
  year3: string
  year4: string
}

interface MoneyInputs {
  thousands: string
  hundreds: string
  tens: string
  units: string
  decimal1: string
  decimal2: string
}

interface RentRow {
  fromDate: DateInputs
  toDate: DateInputs
  rentCharged: MoneyInputs
  rentPaid: MoneyInputs
  rentOwing: MoneyInputs
}

interface FormData {
  landlordName: string
  tenantNames: string[]
  rentalAddress: string
  rentalPeriods: {
    fromDate: string
    toDate: string
    lawfulRent: string
    paidRent: string
    rentOwing: number
  }[]
  whoAreYou: "landlord" | "legal"
  name: string
  lsucNumber: string
  companyName: string
  mailingAddress: string
  phoneNumber: string
  faxNumber: string
  municipality: string
  province: string
  postalCode: string
  serveDate: string
  serveMethod: string
  email: string
}

// Convert date inputs to formatted date string
const formatDateInputs = (dateInputs: DateInputs): string => {
  const day = `${dateInputs.day1}${dateInputs.day2}`.padStart(2, '0')
  const month = `${dateInputs.month1}${dateInputs.month2}`.padStart(2, '0')
  const year = `${dateInputs.year1}${dateInputs.year2}${dateInputs.year3}${dateInputs.year4}`
  
  if (day === '00' || month === '00' || year === '0000') {
    return '___/___/_____'
  }
  
  return `${day}/${month}/${year}`
}

// Convert money inputs to formatted amount string
const formatMoneyInputs = (moneyInputs: MoneyInputs): string => {
  const dollars = `${moneyInputs.thousands}${moneyInputs.hundreds}${moneyInputs.tens}${moneyInputs.units}`
  const cents = `${moneyInputs.decimal1}${moneyInputs.decimal2}`
  
  if (dollars === '0000' && cents === '00') {
    return '$0.00'
  }
  
  const amount = parseFloat(`${dollars}.${cents}`)
  return `$${amount.toFixed(2)}`
}

// Convert form data to rent rows for the table
const convertFormDataToRentRows = (formData: FormData): RentRow[] => {
  if (!formData?.rentalPeriods) return []
  
  return formData.rentalPeriods.map(period => {
    // Convert date strings to DateInputs format
    const fromDate = new Date(period.fromDate)
    const toDate = new Date(period.toDate)
    
    const formatToDateInputs = (date: Date): DateInputs => {
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear().toString()
      
      return {
        day1: day[0] || '',
        day2: day[1] || '',
        month1: month[0] || '',
        month2: month[1] || '',
        year1: year[0] || '',
        year2: year[1] || '',
        year3: year[2] || '',
        year4: year[3] || '',
      }
    }
    
    // Convert money amounts to MoneyInputs format
    const formatToMoneyInputs = (amount: string): MoneyInputs => {
      const num = parseFloat(amount) || 0
      const str = num.toFixed(2).replace('.', '')
      const padded = str.padStart(6, '0')
      
      return {
        thousands: padded[0] || '',
        hundreds: padded[1] || '',
        tens: padded[2] || '',
        units: padded[3] || '',
        decimal1: padded[4] || '',
        decimal2: padded[5] || '',
      }
    }
    
    const lawfulRent = parseFloat(period.lawfulRent) || 0
    const paidRent = parseFloat(period.paidRent) || 0
    const rentOwing = Math.max(0, lawfulRent - paidRent)
    
    return {
      fromDate: formatToDateInputs(fromDate),
      toDate: formatToDateInputs(toDate),
      rentCharged: formatToMoneyInputs(period.lawfulRent),
      rentPaid: formatToMoneyInputs(period.paidRent),
      rentOwing: formatToMoneyInputs(rentOwing.toString()),
    }
  })
}

// Calculate total rent owing
const calculateTotalRentOwing = (formData: FormData): MoneyInputs => {
  if (!formData?.rentalPeriods) {
    return { thousands: '', hundreds: '', tens: '', units: '', decimal1: '', decimal2: '' }
  }
  
  const total = formData.rentalPeriods.reduce((sum, period) => {
    const lawfulRent = parseFloat(period.lawfulRent) || 0
    const paidRent = parseFloat(period.paidRent) || 0
    return sum + Math.max(0, lawfulRent - paidRent)
  }, 0)
  
  return {
    thousands: Math.floor(total / 1000).toString().padStart(1, '0')[0] || '',
    hundreds: Math.floor((total % 1000) / 100).toString(),
    tens: Math.floor((total % 100) / 10).toString(),
    units: Math.floor(total % 10).toString(),
    decimal1: Math.floor((total * 10) % 10).toString(),
    decimal2: Math.floor((total * 100) % 10).toString(),
  }
}

// Generate the RentPaymentForm HTML content for page 3
export const generateRentPaymentFormHTML = (formData: FormData): string => {
  const rentRows = convertFormDataToRentRows(formData)
  const totalRentOwing = calculateTotalRentOwing(formData)
  
  // Format signature date
  const signatureDate = formData?.serveDate ? new Date(formData.serveDate) : new Date()
  const formatSignatureDate = (date: Date): DateInputs => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString()
    
    return {
      day1: day[0] || '',
      day2: day[1] || '',
      month1: month[0] || '',
      month2: month[1] || '',
      year1: year[0] || '',
      year2: year[1] || '',
      year3: year[2] || '',
      year4: year[3] || '',
    }
  }
  
  const signatureDateInputs = formatSignatureDate(signatureDate)
  const isLandlord = formData?.whoAreYou === 'landlord'
  
  return `
    <div class="rent-payment-form" style="width: 100%; margin: 0; padding: 0; font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.1; color: #000;">
      <!-- Header Section -->
      <div style="margin-bottom: 24px;">
        <div style="display: flex; gap: 32px; margin-bottom: 16px;">
          <div style="flex: 1;">
            <div style="font-weight: bold; margin-bottom: 8px;">How will you know if the landlord applies to the Board?</div>
            <div style="font-size: 9pt; line-height: 1.2; margin-bottom: 16px;">
              The earliest date that the landlord can apply to the Board is the day after the termination date in this
              notice. If the landlord does apply, the Board will schedule a hearing and send you a copy of the
              application and the Notice of Hearing.
            </div>

            <div style="font-weight: bold; margin-bottom: 8px;">What you can do if the landlord applies to the Board</div>
            <ul style="font-size: 9pt; line-height: 1.2; list-style-type: disc; list-style-position: inside; margin-bottom: 16px; padding-left: 0;">
              <li>Talk to your landlord about working out a payment plan.</li>
              <li>
                Go to the hearing where you can respond to the claims your landlord makes in the application; in most
                cases, before the hearing starts you can also talk to a Board mediator about mediating a payment plan.
              </li>
              <li>Get legal advice immediately; you may be eligible for legal aid services.</li>
            </ul>

            <div style="font-weight: bold; margin-bottom: 8px;">How to get more information</div>
            <div style="font-size: 9pt; line-height: 1.2;">
              For more information about this notice or about your rights, you can contact the Landlord and Tenant
              Board. You can reach the Board by phone at <span style="font-weight: bold;">416-645-8080</span> or
              <span style="font-weight: bold;"> 1-888-332-3234</span>. You can also visit their website at{" "}
              <span style="color: #0066cc;">tribunalsontario.ca/ltb</span>.
            </div>
          </div>
        </div>

        <div style="font-weight: bold; text-align: center; margin-bottom: 16px;">The following information is from your landlord</div>
        <div style="font-size: 9pt; text-align: center; margin-bottom: 16px;">
          This table is completed by the landlord to show how they calculated the total amount of rent unpaid on page 1:
        </div>
      </div>

      <!-- Main Table -->
      <div style="border: 2px solid #000; margin-bottom: 24px; width: 100%;">
        <!-- Table Header -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; width: 100%;">
          <div style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; text-align: center;">
            <div style="font-weight: bold; font-size: 9pt; margin-bottom: 4px;">Rent Period</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
              <div style="font-size: 9pt;">From: (dd/mm/yyyy)</div>
              <div style="font-size: 9pt;">To: (dd/mm/yyyy)</div>
            </div>
          </div>
          <div style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; text-align: center;">
            <div style="font-weight: bold; font-size: 9pt;">Rent Charged $</div>
          </div>
          <div style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; text-align: center;">
            <div style="font-weight: bold; font-size: 9pt;">Rent Paid $</div>
          </div>
          <div style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; text-align: center;">
            <div style="font-weight: bold; font-size: 9pt;">Rent Owing $</div>
          </div>
          <div style="border-bottom: 1px solid #000; padding: 8px; text-align: center;">
            <div style="font-weight: bold; font-size: 9pt;">Rent Owing $</div>
          </div>
        </div>

        <!-- Table Rows -->
        ${rentRows.map((row, index) => `
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; width: 100%;">
            <div style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 2px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr;">
                <div style="display: flex; align-items: center;">
                  
                  <input type="text" maxlength="1" value="${row.fromDate.day1}" style="width: 7px; height: 15px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                  <input type="text" maxlength="1" value="${row.fromDate.day2}" style="width: 7px; height: 15px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                  <span style="font-size: 9pt;">/</span>
                  <input type="text" maxlength="1" value="${row.fromDate.month1}" style="width: 7px; height: 15px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                  <input type="text" maxlength="1" value="${row.fromDate.month2}" style="width: 7px; height: 15px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                  <span style="font-size: 9pt;">/</span>
                  <input type="text" maxlength="1" value="${row.fromDate.year1}" style="width: 7px; height: 15px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                  <input type="text" maxlength="1" value="${row.fromDate.year2}" style="width: 7px; height: 15px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                  <input type="text" maxlength="1" value="${row.fromDate.year3}" style="width: 7px; height: 15px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                  <input type="text" maxlength="1" value="${row.fromDate.year4}" style="width: 7px; height: 15px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="font-size: 9pt; margin-right: 4px;"></span>
                  <input type="text" maxlength="1" value="${row.toDate.day1}" style="width: 7px; height: 15px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                  <input type="text" maxlength="1" value="${row.toDate.day2}" style="width: 7px; height: 15px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                  <span style="font-size: 9pt;">/</span>
                  <input type="text" maxlength="1" value="${row.toDate.month1}" style="width: 7px; height: 15px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                  <input type="text" maxlength="1" value="${row.toDate.month2}" style="width: 7px; height: 15px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                  <span style="font-size: 9pt;">/</span>
                  <input type="text" maxlength="1" value="${row.toDate.year1}" style="width: 7px; height: 15px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                  <input type="text" maxlength="1" value="${row.toDate.year2}" style="width: 7px; height: 15px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                  <input type="text" maxlength="1" value="${row.toDate.year3}" style="width: 7px; height: 15px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                  <input type="text" maxlength="1" value="${row.toDate.year4}" style="width: 7px; height: 15px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                </div>
              </div>
            </div>
               <div style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 2px; display: flex; justify-content: center;">
                 <div style="display: flex; align-items: center; gap: 1px;">
                   <input type="text" maxlength="1" value="" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                   <input type="text" maxlength="1" value="" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                   <input type="text" maxlength="1" value="" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                   <input type="text" maxlength="1" value="${row.rentCharged.thousands}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                   <input type="text" maxlength="1" value="${row.rentCharged.hundreds}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                   <input type="text" maxlength="1" value="${row.rentCharged.tens}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                   <input type="text" maxlength="1" value="${row.rentCharged.units}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                   <input type="text" maxlength="1" value="." style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                   <input type="text" maxlength="1" value="${row.rentCharged.decimal1}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                   <input type="text" maxlength="1" value="${row.rentCharged.decimal2}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                 </div>
               </div>
            <div style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 2px; display: flex; justify-content: center;">
              <div style="display: flex; align-items: center; gap: 1px;">
                <input type="text" maxlength="1" value="" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentPaid.thousands}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentPaid.hundreds}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentPaid.tens}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentPaid.units}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="." style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentPaid.decimal1}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentPaid.decimal2}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
              </div>
            </div>
            <div style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 2px; display: flex; justify-content: center;">
              <div style="display: flex; align-items: center; gap: 1px;">
                <input type="text" maxlength="1" value="" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentOwing.thousands}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentOwing.hundreds}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentOwing.tens}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentOwing.units}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="." style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentOwing.decimal1}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentOwing.decimal2}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
              </div>
            </div>
            <div style="border-bottom: 1px solid #000; padding: 2px; display: flex; justify-content: center;">
              <div style="display: flex; align-items: center; gap: 1px;">
                <input type="text" maxlength="1" value="" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentOwing.thousands}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentOwing.hundreds}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentOwing.tens}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentOwing.units}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="." style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentOwing.decimal1}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${row.rentOwing.decimal2}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
              </div>
            </div>
          </div>
        `).join('')}

        <!-- Total Row -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; width: 100%;">
          <div style="border-right: 1px solid #000; padding: 2px;"></div>
          <div style="border-right: 1px solid #000; padding: 2px;"></div>
          <div style="border-right: 1px solid #000; padding: 2px;"></div>
          <div style="border-right: 1px solid #000; padding: 2px; text-align: center; font-weight: bold; font-size: 9pt;">Total Rent Owing $</div>
           <div style="padding: 8px; display: flex; justify-content: center;">
             <div style="display: flex; align-items: center; gap: 1px;">
               <input type="text" maxlength="1" value="" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
               <input type="text" maxlength="1" value="" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
               <input type="text" maxlength="1" value="" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
               <input type="text" maxlength="1" value="${totalRentOwing.thousands}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
               <input type="text" maxlength="1" value="${totalRentOwing.hundreds}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
               <input type="text" maxlength="1" value="${totalRentOwing.tens}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
               <input type="text" maxlength="1" value="${totalRentOwing.units}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
               <input type="text" maxlength="1" value="." style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
               <input type="text" maxlength="1" value="${totalRentOwing.decimal1}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
               <input type="text" maxlength="1" value="${totalRentOwing.decimal2}" style="width: 5px; height: 15px; text-align: center; font-size: 8pt; border: 1px solid #666; background: white;" readonly />
             </div>
           </div>
        </div>
      </div>

      <!-- Signature Section -->
      <div style="margin-bottom: 24px; width: 100%;">
        <div style="font-weight: bold; margin-bottom: 16px;">Signature</div>

        <div style="display: flex; gap: 16px; margin-bottom: 16px;">
          <label style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" ${isLandlord ? 'checked' : ''} style="width: 16px; height: 16px;" readonly />
            <span style="font-size: 11pt;">Landlord</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" ${!isLandlord ? 'checked' : ''} style="width: 16px; height: 16px;" readonly />
            <span style="font-size: 11pt;">Representative</span>
          </label>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 11pt; margin-bottom: 4px;">First Name</div>
            <div style="display: flex; gap: 2px;">
              ${Array.from({ length: 20 }, (_, i) => `
                <input type="text" maxlength="1" value="${(formData?.name.split(' ')[0] || '')[i] || ''}" style="width: 16px; height: 24px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
              `).join('')}
            </div>
          </div>
          <div></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 11pt; margin-bottom: 4px;">Last Name</div>
            <div style="display: flex; gap: 2px;">
              ${Array.from({ length: 20 }, (_, i) => `
                <input type="text" maxlength="1" value="${(formData?.name.split(' ').slice(1).join(' ') || '')[i] || ''}" style="width: 16px; height: 24px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
              `).join('')}
            </div>
          </div>
          <div></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 11pt; margin-bottom: 4px;">Phone Number</div>
            <div style="display: flex; align-items: center; gap: 2px;">
              <span style="font-size: 11pt;">(</span>
              ${Array.from({ length: 3 }, (_, i) => `
                <input type="text" maxlength="1" value="${(formData?.phoneNumber || '')[i] || ''}" style="width: 16px; height: 24px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
              `).join('')}
              <span style="font-size: 11pt;">)</span>
              ${Array.from({ length: 3 }, (_, i) => `
                <input type="text" maxlength="1" value="${(formData?.phoneNumber || '')[i + 3] || ''}" style="width: 16px; height: 24px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
              `).join('')}
              <span style="font-size: 11pt;">-</span>
              ${Array.from({ length: 4 }, (_, i) => `
                <input type="text" maxlength="1" value="${(formData?.phoneNumber || '')[i + 6] || ''}" style="width: 16px; height: 24px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
              `).join('')}
            </div>
          </div>
          <div></div>
          <div style="border: 1px solid #666; height: 80px;"></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <div style="font-size: 11pt; margin-bottom: 4px;">Signature</div>
            <div style="border-bottom: 1px solid #666; height: 32px;"></div>
          </div>
          <div>
            <div style="font-size: 11pt; margin-bottom: 4px;">Date (dd/mm/yyyy)</div>
            <div style="border: 1px solid #666; height: 32px; display: flex; align-items: center; justify-content: center;">
              <div style="display: flex; align-items: center; gap: 2px;">
                <input type="text" maxlength="1" value="${signatureDateInputs.day1}" style="width: 16px; height: 24px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${signatureDateInputs.day2}" style="width: 16px; height: 24px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                <span style="font-size: 9pt;">/</span>
                <input type="text" maxlength="1" value="${signatureDateInputs.month1}" style="width: 16px; height: 24px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${signatureDateInputs.month2}" style="width: 16px; height: 24px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                <span style="font-size: 9pt;">/</span>
                <input type="text" maxlength="1" value="${signatureDateInputs.year1}" style="width: 16px; height: 24px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${signatureDateInputs.year2}" style="width: 16px; height: 24px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${signatureDateInputs.year3}" style="width: 16px; height: 24px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
                <input type="text" maxlength="1" value="${signatureDateInputs.year4}" style="width: 16px; height: 24px; text-align: center; font-size: 9pt; border: 1px solid #666; background: white;" readonly />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Representative Information Section -->
      ${formData?.whoAreYou === 'legal' ? `
        <div style="margin-bottom: 16px; width: 100%;">
          <div style="font-weight: bold; margin-bottom: 16px;">Representative Information (if applicable)</div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <div style="font-size: 11pt; margin-bottom: 4px;">Name</div>
              <div style="border: 1px solid #666; height: 32px;"></div>
            </div>
            <div>
              <div style="font-size: 11pt; margin-bottom: 4px;">LSUC #</div>
              <div style="border: 1px solid #666; height: 32px;"></div>
            </div>
            <div>
              <div style="font-size: 11pt; margin-bottom: 4px;">Company Name (if applicable)</div>
              <div style="border: 1px solid #666; height: 32px;"></div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <div style="font-size: 11pt; margin-bottom: 4px;">Mailing Address</div>
              <div style="border: 1px solid #666; height: 32px;"></div>
            </div>
            <div>
              <div style="font-size: 11pt; margin-bottom: 4px;">Phone Number</div>
              <div style="border: 1px solid #666; height: 32px;"></div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <div style="font-size: 11pt; margin-bottom: 4px;">Municipality (City, Town, etc.)</div>
              <div style="border: 1px solid #666; height: 32px;"></div>
            </div>
            <div>
              <div style="font-size: 11pt; margin-bottom: 4px;">Province</div>
              <div style="border: 1px solid #666; height: 32px;"></div>
            </div>
            <div>
              <div style="font-size: 11pt; margin-bottom: 4px;">Postal Code</div>
              <div style="border: 1px solid #666; height: 32px;"></div>
            </div>
            <div>
              <div style="font-size: 11pt; margin-bottom: 4px;">Fax Number</div>
              <div style="border: 1px solid #666; height: 32px;"></div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Page Number -->
      <div style="text-align: right; font-size: 9pt;">Page 2 of 2</div>
    </div>
  `
}
