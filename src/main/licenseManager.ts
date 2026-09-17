/**
 * licenseManager.ts — Electron Main Process License Manager
 *
 * Security model:
 * - Ed25519 public key only ships in binary (cannot forge signatures)
 * - Private key lives exclusively in Supabase Edge Function (never ships)
 * - safeStorage (DPAPI) binds encrypted blob to this machine
 * - Copying registry/file to another machine = won't decrypt
 * - HWID = SHA-256(motherboard_uuid + ':' + cpu_id) — never shown to user
 */

import { safeStorage, app } from 'electron'
import { execSync } from 'child_process'
import { createHash, createVerify } from 'crypto'
import { join } from 'path'
import { promises as fs } from 'fs'

// ---------------------------------------------------------------------------
// Ed25519 Public Key — baked in at build time, safe to ship
// Generate your keypair once with:
//   node -e "const {generateKeyPairSync}=require('crypto');
//   const {publicKey,privateKey}=generateKeyPairSync('ed25519');
//   console.log(publicKey.export({type:'spki',format:'pem'}));
//   console.log('PRIVATE (Supabase only):');
//   console.log(privateKey.export({type:'pkcs8',format:'pem'}))"
// Put the PUBLIC key here. Put the PRIVATE key only in Supabase Edge Function secrets.
// ---------------------------------------------------------------------------
const HESABDAR_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA4+a12WC8cNIk6ni7EhmKw9FeOr0HZ+QHLDLGWdjxMDU=
-----END PUBLIC KEY-----`

// License stored as encrypted binary in AppData (DPAPI machine-bound)
function getLicenseFilePath(): string {
  return join(app.getPath('userData'), 'system.lic')
}

// Stable fallback device ID stored in AppData if WMI fails
function getFallbackHWID(): string {
  const fallbackPath = join(app.getPath('userData'), 'device.id')
  try {
    return require('fs').readFileSync(fallbackPath, 'utf-8').trim()
  } catch {
    const { randomBytes } = require('crypto')
    const id = createHash('sha256').update(randomBytes(32)).digest('hex')
    require('fs').writeFileSync(fallbackPath, id, 'utf-8')
    return id
  }
}

// ---------------------------------------------------------------------------
// HWID Generation — silent, never shown to user
// Motherboard UUID + CPU ProcessorId -> SHA-256
// Drive serial intentionally excluded (breaks on SSD swap)
// ---------------------------------------------------------------------------
export function generateHWID(): string {
  try {
    const mb = execSync(
      `powershell -NoProfile -NonInteractive -Command "(Get-WmiObject Win32_ComputerSystemProduct).UUID"`,
      { timeout: 6000, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true }
    ).toString().trim()

    const cpu = execSync(
      `powershell -NoProfile -NonInteractive -Command "(Get-WmiObject Win32_Processor).ProcessorId"`,
      { timeout: 6000, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true }
    ).toString().trim()

    const isValid = (v: string) =>
      v.length > 4 &&
      !['to be filled', 'default string', 'none', 'n/a', '00000000', 'ffffffff']
        .some(bad => v.toLowerCase().includes(bad))

    if (!isValid(mb) && !isValid(cpu)) return getFallbackHWID()

    const raw = `${isValid(mb) ? mb : 'MB_UNKNOWN'}:${isValid(cpu) ? cpu : 'CPU_UNKNOWN'}`
    return createHash('sha256').update(raw).digest('hex')
  } catch {
    return getFallbackHWID()
  }
}

// ---------------------------------------------------------------------------
// License payload types
// ---------------------------------------------------------------------------
export interface LicensePayload {
  hwid: string
  full_name: string
  email: string
  phone: string
  activated_at: string
  signature: string // Ed25519 signature from Supabase Edge Function
}

export interface LicenseCheckResult {
  valid: boolean
  full_name?: string
  email?: string
  phone?: string
  hwid?: string
  reason?: string
}

// ---------------------------------------------------------------------------
// Verify Ed25519 signature — attacker cannot forge without private key
// ---------------------------------------------------------------------------
function verifySignature(payload: Omit<LicensePayload, 'signature'>, signature: string): boolean {
  try {
    const message = `${payload.hwid}|${payload.full_name}|${payload.email}|${payload.phone}|${payload.activated_at}`
    const verify = createVerify('ed25519')
    verify.update(message)
    return verify.verify(HESABDAR_PUBLIC_KEY, Buffer.from(signature, 'base64'))
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Save license to disk (encrypted with DPAPI via safeStorage)
// ---------------------------------------------------------------------------
export async function saveLicense(payload: LicensePayload): Promise<void> {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('safeStorage (DPAPI) not available on this system')
  }
  const json = JSON.stringify(payload)
  const encrypted = safeStorage.encryptString(json)
  await fs.writeFile(getLicenseFilePath(), encrypted)
}

// ---------------------------------------------------------------------------
// Check license — decrypt, verify signature, verify HWID binding
// ---------------------------------------------------------------------------
export async function checkLicense(): Promise<LicenseCheckResult> {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      return { valid: false, reason: 'encryption_unavailable' }
    }

    let encrypted: Buffer
    try {
      encrypted = await fs.readFile(getLicenseFilePath())
    } catch {
      return { valid: false, reason: 'no_license' }
    }

    let json: string
    try {
      json = safeStorage.decryptString(encrypted)
    } catch {
      return { valid: false, reason: 'decrypt_failed' }
    }

    let payload: LicensePayload
    try {
      payload = JSON.parse(json)
    } catch {
      return { valid: false, reason: 'parse_failed' }
    }

    if (!payload.hwid || !payload.full_name || !payload.email ||
        !payload.phone || !payload.activated_at || !payload.signature) {
      return { valid: false, reason: 'incomplete_payload' }
    }

    // Machine binding check — license cannot be copied to another machine
    const currentHWID = generateHWID()
    if (payload.hwid !== currentHWID) {
      return { valid: false, reason: 'hwid_mismatch' }
    }

    // Ed25519 signature verification — tamper detection
    const { signature, ...rest } = payload
    if (!verifySignature(rest, signature)) {
      return { valid: false, reason: 'invalid_signature' }
    }

    return {
      valid: true,
      full_name: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      hwid: payload.hwid
    }
  } catch {
    return { valid: false, reason: 'unknown_error' }
  }
}

// ---------------------------------------------------------------------------
// Background revocation check — non-blocking, runs after app starts
// Treats no-internet/timeout as fine. Only locks on explicit 'revoked'.
// ---------------------------------------------------------------------------
export async function backgroundRevocationCheck(
  hwid: string,
  supabaseUrl: string,
  supabaseKey: string,
  onRevoked: () => void
): Promise<void> {
  try {
    if (!supabaseUrl || !supabaseKey) return
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('devices')
      .select('status')
      .eq('hwid', hwid)
      .single()

    if (error) return // Network unavailable or other error — keep running
    if (data?.status === 'revoked') {
      onRevoked()
    }
  } catch {
    // Network unavailable — treat as fine
  }
}
