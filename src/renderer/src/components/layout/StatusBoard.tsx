import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StickyNote } from 'lucide-react'
import { NotesModal } from '../../features/notes/NotesModal'
import { cn } from '../../features/notes/cn'

export const STATUSBOARD_HEIGHT = 28

export function StatusBoard() {
  const { t } = useTranslation()
  const [isNotesOpen, setIsNotesOpen] = useState(false)

  // Listen for F8 keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F8') {
        e.preventDefault()
        setIsNotesOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <footer
        className="w-full shrink-0 flex items-center justify-between px-3 border-t border-gray-200/80 dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs select-none z-30 transition-colors duration-200"
        style={{ height: STATUSBOARD_HEIGHT }}
      >
        {/* Start / Left cluster: system status indicator */}
        <div className="flex items-center gap-3">
          {/* Ready status with animated emerald dot */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              {t('common.ready', 'Ready')}
            </span>
          </div>
        </div>

        {/* End / Right cluster: Parallel Notes button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNotesOpen((prev) => !prev)}
            title="Toggle Notes & Scratchpad (F8)"
            className={cn(
              'flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] text-[11px] font-medium transition-all cursor-pointer shadow-2xs active:scale-95',
              isNotesOpen
                ? 'bg-amber-500 text-white border border-amber-600 shadow-xs'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/25'
            )}
          >
            <StickyNote className={cn('w-3.5 h-3.5', isNotesOpen ? 'text-white' : 'text-amber-600 dark:text-amber-400')} />
            <span className="font-semibold">{t('notes.title', 'Notes')}</span>
            <kbd className="hidden sm:inline-block ms-0.5 px-1 py-0.2 text-[9px] font-mono rounded bg-black/5 dark:bg-white/10 opacity-70">
              F8
            </kbd>
          </button>
        </div>
      </footer>

      {/* The Notes drawer emerging parallel to StatusBoard */}
      <NotesModal isOpen={isNotesOpen} onClose={() => setIsNotesOpen(false)} />
    </>
  )
}
