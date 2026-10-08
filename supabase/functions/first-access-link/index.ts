import { createClient } from 'npm:@supabase/supabase-js@2.58.0'
const URL=Deno.env.get('SUPABASE_URL')!
const keys=Deno.env.get('SUPABASE_SECRET_KEYS')
const KEY=keys?JSON.parse(keys).default:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP='https://vida-projeto28.vercel.app'
const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':APP,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'}
const admin=createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}})
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers})
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('')
const emailOf=(v:unknown)=>String(v||'').trim().toLowerCase()
async function eligible(id:string){
 const {data,error}=await admin.from('feature_access').select('base_access').eq('user_id',id).maybeSingle()
 return !error && data?.base_access===true
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers})
 if(req.method!=='POST')return reply({ok:false,error:'method_not_allowed'},405)
 try{
  const body=await req.json()
  const email=emailOf(body.email)
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return reply({ok:false,error:'invalid_email'},400)
  if(body.action==='issue'){
   const jwt=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'')
   const {data:actor,error:authError}=await admin.auth.getUser(jwt)
   const u=actor?.user
   if(authError||!u||!(u.app_metadata?.vida_admin===true||(u.email==='jpcaminata@gmail.com'&&u.app_metadata?.vida_role==='master')))return reply({ok:false,error:'forbidden'},403)
   const {data:p}=await admin.from('profiles').select('id').eq('email',email).maybeSingle()
   if(!p||!await eligible(p.id))return reply({ok:false,error:'no_access'},400)
   const {data:t}=await admin.auth.admin.getUserById(p.id)
   if(!t.user||t.user.last_sign_in_at)return reply({ok:false,error:'already_accessed'},400)
   const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('')
   const expires=new Date(Date.now()+86400000).toISOString()
   const {error}=await admin.from('first_access_links').insert({token_hash:await hash(token),user_id:p.id,email,expires_at:expires,created_by:u.id})
   if(error)throw error
   await admin.from('admin_access_log').insert({admin_user_id:u.id,target_user_id:p.id,target_email:email,action:'issue_first_access_link',access_state:{expires_at:expires}})
   return reply({ok:true,url:APP+'/ativar#'+token,expires_at:expires})
  }
  if(body.action!=='redeem')return reply({ok:false,error:'invalid_action'},400)
  const token=String(body.token||''),password=String(body.password||'')
  if(!/^[a-f0-9]{64}$/.test(token))return reply({ok:false,error:'invalid_link'},400)
  if(password.length<6||password.length>128)return reply({ok:false,error:'password_requirements'},400)
  const digest=await hash(token)
  const {data:link,error}=await admin.from('first_access_links').select('*').eq('token_hash',digest).eq('email',email).is('consumed_at',null).gt('expires_at',new Date().toISOString()).maybeSingle()
  if(error||!link)return reply({ok:false,error:'invalid_link'},400)
  const {data:target,error:targetError}=await admin.auth.admin.getUserById(link.user_id)
  if(targetError||!target.user||emailOf(target.user.email)!==email||target.user.last_sign_in_at||!await eligible(link.user_id))return reply({ok:false,error:'invalid_link'},400)
  // Atomic claim: a link can only be redeemed once, including concurrent requests.
  const claimedAt=new Date().toISOString()
  const {data:claim,error:claimError}=await admin.from('first_access_links').update({consumed_at:claimedAt}).eq('token_hash',digest).is('consumed_at',null).gt('expires_at',claimedAt).select('user_id').maybeSingle()
  if(claimError||!claim)return reply({ok:false,error:'invalid_link'},400)
  const {error:updateError}=await admin.auth.admin.updateUserById(link.user_id,{password,email_confirm:true,user_metadata:{...target.user.user_metadata,vida_password_set:true}})
  if(updateError){
   // Only a definitive password rejection is safe to retry; unknown failures stay consumed.
   if(updateError.status===422||updateError.code==='weak_password'){
    await admin.from('first_access_links').update({consumed_at:null}).eq('token_hash',digest).eq('consumed_at',claimedAt)
    return reply({ok:false,error:'password_rejected'},400)
   }
   return reply({ok:false,error:'activation_failed'},400)
  }
  await admin.from('first_access_links').update({consumed_at:claimedAt}).eq('user_id',link.user_id).is('consumed_at',null)
  // No email is sent. Existing app login persists the returned session in this browser.
  const client=createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:login,error:loginError}=await client.auth.signInWithPassword({email,password})
  await admin.from('admin_access_log').insert({target_user_id:link.user_id,target_email:email,action:'complete_first_access_link',access_state:{password_set:true}})
  if(loginError||!login.session)return reply({ok:true,login_required:true})
  return reply({ok:true,session:{access_token:login.session.access_token,refresh_token:login.session.refresh_token}})
 }catch{return reply({ok:false,error:'request_failed'},400)}
})
