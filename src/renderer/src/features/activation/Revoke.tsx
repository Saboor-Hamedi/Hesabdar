import { useState, useEffect } from 'react'
import { ShieldAlert, MessageCircle, Copy, Check, RefreshCw, Lock, ExternalLink, CheckCircle2 } from 'lucide-react'

interface RevokeProps {
  onApproved?: () => void
}

const ADMIN_WHATSAPP_RAW = '+62895365910015'
const ADMIN_WHATSAPP_DISPLAY = '+62 895 3659 10015'
const WHATSAPP_URL = `https://wa.me/62895365910015?text=${encodeURIComponent(
  'Hello Administrator, my Hesabdar software access has been suspended. Please review and re-activate my device.'
)}`

export function Revoke({ onApproved }: RevokeProps) {
  const [checking, setChecking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)

  // Real-time listener: if admin re-approves from dashboard, immediately unlock
  useEffect(() => {
    const offActivated = window.api?.license?.onActivated?.(() => {
      setIsUnlocked(true)
      setNotice('Access Re-Approved! Unlocking Hesabdar...')
      setTimeout(() => {
        onApproved?.()
      }, 1200)
    })

    const offStatus = window.api?.license?.onStatusChange?.((newStatus: string) => {
      if (newStatus === 'approved') {
        setIsUnlocked(true)
        setNotice('Access Re-Approved! Unlocking Hesabdar...')
        setTimeout(() => {
          onApproved?.()
        }, 1200)
      }
    })

    // Continuous fallback poll every 5s while revoked
    const interval = setInterval(async () => {
      try {
        const res = await window.api?.license?.check?.()
        if (res?.valid) {
          clearInterval(interval)
          setIsUnlocked(true)
          setNotice('Access Re-Approved! Unlocking Hesabdar...')
          setTimeout(() => {
            onApproved?.()
          }, 1000)
        }
      } catch {}
    }, 5000)

    return () => {
      offActivated?.()
      offStatus?.()
      clearInterval(interval)
    }
  }, [onApproved])

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(ADMIN_WHATSAPP_RAW)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // Fallback
    }
  }

  const handleOpenWhatsApp = () => {
    window.open(WHATSAPP_URL, '_blank')
  }

  const handleManualCheck = async () => {
    setChecking(true)
    setNotice(null)
    try {
      const res = await window.api?.license?.check?.()
      if (res?.valid) {
        setIsUnlocked(true)
        setNotice('Access Re-Approved! Unlocking Hesabdar...')
        setTimeout(() => {
          onApproved?.()
        }, 1000)
      } else {
        setNotice('Status verified: License is still suspended by administrator.')
        setTimeout(() => setNotice(null), 4500)
      }
    } catch {
      setNotice('Unable to connect to licensing server. Check your internet connection.')
      setTimeout(() => setNotice(null), 4500)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="fixed inset-0 top-[30px] bg-gradient-to-br from-slate-100 via-rose-50/30 to-slate-200 flex items-center justify-center z-50 select-none p-4 overflow-y-auto">
      <div className="w-full max-w-lg my-auto">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-rose-100/80 overflow-hidden backdrop-blur-sm">
          {/* Top Danger Header Band */}
          <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 px-6 py-6 text-white text-center relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner border border-white/20">
                {isUnlocked ? (
                  <CheckCircle2 className="w-9 h-9 text-emerald-300 animate-bounce" />
                ) : (
                  <ShieldAlert className="w-9 h-9 text-white animate-pulse" />
                )}
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                {isUnlocked ? 'Access Restored' : 'License Access Suspended'}
              </h1>
              <p className="text-xs font-medium text-rose-100/90 mt-1" dir="rtl">
                {isUnlocked ? 'دسترسی مجدداً تأیید شد' : 'دسترسی لایسنس نرم‌افزار به حالت تعلیق درآمد'}
              </p>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Explanation Message */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-700 leading-relaxed font-normal">
                This device has been <strong className="text-rose-600 font-semibold">revoked / suspended</strong> by the system administrator. All accounting, sales, and database operations are currently locked on this machine.
              </p>
              <p className="text-xs text-gray-500 leading-relaxed" dir="rtl">
                دسترسی این دستگاه توسط مدیر سیستم مسدود شده است. جهت فعال‌سازی مجدد، لطفاً با مدیر سیستم در ارتباط شوید.
              </p>
            </div>

            {/* WhatsApp Contact Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 rounded-xl p-4 sm:p-5 border border-emerald-200/70 shadow-xs">
              <div className="flex items-center gap-2.5 text-emerald-800 font-semibold text-xs tracking-wider uppercase mb-3">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Contact System Administrator</span>
              </div>

              <div className="bg-white rounded-lg p-3 border border-emerald-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 font-medium">Official Admin WhatsApp</div>
                    <div className="text-base font-bold text-gray-900 tracking-wide font-mono">
                      {ADMIN_WHATSAPP_DISPLAY}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    title="Copy phone number"
                    className="h-9 px-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenWhatsApp}
                    className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Open WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Real-time Status Notice */}
            {notice && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
                  isUnlocked
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {isUnlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{notice}</span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleManualCheck}
                disabled={checking || isUnlocked}
                className="w-full h-11 bg-[#5A8F7B] hover:bg-[#4A7C6F] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                <span>{checking ? 'Checking Status with Server...' : 'Check Status Again (بررسی مجدد)'}</span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Automatic live sync enabled — this screen unlocks instantly once approved.</span>
              </div>
            </div>

            {/* Cryptographic Protection Badge */}
            <div className="pt-4 border-t border-gray-100 flex items-start gap-2.5 text-[11px] text-gray-500 bg-gray-50/80 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-4 px-6 sm:px-8">
              <Lock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="text-gray-700 font-semibold">Cryptographically Protected:</strong> License signatures are validated via asymmetric Ed25519 cryptography. Client-side tampering or local bypass is impossible without central administrator authorization.
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-4 text-xs text-gray-400">
          Hesabdar System Security &bull; Device Access Control
        </div>
      </div>
    </div>
  )
}

export default Revoke
