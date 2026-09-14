"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Plus, Calendar, AlertTriangle, ArrowLeft, X } from "lucide-react"
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
const formSchema = z.object({
  // Step 1: Tenant Information
  landlordName: nameValidation,
  landlordPhoneNumber: z.string(),
  tenantNames: validateTenantNames,
  rentalAddress: rentalAddressValidation,

  // Step 2: Reason for Notice
  reasonForNotice: z.enum(["interference", "damage", "overcrowding"]),
  correctionPeriod: z.enum(["7days", "immediate"]),
  awarenessDate: z.string().trim().min(1, "Date is required"),
  incidentDetails: z.string().trim().min(1, "Incident details are required").min(5, "Incident details must be at least 5 characters").max(250, "Incident details must not exceed 250 characters"),
  damageAmount: z.string(),
  damageType: z.enum(["repair", "replace"]),
  peopleCount: z.string().regex(/^[1-9]\d?$/, "People count must be 1-2 digits only"),

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
  // Custom validation for damage reason with 7-day correction period
  if (data.reasonForNotice === "damage" && data.correctionPeriod === "7days") {
    return data.damageAmount && data.damageAmount.trim() !== ""
  }
  return true
}, {
  message: "Either cost to repair or cost to replace is required",
  path: ["damageAmount"]
}).refine((data) => {
  // Custom validation for overcrowding reason with 7-day correction period
  if (data.reasonForNotice === "overcrowding" && data.correctionPeriod === "7days") {
    return data.peopleCount && data.peopleCount.trim() !== ""
  }
  return true
}, {
  message: "People count is required for overcrowding reason with 7-day correction period",
  path: ["peopleCount"]
})

type FormData = z.infer<typeof formSchema>

