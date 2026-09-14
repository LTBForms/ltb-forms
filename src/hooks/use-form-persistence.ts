"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

interface FormPersistenceOptions {
  formId: string
  maxSteps: number
  onStepChange?: (step: number) => void
}

export function useFormPersistence({ formId, maxSteps, onStepChange }: FormPersistenceOptions) {
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [isInitialized, setIsInitialized] = useState(false)

  // Get step from URL parameters or session storage
  const getInitialStep = useCallback(() => {
    // First check URL parameters
    const stepFromUrl = searchParams.get('step')
    if (stepFromUrl) {
      const step = parseInt(stepFromUrl, 10)
      if (step >= 1 && step <= maxSteps) {
        return step
      }
    }

    // Then check session storage
    const savedStep = sessionStorage.getItem(`${formId}_currentStep`)
    if (savedStep) {
      const step = parseInt(savedStep, 10)
      if (step >= 1 && step <= maxSteps) {
        return step
      }
    }

    return 1
  }, [formId, maxSteps, searchParams])

  // Initialize step on mount
  useEffect(() => {
    if (!isInitialized) {
      const initialStep = getInitialStep()
      setCurrentStep(initialStep)
      setIsInitialized(true)
    }
  }, [getInitialStep, isInitialized])

  // Save step to session storage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      sessionStorage.setItem(`${formId}_currentStep`, currentStep.toString())
      onStepChange?.(currentStep)
    }
  }, [currentStep, formId, isInitialized, onStepChange])

  // Save form data to session storage
  const saveFormData = useCallback((data: any) => {
    try {
      sessionStorage.setItem(`${formId}_formData`, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save form data:', error)
    }
  }, [formId])

  // Load form data from session storage
  const loadFormData = useCallback(() => {
    try {
      const savedData = sessionStorage.getItem(`${formId}_formData`)
      return savedData ? JSON.parse(savedData) : null
    } catch (error) {
      console.error('Failed to load form data:', error)
      return null
    }
  }, [formId])

  // Clear saved data
  const clearSavedData = useCallback(() => {
    try {
      sessionStorage.removeItem(`${formId}_formData`)
      sessionStorage.removeItem(`${formId}_currentStep`)
    } catch (error) {
      console.error('Failed to clear saved data:', error)
    }
  }, [formId])

  // Navigate to step
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= maxSteps) {
      setCurrentStep(step)
    }
  }, [maxSteps])

  // Next step
  const nextStep = useCallback(() => {
    if (currentStep < maxSteps) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep, maxSteps])

  // Previous step
  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  // Check if returning from cancelled checkout
  const isReturningFromCheckout = useCallback(() => {
    return searchParams.get('success') === 'false'
  }, [searchParams])

  // Check if returning from successful payment and clear data
  const isReturningFromSuccessfulPayment = useCallback(() => {
    return searchParams.get('success') === 'true'
  }, [searchParams])

  // Clear form data if returning from successful payment
  useEffect(() => {
    if (isReturningFromSuccessfulPayment()) {
      clearSavedData()
      setCurrentStep(1)
    }
  }, [isReturningFromSuccessfulPayment, clearSavedData])

  return {
    currentStep,
    isInitialized,
    goToStep,
    nextStep,
    prevStep,
    saveFormData,
    loadFormData,
    clearSavedData,
    isReturningFromCheckout: isReturningFromCheckout(),
    isReturningFromSuccessfulPayment: isReturningFromSuccessfulPayment()
  }
}
