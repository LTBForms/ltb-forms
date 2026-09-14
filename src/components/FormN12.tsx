"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Plus, Calendar, AlertTriangle, ArrowLeft, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
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

  // Step 2: Reason for Termination
  selectedReasons: z.array(z.string()).min(1, "At least one reason must be selected"),
  intendedOccupant: z.array(z.string()),
  careServicesPerson: z.array(z.string()),

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
})

type FormData = z.infer<typeof formSchema>

export default function FormN12() {
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
    formId: 'n12',
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
        selectedReasons: savedData.selectedReasons || ["intend_to_move"],
        intendedOccupant: savedData.intendedOccupant || [],
        careServicesPerson: savedData.careServicesPerson || [],
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
      selectedReasons: ["intend_to_move"],
      intendedOccupant: [],
      careServicesPerson: [],
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
    let isValid = false
    
    if (currentStep === 2) {
      // Special handling for step 2
      isValid = isStep2Valid()
    } else {
      isValid = !hasValidationErrors(currentStep)
    }
    
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

  const handleIntendedOccupantChange = (personId: string, checked: boolean) => {
    const currentIntendedOccupant = getValues("intendedOccupant")
    const currentCareServicesPerson = getValues("careServicesPerson")
    
    const updatedIntendedOccupant = checked
      ? [...currentIntendedOccupant, personId]
      : currentIntendedOccupant.filter(id => id !== personId)
    
    setValue("intendedOccupant", updatedIntendedOccupant)
    // Clear care services person when selecting from intended occupant
    if (checked) {
      setValue("careServicesPerson", [])
    }
    
    // Update validation state immediately for step 2
    if (currentStep === 2) {
      const isValid = isStep2Valid()
      setIsStepValid(isValid)
    }
  }

  const handleCareServicesPersonChange = (personId: string, checked: boolean) => {
    const currentCareServicesPerson = getValues("careServicesPerson")
    const currentIntendedOccupant = getValues("intendedOccupant")
    
    const updatedCareServicesPerson = checked
      ? [...currentCareServicesPerson, personId]
      : currentCareServicesPerson.filter(id => id !== personId)
    
    setValue("careServicesPerson", updatedCareServicesPerson)
    // Clear intended occupant when selecting from care services person
    if (checked) {
      setValue("intendedOccupant", [])
    }
    
    // Update validation state immediately for step 2
    if (currentStep === 2) {
      const isValid = isStep2Valid()
      setIsStepValid(isValid)
    }
  }


  const validateStep = (step: number, data?: FormData): boolean => {
    const currentData = data || getValues()
    switch (step) {
      case 1:
        return currentData.landlordName.trim().length >= 3 &&
          currentData.tenantNames.every(name => name.trim().length >= 3) &&
          currentData.rentalAddress.trim().length >= 5
      case 2:
        // Check if a reason is selected and at least one person option is selected
        return currentData.selectedReasons.length > 0 && 
          (currentData.intendedOccupant.length > 0 || currentData.careServicesPerson.length > 0)
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
    if (!validateStep(step, currentData)) {
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
          relevantFields = ['selectedReasons', 'intendedOccupant', 'careServicesPerson']
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

  // Helper function to check if step 2 is valid
  const isStep2Valid = (): boolean => {
    const currentData = getValues()
    return currentData.selectedReasons.length > 0 && 
      (currentData.intendedOccupant.length > 0 || currentData.careServicesPerson.length > 0)
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
    if (!validateStep(currentStep, trimmedData) || currentStep >= 4) {
      return
    }

    // Get the fields that need to be validated for the current step
    let fieldsToValidate: (keyof FormData)[] = []
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['landlordName', 'tenantNames', 'rentalAddress']
        break
      case 2:
        fieldsToValidate = ['selectedReasons', 'intendedOccupant', 'careServicesPerson']
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
    // Format as (XXX) XXX-XXXX for 10 digits
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)})${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    // Return original if not 10 digits
    return phoneNumber;
  };

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
          selectedReasons: currentData.selectedReasons,
          intendedOccupant: currentData.intendedOccupant,
          careServicesPerson: currentData.careServicesPerson,
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
        sessionStorage.setItem('formId', 'n12')
        
        // Call checkout API
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            formId: 'n12',
            customerEmail: formData.email,
            successUrl: `${window.location.origin}/download?success=true&formId=n12`,
            cancelUrl: `${window.location.origin}/n12?success=false&step=${currentStep}`
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
        <h1 className="text-2xl font-bold text-formStepsColor mb-2">Step 1/4: Tenant Information</h1>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="landlordName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-formStepsColor">
                  What's your Landlord Name?<span className="text-btnBgPrimary">*</span>
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
                  What's your Tenant's Name?<span className="text-btnBgPrimary">*</span>
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
                  What's your Rental Address?<span className="text-btnBgPrimary">*</span>
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
        <h1 className="text-2xl font-bold text-formStepsColor mb-2">Step 2/4: Reason for Termination</h1>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="selectedReasons"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-formStepsColor mb-4 block">
                  What's the reason you are serving this notice?<span className="text-btnBgPrimary">*</span>
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value[0] || ""}
                    onValueChange={(value) => {
                      field.onChange([value])
                      // Clear dependent fields when switching reason options
                      setValue("intendedOccupant", [])
                      setValue("careServicesPerson", [])
                      
                      // Update validation state immediately for step 2
                      if (currentStep === 2) {
                        const isValid = isStep2Valid()
                        setIsStepValid(isValid)
                      }
                    }}
                    className="space-y-4"
                  >
                    {[
                      {
                        id: "intend_to_move",
                        text: "Reason 1: The following person intends to move into the rental unit and occupy it for at least one year"
                      },
                      {
                        id: "purchase_agreement",
                        text: "Reason 2: I have signed an Agreement of Purchase and Sale of the rental unit and the following person intends to move into the rental unit"
                      }
                    ].map((reason) => (
                      <div key={reason.id} className="flex items-start space-x-3">
                        <RadioGroupItem value={reason.id} id={reason.id} className="mt-1" />
                        <Label htmlFor={reason.id} className="text-sm font-normal text-formStepsColor leading-relaxed">
                          {reason.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />


          <div className="bg-white p-6 rounded-lg border">
            {/* <h3 className="text-sm text-formStepsColor font-semibold mb-4">The following person:</h3> */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {(formData.selectedReasons.includes("purchase_agreement") ? [
                { id: "purchaser", text: "The purchaser" },
                { id: "purchaser_spouse", text: "The purchaser's spouse" },
                { id: "purchaser_child", text: "The purchaser's child" },
                { id: "purchaser_spouse_child", text: "The purchaser's spouse's child" },
                { id: "purchaser_parent", text: "The purchaser's parent" },
                { id: "purchaser_spouse_parent", text: "The purchaser's spouse's parent" }
              ] : [
                { id: "me", text: "Me" },
                { id: "my_spouse", text: "My spouse" },
                { id: "my_child", text: "My child" },
                { id: "my_spouse_child", text: "My spouse's child" },
                { id: "my_parent", text: "My parent" },
                { id: "my_spouse_parent", text: "My spouse's parent" }
              ]).map((person) => (
                <div key={person.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={person.id}
                    checked={formData.intendedOccupant.includes(person.id)}
                    onCheckedChange={(checked) => handleIntendedOccupantChange(person.id, checked as boolean)}
                    disabled={formData.careServicesPerson.length > 0}
                  />
                  <Label htmlFor={person.id} className={`text-sm font-normal text-formStepsColor ${formData.careServicesPerson.length > 0 ? 'text-gray-400' : ''}`}>{person.text}</Label>
                </div>
              ))}
            </div>

            <h3 className="text-sm text-formStepsColor font-semibold mb-4">Or A person who provides or will provide care services to:</h3>
            <div className="grid grid-cols-2 gap-4">
              {(formData.selectedReasons.includes("purchase_agreement") ? [
                { id: "care_purchaser", text: "The purchaser" },
                { id: "care_purchaser_spouse", text: "The purchaser's spouse" },
                { id: "care_purchaser_child", text: "The purchaser's child" },
                { id: "care_purchaser_spouse_child", text: "The purchaser's spouse's child" },
                { id: "care_purchaser_parent", text: "The purchaser's parent" },
                { id: "care_purchaser_spouse_parent", text: "The purchaser's spouse's parent" }
              ] : [
                { id: "care_me", text: "Me" },
                { id: "care_my_spouse", text: "My spouse" },
                { id: "care_my_child", text: "My child" },
                { id: "care_my_spouse_child", text: "My spouse's child" },
                { id: "care_my_parent", text: "My parent" },
                { id: "care_my_spouse_parent", text: "My spouse's parent" }
              ]).map((person) => (
                <div key={person.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={person.id}
                    checked={formData.careServicesPerson.includes(person.id)}
                    onCheckedChange={(checked) => handleCareServicesPersonChange(person.id, checked as boolean)}
                    disabled={formData.intendedOccupant.length > 0}
                  />
                  <Label htmlFor={person.id} className={`text-sm font-normal text-formStepsColor ${formData.intendedOccupant.length > 0 ? 'text-gray-400' : ''}`}>{person.text}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            className="font-normal text-sm p-[10px] border-inputBorder h-[40px] w-[129px] bg-white text-formStepsColor disabled:bg-gray-400 rounded-[5px]"
            onClick={prevStep}
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
        <h1 className="text-2xl font-bold text-formStepsColor mb-2">Step 3/4: Landlord / Legal Representative</h1>
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
                          }}
                          onOpenChange={(open) => {
                            // Only trigger validation when the select is closed and no value is selected
                            if (!open && !field.value) {
                              field.onBlur()
                              form.trigger('province')
                            }
                          }}>
                          <SelectTrigger className="mt-2">
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
            type="button"
            variant="outline"
            className="font-normal text-sm p-[10px] border-inputBorder h-[40px] w-[129px] bg-white text-formStepsColor disabled:bg-gray-400 rounded-[5px]"
            onClick={prevStep}
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

  const calculateTerminationDate = () => {
    const currentData = getValues()
    if (!currentData.serveDate) return "Please select a serve date"

    const serveDate = parseISODate(currentData.serveDate)
    // Create termination date starting from serveDate (using local date components)
    const terminationDate = new Date(serveDate.getFullYear(), serveDate.getMonth(), serveDate.getDate())

    // Always add exactly 60 days first
    terminationDate.setDate(terminationDate.getDate() + 60)

    // Only for mail/courier/fax: add 5 days, then align to same day
    if (
      currentData.serveMethod === "sending_by_mail" ||
      currentData.serveMethod === "sending_by_courier" ||
      currentData.serveMethod === "sending_by_fax"
    ) {
      terminationDate.setDate(terminationDate.getDate() + 5)
      const serveDay = serveDate.getDate()
      const terminationDay = terminationDate.getDate()
      const calculatedMonth = terminationDate.getMonth()
      const calculatedYear = terminationDate.getFullYear()
      if (terminationDay > serveDay) {
        const nextMonth = calculatedMonth + 1
        const nextYear = nextMonth > 11 ? calculatedYear + 1 : calculatedYear
        const actualNextMonth = nextMonth > 11 ? 0 : nextMonth
        terminationDate.setFullYear(nextYear, actualNextMonth, serveDay)
      } else {
        terminationDate.setFullYear(calculatedYear, calculatedMonth, serveDay)
      }
    }
    // For methods that don't add 5 days, just use the 60-day result as-is (no alignment)
    
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
    // Create termination date starting from serveDate (using local date components)
    const terminationDate = new Date(serveDate.getFullYear(), serveDate.getMonth(), serveDate.getDate())

    // Always add exactly 60 days first
    terminationDate.setDate(terminationDate.getDate() + 60)

    // Only for mail/courier/fax: add 5 days, then align to same day
    if (
      currentData.serveMethod === "sending_by_mail" ||
      currentData.serveMethod === "sending_by_courier" ||
      currentData.serveMethod === "sending_by_fax"
    ) {
      terminationDate.setDate(terminationDate.getDate() + 5)
      const serveDay = serveDate.getDate()
      const terminationDay = terminationDate.getDate()
      const calculatedMonth = terminationDate.getMonth()
      const calculatedYear = terminationDate.getFullYear()
      if (terminationDay > serveDay) {
        const nextMonth = calculatedMonth + 1
        const nextYear = nextMonth > 11 ? calculatedYear + 1 : calculatedYear
        const actualNextMonth = nextMonth > 11 ? 0 : nextMonth
        terminationDate.setFullYear(nextYear, actualNextMonth, serveDay)
      } else {
        terminationDate.setFullYear(calculatedYear, calculatedMonth, serveDay)
      }
    }
    // For methods that don't add 5 days, just use the 60-day result as-is (no alignment)

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
        <h1 className="text-2xl font-bold text-formStepsColor mb-2">Step 4/4: Service Method</h1>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="serveDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-formStepsColor">
                  What date do you plan on serving this notice? <span className="text-btnBgPrimary">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative mt-2 w-full">
                    <Input
                      type="date"
                      className="border-inputBorder [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e.target.value)
                        calculateTerminationDate()
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
                  By which method will you be serving this notice? <span className="text-btnBgPrimary">*</span>
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
                      <SelectValue placeholder="Select a method" className="border-inputBorder placeholder:text-formStepsColor"/>
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
          <Image src="/images/logo.png" className="sm:hidden w-[100px] h-[100px] object-contain" alt="LTB Logo" width={100} height={100} />
          <Image src="/images/logo.png" className="hidden sm:block w-[170px] h-[170px] object-contain" alt="LTB Logo" width={150} height={150} />
        </Link>
        <div className="text-[#444444] text-[13px] sm:text-2xl font-medium">
        Notice to End your Tenancy, Because<br /> the Landlord, a Purchaser or a Family<br /> Member Requires the Rental Unit<br /> (Form N12)
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
