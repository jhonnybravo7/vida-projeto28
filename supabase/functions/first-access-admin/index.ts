import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SECRET_JSON = Deno.env.get('SUPABASE_SECRET_KEYS')
const SERVICE_KEY = SECRET_JSON ? JSON.parse(SECRET_JSON)['default'] : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ADMIN_EMAIL = 'jpcaminata@gmail.com'
const PASSWORD_FLAG = 'vida_password_change_required'
const PASSWORD_HASH = 'vida_temp_password_sha256'
const CORS = {
  'Access-Control-Allow-Origin': 'https://vida-projeto28.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function identify(req: Request) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  const { data, error } = await adminClient().auth.getUser(token)
  return error ? null : data.user
}

function isAdmin(user: any) {
  const email = String(user?.email || '').toLowerCase()
  return user?.app_metadata?.vida_admin === true ||
    (email === ADMIN_EMAIL && user?.app_metadata?.vida_role === 'master')
}

function normalizeEmail(value: unknown) {
  const email = String(value || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('invalid_email')
  return email
}

function makeTemporaryPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  const bytes = crypto.getRandomValues(new Uint8Array(30))
  return Array.from(bytes, value => chars[value % chars.length]).join('')
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

async function logAccess(admin: any, adminUser: any, targetUserId: string, email: string, action: string) {
  try {
    await admin.from('admin_access_log').insert({
      admin_user_id: adminUser.id,
      target_user_id: targetUserId,
      target_email: email,
      action,
      access_state: {
        password_change_required: action === 'issue_temporary_password',
        completed: action === 'complete_first_access',
      },
    })
  } catch (error) {
    console.error('first_access_audit_write_failed', String((error as Error)?.message || 'unknown'))
  }
}

async function issueTemporaryPassword(admin: any, adminUser: any, rawEmail: unknown) {
  const email = normalizeEmail(rawEmail)
  const { data: profile, error: profileError } = await admin.from('profiles')
    .select('id,email').ilike('email', email).maybeSingle()
  if (profileError) throw profileError
  if (!profile?.id) throw new Error('user_not_found')

  const { data: result, error: userError } = await admin.auth.admin.getUserById(profile.id)
  if (userError || !result?.user) throw new Error('user_not_found')
  const target = result.user
  if (String(target.email || '').toLowerCase() !== email) throw new Error('email_mismatch')
  if (target.last_sign_in_at) throw new Error('user_already_accessed')

  const temporaryPassword = makeTemporaryPassword()
  const appMetadata = {
    ...(target.app_metadata || {}),
    [PASSWORD_FLAG]: true,
    [PASSWORD_HASH]: await sha256(temporaryPassword),
  }
  const userMetadata = { ...(target.user_metadata || {}), vida_password_set: false }
  const { error: updateError } = await admin.auth.admin.updateUserById(target.id, {
    password: temporaryPassword,
    app_metadata: appMetadata,
    user_metadata: userMetadata,
  })
  if (updateError) throw updateError

  await logAccess(admin, adminUser, target.id, email, 'issue_temporary_password')
  return { ok: true, email, temporary_password: temporaryPassword, password_change_required: true }
}

async function completeFirstAccess(admin: any, authenticatedUser: any, rawPassword: unknown) {
  const password = String(rawPassword || '')
  if (password.length < 10 || password.length > 128) throw new Error('password_requirements')

  const appMetadata = { ...(authenticatedUser.app_metadata || {}) }
  if (appMetadata[PASSWORD_FLAG] !== true || typeof appMetadata[PASSWORD_HASH] !== 'string') {
    throw new Error('first_access_not_pending')
  }
  if (await sha256(password) === appMetadata[PASSWORD_HASH]) throw new Error('new_password_must_differ')

  const oldAppMetadata = { ...appMetadata }
  delete oldAppMetadata[PASSWORD_FLAG]
  delete oldAppMetadata[PASSWORD_HASH]
  const { error } = await admin.auth.admin.updateUserById(authenticatedUser.id, {
    password,
    app_metadata: oldAppMetadata,
    user_metadata: { ...(authenticatedUser.user_metadata || {}), vida_password_set: true },
  })
  if (error) throw error

  await logAccess(admin, authenticatedUser, authenticatedUser.id, String(authenticatedUser.email || ''), 'complete_first_access')
  return { ok: true, password_changed: true }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), { status: 405, headers: CORS })

  const authenticatedUser = await identify(req)
  if (!authenticatedUser) return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401, headers: CORS })

  try {
    const body = await req.json().catch(() => ({}))
    const admin = adminClient()
    if (body.action === 'issue') {
      if (!isAdmin(authenticatedUser)) return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403, headers: CORS })
      const result = await issueTemporaryPassword(admin, authenticatedUser, body.email)
      return new Response(JSON.stringify(result), { status: 200, headers: CORS })
    }
    if (body.action === 'complete') {
      const result = await completeFirstAccess(admin, authenticatedUser, body.new_password)
      return new Response(JSON.stringify(result), { status: 200, headers: CORS })
    }
    return new Response(JSON.stringify({ ok: false, error: 'invalid_action' }), { status: 400, headers: CORS })
  } catch (error) {
    const message = String((error as Error)?.message || 'processing_failed')
    const status = message === 'forbidden' ? 403 : 400
    return new Response(JSON.stringify({ ok: false, error: message }), { status, headers: CORS })
  }
})
