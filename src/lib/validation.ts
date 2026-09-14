import * as z from "zod"

// Validation schemas for different field types
export const nameValidation = z
  .string().trim()
  .min(1, "Name cannot be empty or contain only spaces")
  .min(3, "Name must be at least 3 characters")
  .max(30, "Name must not exceed 30 characters")

export const rentalAddressValidation = z
  .string().trim()
  .min(1, "Rental address cannot be empty or contain only spaces")
  .min(5, "Rental address must be at least 5 characters")
  .max(150, "Rental address must not exceed 150 characters")

export const companyNameValidation = z
  .string().trim()
  .min(1, "Company name cannot be empty or contain only spaces")
  .min(3, "Company name must be at least 3 characters")
  .max(50, "Company name must not exceed 50 characters")

export const mailingAddressValidation = z
  .string().trim()
  .min(1, "Mailing address cannot be empty or contain only spaces")
  .min(5, "Mailing address must be at least 5 characters")
  .max(60, "Mailing address must not exceed 60 characters")

export const municipalityValidation = z
  .string().trim()  
  .min(1, "Municipality cannot be empty or contain only spaces")
  .min(3, "Municipality must be at least 3 characters")
  .max(20, "Municipality must not exceed 20 characters")
export const emailValidation = z
  .string().trim()
  .min(1, "Email cannot be empty or contain only spaces")
  .email("Please enter a valid email address")

// Validation functions for input formatting
export const validatePhoneNumber = (value: string) => {
  // Allow only numbers, maximum 10 digits
  const cleaned = value.replace(/[^0-9]/g, '')
  return cleaned.substring(0, 10)
}

export const validateFaxNumber = (value: string) => {
  // Allow only numbers, maximum 10 digits
  const cleaned = value.replace(/[^0-9]/g, '')
  return cleaned.substring(0, 10)
}

export const validateAmount = (value: string) => {
  // Allow only numbers and one decimal point, maximum 6 digits before decimal
  const cleaned = value.replace(/[^0-9.]/g, '')
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    // If more than one decimal point, keep only the first one
    return parts[0] + '.' + parts.slice(1).join('')
  }
  // Limit to 6 digits before decimal point
  if (parts[0].length > 6) {
    return parts[0].substring(0, 6) + (parts[1] ? '.' + parts[1] : '')
  }
  return cleaned
}

export const validateLSUCNumber = (value: string) => {
  // Allow any characters; no length restriction
  return value
}

export const validatePostalCode = (value: string) => {
  // Allow only letters and numbers for Canadian postal code, maximum 7 characters
  return value.replace(/[^A-Za-z0-9\s]/g, '').toUpperCase().substring(0, 7)
}

// Helper function to validate tenant names array
// Each tenant name can be up to 80 characters long
export const validateTenantNames = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Tenant name cannot be empty or contain only spaces")
      .max(80, "Tenant name must not exceed 80 characters")
  )
  .min(1, "At least one tenant name is required and cannot be empty or contain only spaces")

// Helper function to validate optional fields with proper length constraints
export const optionalNameValidation = z
  .string().trim()
  .min(1, "Name cannot be empty or contain only spaces")
  .refine((val) => !val || (val.trim().length >= 3 && val.trim().length <= 30), {
    message: "Name must be between 3 and 30 characters and cannot contain only spaces"
  })

export const optionalCompanyNameValidation = z
  .string()
  .refine((val) => !val || (val.trim().length >= 3 && val.trim().length <= 50), {
    message: "Company name must be between 3 and 50 characters and cannot contain only spaces"
  })

export const optionalMailingAddressValidation = z
  .string().trim()
  .min(1, "Mailing address cannot be empty or contain only spaces")
  .refine((val) => !val || (val.trim().length >= 5 && val.trim().length <= 60), {
    message: "Mailing address must be between 5 and 60 characters and cannot contain only spaces"
  })

export const optionalMunicipalityValidation = z
  .string().trim()
  .min(1, "Municipality cannot be empty or contain only spaces")
  .refine((val) => !val || (val.trim().length >= 3 && val.trim().length <= 20), {
    message: "Municipality must be between 3 and 20 characters and cannot contain only spaces"
  })

export const optionalFaxNumberValidation = z
  .string()
  .refine((val) => !val || (val.replace(/\D/g, '').length === 10), {
    message: "Fax number must be exactly 10 digits when provided"
  })
