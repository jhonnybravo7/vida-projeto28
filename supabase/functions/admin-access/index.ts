import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || ''
const SECRET_JSON = Deno.env.get('SUPABASE_SECRET_KEYS')
const SERVICE_KEY = SECRET_JSON ? JSON.parse(SECRET_JSON)['default'] : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const cors = {
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Content-Type':'application/json'
}

function adminClient(){
  return createClient(SUPABASE_URL,SERVICE_KEY,{auth:{autoRefreshToken:false,persistSession:false}})
}

async function requireAdmin(req:Request){
  const auth=req.headers.get('Authorization')||''
  const token=auth.replace(/^Bearer\s+/i,'').trim()
  if(!token) return null
  const admin=adminClient()
  const {data,error}=await admin.auth.getUser(token)
  if(error||!data.user) return null
  const u=data.user
  const email=String(u.email||'').toLowerCase()
  const allowed = u.app_metadata?.vida_admin===true || (email==='jpcaminata@gmail.com' && u.app_metadata?.vida_role==='master')
  if(!allowed) return null
  return u
}

function normEmail(v:any){
  const e=String(v||'').trim().toLowerCase()
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error('invalid_email')
  return e
}

async function getRows(admin:any,q=''){
  const {data:profiles,error:pErr}=await admin.from('profiles')
    .select('id,email,full_name,created_at,updated_at')
    .order('updated_at',{ascending:false})
    .limit(150)
  if(pErr) throw pErr

  const ids=(profiles||[]).map((x:any)=>x.id)
  const emails=(profiles||[]).map((x:any)=>String(x.email||'').toLowerCase()).filter(Boolean)

  const [faRes,subRes,grantRes,usersRes]=await Promise.all([
    ids.length?admin.from('feature_access').select('*').in('user_id',ids):Promise.resolve({data:[]}),
    ids.length?admin.from('subscriptions').select('user_id,provider,product_slug,status,started_at').eq('provider','cakto').in('user_id',ids):Promise.resolve({data:[]}),
    admin.from('access_grants').select('email,base_access,planner_access,club_access,gymrats_access,active,updated_at').limit(300),
    admin.auth.admin.listUsers({page:1,perPage:300})
  ])
  if(faRes.error) throw faRes.error
  if(subRes.error) throw subRes.error
  if(grantRes.error) throw grantRes.error

  const fmap=new Map((faRes.data||[]).map((x:any)=>[x.user_id,x]))
  const smap=new Map<string,any[]>()
  for(const s of subRes.data||[]){
    if(!smap.has(s.user_id)) smap.set(s.user_id,[])
    smap.get(s.user_id)!.push(s)
  }
  const gmap=new Map((grantRes.data||[]).map((g:any)=>[String(g.email||'').toLowerCase(),g]))
  const umap=new Map(((usersRes.data?.users)||[]).map((u:any)=>[String(u.email||'').toLowerCase(),u]))

  let rows=(profiles||[]).map((p:any)=>{
    const f=fmap.get(p.id)||{}
    const subs=smap.get(p.id)||[]
    const emailKey=String(p.email||'').toLowerCase()
    const g=gmap.get(emailKey)
    const au=umap.get(emailKey)
    const hasCakto=subs.some((s:any)=>['active','paid','approved'].includes(String(s.status||'').toLowerCase()))
    const hasManual=!!g
    return {
      id:p.id,
      email:p.email,
      full_name:p.full_name,
      created_at:p.created_at,
      updated_at:p.updated_at,
      base_access:!!f.base_access,
      planner_access:!!f.planner_access,
      club_access:!!f.club_access,
      gymrats_access:!!f.gymrats_access,
      access_active:!!(f.base_access||f.planner_access||f.club_access||f.gymrats_access),
      last_sign_in_at:au?.last_sign_in_at||null,
      password_set:au?.user_metadata?.vida_password_set===true,
      email_confirmed:!!au?.email_confirmed_at,
      origin:hasCakto&&hasManual?'Cakto + Manual':hasCakto?'Cakto':hasManual?'Manual':'Sistema'
    }
  })
  q=String(q||'').trim().toLowerCase()
  if(q) rows=rows.filter((r:any)=>String(r.email||'').toLowerCase().includes(q)||String(r.full_name||'').toLowerCase().includes(q))
  return rows.slice(0,100)
}

