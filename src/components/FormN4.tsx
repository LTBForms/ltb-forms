"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Plus, Calendar, AlertTriangle, X, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFormPersistence } from "@/hooks/use-form-persistence"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  nameValidation,
  rentalAddressValidation,
  companyNameValidation,
  mailingAddressValidation,
  municipalityValidation,
  emailValidation,
  validateTenantNames,
  optionalNameValidation,
  optionalCompanyNameValidation,
  optionalMailingAddressValidation,
  optionalMunicipalityValidation,
  optionalFaxNumberValidation,
  validatePhoneNumber,
  validateFaxNumber
} from "@/lib/validation"
// Zod schema for form validation
const rentalPeriodSchema = z.object({
  rentDueDate: z.string().min(1, "Rent due date is required"),
  fromDate: z.string(),
  toDate: z.string(),
  lawfulRent: z.string().trim().min(1, "Lawful rent is required").refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  }, "Lawful rent must be a valid number"),
  paidRent: z.string().trim().min(1, "Paid rent is required").refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  }, "Paid rent must be a valid number"),
  rentOwing: z.number()
})

const formSchema = z.object({
  // Step 1: Tenant Information
  landlordName: nameValidation,
  landlordPhoneNumber: z.string(),
  tenantNames: validateTenantNames,
  rentalAddress: rentalAddressValidation,

  // Step 2: Rent Details
  rentalPeriods: z.array(rentalPeriodSchema).min(1, "At least one rental period is required"),

  // Totals
  totalLawfulRent: z.string(),
  totalPaidRent: z.string(),

  // Step 3: Landlord/Legal Representative
  whoAreYou: z.enum(["landlord", "legal"]),
  name: nameValidation,
  representativePhoneNumber: z.string(),
  lsucNumber: z.string().trim().min(6, "LSUC number must be exactly 6 characters").max(6, "LSUC number must be exactly 6 characters"),
  companyName: optionalCompanyNameValidation,
  mailingAddress: mailingAddressValidation,
  phoneNumber: z.string().min(1, "Phone number is required").refine((val) => val.replace(/\D/g, '').length === 10, "Phone number must be exactly 10 digits"),
  faxNumber: optionalFaxNumberValidation,
  municipality: municipalityValidation,
  province: z.string().min(1, "Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),

  // Step 4: Notice Serving Details
  serveDate: z.string().min(1, "Serve date is required"),
  serveMethod: z.string().min(1, "Serve method is required"),
  email: emailValidation,

  // Additional fields for POST request
  representativeName: z.string(),
  terminationDate: z.string()
}).refine((data) => {
  // Validate that paid rent cannot exceed lawful rent for each period
  return data.rentalPeriods.every(period => {
    const lawfulRent = parseFloat(period.lawfulRent) || 0
    const paidRent = parseFloat(period.paidRent) || 0
    return paidRent <= lawfulRent
  })
}, {
  message: "Paid rent cannot exceed lawful rent",
  path: ["rentalPeriods"]
})

type FormData = z.infer<typeof formSchema>

type SkippedMonth = {
  monthName: string
  year: number
  month: number
  insertAfterIndex: number
}

export default function FormN4() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [rentalPeriodErrors, setRentalPeriodErrors] = useState<{ [key: number]: { lawfulRent?: string; paidRent?: string } }>({})
  const [isStepValid, setIsStepValid] = useState(false)
  const [skippedMonthsQueue, setSkippedMonthsQueue] = useState<SkippedMonth[]>([])
  const [skippedMonthLawfulRent, setSkippedMonthLawfulRent] = useState("")
  const [skippedMonthPaidRent, setSkippedMonthPaidRent] = useState("")
  const [skippedMonthDialogStep, setSkippedMonthDialogStep] = useState<"initial" | "entering_pay">("initial")
  const [servicesModalOpen, setServicesModalOpen] = useState(false)
  const [serviceFiling, setServiceFiling] = useState(false)
  const [serviceRepresentation, setServiceRepresentation] = useState(false)
  const serveMethodRef = useRef<HTMLButtonElement>(null)

  // Reset dialog form state when the current skipped month (queue[0]) changes
  useEffect(() => {
    if (skippedMonthsQueue.length > 0) {
      setSkippedMonthLawfulRent("")
      setSkippedMonthPaidRent("")
      setSkippedMonthDialogStep("initial")
    }
  }, [skippedMonthsQueue.length, skippedMonthsQueue[0]?.month, skippedMonthsQueue[0]?.year])

  // Use form persistence hook
  const {
    currentStep,
    isInitialized,
    nextStep: goToNextStep,
    prevStep: goToPrevStep,
    saveFormData,
    loadFormData,
    clearSavedData,
    isReturningFromCheckout,
    isReturningFromSuccessfulPayment
  } = useFormPersistence({
    formId: 'n4',
    maxSteps: 4,
    onStepChange: (step) => {
      // Update URL without page reload
      const url = new URL(window.location.href)
      url.searchParams.set('step', step.toString())
      window.history.replaceState({}, '', url.toString())
    }
  })

  // Get saved form data or use defaults
  const getInitialFormData = () => {
    const savedData = loadFormData()
    if (savedData) {
      return {
        landlordName: savedData.landlordName || "",
        landlordPhoneNumber: savedData.landlordPhoneNumber || "",
        tenantNames: savedData.tenantNames || [""],
        rentalAddress: savedData.rentalAddress || "",
        rentalPeriods: savedData.rentalPeriods || [{
          rentDueDate: "",
          fromDate: "",
          toDate: "",
          lawfulRent: "",
          paidRent: "",
          rentOwing: 0
        }],
        totalLawfulRent: savedData.totalLawfulRent || "",
        totalPaidRent: savedData.totalPaidRent || "",
        whoAreYou: savedData.whoAreYou || "landlord",
        name: savedData.name || "",
        representativePhoneNumber: savedData.representativePhoneNumber || "",
        lsucNumber: savedData.lsucNumber || "",
        companyName: savedData.companyName || "",
        mailingAddress: savedData.mailingAddress || "",
        phoneNumber: savedData.phoneNumber || "",
        faxNumber: savedData.faxNumber || "",
        municipality: savedData.municipality || "",
        province: savedData.province || "",
        postalCode: savedData.postalCode || "",
        serveDate: savedData.serveDate || "",
        serveMethod: savedData.serveMethod || "",
        email: savedData.email || "",
        representativeName: savedData.representativeName || "",
        terminationDate: savedData.terminationDate || ""
      }
    }

    return {
      landlordName: "",
      landlordPhoneNumber: "",
      tenantNames: [""],
      rentalAddress: "",
      rentalPeriods: [{
        rentDueDate: "",
        fromDate: "",
        toDate: "",
        lawfulRent: "",
        paidRent: "",
        rentOwing: 0
      }],
      totalLawfulRent: "",
      totalPaidRent: "",
      whoAreYou: "landlord",
      name: "",
      representativePhoneNumber: "",
      lsucNumber: "",
      companyName: "",
      mailingAddress: "",
      phoneNumber: "",
      faxNumber: "",
      municipality: "",
      province: "",
      postalCode: "",
      serveDate: "",
      serveMethod: "",
      email: "",
      representativeName: "",
      terminationDate: ""
    }
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: getInitialFormData()
  })

  const { watch, setValue, getValues, formState: { errors } } = form
  const formData = watch()

  // Update validation state whenever form data or errors change
  useEffect(() => {
    const isValid = !hasValidationErrors(currentStep)
    setIsStepValid(isValid)
  }, [formData, errors, rentalPeriodErrors, currentStep])

  // Save form data whenever it changes
  useEffect(() => {
    if (isInitialized) {
      saveFormData(formData)
    }
  }, [formData, isInitialized, saveFormData])

  // Show toast when returning from cancelled checkout
  useEffect(() => {
    if (isReturningFromCheckout && isInitialized) {
      toast({
        title: "Checkout Cancelled",
        description: "Your form data has been restored. You can continue from where you left off.",
        variant: "default",
      })
    }
  }, [isReturningFromCheckout, isInitialized, toast])

  // Show toast when returning from successful payment
  useEffect(() => {
    if (isReturningFromSuccessfulPayment && isInitialized) {
      toast({
        title: "Payment Successful",
        description: "Your form has been completed and PDF downloaded. Starting fresh form.",
        variant: "default",
      })
    }
  }, [isReturningFromSuccessfulPayment, isInitialized, toast])

  const updateFormData = (field: keyof FormData, value: any) => {
    setValue(field, value)
  }


  const validateAmount = (value: string) => {
    // Allow only whole numbers (no decimals), maximum 6 digits
    const cleaned = value.replace(/[^0-9]/g, '')
    // Limit to 6 digits
    if (cleaned.length > 6) {
      return cleaned.substring(0, 6)
    }
    return cleaned
  }

  

  const validatePostalCode = (value: string) => {
    // Allow only letters and numbers for Canadian postal code, maximum 7 characters
    return value.replace(/[^A-Za-z0-9\s]/g, '').toUpperCase().substring(0, 7)
  }

  const addTenant = () => {
    const currentTenants = getValues("tenantNames")
    if (currentTenants.length < 3) {
      setValue("tenantNames", [...currentTenants, ""])
      // Clear any existing tenant validation errors when adding a new tenant
      // form.clearErrors("tenantNames")
    }
  }

  const removeTenant = (index: number) => {
    const currentTenants = getValues("tenantNames")
    if (currentTenants.length > 1) {
      const updatedTenants = currentTenants.filter((_, i) => i !== index)
      setValue("tenantNames", updatedTenants)

      // Clear validation errors for the removed tenant field
      form.clearErrors(`tenantNames.${index}`)

      // Clear validation errors for all tenant fields and re-trigger validation
      form.clearErrors("tenantNames")
      // form.trigger("tenantNames")
    }
  }

  const updateTenantName = (index: number, value: string) => {
    const currentTenants = getValues("tenantNames")
    const updatedTenants = currentTenants.map((name, i) => i === index ? value : name)
    setValue("tenantNames", updatedTenants)
  }

  const addRentalPeriod = () => {
    const currentPeriods = getValues("rentalPeriods")
    setValue("rentalPeriods", [...currentPeriods, {
      rentDueDate: "",
      fromDate: "",
      toDate: "",
      lawfulRent: "",
      paidRent: "",
      rentOwing: 0
    }])
    // Clear any existing errors when adding a new period
    setRentalPeriodErrors({})
  }

  const removeRentalPeriod = (index: number) => {
    const currentPeriods = getValues("rentalPeriods")
    if (currentPeriods.length > 1) {
      const updatedPeriods = currentPeriods.filter((_, i) => i !== index)
      setValue("rentalPeriods", updatedPeriods)

      // Recalculate totals
      const totalLawfulRent = updatedPeriods.reduce((sum, period) =>
        sum + (parseFloat(period.lawfulRent) || 0), 0
      ).toString()

      const totalPaidRent = updatedPeriods.reduce((sum, period) =>
        sum + (parseFloat(period.paidRent) || 0), 0
      ).toString()

      setValue("totalLawfulRent", totalLawfulRent)
      setValue("totalPaidRent", totalPaidRent)

      // Clear form validation errors for the removed period
      form.clearErrors(`rentalPeriods.${index}`)
      
      // Clear and shift rental period errors
      setRentalPeriodErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[index]
        // Shift error indices for periods after the removed one
        const shiftedErrors: { [key: number]: { lawfulRent?: string; paidRent?: string } } = {}
        Object.keys(newErrors).forEach(key => {
          const errorIndex = parseInt(key)
          if (errorIndex > index) {
            shiftedErrors[errorIndex - 1] = newErrors[errorIndex]
          } else if (errorIndex < index) {
            shiftedErrors[errorIndex] = newErrors[errorIndex]
          }
        })
        return shiftedErrors
      })

      // Re-trigger validation for rental periods to update form state
      form.trigger("rentalPeriods")
    }
  }

  const updateRentalPeriod = (index: number, field: string, value: string) => {
    const currentPeriods = getValues("rentalPeriods")
    const newRentalPeriods = currentPeriods.map((period, i) => {
      if (i === index) {
        const updatedPeriod = { ...period, [field]: value }

        // If rentDueDate is being updated, calculate fromDate and toDate
        if (field === 'rentDueDate' && value) {
          // Parse ISO date format (YYYY-MM-DD) from HTML5 date input
          const fromDateObj = parseISODate(value)
          const selectedDay = fromDateObj.getDate()
          
          let toDateObj: Date
          
          // If selected date is 1st, toDate should be last day of the same month
          if (selectedDay === 1) {
            toDateObj = new Date(fromDateObj.getFullYear(), fromDateObj.getMonth() + 1, 0)
          } else {
            // Calculate next month
            toDateObj = new Date(fromDateObj.getFullYear(), fromDateObj.getMonth() + 1, selectedDay - 1)
            
            // Check if the date rolled over (means the day doesn't exist in that month)
            // For example: Jan 31 → Feb 31 doesn't exist, so it rolls to March
            const expectedMonth = (fromDateObj.getMonth() + 1) % 12
            if (toDateObj.getMonth() !== expectedMonth) {
              // Get the last day of the expected month
              toDateObj = new Date(fromDateObj.getFullYear(), fromDateObj.getMonth() + 2, 0)
            }
          }

          // Format dates as dd/mm/yyyy
          const formatDate = (date: Date) => {
            const day = date.getDate().toString().padStart(2, '0')
            const month = (date.getMonth() + 1).toString().padStart(2, '0')
            const year = date.getFullYear()
            return `${day}/${month}/${year}`
          }

          updatedPeriod.fromDate = formatDate(fromDateObj)
          updatedPeriod.toDate = formatDate(toDateObj)
        }

        // If rentDueDate is being updated, clear subsequent periods' dates to maintain chronological order
        if (field === 'rentDueDate' && value) {
          // Clear dates for all subsequent periods to prevent invalid date selections
          for (let j = index + 1; j < currentPeriods.length; j++) {
            if (currentPeriods[j].rentDueDate) {
              // Clear the date for subsequent periods
              const subsequentPeriod = currentPeriods[j]
              subsequentPeriod.rentDueDate = ""
              subsequentPeriod.fromDate = ""
              subsequentPeriod.toDate = ""
            }
          }
        }

        // Validate that paid rent cannot exceed lawful rent
        if (field === 'paidRent' && value) {
          const lawfulRent = parseFloat(period.lawfulRent) || 0
          const paidRent = parseFloat(value) || 0
          if (paidRent > lawfulRent) {
            // Set error message on paid rent field and don't update the value
            setRentalPeriodErrors(prev => ({
              ...prev,
              [index]: {
                ...prev[index],
                paidRent: 'Paid rent cannot exceed lawful rent. Please enter a valid amount.'
              }
            }))
            return period // Return original period without updating
          } else {
            // Clear paid rent error if validation passes
            setRentalPeriodErrors(prev => {
              const newErrors = { ...prev }
              if (newErrors[index]) {
                delete newErrors[index].paidRent
                // If no errors left for this period, remove the entire entry
                if (Object.keys(newErrors[index]).length === 0) {
                  delete newErrors[index]
                }
              }
              return newErrors
            })
          }
        }

        // If lawful rent is being updated, validate that existing paid rent doesn't exceed it
        if (field === 'lawfulRent' && value) {
          const lawfulRent = parseFloat(value) || 0
          const paidRent = parseFloat(period.paidRent) || 0
          if (paidRent > lawfulRent) {
            // Set error message on lawful rent field and don't update the value
            setRentalPeriodErrors(prev => ({
              ...prev,
              [index]: {
                ...prev[index],
                lawfulRent: 'Cannot reduce lawful rent below current paid rent amount. Please adjust paid rent first.'
              }
            }))
            return period // Return original period without updating
          } else {
            // Clear lawful rent error if validation passes
            setRentalPeriodErrors(prev => {
              const newErrors = { ...prev }
              if (newErrors[index]) {
                delete newErrors[index].lawfulRent
                // If no errors left for this period, remove the entire entry
                if (Object.keys(newErrors[index]).length === 0) {
                  delete newErrors[index]
                }
              }
              return newErrors
            })
          }
        }

        return updatedPeriod
      }
      return period
    })

    // Calculate totals
    const totalLawfulRent = newRentalPeriods.reduce((sum, period) =>
      sum + (parseFloat(period.lawfulRent) || 0), 0
    ).toString()

    const totalPaidRent = newRentalPeriods.reduce((sum, period) =>
      sum + (parseFloat(period.paidRent) || 0), 0
    ).toString()

    setValue("rentalPeriods", newRentalPeriods)
    setValue("totalLawfulRent", totalLawfulRent)
    setValue("totalPaidRent", totalPaidRent)

    // When user selects a rent due date, check if that creates a gap with the previous period and prompt for skipped month(s)
    if (field === "rentDueDate" && value) {
      const skipped = getSkippedMonths(newRentalPeriods)
      if (skipped.length > 0) {
        setSkippedMonthsQueue(skipped)
      }
    }
  }

  const calculateRentOwing = (lawfulRent: string, paidRent: string) => {
    const lawful = parseFloat(lawfulRent) || 0
    const paid = parseFloat(paidRent) || 0
    return Math.max(0, lawful - paid)
  }

  // Helper function to calculate minimum date for a rental period
  const getMinDateForPeriod = (currentIndex: number): string => {
    if (currentIndex === 0) return ""; // First period has no restrictions
    
    const previousPeriod = formData.rentalPeriods[currentIndex - 1];
    if (!previousPeriod.rentDueDate) return "";
    
    // Set minimum date to the day after the previous period's date
    const prevDate = parseISODate(previousPeriod.rentDueDate);
    const minDate = new Date(prevDate);
    minDate.setDate(minDate.getDate() + 1);
    
    // Format as YYYY-MM-DD without timezone issues
    const year = minDate.getFullYear();
    const month = (minDate.getMonth() + 1).toString().padStart(2, '0');
    const day = minDate.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const clearRentalPeriodErrors = () => {
    setRentalPeriodErrors({})
  }

  // Returns skipped months between consecutive rental periods (periods must have rentDueDate set)
  const getSkippedMonths = (periods: FormData["rentalPeriods"]): SkippedMonth[] => {
    const skipped: SkippedMonth[] = []
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    for (let i = 0; i < periods.length - 1; i++) {
      const prev = periods[i]
      const next = periods[i + 1]
      if (!prev.rentDueDate || !next.rentDueDate) continue
      const prevDate = parseISODate(prev.rentDueDate)
      const nextDate = parseISODate(next.rentDueDate)
      const prevMonth = prevDate.getMonth()
      const prevYear = prevDate.getFullYear()
      const nextMonth = nextDate.getMonth()
      const nextYear = nextDate.getFullYear()
      const prevMonthsSinceEpoch = prevYear * 12 + prevMonth
      const nextMonthsSinceEpoch = nextYear * 12 + nextMonth
      const gap = nextMonthsSinceEpoch - prevMonthsSinceEpoch
      if (gap <= 1) continue
      for (let m = 1; m < gap; m++) {
        const year = Math.floor((prevMonthsSinceEpoch + m) / 12)
        const month = (prevMonthsSinceEpoch + m) % 12
        skipped.push({
          monthName: monthNames[month],
          year,
          month,
          insertAfterIndex: i
        })
      }
    }
    return skipped
  }

  // Create a new rental period for the skipped month, following the same rent-due day pattern
  const createPeriodForMonth = (year: number, month: number, previousPeriod: FormData["rentalPeriods"][0]) => {
    const baseDay = previousPeriod?.rentDueDate ? parseISODate(previousPeriod.rentDueDate).getDate() : 1
    return createPeriodForMonthWithAmounts(year, month, previousPeriod.lawfulRent || "", "", baseDay)
  }

  // Create a new rental period for the given month with specified lawful and paid rent,
  // using the same rent-due day pattern (baseDay) as existing periods where possible
  const createPeriodForMonthWithAmounts = (
    year: number,
    month: number,
    lawfulRent: string,
    paidRent: string,
    baseDay?: number
  ): FormData["rentalPeriods"][0] => {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    const day = Math.min(baseDay ?? 1, lastDayOfMonth)
    const rentDueDate = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`

    const fromDateObj = parseISODate(rentDueDate)
    const selectedDay = fromDateObj.getDate()

    let toDateObj: Date
    if (selectedDay === 1) {
      // If rent is due on the 1st, cover the full month
      toDateObj = new Date(fromDateObj.getFullYear(), fromDateObj.getMonth() + 1, 0)
    } else {
      // Otherwise, end the period the day before the same day in the next month,
      // adjusting if that day doesn't exist in the next month
      toDateObj = new Date(fromDateObj.getFullYear(), fromDateObj.getMonth() + 1, selectedDay - 1)
      const expectedMonth = (fromDateObj.getMonth() + 1) % 12
      if (toDateObj.getMonth() !== expectedMonth) {
        toDateObj = new Date(fromDateObj.getFullYear(), fromDateObj.getMonth() + 2, 0)
      }
    }

    const formatDate = (date: Date) => {
      const d = date.getDate().toString().padStart(2, "0")
      const m = (date.getMonth() + 1).toString().padStart(2, "0")
      const y = date.getFullYear()
      return `${d}/${m}/${y}`
    }

    const lawful = parseFloat(lawfulRent) || 0
    const paid = parseFloat(paidRent) || 0

    return {
      rentDueDate,
      fromDate: formatDate(fromDateObj),
      toDate: formatDate(toDateObj),
      lawfulRent,
      paidRent,
      rentOwing: Math.max(0, lawful - paid)
    }
  }

  const insertRentalPeriodAt = (index: number, period: FormData["rentalPeriods"][0]) => {
    const currentPeriods = getValues("rentalPeriods")
    const newPeriods = [...currentPeriods.slice(0, index), period, ...currentPeriods.slice(index)]
    const totalLawfulRent = newPeriods.reduce((sum, p) => sum + (parseFloat(p.lawfulRent) || 0), 0).toString()
    const totalPaidRent = newPeriods.reduce((sum, p) => sum + (parseFloat(p.paidRent) || 0), 0).toString()
    setValue("rentalPeriods", newPeriods)
    setValue("totalLawfulRent", totalLawfulRent)
    setValue("totalPaidRent", totalPaidRent)
    setRentalPeriodErrors({})
  }

  const validateAllRentalPeriods = () => {
    const currentPeriods = getValues("rentalPeriods")
    const errors: { [key: number]: { lawfulRent?: string; paidRent?: string } } = {}

    currentPeriods.forEach((period, index) => {
      const lawfulRent = parseFloat(period.lawfulRent) || 0
      const paidRent = parseFloat(period.paidRent) || 0

      if (paidRent > lawfulRent) {
        errors[index] = {
          ...errors[index],
          paidRent: 'Paid rent cannot exceed lawful rent. Please enter a valid amount.'
        }
      }
    })

    setRentalPeriodErrors(errors)
    return Object.keys(errors).length === 0
  }

  const hasValidationErrors = (step: number): boolean => {
    const currentData = getValues()

    // Check basic step validation first
    if (!validateStep(step)) {
      return true
    }

    // Check for form validation errors only for fields relevant to the current step
    const formErrors = errors
    if (formErrors && Object.keys(formErrors).length > 0) {
      // Get fields that are relevant to the current step
      let relevantFields: string[] = []
      switch (step) {
        case 1:
          relevantFields = ['landlordName', 'tenantNames', 'rentalAddress']
          break
        case 2:
          relevantFields = ['rentalPeriods']
          break
        case 3:
          if (currentData.whoAreYou === "landlord") {
            relevantFields = ['phoneNumber']
          } else {
            relevantFields = ['name', 'lsucNumber', 'mailingAddress', 'phoneNumber', 'faxNumber', 'municipality', 'province', 'postalCode']
          }
          break
        case 4:
          relevantFields = ['serveDate', 'serveMethod', 'email']
          break
      }

      // Check if any errors exist for the relevant fields
      const hasRelevantErrors = relevantFields.some(field => {
        if (field === 'tenantNames') {
          // Check if there are any tenant validation errors for existing tenant fields
          if (formErrors.tenantNames) {
            const tenantErrors = formErrors.tenantNames
            // Only check for errors on existing tenant indices
            return currentData.tenantNames.some((_, index) => tenantErrors[index])
          }
          return false
        } else if (field === 'rentalPeriods') {
          return formErrors.rentalPeriods && Object.keys(formErrors.rentalPeriods).length > 0
        } else {
          return (formErrors as any)[field]
        }
      })

      if (hasRelevantErrors) {
        return true
      }
    }

    // Check for rental period errors on step 2
    if (step === 2) {
      const hasRentalPeriodErrors = Object.keys(rentalPeriodErrors).length > 0
      if (hasRentalPeriodErrors) {
        return true
      }

      // Also check if any rental period has paid rent > lawful rent
      const hasInvalidRentalPeriods = currentData.rentalPeriods.some(period => {
        const lawfulRent = parseFloat(period.lawfulRent) || 0
        const paidRent = parseFloat(period.paidRent) || 0
        return paidRent > lawfulRent
      })

      if (hasInvalidRentalPeriods) {
        return true
      }
    }

    return false
  }

  const totalRentOwing = formData.rentalPeriods.reduce((total, period) => {
    return total + calculateRentOwing(period.lawfulRent, period.paidRent)
  }, 0)

  const validateStep = (step: number): boolean => {
    const currentData = getValues()
    switch (step) {
      case 1:
        return currentData.landlordName.trim().length >= 3 &&
          currentData.tenantNames.every(name => name.trim().length >= 3) &&
          currentData.rentalAddress.trim().length >= 5
      case 2:
        return currentData.rentalPeriods.every(period =>
          period.rentDueDate !== "" &&
          period.lawfulRent !== "" &&
          period.paidRent !== "" &&
          parseFloat(period.lawfulRent) >= 0 &&
          parseFloat(period.paidRent) >= 0 &&
          parseFloat(period.paidRent) <= parseFloat(period.lawfulRent)
        )
      case 3:
        if (currentData.whoAreYou === "landlord") {
          return currentData.phoneNumber.trim() !== "" && currentData.phoneNumber.replace(/\D/g, '').length === 10
        } else {
          const faxNumberValid = !currentData.faxNumber || currentData.faxNumber.replace(/\D/g, '').length === 10
          return !!(currentData.name && currentData.name.trim().length >= 3) &&
            currentData.lsucNumber.trim() !== "" &&
            !!(currentData.mailingAddress && currentData.mailingAddress.trim().length >= 5) &&
            currentData.phoneNumber.trim() !== "" &&
            currentData.phoneNumber.replace(/\D/g, '').length === 10 &&
            faxNumberValid &&
            !!(currentData.municipality && currentData.municipality.trim().length >= 3) &&
            currentData.province !== "" &&
            currentData.postalCode.trim() !== ""
        }
      case 4:
        return currentData.serveDate !== "" &&
          currentData.serveMethod !== "" &&
          currentData.email.trim() !== "" &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentData.email)
      default:
        return false
    }
  }

  const nextStep = async () => {
    // Trim all text fields before validation
    const trimmedData = {
      ...formData,
      landlordName: formData.landlordName?.trim() || "",
      rentalAddress: formData.rentalAddress?.trim() || "",
      tenantNames: formData.tenantNames.map(name => name?.trim() || ""),
      name: formData.name?.trim() || "",
      companyName: formData.companyName?.trim() || "",
      mailingAddress: formData.mailingAddress?.trim() || "",
      municipality: formData.municipality?.trim() || "",
    }

    // Update form with trimmed data
    Object.keys(trimmedData).forEach(key => {
      if (key === 'tenantNames') {
        trimmedData.tenantNames.forEach((name, index) => {
          setValue(`tenantNames.${index}`, name)
        })
      } else {
        setValue(key as keyof FormData, trimmedData[key as keyof FormData])
      }
    })

    // First check if basic step validation passes
    if (!validateStep(currentStep) || currentStep >= 4) {
      return
    }

    // Get the fields that need to be validated for the current step
    let fieldsToValidate: (keyof FormData)[] = []

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['landlordName', 'tenantNames', 'rentalAddress']
        break
      case 2:
        fieldsToValidate = ['rentalPeriods']
        break
      case 3:
        if (formData.whoAreYou === "landlord") {
          fieldsToValidate = ['phoneNumber']
        } else {
          fieldsToValidate = ['name', 'lsucNumber', 'mailingAddress', 'phoneNumber', 'faxNumber', 'municipality', 'province', 'postalCode']
        }
        break
      case 4:
        fieldsToValidate = ['serveDate', 'serveMethod', 'email']
        break
    }

    // Trigger validation for the current step fields
    const isValid = await form.trigger(fieldsToValidate)

    // For step 2, also validate rental periods
    let rentalPeriodsValid = true
    if (currentStep === 2) {
      rentalPeriodsValid = validateAllRentalPeriods()
    }

    if (isValid && rentalPeriodsValid) {
      if (currentStep === 2) {
        const periods = getValues("rentalPeriods")
        const skipped = getSkippedMonths(periods)
        if (skipped.length > 0) {
          setSkippedMonthsQueue(skipped)
          return
        }
      }
      goToNextStep()
    }
  }

  const handleSkippedMonthNo = () => {
    if (skippedMonthsQueue.length === 0) return
    const first = skippedMonthsQueue[0]
    const periods = getValues("rentalPeriods")
    const previousPeriod = periods[first.insertAfterIndex]
    const baseDay = previousPeriod?.rentDueDate ? parseISODate(previousPeriod.rentDueDate).getDate() : 1
    const newPeriod = createPeriodForMonthWithAmounts(first.year, first.month, skippedMonthLawfulRent, "0", baseDay)
    insertRentalPeriodAt(first.insertAfterIndex + 1, newPeriod)
    setSkippedMonthLawfulRent("")
    setSkippedMonthPaidRent("")
    setSkippedMonthDialogStep("initial")
    const rest = skippedMonthsQueue.slice(1)
    setSkippedMonthsQueue(rest)
  }

  const handleSkippedMonthYes = () => {
    setSkippedMonthDialogStep("entering_pay")
  }

  const handleSkippedMonthSave = () => {
    if (skippedMonthsQueue.length === 0) return
    const first = skippedMonthsQueue[0]
    const periods = getValues("rentalPeriods")
    const previousPeriod = periods[first.insertAfterIndex]
    const baseDay = previousPeriod?.rentDueDate ? parseISODate(previousPeriod.rentDueDate).getDate() : 1
    const newPeriod = createPeriodForMonthWithAmounts(first.year, first.month, skippedMonthLawfulRent, skippedMonthPaidRent, baseDay)
    const newPeriods = [...periods.slice(0, first.insertAfterIndex + 1), newPeriod, ...periods.slice(first.insertAfterIndex + 1)]
    insertRentalPeriodAt(first.insertAfterIndex + 1, newPeriod)
    const nextSkipped = getSkippedMonths(newPeriods)
    setSkippedMonthLawfulRent("")
    setSkippedMonthPaidRent("")
    setSkippedMonthDialogStep("initial")
    setSkippedMonthsQueue(nextSkipped)
  }

  // Helper function to parse ISO date string (YYYY-MM-DD) to local Date object without timezone issues
  const parseISODate = (dateString: string): Date => {
    if (!dateString) return new Date();
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateString);
  };

  // Helper function to format ISO date (YYYY-MM-DD) to dd/mm/yyyy format
  const formatDateToDDMMYYYY = (dateString: string): string => {
    if (!dateString) return '';
    const date = parseISODate(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function to format phone number
  const formatPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return '';
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    // Format as (XXX)XXX-XXXX for 10 digits
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)})${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    // Return original if not 10 digits
    return phoneNumber;
  };

  // Helper function to get month name from date
  const getMonthNameFromDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = parseISODate(dateString);
    return date.toLocaleDateString('en-US', { month: 'long' });
  };

  const handlePayNow = async () => {
    // Validate only the fields relevant to the current step
    const fieldsToValidate = ['serveDate', 'serveMethod', 'email'] as const
    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) {
      setIsLoading(true)
      try {
        const currentData = getValues()

        // Process rental periods according to requirements
        let processedRentalPeriods = [...currentData.rentalPeriods]

        // If more than 2 periods, combine 3rd and beyond
        if (processedRentalPeriods.length > 2) {
          const firstPeriod = processedRentalPeriods[0]
          const secondPeriod = processedRentalPeriods[1]

          // Calculate totals for periods 3 and beyond
          const remainingPeriods = processedRentalPeriods.slice(2)
          const totalLawfulRentRemaining = remainingPeriods.reduce((sum, period) =>
            sum + (parseFloat(period.lawfulRent) || 0), 0
          )
          const totalPaidRentRemaining = remainingPeriods.reduce((sum, period) =>
            sum + (parseFloat(period.paidRent) || 0), 0
          )

          // Find the period with minimum (earliest) and maximum (latest) rentDueDate
          const minPeriod = remainingPeriods.reduce((min, period) => 
            parseISODate(period.rentDueDate) < parseISODate(min.rentDueDate) ? period : min
          )
          const maxPeriod = remainingPeriods.reduce((max, period) => 
            parseISODate(period.rentDueDate) > parseISODate(max.rentDueDate) ? period : max
          )

          // Create third period with combined data
          const thirdPeriod = {
            ...remainingPeriods[0], // Use first of remaining periods as base
            fromDate: minPeriod.fromDate, // fromDate of period with earliest date
            toDate: maxPeriod.toDate, // toDate of period with latest date
            lawfulRent: totalLawfulRentRemaining.toString(),
            paidRent: totalPaidRentRemaining.toString(),
            rentOwing: Math.max(0, totalLawfulRentRemaining - totalPaidRentRemaining)
          }

          // Keep only first 3 periods
          processedRentalPeriods = [firstPeriod, secondPeriod, thirdPeriod]
        }

        // Format all date fields to dd/mm/yyyy
        const formattedRentalPeriods = processedRentalPeriods.map(period => ({
          ...period,
          rentDueDate: formatDateToDDMMYYYY(period.rentDueDate)
        }));

        // Format ALL rental periods (not processed) for the new rental periods page
        const allRentalPeriods = currentData.rentalPeriods.map(period => ({
          ...period,
          fromDate: period.fromDate || '',
          toDate: period.toDate || '',
          lawfulRent: period.lawfulRent || '0',
          paidRent: period.paidRent || '0',
        }));

        // Calculate termination date
        const terminationDate = calculateTerminationDate()

        // Prepare form data based on whoAreYou selection
        let formDataWithProcessedPeriods: any = {
          // Common fields for both landlord and representative
          landlordName: currentData.landlordName,
          landlordPhoneNumber: currentData.landlordPhoneNumber,
          tenantNames: currentData.tenantNames,
          rentalAddress: currentData.rentalAddress,
          rentalPeriods: formattedRentalPeriods, // Processed periods for main form
          allRentalPeriods: allRentalPeriods, // All periods for the new rental periods page
          totalLawfulRent: currentData.totalLawfulRent,
          totalPaidRent: currentData.totalPaidRent,
          serveDate: formatDateToDDMMYYYY(currentData.serveDate),
          serveMethod: currentData.serveMethod,
          email: currentData.email,
          terminationDate: terminationDate,
          whoAreYou: currentData.whoAreYou
        }

        // Add fields based on whoAreYou selection
        if (currentData.whoAreYou === "landlord") {
          // Only include landlord fields
          formDataWithProcessedPeriods = {
            ...formDataWithProcessedPeriods,
            landlordPhoneNumber: formatPhoneNumber(currentData.phoneNumber),
            // Clear representative fields
            name: "",
            representativePhoneNumber: "",
            lsucNumber: "",
            companyName: "",
            mailingAddress: "",
            faxNumber: "",
            municipality: "",
            province: "",
            postalCode: "",
            representativeName: ""
          }
        } else {
          // Only include representative fields
          formDataWithProcessedPeriods = {
            ...formDataWithProcessedPeriods,
            name: currentData.name,
            representativePhoneNumber: formatPhoneNumber(currentData.phoneNumber),
            lsucNumber: currentData.lsucNumber,
            companyName: currentData.companyName,
            mailingAddress: currentData.mailingAddress,
            faxNumber: currentData.faxNumber,
            municipality: currentData.municipality,
            province: currentData.province,
            postalCode: currentData.postalCode,
            representativeName: currentData.name,
            // Clear landlord phone field
            landlordPhoneNumber: ""
          }
        }

        // Include N4 step 4 service option in saved data for email
        const serviceOption =
          serviceFiling && serviceRepresentation
            ? "both"
            : serviceRepresentation
              ? "representation"
              : serviceFiling
                ? "filing"
                : ""

        if (serviceOption) {
          formDataWithProcessedPeriods.serviceOption = serviceOption
        }

        // Store form data in session storage for later use
        sessionStorage.setItem('formData', JSON.stringify(formDataWithProcessedPeriods))
        sessionStorage.setItem('formId', 'n4')

        // Call checkout API
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            formId: 'n4',
            customerEmail: currentData.email,
            successUrl: `${window.location.origin}/download?success=true&formId=n4`,
            cancelUrl: `${window.location.origin}/n4?success=false&step=${currentStep}`,
            serviceOption
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.url) {
            // Clear saved data before redirecting to checkout
            clearSavedData()
            // Redirect to Stripe checkout
            window.location.href = data.url
          } else {
            toast({
              title: "Error",
              description: "No checkout URL received",
              variant: "destructive",
            })
          }
        } else {
          const errorData = await response.json()
          toast({
            title: "Error",
            description: errorData.error || 'Failed to create checkout session',
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error calling checkout API:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const prevStep = () => {
    goToPrevStep()
  }

  const renderStep1 = () => (
    <div className="max-w-5xl xl:max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center mb-4 rounded-full">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 rounded-full h-10 w-10 text-formStepsColor hover:text-btnBgPrimary bg-[#F9FAFB] p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-formStepsColor mb-2">Step 1/4 : Tenant Information</h1>
      </div>

      <div className="space-y-6">
        <FormField
          control={form.control}
          name="landlordName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-normal text-formStepsColor">
                What's your Landlord Name ?<span className="text-btnBgPrimary">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Enter landlord name"
                  className="mt-2 border-inputBorder"
                  {...field}
                  onBlur={() => {
                    field.onBlur()
                    form.trigger('landlordName')
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tenantNames.0"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-normal text-formStepsColor">
                What's your Tenant's Name ?<span className="text-btnBgPrimary">*</span>
              </FormLabel>
              <span className="text-xs text-gray-500 block">
                (If there's more than one tenant, separate each tenant's name with a comma.)
              </span>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Enter tenant name"
                  className="mt-2 border-inputBorder"
                  // maxLength={80}
                  {...field}
                  onChange={(e) => {
                    updateTenantName(0, e.target.value)
                    form.trigger("tenantNames.0")
                  }}
                  onBlur={() => {
                    field.onBlur()
                    form.trigger("tenantNames.0")
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rentalAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-normal text-formStepsColor">
                What's your Rental Address ?<span className="text-btnBgPrimary">*</span>
                <span className="text-xs text-gray-500 block mt-1">Include the unit number (e.g., upper or lower).</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter complete rental address (unit number)"
                  className="mt-2 border-inputBorder"
                  rows={3}
                  {...field}
                  onBlur={() => {
                    field.onBlur()
                    form.trigger('rentalAddress')
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-end mt-8">
        <Button
          onClick={() => nextStep()}
          disabled={!isStepValid}
          className="font-normal text-sm p-[10px] h-[40px] w-[129px] bg-btnBgPrimary text-white hover:bg-btnBgPrimary hover:text-white disabled:bg-gray-400 rounded-[5px]"
        >
          Next
        </Button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="max-w-5xl xl:max-w-6xl mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-formStepsColor mb-2">Step 2/4: Rent Details</h1>
        <Button
          type="button"
          onClick={addRentalPeriod}
          className="p-[10px] px-4 font-normal text-sm rounded-[5px] bg-btnBgPrimary text-white hover:text-white hover:bg-btnBgPrimary"
        >
          Add Rental Period
        </Button>
      </div>

      <div className="space-y-6">
        {formData.rentalPeriods.map((period, index) => (
          <div key={index} className="relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-formStepsColor font-semibold">Rental Period {index + 1}</h3>
              {formData.rentalPeriods.length > 1 && index > 0 && (
                <Button
                  type="button"
                  onClick={() => removeRentalPeriod(index)}
                  className="p-2 !h-8 !w-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                  title="Remove this rental period"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name={`rentalPeriods.${index}.rentDueDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-normal text-formStepsColor">
                      From what day in the month is rent due?<span className="text-btnBgPrimary">*</span>
                      {/* {index > 0 && (
                        <span className="text-xs text-gray-500 block mt-1">
                          Must be after the previous period's date
                        </span>
                      )} */}
                    </FormLabel>
                    <FormControl>
                      <div className="relative mt-2">
                        <Input
                          type="date"
                          className="border-inputBorder [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          value={field.value || ""}
                          // min={getMinDateForPeriod(index)}
                          onChange={(e) => {
                            field.onChange(e.target.value)
                            updateRentalPeriod(index, "rentDueDate", e.target.value)
                          }}
                          onBlur={() => {
                            field.onBlur()
                            form.trigger(`rentalPeriods.${index}.rentDueDate`)
                          }}
                          style={{
                            color: 'transparent',
                            caretColor: 'transparent'
                          }}
                        />
                        <div className="absolute inset-0 pointer-events-none flex items-center px-3">
                          <span className="text-sm">
                            {field.value ? <span className="">{formatDateToDDMMYYYY(field.value)}</span> : <span className="text-[#949494]">dd/mm/yyyy</span>}
                          </span>
                        </div>
                        <Calendar className="absolute right-3 top-3 h-4 w-4 !text-formStepsColor pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name={`rentalPeriods.${index}.lawfulRent`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-normal text-formStepsColor">
                        How much is the lawful monthly rent? ($)<span className="text-btnBgPrimary">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter amount"
                          className={`mt-2 border-inputBorder ${rentalPeriodErrors[index]?.lawfulRent ? 'border-red-500' : ''}`}
                          value={field.value}
                          onChange={(e) => {
                            const validatedValue = validateAmount(e.target.value)
                            field.onChange(validatedValue)
                            updateRentalPeriod(index, "lawfulRent", validatedValue)
                          }}
                          onKeyDown={(e) => {
                            // Prevent decimal point, comma, and other non-numeric characters
                            if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                              e.preventDefault()
                            }
                          }}
                          onBlur={() => {
                            field.onBlur()
                            form.trigger(`rentalPeriods.${index}.lawfulRent`)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      {rentalPeriodErrors[index]?.lawfulRent && (
                        <p className="text-red-500 text-sm mt-1">{rentalPeriodErrors[index].lawfulRent}</p>
                      )}
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name={`rentalPeriods.${index}.paidRent`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-normal text-formStepsColor">
                        How much did your tenant pay for rent in the month selected above: {period.rentDueDate && getMonthNameFromDate(period.rentDueDate)}? ($)<span className="text-btnBgPrimary">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter amount"
                          className={`mt-2 border-inputBorder ${rentalPeriodErrors[index]?.paidRent ? 'border-red-500' : ''}`}
                          value={field.value}
                          onChange={(e) => {
                            const validatedValue = validateAmount(e.target.value)
                            field.onChange(validatedValue)
                            updateRentalPeriod(index, "paidRent", validatedValue)
                          }}
                          onKeyDown={(e) => {
                            // Prevent decimal point, comma, and other non-numeric characters
                            if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                              e.preventDefault()
                            }
                          }}
                          onBlur={() => {
                            field.onBlur()
                            form.trigger(`rentalPeriods.${index}.paidRent`)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      {rentalPeriodErrors[index]?.paidRent && (
                        <p className="text-red-500 text-sm mt-1">{rentalPeriodErrors[index].paidRent}</p>
                      )}
                    </FormItem>
                  )}
                />
              </div>
              <div className="bg-[#FAFAFA] p-4 rounded-md flex items-center">
                <div className="text-base font-normal text-formStepsColor">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-formStepsColor fill-formStepsColor stroke-white mr-2" />Rent Owing
                  </div>
                  <span className="text-lg font-normal text-formStepsColor">${calculateRentOwing(period.lawfulRent, period.paidRent)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          className="font-normal text-sm p-[10px] border-inputBorder !h-[40px] !w-[129px] bg-white text-formStepsColor disabled:bg-gray-400 rounded-[5px]"
        >
          Previous
        </Button>
        <Button
          onClick={() => nextStep()}
          disabled={!isStepValid}
          className="font-normal text-sm p-[10px] h-[40px] w-[129px] bg-btnBgPrimary text-white hover:bg-btnBgPrimary hover:text-white disabled:bg-gray-400 rounded-[5px]"
        >
          Next
        </Button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="max-w-5xl xl:max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-formStepsColor mb-2">Step 3/4 : Landlord / Legal Representative</h1>
      </div>

      <div className="space-y-6">
        <FormField
          control={form.control}
          name="whoAreYou"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-normal text-formStepsColor mb-4 block">
                Who are you?<span className="text-btnBgPrimary">*</span>
              </FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    // Clear dependent fields when switching options
                    if (value === "landlord") {
                      setValue("name", "")
                      setValue("representativePhoneNumber", "")
                      setValue("lsucNumber", "")
                      setValue("companyName", "")
                      setValue("mailingAddress", "")
                      setValue("faxNumber", "")
                      setValue("municipality", "")
                      setValue("province", "")
                      setValue("postalCode", "")
                      setValue("representativeName", "")
                      // Clear the shared phone field when switching to landlord
                      setValue("phoneNumber", "")
                      // Clear validation errors for legal representative fields
                      form.clearErrors("name")
                      form.clearErrors("lsucNumber")
                      form.clearErrors("mailingAddress")
                      form.clearErrors("phoneNumber")
                      form.clearErrors("faxNumber")
                      form.clearErrors("municipality")
                      form.clearErrors("province")
                      form.clearErrors("postalCode")
                    } else if (value === "legal") {
                      // Clear landlord phone field and the shared phone input when switching to legal representative
                      setValue("landlordPhoneNumber", "")
                      setValue("phoneNumber", "")
                      // Clear validation errors related to phone fields
                      form.clearErrors("phoneNumber")
                    }
                  }}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="landlord" id="landlord" />
                    <Label htmlFor="landlord" className="text-sm font-normal text-formStepsColor">Landlord</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="legal" id="legal" />
                    <Label htmlFor="legal" className="text-sm font-normal text-formStepsColor">Legal Representative</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {formData.whoAreYou === "landlord" ? (
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-formStepsColor">
                  What's your phone number?<span className="text-btnBgPrimary">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    className="mt-2 border-inputBorder"
                    {...field}
                    onChange={(e) => {
                      const validatedValue = validatePhoneNumber(e.target.value)
                      field.onChange(validatedValue)
                    }}
                    onBlur={() => {
                      field.onBlur()
                      form.trigger('phoneNumber')
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-normal text-formStepsColor">
                      Name<span className="text-btnBgPrimary">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter Full Name"
                        className="mt-2 border-inputBorder"
                        {...field}
                        onBlur={() => {
                          field.onBlur()
                          form.trigger('name')
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="lsucNumber"
              render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-sm font-normal text-formStepsColor">
                      LSUC #<span className="text-btnBgPrimary">*</span>
                    </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Law Society Number"
                      className="mt-2 border-inputBorder"
                      {...field}
                      onChange={(e) => {
                        const v = e.target.value
                        field.onChange(v.length > 6 ? v.slice(0, 6) : v)
                      }}
                      onBlur={() => {
                        field.onBlur()
                        form.trigger('lsucNumber')
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-normal text-formStepsColor">
                    Company Name (optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Company Name"
                      className="mt-2 border-inputBorder"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mailingAddress"
              render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-sm font-normal text-formStepsColor">
                      Mailing Address<span className="text-btnBgPrimary">*</span>
                    </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Full Mailing Address"
                      className="mt-2 border-inputBorder"
                      {...field}
                      onBlur={() => {
                        field.onBlur()
                        form.trigger('mailingAddress')
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-sm font-normal text-formStepsColor">
                      Phone Number<span className="text-btnBgPrimary">*</span>
                    </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      className="mt-2 border-inputBorder"
                      {...field}
                      onChange={(e) => {
                        const validatedValue = validatePhoneNumber(e.target.value)
                        field.onChange(validatedValue)
                      }}
                      onBlur={() => {
                        field.onBlur()
                        form.trigger('phoneNumber')
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="faxNumber"
              render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-sm font-normal text-formStepsColor">
                      Fax Number (optional)
                    </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="Enter your fax number"
                      className="mt-2 border-inputBorder"
                      {...field}
                      onChange={(e) => {
                        const validatedValue = validateFaxNumber(e.target.value)
                        field.onChange(validatedValue)
                      }}
                      onBlur={() => {
                        field.onBlur()
                        form.trigger('faxNumber')
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="municipality"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel className="text-sm font-normal text-formStepsColor">
                        Municipality (City/Town)<span className="text-btnBgPrimary">*</span>
                      </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="City or town"
                        className="mt-2 border-inputBorder"
                        {...field}
                        onBlur={() => {
                          field.onBlur()
                          form.trigger('municipality')
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel className="text-sm font-normal text-formStepsColor">
                        Province<span className="text-btnBgPrimary">*</span>
                      </FormLabel>
                    <FormControl>
                      <Select value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)
                          // Clear any validation errors when a value is selected
                          form.clearErrors('province')
                          // Trigger re-render to update termination date
                          // form.trigger(['serveDate', 'serveMethod', 'email'])
                        }}
                        onOpenChange={(open) => {

                          // Only trigger validation when the select is closed and no value is selected
                          if (!open && !field.value) {
                            field.onBlur()
                            form.trigger('province')
                          }
                        }}>
                        <SelectTrigger className="mt-2 border-inputBorder">
                          <SelectValue placeholder="Select Province" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ON">Ontario</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-normal text-formStepsColor">
                        Postal Code<span className="text-btnBgPrimary">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter postal Code"
                          className="mt-2 border-inputBorder"
                          {...field}
                          onChange={(e) => {
                            const validatedValue = validatePostalCode(e.target.value)
                            field.onChange(validatedValue)
                          }}
                          onBlur={() => {
                            field.onBlur()
                            form.trigger('postalCode')
                          }}
                          pattern="[A-Za-z][0-9][A-Za-z] [0-9][A-Za-z][0-9]"
                          title="Enter postal code in format: A1A 1A1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          className="font-normal text-sm p-[10px] border-inputBorder h-[40px] w-[129px] bg-white text-formStepsColor disabled:bg-gray-400 rounded-[5px]"
        >
          Previous
        </Button>
        <Button
          onClick={() => nextStep()}
          disabled={!isStepValid}
          className="font-normal text-sm p-[10px] h-[40px] w-[129px] bg-btnBgPrimary text-white hover:bg-btnBgPrimary hover:text-white disabled:bg-gray-400 rounded-[5px]"
        >
          Next
        </Button>
      </div>
    </div>
  )

  const calculateTerminationDate = () => {
    const currentData = getValues()
    if (!currentData.serveDate) return "Please select a serve date"

    const serveDate = parseISODate(currentData.serveDate)
    const terminationDate = new Date(serveDate)

    // Base notice period: 14 days
    terminationDate.setDate(terminationDate.getDate() + 14)

    // Add 5 more days if service method is mail, courier, or fax
    if (currentData.serveMethod === "sending_by_mail" || currentData.serveMethod === "sending_by_courier" || currentData.serveMethod === "sending_by_fax") {
      terminationDate.setDate(terminationDate.getDate() + 5)
    }

    // Format as dd/mm/yyyy
    const day = terminationDate.getDate().toString().padStart(2, '0')
    const month = (terminationDate.getMonth() + 1).toString().padStart(2, '0')
    const year = terminationDate.getFullYear()
    return `${day}/${month}/${year}`
  }

  const getTerminationDateForUI = () => {
    const currentData = getValues()
    if (!currentData.serveDate) return "Please select a serve date"

    const serveDate = parseISODate(currentData.serveDate)
    const terminationDate = new Date(serveDate)

    // Base notice period: 14 days
    terminationDate.setDate(terminationDate.getDate() + 14)

    // Add 5 more days if service method is mail, courier, or fax
    if (currentData.serveMethod === "sending_by_mail" || currentData.serveMethod === "sending_by_courier" || currentData.serveMethod === "sending_by_fax") {
      terminationDate.setDate(terminationDate.getDate() + 5)
    }

    // Format as "January 15, 2025" for UI display
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
    return terminationDate.toLocaleDateString('en-US', options)
  }

  const renderStep4 = () => (
    <div className="max-w-5xl xl:max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-formStepsColor mb-2">Step 4/4: Notice Serving Details</h1>
      </div>

      <div className="space-y-6">
        <FormField
          control={form.control}
          name="serveDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-normal text-formStepsColor">
                What date will you serve this notice?<span className="text-btnBgPrimary">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative mt-2">
                  <Input
                    type="date"
                    className="border-inputBorder [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    value={field.value || ""}
                    onChange={(e) => {
                      field.onChange(e.target.value)
                      // Trigger re-render to update termination date
                      // form.trigger(['serveDate', 'serveMethod', 'email'])
                    }}
                    onBlur={() => {
                      field.onBlur()
                      form.trigger('serveDate')
                    }}
                    style={{
                      color: 'transparent',
                      caretColor: 'transparent'
                    }}
                  />
                  <div className="absolute inset-0 pointer-events-none flex items-center px-3">
                    <span className="text-sm">
                      {field.value ? <span className="">{formatDateToDDMMYYYY(field.value)}</span> : <span className="text-[#949494]">dd/mm/yyyy</span>}
                    </span>
                  </div>
                  <Calendar className="absolute right-3 top-3 h-4 w-4 !text-formStepsColor pointer-events-none" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serveMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-normal text-formStepsColor">
                What method will you serve this notice?<span className="text-btnBgPrimary">*</span>
              </FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    // Clear any validation errors when a value is selected
                    form.clearErrors('serveMethod')
                    // Trigger re-render to update termination date
                    // form.trigger(['serveDate', 'serveMethod', 'email'])
                  }}
                  onOpenChange={(open) => {
                    // Only trigger validation when the select is closed and no value is selected
                    if (!open && !field.value) {
                      setTimeout(() => {
                        field.onBlur()
                        form.trigger('serveMethod')
                      }, 100)
                    }
                  }}
                >
                  <SelectTrigger
                    ref={serveMethodRef}
                    className="mt-2 border-inputBorder placeholder:text-formStepsColor"
                  >
                    <SelectValue placeholder="Select a method" className="border-inputBorder placeholder:text-formStepsColor" />
                  </SelectTrigger>
                  <SelectContent className="text-sm font-normal text-formStepsColor max-h-[300px] overflow-y-auto w-full max-w-[90vw] sm:max-w-none">
                    <SelectItem value="handing_to_person" className="whitespace-normal break-words text-left py-2 pl-8 pr-4 min-h-[auto]">handing the document(s) to the person(s).</SelectItem>
                    <SelectItem value="handing_to_employee" className="whitespace-normal break-words text-left py-2 pl-8 pr-4 min-h-[auto]">handing the document(s) to an authorized employee of the landlord.</SelectItem>
                    <SelectItem value="handing_to_adult" className="whitespace-normal break-words text-left py-2 pl-8 pr-4 min-h-[auto]">handing the document(s) to an adult person in the tenant's rental unit.</SelectItem>
                    <SelectItem value="leaving_in_mailbox" className="whitespace-normal break-words text-left py-2 pl-8 pr-4 min-h-[auto]">leaving the document(s) in the mailbox, or place where mail is normally delivered.</SelectItem>
                    <SelectItem value="placing_under_door" className="whitespace-normal break-words text-left py-2 pl-8 pr-4 min-h-[auto]">placing the document(s) under the door of the rental unit or through a mail slot in the door.</SelectItem>
                    <SelectItem value="sending_by_courier" className="whitespace-normal break-words text-left py-2 pl-8 pr-4 min-h-[auto]">sending the document(s) by courier to the person(s).</SelectItem>
                    <SelectItem value="sending_by_fax" className="whitespace-normal break-words text-left py-2 pl-8 pr-4 min-h-[auto]">sending the document(s) by fax to fax number.</SelectItem>
                    <SelectItem value="sending_by_mail" className="whitespace-normal break-words text-left py-2 pl-8 pr-4 min-h-[auto]">sending the document(s) by mail or Xpresspost to the last known address of the person(s),</SelectItem>
                    <SelectItem value="sending_by_email" className="whitespace-normal break-words text-left py-2 pl-8 pr-4 min-h-[auto]">Sending the document by email (if the landlord has consented to)</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-[#FAFAFA] p-4 rounded-md flex items-start">
          <AlertTriangle className="h-5 w-5 text-formStepsColor fill-formStepsColor stroke-white mr-2 mt-0.5" />
          <div>
            <p className="text-base font-normal text-formStepsColor">
              Calculated Termination Date: <br /><p className="text-lg font-normal text-formStepsColor">{getTerminationDateForUI()}</p>
            </p>
            <p className="text-sm text-formStepsColor mt-1">
              Based on service method and rent frequency
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-normal text-formStepsColor">
                What's your email? (Please enter your email address to continue. You won't be able to proceed to the payment step until your email is provided)<span className="text-btnBgPrimary">*</span>
              </FormLabel>
              <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="mt-2 border-inputBorder"
                    {...field}
                    onBlur={() => {
                      field.onBlur()
                      form.trigger('email')
                    }}
                  />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          className="font-normal text-sm p-[10px] border-inputBorder h-[40px] w-[129px] bg-white text-formStepsColor disabled:bg-gray-400 rounded-[5px]"
        >
          Previous
        </Button>
        <Button
          onClick={() => setServicesModalOpen(true)}
          disabled={!isStepValid || isLoading}
          className="font-normal text-sm p-[10px] h-[40px] w-[129px] bg-btnBgPrimary text-white hover:bg-btnBgPrimary hover:text-white disabled:bg-gray-400 rounded-[5px]"
        >
          {isLoading ? 'Processing...' : 'Pay Now'}
        </Button>
      </div>
    </div>
  )


  // Don't render until initialized to prevent hydration issues
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading form...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex justify-between items-center pr-5 sm:px-8">
        <Link href="/">
          <Image src="/images/logo.webp" className="sm:hidden w-[100px] h-[100px] object-contain" alt="LTB Logo" width={500} height={500} />
          <Image src="/images/logo.webp" className="hidden sm:block w-[170px] h-[170px] object-contain" alt="LTB Logo" width={500} height={500} />
        </Link>
        <div className="text-[#444444] text-base sm:text-2xl font-medium">
          Notice to End Tenancy for Non-<br />Payment of Rent (Form N4)
        </div>
      </div>

      {/* Form Content */}
      <Form {...form}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </Form>

      {/* Services modal (step 4 – before payment) */}
      {servicesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-5 border border-inputBorder">
            <h3 className="text-lg font-semibold text-formStepsColor">
              Would you like to use our services?
            </h3>
            {/* <p className="text-sm text-formStepsColor">
              Select any of the options below to add our services to your order.
            </p> */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="service-filing"
                  checked={serviceFiling}
                  onCheckedChange={(checked) => setServiceFiling(checked === true)}
                  className="border-inputBorder data-[state=checked]:bg-btnBgPrimary data-[state=checked]:border-btnBgPrimary"
                />
                <Label
                  htmlFor="service-filing"
                  className="text-sm font-normal text-formStepsColor cursor-pointer"
                >
                  Our service for filing the form for you.
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="service-representation"
                  checked={serviceRepresentation}
                  onCheckedChange={(checked) => setServiceRepresentation(checked === true)}
                  className="border-inputBorder data-[state=checked]:bg-btnBgPrimary data-[state=checked]:border-btnBgPrimary"
                />
                <Label
                  htmlFor="service-representation"
                  className="text-sm font-normal text-formStepsColor cursor-pointer"
                >
                  Our service for representing you.
                </Label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setServicesModalOpen(false)}
                className="font-normal text-sm p-[10px] h-[40px] border-inputBorder bg-white text-formStepsColor rounded-[5px] hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setServicesModalOpen(false)
                  handlePayNow()
                }}
                className="font-normal text-sm p-[10px] h-[40px] bg-btnBgPrimary text-white hover:bg-btnBgPrimary hover:text-white rounded-[5px]"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Skipped month prompt dialog */}
      {skippedMonthsQueue.length > 0 && (() => {
        const skipped = skippedMonthsQueue[0]
        const lawfulRentValid = skippedMonthLawfulRent.trim() !== "" && !isNaN(parseFloat(skippedMonthLawfulRent)) && parseFloat(skippedMonthLawfulRent) >= 0
        const paidRentValid = skippedMonthPaidRent.trim() !== "" && !isNaN(parseFloat(skippedMonthPaidRent)) && parseFloat(skippedMonthPaidRent) >= 0
        const paidWithinLawful = paidRentValid && lawfulRentValid && parseFloat(skippedMonthPaidRent) <= parseFloat(skippedMonthLawfulRent)
        const canEnableButtons = lawfulRentValid
        const canSave = skippedMonthDialogStep === "entering_pay" && paidRentValid && paidWithinLawful
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-4 relative">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-formStepsColor">
                  Skipped rental period
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-formStepsColor hover:bg-gray-100 hover:text-formStepsColor -mr-2"
                  onClick={() => {
                    setSkippedMonthsQueue([])
                    setSkippedMonthLawfulRent("")
                    setSkippedMonthPaidRent("")
                    setSkippedMonthDialogStep("initial")
                  }}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-formStepsColor">
                You have not added a rental period for <strong>{skipped.monthName} {skipped.year}</strong>. Did the tenant pay rent for that month?
              </p>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-normal text-formStepsColor">
                    How much is the lawful monthly rent for {skipped.monthName}? ($)<span className="text-btnBgPrimary">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter amount"
                    className="mt-2 border-inputBorder"
                    value={skippedMonthLawfulRent}
                    onChange={(e) => {
                      const v = validateAmount(e.target.value)
                      setSkippedMonthLawfulRent(v)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "." || e.key === "," || e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") e.preventDefault()
                    }}
                  />
                </div>
                {skippedMonthDialogStep === "entering_pay" && (
                  <div>
                    <Label className="text-sm font-normal text-formStepsColor">
                      How much did your tenant pay for rent in {skipped.monthName}? ($)<span className="text-btnBgPrimary">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="Enter amount"
                      className="mt-2 border-inputBorder"
                      value={skippedMonthPaidRent}
                      onChange={(e) => {
                        const v = validateAmount(e.target.value)
                        setSkippedMonthPaidRent(v)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "." || e.key === "," || e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") e.preventDefault()
                      }}
                    />
                    {paidRentValid && !paidWithinLawful && (
                      <p className="text-red-500 text-sm mt-1">Paid rent cannot exceed lawful rent.</p>
                    )}
                  </div>
                )}
              </div>
              {skippedMonthDialogStep === "initial" ? (
                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkippedMonthNo}
                    disabled={!canEnableButtons}
                    className="font-normal text-sm p-[10px] border-inputBorder bg-white text-formStepsColor rounded-[5px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    No, they didn&apos;t pay
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSkippedMonthYes}
                    disabled={!canEnableButtons}
                    className="font-normal text-sm p-[10px] bg-btnBgPrimary text-white hover:bg-btnBgPrimary rounded-[5px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Yes, add a period for {skipped.monthName}
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={handleSkippedMonthSave}
                    disabled={!canSave}
                    className="font-normal text-sm p-[10px] bg-btnBgPrimary text-white hover:bg-btnBgPrimary rounded-[5px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
