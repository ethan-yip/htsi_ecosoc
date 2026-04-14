import { Icon } from '@iconify/react'
import { useState } from 'react'
import { useFormContext } from '../lib/form/useFormContext'
import { insertEntry } from '../lib/supabase/entriesRepo'
import { getReadableSupabaseError } from '../lib/supabase/errors'
import { useNotifications } from '../lib/notifications/useNotifications'


export function FormActions() {
  const { formState, resetFormState } = useFormContext()
  const { notify } = useNotifications()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validation: required fields must not be empty
  const isValid =
    !!formState.country &&
    !!formState.roleType &&
    !!formState.focusArea &&
    !!formState.primaryConstraint

  const handleSubmit = async () => {
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      await insertEntry(formState)
      resetFormState()
      notify('Successfully added!', 'success')
    } catch (error) {
      notify(`Unsuccessful: ${getReadableSupabaseError(error)}`, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    resetFormState()
  }

  return (
    <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:gap-[13px]">
      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="h-[50px] w-full rounded-[20px] bg-[rgba(255,255,255,0.1)] px-4 text-center text-lg font-medium text-[#a6a6a6] transition-all hover:bg-[rgba(255,255,255,0.15)] sm:flex-1"
      >
        Reset
      </button>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !isValid}
        className={`flex h-[50px] w-full items-center justify-center gap-2 rounded-[20px] px-4 text-center text-lg font-medium transition-all sm:flex-1 ${
          isSubmitting || !isValid
            ? 'bg-[#362828] text-[#b2b2b2] cursor-not-allowed'
            : 'bg-[#B14242] text-white hover:bg-[#d97d20]'
        }`}
      >
        <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
        <Icon icon={isSubmitting ? 'mdi:loading' : 'mdi-light:arrow-right'} className={`h-6 w-6 ${isSubmitting ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}
