(()=>{
  const V19={indexLoaded:false,weeksLoaded:{},pdfPromise:null,loginFailures:0,lockUntil:0};

  function applyBootstrap(data){
    const p=data?.profile||{}, f=data?.feature||{};
    S.role=user?.app_metadata?.vida_role||'member';
    S.profile={
      name:p.full_name||user?.user_metadata?.full_name||user?.email?.split('@')[0]||'Usuária',
      email:user?.email||p.email||'',
      birth_date:p.birth_date||null
    };
    S.feature=f;
    S.onboarding=data?.onboarding||null;
    S.enrollment=data?.enrollment||null;
    S.checkins=Array.isArray(data?.checkins)?data.checkins:[];
    S.measurements=Array.isArray(data?.measurements)?data.measurements:[];
    S.progress=Array.isArray(data?.progress)?data.progress:[];
    S.waitlist=!!data?.waitlist;
    S.config=data?.config&&typeof data.config==='object'?data.config:{};
  }

  async function loadIndex(){
    if(V19.indexLoaded)return true;
    const {data,error}=await sb.rpc('get_program_index');
    if(error)return false;
    (data||[]).forEach(x=>{
      const i=Number(x.week);
      weeks[i]={title:x.title,unlock:Number(x.unlock),color:x.color};
      if(!V19.weeksLoaded[i]){
        lessons[i]=Array.from({length:Number(x.lesson_count||0)},()=>null);
        materials[i]=Array.from({length:Number(x.material_count||0)},()=>null);
      }
    });
    V19.indexLoaded=true;
    return true;
  }

  window.hydrate=async function(){
    const {data,error}=await sb.rpc('get_app_bootstrap');
    if(error)throw error;
    applyBootstrap(data||{});
    if(base()&&!(await loadIndex()))throw new Error('program_index_failed');
  };

  window.ensureProgramWeekV19=async function(i){
    i=Number(i);
    if(V19.weeksLoaded[i])return true;
    loading(true,'Abrindo Semana '+i+'...');
    const {data,error}=await sb.rpc('get_program_week',{p_week:i});
    loading(false);
    if(error){
      const m=String(error.message||'');
      if(/week_locked/i.test(m))toast('Essa semana ainda não abriu');
      else if(/base_access_required|enrollment_required/i.test(m))toast('Acesso não liberado para esta semana');
      else toast('Não foi possível carregar o conteúdo agora');
      return false;
    }
    const p=data||{};
    if(p.meta)weeks[i]={...weeks[i],...p.meta};
    lessons[i]=Array.isArray(p.lessons)?p.lessons:[];
    guides[i]=p.guide||{};
    materials[i]=Array.isArray(p.materials)?p.materials:[];
    if(p.training)window.VIDA_TRAINING[i]=p.training;
    if(p.references&&typeof p.references==='object')Object.assign(window.VIDA_REFERENCES,p.references);
    V19.weeksLoaded[i]=true;
    return true;
  };

  const openWeekBase=window.openWeek;
  window.openWeek=async function(i){
    i=Number(i);
    if(!master()&&weeks[i]&&day()<Number(weeks[i].unlock))return toast('Essa semana ainda não abriu');
    if(!(await window.ensureProgramWeekV19(i)))return;
    return openWeekBase(i);
  };

  const openLessonBase=window.openLesson;
  window.openLesson=async function(i,j){
    if(!(await window.ensureProgramWeekV19(i)))return;
    return openLessonBase(i,j);
  };
  const openGuideBase=window.openGuide;
  window.openGuide=async function(i){
    if(!(await window.ensureProgramWeekV19(i)))return;
    return openGuideBase(i);
  };
  const openMaterialBase=window.openMaterial;
  window.openMaterial=async function(i,j){
    if(!(await window.ensureProgramWeekV19(i)))return;
    return openMaterialBase(i,j);
  };

  function loadJsPdf(){
    if(window.jspdf)return Promise.resolve();
    if(V19.pdfPromise)return V19.pdfPromise;
    V19.pdfPromise=new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
      s.async=true;
      s.onload=()=>resolve();
      s.onerror=()=>reject(new Error('pdf_load_failed'));
      document.head.appendChild(s);
    });
    return V19.pdfPromise;
  }
  const downloadGuideBase=window.downloadGuide;
  window.downloadGuide=async function(i){
    if(!(await window.ensureProgramWeekV19(i)))return;
    try{await loadJsPdf()}catch{return toast('Não foi possível preparar o PDF agora')};
    return downloadGuideBase(i);
  };

  function authMessage(kind){
    if(kind==='login')return 'E-mail ou senha inválidos.';
    return 'Não foi possível concluir agora. Tente novamente em instantes.';
  }
  function remainingLock(){
    return Math.max(0,Math.ceil((V19.lockUntil-Date.now())/1000));
  }
  window.login=async function(){
    setAuth('');
    const wait=remainingLock();
    if(wait>0)return setAuth('Muitas tentativas. Aguarde '+wait+'s e tente novamente.');
    const email=$('#loginEmail')?.value.trim(),password=$('#loginPass')?.value||'';
    if(!email||!password)return setAuth('Preencha e-mail e senha.');
    loading(true,'Entrando...');
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    loading(false);
    if(error){
      V19.loginFailures++;
      if(V19.loginFailures>=5){V19.lockUntil=Date.now()+60000;V19.loginFailures=0}
      return setAuth(authMessage('login'));
    }
    V19.loginFailures=0;
    user=data.user;
    try{await route()}catch{setAuth(authMessage('generic'))}
  };

  window.forgotPassword=async function(){
    const email=$('#loginEmail')?.value.trim();
    if(!email)return setAuth('Digite seu e-mail primeiro.');
    loading(true,'Enviando acesso...');
    await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/?recovery=1'});
    loading(false);
    setAuth('Se esse e-mail estiver cadastrado, você receberá um link para criar ou redefinir sua senha.');
  };

  window.updatePassword=async function(){
    const p=$('#newPass')?.value||'';
    if(p.length<8)return setAuth('Use pelo menos 8 caracteres.');
    loading(true,'Atualizando...');
    const {error}=await sb.auth.updateUser({password:p});
    loading(false);
    if(error)return setAuth(authMessage('generic'));
    history.replaceState({},'',location.origin);
    const {data}=await sb.auth.getUser();
    user=data.user;
    try{await route()}catch{setAuth(authMessage('generic'))}
  };

  window.upCheck=async function(p){
    const date=iso(),row={user_id:user.id,checkin_date:date,...p};
    const {error}=await sb.from('daily_checkins').upsert(row,{onConflict:'user_id,checkin_date'});
    if(error)return toast('Não foi possível salvar');
    const idx=S.checkins.findIndex(x=>x.checkin_date===date);
    if(idx>=0)S.checkins[idx]={...S.checkins[idx],...p};
    else S.checkins.unshift({...row});
    go('track');
  };

  window.completeLesson=async function(i,j){
    loading(true,'Salvando progresso...');
    const {data,error}=await sb.rpc('complete_program_lesson',{p_week:Number(i),p_lesson:Number(j)});
    loading(false);
    if(error)return toast('Não foi possível salvar');
    const row=data||{content_slug:'lesson-'+i+'-'+j,status:'completed',completed_at:new Date().toISOString()};
    const ix=S.progress.findIndex(x=>x.content_slug===row.content_slug);
    if(ix>=0)S.progress[ix]={...S.progress[ix],...row};else S.progress.push(row);
    await window.openWeek(i);
    toast('Conteúdo concluído');
  };

  window.saveMeasurements=async function(){
    const row={
      user_id:user.id,measured_on:iso(),
      weight_kg:n($('#mw')?.value),waist_cm:n($('#mc')?.value),abdomen_cm:n($('#ma')?.value),
      hip_cm:n($('#mh')?.value),arm_cm:n($('#mb')?.value),thigh_cm:n($('#mt')?.value)
    };
    loading(true,'Salvando medidas...');
    const {data,error}=await sb.from('body_measurements').insert(row).select('*').single();
    loading(false);
    if(error)return toast('Não foi possível salvar');
    S.measurements.unshift(data||row);
    closeModal(true);
    go('track');
  };

  window.__VIDA_SECURITY_VERSION='19.0.0';
})();