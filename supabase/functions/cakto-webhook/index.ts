import { createClient } from 'npm:@supabase/supabase-js@2'

const APP_URL = 'https://vida-projeto28.vercel.app'
const TOLERANCE_SECONDS = 5 * 60
const ACCESS_EVENTS = new Set(['purchase_approved','subscription_renewed','subscription_resumed','subscription_late_recovered'])
const REVOKE_EVENTS = new Set(['refund','chargeback'])
const ACCOUNT_EVENTS = new Set([...ACCESS_EVENTS, ...REVOKE_EVENTS, 'subscription_canceled'])

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL')!
  const secretJson = Deno.env.get('SUPABASE_SECRET_KEYS')
  const key = secretJson ? JSON.parse(secretJson)['default'] : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(url, key, { auth: { autoRefreshToken:false, persistSession:false } })
}

async function verifyCakto(admin:any, raw:string, timestamp:string|null, signature:string|null) {
  if (!timestamp || !signature) return false
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now()/1000-ts) > TOLERANCE_SECONDS) return false
  const { data, error } = await admin.rpc('verify_cakto_signature',{p_raw:raw,p_timestamp:timestamp,p_signature:signature})
  if (error) throw error
  return data === true
}

function eventKey(event:string,data:any) {
  if (data?.id) return `${event}:${data.id}`
  return `${event}:${data?.customer?.email || data?.customerEmail || 'unknown'}:${data?.product?.id || data?.offer?.id || 'unknown'}:${data?.createdAt || 'unknown'}`
}

function safePayload(event:string,data:any) {
  return {
    event,
    order_id: data?.id ? String(data.id) : null,
    product_id: data?.product?.id ? String(data.product.id) : null,
    product_name: data?.product?.name ? String(data.product.name).slice(0,160) : null,
    offer_id: data?.offer?.id ? String(data.offer.id) : null,
    customer_email: data?.customer?.email ? String(data.customer.email).trim().toLowerCase() : null,
    status: data?.status ? String(data.status).slice(0,80) : null,
    amount: data?.amount ?? null,
    created_at: data?.createdAt || null,
    paid_at: data?.paidAt || null
  }
}

async function beginEvent(admin:any,event:string,data:any) {
  const key=eventKey(event,data), payload=safePayload(event,data)
  const { data:existing }=await admin.from('integration_events').select('id,status').eq('provider','cakto').eq('event_key',key).maybeSingle()
  if(existing && ['processed','ignored'].includes(existing.status)) return {key,duplicate:true}
  if(existing){
    const {error}=await admin.from('integration_events').update({payload,event_type:event,status:'received',processed_at:null,error_message:null}).eq('id',existing.id)
    if(error)throw error
    return {key,duplicate:false}
  }
  const {error}=await admin.from('integration_events').insert({provider:'cakto',event_key:key,event_type:event,payload,status:'received'})
  if(error)throw error
  return {key,duplicate:false}
}

async function markEvent(admin:any,key:string,status:string,errorMessage:string|null=null){
  await admin.from('integration_events').update({status,processed_at:new Date().toISOString(),error_message:errorMessage}).eq('provider','cakto').eq('event_key',key)
}

async function findUser(admin:any,email:string){
  const {data}=await admin.from('profiles').select('id').ilike('email',email).limit(1).maybeSingle()
  return data?.id || null
}

async function ensureUser(admin:any,email:string,name?:string){
  const found=await findUser(admin,email)
  if(found)return found
  const {data,error}=await admin.auth.admin.createUser({email,email_confirm:true,user_metadata:{full_name:name || email.split('@')[0]}})
  if(error){
    const retry=await findUser(admin,email)
    if(retry)return retry
    throw error
  }
  return data.user.id
}

async function ensureProfile(admin:any,userId:string,email:string,name?:string){
  const {error}=await admin.from('profiles').upsert({
    id:userId,email,full_name:name || email.split('@')[0],updated_at:new Date().toISOString()
  },{onConflict:'id'})
  if(error)throw error
}

async function setGrant(admin:any,userId:string,entitlement:any,enabled:boolean){
  const patch:Record<string,boolean|string>={user_id:userId}
  if(entitlement.grants_base)patch.base_access=enabled
  if(entitlement.grants_planner)patch.planner_access=enabled
  if(entitlement.grants_gymrats)patch.gymrats_access=enabled
  const {error}=await admin.from('feature_access').upsert(patch,{onConflict:'user_id'})
  if(error)throw error
}

