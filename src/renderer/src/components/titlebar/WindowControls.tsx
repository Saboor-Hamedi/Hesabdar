import { Minus, Square, Copy, X } from 'lucide-react'

interface Props { isMaximized: boolean }

export function WindowControls({ isMaximized }: Props) {
  const btn =
    'flex h-[30px] w-[46px] items-center justify-center text-gray-600 dark:text-slate-300 ' +
    'transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700'

  return (
    <div
      className="flex items-stretch"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <button className={btn} onClick={() => window.titlebarAPI?.minimize?.()} aria-label="Minimize">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button className={btn} onClick={() => window.titlebarAPI?.maximize?.()} aria-label="Maximize">
        {isMaximized ? <Copy className="h-3 w-3" /> : <Square className="h-3 w-3" />}
      </button>
      <button
        className={btn + ' hover:!bg-red-500 hover:!text-white'}
        onClick={() => window.titlebarAPI?.close?.()}
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}