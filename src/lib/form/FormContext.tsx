import React, { useState } from 'react'
import { FormContext } from './formContextStore'
import { initialFormState, type FormState } from './formState'

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [formState, setFormState] = useState<FormState>(initialFormState)

  const updateFormState = (updates: Partial<FormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }))
  }

  const resetFormState = () => {
    setFormState(initialFormState)
  }

  return (
    <FormContext.Provider value={{ formState, updateFormState, resetFormState }}>
      {children}
    </FormContext.Provider>
  )
}
