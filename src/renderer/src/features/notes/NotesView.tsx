import { useTranslation } from 'react-i18next'
import { StickyNote } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { StickyBoard } from './StickyBoard'

/**
 * NotesView: Full-page desktop scratchpad and board for store reminders,
 * customer phone numbers, quick notes, and stickers.
 * Automatically synchronizes with SQLite table 'notes'.
 */
export function NotesView() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-full min-h-0 gap-3 max-w-7xl mx-auto w-full">
      <PageHeader
        title={t('notes.title', 'Sticky Notes & Scratchpad')}
        subtitle={t('notes.subtitle', 'Store reminders, phone numbers, and daily cashier notes.')}
        icon={StickyNote}
        iconColor="text-amber-500 dark:text-amber-400"
        iconBg="bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/60"
        action={
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
            {t('notes.autoSaved', 'Auto-saved')}
          </span>
        }
      />

      <div className="flex-1 min-h-0 flex flex-col">
        <StickyBoard className="h-full flex-1" storageKey="hesabdar-notes:v1" />
      </div>
    </div>
  )
}

export default NotesView
