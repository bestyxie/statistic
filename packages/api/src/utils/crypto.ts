import CryptoJS from 'crypto-js'
import type { ExternalData } from '@statistic/shared'

// --- AES-128-ECB decrypt: returns parsed object ---
export function decryptToObject(encryptedBase64: string, keyStr: string): Record<string, unknown> {
  const keyBytes = CryptoJS.enc.Utf8.parse(keyStr)
  const decrypted = CryptoJS.AES.decrypt(encryptedBase64, keyBytes, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  return JSON.parse(CryptoJS.enc.Utf8.stringify(decrypted).toString())
}

// --- AES-128-ECB encrypt ---
export function encrypt(data: unknown, keyStr: string): string {
  const keyBytes = CryptoJS.enc.Utf8.parse(keyStr)
  const dataBytes = CryptoJS.enc.Utf8.parse(JSON.stringify(data))
  return CryptoJS.AES.encrypt(dataBytes, keyBytes, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).toString()
}

// --- Parse decrypted external data ---

export function parseExternalData(data: Record<string, unknown>): ExternalData {
  const parsed = data as unknown as ExternalData
  if (!parsed.success || !parsed.data?.vroList?.length) {
    throw new Error('数据格式异常：success 不为 true 或 vroList 为空')
  }
  return parsed
}

// --- JWT helpers ---

export async function signJWT(payload: { sub: string; exp: number }, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '')
  const data = encoder.encode(`${header}.${payloadB64}`)
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, data)
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '')
  return `${header}.${payloadB64}.${sigB64}`
}

export async function verifyJWT(token: string, secret: string): Promise<{ sub: string; exp: number }> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid token')

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
  const data = encoder.encode(`${parts[0]}.${parts[1]}`)
  const sig = Uint8Array.from(atob(parts[2]), (c) => c.charCodeAt(0))
  const valid = await crypto.subtle.verify('HMAC', key, sig, data)
  if (!valid) throw new Error('Invalid signature')

  const payload = JSON.parse(atob(parts[1]))
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired')

  return payload
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