async function setAccess(admin:any,adminUser:any,body:any){
  const email=normEmail(body.email)
  const requested={
    base_access:!!body.base_access,
    planner_access:!!body.planner_access,
    club_access:!!body.club_access,
    gymrats_access:!!body.gymrats_access
  }
  if(requested.planner_access||requested.club_access||requested.gymrats_access) requested.base_access=true

  let {data:profile}=await admin.from('profiles').select('id,email,full_name').ilike('email',email).limit(1).maybeSingle()
  let userId=profile?.id||null

  if(!userId){
    const {data:created,error}=await admin.auth.admin.createUser({
      email,
      email_confirm:true,
      user_metadata:{full_name:email.split('@')[0]}
    })
    if(error){
      const {data:retry}=await admin.from('profiles').select('id,email,full_name').ilike('email',email).limit(1).maybeSingle()
      if(!retry?.id) throw error
      profile=retry
      userId=retry.id
    } else {
      userId=created.user.id
      await admin.from('profiles').upsert({
        id:userId,email,full_name:created.user.user_metadata?.full_name||email.split('@')[0],updated_at:new Date().toISOString()
      },{onConflict:'id'})
    }
  }

  const {error:faErr}=await admin.from('feature_access').upsert({
    user_id:userId,
    ...requested,
    updated_at:new Date().toISOString()
  },{onConflict:'user_id'})
  if(faErr) throw faErr

  const {data:existingEnrollment}=await admin.from('enrollments')
    .select('id,start_date,status').eq('user_id',userId).eq('program_slug','projeto-28').maybeSingle()

  if(requested.base_access){
    if(existingEnrollment?.id){
      const {error}=await admin.from('enrollments').update({
        status:'active',
        start_date:existingEnrollment.start_date||brasiliaDate()
      }).eq('id',existingEnrollment.id)
      if(error) throw error
    }else{
      const {error}=await admin.from('enrollments').insert({
        user_id:userId,program_slug:'projeto-28',start_date:brasiliaDate(),status:'active'
      })
      if(error) throw error
    }
  }else if(existingEnrollment?.id){
    const {error}=await admin.from('enrollments').update({status:'revoked'}).eq('id',existingEnrollment.id)
    if(error) throw error
  }

  const {data:grant}=await admin.from('access_grants').select('id').ilike('email',email).limit(1).maybeSingle()
  const grantPayload={
    email,role:'member',
    ...requested,
    auto_confirm:true,
    active:Object.values(requested).some(Boolean),
    updated_at:new Date().toISOString()
  }
  if(grant?.id){
    const {error}=await admin.from('access_grants').update(grantPayload).eq('id',grant.id)
    if(error) throw error
  }else{
    const {error}=await admin.from('access_grants').insert(grantPayload)
    if(error) throw error
  }

  await admin.from('admin_access_log').insert({
    admin_user_id:adminUser.id,
    target_user_id:userId,
    target_email:email,
    action:'set_access',
    access_state:requested
  })

  return {ok:true,user_id:userId,email,...requested}
}

async function deleteTestUser(admin:any,adminUser:any,body:any){
  const email=normEmail(body.email)
  if(email===String(adminUser.email||'').toLowerCase()) throw new Error('cannot_delete_self')

  const {data:profile}=await admin.from('profiles').select('id,email').ilike('email',email).limit(1).maybeSingle()
  if(!profile?.id) throw new Error('user_not_found')
  const userId=profile.id

  const {data:subs}=await admin.from('subscriptions').select('id,status,provider').eq('user_id',userId).eq('provider','cakto')
  if((subs||[]).length) throw new Error('cakto_user_delete_blocked')

  const userTables=['body_measurements','club_waitlist','content_progress','daily_checkins','enrollments','feature_access','material_responses','onboarding','planner_weeks']
  for(const table of userTables){
    const {error}=await admin.from(table).delete().eq('user_id',userId)
    if(error) throw error
  }
  await admin.from('access_grants').delete().ilike('email',email)
  await admin.from('profiles').delete().eq('id',userId)

  const {error:authErr}=await admin.auth.admin.deleteUser(userId)
  if(authErr) throw authErr

  await admin.from('admin_access_log').insert({
    admin_user_id:adminUser.id,
    target_user_id:userId,
    target_email:email,
    action:'delete_test_user',
    access_state:{deleted:true}
  })

  return {ok:true,email,deleted:true}
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors})
  if(req.method!=='POST') return new Response(JSON.stringify({ok:false,error:'method_not_allowed'}),{status:405,headers:cors})

  const adminUser=await requireAdmin(req)
  if(!adminUser) return new Response(JSON.stringify({ok:false,error:'forbidden'}),{status:403,headers:cors})

  let body:any={}
  try{body=await req.json()}catch{}
  const admin=adminClient()

  try{
    if(body.action==='list'){
      const rows=await getRows(admin,body.q||'')
      return new Response(JSON.stringify({ok:true,rows}),{status:200,headers:cors})
    }
    if(body.action==='set'){
      const out=await setAccess(admin,adminUser,body)
      return new Response(JSON.stringify(out),{status:200,headers:cors})
    }
    if(body.action==='delete'){
      const out=await deleteTestUser(admin,adminUser,body)
      return new Response(JSON.stringify(out),{status:200,headers:cors})
    }
    return new Response(JSON.stringify({ok:false,error:'invalid_action'}),{status:400,headers:cors})
  }catch(e){
    return new Response(JSON.stringify({ok:false,error:String(e?.message||'processing_failed')}),{status:400,headers:cors})
  }
})
function brasiliaDate(value=new Date()) {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value);
  const get=(type:string)=>parts.find(p=>p.type===type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