async function ensureEnrollment(admin:any,userId:string,entitlement:any,enabled:boolean){
  if(!entitlement.grants_base)return
  if(enabled){
    const {error}=await admin.from('enrollments').upsert({
      user_id:userId,program_slug:'projeto-28',start_date:brasiliaDate(),status:'active'
    },{onConflict:'user_id,program_slug',ignoreDuplicates:false})
    if(error)throw error
  } else {
    const {error}=await admin.from('enrollments').update({status:'revoked'}).eq('user_id',userId).eq('program_slug','projeto-28')
    if(error)throw error
  }
}

async function processOrder(admin:any,event:string,data:any){
  const started=await beginEvent(admin,event,data)
  if(started.duplicate)return {duplicate:true}
  const key=started.key
  try{
    if(event==='checkout_abandonment'){
      await markEvent(admin,key,'processed')
      return {processed:true,commercial_only:true}
    }

    const productId=data?.product?.id
    if(!productId){
      await markEvent(admin,key,'ignored','missing_product_id')
      return {ignored:true}
    }

    const {data:entitlement}=await admin.from('product_entitlements').select('*').eq('provider','cakto').eq('provider_product_id',String(productId)).eq('active',true).maybeSingle()
    if(!entitlement){
      await markEvent(admin,key,'ignored','product_not_mapped')
      return {ignored:true,product_id:String(productId)}
    }

    if(!ACCOUNT_EVENTS.has(event)){
      await markEvent(admin,key,'processed')
      return {processed:true,access_changed:false}
    }

    const email=String(data?.customer?.email || '').trim().toLowerCase()
    if(!email)throw new Error('missing_customer_email')

    let userId:string|null=null
    if(ACCESS_EVENTS.has(event))userId=await ensureUser(admin,email,data?.customer?.name)
    else userId=await findUser(admin,email)

    if(!userId){
      await markEvent(admin,key,'processed','user_not_found_for_non_activation_event')
      return {processed:true,access_changed:false}
    }

    if(ACCESS_EVENTS.has(event)){
      await ensureProfile(admin,userId,email,data?.customer?.name)
      await setGrant(admin,userId,entitlement,true)
      await ensureEnrollment(admin,userId,entitlement,true)
    }
    if(REVOKE_EVENTS.has(event)){
      await setGrant(admin,userId,entitlement,false)
      await ensureEnrollment(admin,userId,entitlement,false)
    }

    const status=REVOKE_EVENTS.has(event)?'revoked':event==='subscription_canceled'?'canceled':ACCESS_EVENTS.has(event)?'active':String(data?.status||event)
    const {error:subError}=await admin.from('subscriptions').upsert({
      user_id:userId,
      provider:'cakto',
      provider_customer_id:data?.customer?.id ? String(data.customer.id) : null,
      provider_order_id:String(data?.id || key),
      product_slug:entitlement.product_slug,
      status,
      amount_cents:data?.amount!=null?Math.round(Number(data.amount)*100):null,
      billing_type:'one_time',
      started_at:data?.paidAt || data?.createdAt || null,
      canceled_at:event==='subscription_canceled' ? (data?.canceledAt || new Date().toISOString()) : null,
      updated_at:new Date().toISOString()
    },{onConflict:'provider,provider_order_id'})
    if(subError)throw subError

    await markEvent(admin,key,'processed')
    return {processed:true,product:entitlement.product_slug,access_changed:ACCESS_EVENTS.has(event)||REVOKE_EVENTS.has(event)}
  }catch(e){
    await markEvent(admin,key,'error','processing_failed')
    throw e
  }
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return Response.json({ok:false,error:'method_not_allowed'},{status:405})
  const admin=adminClient()
  const raw=await req.text()

  try{
    const verified=await verifyCakto(admin,raw,req.headers.get('X-Cakto-Timestamp'),req.headers.get('X-Cakto-Signature'))
    if(!verified)return Response.json({ok:false,error:'invalid_signature'},{status:401})
  }catch{
    return Response.json({ok:false,error:'verification_failed'},{status:500})
  }

  let payload:any
  try{payload=JSON.parse(raw)}catch{return Response.json({ok:false,error:'invalid_json'},{status:400})}
  if(!payload?.event || payload?.data==null)return Response.json({ok:false,error:'invalid_payload'},{status:400})

  const orders=Array.isArray(payload.data)?payload.data:[payload.data]
  const results=[]
  try{
    for(const order of orders)results.push(await processOrder(admin,payload.event,order))
    return Response.json({ok:true,app:APP_URL,results},{status:200})
  }catch{
    return Response.json({ok:false,error:'processing_failed'},{status:500})
  }
})

function brasiliaDate(value=new Date()) {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value);
  const get=(type:string)=>parts.find(p=>p.type===type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

