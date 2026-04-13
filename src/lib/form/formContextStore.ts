import { createContext } from 'react'
import type { FormState } from './formState'

export interface FormContextType {
  formState: FormState
  updateFormState: (updates: Partial<FormState>) => void
  resetFormState: () => void
}

export const FormContext = createContext<FormContextType | undefined>(undefined)
