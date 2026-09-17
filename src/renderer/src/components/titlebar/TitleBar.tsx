import { useEffect, useState } from 'react'
import { TitleBarIcons } from './TitleBarIcons'
import { WindowControls } from './WindowControls'

export const TITLEBAR_HEIGHT = 30

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [ownerName, setOwnerName] = useState<string | null>(null)

  useEffect(() => {
    if (window.titlebarAPI?.isMaximized) {
      window.titlebarAPI.isMaximized().then(setIsMaximized)
    }
    const off = window.titlebarAPI?.onMaximizeChange?.(setIsMaximized)

    // Load the licensed owner's name
    window.api?.license?.getIdentity?.().then((identity: any) => {
      if (identity?.full_name) setOwnerName(identity.full_name)
    })

    // Update on activation
    const offActivated = window.api?.license?.onActivated?.((identity: any) => {
      if (identity?.full_name) setOwnerName(identity.full_name)
    })

    return () => {
      off?.()
      offActivated?.()
    }
  }, [])

  return (
    <div
      onDoubleClick={() => window.titlebarAPI?.maximize?.()}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between select-none border-b border-gray-200/60 bg-white/95 backdrop-blur-sm"
      style={{ height: TITLEBAR_HEIGHT, WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <TitleBarIcons />

      {/* Owner name — centered, locked, non-editable */}
      {ownerName && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <span className="text-[11px] font-semibold text-[#4A7C6F] tracking-wide">
            {ownerName}
          </span>
        </div>
      )}

      <WindowControls isMaximized={isMaximized} />
    </div>
  )
}