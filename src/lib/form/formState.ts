
export interface FormState {
  country: string // '' means not selected
  state: string // '' means not selected, only used if country is United States
  organizationName: string
  roleType: '' | 'youth-program-operator' | 'ngo-nonprofit' | 'school-university' | 'startup-builder' | 'government-policy' | 'funder-donor' | 'other'
  focusArea: '' | 'entrepreneurship' | 'education' | 'employment' | 'peacebuilding-civic-engagement' | 'technology-innovation' | 'other'
  primaryConstraint: '' | 'funding' | 'execution-capacity' | 'engagement' | 'institutional-support' | 'training-skills' | 'other'
  estimatedYouthReach: string
  contact: string
  description: string // Optional description for the organization
}


export type RoleType = FormState['roleType']
export type FocusArea = FormState['focusArea']
export type PrimaryConstraint = FormState['primaryConstraint']

export const initialFormState: FormState = {
  country: '',
  state: '',
  organizationName: '',
  roleType: '',
  focusArea: '',
  primaryConstraint: '',
  estimatedYouthReach: '',
  contact: '',
  description: '',
}
