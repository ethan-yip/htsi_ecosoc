import { createContext } from 'react'

export type NotificationTone = 'success' | 'error' | 'info'

export interface NotificationItem {
  id: string
  message: string
  tone: NotificationTone
}

export interface NotificationContextType {
  notifications: NotificationItem[]
  notify: (message: string, tone?: NotificationTone) => void
  dismiss: (id: string) => void
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined)
