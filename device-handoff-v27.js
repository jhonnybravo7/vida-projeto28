(()=>{
  const APP_URL='https://vida-projeto28.vercel.app';
  const PAIR_KEY='vida_device_pair_v1';
  let pollTimer=null;

  const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)')?.matches||window.navigator.standalone===true;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const b64url=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');

  function newPair(){
    const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
    return {device_id:crypto.randomUUID(),secret:b64url(bytes),created_at:Date.now()};
  }
  function getPair(){
    try{return JSON.parse(localStorage.getItem(PAIR_KEY)||'null')}catch{return null}
  }
  function savePair(p){localStorage.setItem(PAIR_KEY,JSON.stringify(p))}
  function clearPair(){localStorage.removeItem(PAIR_KEY);if(pollTimer){clearInterval(pollTimer);pollTimer=null}}

  async function callPair(body){
    const {data,error}=await sb.functions.invoke('device-pair',{body});
    if(error)throw error;
    return data||{};
  }

  async function redeemPair(){
    const p=getPair();
    if(!p)return false;
    if(Date.now()-Number(p.created_at||0)>12*60*1000){clearPair();return false}
    try{
      const out=await callPair({action:'redeem',device_id:p.device_id,secret:p.secret});
      if(out.status!=='ready'||!out.token_hash)return false;
      const {data,error}=await sb.auth.verifyOtp({token_hash:out.token_hash,type:'magiclink'});
      if(error||!data?.session)return false;
      try{await callPair({action:'complete',device_id:p.device_id,secret:p.secret})}catch{}
      clearPair();
      user=data.user;
      await route();
      toast('Acesso confirmado neste aparelho ✓');
      return true;
    }catch{return false}
  }

  function startPolling(){
    if(pollTimer)return;
    redeemPair();
    pollTimer=setInterval(()=>redeemPair(),2500);
    setTimeout(()=>{if(pollTimer){clearInterval(pollTimer);pollTimer=null}},10*60*1000);
  }

  async function approveFromEmail(deviceId){
    for(let i=0;i<20;i++){
      const {data}=await sb.auth.getSession();
      if(data?.session?.user){
        user=data.session.user;
        try{
          const out=await callPair({action:'approve',device_id:deviceId});
          if(out?.ok){
            if(isStandalone()){
              history.replaceState({},'',APP_URL);
              await route();
              toast('Acesso confirmado ✓');
            }else{
              document.querySelector('#login')?.classList.remove('hidden');
              document.querySelector('#root')?.classList.add('hidden');
              const box=document.querySelector('.loginbox');
              if(box)box.innerHTML=`<span class="badge">ACESSO CONFIRMADO</span><h1>Pronto.</h1><p>Seu acesso foi confirmado neste e-mail.</p><div class="notice">Agora volte ao <b>Vida Nova</b> pela tela inicial do iPhone. Ele vai entrar automaticamente.</div><button class="btn full" onclick="location.href='${APP_URL}'">ABRIR NO NAVEGADOR</button>`;
            }
            return true;
          }
        }catch{}
        return false;
      }
      await sleep(250);
    }
    return false;
  }

  window.forgotPassword=async function(){
    const email=String(document.querySelector('#loginEmail')?.value||'').trim().toLowerCase();
    if(!email)return setAuth('Digite seu e-mail primeiro.');

    loading(true,'Enviando acesso...');
    try{
      if(isStandalone()){
        const pair=newPair();
        await callPair({action:'start',device_id:pair.device_id,secret:pair.secret,email});
        savePair(pair);
        const {error}=await sb.auth.signInWithOtp({
          email,
          options:{shouldCreateUser:false,emailRedirectTo:APP_URL+'/?device_pair='+encodeURIComponent(pair.device_id)}
        });
        if(error)throw error;
        loading(false);
        setAuth('Abra o e-mail e toque em “Sign in”. Depois volte para o Vida Nova — este aparelho entra automaticamente.');
        startPolling();
        return;
      }

      const {error}=await sb.auth.signInWithOtp({
        email,
        options:{shouldCreateUser:false,emailRedirectTo:APP_URL}
      });
      if(error)throw error;
      loading(false);
      setAuth('Enviamos um link de acesso. Abra o e-mail e toque em “Sign in”.');
    }catch(e){
      loading(false);
      const m=String(e?.message||'').toLowerCase();
      if(m.includes('rate')||m.includes('security purposes'))return setAuth('Aguarde alguns segundos e tente novamente.');
      setAuth('Não foi possível enviar o acesso agora. Tente novamente.');
    }
  };

  const previousStart=window.startVidaApp;
  window.startVidaApp=async function(){
    const pairId=new URLSearchParams(location.search).get('device_pair');
    if(pairId){
      const ok=await approveFromEmail(pairId);
      if(ok)return;
    }

    const {data}=await sb.auth.getSession();
    if(data?.session?.user){
      user=data.session.user;
      return route();
    }

    if(isStandalone()&&getPair()){
      loading(false);
      document.querySelector('#login')?.classList.remove('hidden');
      document.querySelector('#root')?.classList.add('hidden');
      setAuth('Aguardando a confirmação do e-mail…');
      startPolling();
      return;
    }

    return previousStart?.();
  };

  window.__VIDA_DEVICE_HANDOFF='27.0.0';
})();