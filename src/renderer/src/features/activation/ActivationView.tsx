import { useState, useEffect } from 'react'
import { CheckCircle2, Loader2, AlertCircle, Send, RefreshCw } from 'lucide-react'
import { Revoke } from './Revoke'

type Status = 'idle' | 'submitting' | 'pending' | 'approved' | 'rejected' | 'revoked' | 'error'

interface Props {
  onActivated: (identity: { full_name: string; email: string; phone: string }) => void
}

export function ActivationView({ onActivated }: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [checkingNow, setCheckingNow] = useState(false)
  const [notice, setNotice] = useState('')

  // Check current status on mount (detect already pending, approved, or revoked)
  useEffect(() => {
    window.api?.license?.check?.().then((res: any) => {
      if (res?.valid) {
        setStatus('approved')
        setTimeout(() => onActivated(res), 1000)
      } else if (res?.status === 'revoked') {
        setStatus('revoked')
      } else if (res?.pending) {
        setStatus('pending')
        if (res.full_name) setFullName(res.full_name)
        if (res.email) setEmail(res.email)
        if (res.phone) setPhone(res.phone)
      }
    }).catch(() => {})
  }, [onActivated])

  useEffect(() => {
    // Listen for real-time approval from Main process
    const offActivated = window.api?.license?.onActivated?.((identity) => {
      setStatus('approved')
      setTimeout(() => onActivated(identity), 1500)
    })

    const offStatus = window.api?.license?.onStatusChange?.((newStatus: string) => {
      if (newStatus === 'rejected') setStatus('rejected')
      else if (newStatus === 'revoked') setStatus('revoked')
      else if (newStatus === 'pending') setStatus('pending')
      else if (newStatus === 'approved') setStatus('approved')
    })

    // Polling fallback when pending (in case Realtime WebSocket disconnects or drops)
    let pollTimer: any = null
    if (status === 'pending') {
      pollTimer = setInterval(async () => {
        try {
          const res = await window.api?.license?.check?.()
          if (res?.valid) {
            clearInterval(pollTimer)
            setStatus('approved')
            setTimeout(() => onActivated(res), 1200)
          }
        } catch {}
      }, 3500)
    }

    return () => {
      offActivated?.()
      offStatus?.()
      if (pollTimer) clearInterval(pollTimer)
    }
  }, [status, onActivated])

  async function handleManualCheck() {
    setCheckingNow(true)
    setNotice('')
    try {
      const res = await window.api?.license?.check?.()
      if (res?.valid) {
        setStatus('approved')
        setTimeout(() => onActivated(res), 1000)
      } else if (res?.status === 'revoked') {
        setStatus('revoked')
        setCheckingNow(false)
      } else {
        setTimeout(() => {
          setCheckingNow(false)
          setNotice('Checked just now — still awaiting approval in dashboard.')
          setTimeout(() => setNotice(''), 4000)
        }, 500)
      }
    } catch {
      setCheckingNow(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !phone.trim()) return

    setStatus('submitting')
    setErrorMsg('')

    const result = await window.api?.license?.requestActivation?.({
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim()
    })

    if (result?.success) {
      setStatus('pending')
    } else {
      setStatus('error')
      setErrorMsg(result?.error || 'Connection failed. Please check your internet.')
    }
  }

  const isSubmitted = status === 'pending' || status === 'approved' || status === 'rejected' || status === 'revoked'
  const isLoading = status === 'submitting'

  if (status === 'revoked') {
    return <Revoke onApproved={() => window.api?.license?.check?.().then((res: any) => res?.valid && onActivated(res))} />
  }

  return (
    <div className="fixed inset-0 top-[30px] bg-gradient-to-br from-[#F0F5F3] to-[#E8F0EE] flex items-center justify-center z-40 select-none overflow-y-auto">
      <div className="w-full max-w-md mx-4 py-8">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#5A8F7B] shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Hesabdar</h1>
          <p className="text-sm text-gray-500 mt-1">Accounting & Point of Sale System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Approved State */}
          {status === 'approved' && (
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Activation Successful!</h2>
              <p className="text-gray-500 text-sm">Your copy of Hesabdar is now activated. Opening...</p>
            </div>
          )}


          {/* Rejected State */}
          {status === 'rejected' && (
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="w-16 h-16 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Request Declined</h2>
              <p className="text-gray-500 text-sm mb-6">Your activation request was declined. Please contact support.</p>
              <button
                onClick={() => setStatus('idle')}
                className="text-sm text-[#4A7C6F] hover:underline cursor-pointer"
              >
                Try again with different details
              </button>
            </div>
          )}

          {/* Pending State */}
          {status === 'pending' && (
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="w-16 h-16 text-[#5A8F7B] animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h2>
              <p className="text-gray-500 text-sm">
                Your activation request has been received.<br />
                Please wait while your license is being reviewed.
              </p>

              {(fullName || phone) && (
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 text-left text-xs space-y-1">
                  {fullName && (
                    <div className="flex justify-between text-gray-600">
                      <span className="text-gray-400">Owner:</span>
                      <span className="font-medium text-gray-800">{fullName}</span>
                    </div>
                  )}
                  {phone && (
                    <div className="flex justify-between text-gray-600">
                      <span className="text-gray-400">Phone:</span>
                      <span className="font-medium text-gray-800">{phone}</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-4">
                This window updates automatically once approved.
              </p>

              <div className="mt-5 flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={checkingNow}
                  className="w-full max-w-xs h-10 bg-[#5A8F7B] hover:bg-[#4A7C6F] active:scale-[0.98] disabled:opacity-60 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingNow ? 'animate-spin' : ''}`} />
                  <span>{checkingNow ? 'Checking Status...' : 'Refresh Status'}</span>
                </button>

                {notice && (
                  <p className="mt-2 text-xs text-emerald-600 font-medium transition-all">
                    {notice}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form State (idle, submitting, error) */}
          {!isSubmitted && (
            <form onSubmit={handleSubmit} className="p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Activate Your License</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your details to request activation. These will be displayed permanently in the app.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Haji Mohammad Qasim"
                    disabled={isLoading}
                    className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#5A8F7B] focus:ring-2 focus:ring-[#5A8F7B]/20 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. qasim@gmail.com"
                    disabled={isLoading}
                    className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#5A8F7B] focus:ring-2 focus:ring-[#5A8F7B]/20 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +93 700 123 456"
                    disabled={isLoading}
                    className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#5A8F7B] focus:ring-2 focus:ring-[#5A8F7B]/20 disabled:opacity-50"
                  />
                </div>
              </div>

              {status === 'error' && (
                <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200">
                  <p className="text-xs text-rose-700 font-medium">{errorMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !fullName.trim() || !email.trim() || !phone.trim()}
                className="mt-6 w-full h-11 bg-[#5A8F7B] hover:bg-[#4A7C6F] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending Request...</>
                ) : (
                  <><Send className="w-4 h-4" /> Request Activation Key</>
                )}
              </button>

              <p className="text-center text-xs text-gray-400 mt-4">
                Your details will be reviewed by the administrator.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
