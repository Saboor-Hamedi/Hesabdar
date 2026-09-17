import { useState, useEffect } from 'react'
import { ActivationView } from './features/activation/ActivationView'

interface LicenseIdentity {
  full_name: string
  email: string
  phone: string
}

function App(): React.JSX.Element {
  const [checking, setChecking] = useState(true)
  const [licensed, setLicensed] = useState(false)
  const [identity, setIdentity] = useState<LicenseIdentity | null>(null)

  useEffect(() => {
    // Check license status from Main process on mount
    window.api?.license?.check?.().then((result: any) => {
      if (result?.valid) {
        setLicensed(true)
        setIdentity({ full_name: result.full_name, email: result.email, phone: result.phone })
      }
      setChecking(false)
    }).catch(() => {
      setChecking(false)
    })

    // Listen for revocation
    const offRevoked = window.api?.license?.onRevoked?.(() => {
      setLicensed(false)
      setIdentity(null)
    })

    return () => {
      offRevoked?.()
    }
  }, [])

  function handleActivated(newIdentity: LicenseIdentity) {
    setIdentity(newIdentity)
    setLicensed(true)
  }

  // While checking license, show blank (avoid flash of wrong content)
  if (checking) {
    return (
      <div className="fixed inset-0 bg-[#F0F5F3] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#5A8F7B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // If not licensed, show activation screen
  if (!licensed) {
    return <ActivationView onActivated={handleActivated} />
  }

  // Licensed — render main POS app
  // TODO: Replace this placeholder with your actual router/layout
  return (
    <div className="flex items-center justify-center h-screen bg-[#F8F9FA]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">Hesabdar POS</h1>
        {identity && (
          <p className="text-sm text-gray-500 mt-1">Welcome, {identity.full_name}</p>
        )}
        <p className="text-xs text-gray-400 mt-4">Main app loads here</p>
      </div>
    </div>
  )
}

export default App
