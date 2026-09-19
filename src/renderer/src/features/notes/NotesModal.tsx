import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  StickyNote,
  X,
  PanelRight,
  PanelRightClose,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { StickyBoard } from './StickyBoard'
import { cn } from './cn'

interface NotesModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * NotesModal: Bottom-docked desktop scratchpad emerging directly from StatusBoard.
 * Can be used as an expanded bottom board or docked/stuck to one side.
 */
export function NotesModal({ isOpen, onClose }: NotesModalProps) {
  const { t } = useTranslation()
  const [isSideDocked, setIsSideDocked] = useState(() => {
    try {
      return localStorage.getItem('hesabdar_notes_side_docked') === 'true'
    } catch {
      return false
    }
  })
  const [isMaximized, setIsMaximized] = useState(false)

  const handleToggleSideDock = () => {
    setIsSideDocked((prev) => {
      const next = !prev
      try {
        localStorage.setItem('hesabdar_notes_side_docked', String(next))
      } catch {}
      return next
    })
  }

  // Keyboard shortcut Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Light backdrop when in centered/expanded mode */}
      {!isSideDocked && (
        <div
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px] transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Drawer Container — emerging parallel with StatusBoard at bottom */}
      <div
        className={cn(
          'fixed z-50 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl transition-all duration-200 ease-out overflow-hidden',
          isSideDocked
            ? 'top-[34px] bottom-[30px] end-2 w-[460px] md:w-[520px] rounded-2xl'
            : isMaximized
              ? 'top-[34px] bottom-[30px] inset-x-2 rounded-2xl'
              : 'bottom-[30px] inset-x-4 md:inset-x-8 max-w-7xl mx-auto h-[86vh] rounded-2xl'
        )}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200/70 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/90 select-none shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-amber-100/80 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60">
              <StickyNote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                {t('notes.title', 'Notes')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Stick to Side toggle */}
            <button
              type="button"
              onClick={handleToggleSideDock}
              title={isSideDocked ? t('notes.dockBottom', 'Dock to Bottom') : t('notes.stickSide', 'Stick to Side')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer',
                isSideDocked
                  ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              {isSideDocked ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRight className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {isSideDocked ? t('notes.sideDocked', 'Side Stuck') : t('notes.stickSide', 'Stick to Side')}
              </span>
            </button>

            {/* Maximize toggle (when not side docked) */}
            {!isSideDocked && (
              <button
                type="button"
                onClick={() => setIsMaximized((prev) => !prev)}
                title={isMaximized ? 'Restore' : 'Maximize'}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              className="p-1 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 flex flex-col p-3 overflow-hidden">
          <StickyBoard
            className="h-full flex-1"
            storageKey="hesabdar-notes:v1"
            isSideDocked={isSideDocked}
            onToggleSideDock={handleToggleSideDock}
          />
        </div>
      </div>
    </>
  )
}

export default NotesModal
