import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { NotificationContext } from './notificationStore'
import type { NotificationItem, NotificationTone } from './notificationStore'

const NOTIFICATION_TIMEOUT_MS = 2800

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => current.filter((item) => item.id !== id))
  }, [])

  const notify = useCallback((message: string, tone: NotificationTone = 'info') => {
    const id = crypto.randomUUID()

    setNotifications((current) => [...current, { id, message, tone }])

    window.setTimeout(() => {
      setNotifications((current) => current.filter((item) => item.id !== id))
    }, NOTIFICATION_TIMEOUT_MS)
  }, [])

  const value = useMemo(
    () => ({ notifications, notify, dismiss }),
    [dismiss, notifications, notify],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
