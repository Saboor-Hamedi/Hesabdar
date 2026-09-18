import { useState, useEffect, useMemo } from 'react'
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

export function AdminLicensesView() {
  const [devices, setDevices] = useState<DeviceItem[]>([])
  const [loading, setLoading] = useState(true)
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
    if (isManual || devices.length > 0) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const data = await window.api?.admin?.getDevices?.()
      if (Array.isArray(data)) {
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
    loadDevices()
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
    <div className="h-full flex flex-col min-h-0 gap-3.5 select-none max-w-7xl mx-auto w-full overflow-y-auto pr-1 pb-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/60 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4A7C6F]/12 text-[#3D665B]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">License Management</h1>
              <p className="text-xs text-gray-500">Review customer requests, activate licenses, and manage connected machines</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => loadDevices(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#4A7C6F]' : 'text-gray-500'}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh List'}</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Total Registered</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{metrics.total}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-amber-200/70 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-700">Pending Review</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-2xl font-bold text-amber-800">{metrics.pending}</p>
              {metrics.pending > 0 && (
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-emerald-200/70 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-700">Active Licenses</p>
            <p className="text-2xl font-bold text-emerald-800 mt-0.5">{metrics.approved}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-rose-600">Revoked / Rejected</p>
            <p className="text-2xl font-bold text-rose-700 mt-0.5">{metrics.revoked}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200/70 rounded-xl p-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({metrics.total})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Pending</span>
            {metrics.pending > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700 font-bold'}`}>
                {metrics.pending}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-[#4A7C6F] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Approved ({metrics.approved})
          </button>
          <button
            onClick={() => setStatusFilter('revoked')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              statusFilter === 'revoked'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Revoked ({metrics.revoked})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, PC..."
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#4A7C6F] focus:ring-2 focus:ring-[#4A7C6F]/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-200/70 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Device & OS</th>
                <th className="py-3 px-4">Requested At</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && devices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#4A7C6F] mb-2" />
                    <span>Loading device records from Supabase...</span>
                  </td>
                </tr>
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Laptop className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-medium text-gray-600">No device records found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {search ? 'Try adjusting your search criteria' : 'When customers request activation, their devices will appear here.'}
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
                    <tr key={device.hwid} className="hover:bg-gray-50/70 transition-colors">
                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">{device.full_name || 'Unnamed Device'}</span>
                          {isAdminDevice && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#4A7C6F]/15 text-[#3D665B] border border-[#4A7C6F]/25">
                              Admin (You)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono truncate max-w-[140px]" title={device.hwid}>
                          ID: {device.hwid.slice(0, 12)}...
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-mono">{device.phone || '—'}</span>
                          {device.phone && (
                            <button
                              onClick={() => handleCopyPhone(device.phone, device.hwid)}
                              title="Copy phone"
                              className="text-gray-400 hover:text-gray-700 p-0.5 rounded cursor-pointer"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                        {device.email && (
                          <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{device.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Device & OS */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-gray-800">
                          <Laptop className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{device.machine_name || 'PC'}</span>
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {device.os_platform || 'Windows'} {device.app_version ? `• v${device.app_version}` : ''}
                        </div>
                      </td>

                      {/* Requested At */}
                      <td className="py-3.5 px-4 text-gray-600 text-xs">
                        {device.created_at ? (
                          <>
                            <div>{new Date(device.created_at).toLocaleDateString()}</div>
                            <div className="text-[11px] text-gray-400">{new Date(device.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isAdminDevice ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#4A7C6F]/10 text-[#3D665B] border border-[#4A7C6F]/25">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#4A7C6F]" />
                            Administrator
                          </span>
                        ) : (
                          <>
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                <CheckCircle2 className="w-3 h-3" />
                                Approved
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                            {isRevoked && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                                <XCircle className="w-3 h-3" />
                                Revoked
                              </span>
                            )}
                          </>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {isAdminDevice ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-400 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#4A7C6F]" />
                              <span>Protected</span>
                            </span>
                          ) : isActionLoading ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            </span>
                          ) : (
                            <>
                              {/* Approve Button */}
                              {(!isApproved || isRevoked) && (
                                <button
                                  type="button"
                                  onClick={() => handleApprove(device)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#4A7C6F] hover:bg-[#3D665B] active:scale-[0.97] text-white font-medium rounded-lg shadow-sm transition-all cursor-pointer text-xs"
                                  title="Approve device and grant license"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isRevoked ? 'Re-Approve' : 'Approve'}</span>
                                </button>
                              )}

                              {/* Revoke Button */}
                              {isApproved && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmModal({ type: 'revoke', device })}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 active:scale-[0.97] text-rose-700 font-medium rounded-lg border border-rose-200 transition-all cursor-pointer text-xs"
                                  title="Revoke active license"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Revoke</span>
                                </button>
                              )}

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setConfirmModal({ type: 'delete', device })}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete device record"
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
          <div className="border-t border-gray-100 bg-gray-50/40">
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
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                confirmModal.type === 'delete' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {confirmModal.type === 'delete' ? 'Delete Device Record?' : 'Revoke License Access?'}
                </h3>
                <p className="text-xs text-gray-500">
                  {confirmModal.device.full_name} ({confirmModal.device.machine_name || 'PC'})
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              {confirmModal.type === 'delete'
                ? 'This will permanently remove this device row from Supabase. If the customer reopens the app, they will need to register again.'
                : 'This will lock the customer app immediately upon their next background sync. You can re-approve them at any time.'}
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.type === 'delete') handleDelete(confirmModal.device)
                  else handleRevoke(confirmModal.device)
                }}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-all cursor-pointer ${
                  confirmModal.type === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmModal.type === 'delete' ? 'Confirm Delete' : 'Confirm Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
