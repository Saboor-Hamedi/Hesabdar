import { useEffect, useState } from 'react'
import { TitleBarIcons } from './TitleBarIcons'
import { WindowControls } from './WindowControls'

export const TITLEBAR_HEIGHT = 30

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (window.titlebarAPI?.isMaximized) {
      window.titlebarAPI.isMaximized().then(setIsMaximized)
    }
    const off = window.titlebarAPI?.onMaximizeChange?.(setIsMaximized)
    return () => {
      off?.()
    }
  }, [])

  return (
    <div
      onDoubleClick={() => window.titlebarAPI?.maximize?.()}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between select-none border-b border-gray-200/60 bg-white/95 backdrop-blur-sm"
      style={{ height: TITLEBAR_HEIGHT, WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <TitleBarIcons />
      <WindowControls isMaximized={isMaximized} />
    </div>
  )
}