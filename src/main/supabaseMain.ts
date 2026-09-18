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

// Subscribe to device lifecycle changes (approval AND revocation) in Realtime
export function subscribeToDeviceLifecycle(
  hwid: string,
  callbacks: {
    onApproved: (licenseToken: string) => void
    onRevoked: () => void
    onStatusChange?: (status: string) => void
  }
): void {
  const sb = getClient()

  if (activeChannel) {
    sb.removeChannel(activeChannel)
    activeChannel = null
  }

  activeChannel = sb
    .channel(`device-lifecycle-${hwid}`)
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
        if (!newRow || newRow.hwid !== hwid) return

        callbacks.onStatusChange?.(newRow.status)

        // Immediate revocation: if status is revoked/rejected or is_approved is false
        if (newRow.status === 'revoked' || newRow.status === 'rejected' || newRow.is_approved === false) {
          callbacks.onRevoked()
          return
        }

        // Immediate approval: if status is approved AND is_approved is true
        if (newRow.status === 'approved' && newRow.is_approved === true) {
          if (newRow.license_token) {
            callbacks.onApproved(newRow.license_token)
          } else {
            requestApprovalToken(newRow).then((token) => {
              if (token) callbacks.onApproved(token)
            })
          }
        }
      }
    )
    .subscribe()
}

// Backwards-compatible wrapper for request-activation flow
export function subscribeToApproval(
  hwid: string,
  onApproved: (licenseToken: string) => void,
  onStatusChange?: (status: string) => void
): void {
  subscribeToDeviceLifecycle(hwid, {
    onApproved,
    onRevoked: () => {},
    onStatusChange
  })
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

// ── Admin Functions ──────────────────────────────────────────────────────────

let allDevicesChannel: RealtimeChannel | null = null

// Fetch all registered devices ordered by creation date
export async function getAllDevices(): Promise<any[]> {
  try {
    const sb = getClient()
    const { data, error } = await sb
      .from('devices')
      .select('id, hwid, full_name, email, phone, machine_name, os_platform, app_version, status, is_approved, is_admin, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(2000)
    if (error) {
      console.error('getAllDevices error:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.error('getAllDevices exception:', err)
    return []
  }
}

// Admin approves a device: calls Edge Function to mint Ed25519 token & update status
export async function approveDeviceByAdmin(hwid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const device = await getDeviceRecord(hwid)
    if (!device) return { success: false, error: 'Device not found' }

    const token = await requestApprovalToken(device)
    const sb = getClient()
    const updatePayload: any = { status: 'approved', is_approved: true }
    if (token) {
      updatePayload.license_token = token
    }
    const { error } = await sb
      .from('devices')
      .update(updatePayload)
      .eq('hwid', hwid)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Approval failed' }
  }
}

// Admin revokes a device: sets status to revoked, is_approved to false, license_token to null
export async function revokeDeviceByAdmin(hwid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = getClient()
    const { data, error } = await sb
      .from('devices')
      .update({ status: 'revoked', is_approved: false, license_token: null })
      .eq('hwid', hwid)
      .select('hwid, status, is_approved')
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Supabase RLS blocked the update. Please execute the SQL policy in Supabase SQL Editor to allow UPDATE on devices table.'
      }
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Revocation failed' }
  }
}

// Admin deletes a device record from Supabase
export async function deleteDeviceByAdmin(hwid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = getClient()
    const { data, error } = await sb
      .from('devices')
      .delete()
      .eq('hwid', hwid)
      .select('hwid')
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Supabase RLS blocked the delete. Please execute the SQL policy in Supabase SQL Editor to allow DELETE on devices table.'
      }
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Deletion failed' }
  }
}

// Subscribe to Realtime changes across all devices (for live admin table updates)
export function subscribeToAllDevices(onChange: () => void): void {
  const sb = getClient()
  if (allDevicesChannel) {
    sb.removeChannel(allDevicesChannel)
    allDevicesChannel = null
  }

  allDevicesChannel = sb
    .channel('admin-all-devices')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'devices'
      },
      () => {
        onChange()
      }
    )
    .subscribe()
}

// Unsubscribe Realtime admin channel
export function unsubscribeAllDevices(): void {
  if (allDevicesChannel && client) {
    client.removeChannel(allDevicesChannel)
    allDevicesChannel = null
  }
}

export { SUPABASE_URL, SUPABASE_KEY }
