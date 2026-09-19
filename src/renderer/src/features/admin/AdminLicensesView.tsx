import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ShieldCheck,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  Laptop,
  Phone,
  Mail,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Users
} from 'lucide-react'
import { notify } from '../../core/notifications'
import { Pagination } from '../../components/ui/Pagination'

export interface DeviceItem {
  id?: string | number
  hwid: string
  full_name: string
  email: string
  phone: string
  machine_name?: string
  os_platform?: string
  app_version?: string
  status: 'pending' | 'approved' | 'revoked' | 'rejected' | string
  created_at?: string
  license_token?: string
  is_admin?: boolean
  is_approved?: boolean
}

// Module-level cache — survives tab switches, reset on explicit Refresh
let _devicesCache: DeviceItem[] = []

export function AdminLicensesView() {
  const { t } = useTranslation()
  // Initialize from cache so re-visiting the tab doesn't show skeleton
  const [devices, setDevices] = useState<DeviceItem[]>(_devicesCache)
  const [loading, setLoading] = useState(_devicesCache.length === 0)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'revoked'>('all')
  const [actionLoadingHwid, setActionLoadingHwid] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ type: 'revoke' | 'delete'; device: DeviceItem } | null>(null)
  const [copiedHwid, setCopiedHwid] = useState<string | null>(null)
  const [currentHwid, setCurrentHwid] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const loadDevices = async (isManual = false) => {
    if (isManual || _devicesCache.length > 0) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const data = await window.api?.admin?.getDevices?.()
      if (Array.isArray(data)) {
        _devicesCache = data
        setDevices(data)
      }
    } catch (err: any) {
      console.error('Failed to load devices:', err)
      notify({
        type: 'error',
        title: 'Error loading devices',
        message: err?.message || 'Could not fetch device records from Supabase.'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // Only fetch if cache is empty (first ever visit); otherwise just refresh quietly
    if (_devicesCache.length === 0) {
      loadDevices()
    }
    window.api?.admin?.getCurrentHwid?.().then((hwid: string) => {
      if (hwid) setCurrentHwid(hwid)
    }).catch(() => {})

    const unsubscribe = window.api?.admin?.onDevicesChanged?.(() => {
      loadDevices()
    })
    return () => {
      unsubscribe?.()
    }
  }, [])

  // Metrics
  const metrics = useMemo(() => {
    const total = devices.length
    const pending = devices.filter(d => d.status === 'pending').length
    const approved = devices.filter(d => d.status === 'approved').length
    const revoked = devices.filter(d => d.status === 'revoked' || d.status === 'rejected').length
    return { total, pending, approved, revoked }
  }, [devices])

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      // Status filter
      if (statusFilter === 'pending' && d.status !== 'pending') return false
      if (statusFilter === 'approved' && d.status !== 'approved') return false
      if (statusFilter === 'revoked' && d.status !== 'revoked' && d.status !== 'rejected') return false

      // Search query
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        (d.full_name && d.full_name.toLowerCase().includes(q)) ||
        (d.email && d.email.toLowerCase().includes(q)) ||
        (d.phone && d.phone.toLowerCase().includes(q)) ||
        (d.machine_name && d.machine_name.toLowerCase().includes(q)) ||
        (d.hwid && d.hwid.toLowerCase().includes(q))
      )
    })
  }, [devices, statusFilter, search])

  // Paginated devices
  const paginatedDevices = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredDevices.slice(start, start + pageSize)
  }, [filteredDevices, page, pageSize])

  // Actions
  const handleApprove = async (device: DeviceItem) => {
    setActionLoadingHwid(device.hwid)
    try {
      const res = await window.api?.admin?.approveDevice?.(device.hwid)
      if (res?.success) {
        notify({
          type: 'success',
          title: 'Device Approved',
          message: `${device.full_name} is now approved and licensed.`
        })
        await loadDevices()
      } else {
        notify({
          type: 'error',
          title: 'Approval Failed',
          message: res?.error || 'Could not generate license token.'
        })
      }
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Approval Error',
        message: err?.message || 'Network failure while approving.'
      })
    } finally {
      setActionLoadingHwid(null)
    }
  }

  const handleRevoke = async (device: DeviceItem) => {
    setActionLoadingHwid(device.hwid)
    setConfirmModal(null)
    try {
      const res = await window.api?.admin?.revokeDevice?.(device.hwid)
      if (res?.success) {
        notify({
          type: 'info',
          title: 'License Revoked',
          message: `${device.full_name}'s access was revoked.`
        })
        await loadDevices()
      } else {
        notify({
          type: 'error',
          title: 'Revoke Failed',
          message: res?.error || 'Could not revoke license.'
        })
      }
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Revoke Error',
        message: err?.message || 'Error occurred while revoking.'
      })
    } finally {
      setActionLoadingHwid(null)
    }
  }

  const handleDelete = async (device: DeviceItem) => {
    setActionLoadingHwid(device.hwid)
    setConfirmModal(null)
    try {
      const res = await window.api?.admin?.deleteDevice?.(device.hwid)
      if (res?.success) {
        notify({
          type: 'info',
          title: 'Record Deleted',
          message: `Removed ${device.full_name}'s device record.`
        })
        await loadDevices()
      } else {
        notify({
          type: 'error',
          title: 'Delete Failed',
          message: res?.error || 'Could not delete device row.'
        })
      }
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Delete Error',
        message: err?.message || 'Error occurred while deleting.'
      })
    } finally {
      setActionLoadingHwid(null)
    }
  }

  const handleCopyPhone = (phone: string, hwid: string) => {
    navigator.clipboard.writeText(phone)
    setCopiedHwid(hwid)
    setTimeout(() => setCopiedHwid(null), 2000)
  }

  return (
    <div className="h-full flex flex-col min-h-0 gap-3 select-none max-w-7xl mx-auto w-full overflow-y-auto pr-1 pb-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-gray-200/60 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4A7C6F]/10 dark:bg-[#4A7C6F]/20 text-[#4A7C6F] dark:text-[#68A590]">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-slate-100 tracking-tight">{t('admin.title')}</h1>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">{t('admin.subtitle')}</p>
          </div>
        </div>

        <button
          onClick={() => loadDevices(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[5px] hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#4A7C6F]' : 'text-gray-400'}`} />
          <span>{refreshing ? t('admin.refreshing') : t('admin.refresh')}</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-400 dark:text-slate-500">{t('admin.totalRegistered')}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-0.5">{metrics.total}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-slate-400">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-800/50 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">{t('admin.pendingReview')}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{metrics.pending}</p>
              {metrics.pending > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-800/50 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{t('admin.activeLicenses')}</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{metrics.approved}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-rose-500 dark:text-rose-400">{t('admin.revokedRejected')}</p>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-300 mt-0.5">{metrics.revoked}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 dark:text-rose-400">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800 rounded-xl p-2.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-slate-800 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-xs'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
          >
            {t('admin.filterAll')} ({metrics.total})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
          >
            <span>{t('admin.filterPending')}</span>
            {metrics.pending > 0 && (
              <span className={`text-[10px] px-1.5 rounded-[4px] ${statusFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold'}`}>
                {metrics.pending}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-[#4A7C6F] text-white shadow-xs'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
          >
            {t('admin.filterApproved')} ({metrics.approved})
          </button>
          <button
            onClick={() => setStatusFilter('revoked')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              statusFilter === 'revoked'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
          >
            {t('admin.filterRevoked')} ({metrics.revoked})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.searchPlaceholder')}
            className="w-full ps-8 pe-8 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-[5px] bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:border-[#4A7C6F] transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800 text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">{t('admin.colCustomer')}</th>
                <th className="py-2.5 px-4">{t('admin.colContact')}</th>
                <th className="py-2.5 px-4">{t('admin.colDevice')}</th>
                <th className="py-2.5 px-4">{t('admin.colRequestedAt')}</th>
                <th className="py-2.5 px-4 text-center">{t('admin.colStatus')}</th>
                <th className="py-2.5 px-4 text-end">{t('admin.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/80">
              {loading && devices.length === 0 ? (
                // Skeleton rows — match the real table column widths exactly
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-28 rounded bg-gray-200 dark:bg-slate-700" />
                      </div>
                    </td>
                    {/* Contact Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="h-3 w-32 rounded bg-gray-200 dark:bg-slate-700" />
                        <div className="h-3 w-24 rounded bg-gray-200 dark:bg-slate-700" />
                      </div>
                    </td>
                    {/* Device & OS */}
                    <td className="py-3.5 px-4">
                      <div className="h-3 w-24 rounded bg-gray-200 dark:bg-slate-700" />
                    </td>
                    {/* Requested At */}
                    <td className="py-3.5 px-4">
                      <div className="h-3 w-20 rounded bg-gray-200 dark:bg-slate-700" />
                    </td>
                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-slate-700 mx-auto" />
                    </td>
                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-6 w-20 rounded-lg bg-gray-200 dark:bg-slate-700 ms-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 dark:text-slate-500">
                    <Laptop className="w-8 h-8 mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-medium text-gray-600 dark:text-slate-300">{t('admin.noRecords')}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                      {search ? t('admin.noRecordsSearch') : t('admin.noRecordsHint')}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedDevices.map((device) => {
                  const isAdminDevice = device.is_admin === true || (Boolean(currentHwid) && device.hwid === currentHwid)
                  const isActionLoading = actionLoadingHwid === device.hwid
                  const isCopied = copiedHwid === device.hwid
                  const isApproved = device.status === 'approved'
                  const isPending = device.status === 'pending'
                  const isRevoked = device.status === 'revoked' || device.status === 'rejected'

                  return (
                    <tr key={device.hwid} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/60 transition-colors">
                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm">{device.full_name || 'Unnamed Device'}</span>
                          {isAdminDevice && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#4A7C6F]/15 dark:bg-[#4A7C6F]/25 text-[#3D665B] dark:text-[#68A590] border border-[#4A7C6F]/25 dark:border-[#4A7C6F]/40">
                              Admin (You)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-slate-500 font-mono truncate max-w-[140px]" title={device.hwid}>
                          ID: {device.hwid.slice(0, 12)}...
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                          <span className="font-mono">{device.phone || '—'}</span>
                          {device.phone && (
                            <button
                              onClick={() => handleCopyPhone(device.phone, device.hwid)}
                              title="Copy phone"
                              className="text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                        {device.email && (
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 text-[11px]">
                            <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                            <span>{device.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Device & OS */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-slate-200">
                          <Laptop className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                          <span>{device.machine_name || 'PC'}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-slate-500">
                          {device.os_platform || 'Windows'} {device.app_version ? `• v${device.app_version}` : ''}
                        </div>
                      </td>

                      {/* Requested At */}
                      <td className="py-3.5 px-4 text-gray-600 dark:text-slate-300 text-xs">
                        {device.created_at ? (
                          <>
                            <div>{new Date(device.created_at).toLocaleDateString()}</div>
                            <div className="text-[11px] text-gray-400 dark:text-slate-500">{new Date(device.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isAdminDevice ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-[#4A7C6F]/10 dark:bg-[#4A7C6F]/25 text-[#3D665B] dark:text-[#68A590] border border-[#4A7C6F]/25 dark:border-[#4A7C6F]/40" style={{ borderRadius: '5px' }}>
                            Admin
                          </span>
                        ) : (
                          <>
                            {isApproved && (
                              <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60" style={{ borderRadius: '5px' }}>
                                Approved
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60" style={{ borderRadius: '5px' }}>
                                Pending
                              </span>
                            )}
                            {isRevoked && (
                              <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60" style={{ borderRadius: '5px' }}>
                                Revoked
                              </span>
                            )}
                          </>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-end">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {isAdminDevice ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#4A7C6F] dark:text-[#68A590]" />
                              <span>{t('admin.actionProtected')}</span>
                            </span>
                          ) : isActionLoading ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 dark:text-slate-500">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            </span>
                          ) : (
                            <>
                              {/* Approve Button */}
                              {(!isApproved || isRevoked) && (
                                <button
                                  type="button"
                                  onClick={() => handleApprove(device)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-[#4A7C6F] hover:bg-[#3D665B] active:scale-[0.97] text-white font-medium transition-all cursor-pointer text-[11px]"
                                  style={{ borderRadius: '5px' }}
                                  title={t('admin.actionApprove')}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{t('admin.actionApprove')}</span>
                                </button>
                              )}

                              {/* Revoke Button */}
                              {isApproved && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmModal({ type: 'revoke', device })}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 active:scale-[0.97] text-rose-600 dark:text-rose-300 font-medium border border-rose-200 dark:border-rose-900/60 transition-all cursor-pointer text-[11px]"
                                  style={{ borderRadius: '5px' }}
                                  title={t('admin.actionRevoke')}
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>{t('admin.actionRevoke')}</span>
                                </button>
                              )}

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setConfirmModal({ type: 'delete', device })}
                                className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-[5px] transition-colors cursor-pointer"
                                title={t('admin.actionDelete')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredDevices.length > 0 && (
          <div className="border-t border-gray-100 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-900/60">
            <Pagination
              currentPage={page}
              totalItems={filteredDevices.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                confirmModal.type === 'delete' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
              }`}>
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                  {confirmModal.type === 'delete' ? t('admin.confirmDelete') : t('admin.confirmRevoke')}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  {confirmModal.device.full_name} ({confirmModal.device.machine_name || 'PC'})
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-slate-300 mb-5 leading-relaxed">
              {confirmModal.type === 'delete'
                ? t('admin.confirmDeleteMsg', { name: confirmModal.device.full_name })
                : t('admin.confirmRevokeMsg', { name: confirmModal.device.full_name })}
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-[5px] transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.type === 'delete') handleDelete(confirmModal.device)
                  else handleRevoke(confirmModal.device)
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer rounded-[5px] ${
                  confirmModal.type === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmModal.type === 'delete' ? t('admin.actionDelete') : t('admin.actionRevoke')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
