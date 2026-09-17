import { useState, useEffect } from 'react'

interface VersionProps {
  prefix?: string
  suffix?: string
  className?: string
  showBadge?: boolean
}

export function Version({ prefix = 'v', suffix = '', className = '', showBadge = false }: VersionProps) {
  // Read dynamic package.json version via Vite define, with live update from main process
  const buildVersion = (import.meta as any).env?.PACKAGE_VERSION || '1.0.0'
  const [version, setVersion] = useState<string>(buildVersion)

  useEffect(() => {
    // Check if main process has a live version
    window.api?.update?.getVersion?.().then((v: string) => {
      if (v) setVersion(v)
    })
  }, [])

  if (showBadge) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200 ${className}`}>
        {prefix}{version}{suffix}
      </span>
    )
  }

  return <span className={className}>{prefix}{version}{suffix}</span>
}

export default Version
