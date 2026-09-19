import React from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import type { SettingsFormValues } from '../../../core/validation/schemas'

interface StoreProfileCardProps {
  form: SettingsFormValues
  errors: Record<string, string>
  savedSuccess: boolean
  onChangeForm: React.Dispatch<React.SetStateAction<SettingsFormValues>>
  onSave: () => void
}

/**
 * StoreProfileCard: Shop credentials, address, and invoice preferences.
 */
export function StoreProfileCard({
  form,
  errors,
  savedSuccess,
  onChangeForm,
  onSave,
}: StoreProfileCardProps) {
  const { t } = useTranslation()

  return (
    <Card
      title={t('settings.storeProfile')}
      subtitle={t('settings.storeProfileSubtitle')}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
        <Input
          label={t('settings.storeName')}
          value={form.storeName}
          onChange={(e) => onChangeForm((f) => ({ ...f, storeName: e.target.value }))}
          error={errors.storeName}
          placeholder="e.g. Kabul Mart"
          required
        />

        <Input
          label={t('settings.phoneNumber')}
          value={form.phone || ''}
          onChange={(e) => onChangeForm((f) => ({ ...f, phone: e.target.value }))}
          error={errors.phone}
          placeholder="0799123456 or +93799123456"
        />

        <Input
          label={t('settings.storeAddress')}
          value={form.address || ''}
          onChange={(e) => onChangeForm((f) => ({ ...f, address: e.target.value }))}
          error={errors.address}
          placeholder="e.g. Shahr-e-Naw, Kabul, Afghanistan"
        />

        <Input
          label={t('settings.currencyCode')}
          value={form.currency}
          onChange={(e) => onChangeForm((f) => ({ ...f, currency: e.target.value }))}
          error={errors.currency}
          placeholder="AFN, USD, etc."
          required
        />

        <div className="sm:col-span-2">
          <Input
            label={t('settings.taxRate')}
            type="number"
            value={form.taxRate}
            onChange={(e) => onChangeForm((f) => ({ ...f, taxRate: parseFloat(e.target.value) || 0 }))}
            error={errors.taxRate}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100 dark:border-slate-800">
        {savedSuccess ? (
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> {t('settings.savedSuccess')}
          </span>
        ) : (
          <div />
        )}

        <Button variant="primary" onClick={onSave}>
          {t('settings.savePreferences')}
        </Button>
      </div>
    </Card>
  )
}
