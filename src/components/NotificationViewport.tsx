import { Icon } from '@iconify/react'
import { useNotifications } from '../lib/notifications/useNotifications'

const toneClassMap = {
  success: 'border-[#3d6ec9] bg-[#1f2f4f] text-[#d9e7ff]',
  error: 'border-[#a94444] bg-[#3a2020] text-[#ffd5d5]',
  info: 'border-[#6a6a6a] bg-[#2b2b2b] text-[#ededed]',
} as const

const toneIconMap = {
  success: 'mdi:check-circle-outline',
  error: 'mdi:alert-circle-outline',
  info: 'mdi:information-outline',
} as const

export function NotificationViewport() {
  const { notifications, dismiss } = useNotifications()

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-3 md:top-5">
      {notifications.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${toneClassMap[item.tone]}`}
          role="status"
          aria-live="polite"
        >
          <Icon icon={toneIconMap[item.tone]} className="h-5 w-5 shrink-0" />
          <p className="flex-1">{item.message}</p>
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            className="text-current/80 transition-colors hover:text-current"
            aria-label="Dismiss notification"
          >
            <Icon icon="mdi:close" className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
