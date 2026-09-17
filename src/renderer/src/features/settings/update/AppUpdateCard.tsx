import { useState, useEffect } from 'react'
import {
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowUpCircle,
  HardDrive
} from 'lucide-react'
import { Version } from '../../../components/Version'

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
}

interface DownloadProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export function AppUpdateCard() {
  const [status, setStatus] = useState<UpdateStatus>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    // Listen to status updates
    const offStatus = window.api?.update?.onStatusChange?.((newStatus: UpdateStatus, data?: any) => {
      setStatus(newStatus)
      if (newStatus === 'available' && data) {
        setUpdateInfo(data)
      } else if (newStatus === 'downloaded' && data) {
        setUpdateInfo(data)
      } else if (newStatus === 'error' && data) {
        setErrorMessage(data.message || 'An unexpected error occurred during update.')
      }
    })

    // Listen to progress updates
    const offProgress = window.api?.update?.onProgress?.((p: DownloadProgress) => {
      setStatus('downloading')
      setProgress(p)
    })

    return () => {
      offStatus?.()
      offProgress?.()
    }
  }, [])

  const handleCheckForUpdates = async () => {
    setStatus('checking')
    setErrorMessage(null)
    const res = await window.api?.update?.check?.()
    if (!res?.success && res?.error) {
      setStatus('error')
      setErrorMessage(res.error)
    }
  }

  const handleDownloadUpdate = async () => {
    setStatus('downloading')
    setErrorMessage(null)
    const res = await window.api?.update?.download?.()
    if (!res?.success && res?.error) {
      setStatus('error')
      setErrorMessage(res.error)
    }
  }

  const handleRestartAndInstall = () => {
    window.api?.update?.install?.()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/70 p-5 shadow-xs transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#5A8F7B]/10 text-[#5A8F7B]">
            <RefreshCw className={`w-5 h-5 ${status === 'checking' ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-800">Software Updates</h3>
              <Version showBadge />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Check for new features, improvements, and security updates
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <div>
          {status === 'idle' || status === 'checking' || status === 'not-available' || status === 'error' ? (
            <button
              onClick={handleCheckForUpdates}
              disabled={status === 'checking'}
              className="px-3.5 py-1.5 rounded-lg bg-[#5A8F7B] hover:bg-[#4A7C6F] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${status === 'checking' ? 'animate-spin' : ''}`} />
              {status === 'checking' ? 'Checking...' : 'Check for Updates'}
            </button>
          ) : null}

          {status === 'available' ? (
            <button
              onClick={handleDownloadUpdate}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm animate-pulse"
            >
              <Download className="w-3.5 h-3.5" />
              Download v{updateInfo?.version}
            </button>
          ) : null}

          {status === 'downloaded' ? (
            <button
              onClick={handleRestartAndInstall}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Restart & Install Now
            </button>
          ) : null}
        </div>
      </div>

      {/* State Feedback Banners */}
      {status !== 'idle' && status !== 'checking' && (
        <div className="mt-4">

        {status === 'not-available' && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Hesabdar is up to date (version <Version prefix="" />).</span>
          </div>
        )}

        {status === 'available' && updateInfo && (
          <div className="flex flex-col gap-2 text-xs text-blue-900 bg-blue-50/80 p-3.5 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 font-semibold">
              <ArrowUpCircle className="w-4 h-4 text-blue-600" />
              <span>A new version is available: v{updateInfo.version}</span>
            </div>
            {updateInfo.releaseNotes && (
              <div
                className="text-[11px] text-blue-800/80 max-h-24 overflow-y-auto pl-6 border-l-2 border-blue-200 mt-1"
                dangerouslySetInnerHTML={{ __html: String(updateInfo.releaseNotes) }}
              />
            )}
          </div>
        )}

        {status === 'downloading' && (
          <div className="flex flex-col gap-2 bg-gray-50 p-3.5 rounded-lg border border-gray-200/80">
            <div className="flex items-center justify-between text-xs font-medium text-gray-700">
              <span className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-[#5A8F7B] animate-bounce" />
                Downloading update...
              </span>
              <span>{progress?.percent ?? 0}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#5A8F7B] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress?.percent ?? 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                {formatBytes(progress?.transferred ?? 0)} / {formatBytes(progress?.total ?? 0)}
              </span>
              <span>{formatBytes(progress?.bytesPerSecond ?? 0)}/s</span>
            </div>
          </div>
        )}

        {status === 'downloaded' && (
          <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 p-3.5 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">
                Update v{updateInfo?.version || ''} is downloaded and ready!
              </span>
            </div>
            <span className="text-[11px] text-emerald-600">
              Restart will take a few seconds
            </span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-100">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Failed to check or download update</p>
              <p className="text-[11px] text-rose-600 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  )
}
