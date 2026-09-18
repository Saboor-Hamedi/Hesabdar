/**
 * supabaseMain.ts — Supabase client for Electron Main process only
 *
 * IMPORTANT: This file runs in Main process only.
 * Keys are loaded from .env — never sent to the Renderer.
 *
 * Supabase URL:  SUPABASE_URL
 * Supabase Key:  SUPABASE_PUBLISHABLE_KEY
 *
 * Responsibilities:
 * - signInAnonymously() — gives each device a stable auth.uid for RLS
 * - registerDevice() — INSERT into devices table
 * - subscribeToApproval() — isolated Realtime channel per HWID
 *
 * WEBHOOK NOTE:
 * The Supabase Edge Function 'approve-device' must be manually triggered
 * via a Database Webhook in the Supabase dashboard:
 *   Dashboard -> Database -> Webhooks -> New Webhook
 *   Table: devices | Event: UPDATE | URL: <your Edge Function URL>
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { RealtimeChannel } from '@supabase/supabase-js'
import os from 'os'
import fs from 'fs'
import path from 'path'

function resolveEnv(): { url: string; key: string } {
  let url = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'] || ''
  let key = process.env['SUPABASE_PUBLISHABLE_KEY'] || process.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || ''

  if (!url || !key) {
    const candidates = [
      path.join(process.cwd(), '.env'),
      path.join(__dirname, '../../.env'),
      path.join(__dirname, '../.env')
    ]
    for (const file of candidates) {
      try {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf-8')
          for (const line of content.split('\n')) {
            const m = line.trim().match(/^([^#=]+)=(.*)$/)
            if (m) {
              const k = m[1].trim()
              const v = m[2].trim().replace(/^['"]|['"]$/g, '')
              if (k === 'SUPABASE_URL' || k === 'VITE_SUPABASE_URL') url = url || v
              if (k === 'SUPABASE_PUBLISHABLE_KEY' || k === 'VITE_SUPABASE_PUBLISHABLE_KEY') key = key || v
            }
          }
        }
      } catch {}
    }
  }

  // Guaranteed project defaults
  if (!url) url = 'https://pzzxzlksrnhepytzaqqf.supabase.co'
  if (!key) key = 'sb_publishable_-aJBCtxX8A5ULZK6QKy9DA_e7eTMpbt'

  return { url, key }
}

const env = resolveEnv()
const SUPABASE_URL = env.url
const SUPABASE_KEY = env.key

let client: SupabaseClient | null = null
let anonymousUid: string | null = null
let activeChannel: RealtimeChannel | null = null

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    })
  }
  return client
}

// Sign in anonymously — each device gets a stable auth.uid for RLS policies
export async function signInAnonymously(): Promise<string | null> {
  try {
    const sb = getClient()
    const { data, error } = await sb.auth.signInAnonymously()
    if (error || !data.user) return null
    anonymousUid = data.user.id
    return anonymousUid
  } catch {
    return null
  }
}

// Register device — INSERT into devices table
export async function registerDevice(params: {
  hwid: string
  full_name: string
  email: string
  phone: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = getClient()
    const { error } = await sb.from('devices').insert({
      owner_id: anonymousUid,
      hwid: params.hwid,
      full_name: params.full_name,
      email: params.email,
      phone: params.phone,
      machine_name: os.hostname(),
      os_platform: `${os.type()} ${os.release()}`,
      app_version: process.env['npm_package_version'] || '1.0.0',
      status: 'pending'
    })

    if (error) {
      // If already registered (unique constraint), that's fine — just waiting
      if (error.code === '23505') return { success: true }
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error' }
  }
}

// Subscribe to approval — isolated Realtime channel filtered to this exact HWID
export function subscribeToApproval(
  hwid: string,
  onApproved: (licenseToken: string) => void,
  onStatusChange?: (status: string) => void
): void {
  const sb = getClient()

  // Clean up any existing channel
  if (activeChannel) {
    sb.removeChannel(activeChannel)
    activeChannel = null
  }

  activeChannel = sb
    .channel(`device-approval-${hwid}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'devices',
        filter: `hwid=eq.${hwid}`
      },
      (payload) => {
        const newRow = payload.new as any

        // Extra safety: verify this packet is truly for our machine
        if (newRow?.hwid !== hwid) return

        onStatusChange?.(newRow.status)

        if (newRow.status === 'approved' || newRow.is_approved) {
          if (newRow.license_token) {
            onApproved(newRow.license_token)
          } else {
            // Admin approved in Supabase Table Editor without webhook — trigger token generation
            requestApprovalToken(newRow).then((token) => {
              if (token) onApproved(token)
            })
          }
        }
      }
    )
    .subscribe()
}

// Clean up Realtime channel
export function unsubscribeApproval(): void {
  if (activeChannel && client) {
    client.removeChannel(activeChannel)
    activeChannel = null
  }
}

// Trigger Edge Function to generate & sign license token if admin approved in dashboard
export async function requestApprovalToken(device: {
  hwid: string
  full_name: string
  email: string
  phone: string
}): Promise<string | null> {
  try {
    const url = `${SUPABASE_URL}/functions/v1/approve-device`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        record: {
          hwid: device.hwid,
          full_name: device.full_name,
          email: device.email,
          phone: device.phone,
          status: 'approved'
        }
      })
    })
    if (!res.ok) {
      console.error('approve-device edge function returned status:', res.status)
      return null
    }
    // Re-fetch updated row from devices table to get license_token
    const updated = await getDeviceRecord(device.hwid)
    return updated?.license_token || null
  } catch (err) {
    console.error('requestApprovalToken error:', err)
    return null
  }
}

// Check activation status once (for background revocation check)
export async function checkDeviceStatus(hwid: string): Promise<string | null> {
  try {
    const sb = getClient()
    const { data, error } = await sb
      .from('devices')
      .select('status')
      .eq('hwid', hwid)
      .single()
    if (error) return null
    return data?.status || null
  } catch {
    return null
  }
}

// Fetch full device record by hwid
export async function getDeviceRecord(hwid: string): Promise<any | null> {
  try {
    const sb = getClient()
    const { data, error } = await sb
      .from('devices')
      .select('*')
      .eq('hwid', hwid)
      .maybeSingle()
    if (error) return null
    return data
  } catch {
    return null
  }
}

export { SUPABASE_URL, SUPABASE_KEY }