export default function FormN5() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [isStepValid, setIsStepValid] = useState(false)
  const serveMethodRef = useRef<HTMLButtonElement>(null)

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
    formId: 'n5',
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
        reasonForNotice: savedData.reasonForNotice || "interference",
        correctionPeriod: savedData.correctionPeriod || "7days",
        awarenessDate: savedData.awarenessDate || "",
        incidentDetails: savedData.incidentDetails || "",
        damageAmount: savedData.damageAmount || "",
        damageType: savedData.damageType || "repair",
        peopleCount: savedData.peopleCount || "",
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
      reasonForNotice: "interference",
      correctionPeriod: "7days",
      awarenessDate: "",
      incidentDetails: "",
      damageAmount: "",
      damageType: "repair",
      peopleCount: "",
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

  const formData = form.watch()
  const { getValues, setValue, formState: { errors } } = form

  // Update validation state whenever form data or errors change
  useEffect(() => {
    const isValid = !hasValidationErrors(currentStep)
    setIsStepValid(isValid)
  }, [formData, errors, currentStep])

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
    return value.replace(/[^A-Za-z0-9\s]/g, '').toUpperCase().substring(0, 7)
  }

  const addTenant = () => {
    const currentTenants = getValues("tenantNames")
    if (currentTenants.length < 3) {
      form.setValue("tenantNames", [...currentTenants, ""])
      // Clear any existing tenant validation errors when adding a new tenant
      // form.clearErrors("tenantNames")
    }
  }

  const removeTenant = (index: number) => {
    const currentTenants = getValues("tenantNames")
    if (currentTenants.length > 1) {
      const updatedTenants = currentTenants.filter((_, i) => i !== index)
      form.setValue("tenantNames", updatedTenants)

      // Clear validation errors for the removed tenant field
      form.clearErrors(`tenantNames.${index}`)

      // Clear validation errors for all tenant fields and re-trigger validation
      form.clearErrors("tenantNames")
      // form.trigger("tenantNames")
    }
  }

  const validateStep = (step: number): boolean => {
    const currentData = getValues()
    switch (step) {
      case 1:
        return currentData.landlordName.trim().length >= 3 &&
          currentData.tenantNames.every(name => name.trim().length >= 3) &&
          currentData.rentalAddress.trim().length >= 5
      case 2:
        const baseValidation = currentData.awarenessDate !== "" && currentData.incidentDetails.trim() !== ""
        if (currentData.reasonForNotice === "damage" && currentData.correctionPeriod === "7days") {
          return baseValidation && currentData.damageAmount !== ""
        }
        if (currentData.reasonForNotice === "overcrowding" && currentData.correctionPeriod === "7days") {
          return baseValidation && currentData.peopleCount !== ""
        }
        return baseValidation
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

  const hasValidationErrors = (step: number): boolean => {
    const currentData = getValues()

    // Check basic step validation first
    if (!validateStep(step)) {
      return true
    }

    // Check for form validation errors only for fields relevant to the current step
    if (errors && Object.keys(errors).length > 0) {
      // Get fields that are relevant to the current step
      let relevantFields: string[] = []
      switch (step) {
        case 1:
          relevantFields = ['landlordName', 'tenantNames', 'rentalAddress']
          break
        case 2:
          relevantFields = ['reasonForNotice', 'correctionPeriod', 'awarenessDate', 'incidentDetails', 'damageAmount', 'peopleCount']
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
          if (errors.tenantNames) {
            const tenantErrors = errors.tenantNames
            // Only check for errors on existing tenant indices
            return currentData.tenantNames.some((_, index) => tenantErrors[index])
          }
          return false
        } else {
          return (errors as any)[field]
        }
      })

      if (hasRelevantErrors) {
        return true
      }
    }

    return false
  }

  const nextStep = async () => {
    // Trim all text fields before validation
    const trimmedData = {
      ...formData,
      landlordName: formData.landlordName?.trim() || "",
      rentalAddress: formData.rentalAddress?.trim() || "",
      tenantNames: formData.tenantNames.map(name => name?.trim() || ""),
      incidentDetails: formData.incidentDetails?.trim() || "",
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
        fieldsToValidate = ['reasonForNotice', 'correctionPeriod', 'awarenessDate', 'incidentDetails']
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

    if (isValid) {
      goToNextStep()
    }
  }

  // Helper function to format ISO date (YYYY-MM-DD) to dd/mm/yyyy format
  const formatDateToDDMMYYYY = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
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

  const calculateTerminationDate = () => {
    const serveDate = getValues("serveDate")
    const serveMethod = getValues("serveMethod")

    if (!serveDate) return "Please select a serve date"

    const serveDateObj = new Date(serveDate)
    const terminationDate = new Date(serveDateObj)

    // Base notice period: 14 days
    terminationDate.setDate(terminationDate.getDate() + 14)

    // Add 5 more days if service method is mail, courier, or fax
    if (serveMethod === "sending_by_mail" || serveMethod === "sending_by_courier" || serveMethod === "sending_by_fax") {
      terminationDate.setDate(terminationDate.getDate() + 5)
    }

    // Format as dd/mm/yyyy
    const day = terminationDate.getDate().toString().padStart(2, '0')
    const month = (terminationDate.getMonth() + 1).toString().padStart(2, '0')
    const year = terminationDate.getFullYear()
    return `${day}/${month}/${year}`
  }

  const getTerminationDateForUI = () => {
    const serveDate = getValues("serveDate")
    const serveMethod = getValues("serveMethod")

    if (!serveDate) return "Please select a serve date"

    const serveDateObj = new Date(serveDate)
    const terminationDate = new Date(serveDateObj)

    // Base notice period: 14 days
    terminationDate.setDate(terminationDate.getDate() + 14)

    // Add 5 more days if service method is mail, courier, or fax
    if (serveMethod === "sending_by_mail" || serveMethod === "sending_by_courier" || serveMethod === "sending_by_fax") {
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

  const handlePayNow = async () => {
    // Validate only the fields relevant to the current step
    const fieldsToValidate = ['serveDate', 'serveMethod', 'email'] as const
    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) {
      setIsLoading(true)
      try {
        const currentData = getValues()

        // Calculate termination date
        const terminationDate = calculateTerminationDate()

        // Prepare form data based on whoAreYou selection
        let formDataWithPhoneMapping: any = {
          // Common fields for both landlord and representative
          landlordName: currentData.landlordName,
          landlordPhoneNumber: currentData.landlordPhoneNumber,
          tenantNames: currentData.tenantNames,
          rentalAddress: currentData.rentalAddress,
          reasonForNotice: currentData.reasonForNotice,
          correctionPeriod: currentData.correctionPeriod,
          awarenessDate: formatDateToDDMMYYYY(currentData.awarenessDate),
          incidentDetails: currentData.incidentDetails,
          damageAmount: currentData.damageAmount,
          damageType: currentData.damageType,
          peopleCount: currentData.peopleCount,
          serveDate: formatDateToDDMMYYYY(currentData.serveDate),
          serveMethod: currentData.serveMethod,
          email: currentData.email,
          terminationDate: terminationDate,
          whoAreYou: currentData.whoAreYou
        }

        // Add fields based on whoAreYou selection
        if (currentData.whoAreYou === "landlord") {
          // Only include landlord fields
          formDataWithPhoneMapping = {
            ...formDataWithPhoneMapping,
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
          formDataWithPhoneMapping = {
            ...formDataWithPhoneMapping,
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

        // Store form data in session storage for later use
        sessionStorage.setItem('formData', JSON.stringify(formDataWithPhoneMapping))
        sessionStorage.setItem('formId', 'n5')

        // Call checkout API
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            formId: 'n5',
            customerEmail: currentData.email,
            successUrl: `${window.location.origin}/download?success=true&formId=n5`,
            cancelUrl: `${window.location.origin}/n5?success=false&step=${currentStep}`
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.url) {
            // Clear saved data before redirecting to checkout
            clearSavedData()
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

      <Form {...form}>
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

          <div>
            <Label className="text-sm font-normal text-formStepsColor">
              What's your Tenant's Name ?<span className="text-btnBgPrimary">*</span>
            </Label>
            {formData.tenantNames.map((name, index) => (
              <div key={index} className="relative mb-3">
                <FormField
                  control={form.control}
                  name={`tenantNames.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter tenant name"
                              className="mt-2 border-inputBorder"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value)
                                form.trigger(`tenantNames.${index}`)
                              }}
                              onBlur={() => {
                                field.onBlur()
                                form.trigger(`tenantNames.${index}`)
                              }}
                            />
                          </FormControl>
                        </div>
                        {index > 0 && (
                          <Button
                            type="button"
                            onClick={() => removeTenant(index)}
                            className="p-2 h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                            title="Remove this tenant"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
            <Button
              type="button"
              onClick={addTenant}
              disabled={formData.tenantNames.length >= 3}
              className="mt-2 p-[10px] px-4 font-normal text-sm rounded-[50px] bg-btnBgPrimary text-white hover:text-white hover:bg-btnBgPrimary disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              {formData.tenantNames.length >= 3 ? "Maximum 3 tenants allowed" : "Add Another Tenant"}
            </Button>
          </div>

          <FormField
            control={form.control}
            name="rentalAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-formStepsColor">
                  What's your Rental Address ?<span className="text-btnBgPrimary">*</span>
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
            type="button"
            onClick={() => nextStep()}
            disabled={!isStepValid}
            className="font-normal text-sm p-[10px] h-[40px] w-[129px] bg-btnBgPrimary text-white hover:bg-btnBgPrimary hover:text-white disabled:bg-gray-400 rounded-[5px]"
          >
            Next
          </Button>
        </div>
      </Form>
    </div>
  )

  const renderStep2 = () => (
    <div className="max-w-5xl xl:max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-formStepsColor mb-2">Step 2/4: Reason for Notice</h1>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="reasonForNotice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm !font-normal text-formStepsColor mb-4 block">
                  Select a reason for serving this notice<span className="text-btnBgPrimary">*</span>
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      // Clear dependent fields when switching reason options
                      setValue("damageAmount", "")
                      setValue("damageType", "repair")
                      setValue("peopleCount", "")
                      // Reset correction period to default when switching reasons
                      setValue("correctionPeriod", "7days")
                    }}
                    className="space-y-4"
                  >
                    {/* Reason 1: Interference */}
                    <div className="space-y-2">
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="interference" id="interference" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="interference" className="text-sm font-normal text-formStepsColor">
                            Reason 1: Your behaviour or the behaviour of someone visiting or living with you has substantially interfered with another tenant's or my:
                            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                              <li>reasonable enjoyment of the residential complex, and/or</li>
                              <li>lawful rights, privileges, or interests.</li>
                            </ul>
                            <span className="block mt-1">Also used for unpaid utilities.</span>
                          </Label>

                          {formData.reasonForNotice === "interference" && (
                            <FormField
                              control={form.control}
                              name="correctionPeriod"
                              render={({ field: correctionField }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="ml-6 mt-3 space-y-2">
                                      <RadioGroup
                                        value={correctionField.value}
                                        onValueChange={(value) => {
                                          correctionField.onChange(value)
                                          // Clear dependent fields when switching correction period for interference
                                          setValue("damageAmount", "")
                                          setValue("damageType", "repair")
                                          setValue("peopleCount", "")
                                        }}
                                        className="space-y-2"
                                      >
                                        <div className="flex items-start space-x-3">
                                          <RadioGroupItem value="7days" id="interference-7days" className="mt-1" />
                                          <Label htmlFor="interference-7days" className="text-sm font-normal text-formStepsColor">
                                            You have 7 days to stop the activities or correct the behaviour described on page 2 and avoid eviction. You will not have to move out if you correct the behaviour within 7 days after receiving this notice. However, if you do not correct the behaviour within 7 days, I can apply to the Board for an order to evict you.
                                          </Label>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                          <RadioGroupItem value="immediate" id="interference-immediate" className="mt-1" />
                                          <Label htmlFor="interference-immediate" className="text-sm font-normal text-formStepsColor">
                                            I can apply to the Board immediately for an order to evict you. This is your second Notice to End your Tenancy in the past 6 months for a reason with a 7-day correction period. You cannot void this notice, and I can apply to the Board for an order to evict you.
                                          </Label>
                                        </div>
                                      </RadioGroup>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reason 2: Damage */}
                    <div className="space-y-2">
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="damage" id="damage" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="damage" className="text-sm font-normal text-formStepsColor">
                            Reason 2: You or someone visiting or living with you has wilfully or negligently damaged the rental unit or the residential complex.
                          </Label>

                          {formData.reasonForNotice === "damage" && (
                            <FormField
                              control={form.control}
                              name="correctionPeriod"
                              render={({ field: correctionField }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="ml-6 mt-3 space-y-2">
                                      <RadioGroup
                                        value={correctionField.value}
                                        onValueChange={(value) => {
                                          correctionField.onChange(value)
                                          // Clear dependent fields when switching correction period for damage
                                          setValue("damageAmount", "")
                                          setValue("damageType", "repair")
                                          setValue("peopleCount", "")
                                        }}
                                        className="space-y-2"
                                      >
                                        <div className="flex items-start space-x-3">
                                          <RadioGroupItem value="7days" id="damage-7days" className="mt-1" />
                                          <Label htmlFor="damage-7days" className="text-sm font-normal text-formStepsColor">
                                            You have 7 days to correct the problem(s) described on page 2 and avoid eviction. You will not have to move out if you correct the problem(s) within 7 days after receiving this notice. However, if you do not correct the problem(s) within 7 days, I can apply to the Board for an order to evict you.
                                          </Label>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                          <RadioGroupItem value="immediate" id="damage-immediate" className="mt-1" />
                                          <Label htmlFor="damage-immediate" className="text-sm font-normal text-formStepsColor">
                                            I can apply to the Board immediately for an order to evict you. This is your second Notice to End your Tenancy in the past 6 months for a reason with a 7-day correction period. You cannot void this notice, and I can apply to the Board for an order to evict you.
                                          </Label>
                                        </div>
                                      </RadioGroup>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reason 3: Overcrowding */}
                    <div className="space-y-2">
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="overcrowding" id="overcrowding" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="overcrowding" className="text-sm font-normal text-formStepsColor">
                            Reason 3: There are more people living in your rental unit than is permitted by health, safety or housing standards.
                          </Label>

                          {formData.reasonForNotice === "overcrowding" && (
                            <FormField
                              control={form.control}
                              name="correctionPeriod"
                              render={({ field: correctionField }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="ml-6 mt-3 space-y-2">
                                      <RadioGroup
                                        value={correctionField.value}
                                        onValueChange={(value) => {
                                          correctionField.onChange(value)
                                          // Clear dependent fields when switching correction period for overcrowding
                                          setValue("damageAmount", "")
                                          setValue("damageType", "repair")
                                          setValue("peopleCount", "")
                                        }}
                                        className="space-y-2"
                                      >
                                        <div className="flex items-start space-x-3">
                                          <RadioGroupItem value="7days" id="overcrowding-7days" className="mt-1" />
                                          <Label htmlFor="overcrowding-7days" className="text-sm font-normal text-formStepsColor">
                                            You have 7 days to correct the problem(s) described on page 2 and avoid eviction. You will not have to move out if you correct the problem(s) within 7 days after receiving this notice. However, if you do not correct the problem(s) within 7 days, I can apply to the Board for an order to evict you.
                                          </Label>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                          <RadioGroupItem value="immediate" id="overcrowding-immediate" className="mt-1" />
                                          <Label htmlFor="overcrowding-immediate" className="text-sm font-normal text-formStepsColor">
                                            I can apply to the Board immediately for an order to evict you. This is your second Notice to End your Tenancy in the past 6 months for a reason with a 7-day correction period. You cannot void this notice, and I can apply to the Board for an order to evict you.
                                          </Label>
                                        </div>
                                      </RadioGroup>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Damage cost fields - only show for damage reason with 7-day correction period */}
          {formData.reasonForNotice === "damage" && formData.correctionPeriod === "7days" && (
            <div className="my-4 flex flex-col md:flex-row md:justify-between md:items-center">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="damageAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-normal text-formStepsColor">
                        Estimated cost to repair the damaged property? ($)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter amount"
                          value={formData.damageType === "repair" ? field.value : ""}
                          onChange={(e) => {
                            field.onChange(validateAmount(e.target.value))
                            form.setValue("damageType", "repair")
                          }}
                          onBlur={() => {
                            field.onBlur()
                            form.trigger("damageAmount")
                          }}
                          onKeyDown={(e) => {
                            // Prevent decimal point, comma, and other non-numeric characters
                            if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                              e.preventDefault()
                            }
                          }}
                          className="border-inputBorder"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="md:text-center text-sm text-formStepsColor w-24 my-2 md:my-0">OR</div>
              <div className="flex-1 space-0">
                <FormField
                  control={form.control}
                  name="damageAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-normal text-formStepsColor">
                        Estimated cost to replace the damaged property? ($)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter amount"
                          value={formData.damageType === "replace" ? field.value : ""}
                          onChange={(e) => {
                            field.onChange(validateAmount(e.target.value))
                            form.setValue("damageType", "replace")
                          }}
                          onBlur={() => {
                            field.onBlur()
                            form.trigger("damageAmount")
                          }}
                          onKeyDown={(e) => {
                            // Prevent decimal point, comma, and other non-numeric characters
                            if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                              e.preventDefault()
                            }
                          }}
                          className="border-inputBorder"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* People count field - only show for overcrowding reason with 7-day correction period */}
          {formData.reasonForNotice === "overcrowding" && formData.correctionPeriod === "7days" && (
            <FormField
              control={form.control}
              name="peopleCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-normal text-formStepsColor">
                    How many people does the law say should be living in the rental unit?
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      maxLength={2}
                      placeholder="Enter people count"
                      className="mt-2 border-inputBorder"
                      {...field}
                      onChange={(e) => {
                        // Only allow numbers and limit to 2 characters
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        if (value.length <= 2) {
                          field.onChange(value)
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="awarenessDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-formStepsColor">
                  What's the date?<span className="text-btnBgPrimary">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative mt-2">
                    <Input
                      type="date"
                      className="border-inputBorder [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e.target.value)
                      }}
                      onBlur={() => {
                        field.onBlur()
                        form.trigger('awarenessDate')
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
            name="incidentDetails"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-formStepsColor">
                  Please provide details about what happened:<span className="text-btnBgPrimary">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe incident or issue in detail"
                    className="mt-2 border-inputBorder"
                    rows={4}
                    {...field}
                    onBlur={() => {
                      field.onBlur()
                      form.trigger('incidentDetails')
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
            type="button"
            variant="outline"
            onClick={prevStep}
            className="font-normal text-sm p-[10px] border-inputBorder h-[40px] w-[129px] bg-white text-formStepsColor disabled:bg-gray-400 rounded-[5px]"
          >
            Previous
          </Button>
          <Button
            type="button"
            onClick={() => nextStep()}
            disabled={!isStepValid}
            className="font-normal text-sm p-[10px] h-[40px] w-[129px] bg-btnBgPrimary text-white hover:bg-btnBgPrimary hover:text-white disabled:bg-gray-400 rounded-[5px]"
          >
            Next
          </Button>
        </div>
      </Form>
    </div>
  )

  const renderStep3 = () => (
    <div className="max-w-5xl xl:max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-formStepsColor mb-2">Step 3/4 : Landlord / Legal Representative</h1>
      </div>

      <Form {...form}>
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
                      onChange={(e) => field.onChange(validatePhoneNumber(e.target.value))}
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
                        onChange={(e) => field.onChange(validatePhoneNumber(e.target.value))}
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
                        onChange={(e) => field.onChange(validateFaxNumber(e.target.value))}
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
                          onChange={(e) => field.onChange(validatePostalCode(e.target.value))}
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
            type="button"
            variant="outline"
            onClick={prevStep}
            className="font-normal text-sm p-[10px] border-inputBorder h-[40px] w-[129px] bg-white text-formStepsColor disabled:bg-gray-400 rounded-[5px]"
          >
            Previous
          </Button>
          <Button
            type="button"
            onClick={() => nextStep()}
            disabled={!isStepValid}
            className="font-normal text-sm p-[10px] h-[40px] w-[129px] bg-btnBgPrimary text-white hover:bg-btnBgPrimary hover:text-white disabled:bg-gray-400 rounded-[5px]"
          >
            Next
          </Button>
        </div>
      </Form>
    </div>
  )

  const renderStep4 = () => (
    <div className="max-w-5xl xl:max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-formStepsColor mb-2">Step 4/4: Service Details</h1>
      </div>

      <Form {...form}>
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
                      className="border-inputBorder placeholder:!text-[#949494] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e.target.value)
                        // // Trigger re-render to update termination date
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
              <p className="text-sm font-normal text-formStepsColor">
                Calculated Termination Date:
              </p>
              <p className="text-sm font-normal text-formStepsColor">
                {getTerminationDateForUI()}
              </p>
              <p className="text-xs text-gray-600 mt-1">
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
            type="button"
            variant="outline"
            onClick={prevStep}
            className="font-normal text-sm p-[10px] border-inputBorder h-[40px] w-[129px] bg-white text-formStepsColor disabled:bg-gray-400 rounded-[5px]"
          >
            Previous
          </Button>
          <Button
            type="button"
            onClick={handlePayNow}
            disabled={!isStepValid || isLoading}
            className="font-normal text-sm p-[10px] h-[40px] w-[129px] bg-btnBgPrimary text-white hover:bg-btnBgPrimary hover:text-white disabled:bg-gray-400 rounded-[5px]"
          >
            {isLoading ? 'Processing...' : 'Pay Now'}
          </Button>
        </div>
      </Form>
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
          <Image src="/images/logo.png" className="sm:hidden w-[100px] h-[100px] object-contain" alt="LTB Logo" width={500} height={500} />
          <Image src="/images/logo.png" className="hidden sm:block w-[170px] h-[170px] object-contain" alt="LTB Logo" width={500} height={500} />
        </Link>
        <div className="text-[#444444] text-[13px] sm:text-2xl font-medium">
          Notice to End Tenancy for Interference,<br /> Damage, or Overcrowding (Form N5)
        </div>
      </div>

      {/* Form Content */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}
    </div>
  )
}

